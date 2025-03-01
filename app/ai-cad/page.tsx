"use client"

import { useState, useRef, useEffect, useMemo } from "react"
import * as THREE from "three"
import { Canvas, useFrame, useThree } from "@react-three/fiber"
import { OrbitControls, Center, Environment, PerspectiveCamera } from "@react-three/drei"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Slider } from "@/components/ui/slider"
import { Label } from "@/components/ui/label"
import { Loader2, Download } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { STLExporter } from 'three/addons/exporters/STLExporter.js'
import * as BufferGeometryUtils from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import { CSG } from 'three-csg-ts'

interface ModelSpec {
  geometryType?: string
  parameters?: Record<string, number | string | boolean>
  material?: {
    type: string
    color: string
    metalness?: number
    roughness?: number
    emissive?: string
    transparent?: boolean
    opacity?: number
  }
  position?: [number, number, number]
  rotation?: [number, number, number]
  parts?: Array<{
    geometryType: string
    parameters: Record<string, number | string | boolean>
    material: {
      type: string
      color: string
      metalness?: number
      roughness?: number
      emissive?: string
      transparent?: boolean
      opacity?: number
    }
    position: [number, number, number]
    rotation: [number, number, number]
    operation?: string
    targetPart?: number
  }>
  customizationOptions?: {
    parameters?: Record<string, {
      type: string
      min?: number
      max?: number
      step?: number
      options?: string[]
    }>
    materials?: {
      types: string[]
      colors: string[]
    }
  }
  description: string
  _generationMethod?: string
}

const materialMap: Record<string, any> = {
  'standard': THREE.MeshStandardMaterial,
  'basic': THREE.MeshBasicMaterial,
  'phong': THREE.MeshPhongMaterial,
  'physical': THREE.MeshPhysicalMaterial,
  'lambert': THREE.MeshLambertMaterial,
  'toon': THREE.MeshToonMaterial,
}

const geometryMap: Record<string, any> = {
  'box': THREE.BoxGeometry,
  'sphere': THREE.SphereGeometry,
  'cylinder': THREE.CylinderGeometry,
  'cone': THREE.ConeGeometry,
  'torus': THREE.TorusGeometry,
  'torusKnot': THREE.TorusKnotGeometry,
  'ring': THREE.RingGeometry,
  'plane': THREE.PlaneGeometry,
  'circle': THREE.CircleGeometry,
  'dodecahedron': THREE.DodecahedronGeometry,
  'icosahedron': THREE.IcosahedronGeometry,
  'octahedron': THREE.OctahedronGeometry,
  'tetrahedron': THREE.TetrahedronGeometry,
  'capsule': THREE.CapsuleGeometry
}

function DynamicModel({ modelSpec, meshRef }: { modelSpec: ModelSpec, meshRef: React.RefObject<THREE.Group | null> }) {
  const { scene } = useThree();
  
  // Group to hold all parts of the model
  const groupRef = useRef<THREE.Group>(null);
  
  useEffect(() => {
    // Forward the group ref to the parent's meshRef
    if (groupRef.current && meshRef && meshRef.current !== groupRef.current) {
      // Use object reference assignment instead of direct property assignment
      Object.assign(meshRef, { current: groupRef.current });
    }
  }, [groupRef, meshRef]);
  
  // Calculate bounding box for the entire model to center it properly
  useEffect(() => {
    if (groupRef.current) {
      const box = new THREE.Box3().setFromObject(groupRef.current);
      const center = new THREE.Vector3();
      box.getCenter(center);
      
      // Center the model
      groupRef.current.position.sub(center);
      
      // Calculate appropriate scale based on bounding box
      const size = new THREE.Vector3();
      box.getSize(size);
      const maxDim = Math.max(size.x, size.y, size.z);
      if (maxDim > 10) {
        const scale = 10 / maxDim;
        groupRef.current.scale.set(scale, scale, scale);
      }
    }
  }, [modelSpec]);
  
  // Map geometries
  const geometryMap: Record<string, any> = {
    "box": THREE.BoxGeometry,
    "sphere": THREE.SphereGeometry,
    "cylinder": THREE.CylinderGeometry,
    "cone": THREE.ConeGeometry,
    "torus": THREE.TorusGeometry,
    "torusKnot": THREE.TorusKnotGeometry,
    "ring": THREE.RingGeometry,
    "plane": THREE.PlaneGeometry,
    "circle": THREE.CircleGeometry,
    "dodecahedron": THREE.DodecahedronGeometry,
    "icosahedron": THREE.IcosahedronGeometry,
    "octahedron": THREE.OctahedronGeometry,
    "tetrahedron": THREE.TetrahedronGeometry,
    "capsule": THREE.CapsuleGeometry
  };
  
  // Map materials
  const materialMap: Record<string, any> = {
    "standard": THREE.MeshStandardMaterial,
    "physical": THREE.MeshPhysicalMaterial,
    "basic": THREE.MeshBasicMaterial
  };
  
  // Helper function to create geometry with appropriate parameters
  function createGeometry(GeometryClass: any, parameters: Record<string, any>) {
    // Box (width, height, depth)
    if (GeometryClass === THREE.BoxGeometry) {
      return new GeometryClass(
        parameters.width || 1,
        parameters.height || 1,
        parameters.depth || 1,
        parameters.widthSegments || 1,
        parameters.heightSegments || 1,
        parameters.depthSegments || 1
      );
    }
    
    // Sphere (radius, widthSegments, heightSegments)
    if (GeometryClass === THREE.SphereGeometry) {
      return new GeometryClass(
        parameters.radius || 1,
        parameters.widthSegments || 32,
        parameters.heightSegments || 16,
        parameters.phiStart || 0,
        parameters.phiLength || Math.PI * 2,
        parameters.thetaStart || 0,
        parameters.thetaLength || Math.PI
      );
    }
    
    // Cylinder (radiusTop, radiusBottom, height, radialSegments)
    if (GeometryClass === THREE.CylinderGeometry) {
      return new GeometryClass(
        parameters.radiusTop || 1,
        parameters.radiusBottom || 1,
        parameters.height || 1,
        parameters.radialSegments || 32,
        parameters.heightSegments || 1,
        parameters.openEnded || false
      );
    }
    
    // Cone (radius, height, radialSegments)
    if (GeometryClass === THREE.ConeGeometry) {
      return new GeometryClass(
        parameters.radius || 1,
        parameters.height || 1,
        parameters.radialSegments || 32,
        parameters.heightSegments || 1,
        parameters.openEnded || false
      );
    }
    
    // Torus (radius, tube, radialSegments, tubularSegments)
    if (GeometryClass === THREE.TorusGeometry) {
      return new GeometryClass(
        parameters.radius || 1,
        parameters.tube || 0.4,
        parameters.radialSegments || 16,
        parameters.tubularSegments || 100,
        parameters.arc || Math.PI * 2
      );
    }
    
    // TorusKnot (radius, tube, tubularSegments, radialSegments, p, q)
    if (GeometryClass === THREE.TorusKnotGeometry) {
      return new GeometryClass(
        parameters.radius || 1,
        parameters.tube || 0.4,
        parameters.tubularSegments || 64,
        parameters.radialSegments || 8,
        parameters.p || 2,
        parameters.q || 3
      );
    }
    
    // Ring (innerRadius, outerRadius, thetaSegments)
    if (GeometryClass === THREE.RingGeometry) {
      return new GeometryClass(
        parameters.innerRadius || 0.5,
        parameters.outerRadius || 1,
        parameters.thetaSegments || 32,
        parameters.phiSegments || 1,
        parameters.thetaStart || 0,
        parameters.thetaLength || Math.PI * 2
      );
    }
    
    // Plane (width, height, widthSegments, heightSegments)
    if (GeometryClass === THREE.PlaneGeometry) {
      return new GeometryClass(
        parameters.width || 1,
        parameters.height || 1,
        parameters.widthSegments || 1,
        parameters.heightSegments || 1
      );
    }
    
    // Circle (radius, segments)
    if (GeometryClass === THREE.CircleGeometry) {
      return new GeometryClass(
        parameters.radius || 1,
        parameters.segments || 32,
        parameters.thetaStart || 0,
        parameters.thetaLength || Math.PI * 2
      );
    }
    
    // Polyhedron geometries (radius, detail)
    if (GeometryClass === THREE.DodecahedronGeometry ||
        GeometryClass === THREE.IcosahedronGeometry ||
        GeometryClass === THREE.OctahedronGeometry ||
        GeometryClass === THREE.TetrahedronGeometry) {
      return new GeometryClass(
        parameters.radius || 1,
        parameters.detail || 0
      );
    }
    
    // Capsule (radius, length, capSegments, radialSegments)
    if (GeometryClass === THREE.CapsuleGeometry) {
      return new GeometryClass(
        parameters.radius || 1,
        parameters.length || 1,
        parameters.capSegments || 4,
        parameters.radialSegments || 8
      );
    }
    
    // Default case
    return new GeometryClass();
  }
  
  // Helper function to create material with appropriate parameters
  function createMaterial(MaterialClass: any, parameters: Record<string, any>) {
    return new MaterialClass({
      color: parameters.color || '#ffffff',
      metalness: parameters.metalness !== undefined ? parameters.metalness : 0.5,
      roughness: parameters.roughness !== undefined ? parameters.roughness : 0.5,
      wireframe: parameters.wireframe || false
    });
  }
  
  // Create meshes for each part with CSG operations
  const meshes = useMemo(() => {
    const result: Array<THREE.Mesh | null> = [];
    
    if (!modelSpec.parts) return result.filter((mesh): mesh is THREE.Mesh => mesh !== null);
    
    // First pass: create all base meshes
    modelSpec.parts.forEach((part, index) => {
      const GeometryClass = geometryMap[part.geometryType.toLowerCase()];
      const MaterialClass = materialMap[part.material.type.toLowerCase()] || THREE.MeshStandardMaterial;
      
      if (!GeometryClass) {
        console.error(`Unknown geometry type: ${part.geometryType}`);
        return;
      }
      
      const geometry = createGeometry(GeometryClass, part.parameters);
      const material = createMaterial(MaterialClass, part.material);
      
      const mesh = new THREE.Mesh(geometry, material);
      
      // Apply position and rotation
      const [px, py, pz] = part.position;
      const [rx, ry, rz] = part.rotation.map(deg => (deg * Math.PI) / 180);
      
      mesh.position.set(px, py, pz);
      mesh.rotation.set(rx, ry, rz);
      
      // Store the mesh
      result[index] = mesh;
    });
    
    // Second pass: perform CSG operations
    modelSpec.parts.forEach((part, index) => {
      if (part.operation && part.targetPart !== undefined) {
        const targetMesh = result[part.targetPart];
        const currentMesh = result[index];
        
        if (!targetMesh || !currentMesh) return;
        
        try {
          // Create CSG objects
          const targetCSG = CSG.fromMesh(targetMesh);
          const currentCSG = CSG.fromMesh(currentMesh);
          
          let resultCSG;
          
          // Perform the requested operation
          switch (part.operation.toLowerCase()) {
            case 'union':
              resultCSG = targetCSG.union(currentCSG);
              break;
            case 'subtract':
              resultCSG = targetCSG.subtract(currentCSG);
              break;
            case 'intersect':
              resultCSG = targetCSG.intersect(currentCSG);
              break;
            default:
              return;
          }
          
          // Convert the result back to a mesh
          const resultMesh = CSG.toMesh(
            resultCSG,
            targetMesh.matrix,
            targetMesh.material
          );
          
          // Replace the target mesh with the result
          result[part.targetPart] = resultMesh;
          
          // Remove the current mesh as it has been incorporated into the result
          result[index] = null;
        } catch (error) {
          console.error('CSG operation failed:', error);
        }
      }
    });
    
    // Filter out null meshes and ensure type safety
    return result.filter((mesh): mesh is THREE.Mesh => mesh !== null);
  }, [modelSpec.parts]);
  
  // Auto-rotate the model for visual appeal
  useFrame(() => {
    if (groupRef.current) {
      groupRef.current.rotation.y += 0.005;
    }
  });
  
  // Render all meshes
  return (
    <group ref={groupRef}>
      {meshes.map((mesh, index) => (
        <primitive key={index} object={mesh} />
      ))}
    </group>
  );
}

function isUsingApiGeneration(modelSpec: ModelSpec | null): boolean {
  if (!modelSpec) return false;
  return modelSpec._generationMethod === 'claude_api';
}

export default function AICadPage() {
  const [prompt, setPrompt] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [modelSpec, setModelSpec] = useState<ModelSpec | null>(null);
  const [currentParams, setCurrentParams] = useState<Record<string, number | string | boolean>>({});
  const [currentMaterial, setCurrentMaterial] = useState<{
    type: string;
    color: string;
    metalness: number;
    roughness: number;
    transparent: boolean;
    opacity: number;
  }>({
    type: 'standard',
    color: '#ffffff',
    metalness: 0,
    roughness: 0.5,
    transparent: false,
    opacity: 1
  });
  const [generationMethod, setGenerationMethod] = useState<string | null>(null);
  const [refinementPrompt, setRefinementPrompt] = useState("");
  const modelRef = useRef<THREE.Group | null>(null);

  // Initialize params and material based on the model spec
  useEffect(() => {
    if (modelSpec) {
      // Initialize parameters from customizationOptions
      const initialParams: Record<string, any> = {};
      
      // First, add any parameters defined in modelSpec.parameters
      if (modelSpec.parameters) {
        Object.keys(modelSpec.parameters).forEach(key => {
          initialParams[key] = modelSpec.parameters![key];
        });
      }
      
      // Then, add any parameters defined in customizationOptions with default values
      if (modelSpec.customizationOptions?.parameters) {
        Object.entries(modelSpec.customizationOptions.parameters).forEach(([key, options]) => {
          if (!initialParams[key]) {
            if (options.type === 'slider') {
              initialParams[key] = ((options.min || 0) + (options.max || 1)) / 2; // default to middle value
            } else if (options.type === 'select' && options.options && options.options.length > 0) {
              initialParams[key] = options.options[0]; // default to first option
            } else if (options.type === 'boolean') {
              initialParams[key] = false; // default to false
            }
          }
        });
      }
      
      setCurrentParams(initialParams);
      
      // Initialize material
      setCurrentMaterial({
        type: modelSpec.material?.type || "standard",
        color: modelSpec.material?.color || "#ffffff",
        metalness: modelSpec.material?.metalness || 0,
        roughness: modelSpec.material?.roughness || 0.5,
        transparent: modelSpec.material?.transparent || false,
        opacity: modelSpec.material?.opacity || 1
      });
    }
  }, [modelSpec]);

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!prompt) {
      setError('Please enter an object description');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/generate-model', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt })
      });
      
      if (!response.ok) {
        throw new Error(`Server responded with ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }
      
      setModelSpec(data);
      if (data._generationMethod) {
        setGenerationMethod(data._generationMethod);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate model');
    } finally {
      setLoading(false);
    }
  };

  const handleRefinement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!modelSpec || !refinementPrompt.trim()) return;
    
    setLoading(true);
    setError("");
    
    try {
      const response = await fetch("/api/generate-model", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          prompt: refinementPrompt,
          baseModel: modelSpec // Send the current model as context for refinement
        }),
      });
      
      if (!response.ok) {
        throw new Error("Failed to refine model");
      }
      
      const data = await response.json();
      setModelSpec(data);
      setGenerationMethod(data._generationMethod || null);
      
    } catch (err) {
      setError("Error refining model. Please try again.");
      console.error(err);
    }
    
    setLoading(false);
  };

  const handleExportSTL = () => {
    if (!modelRef.current) {
      alert("No model to export!");
      return;
    }
    
    try {
      setLoading(true);
      
      // Clone the model to avoid modifying the original
      const clone = modelRef.current.clone();
      
      // Apply transformations to the clone
      clone.updateMatrixWorld(true);
      
      // Create an STL exporter
      const exporter = new STLExporter();
      
      // Export the model as STL (using binary format for smaller file size)
      const stlData = exporter.parse(clone, { binary: true });
      
      // Create a blob from the STL data
      const blob = new Blob([stlData], { type: 'application/octet-stream' });
      
      // Create a download link
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `model-${Date.now()}.stl`;
      link.click();
      
      // Clean up
      URL.revokeObjectURL(link.href);
      
      setLoading(false);
    } catch (error) {
      console.error('Error exporting STL:', error);
      alert('Failed to export STL file. See console for details.');
      setLoading(false);
    }
  };

  // Update parameter handler
  const handleParameterChange = (paramName: string, value: number | string | boolean) => {
    setCurrentParams(prev => ({
      ...prev,
      [paramName]: value
    }));
  };

  // Update material handler
  const handleMaterialChange = (property: string, value: string | number | boolean) => {
    setCurrentMaterial(prev => ({
      ...prev,
      [property]: value
    }));
  };

  // Create updated model spec
  const updatedModelSpec = useMemo(() => {
    if (!modelSpec) return null;
    
    return {
      ...modelSpec,
      parameters: currentParams,
      material: {
        ...modelSpec.material,
        type: currentMaterial.type,
        color: currentMaterial.color,
        metalness: currentMaterial.metalness,
        roughness: currentMaterial.roughness,
        transparent: currentMaterial.transparent,
        opacity: currentMaterial.opacity
      }
    };
  }, [modelSpec, currentParams, currentMaterial]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-900 via-black to-zinc-900 text-white font-sans antialiased">
      <div className="container mx-auto min-h-screen flex flex-col gap-8 p-6">
        <header className="flex flex-col gap-4 pt-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Image
                src="/taiyaki-logo.svg"
                alt="Taiyaki Logo"
                width={80}
                height={80}
                className="text-white"
              />
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl font-bold tracking-tight">AI CAD Generator</h1>
                  <span className="text-zinc-400 text-sm">
                    Built by{" "}
                    <a
                      href="https://taiyaki.ai"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-400 hover:text-blue-300 transition-colors"
                    >
                      taiyaki.ai
                    </a>
                  </span>
                </div>
                <p className="text-zinc-400 text-sm mt-1">Generate and customize 3D models using AI</p>
                <div className="mt-2 flex items-center gap-4">
                  <Link href="/" className="text-blue-400 hover:text-blue-300 transition-colors text-sm">Home</Link>
                  <Link href="/ai-cad" className="text-blue-400 hover:text-blue-300 transition-colors text-sm">AI CAD Generator</Link>
                </div>
              </div>
            </div>
          </div>
        </header>

        <div className="flex-1 grid lg:grid-cols-[1fr_320px] gap-8">
          {/* 3D Viewer */}
          <div className="relative rounded-2xl overflow-hidden bg-zinc-800/50 backdrop-blur-sm border border-white/10 h-[50vh] lg:h-[600px]">
            <div className="absolute inset-0">
              <Canvas camera={{ position: [3, 3, 3], fov: 50 }} className="w-full h-full">
                <color attach="background" args={['#1a1a1a']} />
                <ambientLight intensity={0.5} />
                <pointLight position={[10, 10, 10]} intensity={1} />
                <OrbitControls enableDamping dampingFactor={0.1} />
                <Environment preset="city" />
                {updatedModelSpec && <DynamicModel modelSpec={updatedModelSpec} meshRef={modelRef} />}
                {!updatedModelSpec && (
                  <mesh>
                    <boxGeometry args={[0.5, 0.5, 0.5]} />
                    <meshStandardMaterial color="#444" transparent opacity={0.5} />
                  </mesh>
                )}
              </Canvas>
            </div>
            {loading && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                <div className="flex flex-col items-center gap-4">
                  <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                  <p className="text-white">Generating 3D model...</p>
                </div>
              </div>
            )}
            
            {/* Add STL Download Button */}
            {updatedModelSpec && (
              <div className="absolute bottom-4 right-4">
                <Button 
                  onClick={handleExportSTL}
                  className="bg-blue-600 hover:bg-blue-700 flex items-center gap-2"
                >
                  <Download size={16} />
                  Download STL
                </Button>
              </div>
            )}
          </div>

          {/* Controls */}
          <div className="flex flex-col gap-6">
            <form onSubmit={handleSubmit} className="bg-zinc-800/50 backdrop-blur-sm rounded-xl p-4 border border-white/10">
              <h2 className="text-lg font-semibold mb-4">Generate 3D Model</h2>
              <div className="flex flex-col gap-4">
                <div>
                  <label htmlFor="prompt" className="block text-sm font-medium text-zinc-300 mb-1">
                    Object Description
                  </label>
                  <textarea
                    id="prompt"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="E.g., A coffee mug with handle"
                    rows={4}
                    className="w-full px-3 py-2 bg-zinc-900/90 border border-zinc-700 rounded-md text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <Button 
                  type="submit" 
                  disabled={loading || !prompt.trim()} 
                  className="w-full"
                >
                  {loading ? "Generating..." : "Generate 3D Model"}
                </Button>
                {error && <p className="text-red-500 text-sm">{error}</p>}
              </div>
            </form>

            {/* Add the refinement form */}
            {modelSpec && (
              <form onSubmit={handleRefinement} className="bg-zinc-800/50 backdrop-blur-sm rounded-xl p-4 border border-white/10">
                <h2 className="text-lg font-semibold mb-4">Refine Model</h2>
                <div className="flex flex-col gap-4">
                  <div>
                    <label htmlFor="refinementPrompt" className="block text-sm font-medium text-zinc-300 mb-1">
                      Refinement Instructions
                    </label>
                    <textarea
                      id="refinementPrompt"
                      value={refinementPrompt}
                      onChange={(e) => setRefinementPrompt(e.target.value)}
                      placeholder="E.g., Make it taller, add a lid, change the color to blue"
                      rows={3}
                      className="w-full px-3 py-2 bg-zinc-900/90 border border-zinc-700 rounded-md text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <Button 
                    type="submit" 
                    disabled={loading || !refinementPrompt.trim()} 
                    className="w-full"
                  >
                    {loading ? "Refining..." : "Refine Model"}
                  </Button>
                </div>
              </form>
            )}

            {modelSpec && (
              <div className="mt-4 p-3 rounded-md text-sm" 
                   style={{ backgroundColor: isUsingApiGeneration(modelSpec) ? '#f0fff4' : '#fffaf0' }}>
                <p className="font-medium mb-1">
                  {isUsingApiGeneration(modelSpec) 
                    ? '✓ Generated using Claude API' 
                    : '⚠️ Using sample generator'}
                </p>
                <p className="text-xs text-gray-600">
                  {isUsingApiGeneration(modelSpec)
                    ? 'This model was created by Claude AI based on your description'
                    : 'Set up your Claude API key in .env.local to enable AI-generated models'}
                </p>
                {generationMethod && generationMethod !== 'claude_api' && generationMethod !== 'sample_generator' && (
                  <p className="text-xs text-red-600 mt-1">
                    Method: {generationMethod}
                  </p>
                )}
              </div>
            )}

            {modelSpec && (
              <div className="bg-zinc-800/50 backdrop-blur-sm rounded-xl p-4 border border-white/10 overflow-y-auto max-h-[350px]">
                <h2 className="text-lg font-semibold mb-4">Customize Model</h2>
                
                <div className="space-y-4">
                  <div>
                    <h3 className="text-md font-medium mb-2">Parameters</h3>
                    <div className="space-y-2">
                      {Object.entries(modelSpec.customizationOptions?.parameters || {}).map(([param, options]) => {
                        if (options.type === 'slider') {
                          return (
                            <div key={param} className="space-y-1">
                              <div className="flex justify-between">
                                <label className="text-sm text-zinc-300">{param}</label>
                                <span className="text-sm text-zinc-400">{currentParams[param]}</span>
                              </div>
                              <input
                                type="range"
                                min={options.min || 0}
                                max={options.max || 10}
                                step={options.step || 0.1}
                                value={Number(currentParams[param])}
                                onChange={(e) => handleParameterChange(param, parseFloat(e.target.value))}
                                className="w-full bg-zinc-700 rounded-lg appearance-none cursor-pointer"
                              />
                            </div>
                          );
                        } else if (options.type === 'select' && options.options) {
                          return (
                            <div key={param} className="space-y-1">
                              <label className="text-sm text-zinc-300">{param}</label>
                              <select
                                value={String(currentParams[param])}
                                onChange={(e) => handleParameterChange(param, e.target.value)}
                                className="w-full px-3 py-2 bg-zinc-900/90 border border-zinc-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                              >
                                {options.options.map((opt: string) => (
                                  <option key={opt} value={opt}>{opt}</option>
                                ))}
                              </select>
                            </div>
                          );
                        } else if (options.type === 'boolean') {
                          return (
                            <div key={param} className="flex items-center space-x-2">
                              <input
                                type="checkbox"
                                id={param}
                                checked={Boolean(currentParams[param])}
                                onChange={(e) => handleParameterChange(param, e.target.checked)}
                                className="w-4 h-4 bg-zinc-900 border-zinc-700 rounded focus:ring-blue-500"
                              />
                              <label htmlFor={param} className="text-sm text-zinc-300">{param}</label>
                            </div>
                          );
                        }
                        return null;
                      })}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-md font-medium mb-2">Material</h3>
                    <div className="space-y-2">
                      <div className="space-y-1">
                        <label className="text-sm text-zinc-300">Type</label>
                        <select
                          value={currentMaterial.type}
                          onChange={(e) => handleMaterialChange('type', e.target.value)}
                          className="w-full px-3 py-2 bg-zinc-900/90 border border-zinc-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          {modelSpec.customizationOptions?.materials?.types.map((type: string) => (
                            <option key={type} value={type}>{type}</option>
                          ))}
                        </select>
                      </div>
                      
                      <div className="space-y-1">
                        <label className="text-sm text-zinc-300">Color</label>
                        <div className="flex gap-2">
                          <input
                            type="color"
                            value={currentMaterial.color}
                            onChange={(e) => handleMaterialChange('color', e.target.value)}
                            className="w-10 h-10 p-1 bg-zinc-900 border border-zinc-700 rounded"
                          />
                          <select
                            value={currentMaterial.color}
                            onChange={(e) => handleMaterialChange('color', e.target.value)}
                            className="flex-1 px-3 py-2 bg-zinc-900/90 border border-zinc-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            {modelSpec.customizationOptions?.materials?.colors.map((color: string) => (
                              <option key={color} value={color}>{color}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                      
                      {(currentMaterial.type === 'standard' || currentMaterial.type === 'physical') && (
                        <>
                          <div className="space-y-1">
                            <div className="flex justify-between">
                              <label className="text-sm text-zinc-300">Metalness</label>
                              <span className="text-sm text-zinc-400">{currentMaterial.metalness}</span>
                            </div>
                            <input
                              type="range"
                              min="0"
                              max="1"
                              step="0.01"
                              value={currentMaterial.metalness}
                              onChange={(e) => handleMaterialChange('metalness', parseFloat(e.target.value))}
                              className="w-full bg-zinc-700 rounded-lg appearance-none cursor-pointer"
                            />
                          </div>
                          
                          <div className="space-y-1">
                            <div className="flex justify-between">
                              <label className="text-sm text-zinc-300">Roughness</label>
                              <span className="text-sm text-zinc-400">{currentMaterial.roughness}</span>
                            </div>
                            <input
                              type="range"
                              min="0"
                              max="1"
                              step="0.01"
                              value={currentMaterial.roughness}
                              onChange={(e) => handleMaterialChange('roughness', parseFloat(e.target.value))}
                              className="w-full bg-zinc-700 rounded-lg appearance-none cursor-pointer"
                            />
                          </div>
                        </>
                      )}
                      
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id="transparent"
                          checked={currentMaterial.transparent}
                          onChange={(e) => handleMaterialChange('transparent', e.target.checked)}
                          className="w-4 h-4 bg-zinc-900 border-zinc-700 rounded focus:ring-blue-500"
                        />
                        <label htmlFor="transparent" className="text-sm text-zinc-300">Transparent</label>
                      </div>
                      
                      {currentMaterial.transparent && (
                        <div className="space-y-1">
                          <div className="flex justify-between">
                            <label className="text-sm text-zinc-300">Opacity</label>
                            <span className="text-sm text-zinc-400">{currentMaterial.opacity}</span>
                          </div>
                          <input
                            type="range"
                            min="0"
                            max="1"
                            step="0.01"
                            value={currentMaterial.opacity}
                            onChange={(e) => handleMaterialChange('opacity', parseFloat(e.target.value))}
                            className="w-full bg-zinc-700 rounded-lg appearance-none cursor-pointer"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {modelSpec && (
              <div className="bg-zinc-800/50 backdrop-blur-sm rounded-xl p-4 border border-white/10">
                <h2 className="text-lg font-semibold mb-2">Model Description</h2>
                <p className="text-sm text-zinc-300">{modelSpec.description}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 