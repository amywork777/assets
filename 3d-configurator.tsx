"use client"

import { useState, useRef, Suspense, useCallback, useEffect } from "react"
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
  cylinderBase: {
    name: "Base",
    description: "Solid bases for lamps, vases, or display stands. Simple, clean design with top and bottom closed. Choose from cylinder, star, or square shapes. For custom dimensions or special requests, use our Custom Order button.",
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
      type: "cylinderBase",
      shape: "cylinder",
      material: "matte",
      height: 8,
      diameter: 10,
      flowerPetals: 5,
      petalPointiness: 0.8,
    },
  },
  phoneHolder: {
    name: "Phone Holder",
    description: "A customizable phone holder for your desk.",
    priceInfo: {
      small: {
        dimensions: "4 x 4 x 5 in",
        price: 18.99,
        priceId: "price_1Ot41TI0wQgEQ20bwwJFuJZt"
      },
      medium: {
        dimensions: "5 x 5 x 6 in",
        price: 24.99,
        priceId: "price_1Ot42FI0wQgEQ20bYkHPLKAO"
      }
    },
    defaults: {
      type: 'phoneHolder',
      material: 'shiny',
      baseWidth: 4,
      baseDepth: 4,
      height: 5,
      angle: 60,
      phoneThickness: 0.5,
      lipHeight: 0.75,
      cableOpening: true,
      standThickness: 0.8, // Default thickness of 0.8 inches (thicker than before)
    }
  },
  bracelet: {
    name: "Bracelet",
    description: "A customizable bracelet with opening for your wrist.",
    priceInfo: {
      small: {
        dimensions: "2.5 x 0.25 x 0.3 in",
        price: 19.99,
        priceId: "price_1Ot42FI0wQgEQ20bYkHPLKAO"
      },
      medium: {
        dimensions: "2.8 x 0.3 x 0.4 in",
        price: 24.99,
        priceId: "price_1Ot42FI0wQgEQ20bYkHPLKAO"
      }
    },
    defaults: {
      type: 'bracelet',
      material: 'shiny',
      innerDiameter: 2.5,
      thickness: 0.25,
      width: 0.3,
      gapSize: 40, // 40 degrees opening
      patternType: 'plain',
      patternDepth: 0.1,
      patternScale: 0.5
    }
  },
  pencilHolder: {
    name: "Pencil Holder",
    description: "A customizable container for pens, pencils, and stationery.",
    priceInfo: {
      small: {
        dimensions: "3 x 3 x 3.5 in",
        price: 19.99,
        priceId: "price_1Ot42FI0wQgEQ20bYkHPLKAO"
      },
      medium: {
        dimensions: "3.5 x 3.5 x 4 in",
        price: 24.99,
        priceId: "price_1Ot42FI0wQgEQ20bYkHPLKAO"
      }
    },
    defaults: {
      type: 'pencilHolder',
      shape: 'square',
      material: 'shiny',
      height: 3.5,
      diameter: 3,
      wallThickness: 0.2,
      dividerType: 'grid',
      dividerCount: 2,
      hasBottom: true
    }
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
    case 'cylinderBase':
      return [
        { id: "height" as const, label: "Height (in)", min: 2, max: 15, step: 0.1 },
        { id: "diameter" as const, label: "Diameter (in)", min: 2, max: 12, step: 0.1 },
        ...((shapeParams.type === 'cylinderBase' && shapeParams.shape === 'flower') ? [
          { id: "flowerPetals" as const, label: "Flower Petals", min: 3, max: 16, step: 1 },
          { id: "petalPointiness" as const, label: "Petal Pointiness", min: 0.2, max: 0.95, step: 0.05 },
        ] : [])
      ] as const
    case 'phoneHolder':
      return [
        { id: "baseWidth" as const, label: "Base Width (in)", min: 6, max: 15, step: 0.1 },
        { id: "baseDepth" as const, label: "Base Depth (in)", min: 6, max: 12, step: 0.1 },
        { id: "height" as const, label: "Height (in)", min: 3, max: 10, step: 0.1 },
        { id: "angle" as const, label: "Angle (degrees)", min: 45, max: 85, step: 1 },
        { id: "phoneThickness" as const, label: "Phone Slot Width (in)", min: 0.3, max: 1.5, step: 0.05 },
        { id: "lipHeight" as const, label: "Lip Height (in)", min: 0.5, max: 2.5, step: 0.1 },
        { id: "standThickness" as const, label: "Stand Thickness (in)", min: 0.4, max: 2.0, step: 0.1 }
      ] as const
    case 'bracelet':
      return [
        { id: "innerDiameter" as const, label: "Inner Diameter (in)", min: 2.2, max: 3.2, step: 0.1 },
        { id: "thickness" as const, label: "Thickness (in)", min: 0.15, max: 0.4, step: 0.05 },
        { id: "width" as const, label: "Width (in)", min: 0.2, max: 0.6, step: 0.05 },
        { id: "gapSize" as const, label: "Opening Size", min: 20, max: 60, step: 5 },
        { id: "patternDepth" as const, label: "Pattern Depth", min: 0, max: 0.15, step: 0.01 },
        { id: "patternScale" as const, label: "Pattern Scale", min: 0.2, max: 2, step: 0.1 }
      ] as const
    case 'pencilHolder':
      return [
        { id: "height" as const, label: "Height (in)", min: 2, max: 6, step: 0.25 },
        { id: "diameter" as const, label: "Diameter/Width (in)", min: 2, max: 5, step: 0.25 },
        { id: "wallThickness" as const, label: "Wall Thickness (in)", min: 0.1, max: 0.4, step: 0.05 },
        { id: "dividerCount" as const, label: "Grid Size", min: 2, max: 4, step: 1 }
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

interface CylinderBaseParams extends BaseShapeParams {
  type: 'cylinderBase'
  shape: 'cylinder' | 'flower' | 'square'
  height: number
  diameter: number
  flowerPetals?: number   // Number of petals when shape is 'flower'
  petalPointiness?: number  // How pointy the petals are (0-1) when shape is 'flower'
}

interface PhoneHolderParams extends BaseShapeParams {
  type: 'phoneHolder';
  baseWidth: number;
  baseDepth: number;
  height: number;
  angle: number;
  phoneThickness: number;
  lipHeight: number;
  cableOpening: boolean;
  standThickness: number; // New parameter for controlling the angled part thickness
}

interface BraceletParams extends BaseShapeParams {
  type: 'bracelet';
  innerDiameter: number; // Inner diameter in inches
  thickness: number; // Thickness in inches
  width: number; // Width in inches
  gapSize: number; // Size of the opening gap in degrees (0-180)
  patternType: 'plain' | 'waves' | 'geometric' | 'organic';
  patternDepth: number; // How deep the pattern goes
  patternScale: number; // Scale of the pattern
}

interface PencilHolderParams extends BaseShapeParams {
  type: 'pencilHolder';
  shape: 'circle' | 'square'; // Shape of the pencil holder
  height: number; // Height in inches
  diameter: number; // Outer diameter/width in inches
  wallThickness: number; // Wall thickness in inches
  dividerType: 'none' | 'single' | 'cross' | 'grid'; // Type of divider
  dividerCount: number; // Number of dividers (for grid type)
  hasBottom: boolean; // Whether the pencil holder has a bottom
}

type ShapeParams = StandardShapeParams | CoasterShapeParams | WallArtParams | CandleHolderParams | BowlParams | CylinderBaseParams | PhoneHolderParams | BraceletParams | PencilHolderParams

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

function generateCylinderBaseGeometry(params: CylinderBaseParams) {
  const { height, diameter, shape, flowerPetals, petalPointiness } = params;
  
  // Default values for flower parameters if not provided
  const petals = flowerPetals || 5;
  const pointiness = petalPointiness || 0.6;
  
  const vertices: number[] = [];
  const indices: number[] = [];
  const normals: number[] = [];
  
  const segments = 72;
  const radius = diameter / 2;
  
  // Generate sides (now we create both top and bottom rows of vertices)
  for (let y = 0; y <= 1; y++) {
    const yPos = y * height; // 0 or height
    
    for (let i = 0; i <= segments; i++) {
      const theta = i / segments;
      const angle = theta * Math.PI * 2;
      
      // Default to cylinder shape
      let x = Math.cos(angle) * radius;
      let z = Math.sin(angle) * radius;
      
      // Calculate x and z coordinates based on shape
      if (shape === 'flower') {
        // Create a flower shape with sharp, distinct petals
        const innerRadius = radius * (1 - pointiness);
        
        // Calculate exact position in the flower pattern
        const anglePerPoint = (2 * Math.PI) / petals;
        const pointAngle = Math.floor(angle / anglePerPoint) * anglePerPoint;
        
        // Calculate how far we are from a point (0 = at point, 1 = at valley)
        let pointDistance;
        if (angle < pointAngle + anglePerPoint / 2) {
          // Between point and valley
          pointDistance = (angle - pointAngle) / (anglePerPoint / 2);
        } else {
          // Between valley and next point
          pointDistance = 1 - ((angle - (pointAngle + anglePerPoint / 2)) / (anglePerPoint / 2));
        }
        
        // Apply a sharpness factor to create more distinctive points
        const sharpness = 2.5;
        pointDistance = Math.pow(pointDistance, sharpness);
        
        // Interpolate between outer and inner radius
        const currentRadius = radius - (pointDistance * (radius - innerRadius));
        
        x = Math.cos(angle) * currentRadius;
        z = Math.sin(angle) * currentRadius;
      } else if (shape === 'square') {
        // Create a square shape
        const absX = Math.abs(Math.cos(angle));
        const absZ = Math.abs(Math.sin(angle));
        const maxVal = Math.max(absX, absZ);
        x = (Math.cos(angle) / maxVal) * radius;
        z = (Math.sin(angle) / maxVal) * radius;
      }
      
      vertices.push(x, yPos, z);
      
      // Calculate normals - simplification for non-cylinder shapes
      let nx = Math.cos(angle);
      let nz = Math.sin(angle);
      
      if (shape !== 'cylinder') {
        // For flower and square, use the direction vector from center
        const len = Math.sqrt(x * x + z * z);
        if (len > 0) {
          nx = x / len;
          nz = z / len;
        }
      }
      
      normals.push(nx, 0, nz);
    }
  }
  
  // Generate indices for the sides
  for (let i = 0; i < segments; i++) {
    const bottomLeft = i;
    const bottomRight = i + 1;
    const topLeft = i + segments + 1;
    const topRight = i + segments + 2;
    
    indices.push(
      bottomLeft, topLeft, bottomRight,
      bottomRight, topLeft, topRight
    );
  }
  
  // Add bottom cap
  const bottomCenterIdx = vertices.length / 3;
  
  // Center point for bottom
  vertices.push(0, 0, 0);
  normals.push(0, -1, 0);
  
  // Bottom rim vertices are already created in the sides loop
  // We just need to create the triangles connecting to the center
  for (let i = 0; i < segments; i++) {
    indices.push(
      bottomCenterIdx,
      i + 1,
      i
    );
  }
  
  // Add top cap
  const topCenterIdx = vertices.length / 3;
  
  // Center point for top
  vertices.push(0, height, 0);
  normals.push(0, 1, 0);
  
  // Top rim vertices are already created in the sides loop
  // Create triangles connecting to the center
  const topRowStart = segments + 1;
  for (let i = 0; i < segments; i++) {
    indices.push(
      topCenterIdx,
      topRowStart + i,
      topRowStart + i + 1
    );
  }
  
  return { vertices, indices, normals };
}

function generatePhoneHolderGeometry(params: PhoneHolderParams) {
  const {
    baseWidth: baseWidthInches,
    baseDepth: baseDepthInches,
    height: heightInches,
    angle,
    phoneThickness: phoneThicknessInches,
    lipHeight: lipHeightInches,
    cableOpening,
    standThickness: standThicknessInches
  } = params;
  
  // Convert to cm
  const baseWidth = inchesToCm(baseWidthInches);
  const baseDepth = inchesToCm(baseDepthInches);
  const height = inchesToCm(heightInches);
  const phoneThickness = inchesToCm(phoneThicknessInches);
  const lipHeight = inchesToCm(lipHeightInches);
  const standThickness = inchesToCm(standThicknessInches);
  
  // Calculate dimensions
  const baseThickness = 1.5; // cm - thickness of the base
  const standWidth = baseWidth * 0.8; // 80% of base width
  const standHeight = height;
  const lipWidth = standWidth;
  
  const vertices: number[] = [];
  const indices: number[] = [];
  const normals: number[] = [];
  
  // --- BASE ---
  // Define the base - a solid rectangular prism
  // Base vertices - bottom face
  vertices.push(
    -baseWidth/2, 0, -baseDepth/2,  // 0: bottom left back
    baseWidth/2, 0, -baseDepth/2,   // 1: bottom right back
    baseWidth/2, 0, baseDepth/2,    // 2: bottom right front
    -baseWidth/2, 0, baseDepth/2    // 3: bottom left front
  );
  
  // Base normals - all pointing down
  for (let i = 0; i < 4; i++) {
    normals.push(0, -1, 0);
  }
  
  // Base top face vertices
  vertices.push(
    -baseWidth/2, baseThickness, -baseDepth/2,  // 4: top left back
    baseWidth/2, baseThickness, -baseDepth/2,   // 5: top right back
    baseWidth/2, baseThickness, baseDepth/2,    // 6: top right front
    -baseWidth/2, baseThickness, baseDepth/2    // 7: top left front
  );
  
  // Base top normals - all pointing up
  for (let i = 0; i < 4; i++) {
    normals.push(0, 1, 0);
  }
  
  // Base indices - connect bottom and top faces, creating a closed mesh
  indices.push(
    // Bottom face
    0, 1, 2,
    0, 2, 3,
    
    // Top face
    4, 6, 5,
    4, 7, 6,
    
    // Side faces - ensure all sides are closed
    0, 4, 1, // back-left to back-right (bottom to top)
    1, 4, 5,
    
    1, 5, 2, // back-right to front-right
    2, 5, 6,
    
    2, 6, 3, // front-right to front-left
    3, 6, 7,
    
    3, 7, 0, // front-left to back-left
    0, 7, 4
  );
  
  // --- ANGLED STAND ---
  // Create an angled back panel for the phone support with specified thickness
  const radianAngle = (angle * Math.PI) / 180;
  const standStartIndex = vertices.length / 3;
  
  // Base of the stand at the back of the base
  const standBaseZ = -baseDepth/4;
  
  // Calculate stand height based on angle
  const standTopY = baseThickness + standHeight;
  const standTopZ = standBaseZ - standHeight / Math.tan(radianAngle);
  
  // Create the front face of the stand (at an angle)
  vertices.push(
    -standWidth/2, baseThickness, standBaseZ,                // 0: Bottom left
    standWidth/2, baseThickness, standBaseZ,                 // 1: Bottom right
    -standWidth/2, standTopY, standTopZ,                     // 2: Top left
    standWidth/2, standTopY, standTopZ                       // 3: Top right
  );
  
  // Normal pointing outward from the angled panel (front face)
  const nx = 0;
  const ny = Math.sin(radianAngle);
  const nz = -Math.cos(radianAngle);
  
  for (let i = 0; i < 4; i++) {
    normals.push(nx, ny, nz);
  }
  
  // Create back face of the stand with proper thickness
  // Instead of offsetting along the angle, we extrude straight back in Z direction
  // for a more natural thickness
  const backOffsetZ = -standThickness; // Extrude directly back in Z direction
  
  // Back face vertices - directly behind front face but offset in Z
  vertices.push(
    -standWidth/2, baseThickness, standBaseZ + backOffsetZ,          // 4: Bottom left
    standWidth/2, baseThickness, standBaseZ + backOffsetZ,           // 5: Bottom right
    -standWidth/2, standTopY, standTopZ + backOffsetZ,               // 6: Top left
    standWidth/2, standTopY, standTopZ + backOffsetZ                 // 7: Top right
  );
  
  // Back face normal - same as front face but pointing opposite direction
  for (let i = 0; i < 4; i++) {
    normals.push(-nx, -ny, -nz);
  }
  
  // Connect all faces of the stand to create a watertight volume
  indices.push(
    // Front face
    standStartIndex, standStartIndex + 2, standStartIndex + 1,
    standStartIndex + 1, standStartIndex + 2, standStartIndex + 3,
    
    // Back face
    standStartIndex + 4, standStartIndex + 5, standStartIndex + 6,
    standStartIndex + 5, standStartIndex + 7, standStartIndex + 6,
    
    // Left edge (side face)
    standStartIndex, standStartIndex + 4, standStartIndex + 2,
    standStartIndex + 2, standStartIndex + 4, standStartIndex + 6,
    
    // Right edge (side face)
    standStartIndex + 1, standStartIndex + 3, standStartIndex + 5,
    standStartIndex + 3, standStartIndex + 7, standStartIndex + 5,
    
    // Bottom edge (connecting to base)
    standStartIndex, standStartIndex + 1, standStartIndex + 4,
    standStartIndex + 1, standStartIndex + 5, standStartIndex + 4,
    
    // Top edge
    standStartIndex + 2, standStartIndex + 6, standStartIndex + 3,
    standStartIndex + 3, standStartIndex + 6, standStartIndex + 7
  );
  
  // --- PHONE LIP ---
  // Position the lip forward from the center
  const lipZ = baseDepth/3;
  
  // Set front and back Z positions for the phone slot
  const frontZ = lipZ;
  const backZ = lipZ - phoneThickness;
  
  if (cableOpening) {
    // SIMPLIFIED APPROACH: Using three separate rectangular prisms
    // Calculate dimensions for the cable opening
    const openingWidth = lipWidth * 0.6; // 60% of lip width for the opening
    
    // 1. Left vertical rectangle of the lip
    const leftLipStartIndex = vertices.length / 3;
    
    // Define dimensions
    const leftLipWidth = (lipWidth - openingWidth) / 2; // Half the non-opening width
    const leftLipX = -lipWidth/2; // Left edge of the lip
    const rightLipX = leftLipX + leftLipWidth; // Right edge of left lip section
    
    // Front face vertices (perfectly rectangular)
    vertices.push(
      leftLipX, baseThickness, frontZ,                     // 0: Bottom left
      rightLipX, baseThickness, frontZ,                    // 1: Bottom right
      leftLipX, baseThickness + lipHeight, frontZ,         // 2: Top left
      rightLipX, baseThickness + lipHeight, frontZ         // 3: Top right
    );
    
    // Back face vertices
    vertices.push(
      leftLipX, baseThickness, backZ,                      // 4: Bottom left
      rightLipX, baseThickness, backZ,                     // 5: Bottom right
      leftLipX, baseThickness + lipHeight, backZ,          // 6: Top left
      rightLipX, baseThickness + lipHeight, backZ          // 7: Top right
    );
    
    // Add normals for left vertical rectangle
    for (let i = 0; i < 4; i++) normals.push(0, 0, 1);  // Front face normals
    for (let i = 0; i < 4; i++) normals.push(0, 0, -1); // Back face normals
    
    // Add indices for the left rectangle
    indices.push(
      // Front face
      leftLipStartIndex, leftLipStartIndex + 1, leftLipStartIndex + 2,
      leftLipStartIndex + 1, leftLipStartIndex + 3, leftLipStartIndex + 2,
      
      // Back face
      leftLipStartIndex + 4, leftLipStartIndex + 6, leftLipStartIndex + 5,
      leftLipStartIndex + 5, leftLipStartIndex + 6, leftLipStartIndex + 7,
      
      // Left side face
      leftLipStartIndex, leftLipStartIndex + 2, leftLipStartIndex + 4,
      leftLipStartIndex + 2, leftLipStartIndex + 6, leftLipStartIndex + 4,
      
      // Right side face
      leftLipStartIndex + 1, leftLipStartIndex + 5, leftLipStartIndex + 3,
      leftLipStartIndex + 3, leftLipStartIndex + 5, leftLipStartIndex + 7,
      
      // Bottom face
      leftLipStartIndex, leftLipStartIndex + 4, leftLipStartIndex + 1,
      leftLipStartIndex + 1, leftLipStartIndex + 4, leftLipStartIndex + 5,
      
      // Top face
      leftLipStartIndex + 2, leftLipStartIndex + 3, leftLipStartIndex + 6,
      leftLipStartIndex + 3, leftLipStartIndex + 7, leftLipStartIndex + 6
    );
    
    // 2. Right vertical rectangle of the lip
    const rightLipStartIndex = vertices.length / 3;
    
    // Define dimensions
    const rightLipWidth = leftLipWidth; // Same width as left section
    const rightLipLeftX = lipWidth/2 - rightLipWidth; // Left edge of right lip section
    const rightLipRightX = lipWidth/2; // Right edge of the lip
    
    // Front face vertices
    vertices.push(
      rightLipLeftX, baseThickness, frontZ,                 // 0: Bottom left
      rightLipRightX, baseThickness, frontZ,                // 1: Bottom right
      rightLipLeftX, baseThickness + lipHeight, frontZ,     // 2: Top left
      rightLipRightX, baseThickness + lipHeight, frontZ     // 3: Top right
    );
    
    // Back face vertices
    vertices.push(
      rightLipLeftX, baseThickness, backZ,                  // 4: Bottom left
      rightLipRightX, baseThickness, backZ,                 // 5: Bottom right
      rightLipLeftX, baseThickness + lipHeight, backZ,      // 6: Top left
      rightLipRightX, baseThickness + lipHeight, backZ      // 7: Top right
    );
    
    // Add normals for right vertical rectangle
    for (let i = 0; i < 4; i++) normals.push(0, 0, 1);  // Front face normals
    for (let i = 0; i < 4; i++) normals.push(0, 0, -1); // Back face normals
    
    // Add indices for the right rectangle
    indices.push(
      // Front face
      rightLipStartIndex, rightLipStartIndex + 1, rightLipStartIndex + 2,
      rightLipStartIndex + 1, rightLipStartIndex + 3, rightLipStartIndex + 2,
      
      // Back face
      rightLipStartIndex + 4, rightLipStartIndex + 6, rightLipStartIndex + 5,
      rightLipStartIndex + 5, rightLipStartIndex + 6, rightLipStartIndex + 7,
      
      // Left side face
      rightLipStartIndex, rightLipStartIndex + 2, rightLipStartIndex + 4,
      rightLipStartIndex + 2, rightLipStartIndex + 6, rightLipStartIndex + 4,
      
      // Right side face
      rightLipStartIndex + 1, rightLipStartIndex + 5, rightLipStartIndex + 3,
      rightLipStartIndex + 3, rightLipStartIndex + 5, rightLipStartIndex + 7,
      
      // Bottom face
      rightLipStartIndex, rightLipStartIndex + 4, rightLipStartIndex + 1,
      rightLipStartIndex + 1, rightLipStartIndex + 4, rightLipStartIndex + 5,
      
      // Top face
      rightLipStartIndex + 2, rightLipStartIndex + 3, rightLipStartIndex + 6,
      rightLipStartIndex + 3, rightLipStartIndex + 7, rightLipStartIndex + 6
    );
    
    // 3. Top horizontal connector (bridge above the opening)
    const topConnectorStartIndex = vertices.length / 3;
    
    // Define dimensions
    const connectorHeight = lipHeight * 0.3; // 30% of the lip height 
    const connectorBottomY = baseThickness + lipHeight - connectorHeight;
    
    // Front face vertices
    vertices.push(
      rightLipX, connectorBottomY, frontZ,               // 0: Bottom left
      rightLipLeftX, connectorBottomY, frontZ,           // 1: Bottom right
      rightLipX, baseThickness + lipHeight, frontZ,      // 2: Top left
      rightLipLeftX, baseThickness + lipHeight, frontZ   // 3: Top right
    );
    
    // Back face vertices
    vertices.push(
      rightLipX, connectorBottomY, backZ,                // 4: Bottom left
      rightLipLeftX, connectorBottomY, backZ,            // 5: Bottom right
      rightLipX, baseThickness + lipHeight, backZ,       // 6: Top left
      rightLipLeftX, baseThickness + lipHeight, backZ    // 7: Top right
    );
    
    // Add normals for top connector
    for (let i = 0; i < 4; i++) normals.push(0, 0, 1);  // Front face normals
    for (let i = 0; i < 4; i++) normals.push(0, 0, -1); // Back face normals
    
    // Add indices for the top connector
    indices.push(
      // Front face
      topConnectorStartIndex, topConnectorStartIndex + 1, topConnectorStartIndex + 2,
      topConnectorStartIndex + 1, topConnectorStartIndex + 3, topConnectorStartIndex + 2,
      
      // Back face
      topConnectorStartIndex + 4, topConnectorStartIndex + 6, topConnectorStartIndex + 5,
      topConnectorStartIndex + 5, topConnectorStartIndex + 6, topConnectorStartIndex + 7,
      
      // Bottom face
      topConnectorStartIndex, topConnectorStartIndex + 4, topConnectorStartIndex + 1,
      topConnectorStartIndex + 1, topConnectorStartIndex + 4, topConnectorStartIndex + 5,
      
      // Top face
      topConnectorStartIndex + 2, topConnectorStartIndex + 3, topConnectorStartIndex + 6,
      topConnectorStartIndex + 3, topConnectorStartIndex + 7, topConnectorStartIndex + 6,
      
      // Left side face
      topConnectorStartIndex, topConnectorStartIndex + 2, topConnectorStartIndex + 4,
      topConnectorStartIndex + 2, topConnectorStartIndex + 6, topConnectorStartIndex + 4,
      
      // Right side face
      topConnectorStartIndex + 1, topConnectorStartIndex + 5, topConnectorStartIndex + 3,
      topConnectorStartIndex + 3, topConnectorStartIndex + 5, topConnectorStartIndex + 7
    );
    
  } else {
    // Without cable opening - create a simple solid lip (completely rectangular)
    const lipStartIndex = vertices.length / 3;
    
    // Front face of the lip
    vertices.push(
      -lipWidth/2, baseThickness, frontZ,                // 0: Bottom left
      lipWidth/2, baseThickness, frontZ,                 // 1: Bottom right
      -lipWidth/2, baseThickness + lipHeight, frontZ,    // 2: Top left
      lipWidth/2, baseThickness + lipHeight, frontZ      // 3: Top right
    );
    
    // Back face of the lip
    vertices.push(
      -lipWidth/2, baseThickness, backZ,                 // 4: Bottom left
      lipWidth/2, baseThickness, backZ,                  // 5: Bottom right
      -lipWidth/2, baseThickness + lipHeight, backZ,     // 6: Top left
      lipWidth/2, baseThickness + lipHeight, backZ       // 7: Top right
    );
    
    // Add normals
    for (let i = 0; i < 4; i++) normals.push(0, 0, 1);  // Front face normals
    for (let i = 0; i < 4; i++) normals.push(0, 0, -1); // Back face normals
    
    // Add indices to create a watertight volume
    indices.push(
      // Front face
      lipStartIndex, lipStartIndex + 1, lipStartIndex + 2,
      lipStartIndex + 1, lipStartIndex + 3, lipStartIndex + 2,
      
      // Back face
      lipStartIndex + 4, lipStartIndex + 6, lipStartIndex + 5,
      lipStartIndex + 5, lipStartIndex + 6, lipStartIndex + 7,
      
      // Left side face
      lipStartIndex, lipStartIndex + 2, lipStartIndex + 4,
      lipStartIndex + 2, lipStartIndex + 6, lipStartIndex + 4,
      
      // Right side face
      lipStartIndex + 1, lipStartIndex + 5, lipStartIndex + 3,
      lipStartIndex + 3, lipStartIndex + 5, lipStartIndex + 7,
      
      // Bottom face
      lipStartIndex, lipStartIndex + 4, lipStartIndex + 1,
      lipStartIndex + 1, lipStartIndex + 4, lipStartIndex + 5,
      
      // Top face
      lipStartIndex + 2, lipStartIndex + 3, lipStartIndex + 6,
      lipStartIndex + 3, lipStartIndex + 7, lipStartIndex + 6
    );
  }
  
  return { vertices, indices, normals };
}

function generateBraceletGeometry(params: BraceletParams) {
  const {
    innerDiameter: innerDiameterInches,
    thickness: thicknessInches,
    width: widthInches,
    gapSize,
    patternType,
    patternDepth: patternDepthValue,
    patternScale: patternScaleValue
  } = params;
  
  // Convert to cm
  const innerDiameter = inchesToCm(innerDiameterInches);
  const thickness = inchesToCm(thicknessInches);
  const width = inchesToCm(widthInches);
  const patternDepth = inchesToCm(patternDepthValue);
  
  // Calculate outer diameter
  const outerDiameter = innerDiameter + 2 * thickness;
  
  // Number of segments for the circle (excluding the gap)
  const fullCircleSegments = 64;
  
  // Calculate the actual number of segments based on the gap size
  const gapAngle = (gapSize * Math.PI) / 180; // Convert gap size from degrees to radians
  const segmentAngle = (2 * Math.PI) / fullCircleSegments;
  const actualSegments = Math.floor(fullCircleSegments * (1 - gapSize / 360));
  
  // Arrays for vertices, indices, and normals
  const vertices: number[] = [];
  const indices: number[] = [];
  const normals: number[] = [];
  
  // Function to create a point on a circle at given angle
  const createCirclePoint = (diameter: number, angle: number, y: number) => {
    const radius = diameter / 2;
    const x = radius * Math.cos(angle);
    const z = radius * Math.sin(angle);
    return [x, y, z];
  };
  
  // The starting angle of the C-shape (half of the gap on each side)
  const startAngle = gapAngle / 2;
  const endAngle = 2 * Math.PI - gapAngle / 2;
  
  // Generate the top face
  for (let i = 0; i <= actualSegments; i++) {
    // Calculate the current angle, interpolating from start to end
    const t = i / actualSegments;
    const angle = startAngle + t * (endAngle - startAngle);
    
    // Add pattern to the outer edge
    let patternOffset = 0;
    if (patternType !== 'plain' && patternDepth > 0) {
      const patternScale = patternScaleValue * 5; // Scale factor for pattern
      
      switch (patternType) {
        case 'waves':
          patternOffset = patternDepth * Math.sin(angle * patternScale);
          break;
        case 'geometric':
          patternOffset = patternDepth * Math.abs(Math.sin(angle * patternScale));
          break;
        case 'organic':
          // A more random looking pattern
          patternOffset = patternDepth * (
            Math.sin(angle * patternScale) * 0.6 + 
            Math.sin(angle * patternScale * 2.7) * 0.3 + 
            Math.sin(angle * patternScale * 5.1) * 0.1
          );
          break;
      }
    }
    
    // Inner circle points (top face)
    const [innerX, innerY, innerZ] = createCirclePoint(innerDiameter, angle, width / 2);
    vertices.push(innerX, innerY, innerZ);
    normals.push(0, 1, 0); // Top face normal
    
    // Outer circle points (top face)
    // Apply pattern to the outer diameter
    const actualOuterDiameter = outerDiameter + patternOffset * 2;
    const [outerX, outerY, outerZ] = createCirclePoint(actualOuterDiameter, angle, width / 2);
    vertices.push(outerX, outerY, outerZ);
    normals.push(0, 1, 0); // Top face normal
  }
  
  // Generate the bottom face
  for (let i = 0; i <= actualSegments; i++) {
    // Calculate the current angle, interpolating from start to end
    const t = i / actualSegments;
    const angle = startAngle + t * (endAngle - startAngle);
    
    // Add pattern to the outer edge (same as top face for consistency)
    let patternOffset = 0;
    if (patternType !== 'plain' && patternDepth > 0) {
      const patternScale = patternScaleValue * 5;
      
      switch (patternType) {
        case 'waves':
          patternOffset = patternDepth * Math.sin(angle * patternScale);
          break;
        case 'geometric':
          patternOffset = patternDepth * Math.abs(Math.sin(angle * patternScale));
          break;
        case 'organic':
          patternOffset = patternDepth * (
            Math.sin(angle * patternScale) * 0.6 + 
            Math.sin(angle * patternScale * 2.7) * 0.3 + 
            Math.sin(angle * patternScale * 5.1) * 0.1
          );
          break;
      }
    }
    
    // Inner circle points (bottom face)
    const [innerX, innerY, innerZ] = createCirclePoint(innerDiameter, angle, -width / 2);
    vertices.push(innerX, innerY, innerZ);
    normals.push(0, -1, 0); // Bottom face normal
    
    // Outer circle points (bottom face)
    const actualOuterDiameter = outerDiameter + patternOffset * 2;
    const [outerX, outerY, outerZ] = createCirclePoint(actualOuterDiameter, angle, -width / 2);
    vertices.push(outerX, outerY, outerZ);
    normals.push(0, -1, 0); // Bottom face normal
  }
  
  // Create indices for the top and bottom faces
  for (let i = 0; i < actualSegments; i++) {
    // Top face indices (0 to segments*2-1)
    const topInnerCurrent = i * 2;
    const topOuterCurrent = i * 2 + 1;
    const topInnerNext = (i + 1) * 2;
    const topOuterNext = (i + 1) * 2 + 1;
    
    // Create two triangles for the top face
    indices.push(
      topInnerCurrent, topOuterCurrent, topInnerNext,
      topOuterCurrent, topOuterNext, topInnerNext
    );
    
    // Bottom face indices (segments*2 to segments*4-1)
    const bottomInnerCurrent = (actualSegments + 1) * 2 + i * 2;
    const bottomOuterCurrent = (actualSegments + 1) * 2 + i * 2 + 1;
    const bottomInnerNext = (actualSegments + 1) * 2 + (i + 1) * 2;
    const bottomOuterNext = (actualSegments + 1) * 2 + (i + 1) * 2 + 1;
    
    // Create two triangles for the bottom face (reverse winding)
    indices.push(
      bottomInnerCurrent, bottomInnerNext, bottomOuterCurrent,
      bottomOuterCurrent, bottomInnerNext, bottomOuterNext
    );
    
    // Connect the top and bottom faces to create the sides
    // Inner wall
    indices.push(
      topInnerCurrent, topInnerNext, bottomInnerCurrent,
      bottomInnerCurrent, topInnerNext, bottomInnerNext
    );
    
    // Outer wall (with pattern)
    indices.push(
      topOuterCurrent, bottomOuterCurrent, topOuterNext,
      bottomOuterCurrent, bottomOuterNext, topOuterNext
    );
  }
  
  // Now add faces for the ends of the C shape where the gap is
  // First end
  const firstTopInner = 0;
  const firstTopOuter = 1;
  const firstBottomInner = (actualSegments + 1) * 2;
  const firstBottomOuter = (actualSegments + 1) * 2 + 1;
  
  // Create triangles for the first end
  indices.push(
    firstTopInner, firstBottomInner, firstTopOuter,
    firstTopOuter, firstBottomInner, firstBottomOuter
  );
  
  // Second end
  const lastTopInner = actualSegments * 2;
  const lastTopOuter = actualSegments * 2 + 1;
  const lastBottomInner = (actualSegments + 1) * 2 + actualSegments * 2;
  const lastBottomOuter = (actualSegments + 1) * 2 + actualSegments * 2 + 1;
  
  // Create triangles for the second end
  indices.push(
    lastTopInner, lastTopOuter, lastBottomInner,
    lastBottomInner, lastTopOuter, lastBottomOuter
  );
  
  // Calculate improved normals for better rendering
  // This is a simplified approach; ideally we would compute per-vertex normals
  for (let i = 0; i <= actualSegments; i++) {
    const t = i / actualSegments;
    const angle = startAngle + t * (endAngle - startAngle);
    
    // Inner wall normals - pointing inward
    const nx = -Math.cos(angle);
    const nz = -Math.sin(angle);
    
    // For top and bottom faces, we've already set the normals correctly
    
    // For side walls, update the normals (this is approximate)
    // This would ideally be more precise, but this simple approach works for our needs
    if (i > 0 && i < actualSegments) {
      // Update normals for side faces if needed
    }
  }
  
  return { vertices, indices, normals };
}

function generatePencilHolderGeometry(params: PencilHolderParams) {
  const {
    shape,
    height: heightInches,
    diameter: diameterInches,
    wallThickness: wallThicknessInches,
    dividerType,
    dividerCount,
    hasBottom
  } = params;
  
  // Convert to cm
  const height = inchesToCm(heightInches);
  const diameter = inchesToCm(diameterInches);
  const wallThickness = inchesToCm(wallThicknessInches);
  
  // Calculate inner diameter/width
  const innerDiameter = diameter - 2 * wallThickness;
  
  // Number of segments for the circle
  const radialSegments = shape === 'circle' ? 48 : 4;
  const heightSegments = 1;
  
  // Arrays for vertices, indices, and normals
  const vertices: number[] = [];
  const indices: number[] = [];
  const normals: number[] = [];
  
  // Add base (bottom)
  const bottomY = 0;
  
  if (hasBottom) {
    // OUTER BOTTOM FACE (new code)
    // Center vertex for the outer bottom face
    const outerBottomCenterIndex = vertices.length / 3;
    vertices.push(0, bottomY, 0);
    normals.push(0, -1, 0);
    
    // Outer bottom vertices - circle or square
    const outerBottomStartIndex = vertices.length / 3;
    for (let i = 0; i <= radialSegments; i++) {
      const theta = (i / radialSegments) * Math.PI * 2;
      let x, z;
      
      if (shape === 'circle') {
        x = diameter / 2 * Math.cos(theta);
        z = diameter / 2 * Math.sin(theta);
      } else {
        // For square, calculate the x,z coordinates of the corners and edges
        const segmentPos = i % radialSegments;
        const halfWidth = diameter / 2;
        
        if (segmentPos === 0) {
          x = halfWidth;
          z = halfWidth;
        } else if (segmentPos === 1) {
          x = -halfWidth;
          z = halfWidth;
        } else if (segmentPos === 2) {
          x = -halfWidth;
          z = -halfWidth;
        } else if (segmentPos === 3) {
          x = halfWidth;
          z = -halfWidth;
        } else {
          x = halfWidth;
          z = halfWidth;
        }
      }
      
      vertices.push(x, bottomY, z);
      normals.push(0, -1, 0);
    }
    
    // Outer bottom indices (triangles from center to edge)
    for (let i = 0; i < radialSegments; i++) {
      indices.push(
        outerBottomCenterIndex, // Center
        outerBottomStartIndex + i, // Current point
        outerBottomStartIndex + (i + 1) % radialSegments // Next point
      );
    }
  }
  
  // Side walls
  const baseVertexCount = vertices.length / 3;
  
  // Generate vertices for outer wall
  for (let y = 0; y <= heightSegments; y++) {
    const yPos = bottomY + (y / heightSegments) * height;
    
    for (let i = 0; i <= radialSegments; i++) {
      let outerX, outerZ, nx, nz;
      
      if (shape === 'circle') {
        const theta = (i / radialSegments) * Math.PI * 2;
        
        // Outer wall vertex - circle
        outerX = diameter / 2 * Math.cos(theta);
        outerZ = diameter / 2 * Math.sin(theta);
        
        // Normal pointing outward
        nx = Math.cos(theta);
        nz = Math.sin(theta);
      } else {
        // For square, calculate the x,z coordinates of the corners and edges
        const segmentPos = i % radialSegments;
        const halfWidth = diameter / 2;
        
        if (segmentPos === 0) {
          outerX = halfWidth;
          outerZ = halfWidth;
          nx = 1 / Math.sqrt(2);  // Normalize for corner
          nz = 1 / Math.sqrt(2);
        } else if (segmentPos === 1) {
          outerX = -halfWidth;
          outerZ = halfWidth;
          nx = -1 / Math.sqrt(2);
          nz = 1 / Math.sqrt(2);
        } else if (segmentPos === 2) {
          outerX = -halfWidth;
          outerZ = -halfWidth;
          nx = -1 / Math.sqrt(2);
          nz = -1 / Math.sqrt(2);
        } else if (segmentPos === 3) {
          outerX = halfWidth;
          outerZ = -halfWidth;
          nx = 1 / Math.sqrt(2);
          nz = -1 / Math.sqrt(2);
        } else {
          outerX = halfWidth;
          outerZ = halfWidth;
          nx = 1 / Math.sqrt(2);
          nz = 1 / Math.sqrt(2);
        }
      }
      
      // Add outer vertex
      vertices.push(outerX, yPos, outerZ);
      normals.push(nx, 0, nz);
      
      // Inner wall vertex
      let innerX, innerZ;
      if (shape === 'circle') {
        const theta = (i / radialSegments) * Math.PI * 2;
        innerX = innerDiameter / 2 * Math.cos(theta);
        innerZ = innerDiameter / 2 * Math.sin(theta);
      } else {
        const segmentPos = i % radialSegments;
        const innerHalfWidth = (diameter - 2 * wallThickness) / 2;
        
        if (segmentPos === 0) {
          innerX = innerHalfWidth;
          innerZ = innerHalfWidth;
        } else if (segmentPos === 1) {
          innerX = -innerHalfWidth;
          innerZ = innerHalfWidth;
        } else if (segmentPos === 2) {
          innerX = -innerHalfWidth;
          innerZ = -innerHalfWidth;
        } else if (segmentPos === 3) {
          innerX = innerHalfWidth;
          innerZ = -innerHalfWidth;
        } else {
          innerX = innerHalfWidth;
          innerZ = innerHalfWidth;
        }
      }
      
      vertices.push(innerX, yPos, innerZ);
      
      // Normal pointing inward
      normals.push(-nx, 0, -nz);
    }
  }
  
  // Create indices for the side walls
  const verticesPerRow = (radialSegments + 1) * 2;
  
  for (let y = 0; y < heightSegments; y++) {
    for (let i = 0; i < radialSegments; i++) {
      const current = baseVertexCount + y * verticesPerRow + i * 2;
      const next = baseVertexCount + y * verticesPerRow + ((i + 1) % (radialSegments + 1)) * 2;
      const currentTop = current + verticesPerRow;
      const nextTop = next + verticesPerRow;
      
      // Outer wall (two triangles per quad)
      indices.push(
        current, currentTop, next,
        next, currentTop, nextTop
      );
      
      // Inner wall (two triangles per quad, reversed winding)
      indices.push(
        current + 1, next + 1, currentTop + 1,
        currentTop + 1, next + 1, nextTop + 1
      );
    }
  }
  
  // Add top rim (just the top edge, not the full top surface)
  const topY = bottomY + height;
  
  for (let i = 0; i < radialSegments; i++) {
    const current = baseVertexCount + heightSegments * verticesPerRow + i * 2;
    const next = baseVertexCount + heightSegments * verticesPerRow + ((i + 1) % (radialSegments + 1)) * 2;
    
    // Connect outer and inner wall at the top
    indices.push(
      current, next, current + 1,
      current + 1, next, next + 1
    );
  }
  
  // Connect inner and outer bottom at the bottom edge when hasBottom is true
  if (hasBottom) {
    // BOTTOM EDGE CONNECTION (new code)
    // Connect the inner and outer walls at the bottom
    for (let i = 0; i < radialSegments; i++) {
      const outerCurrent = baseVertexCount + i * 2;
      const outerNext = baseVertexCount + ((i + 1) % radialSegments) * 2;
      const innerCurrent = outerCurrent + 1;
      const innerNext = outerNext + 1;
      
      // Create a face connecting the inner and outer walls at the bottom
      indices.push(
        innerCurrent, outerCurrent, innerNext,
        innerNext, outerCurrent, outerNext
      );
    }
    
    // Add inner bottom surface for a watertight model
    // This creates the "floor" of the pencil holder
    const floorCenterIndex = vertices.length / 3;
    vertices.push(0, bottomY, 0);  // Center point of the floor
    normals.push(0, 1, 0);  // Normal points up for inner floor
    
    // Inner floor vertices follow the inner wall profile
    const floorBaseIndex = vertices.length / 3;
    for (let i = 0; i <= radialSegments; i++) {
      let innerX, innerZ;
      if (shape === 'circle') {
        const theta = (i / radialSegments) * Math.PI * 2;
        innerX = innerDiameter / 2 * Math.cos(theta);
        innerZ = innerDiameter / 2 * Math.sin(theta);
      } else {
        const segmentPos = i % radialSegments;
        const innerHalfWidth = (diameter - 2 * wallThickness) / 2;
        
        if (segmentPos === 0) {
          innerX = innerHalfWidth;
          innerZ = innerHalfWidth;
        } else if (segmentPos === 1) {
          innerX = -innerHalfWidth;
          innerZ = innerHalfWidth;
        } else if (segmentPos === 2) {
          innerX = -innerHalfWidth;
          innerZ = -innerHalfWidth;
        } else if (segmentPos === 3) {
          innerX = innerHalfWidth;
          innerZ = -innerHalfWidth;
        } else {
          innerX = innerHalfWidth;
          innerZ = innerHalfWidth;
        }
      }
      
      vertices.push(innerX, bottomY, innerZ);
      normals.push(0, 1, 0);  // Normal points up for inner floor
    }
    
    // Inner floor indices (triangles radiating from center)
    for (let i = 0; i < radialSegments; i++) {
      indices.push(
        floorCenterIndex,
        floorBaseIndex + i,
        floorBaseIndex + (i + 1) % (radialSegments + 1)
      );
    }
  }
  
  // Add dividers based on the divider type
  if (dividerType !== 'none') {
    const dividerThickness = wallThickness / 2;
    
    if (dividerType === 'single') {
      // Single divider down the middle
      addDivider(-innerDiameter/2, 0, innerDiameter/2, 0, dividerThickness, height, bottomY);
    } 
    else if (dividerType === 'cross') {
      // Cross divider (two perpendicular dividers)
      addDivider(-innerDiameter/2, 0, innerDiameter/2, 0, dividerThickness, height, bottomY);
      addDivider(0, -innerDiameter/2, 0, innerDiameter/2, dividerThickness, height, bottomY);
    }
    else if (dividerType === 'grid') {
      // Grid divider with configurable number of cells
      const cellSize = innerDiameter / dividerCount;
      
      // Horizontal dividers - span the full width
      for (let i = 1; i < dividerCount; i++) {
        const zOffset = -innerDiameter/2 + i * cellSize;
        addDivider(-innerDiameter/2, zOffset, innerDiameter/2, zOffset, dividerThickness, height, bottomY);
      }
      
      // Vertical dividers - span the full height
      for (let i = 1; i < dividerCount; i++) {
        const xOffset = -innerDiameter/2 + i * cellSize;
        addDivider(xOffset, -innerDiameter/2, xOffset, innerDiameter/2, dividerThickness, height, bottomY);
      }
    }
  }
  
  // Helper function to add a divider
  function addDivider(x1: number, z1: number, x2: number, z2: number, thickness: number, height: number, bottomY: number) {
    // Starting indices for the new vertices
    const startIdx = vertices.length / 3;
    
    // Calculate divider direction and perpendicular vector
    const dx = x2 - x1;
    const dz = z2 - z1;
    const length = Math.sqrt(dx * dx + dz * dz);
    
    // Normalize direction vector
    const dirX = dx / length;
    const dirZ = dz / length;
    
    // Perpendicular vector (90 degrees counter-clockwise)
    const perpX = -dirZ;
    const perpZ = dirX;
    
    // Half thickness offset in the perpendicular direction
    const offsetX = perpX * thickness / 2;
    const offsetZ = perpZ * thickness / 2;
    
    // Create 8 vertices for the divider (4 for bottom, 4 for top)
    // Bottom vertices
    vertices.push(x1 + offsetX, bottomY, z1 + offsetZ); // Bottom left
    vertices.push(x1 - offsetX, bottomY, z1 - offsetZ); // Bottom right
    vertices.push(x2 - offsetX, bottomY, z2 - offsetZ); // Top right
    vertices.push(x2 + offsetX, bottomY, z2 + offsetZ); // Top left
    
    // Top vertices
    vertices.push(x1 + offsetX, bottomY + height, z1 + offsetZ); // Bottom left
    vertices.push(x1 - offsetX, bottomY + height, z1 - offsetZ); // Bottom right
    vertices.push(x2 - offsetX, bottomY + height, z2 - offsetZ); // Top right
    vertices.push(x2 + offsetX, bottomY + height, z2 + offsetZ); // Top left
    
    // Add normals for all vertices (pointing perpendicular to the divider)
    for (let i = 0; i < 4; i++) {
      normals.push(perpX, 0, perpZ); // Front face normal
    }
    for (let i = 0; i < 4; i++) {
      normals.push(-perpX, 0, -perpZ); // Back face normal
    }
    
    // Add indices for the 6 faces of the divider (2 triangles per face)
    // Front face
    indices.push(startIdx + 0, startIdx + 4, startIdx + 7);
    indices.push(startIdx + 0, startIdx + 7, startIdx + 3);
    
    // Back face
    indices.push(startIdx + 1, startIdx + 2, startIdx + 6);
    indices.push(startIdx + 1, startIdx + 6, startIdx + 5);
    
    // Top face
    indices.push(startIdx + 4, startIdx + 5, startIdx + 6);
    indices.push(startIdx + 4, startIdx + 6, startIdx + 7);
    
    // Bottom face
    indices.push(startIdx + 0, startIdx + 3, startIdx + 2);
    indices.push(startIdx + 0, startIdx + 2, startIdx + 1);
    
    // Left end
    indices.push(startIdx + 0, startIdx + 1, startIdx + 5);
    indices.push(startIdx + 0, startIdx + 5, startIdx + 4);
    
    // Right end
    indices.push(startIdx + 3, startIdx + 7, startIdx + 6);
    indices.push(startIdx + 3, startIdx + 6, startIdx + 2);
  }
  
  return { vertices, indices, normals };
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
      case 'cylinderBase':
        return generateCylinderBaseGeometry(params)
      case 'phoneHolder':
        return generatePhoneHolderGeometry(params as PhoneHolderParams)
      case 'bracelet':
        return generateBraceletGeometry(params as BraceletParams)
      case 'pencilHolder':
        return generatePencilHolderGeometry(params as PencilHolderParams)
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
      // Handle cableOpening separately to convert string to boolean
      if (paramId === 'cableOpening') {
        return {
          ...prev,
          cableOpening: value === 'true'
        } as ShapeParams;
      }
      
      // Handle dividerType separately
      if (paramId === 'dividerType') {
        return {
          ...prev,
          dividerType: value as PencilHolderParams['dividerType']
        } as ShapeParams;
      }

      // Safe casting to update dynamic params
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

                {(shapeParams.type === 'coaster' || shapeParams.type === 'wallArt' || shapeParams.type === 'candleHolder' || shapeParams.type === 'bracelet') && (
                  <div className="space-y-3">
                    <Label className="text-sm font-medium">Pattern Type</Label>
                    <Select 
                      value={
                        shapeParams.type === 'coaster' ? shapeParams.patternType :
                        shapeParams.type === 'wallArt' ? shapeParams.patternType :
                        shapeParams.type === 'candleHolder' ? shapeParams.patternType :
                        shapeParams.type === 'bracelet' ? shapeParams.patternType :
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
                            <SelectItem value="hexagonal">Hexagonal</SelectItem>
                            <SelectItem value="spiral">Spiral</SelectItem>
                            <SelectItem value="concentric">Concentric</SelectItem>
                            <SelectItem value="floral">Floral</SelectItem>
                            <SelectItem value="ripple">Ripple</SelectItem>
                            <SelectItem value="maze">Maze</SelectItem>
                          </>
                        )}
                        {shapeParams.type === 'wallArt' && (
                          <>
                            <SelectItem value="mandala">Mandala</SelectItem>
                            <SelectItem value="wave">Wave</SelectItem>
                            <SelectItem value="honeycomb">Honeycomb</SelectItem>
                            <SelectItem value="circuit">Circuit</SelectItem>
                            <SelectItem value="organic">Organic</SelectItem>
                          </>
                        )}
                        {shapeParams.type === 'candleHolder' && (
                          <>
                            <SelectItem value="geometric">Geometric</SelectItem>
                            <SelectItem value="stars">Stars</SelectItem>
                            <SelectItem value="leaves">Leaves</SelectItem>
                            <SelectItem value="abstract">Abstract</SelectItem>
                          </>
                        )}
                        {shapeParams.type === 'bracelet' && (
                          <>
                            <SelectItem value="plain">Plain</SelectItem>
                            <SelectItem value="waves">Waves</SelectItem>
                            <SelectItem value="geometric">Geometric</SelectItem>
                            <SelectItem value="organic">Organic</SelectItem>
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

                {shapeParams.type === 'cylinderBase' && (
                  <div className="space-y-3">
                    <Label className="text-sm font-medium">Shape</Label>
                    <Select 
                      value={shapeParams.shape}
                      onValueChange={(value) => updateParam("shape", value)}
                    >
                      <SelectTrigger className="bg-zinc-900 border-zinc-700 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-zinc-900 border-zinc-700">
                        <SelectItem value="cylinder" className="text-white hover:bg-zinc-800">Cylinder</SelectItem>
                        <SelectItem value="flower" className="text-white hover:bg-zinc-800">Flower</SelectItem>
                        <SelectItem value="square" className="text-white hover:bg-zinc-800">Square</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {shapeParams.type === 'phoneHolder' && (
                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium">Cable Opening</Label>
                    <Select
                      value={shapeParams.cableOpening ? "yes" : "no"}
                      onValueChange={(value) => {
                        updateParam("cableOpening", value === "yes" ? "true" : "false");
                      }}
                    >
                      <SelectTrigger className="bg-zinc-900 border-zinc-700 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-zinc-900 border-zinc-700">
                        <SelectItem value="yes" className="text-white hover:bg-zinc-800">Yes</SelectItem>
                        <SelectItem value="no" className="text-white hover:bg-zinc-800">No</SelectItem>
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
                          ? ((shapeParams as any)[control.id]?.toFixed?.(control.step === 0.1 ? 1 : 0) || (shapeParams as any)[control.id])
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

                {shapeParams.type === 'pencilHolder' && (
                  <>
                    <div className="space-y-3">
                      <Label className="text-sm font-medium">Shape</Label>
                      <Select 
                        value={(shapeParams as PencilHolderParams).shape}
                        onValueChange={(value) => updateParam("shape", value)}
                      >
                        <SelectTrigger className="bg-zinc-900 border-zinc-700 text-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-zinc-900 border-zinc-700">
                          <SelectItem value="circle" className="text-white hover:bg-zinc-800">Circle</SelectItem>
                          <SelectItem value="square" className="text-white hover:bg-zinc-800">Square</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-3">
                      <Label className="text-sm font-medium">Divider Type</Label>
                      <Select 
                        value={(shapeParams as PencilHolderParams).dividerType}
                        onValueChange={(value) => updateParam("dividerType", value)}
                      >
                        <SelectTrigger className="bg-zinc-900 border-zinc-700 text-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-zinc-900 border-zinc-700">
                          <SelectItem value="none" className="text-white hover:bg-zinc-800">None</SelectItem>
                          <SelectItem value="single" className="text-white hover:bg-zinc-800">Single</SelectItem>
                          <SelectItem value="cross" className="text-white hover:bg-zinc-800">Cross</SelectItem>
                          <SelectItem value="grid" className="text-white hover:bg-zinc-800">Grid</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-sm font-medium">Bottom</Label>
                      <Select
                        value={(shapeParams as PencilHolderParams).hasBottom ? "yes" : "no"}
                        onValueChange={(value) => {
                          updateParam("hasBottom", value === "yes" ? "true" : "false");
                        }}
                      >
                        <SelectTrigger className="bg-zinc-900 border-zinc-700 text-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-zinc-900 border-zinc-700">
                          <SelectItem value="yes" className="text-white hover:bg-zinc-800">Yes</SelectItem>
                          <SelectItem value="no" className="text-white hover:bg-zinc-800">No</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </>
                )}
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
                      ${categories[currentCategory].priceInfo[selectedSize]?.price?.toFixed(2) || '0.00'}
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


