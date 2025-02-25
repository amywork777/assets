"use client"

import { useState, useRef, Suspense, useCallback } from "react"
import { Canvas } from "@react-three/fiber"
import { OrbitControls, Environment, MeshTransmissionMaterial, Center } from "@react-three/drei"
import { Slider } from "@/components/ui/slider"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Download } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { STLExporter } from 'three/addons/exporters/STLExporter.js'
import * as THREE from 'three'
import { DoubleSide } from 'three'
import Image from 'next/image'

interface PriceInfo {
  dimensions: string;
  price: number;
  priceId: string;
}

interface CategoryPriceInfo {
  mini?: PriceInfo;
  small?: PriceInfo;
  medium?: PriceInfo;
}

interface CategoryInfo {
  name: string;
  description: string;
  priceInfo: CategoryPriceInfo;
  defaults: ShapeParams;
}

const categories: Record<string, CategoryInfo> = {
  lampshade: {
    name: "Lampshade",
    description: "Create ambient lighting with customizable patterns. For custom dimensions or special requests, use our Custom Order button.",
    priceInfo: {
      mini: {
        dimensions: "2\" × 2\" × 2\"",
        price: 25,
        priceId: "price_1QmGnoCLoBz9jXRliwBcAA5a"
      },
      small: {
        dimensions: "3.5\" × 3.5\" × 3.5\"",
        price: 35,
        priceId: "price_1QmGpfCLoBz9jXRlBcrkWyUj"
      },
      medium: {
        dimensions: "5\" × 5\" × 5\"",
        price: 45,
        priceId: "price_1QmGquCLoBz9jXRlh9SG2fqs"
      }
    },
    defaults: {
      type: 'standard' as const,
      height: 30,
      topRadius: 15,
      bottomRadius: 12,
      waveAmplitude: 1.5,
      waveFrequency: 6,
      twist: 0,
      hasBottom: false,
      material: "shiny" as const,
    },
  },
  vase: {
    name: "Vase",
    description: "Create elegant vases for flowers and decorative displays. For custom dimensions or special requests, use our Custom Order button.",
    priceInfo: {
      mini: {
        dimensions: "2\" × 2\" × 2\"",
        price: 25,
        priceId: "price_1QmGnoCLoBz9jXRliwBcAA5a"
      },
      small: {
        dimensions: "3.5\" × 3.5\" × 3.5\"",
        price: 35,
        priceId: "price_1QmGpfCLoBz9jXRlBcrkWyUj"
      },
      medium: {
        dimensions: "5\" × 5\" × 5\"",
        price: 45,
        priceId: "price_1QmGquCLoBz9jXRlh9SG2fqs"
      }
    },
    defaults: {
      type: 'standard' as const,
      height: 25,
      topRadius: 12,
      bottomRadius: 8,
      waveAmplitude: 1,
      waveFrequency: 4,
      twist: 0,
      hasBottom: true,
      material: "shiny" as const,
    },
  },
  bowl: {
    name: "Bowl",
    description: "Wide decorative bowls with textured patterns. ⚠️ Note: Not intended for food use. For decorative purposes only. For custom dimensions or special requests, use our Custom Order button.",
    priceInfo: {
      mini: {
        dimensions: "2\" × 2\" × 2\"",
        price: 25,
        priceId: "price_1QmGnoCLoBz9jXRliwBcAA5a"
      },
      small: {
        dimensions: "3.5\" × 3.5\" × 3.5\"",
        price: 35,
        priceId: "price_1QmGpfCLoBz9jXRlBcrkWyUj"
      },
      medium: {
        dimensions: "5\" × 5\" × 5\"",
        price: 45,
        priceId: "price_1QmGquCLoBz9jXRlh9SG2fqs"
      }
    },
    defaults: {
      type: 'bowl' as const,
      height: 8,
      diameter: 20,
      patternType: 'geometric' as const,
      patternScale: 2,
      patternDepth: 0.5,
      twist: 0,
      material: "shiny" as const,
    },
  },
  candleHolder: {
    name: "Cup",
    description: "Decorative cups with textured patterns. ⚠️ Note: Not intended for food or beverage use. For decorative purposes only. For custom dimensions or special requests, use our Custom Order button.",
    priceInfo: {
      mini: {
        dimensions: "2\" × 2\" × 2\"",
        price: 25,
        priceId: "price_1QmGnoCLoBz9jXRliwBcAA5a"
      },
      small: {
        dimensions: "3.5\" × 3.5\" × 3.5\"",
        price: 35,
        priceId: "price_1QmGpfCLoBz9jXRlBcrkWyUj"
      },
      medium: {
        dimensions: "5\" × 5\" × 5\"",
        price: 45,
        priceId: "price_1QmGquCLoBz9jXRlh9SG2fqs"
      }
    },
    defaults: {
      type: 'candleHolder' as const,
      height: 12,
      diameter: 8,
      patternType: 'geometric' as const,
      patternScale: 2,
      patternDepth: 0.5,
      twist: 0,
      material: "shiny" as const,
    },
  },
  wallArt: {
    name: "Wall Art",
    description: "Parametric wall panels with mesmerizing patterns. For custom dimensions or special requests, use our Custom Order button.",
    priceInfo: {
      mini: {
        dimensions: "2\" × 2\" × 2\"",
        price: 25,
        priceId: "price_1QmGnoCLoBz9jXRliwBcAA5a"
      },
      small: {
        dimensions: "3.5\" × 3.5\" × 3.5\"",
        price: 35,
        priceId: "price_1QmGpfCLoBz9jXRlBcrkWyUj"
      },
      medium: {
        dimensions: "5\" × 5\" × 5\"",
        price: 45,
        priceId: "price_1QmGquCLoBz9jXRlh9SG2fqs"
      }
    },
    defaults: {
      type: 'wallArt' as const,
      width: 30,
      height: 30,
      depth: 2,
      patternType: 'mandala' as const,
      patternScale: 2,
      patternDepth: 1,
      material: "shiny" as const,
    },
  },
  coaster: {
    name: "Decorative Coaster",
    description: "Stylish protection for your surfaces with unique patterns. For custom dimensions or special requests, use our Custom Order button.",
    priceInfo: {
      mini: {
        dimensions: "2\" × 2\" × 2\"",
        price: 25,
        priceId: "price_1QmGnoCLoBz9jXRliwBcAA5a"
      },
      small: {
        dimensions: "3.5\" × 3.5\" × 3.5\"",
        price: 35,
        priceId: "price_1QmGpfCLoBz9jXRlBcrkWyUj"
      },
      medium: {
        dimensions: "5\" × 5\" × 5\"",
        price: 45,
        priceId: "price_1QmGquCLoBz9jXRlh9SG2fqs"
      }
    },
    defaults: {
      type: 'coaster' as const,
      diameter: 24,
      thickness: 6,
      patternType: 'hexagonal' as const,
      patternScale: 2,
      patternDepth: 1,
      rimHeight: 2,
      hasBottom: true,
      material: "shiny" as const,
    },
  },
} as const

const getControlsForType = (type: ShapeParams['type'], shapeParams: ShapeParams) => {
  switch (type) {
    case 'standard':
      return [
        { id: "height" as const, label: "Height (in)", min: 2, max: 20, step: 0.1 },
        { id: "topRadius" as const, label: "Top Radius (in)", min: 0.8, max: 8, step: 0.1 },
        { id: "bottomRadius" as const, label: "Bottom Radius (in)", min: 0.8, max: 8, step: 0.1 },
        { id: "waveAmplitude" as const, label: "Wave Amplitude (in)", min: 0, max: 2, step: 0.1 },
        { id: "waveFrequency" as const, label: "Wave Frequency", min: 0, max: 16, step: 0.1 },
        { id: "twist" as const, label: "Twist (turns)", min: 0, max: 3, step: 0.1 },
      ] as const
    case 'wallArt':
      return [
        { id: "width" as const, label: "Width (in)", min: 6, max: 20, step: 0.1 },
        { id: "height" as const, label: "Height (in)", min: 6, max: 20, step: 0.1 },
        { id: "depth" as const, label: "Depth (in)", min: 0.4, max: 2, step: 0.1 },
        { id: "patternScale" as const, label: "Pattern Scale", min: 1, max: 5, step: 0.1 },
        { id: "patternDepth" as const, label: "Pattern Depth (mm)", min: 0.2, max: 2, step: 0.1 },
      ] as const
    case 'candleHolder':
      return [
        { id: "height" as const, label: "Height (in)", min: 3, max: 8, step: 0.1 },
        { id: "diameter" as const, label: "Diameter (in)", min: 2.4, max: 6, step: 0.1 },
        { id: "patternScale" as const, label: "Pattern Scale", min: 1, max: 5, step: 0.1 },
        { id: "patternDepth" as const, label: "Pattern Depth (mm)", min: 0.2, max: 2, step: 0.1 },
        { id: "twist" as const, label: "Twist (turns)", min: 0, max: 3, step: 0.1 },
      ] as const
    case 'bowl':
      return [
        { id: "height" as const, label: "Height (in)", min: 2, max: 5, step: 0.1 },
        { id: "diameter" as const, label: "Diameter (in)", min: 6, max: 12, step: 0.1 },
        { id: "patternScale" as const, label: "Pattern Scale", min: 1, max: 5, step: 0.1 },
        { id: "patternDepth" as const, label: "Pattern Depth (mm)", min: 0.2, max: 2, step: 0.1 },
        { id: "twist" as const, label: "Twist (turns)", min: 0, max: 3, step: 0.1 },
      ] as const
    case 'coaster':
      return [
        { id: "diameter" as const, label: "Diameter (in)", min: 6, max: 12, step: 0.1 },
        { id: "thickness" as const, label: "Thickness (mm)", min: 3, max: 10, step: 0.1 },
        { id: "patternScale" as const, label: "Pattern Scale", min: 1, max: 5, step: 0.1 },
        { id: "patternDepth" as const, label: "Pattern Depth (mm)", min: 0.2, max: 2, step: 0.1 },
        { id: "rimHeight" as const, label: "Rim Height (mm)", min: 0, max: 4, step: 0.1 },
      ] as const
  }
}

interface MaterialProps {
  opacity: number;
  transparent: boolean;
  side: typeof DoubleSide;
  [key: string]: any;
}

interface MaterialConfig {
  type: 'standard' | 'basic';
  props: MaterialProps;
}

const materials: Record<string, MaterialConfig> = {
  shiny: {
    type: 'standard',
    props: {
      metalness: 0.9,
      roughness: 0.3,
      clearcoat: 1,
      clearcoatRoughness: 0.1,
      opacity: 1,
      transparent: true,
      side: DoubleSide,
    },
  },
  matte: {
    type: 'standard',
    props: {
      color: '#e0e0e0',  // Lighter grey color
      metalness: 0.1,    // Keep low metalness for matte look
      roughness: 0.7,    // Slightly reduced roughness for more definition
      clearcoat: 0.3,    // Slightly increased clearcoat
      clearcoatRoughness: 0.6,  // Reduced clearcoat roughness
      opacity: 1,
      transparent: true,
      side: DoubleSide,
      envMapIntensity: 0.8,  // Added environment map intensity
    },
  },
  wireframe: {
    type: 'basic',
    props: {
      wireframe: true,
      color: "#ffffff",
      opacity: 0.5,
      transparent: true,
      side: DoubleSide,
    },
  },
} as const

interface BaseShapeParams {
  material: keyof typeof materials
  hasBottom?: boolean
}

interface StandardShapeParams extends BaseShapeParams {
  type: 'standard'
  height: number
  topRadius: number
  bottomRadius: number
  waveAmplitude: number
  waveFrequency: number
  twist: number
  hasBottom: boolean
}

interface CoasterShapeParams extends BaseShapeParams {
  type: 'coaster'
  diameter: number
  thickness: number
  patternType: 'hexagonal' | 'spiral' | 'concentric' | 'floral' | 'ripple' | 'maze'
  patternScale: number
  patternDepth: number
  rimHeight: number
}

interface WallArtParams extends BaseShapeParams {
  type: 'wallArt'
  width: number
  height: number
  depth: number
  patternType: 'mandala' | 'wave' | 'honeycomb' | 'circuit' | 'organic'
  patternScale: number
  patternDepth: number
}

interface CandleHolderParams extends BaseShapeParams {
  type: 'candleHolder'
  height: number
  diameter: number
  patternType: 'geometric' | 'stars' | 'leaves' | 'abstract'
  patternScale: number
  patternDepth: number
  twist: number
}

interface BowlParams extends BaseShapeParams {
  type: 'bowl'
  height: number
  diameter: number
  patternType: 'geometric' | 'stars' | 'leaves' | 'abstract'
  patternScale: number
  patternDepth: number
  twist: number
}

type ShapeParams = StandardShapeParams | CoasterShapeParams | WallArtParams | CandleHolderParams | BowlParams

interface ParametricShapeProps {
  params: ShapeParams
  meshRef: React.RefObject<THREE.Mesh>
}

interface SceneProps {
  params: ShapeParams & { meshRef: React.RefObject<THREE.Mesh> }
}

function Scene({ params }: SceneProps) {
  const { meshRef, ...shapeParams } = params
  
  return (
    <>
      <color attach="background" args={["#1a1a1a"]} />
      <ambientLight intensity={0.8} />
      <spotLight position={[10, 10, 10]} angle={0.4} penumbra={0.8} intensity={2.5} castShadow />
      <spotLight position={[-10, 10, -10]} angle={0.4} penumbra={0.8} intensity={2.5} castShadow />
      <spotLight position={[0, -10, 0]} angle={0.4} penumbra={0.8} intensity={1} castShadow />
      <Center scale={0.5} position={[0, 0, 0]}>
        <ParametricShape params={shapeParams} meshRef={meshRef} />
      </Center>
      <Environment preset="studio" background={false} />
      <OrbitControls makeDefault minPolarAngle={0} maxPolarAngle={Math.PI / 2.1} />
    </>
  )
}

const inchesToCm = (inches: number) => inches * 2.54;

function generateCoasterGeometry(params: CoasterShapeParams) {
  const { 
    diameter: diameterInches, 
    thickness, 
    patternType, 
    patternScale, 
    patternDepth, 
    rimHeight 
  } = params
  const diameter = inchesToCm(diameterInches)
  const segments = 128 // Increased for smoother curves
  const vertices: number[] = []
  const indices: number[] = []
  const normals: number[] = []

  // Generate top surface with organic pattern
  for (let r = 0; r <= segments; r++) {
    const radius = (r / segments) * (diameter / 2)
    for (let theta = 0; theta <= segments; theta++) {
      const angle = (theta / segments) * Math.PI * 2
      const x = Math.cos(angle) * radius
      const z = Math.sin(angle) * radius
      
      let y = thickness
      // Add pattern based on type
      if (radius < (diameter / 2) - rimHeight) {
        switch (patternType) {
          case 'hexagonal':
            // More organic hexagonal pattern with flowing curves
            y += Math.sin(x * patternScale + Math.sin(z * patternScale)) * 
                 Math.sin(z * patternScale + Math.sin(x * patternScale)) * patternDepth
            break
          case 'spiral':
            // Double spiral with varying frequency
            const spiralFreq = 5 + Math.sin(radius * 0.5) * 2
            y += (Math.sin(angle * spiralFreq + radius * patternScale * 2) * 0.5 +
                  Math.sin(angle * -spiralFreq * 1.5 + radius * patternScale * 1.5) * 0.5) * patternDepth
            break
          case 'concentric':
            // Organic concentric rings with wave variation
            const ringFreq = patternScale * 4
            y += (Math.sin(radius * ringFreq) * 0.7 +
                  Math.sin(radius * ringFreq * 0.5 + angle * 3) * 0.3) * patternDepth
            break
          case 'floral':
            // Floral pattern with petal-like formations
            const petalCount = 8
            y += (Math.sin(angle * petalCount + radius * patternScale) * 
                  Math.cos(radius * patternScale * 2)) * patternDepth
            break
          case 'ripple':
            // Rippling water effect
            y += (Math.sin(Math.sqrt(x * x + z * z) * patternScale) +
                  Math.sin(Math.atan2(z, x) * 6)) * patternDepth * 0.5
            break
          case 'maze':
            // Maze-like pattern
            const gridSize = patternScale * 2
            const gridX = Math.floor(x * gridSize)
            const gridZ = Math.floor(z * gridSize)
            y += (Math.sin(gridX) * Math.cos(gridZ) + 
                  Math.cos(gridX * 0.5) * Math.sin(gridZ * 0.5)) * patternDepth
            break
        }
        
        // Add subtle noise to all patterns
        y += (Math.sin(x * 20 + z * 20) * 0.1 + Math.sin(x * 15 - z * 15) * 0.1) * patternDepth
      }
      
      vertices.push(x, y, z)
      
      // Calculate more accurate normals for the organic surface
      const dx = Math.cos(angle)
      const dz = Math.sin(angle)
      const dy = 1
      const len = Math.sqrt(dx * dx + dy * dy + dz * dz)
      normals.push(dx / len, dy / len, dz / len)
    }
  }

  // Generate indices for top surface
  for (let r = 0; r < segments; r++) {
    for (let theta = 0; theta < segments; theta++) {
      const a = r * (segments + 1) + theta
      const b = a + segments + 1
      const c = a + 1
      const d = b + 1
      indices.push(a, b, c, c, b, d)
    }
  }

  // Add side wall vertices
  const baseVertexCount = vertices.length / 3
  for (let theta = 0; theta <= segments; theta++) {
    const angle = (theta / segments) * Math.PI * 2
    const x = Math.cos(angle) * (diameter / 2)
    const z = Math.sin(angle) * (diameter / 2)
    
    vertices.push(x, thickness, z)  // Top
    vertices.push(x, 0, z)          // Bottom
    
    const nx = Math.cos(angle)
    const nz = Math.sin(angle)
    normals.push(nx, 0, nz)
    normals.push(nx, 0, nz)
  }

  // Add side wall indices
  for (let i = 0; i < segments; i++) {
    const a = baseVertexCount + i * 2
    const b = baseVertexCount + (i + 1) * 2
    indices.push(
      a, a + 1, b,
      b, a + 1, b + 1
    )
  }

  // Add bottom vertices if needed
  if (params.hasBottom) {
    const baseIndex = vertices.length / 3
    for (let r = 0; r <= segments / 2; r++) {
      const radius = (r / (segments / 2)) * (diameter / 2)
      for (let theta = 0; theta <= segments; theta++) {
        const angle = (theta / segments) * Math.PI * 2
        const x = Math.cos(angle) * radius
        const z = Math.sin(angle) * radius
        vertices.push(x, 0, z)
        normals.push(0, -1, 0)
      }
    }

    // Add bottom surface indices
    for (let r = 0; r < segments / 2; r++) {
      for (let theta = 0; theta < segments; theta++) {
        const a = baseIndex + r * (segments + 1) + theta
        const b = baseIndex + (r + 1) * (segments + 1) + theta
        const c = baseIndex + r * (segments + 1) + theta + 1
        const d = baseIndex + (r + 1) * (segments + 1) + theta + 1
        indices.push(a, c, b, b, c, d)
      }
    }
  }

  return { vertices, indices, normals }
}

function generateStandardGeometry(params: StandardShapeParams) {
  const { 
    height: heightInches, 
    topRadius: topRadiusInches, 
    bottomRadius: bottomRadiusInches, 
    waveAmplitude: waveAmplitudeInches, 
    waveFrequency, 
    twist, 
    hasBottom 
  } = params
  const height = inchesToCm(heightInches)
  const topRadius = inchesToCm(topRadiusInches)
  const bottomRadius = inchesToCm(bottomRadiusInches)
  const waveAmplitude = inchesToCm(waveAmplitudeInches)
  const segments = 64
  const heightSegments = 32
  const vertices: number[] = []
  const indices: number[] = []
  const normals: number[] = []

  // Generate main body vertices
  for (let y = 0; y <= heightSegments; y++) {
    const v = y / heightSegments
    const yPos = v * height - height / 2
    const radius = bottomRadius + (topRadius - bottomRadius) * v

    // Calculate twist angle for this height
    const twistAngle = v * twist * Math.PI * 2

    for (let x = 0; x <= segments; x++) {
      const u = x / segments
      const theta = u * Math.PI * 2 + twistAngle

      const waveOffset = Math.sin(v * Math.PI * waveFrequency) * waveAmplitude
      const finalRadius = radius + waveOffset

      const xPos = Math.cos(theta) * finalRadius
      const zPos = Math.sin(theta) * finalRadius

      vertices.push(xPos, yPos, zPos)

      // Calculate normals with twist
      const nx = Math.cos(theta)
      const ny = twist * 0.2
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
}

function generateWallArtGeometry(params: WallArtParams) {
  const { 
    width: widthInches, 
    height: heightInches, 
    depth: depthInches, 
    patternType, 
    patternScale, 
    patternDepth 
  } = params
  const width = inchesToCm(widthInches)
  const height = inchesToCm(heightInches)
  const depth = inchesToCm(depthInches)
  const segments = 32
  const vertices: number[] = []
  const indices: number[] = []
  const normals: number[] = []

  // Generate front face vertices
  for (let y = 0; y <= segments; y++) {
    for (let x = 0; x <= segments; x++) {
      const xPos = (x / segments - 0.5) * width
      const yPos = (y / segments - 0.5) * height
      let zPos = 0

      // Apply pattern based on type
      switch (patternType) {
        case 'mandala':
          const r = Math.sqrt(xPos * xPos + yPos * yPos) / (Math.max(width, height) / 2)
          const theta = Math.atan2(yPos, xPos)
          zPos = Math.sin(r * patternScale * 10 + theta * 8) * patternDepth * (1 - r)
          break
        case 'wave':
          zPos = Math.sin((xPos + yPos) * patternScale) * patternDepth
          break
        case 'honeycomb':
          const hex = Math.sin(xPos * patternScale) * Math.sin(yPos * patternScale)
          zPos = (Math.abs(hex) > 0.5 ? hex : 0) * patternDepth
          break
        case 'circuit':
          zPos = (Math.round(Math.sin(xPos * patternScale) + Math.cos(yPos * patternScale))) * patternDepth
          break
        case 'organic':
          zPos = (Math.sin(xPos * patternScale) * Math.sin(yPos * patternScale) + 
                 Math.sin((xPos + yPos) * patternScale * 0.5)) * patternDepth
          break
      }

      vertices.push(xPos, yPos, zPos)
      
      // Calculate normals based on pattern gradient
      const nx = Math.cos(xPos * patternScale) * 0.2
      const ny = Math.cos(yPos * patternScale) * 0.2
      const nz = 1
      const len = Math.sqrt(nx * nx + ny * ny + nz * nz)
      normals.push(nx/len, ny/len, nz/len)
    }
  }

  // Generate front face indices
  for (let y = 0; y < segments; y++) {
    for (let x = 0; x < segments; x++) {
      const a = y * (segments + 1) + x
      const b = a + 1
      const c = a + segments + 1
      const d = c + 1
      indices.push(a, c, b, b, c, d)
    }
  }

  // Add back panel vertices
  const backPanelStart = vertices.length / 3
  for (let y = 0; y <= segments; y++) {
    for (let x = 0; x <= segments; x++) {
      const xPos = (x / segments - 0.5) * width
      const yPos = (y / segments - 0.5) * height
      vertices.push(xPos, yPos, -depth)
      normals.push(0, 0, -1)
    }
  }

  // Add back panel indices
  for (let y = 0; y < segments; y++) {
    for (let x = 0; x < segments; x++) {
      const a = backPanelStart + y * (segments + 1) + x
      const b = a + 1
      const c = a + segments + 1
      const d = c + 1
      indices.push(a, b, c, c, b, d)
    }
  }

  // Add side walls
  const sideStart = vertices.length / 3
  
  // Add vertices for the four edges
  for (let i = 0; i <= segments; i++) {
    const t = i / segments
    // Top edge
    vertices.push(
      (t - 0.5) * width, height/2, 0,
      (t - 0.5) * width, height/2, -depth
    )
    normals.push(0, 1, 0, 0, 1, 0)
    
    // Bottom edge
    vertices.push(
      (t - 0.5) * width, -height/2, 0,
      (t - 0.5) * width, -height/2, -depth
    )
    normals.push(0, -1, 0, 0, -1, 0)
    
    // Left edge
    vertices.push(
      -width/2, (t - 0.5) * height, 0,
      -width/2, (t - 0.5) * height, -depth
    )
    normals.push(-1, 0, 0, -1, 0, 0)
    
    // Right edge
    vertices.push(
      width/2, (t - 0.5) * height, 0,
      width/2, (t - 0.5) * height, -depth
    )
    normals.push(1, 0, 0, 1, 0, 0)
  }

  // Add indices for the side walls
  for (let i = 0; i < segments; i++) {
    const base = sideStart + i * 8
    // Top wall
    indices.push(
      base + 0, base + 1, base + 2,
      base + 2, base + 1, base + 3
    )
    // Bottom wall
    indices.push(
      base + 4, base + 6, base + 5,
      base + 6, base + 7, base + 5
    )
    // Left wall
    indices.push(
      base + 8, base + 9, base + 10,
      base + 10, base + 9, base + 11
    )
    // Right wall
    indices.push(
      base + 12, base + 14, base + 13,
      base + 14, base + 15, base + 13
    )
  }

  return { vertices, indices, normals }
}

function generateCandleHolderGeometry(params: CandleHolderParams) {
  const { 
    height: holderHeightInches, 
    diameter: holderDiameterInches, 
    patternType: holderPatternType, 
    patternScale: holderPatternScale, 
    patternDepth: holderPatternDepth, 
    twist: holderTwist 
  } = params
  const holderHeight = inchesToCm(holderHeightInches)
  const holderDiameter = inchesToCm(holderDiameterInches)
  const segments = 64
  const vertices: number[] = []
  const indices: number[] = []
  const normals: number[] = []

  // Generate vertices for the cup surface
  for (let y = 0; y <= segments; y++) {
    const v = y / segments
    const yPos = v * holderHeight

    // Calculate twist angle for this height
    const twistAngle = v * holderTwist * Math.PI * 2
    
    for (let theta = 0; theta <= segments; theta++) {
      const angle = (theta / segments) * Math.PI * 2 + twistAngle
      
      // Apply pattern to the surface
      let pattern = 0
      if (yPos < holderHeight - 0.5) { // Don't apply pattern near the rim
        switch (holderPatternType) {
          case 'geometric':
            pattern = Math.abs(Math.sin(theta * holderPatternScale + v * holderPatternScale * 8)) * holderPatternDepth
            break
          case 'stars':
            pattern = Math.pow(Math.sin(theta * holderPatternScale * 2) * Math.cos(v * holderPatternScale * 8), 2) * holderPatternDepth
            break
          case 'leaves':
            pattern = Math.sin(theta * holderPatternScale + v * holderPatternScale * 6) * holderPatternDepth
            break
          case 'abstract':
            pattern = (Math.sin(theta * holderPatternScale * 3) * Math.sin(v * holderPatternScale * 4)) * holderPatternDepth
            break
        }
      }

      // For the last vertex in each ring, use the same coordinates as the first vertex
      const x = theta === segments ? vertices[y * (segments + 1) * 3] :
               Math.cos(angle) * (holderDiameter/2 + pattern)
      const z = theta === segments ? vertices[y * (segments + 1) * 3 + 2] :
               Math.sin(angle) * (holderDiameter/2 + pattern)
      vertices.push(x, yPos, z)

      // Calculate normals with twist
      const nx = Math.cos(angle)
      const ny = holderTwist * 0.2 + pattern * 0.1
      const nz = Math.sin(angle)
      const len = Math.sqrt(nx*nx + ny*ny + nz*nz)
      normals.push(nx/len, ny/len, nz/len)
    }
  }

  // Generate indices for the surface
  for (let y = 0; y < segments; y++) {
    for (let theta = 0; theta < segments; theta++) {
      const current = y * (segments + 1) + theta
      const next = current + segments + 1
      
      indices.push(
        current, next, current + 1,
        current + 1, next, next + 1
      )
    }
  }

  // Add bottom vertices
  const bottomY = 0
  const bottomStartIdx = vertices.length / 3
  
  // Center point for bottom
  vertices.push(0, bottomY, 0)
  normals.push(0, -1, 0)

  // Bottom rim vertices
  for (let theta = 0; theta <= segments; theta++) {
    const angle = (theta / segments) * Math.PI * 2
    // For the last vertex, use the same coordinates as the first vertex
    const x = theta === segments ? vertices[bottomStartIdx * 3 + 3] :
             Math.cos(angle) * (holderDiameter/2)
    const z = theta === segments ? vertices[bottomStartIdx * 3 + 5] :
             Math.sin(angle) * (holderDiameter/2)
    
    vertices.push(x, bottomY, z)
    normals.push(0, -1, 0)
  }

  // Add bottom face indices
  for (let i = 0; i < segments; i++) {
    indices.push(
      bottomStartIdx,
      bottomStartIdx + 1 + i,
      bottomStartIdx + 2 + i
    )
  }

  // Connect bottom edge to side wall
  for (let i = 0; i < segments; i++) {
    const bottomVertex = bottomStartIdx + 1 + i
    const sideVertex = i
    const nextBottomVertex = bottomStartIdx + 2 + i
    const nextSideVertex = i + 1
    
    indices.push(
      bottomVertex, sideVertex, nextBottomVertex,
      nextBottomVertex, sideVertex, nextSideVertex
    )
  }

  return { vertices, indices, normals }
}

function generateBowlGeometry(params: BowlParams) {
  const { 
    height: bowlHeightInches, 
    diameter: bowlDiameterInches, 
    patternType: bowlPatternType, 
    patternScale: bowlPatternScale, 
    patternDepth: bowlPatternDepth, 
    twist: bowlTwist 
  } = params
  const bowlHeight = inchesToCm(bowlHeightInches)
  const bowlDiameter = inchesToCm(bowlDiameterInches)
  const segments = 64
  const vertices: number[] = []
  const indices: number[] = []
  const normals: number[] = []

  // Generate vertices for the bowl surface with a more curved profile
  for (let y = 0; y <= segments; y++) {
    const v = y / segments
    // Modified curve for bowl shape - more curved at bottom, wider at top
    const yPos = bowlHeight * Math.pow(v, 0.7)

    // Calculate twist angle for this height
    const twistAngle = v * bowlTwist * Math.PI * 2
    
    for (let theta = 0; theta <= segments; theta++) {
      const angle = (theta / segments) * Math.PI * 2 + twistAngle
      
      // Apply pattern to the surface
      let pattern = 0
      if (yPos < bowlHeight - 0.5) { // Don't apply pattern near the rim
        switch (bowlPatternType) {
          case 'geometric':
            pattern = Math.abs(Math.sin(theta * bowlPatternScale + v * bowlPatternScale * 8)) * bowlPatternDepth
            break
          case 'stars':
            pattern = Math.pow(Math.sin(theta * bowlPatternScale * 2) * Math.cos(v * bowlPatternScale * 8), 2) * bowlPatternDepth
            break
          case 'leaves':
            pattern = Math.sin(theta * bowlPatternScale + v * bowlPatternScale * 6) * bowlPatternDepth
            break
          case 'abstract':
            pattern = (Math.sin(theta * bowlPatternScale * 3) * Math.sin(v * bowlPatternScale * 4)) * bowlPatternDepth
            break
        }
      }

      // Calculate radius with bowl curve - wider at top
      const radiusMultiplier = 1 + (v * 0.2) // Gradually increases radius towards the top
      const x = theta === segments ? vertices[y * (segments + 1) * 3] :
               Math.cos(angle) * ((bowlDiameter/2) * radiusMultiplier + pattern)
      const z = theta === segments ? vertices[y * (segments + 1) * 3 + 2] :
               Math.sin(angle) * ((bowlDiameter/2) * radiusMultiplier + pattern)
      vertices.push(x, yPos, z)

      // Calculate normals with twist
      const nx = Math.cos(angle)
      const ny = bowlTwist * 0.2 + (0.3 - v * 0.2)
      const nz = Math.sin(angle)
      const len = Math.sqrt(nx*nx + ny*ny + nz*nz)
      normals.push(nx/len, ny/len, nz/len)
    }
  }

  // Rest of the geometry generation is the same as cup
  // Generate indices for the surface
  for (let y = 0; y < segments; y++) {
    for (let theta = 0; theta < segments; theta++) {
      const current = y * (segments + 1) + theta
      const next = current + segments + 1
      
      indices.push(
        current, next, current + 1,
        current + 1, next, next + 1
      )
    }
  }

  // Add bottom vertices
  const bottomY = 0
  const bottomStartIdx = vertices.length / 3
  
  // Center point for bottom
  vertices.push(0, bottomY, 0)
  normals.push(0, -1, 0)

  // Bottom rim vertices
  for (let theta = 0; theta <= segments; theta++) {
    const angle = (theta / segments) * Math.PI * 2
    const x = theta === segments ? vertices[bottomStartIdx * 3 + 3] :
             Math.cos(angle) * (bowlDiameter/2)
    const z = theta === segments ? vertices[bottomStartIdx * 3 + 5] :
             Math.sin(angle) * (bowlDiameter/2)
    
    vertices.push(x, bottomY, z)
    normals.push(0, -1, 0)
  }

  // Add bottom face indices
  for (let i = 0; i < segments; i++) {
    indices.push(
      bottomStartIdx,
      bottomStartIdx + 1 + i,
      bottomStartIdx + 2 + i
    )
  }

  // Connect bottom edge to side wall
  for (let i = 0; i < segments; i++) {
    const bottomVertex = bottomStartIdx + 1 + i
    const sideVertex = i
    const nextBottomVertex = bottomStartIdx + 2 + i
    const nextSideVertex = i + 1
    
    indices.push(
      bottomVertex, sideVertex, nextBottomVertex,
      nextBottomVertex, sideVertex, nextSideVertex
    )
  }

  return { vertices, indices, normals }
}

function ParametricShape({ params, meshRef }: ParametricShapeProps) {
  const generateGeometry = useCallback(() => {
    switch (params.type) {
      case 'coaster':
        return generateCoasterGeometry(params)
      case 'wallArt':
        return generateWallArtGeometry(params)
      case 'candleHolder':
        return generateCandleHolderGeometry(params)
      case 'bowl':
        return generateBowlGeometry(params)
      default:
        return generateStandardGeometry(params)
    }
  }, [params])

  const geometry = generateGeometry()
  const materialConfig = materials[params.material]

  if (!materialConfig) {
    console.warn(`Material ${params.material} not found, falling back to matte`)
    return (
      <group>
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
          <meshStandardMaterial {...materials.matte.props} />
        </mesh>
      </group>
    )
  }

  return (
    <group>
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
        {materialConfig.type === "basic" ? (
          <meshBasicMaterial {...materialConfig.props} />
      ) : (
        <meshStandardMaterial {...materialConfig.props} />
      )}
    </mesh>
    </group>
  )
}

interface TransmissionMaterialProps {
  transmission: number;
  thickness: number;
  roughness: number;
  ior: number;
  attenuationDistance?: number;
  attenuationColor?: string;
  opacity: number;
  transparent: boolean;
  side: typeof DoubleSide;
}

function generateTransmissionMaterial(params: TransmissionMaterialProps) {
  return (
    <meshPhysicalMaterial
      transmission={params.transmission}
      thickness={params.thickness}
      roughness={params.roughness}
      ior={params.ior}
      attenuationDistance={params.attenuationDistance}
      attenuationColor={params.attenuationColor}
      opacity={params.opacity}
      transparent={params.transparent}
      side={params.side}
    />
  );
}

function generatePattern(x: number, y: number, patternType: string, scale: number): number {
  switch (patternType) {
    case 'waves':
      return Math.sin(x * scale + y * scale) * 0.5;
    case 'geometric':
      return (Math.abs(Math.sin(x * scale)) + Math.abs(Math.cos(y * scale))) * 0.5;
    case 'organic':
      return Math.sin(x * scale + Math.cos(y * scale)) * 0.5;
    default:
      return 0;
  }
}

export default function Component() {
  const [currentCategory, setCurrentCategory] = useState<keyof typeof categories>("lampshade")
  const [shapeParams, setShapeParams] = useState<ShapeParams>(categories[currentCategory].defaults)
  const [selectedSize, setSelectedSize] = useState<keyof CategoryPriceInfo>('small')
  const [isLoading, setIsLoading] = useState(false)
  const [key, setKey] = useState(0)
  const meshRef = useRef<THREE.Mesh>(null)
  const [customOrderEmail, setCustomOrderEmail] = useState("")
  const [showCustomOrderModal, setShowCustomOrderModal] = useState(false)

  const handleExportSTL = useCallback(async () => {
    if (!meshRef.current) {
      console.error('No mesh reference found')
      return
    }
    
    try {
      setIsLoading(true)
      console.log('Generating STL data...')
      
      // Generate STL data
      const exporter = new STLExporter()
      const mesh = meshRef.current
      const geometry = mesh.geometry.clone()
      const material = mesh.material
      const exportMesh = new THREE.Mesh(geometry, material)
      const stl = exporter.parse(exportMesh)
      
      // Create blob and trigger download
      const blob = new Blob([stl], { type: 'application/sla' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${currentCategory}_3d_model.stl`
      document.body.appendChild(a)
      a.click()
      URL.revokeObjectURL(url)
      document.body.removeChild(a)
      
    } catch (error) {
      console.error('Error in handleExportSTL:', error)
      alert('An error occurred while processing your request. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }, [meshRef, currentCategory])

  const handleBuyNow = useCallback(async () => {
    const category = categories[currentCategory]
    const priceInfo = category.priceInfo[selectedSize]
    if (!priceInfo) return

    try {
      setIsLoading(true)
      const response = await fetch(`/api/checkout?priceId=${priceInfo.priceId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          priceId: priceInfo.priceId,
          mode: 'payment',
          shipping_address_collection: { allowed_countries: ['US'] },
          productName: currentCategory,
        })
      })
      const data = await response.json()
      
      if (data.url) {
        window.location.href = data.url
      } else {
        console.error('No checkout URL returned')
      }
    } catch (error) {
      console.error('Error creating checkout session:', error)
    } finally {
      setIsLoading(false)
    }
  }, [currentCategory, selectedSize])

  const updateParam = (paramId: string, value: number | string) => {
    setShapeParams((prev) => {
      if (paramId === 'patternType' && prev.type === 'coaster') {
        return {
          ...prev,
          patternType: value as CoasterShapeParams['patternType']
        }
      }
      return {
      ...prev,
      [paramId]: value,
      } as ShapeParams
    })
    setKey((k) => k + 1)
  }

  const switchCategory = (categoryId: string) => {
    setCurrentCategory(categoryId as keyof typeof categories)
    setShapeParams(categories[categoryId as keyof typeof categories].defaults)
    setKey((k) => k + 1)
  }

  const handleCustomOrder = useCallback(async () => {
    if (!meshRef.current || !customOrderEmail) return
    
    try {
      setIsLoading(true)
      
      const exporter = new STLExporter()
      const mesh = meshRef.current
      const geometry = mesh.geometry.clone()
      const material = mesh.material
      const exportMesh = new THREE.Mesh(geometry, material)
      const stl = exporter.parse(exportMesh)
      
      // Create blob and form data
      const blob = new Blob([stl], { type: 'text/plain' })
      const formData = new FormData()
      formData.append('file', blob, `${currentCategory}_3d_model.stl`)
      formData.append('email', customOrderEmail)
      formData.append('productName', currentCategory)
      
      // Send request to our API endpoint
      const response = await fetch('/api/send-custom-order', {
        method: 'POST',
        body: formData
      })
      
      if (!response.ok) {
        throw new Error('Failed to send custom order request')
      }
      
      // Close modal and show success message
      setShowCustomOrderModal(false)
      alert('Custom order request sent successfully! We will contact you soon.')
    } catch (error) {
      console.error('Error sending custom order:', error)
      alert('Failed to send custom order request. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }, [meshRef, currentCategory, customOrderEmail])

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
          </div>
          <p className="text-zinc-400 text-sm">{categories[currentCategory].description}</p>
        </header>

        <div>
          <h2 className="text-lg font-semibold mb-4">Products</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
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

        <div className="flex-1 grid lg:grid-cols-[1fr_320px] gap-8">
          <div className="relative rounded-2xl overflow-hidden bg-zinc-800/50 backdrop-blur-sm border border-white/10 h-[50vh] lg:h-[600px]">
            <div className="absolute inset-0">
              <Canvas camera={{ position: [40, 20, 40], fov: 45 }} className="w-full h-full">
                <Suspense fallback={null}>
                  <Scene key={key} params={{ ...shapeParams, meshRef }} />
                </Suspense>
              </Canvas>
            </div>
          </div>

          <div className="space-y-8">
            <div className="space-y-6 bg-zinc-800/50 backdrop-blur-sm border border-white/10 p-6 rounded-xl">
              <h3 className="text-lg font-semibold">Design</h3>
              <div className="space-y-6">
                <div className="space-y-3">
                  <Label className="text-sm font-medium">Rendering</Label>
                  <Select value={shapeParams.material} onValueChange={(value) => updateParam("material", value)}>
                    <SelectTrigger className="bg-zinc-900 border-zinc-700 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent position="popper" side="bottom" className="bg-zinc-900 border-zinc-700">
                      <SelectItem value="shiny" className="text-white hover:bg-zinc-800">Shiny</SelectItem>
                      <SelectItem value="matte" className="text-white hover:bg-zinc-800">Matte</SelectItem>
                      <SelectItem value="wireframe" className="text-white hover:bg-zinc-800">Wireframe</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {(shapeParams.type === 'coaster' || shapeParams.type === 'wallArt' || shapeParams.type === 'candleHolder') && (
                  <div className="space-y-3">
                    <Label className="text-sm font-medium">Pattern Type</Label>
                    <Select 
                      value={
                        shapeParams.type === 'coaster' ? shapeParams.patternType :
                        shapeParams.type === 'wallArt' ? shapeParams.patternType :
                        shapeParams.type === 'candleHolder' ? shapeParams.patternType :
                        undefined
                      }
                      onValueChange={(value) => updateParam("patternType", value)}
                    >
                      <SelectTrigger className="bg-zinc-900 border-zinc-700 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-zinc-900 border-zinc-700">
                        {shapeParams.type === 'coaster' && (
                          <>
                            <SelectItem value="hexagonal" className="text-white hover:bg-zinc-800">Hexagonal</SelectItem>
                            <SelectItem value="spiral" className="text-white hover:bg-zinc-800">Spiral</SelectItem>
                            <SelectItem value="concentric" className="text-white hover:bg-zinc-800">Concentric</SelectItem>
                            <SelectItem value="floral" className="text-white hover:bg-zinc-800">Floral</SelectItem>
                            <SelectItem value="ripple" className="text-white hover:bg-zinc-800">Ripple</SelectItem>
                            <SelectItem value="maze" className="text-white hover:bg-zinc-800">Maze</SelectItem>
                          </>
                        )}
                        {shapeParams.type === 'wallArt' && (
                          <>
                            <SelectItem value="mandala" className="text-white hover:bg-zinc-800">Mandala</SelectItem>
                            <SelectItem value="wave" className="text-white hover:bg-zinc-800">Wave</SelectItem>
                            <SelectItem value="honeycomb" className="text-white hover:bg-zinc-800">Honeycomb</SelectItem>
                            <SelectItem value="circuit" className="text-white hover:bg-zinc-800">Circuit</SelectItem>
                            <SelectItem value="organic" className="text-white hover:bg-zinc-800">Organic</SelectItem>
                          </>
                        )}
                        {shapeParams.type === 'candleHolder' && (
                          <>
                            <SelectItem value="geometric" className="text-white hover:bg-zinc-800">Geometric Lines</SelectItem>
                            <SelectItem value="stars" className="text-white hover:bg-zinc-800">Diamond Grid</SelectItem>
                            <SelectItem value="leaves" className="text-white hover:bg-zinc-800">Wave Texture</SelectItem>
                            <SelectItem value="abstract" className="text-white hover:bg-zinc-800">Dotted</SelectItem>
                          </>
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {shapeParams.type === 'bowl' && (
                  <div className="space-y-3">
                    <Label className="text-sm font-medium">Pattern Type</Label>
                    <Select 
                      value={shapeParams.patternType}
                      onValueChange={(value) => updateParam("patternType", value)}
                    >
                      <SelectTrigger className="bg-zinc-900 border-zinc-700 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-zinc-900 border-zinc-700">
                        <SelectItem value="geometric" className="text-white hover:bg-zinc-800">Geometric Lines</SelectItem>
                        <SelectItem value="stars" className="text-white hover:bg-zinc-800">Diamond Grid</SelectItem>
                        <SelectItem value="leaves" className="text-white hover:bg-zinc-800">Wave Texture</SelectItem>
                        <SelectItem value="abstract" className="text-white hover:bg-zinc-800">Dotted</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {getControlsForType(shapeParams.type, shapeParams).map((control) => (
                  <div key={control.id} className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-medium">{control.label}</Label>
                      <span className="text-xs text-zinc-400">
                        {typeof (shapeParams as any)[control.id] === 'number' 
                          ? (shapeParams as any)[control.id].toFixed(control.step === 0.1 ? 1 : 0)
                          : ''}
                      </span>
                    </div>
                    <Slider
                      value={[(shapeParams as any)[control.id]]}
                      onValueChange={([value]) => updateParam(control.id as any, value)}
                      min={control.min}
                      max={control.max}
                      step={control.step}
                      className="[&_[role=slider]]:h-4 [&_[role=slider]]:w-4"
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-6 bg-zinc-800/50 backdrop-blur-sm border border-white/10 p-6 rounded-xl">
              <h3 className="text-lg font-semibold">Pricing</h3>
              <div className="space-y-6">
                <div className="space-y-3">
                  <Label className="text-sm font-medium">Size</Label>
                  <Select 
                    value={selectedSize}
                    onValueChange={(value: keyof CategoryPriceInfo) => setSelectedSize(value)}
                  >
                    <SelectTrigger className="bg-zinc-900 border-zinc-700 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent position="popper" side="bottom" className="bg-zinc-900 border-zinc-700">
                      {Object.entries(categories[currentCategory].priceInfo).map(([size, info]) => (
                        <SelectItem 
                          key={size} 
                          value={size} 
                          className="text-white hover:bg-zinc-800"
                        >
                          {size.charAt(0).toUpperCase() + size.slice(1)} ({info.dimensions})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-zinc-400 mt-1">Note: Sizes fit within the specified bounding box dimensions</p>
                  
                  <div className="flex justify-between items-center mt-4">
                    <span className="text-lg font-semibold">
                      ${categories[currentCategory].priceInfo[selectedSize]?.price.toFixed(2)}
                    </span>
                    <Button
                      onClick={handleBuyNow}
                      disabled={isLoading}
                      className="bg-blue-500 hover:bg-blue-600 text-white"
                    >
                      {isLoading ? 'Loading...' : 'Buy Now'}
                    </Button>
                  </div>

                  <div className="mt-4 pt-4 border-t border-zinc-700">
                    <Button
                      onClick={handleExportSTL}
                      disabled={isLoading}
                      className="w-full bg-blue-500 hover:bg-blue-600 text-white flex items-center justify-center gap-2"
                    >
                      <Download className="w-4 h-4" />
                      Download STL
                    </Button>
                  </div>

                  <div className="mt-4 pt-4 border-t border-zinc-700">
                    <Label className="text-sm font-medium mb-2 block">Want these exact dimensions?</Label>
                    <Button
                      onClick={() => setShowCustomOrderModal(true)}
                      className="w-full bg-blue-500 hover:bg-blue-600 text-white"
                    >
                      Request Custom Order
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Custom Order Modal */}
      {showCustomOrderModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-zinc-800 p-6 rounded-xl max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Custom Order Request</h3>
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium">Your Email</Label>
                <input
                  type="email"
                  value={customOrderEmail}
                  onChange={(e) => setCustomOrderEmail(e.target.value)}
                  className="w-full mt-1 px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-md text-white"
                  placeholder="Enter your email"
                />
              </div>
              <div className="flex gap-3">
                <Button
                  onClick={() => setShowCustomOrderModal(false)}
                  variant="outline"
                  className="flex-1 bg-zinc-700 hover:bg-zinc-600 text-white border-zinc-600"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleCustomOrder}
                  disabled={!customOrderEmail}
                  className="flex-1 bg-blue-500 hover:bg-blue-600 text-white"
                >
                  Send Request
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}


