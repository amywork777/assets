"use client"

import { useState, useRef, useEffect, useMemo } from "react"
import * as THREE from "three"
import { Canvas } from "@react-three/fiber"
import { OrbitControls, Center, Grid, Environment } from "@react-three/drei"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Slider } from "@/components/ui/slider"
import { Label } from "@/components/ui/label"
import { Loader2, Download } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { STLExporter } from 'three/addons/exporters/STLExporter.js'
import * as BufferGeometryUtils from 'three/examples/jsm/utils/BufferGeometryUtils.js'

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
}

function DynamicModel({ modelSpec, meshRef }: { modelSpec: ModelSpec, meshRef: React.RefObject<THREE.Mesh> }) {
  // Create a THREE.Group as a container for all the parts
  const groupRef = useRef<THREE.Group>(null);
  
  // Map materials
  const materialMap: Record<string, any> = {
    "standard": THREE.MeshStandardMaterial,
    "basic": THREE.MeshBasicMaterial,
    "phong": THREE.MeshPhongMaterial,
    "physical": THREE.MeshPhysicalMaterial,
    "lambert": THREE.MeshLambertMaterial,
    "toon": THREE.MeshToonMaterial
  };

  // Map geometries
  const geometryMap: Record<string, any> = {
    "box": THREE.BoxGeometry,
    "sphere": THREE.SphereGeometry,
    "cylinder": THREE.CylinderGeometry,
    "cone": THREE.ConeGeometry,
    "torus": THREE.TorusGeometry,
    "torusKnot": THREE.TorusKnotGeometry
  };

  // Forward the mesh reference to the parent component
  useEffect(() => {
    if (groupRef.current && meshRef) {
      // For STL export compatibility, assign the first mesh to the meshRef if it exists
      const firstMesh = groupRef.current.children[0] as THREE.Mesh;
      if (firstMesh) {
        // @ts-ignore: Object is possibly 'null'
        meshRef.current = firstMesh;
      }
    }
  }, [meshRef, modelSpec]);

  // Check if we have a multi-part model or a single-part model
  const isMultiPartModel = modelSpec.parts && modelSpec.parts.length > 0;

  // If it's a single part model, render just one mesh
  if (!isMultiPartModel && modelSpec.geometryType) {
    const MaterialClass = materialMap[modelSpec.material?.type || "standard"];
    const GeometryClass = geometryMap[modelSpec.geometryType];
    
    const materialProps = {
      color: modelSpec.material?.color || "#3B82F6",
      ...(modelSpec.material?.metalness !== undefined && { metalness: modelSpec.material.metalness }),
      ...(modelSpec.material?.roughness !== undefined && { roughness: modelSpec.material.roughness }),
      ...(modelSpec.material?.emissive !== undefined && { emissive: new THREE.Color(modelSpec.material.emissive) }),
      ...(modelSpec.material?.transparent !== undefined && { 
        transparent: modelSpec.material.transparent,
        opacity: modelSpec.material.opacity || 1.0
      })
    };
    
    return (
      <mesh 
        ref={meshRef} 
        position={modelSpec.position || [0, 0, 0]}
        rotation={[
          (modelSpec.rotation?.[0] || 0) * Math.PI / 180,
          (modelSpec.rotation?.[1] || 0) * Math.PI / 180,
          (modelSpec.rotation?.[2] || 0) * Math.PI / 180
        ]}
      >
        <primitive object={createGeometry(GeometryClass, modelSpec.parameters || {})} attach="geometry" />
        <primitive object={new MaterialClass(materialProps)} attach="material" />
      </mesh>
    );
  }
  
  // For multi-part models, render a group containing all parts
  return (
    <group ref={groupRef}>
      {isMultiPartModel && modelSpec.parts?.map((part, index) => {
        const MaterialClass = materialMap[part.material?.type || "standard"];
        const GeometryClass = geometryMap[part.geometryType];
        
        const materialProps = {
          color: part.material?.color || "#3B82F6",
          ...(part.material?.metalness !== undefined && { metalness: part.material.metalness }),
          ...(part.material?.roughness !== undefined && { roughness: part.material.roughness }),
          ...(part.material?.emissive !== undefined && { emissive: new THREE.Color(part.material.emissive) }),
          ...(part.material?.transparent !== undefined && { 
            transparent: part.material.transparent,
            opacity: part.material.opacity || 1.0
          })
        };
        
        return (
          <mesh 
            key={index}
            position={part.position || [0, 0, 0]} 
            rotation={[
              (part.rotation?.[0] || 0) * Math.PI / 180,
              (part.rotation?.[1] || 0) * Math.PI / 180,
              (part.rotation?.[2] || 0) * Math.PI / 180
            ]}
            ref={index === 0 ? meshRef : undefined}
          >
            <primitive object={createGeometry(GeometryClass, part.parameters || {})} attach="geometry" />
            <primitive object={new MaterialClass(materialProps)} attach="material" />
          </mesh>
        );
      })}
    </group>
  );
}

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
      parameters.heightSegments || 16
    );
  }
  
  // Cylinder (radiusTop, radiusBottom, height, radialSegments)
  if (GeometryClass === THREE.CylinderGeometry) {
    return new GeometryClass(
      parameters.radiusTop || 1,
      parameters.radiusBottom || 1,
      parameters.height || 1,
      parameters.radialSegments || 32
    );
  }
  
  // Cone (radius, height, radialSegments)
  if (GeometryClass === THREE.ConeGeometry) {
    return new GeometryClass(
      parameters.radius || 1,
      parameters.height || 1,
      parameters.radialSegments || 32
    );
  }
  
  // Torus (radius, tube, radialSegments, tubularSegments)
  if (GeometryClass === THREE.TorusGeometry) {
    return new GeometryClass(
      parameters.radius || 1,
      parameters.tube || 0.4,
      parameters.radialSegments || 16,
      parameters.tubularSegments || 100
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
  
  // Default case
  return new GeometryClass();
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
  const modelRef = useRef<THREE.Mesh>(null);

  // Update params when model changes
  useEffect(() => {
    if (modelSpec) {
      setCurrentParams({...modelSpec.parameters});
      setCurrentMaterial({
        type: modelSpec.material?.type || 'standard',
        color: modelSpec.material?.color || '#ffffff',
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

  const handleExportSTL = async () => {
    if (!modelRef.current) {
      console.error('No model mesh available for STL export');
      return;
    }

    try {
      setLoading(true);

      // Check if the model is a group (multi-part) or a single mesh
      if (modelRef.current.parent && modelRef.current.parent.type === 'Group') {
        // Handle multi-part model
        const group = modelRef.current.parent as THREE.Group;
        const meshes = group.children.filter(child => child.type === 'Mesh') as THREE.Mesh[];
        
        if (meshes.length === 0) {
          throw new Error('No meshes found in the group for STL export');
        }
        
        // Clone and position geometries according to their world positions
        const geometries: THREE.BufferGeometry[] = [];
        meshes.forEach(mesh => {
          const clonedGeometry = mesh.geometry.clone();
          
          // Apply mesh's position, rotation, and scale to the geometry
          mesh.updateMatrix();
          clonedGeometry.applyMatrix4(mesh.matrix);
          
          geometries.push(clonedGeometry);
        });
        
        // Merge all geometries into a single one
        const mergedGeometry = BufferGeometryUtils.mergeGeometries(geometries);
        const tempMesh = new THREE.Mesh(mergedGeometry);
        
        // Generate STL data from the merged geometry
        const exporter = new STLExporter();
        const stlData = exporter.parse(tempMesh);
        
        // Create a blob from the STL data
        const blob = new Blob([stlData], { type: 'application/octet-stream' });
        const url = URL.createObjectURL(blob);
        
        // Trigger download
        const link = document.createElement('a');
        link.href = url;
        link.download = `${updatedModelSpec?.description || 'model'}.stl`.replace(/\s+/g, '_').slice(0, 30);
        link.click();
        
        // Clean up
        URL.revokeObjectURL(url);
      } else {
        // Handle single mesh model (original implementation)
        const mesh = modelRef.current;
        
        // Clone the mesh geometry to avoid modifying the original
        const clonedGeometry = mesh.geometry.clone();
        
        // Create a new mesh with the cloned geometry
        const tempMesh = new THREE.Mesh(clonedGeometry);
        
        // Apply the mesh's transformations
        mesh.updateMatrix();
        tempMesh.applyMatrix4(mesh.matrix);
        
        // Generate STL data
        const exporter = new STLExporter();
        const stlData = exporter.parse(tempMesh);
        
        // Create a blob from the STL data
        const blob = new Blob([stlData], { type: 'application/octet-stream' });
        const url = URL.createObjectURL(blob);
        
        // Trigger download
        const link = document.createElement('a');
        link.href = url;
        link.download = `${updatedModelSpec?.description || 'model'}.stl`.replace(/\s+/g, '_').slice(0, 30);
        link.click();
        
        // Clean up
        URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Error exporting STL:', error);
      alert('Failed to export STL file. Please try again.');
    } finally {
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
                <Grid infiniteGrid fadeDistance={30} fadeStrength={5} />
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