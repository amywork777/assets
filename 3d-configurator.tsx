"use client"

import { useState, useRef, Suspense, useCallback } from "react"
import { Canvas } from "@react-three/fiber"
import { OrbitControls, Environment, MeshTransmissionMaterial, Center } from "@react-three/drei"
import { Slider } from "@/components/ui/slider"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Download, CuboidIcon as Cube } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

const categories = {
  lampshade: {
    name: "Lampshade",
    description: "Create ambient lighting with customizable patterns",
    defaults: {
      height: 30,
      topRadius: 15,
      bottomRadius: 12,
      waveAmplitude: 1.5,
      waveFrequency: 6,
      hasBottom: false,
      material: "glass",
    },
  },
  vessel: {
    name: "Plant & Flower Vessel",
    description: "Perfect for both decorative flowers and live plants",
    defaults: {
      height: 25,
      topRadius: 12,
      bottomRadius: 8,
      waveAmplitude: 1,
      waveFrequency: 4,
      hasBottom: true,
      material: "glass",
    },
  },
  storage: {
    name: "Storage Container",
    description: "Organize your space with style",
    defaults: {
      height: 15,
      topRadius: 12,
      bottomRadius: 12,
      waveAmplitude: 0.5,
      waveFrequency: 3,
      hasBottom: true,
      material: "glass",
    },
  },
  candle: {
    name: "Candle Holder",
    description: "Create mesmerizing light patterns",
    defaults: {
      height: 20,
      topRadius: 5,
      bottomRadius: 7,
      waveAmplitude: 0.8,
      waveFrequency: 5,
      hasBottom: true,
      material: "glass",
    },
  },
}

const controls = [
  { id: "height", label: "Height", min: 5, max: 50 },
  { id: "topRadius", label: "Top Radius", min: 2, max: 20 },
  { id: "bottomRadius", label: "Bottom Radius", min: 2, max: 20 },
  { id: "waveAmplitude", label: "Wave Amplitude", min: 0, max: 5 },
  { id: "waveFrequency", label: "Wave Frequency", min: 0, max: 16 },
]

const materials = {
  glass: {
    type: "transmission",
    props: {
      transmission: 0.95,
      thickness: 2,
      roughness: 0.05,
      chromaticAberration: 0.025,
      ior: 1.5,
    },
  },
  metal: {
    type: "standard",
    props: {
      metalness: 0.9,
      roughness: 0.1,
      color: "#ffffff",
    },
  },
  ceramic: {
    type: "standard",
    props: {
      metalness: 0,
      roughness: 0.7,
      color: "#ffffff",
    },
  },
  matte: {
    type: "standard",
    props: {
      metalness: 0,
      roughness: 1,
      color: "#ffffff",
    },
  },
}

function Scene({ params }) {
  return (
    <>
      <color attach="background" args={["#18181b"]} />
      <ambientLight intensity={0.7} />
      <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} intensity={1.5} castShadow />
      <spotLight position={[-10, -10, -10]} angle={0.15} penumbra={1} intensity={0.5} castShadow />
      <Center scale={0.7} position={[0, 2, 0]}>
        <ParametricShape params={params} />
      </Center>
      <Environment preset="studio" background={false} />
      <OrbitControls makeDefault />
    </>
  )
}

function ParametricShape({ params }) {
  const meshRef = useRef()
  const { height, topRadius, bottomRadius, waveAmplitude, waveFrequency, hasBottom, material } = params

  const generateGeometry = useCallback(() => {
    const segments = 64
    const heightSegments = 32
    const vertices = []
    const indices = []
    const normals = []

    // Generate side vertices
    for (let y = 0; y <= heightSegments; y++) {
      const v = y / heightSegments
      const yPos = v * height - height / 2
      const radius = bottomRadius + (topRadius - bottomRadius) * v

      for (let x = 0; x <= segments; x++) {
        const u = x / segments
        const theta = u * Math.PI * 2

        const waveOffset = Math.sin(v * Math.PI * waveFrequency) * waveAmplitude
        const finalRadius = radius + waveOffset

        const xPos = Math.cos(theta) * finalRadius
        const zPos = Math.sin(theta) * finalRadius

        vertices.push(xPos, yPos, zPos)

        // Calculate normals
        const nx = Math.cos(theta)
        const ny = 0.2
        const nz = Math.sin(theta)
        const len = Math.sqrt(nx * nx + ny * ny + nz * nz)
        normals.push(nx / len, ny / len, nz / len)
      }
    }

    // Generate indices for sides
    for (let y = 0; y < heightSegments; y++) {
      for (let x = 0; x < segments; x++) {
        const a = y * (segments + 1) + x
        const b = a + segments + 1
        const c = a + 1
        const d = b + 1

        indices.push(a, b, c)
        indices.push(c, b, d)
      }
    }

    // Add bottom cap if needed
    if (hasBottom) {
      const baseIndex = vertices.length / 3
      vertices.push(0, -height / 2, 0)
      normals.push(0, -1, 0)

      for (let i = 0; i <= segments; i++) {
        const theta = (i / segments) * Math.PI * 2
        const x = Math.cos(theta) * bottomRadius
        const z = Math.sin(theta) * bottomRadius
        vertices.push(x, -height / 2, z)
        normals.push(0, -1, 0)
      }

      for (let i = 0; i < segments; i++) {
        indices.push(baseIndex, baseIndex + i + 1, baseIndex + i + 2)
      }
    }

    return { vertices, indices, normals }
  }, [height, topRadius, bottomRadius, waveAmplitude, waveFrequency, hasBottom])

  const geometry = generateGeometry()
  const materialConfig = materials[material]

  return (
    <mesh ref={meshRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={geometry.vertices.length / 3}
          array={new Float32Array(geometry.vertices)}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-normal"
          count={geometry.normals.length / 3}
          array={new Float32Array(geometry.normals)}
          itemSize={3}
        />
        <bufferAttribute
          attach="index"
          count={geometry.indices.length}
          array={new Uint16Array(geometry.indices)}
          itemSize={1}
        />
      </bufferGeometry>
      {materialConfig.type === "transmission" ? (
        <MeshTransmissionMaterial backside={!hasBottom} samples={4} {...materialConfig.props} />
      ) : (
        <meshStandardMaterial {...materialConfig.props} />
      )}
    </mesh>
  )
}

export default function Component() {
  const [currentCategory, setCurrentCategory] = useState("lampshade")
  const [shapeParams, setShapeParams] = useState(categories[currentCategory].defaults)
  const [key, setKey] = useState(0)

  const updateParam = (paramId: string, value: number | string) => {
    setShapeParams((prev) => ({
      ...prev,
      [paramId]: value,
    }))
    setKey((k) => k + 1)
  }

  const switchCategory = (categoryId: string) => {
    setCurrentCategory(categoryId)
    setShapeParams(categories[categoryId].defaults)
    setKey((k) => k + 1)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-900 via-black to-zinc-900 text-white font-sans antialiased">
      <div className="container mx-auto min-h-screen flex flex-col gap-8 p-6">
        <header className="flex flex-col gap-4 pt-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Cube className="w-8 h-8 text-white/80" />
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl font-bold tracking-tight">3D Homegoods Design</h1>
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
                <p className="text-zinc-400 text-sm mt-1">Design, customize, and 3D print your perfect homegoods</p>
              </div>
            </div>
            <Button variant="secondary" size="lg" className="gap-2 text-sm bg-blue-500 hover:bg-blue-600 text-white">
              <Download className="w-4 h-4" />
              Export STL
            </Button>
          </div>
          <p className="text-zinc-400 text-sm">{categories[currentCategory].description}</p>
        </header>

        <div className="flex-1 grid lg:grid-cols-[1fr_320px] gap-8 min-h-[600px]">
          <div className="relative rounded-2xl overflow-hidden bg-zinc-800/50 backdrop-blur-sm border border-white/10">
            <div className="absolute inset-0">
              <Canvas camera={{ position: [30, 15, 30], fov: 45 }} className="w-full h-full">
                <Suspense fallback={null}>
                  <Scene key={key} params={shapeParams} />
                </Suspense>
              </Canvas>
            </div>
          </div>

          <div className="space-y-8">
            <div>
              <h2 className="text-lg font-semibold mb-4">Products</h2>
              <div className="grid grid-cols-2 lg:grid-cols-1 gap-2">
                {Object.entries(categories).map(([id, { name }]) => (
                  <Button
                    key={id}
                    variant={currentCategory === id ? "default" : "ghost"}
                    className="w-full justify-start h-12 px-4"
                    onClick={() => switchCategory(id)}
                  >
                    {name}
                  </Button>
                ))}
              </div>
            </div>

            <div className="space-y-6 bg-zinc-800/50 backdrop-blur-sm border border-white/10 p-6 rounded-xl">
              <div className="space-y-6">
                <div className="space-y-3">
                  <Label className="text-sm font-medium">Material</Label>
                  <Select value={shapeParams.material} onValueChange={(value) => updateParam("material", value)}>
                    <SelectTrigger className="bg-zinc-900 border-zinc-700">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-zinc-900 border-zinc-700">
                      <SelectItem value="glass">Glass</SelectItem>
                      <SelectItem value="metal">Metal</SelectItem>
                      <SelectItem value="ceramic">Ceramic</SelectItem>
                      <SelectItem value="matte">Matte</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {controls.map((control) => (
                  <div key={control.id} className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-medium">{control.label}</Label>
                      <span className="text-xs text-zinc-400">{shapeParams[control.id].toFixed(1)}</span>
                    </div>
                    <Slider
                      value={[shapeParams[control.id]]}
                      onValueChange={([value]) => updateParam(control.id, value)}
                      min={control.min}
                      max={control.max}
                      step={0.1}
                      className="[&_[role=slider]]:h-4 [&_[role=slider]]:w-4"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

