"use client"

import { useState, useRef, Suspense, useCallback, useEffect, useMemo } from "react"
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
import { cloneDeep } from 'lodash'
import * as BufferGeometryUtils from 'three/examples/jsm/utils/BufferGeometryUtils.js'

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
  charmAttachment: {
    name: "Charm Attachment",
    description: "A simple charm bail with a loop and connecting pin that extends horizontally to attach to 3D models.",
    priceInfo: {
      small: {
        dimensions: "0.5 x 0.5 x 0.2 in",
        price: 4.99,
        priceId: "price_1Ot42FI0wQgEQ20bYkHPLKAO"
      },
      medium: {
        dimensions: "0.8 x 0.8 x 0.3 in",
        price: 6.99,
        priceId: "price_1Ot42FI0wQgEQ20bYkHPLKAO"
      }
    },
    defaults: {
      type: 'charmAttachment',
      loopSize: 0.5,
      loopThickness: 0.08,
      stickLength: 0.3,
      stickThickness: 0.08,
      material: 'shiny'
    }
  },
  ring: {
    name: "Ring",
    description: "A customizable ring with various design options.",
    priceInfo: {
      small: {
        dimensions: "0.75 in diameter",
        price: 29.99,
        priceId: "price_1Ot42FI0wQgEQ20bYkHPLKAO"
      },
      medium: {
        dimensions: "0.85 in diameter",
        price: 34.99,
        priceId: "price_1Ot42FI0wQgEQ20bYkHPLKAO"
      }
    },
    defaults: {
      type: 'ring',
      material: 'slate',
      innerDiameter: 0.75,
      thickness: 0.08,
      width: 0.25,
      patternType: 'plain',
      patternScale: 1,
      gapSize: 40,
    },
  },
  monitorStand: {
    name: "Monitor Stand",
    description: "Elevate your monitor with our customizable monitor stand.",
    priceInfo: {
      small: { dimensions: '12"W × 8"D × 4"H', price: 59.99, priceId: 'price_monitorstand_small' },
      medium: { dimensions: '16"W × 10"D × 5"H', price: 79.99, priceId: 'price_monitorstand_medium' },
    },
    defaults: {
      type: 'monitorStand',
      material: 'shiny',
      width: 16,
      depth: 10,
      height: 5,
      thickness: 1,
      legStyle: 'minimal',
    },
  },
  jewelryHolder: {
    name: 'Jewelry Holder',
    description: 'Organize and display your jewelry with our customizable holder.',
    priceInfo: {
      small: { dimensions: '6"W × 6"D × 6"H', price: 39.99, priceId: 'price_jewelryholder_small' },
      medium: { dimensions: '8"W × 8"D × 8"H', price: 49.99, priceId: 'price_jewelryholder_medium' },
    },
    defaults: {
      type: 'jewelryHolder',
      material: 'shiny',
      baseWidth: 6,
      baseDepth: 6,
      baseHeight: 0.75,
      baseStyle: 'square',
      pegHeight: 5,
      pegDiameter: 0.4,
      pegArrangement: 'circular',
      pegCount: 7,
      pegBranchStyle: 'none',
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
        { id: "height" as const, label: "Height (in)", min: 3, max: 10, step: 0.1 },
        { id: "diameter" as const, label: "Diameter/Width (in)", min: 2, max: 8, step: 0.1 },
        { id: "wallThickness" as const, label: "Wall Thickness (in)", min: 0.1, max: 0.5, step: 0.05 },
        { id: "dividerCount" as const, label: "Divider Count", min: 0, max: 4, step: 1 },
      ] as const
    case 'charmAttachment':
      return [
        { id: "loopSize" as const, label: "Loop Size (in)", min: 0.3, max: 1.0, step: 0.05 },
        { id: "loopThickness" as const, label: "Loop Thickness (in)", min: 0.05, max: 0.2, step: 0.01 },
        { id: "stickLength" as const, label: "Stick Length (in)", min: 0.1, max: 0.6, step: 0.05 },
        { id: "stickThickness" as const, label: "Stick Thickness (in)", min: 0.05, max: 0.15, step: 0.01 },
      ] as const
    case 'ring':
      return [
        { id: "innerDiameter" as const, label: "Inner Diameter (in)", min: 0.50, max: 1.20, step: 0.01 },
        { id: "thickness" as const, label: "Thickness (in)", min: 0.02, max: 0.20, step: 0.01 },
        { id: "width" as const, label: "Width (in)", min: 0.10, max: 0.50, step: 0.01 },
        { id: "patternScale" as const, label: "Pattern Scale", min: 0.50, max: 3.00, step: 0.01 },
        { id: "gapSize" as const, label: "Gap Size (degrees)", min: 0, max: 180, step: 5 }
      ] as const
    case 'monitorStand':
      return [
        { id: "width" as const, label: "Width (in)", min: 10, max: 24, step: 0.5 },
        { id: "depth" as const, label: "Depth (in)", min: 6, max: 12, step: 0.5 },
        { id: "height" as const, label: "Height (in)", min: 3, max: 7, step: 0.5 },
        { id: "thickness" as const, label: "Thickness (in)", min: 0.5, max: 2, step: 0.1 },
      ] as const
    case 'jewelryHolder':
      return [
        { id: "baseWidth" as const, label: "Base Width (in)", min: 4, max: 10, step: 0.5 },
        { id: "baseDepth" as const, label: "Base Depth (in)", min: 4, max: 10, step: 0.5 },
        { id: "baseHeight" as const, label: "Base Height (in)", min: 0.5, max: 2, step: 0.1 },
        { id: "pegHeight" as const, label: "Peg Height (in)", min: 2, max: 8, step: 0.5 },
        { id: "pegDiameter" as const, label: "Peg Diameter (in)", min: 0.2, max: 1, step: 0.1 },
        { id: "pegCount" as const, label: "Number of Pegs", min: 3, max: 15, step: 1 },
      ] as const
    default:
      return []
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

interface CharmAttachmentParams extends BaseShapeParams {
  type: 'charmAttachment';
  loopSize: number; // Size of the top circular loop in inches
  loopThickness: number; // Thickness of the loop in inches
  stickLength: number; // Length of the connecting stick in inches
  stickThickness: number; // Thickness of the stick in inches
  material: keyof typeof materials;
}

interface RingParams extends BaseShapeParams {
  type: 'ring';
  innerDiameter: number; // Inner diameter in inches
  thickness: number; // Thickness in inches (from inner to outer)
  width: number; // Width in inches (band width)
  patternType: 'plain' | 'waves' | 'geometric' | 'organic';
  patternScale: number; // Scale of the pattern
  gapSize: number; // Size of the opening gap in degrees (0-180)
}

interface MonitorStandParams extends BaseShapeParams {
  type: 'monitorStand';
  width: number; // Width of the stand in inches
  depth: number; // Depth of the stand in inches
  height: number; // Height of the stand in inches
  thickness: number; // Thickness of the platform in inches
  legStyle: 'minimal' | 'solid'; // Style of the supporting legs
}

interface JewelryHolderParams extends BaseShapeParams {
  type: 'jewelryHolder';
  baseWidth: number; // Width of the base in inches
  baseDepth: number; // Depth of the base in inches
  baseHeight: number; // Height of the base in inches
  baseStyle: 'square' | 'round' | 'curved' | 'tiered'; // Style of the base
  pegHeight: number; // Height of the jewelry pegs in inches
  pegDiameter: number; // Diameter of the pegs in inches
  pegArrangement: 'linear' | 'circular' | 'scattered'; // Arrangement pattern of pegs
  pegCount: number; // Number of pegs for jewelry items
  pegBranchStyle: 'none' | 'simple' | 'tree' | 'cross'; // Style of branches on pegs
}

type ShapeParams = StandardShapeParams | CoasterShapeParams | WallArtParams | CandleHolderParams | BowlParams | CylinderBaseParams | PhoneHolderParams | BraceletParams | PencilHolderParams | CharmAttachmentParams | RingParams | MonitorStandParams | JewelryHolderParams

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
  
  // Base Y position
  const bottomY = 0;
  const topY = bottomY + height;
  
  // STEP 1: CREATE OUTER WALL VERTICES
  // First create all the vertices for the outer wall
  const outerWallStartIndex = vertices.length / 3;
  
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
    }
  }
  
  // STEP 2: CREATE INNER WALL VERTICES
  // Now create all the vertices for the inner wall
  const innerWallStartIndex = vertices.length / 3;
  
  for (let y = 0; y <= heightSegments; y++) {
    const yPos = bottomY + (y / heightSegments) * height;
    
    for (let i = 0; i <= radialSegments; i++) {
      let innerX, innerZ, nx, nz;
      
      if (shape === 'circle') {
        const theta = (i / radialSegments) * Math.PI * 2;
        
        // Inner wall vertex - circle
        innerX = innerDiameter / 2 * Math.cos(theta);
        innerZ = innerDiameter / 2 * Math.sin(theta);
        
        // Normal pointing inward
        nx = -Math.cos(theta);
        nz = -Math.sin(theta);
      } else {
        // For square, calculate the x,z coordinates of the corners and edges
        const segmentPos = i % radialSegments;
        const innerHalfWidth = innerDiameter / 2;
        
        if (segmentPos === 0) {
          innerX = innerHalfWidth;
          innerZ = innerHalfWidth;
          nx = -1 / Math.sqrt(2);  // Normalize for corner, pointing inward
          nz = -1 / Math.sqrt(2);
        } else if (segmentPos === 1) {
          innerX = -innerHalfWidth;
          innerZ = innerHalfWidth;
          nx = 1 / Math.sqrt(2);
          nz = -1 / Math.sqrt(2);
        } else if (segmentPos === 2) {
          innerX = -innerHalfWidth;
          innerZ = -innerHalfWidth;
          nx = 1 / Math.sqrt(2);
          nz = 1 / Math.sqrt(2);
        } else if (segmentPos === 3) {
          innerX = innerHalfWidth;
          innerZ = -innerHalfWidth;
          nx = -1 / Math.sqrt(2);
          nz = 1 / Math.sqrt(2);
        } else {
          innerX = innerHalfWidth;
          innerZ = innerHalfWidth;
          nx = -1 / Math.sqrt(2);
          nz = -1 / Math.sqrt(2);
        }
      }
      
      // Add inner vertex
      vertices.push(innerX, yPos, innerZ);
      normals.push(nx, 0, nz);
    }
  }
  
  // STEP 3: CREATE INDICES FOR OUTER WALL
  const outerVerticesPerRow = radialSegments + 1;
  
  for (let y = 0; y < heightSegments; y++) {
    for (let i = 0; i < radialSegments; i++) {
      const current = outerWallStartIndex + y * outerVerticesPerRow + i;
      const next = outerWallStartIndex + y * outerVerticesPerRow + (i + 1) % outerVerticesPerRow;
      const currentTop = current + outerVerticesPerRow;
      const nextTop = next + outerVerticesPerRow;
      
      // Add two triangles to form a quad for the outer wall
      indices.push(current, currentTop, next);
      indices.push(next, currentTop, nextTop);
    }
  }
  
  // STEP 4: CREATE INDICES FOR INNER WALL
  const innerVerticesPerRow = radialSegments + 1;
  
  for (let y = 0; y < heightSegments; y++) {
    for (let i = 0; i < radialSegments; i++) {
      const current = innerWallStartIndex + y * innerVerticesPerRow + i;
      const next = innerWallStartIndex + y * innerVerticesPerRow + (i + 1) % innerVerticesPerRow;
      const currentTop = current + innerVerticesPerRow;
      const nextTop = next + innerVerticesPerRow;
      
      // Add two triangles to form a quad for the inner wall (note reversed order for proper normals)
      indices.push(current, next, currentTop);
      indices.push(next, nextTop, currentTop);
    }
  }
  
  // STEP 5: CREATE TOP RIM (connecting inner and outer top edges)
  for (let i = 0; i < radialSegments; i++) {
    const outerCurrent = outerWallStartIndex + heightSegments * outerVerticesPerRow + i;
    const outerNext = outerWallStartIndex + heightSegments * outerVerticesPerRow + (i + 1) % radialSegments;
    const innerCurrent = innerWallStartIndex + heightSegments * innerVerticesPerRow + i;
    const innerNext = innerWallStartIndex + heightSegments * innerVerticesPerRow + (i + 1) % radialSegments;
    
    // Add two triangles to form a quad for the top rim
    indices.push(outerCurrent, outerNext, innerNext);
    indices.push(outerCurrent, innerNext, innerCurrent);
  }
  
  // STEP 6: ADD BOTTOM IF SPECIFIED
  if (hasBottom) {
    // STEP 6.1: ADD BOTTOM RIM (connecting inner and outer bottom edges)
    for (let i = 0; i < radialSegments; i++) {
      const outerCurrent = outerWallStartIndex + i;
      const outerNext = outerWallStartIndex + (i + 1) % radialSegments;
      const innerCurrent = innerWallStartIndex + i;
      const innerNext = innerWallStartIndex + (i + 1) % radialSegments;
      
      // Add two triangles to form a quad for the bottom rim (note reversed winding order)
      indices.push(outerCurrent, innerNext, outerNext);
      indices.push(outerCurrent, innerCurrent, innerNext);
    }
    
    // STEP 6.2: CREATE OUTER BOTTOM FACE
    // Add center vertex for outer bottom
    const outerBottomCenterIndex = vertices.length / 3;
    vertices.push(0, bottomY, 0);
    normals.push(0, -1, 0); // Normal pointing down
    
    // Create triangles from center to each vertex on the outer bottom edge
    for (let i = 0; i < radialSegments; i++) {
      const current = outerWallStartIndex + i;
      const next = outerWallStartIndex + (i + 1) % radialSegments;
      
      indices.push(outerBottomCenterIndex, next, current);
    }
    
    // STEP 6.3: CREATE INNER BOTTOM FACE
    // Add center vertex for inner bottom
    const innerBottomCenterIndex = vertices.length / 3;
    vertices.push(0, bottomY, 0);
    normals.push(0, 1, 0); // Normal pointing up
    
    // Create triangles from center to each vertex on the inner bottom edge
    for (let i = 0; i < radialSegments; i++) {
      const current = innerWallStartIndex + i;
      const next = innerWallStartIndex + (i + 1) % radialSegments;
      
      indices.push(innerBottomCenterIndex, current, next);
    }
  }
  
  // STEP 7: ADD DIVIDERS
  if (dividerType !== 'none') {
    const dividerThickness = wallThickness / 2;
    
    if (dividerType === 'single') {
      // Single divider down the middle
      addDivider(-innerDiameter/2, 0, innerDiameter/2, 0, dividerThickness, height, bottomY, hasBottom);
    } 
    else if (dividerType === 'cross') {
      // Cross divider (two perpendicular dividers)
      addDivider(-innerDiameter/2, 0, innerDiameter/2, 0, dividerThickness, height, bottomY, hasBottom);
      addDivider(0, -innerDiameter/2, 0, innerDiameter/2, dividerThickness, height, bottomY, hasBottom);
    }
    else if (dividerType === 'grid') {
      // Grid divider with configurable number of cells
      const cellSize = innerDiameter / dividerCount;
      
      // Horizontal dividers - span the full width
      for (let i = 1; i < dividerCount; i++) {
        const zOffset = -innerDiameter/2 + i * cellSize;
        addDivider(-innerDiameter/2, zOffset, innerDiameter/2, zOffset, dividerThickness, height, bottomY, hasBottom);
      }
      
      // Vertical dividers - span the full height
      for (let i = 1; i < dividerCount; i++) {
        const xOffset = -innerDiameter/2 + i * cellSize;
        addDivider(xOffset, -innerDiameter/2, xOffset, innerDiameter/2, dividerThickness, height, bottomY, hasBottom);
      }
    }
  }
  
  // Helper function to add a divider
  function addDivider(x1: number, z1: number, x2: number, z2: number, thickness: number, height: number, bottomY: number, hasBottom: boolean) {
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
      normals.push(perpX, 0, perpZ); // Top face normals same as front
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
    
    // Bottom face (only add if the pencil holder has a bottom)
    if (hasBottom) {
      indices.push(startIdx + 0, startIdx + 3, startIdx + 2);
      indices.push(startIdx + 0, startIdx + 2, startIdx + 1);
    }
    
    // Left end
    indices.push(startIdx + 0, startIdx + 1, startIdx + 5);
    indices.push(startIdx + 0, startIdx + 5, startIdx + 4);
    
    // Right end
    indices.push(startIdx + 3, startIdx + 7, startIdx + 6);
    indices.push(startIdx + 3, startIdx + 6, startIdx + 2);
  }
  
  return { vertices, indices, normals };
}

function generateCharmAttachmentGeometry(params: CharmAttachmentParams) {
  const {
    loopSize: loopSizeInches,
    loopThickness: loopThicknessInches,
    stickLength: stickLengthInches,
    stickThickness: stickThicknessInches
  } = params;
  
  // Convert inches to cm
  const loopRadius = inchesToCm(loopSizeInches / 2);
  const loopThickness = inchesToCm(loopThicknessInches);
  const stickLength = inchesToCm(stickLengthInches);
  const stickThickness = inchesToCm(stickThicknessInches);
  
  // Arrays for storing geometry data
  const vertices: number[] = [];
  const indices: number[] = [];
  const normals: number[] = [];
  
  // Number of segments for the circular loop
  const radialSegments = 32;
  const tubularSegments = 32;
  
  // STEP 1: CREATE THE CIRCULAR LOOP
  // We'll create a torus (donut shape) for the loop
  
  // Create the loop (torus)
  for (let i = 0; i <= tubularSegments; i++) {
    const tubularAngle = (i / tubularSegments) * Math.PI * 2;
    
    for (let j = 0; j <= radialSegments; j++) {
      const radialAngle = (j / radialSegments) * Math.PI * 2;
      
      // Calculate positions on the torus
      const x = (loopRadius + loopThickness/2 * Math.cos(radialAngle)) * Math.cos(tubularAngle);
      const y = (loopThickness/2 * Math.sin(radialAngle));
      const z = (loopRadius + loopThickness/2 * Math.cos(radialAngle)) * Math.sin(tubularAngle);
      
      // Calculate normals
      const nx = Math.cos(radialAngle) * Math.cos(tubularAngle);
      const ny = Math.sin(radialAngle);
      const nz = Math.cos(radialAngle) * Math.sin(tubularAngle);
      
      // Add vertex and normal
      vertices.push(x, y, z);
      normals.push(nx, ny, nz);
    }
  }
  
  // Create indices for the loop
  for (let i = 0; i < tubularSegments; i++) {
    for (let j = 0; j < radialSegments; j++) {
      const a = (radialSegments + 1) * i + j;
      const b = (radialSegments + 1) * ((i + 1) % tubularSegments) + j;
      const c = (radialSegments + 1) * ((i + 1) % tubularSegments) + ((j + 1) % radialSegments);
      const d = (radialSegments + 1) * i + ((j + 1) % radialSegments);
      
      // Create two triangles for each face
      indices.push(a, b, d);
      indices.push(b, c, d);
    }
  }
  
  // STEP 2: CREATE THE HORIZONTAL CONNECTING STICK/PIN
  // The stick extends horizontally from the right side of the loop
  
  // Create reference point where the stick attaches to the loop
  const attachPointX = 0; // Center X
  const attachPointY = 0; // Center Y (coplanar with loop)
  const attachPointZ = loopRadius + loopThickness/2; // Right edge of the loop
  
  const stickEndZ = attachPointZ + stickLength; // Extend to the right
  const stickRadius = stickThickness / 2;
  
  // Base vertex index for the stick
  const stickBaseIndex = vertices.length / 3;
  
  // Create vertices for the cylinder stick
  for (let i = 0; i <= radialSegments; i++) {
    const theta = (i / radialSegments) * Math.PI * 2;
    const x = attachPointX + Math.cos(theta) * stickRadius;
    const y = attachPointY + Math.sin(theta) * stickRadius;
    
    // Left vertices of the stick (where it connects to the loop)
    vertices.push(x, y, attachPointZ);
    normals.push(0, 0, -1); // Point toward the loop
    
    // Right vertices of the stick (the end)
    vertices.push(x, y, stickEndZ);
    normals.push(0, 0, 1); // Point away from the loop
  }
  
  // Create indices for the stick cylinder walls
  for (let i = 0; i < radialSegments; i++) {
    const leftVertex = stickBaseIndex + i * 2;
    const leftVertexNext = stickBaseIndex + ((i + 1) % radialSegments) * 2;
    const rightVertex = leftVertex + 1;
    const rightVertexNext = leftVertexNext + 1;
    
    // Create two triangles for each face section of the cylinder
    indices.push(leftVertex, leftVertexNext, rightVertex);
    indices.push(leftVertexNext, rightVertexNext, rightVertex);
  }
  
  // STEP 3: CREATE THE END CAP OF THE STICK
  const endCapCenterIndex = vertices.length / 3;
  vertices.push(attachPointX, attachPointY, stickEndZ);
  normals.push(0, 0, 1); // Point outward
  
  for (let i = 0; i < radialSegments; i++) {
    const rightVertex = stickBaseIndex + i * 2 + 1; // Get right vertices
    const rightVertexNext = stickBaseIndex + ((i + 1) % radialSegments) * 2 + 1;
    
    // Create triangles for the end cap
    indices.push(endCapCenterIndex, rightVertex, rightVertexNext);
  }
  
  // We don't need to create a cap at the loop connection point
  // as it will be inside the loop model
  
  return { vertices, indices, normals };
}

function generateRingGeometry(params: RingParams) {
  const {
    innerDiameter,
    thickness,
    width,
    patternType,
    patternScale,
    gapSize
  } = params;

  // Convert inches to centimeters
  const innerRadiusCm = inchesToCm(innerDiameter) / 2;
  const outerRadiusCm = innerRadiusCm + inchesToCm(thickness);
  const ringWidthCm = inchesToCm(width);
  
  // Calculate the number of segments for the circle - more segments for smoother curves
  const actualSegments = Math.floor((360 - gapSize) / 5); // One segment every 5 degrees
  
  // Create the ring geometry
  const geometry = new THREE.BufferGeometry();
  const positions: number[] = [];
  const normals: number[] = [];
  const indices: number[] = [];
  
  // Calculate start and end angles for the C-shape (in radians)
  const startAngle = (gapSize / 2) * (Math.PI / 180);
  const endAngle = (360 - gapSize / 2) * (Math.PI / 180);
  
  // Helper function to create a point on the circle at a specific angle
  const createCirclePoint = (diameter: number, angle: number, y: number) => {
    const radius = diameter / 2;
    return [
      radius * Math.cos(angle),
      y,
      radius * Math.sin(angle)
    ];
  };
  
  // Create the vertices for the C-shaped ring
  for (let i = 0; i <= actualSegments; i++) {
    // Calculate the angle for this segment
    const angle = startAngle + (i / actualSegments) * (endAngle - startAngle);
    
    // Inner bottom, inner top, outer top, outer bottom
    const innerBottom = createCirclePoint(inchesToCm(innerDiameter), angle, -ringWidthCm/2);
    const innerTop = createCirclePoint(inchesToCm(innerDiameter), angle, ringWidthCm/2);
    const outerTop = createCirclePoint(inchesToCm(innerDiameter + thickness * 2), angle, ringWidthCm/2);
    const outerBottom = createCirclePoint(inchesToCm(innerDiameter + thickness * 2), angle, -ringWidthCm/2);
    
    // Add points to positions array
    positions.push(...innerBottom, ...innerTop, ...outerTop, ...outerBottom);
    
    // Calculate normals (pointing outward from center of ring)
    normals.push(
      Math.cos(angle), 0, Math.sin(angle),  // inner bottom
      Math.cos(angle), 0, Math.sin(angle),  // inner top
      Math.cos(angle), 0, Math.sin(angle),  // outer top
      Math.cos(angle), 0, Math.sin(angle)   // outer bottom
    );
    
    // If this isn't the last segment, create triangles
    if (i < actualSegments) {
      const baseIndex = i * 4;
      
      // Side faces
      // First triangle: bottom-left, top-left, top-right
      indices.push(baseIndex, baseIndex + 1, baseIndex + 5);
      // Second triangle: bottom-left, top-right, bottom-right
      indices.push(baseIndex, baseIndex + 5, baseIndex + 4);
      
      // Front face (outer surface)
      // First triangle
      indices.push(baseIndex + 2, baseIndex + 3, baseIndex + 7);
      // Second triangle
      indices.push(baseIndex + 2, baseIndex + 7, baseIndex + 6);
      
      // Top face
      // First triangle
      indices.push(baseIndex + 1, baseIndex + 2, baseIndex + 6);
      // Second triangle
      indices.push(baseIndex + 1, baseIndex + 6, baseIndex + 5);
      
      // Bottom face
      // First triangle
      indices.push(baseIndex, baseIndex + 7, baseIndex + 3);
      // Second triangle
      indices.push(baseIndex, baseIndex + 4, baseIndex + 7);
    }
  }
  
  // If there's a gap, add cap faces at the ends
  if (gapSize > 0) {
    const startBaseIndex = 0;
    const endBaseIndex = actualSegments * 4;
    
    // Start cap
    indices.push(
      startBaseIndex, startBaseIndex + 3, startBaseIndex + 2,
      startBaseIndex, startBaseIndex + 2, startBaseIndex + 1
    );
    
    // End cap
    indices.push(
      endBaseIndex, endBaseIndex + 1, endBaseIndex + 2,
      endBaseIndex, endBaseIndex + 2, endBaseIndex + 3
    );
  }
  
  // Apply pattern based on type
  if (patternType !== 'plain') {
    for (let i = 0; i < positions.length; i += 3) {
      const x = positions[i];
      const y = positions[i + 1];
      const z = positions[i + 2];
      
      // Calculate angle and distance from center
      const angle = Math.atan2(z, x);
      const distance = Math.sqrt(x*x + z*z);
      
      // Apply different patterns based on type
      let pattern = 0;
      
      switch (patternType) {
        case 'waves':
          pattern = Math.sin(angle * 8 * patternScale) * 0.05;
          break;
        case 'geometric':
          pattern = (Math.sin(angle * 16 * patternScale) > 0 ? 0.05 : 0);
          break;
        case 'organic':
          pattern = (Math.sin(angle * 4 * patternScale) * Math.cos(angle * 6 * patternScale)) * 0.05;
          break;
      }
      
      // Apply the pattern by adjusting the vertex position slightly
      const direction = [x / distance, 0, z / distance];
      positions[i] += direction[0] * pattern * distance;
      positions[i + 2] += direction[2] * pattern * distance;
    }
  }
  
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
  geometry.setIndex(indices);
  
  return geometry;
}

function generateMonitorStandGeometry(params: MonitorStandParams) {
  const {
    width,
    depth,
    height,
    thickness,
    legStyle,
  } = params;

  // Convert inches to centimeters for Three.js
  const widthCm = inchesToCm(width);
  const depthCm = inchesToCm(depth);
  const heightCm = inchesToCm(height);
  const thicknessCm = inchesToCm(thickness);

  // Create the top platform
  const platformGeometry = new THREE.BoxGeometry(widthCm, thicknessCm, depthCm);
  platformGeometry.translate(0, heightCm - thicknessCm / 2, 0);

  // Combine all geometries
  const geometries: THREE.BufferGeometry[] = [platformGeometry];

  // Add legs based on the selected style
  if (legStyle === 'minimal') {
    // Minimal legs - thin supports at corners
    const legThickness = inchesToCm(0.4); // Thin legs
    const legInset = inchesToCm(0.5); // Inset from edges
    
    // Four corner legs
    const positions = [
      [-widthCm/2 + legInset, 0, -depthCm/2 + legInset],
      [widthCm/2 - legInset, 0, -depthCm/2 + legInset],
      [-widthCm/2 + legInset, 0, depthCm/2 - legInset],
      [widthCm/2 - legInset, 0, depthCm/2 - legInset],
    ];
    
    for (const [x, y, z] of positions) {
      const legGeometry = new THREE.BoxGeometry(legThickness, heightCm - thicknessCm, legThickness);
      legGeometry.translate(x, (heightCm - thicknessCm) / 2, z);
      geometries.push(legGeometry);
    }
  } else if (legStyle === 'solid') {
    // Solid legs - full panels on sides
    const legHeight = heightCm - thicknessCm;
    const frontBackLegGeometry = new THREE.BoxGeometry(widthCm, legHeight, inchesToCm(0.4));
    frontBackLegGeometry.translate(0, legHeight / 2, -depthCm/2 + inchesToCm(0.2));
    geometries.push(frontBackLegGeometry);
    
    // Back panel
    const backLegGeometry = new THREE.BoxGeometry(widthCm, legHeight, inchesToCm(0.4));
    backLegGeometry.translate(0, legHeight / 2, depthCm/2 - inchesToCm(0.2));
    geometries.push(backLegGeometry);
  }

  // Merge all geometries
  const mergedGeometry = BufferGeometryUtils.mergeGeometries(geometries);
  
  return mergedGeometry;
}

function generateJewelryHolderGeometry(params: JewelryHolderParams) {
  const {
    baseWidth,
    baseDepth,
    baseHeight,
    baseStyle,
    pegHeight,
    pegDiameter,
    pegArrangement,
    pegCount,
    pegBranchStyle
  } = params;

  // Convert inches to centimeters
  const baseWidthCm = inchesToCm(baseWidth);
  const baseDepthCm = inchesToCm(baseDepth);
  const baseHeightCm = inchesToCm(baseHeight);
  const pegHeightCm = inchesToCm(pegHeight);
  const pegDiameterCm = inchesToCm(pegDiameter);

  // Create the base based on style
  let baseGeometry: THREE.BufferGeometry;
  
  switch (baseStyle) {
    case 'round':
      baseGeometry = new THREE.CylinderGeometry(
        Math.max(baseWidthCm, baseDepthCm) / 2, 
        Math.max(baseWidthCm, baseDepthCm) / 2, 
        baseHeightCm, 
        32
      );
      baseGeometry.rotateX(Math.PI / 2);
      break;
      
    case 'curved':
      // Create a curved base with beveled edges
      const curvedBaseWidth = baseWidthCm;
      const curvedBaseDepth = baseDepthCm;
      const cornerRadius = Math.min(curvedBaseWidth, curvedBaseDepth) * 0.2;
      
      const curvedBaseShape = new THREE.Shape();
      curvedBaseShape.moveTo(-curvedBaseWidth / 2 + cornerRadius, -curvedBaseDepth / 2);
      curvedBaseShape.lineTo(curvedBaseWidth / 2 - cornerRadius, -curvedBaseDepth / 2);
      curvedBaseShape.quadraticCurveTo(curvedBaseWidth / 2, -curvedBaseDepth / 2, curvedBaseWidth / 2, -curvedBaseDepth / 2 + cornerRadius);
      curvedBaseShape.lineTo(curvedBaseWidth / 2, curvedBaseDepth / 2 - cornerRadius);
      curvedBaseShape.quadraticCurveTo(curvedBaseWidth / 2, curvedBaseDepth / 2, curvedBaseWidth / 2 - cornerRadius, curvedBaseDepth / 2);
      curvedBaseShape.lineTo(-curvedBaseWidth / 2 + cornerRadius, curvedBaseDepth / 2);
      curvedBaseShape.quadraticCurveTo(-curvedBaseWidth / 2, curvedBaseDepth / 2, -curvedBaseWidth / 2, curvedBaseDepth / 2 - cornerRadius);
      curvedBaseShape.lineTo(-curvedBaseWidth / 2, -curvedBaseDepth / 2 + cornerRadius);
      curvedBaseShape.quadraticCurveTo(-curvedBaseWidth / 2, -curvedBaseDepth / 2, -curvedBaseWidth / 2 + cornerRadius, -curvedBaseDepth / 2);
      
      const curvedBaseExtrudeSettings = {
        steps: 1,
        depth: baseHeightCm,
        bevelEnabled: true,
        bevelThickness: 0.2,
        bevelSize: 0.2,
        bevelOffset: 0,
        bevelSegments: 3
      };
      
      baseGeometry = new THREE.ExtrudeGeometry(curvedBaseShape, curvedBaseExtrudeSettings);
      baseGeometry.rotateX(Math.PI / 2);
      break;
      
    case 'tiered':
      // Create a tiered base with multiple levels
      const tierCount = 3;
      const tierGeometries: THREE.BufferGeometry[] = [];
      
      for (let i = 0; i < tierCount; i++) {
        const tierScale = 1 - (i * 0.2);
        const tierWidth = baseWidthCm * tierScale;
        const tierDepth = baseDepthCm * tierScale;
        const tierHeight = baseHeightCm / tierCount;
        const tierY = i * tierHeight;
        
        const tierGeometry = new THREE.BoxGeometry(tierWidth, tierHeight, tierDepth);
        tierGeometry.translate(0, tierY + tierHeight / 2, 0);
        tierGeometries.push(tierGeometry);
      }
      
      baseGeometry = BufferGeometryUtils.mergeGeometries(tierGeometries);
      break;
      
    case 'square':
    default:
      // Default square base
      baseGeometry = new THREE.BoxGeometry(baseWidthCm, baseHeightCm, baseDepthCm);
      baseGeometry.translate(0, baseHeightCm / 2, 0);
      break;
  }

  // Combine all geometries
  const geometries: THREE.BufferGeometry[] = [baseGeometry];
  
  // Function to create branches based on style
  const createBranches = (pegGeometry: THREE.BufferGeometry, x: number, y: number, z: number): THREE.BufferGeometry[] => {
    const branchGeometries: THREE.BufferGeometry[] = [pegGeometry];
    
    if (pegBranchStyle === 'none') {
      return branchGeometries;
    }
    
    const branchDiameter = pegDiameterCm * 0.7;  // Branch diameter slightly smaller than peg
    const branchLength = pegDiameterCm * 3;      // Branch length relative to peg size
    const pegRadius = pegDiameterCm / 2;         // Radius of the peg
    
    switch (pegBranchStyle) {
      case 'simple':
        // Create a single horizontal branch - T shape
        const simpleBranch = new THREE.CylinderGeometry(
          branchDiameter / 2,
          branchDiameter / 2,
          branchLength,
          8
        );
        
        // Rotate the branch so it's horizontal (along X-axis)
        simpleBranch.rotateZ(Math.PI / 2);
        
        // Move the branch so it's centered on the peg
        simpleBranch.translate(0, 0, 0);
        
        // Now create a group to handle positioning
        const simpleBranchMesh = new THREE.Mesh(simpleBranch);
        // Position the branch near the top of the peg
        simpleBranchMesh.position.set(0, pegHeightCm * 0.85, 0);
        
        // Create a new geometry from the transformed mesh
        const simpleBranchGeometry = simpleBranchMesh.geometry.clone();
        simpleBranchGeometry.applyMatrix4(simpleBranchMesh.matrix);
        
        // Finally, translate the entire branch to the peg's position
        simpleBranchGeometry.translate(x, y, z);
        
        branchGeometries.push(simpleBranchGeometry);
        break;
        
      case 'tree':
        // Create a tree-like structure with branches coming up at angles
        const treeBaseHeight = pegHeightCm * 0.5; // Start branches halfway up
        const branchAngles = [30, 60, 120, 150]; // Angles in degrees for upward branches
        
        for (let i = 0; i < branchAngles.length; i++) {
          // Create an angled branch that points upward
          const upBranch = new THREE.CylinderGeometry(
            branchDiameter / 3, // Thinner at top
            branchDiameter / 2, // Thicker at bottom
            branchLength * 0.7,  // Shorter than simple branch
            8
          );
          
          // Create a mesh to handle complex transforms
          const branchMesh = new THREE.Mesh(upBranch);
          
          // Rotate to point up at an angle (convert degrees to radians)
          const angleRad = (branchAngles[i] * Math.PI) / 180;
          branchMesh.rotation.z = Math.PI / 2 - angleRad; // Rotate from horizontal to angled
          
          if (i >= 2) {
            // Second half of branches go in opposite direction
            branchMesh.rotation.y = Math.PI;
          }
          
          // Position at the right height on the peg
          branchMesh.position.set(0, treeBaseHeight, 0);
          
          // Extract the transformed geometry
          const branchGeometry = branchMesh.geometry.clone();
          branchGeometry.applyMatrix4(branchMesh.matrix);
          
          // Move to the peg's position
          branchGeometry.translate(x, y, z);
          
          branchGeometries.push(branchGeometry);
        }
        
        // Add a small ball at the top for aesthetics
        const topSphere = new THREE.SphereGeometry(branchDiameter * 0.8, 8, 8);
        topSphere.translate(0, pegHeightCm * 1.1, 0); // Position at top of peg
        topSphere.translate(x, y, z); // Move to peg position
        branchGeometries.push(topSphere);
        
        break;
        
      case 'cross':
        // Create a proper cross shape with horizontal and vertical bars
        
        // Horizontal bar (wider and shorter than the simple branch)
        const horizontalBar = new THREE.CylinderGeometry(
          branchDiameter / 2,
          branchDiameter / 2,
          branchLength * 1.2, // Wider than simple
          8
        );
        
        // Rotate to horizontal
        horizontalBar.rotateZ(Math.PI / 2);
        
        // Create a mesh for transformation
        const horizontalMesh = new THREE.Mesh(horizontalBar);
        horizontalMesh.position.set(0, pegHeightCm * 0.65, 0); // Position near top
        
        // Extract transformed geometry
        const horizontalGeometry = horizontalMesh.geometry.clone();
        horizontalGeometry.applyMatrix4(horizontalMesh.matrix);
        horizontalGeometry.translate(x, y, z);
        branchGeometries.push(horizontalGeometry);
        
        // Vertical bar (taller)
        const verticalBar = new THREE.CylinderGeometry(
          branchDiameter / 2,
          branchDiameter / 2,
          branchLength * 0.7, // Shorter than horizontal
          8
        );
        
        // No rotation needed for vertical
        
        // Create a mesh for positioning
        const verticalMesh = new THREE.Mesh(verticalBar);
        // Position it at the center of the horizontal bar but higher
        verticalMesh.position.set(0, pegHeightCm * 0.65 + branchLength * 0.35, 0);
        
        // Extract transformed geometry
        const verticalGeometry = verticalMesh.geometry.clone();
        verticalGeometry.applyMatrix4(verticalMesh.matrix);
        verticalGeometry.translate(x, y, z);
        branchGeometries.push(verticalGeometry);
        
        break;
    }
    
    return branchGeometries;
  };
  
  // Create a peg template
  const pegGeometry = new THREE.CylinderGeometry(pegDiameterCm / 2, pegDiameterCm / 2, pegHeightCm, 8);
  
  // Generate pegs based on arrangement
  switch (pegArrangement) {
    case 'linear':
      // Place pegs in a line across the center of the base
      const lineSpacing = baseWidthCm / (pegCount + 1);
      for (let i = 1; i <= pegCount; i++) {
        const x = -baseWidthCm / 2 + i * lineSpacing;
        const y = baseHeightCm + pegHeightCm / 2;
        const z = 0;
        
        const pegInstance = pegGeometry.clone();
        pegInstance.translate(x, y, z);
        
        // Add branches to the peg
        const branches = createBranches(pegInstance, x, y, z);
        geometries.push(...branches);
      }
      break;
      
    case 'circular':
      // Place pegs in a circle on the base
      const radius = Math.min(baseWidthCm, baseDepthCm) * 0.4;
      for (let i = 0; i < pegCount; i++) {
        const angle = (i / pegCount) * Math.PI * 2;
        const x = Math.cos(angle) * radius;
        const y = baseHeightCm + pegHeightCm / 2;
        const z = Math.sin(angle) * radius;
        
        const pegInstance = pegGeometry.clone();
        pegInstance.translate(x, y, z);
        
        // Add branches to the peg
        const branches = createBranches(pegInstance, x, y, z);
        geometries.push(...branches);
      }
      break;
      
    case 'scattered':
      // Place pegs randomly on the base
      for (let i = 0; i < pegCount; i++) {
        // Random position, but keep away from edges
        const x = (Math.random() - 0.5) * (baseWidthCm - pegDiameterCm);
        const y = baseHeightCm + pegHeightCm / 2;
        const z = (Math.random() - 0.5) * (baseDepthCm - pegDiameterCm);
        
        const pegInstance = pegGeometry.clone();
        pegInstance.translate(x, y, z);
        
        // Add branches to the peg
        const branches = createBranches(pegInstance, x, y, z);
        geometries.push(...branches);
      }
      break;
  }

  // Merge all geometries
  const mergedGeometry = BufferGeometryUtils.mergeGeometries(geometries);
  
  return mergedGeometry;
}

function ParametricShape({ params, meshRef }: ParametricShapeProps) {
  const geometry = useMemo(() => {
    const params_ = cloneDeep(params)
    switch (params_.type) {
      case 'standard':
        return generateStandardGeometry(params_ as StandardShapeParams)
      case 'coaster':
        return generateCoasterGeometry(params_ as CoasterShapeParams)
      case 'wallArt':
        return generateWallArtGeometry(params_ as WallArtParams)
      case 'candleHolder':
        return generateCandleHolderGeometry(params_ as CandleHolderParams)
      case 'bowl':
        return generateBowlGeometry(params_ as BowlParams)
      case 'cylinderBase':
        return generateCylinderBaseGeometry(params_ as CylinderBaseParams)
      case 'phoneHolder':
        return generatePhoneHolderGeometry(params_ as PhoneHolderParams)
      case 'bracelet':
        return generateBraceletGeometry(params_ as BraceletParams)
      case 'pencilHolder':
        return generatePencilHolderGeometry(params_ as PencilHolderParams)
      case 'charmAttachment':
        return generateCharmAttachmentGeometry(params_ as CharmAttachmentParams)
      case 'ring':
        return generateRingGeometry(params_ as RingParams)
      case 'monitorStand':
        return generateMonitorStandGeometry(params_ as MonitorStandParams)
      case 'jewelryHolder':
        return generateJewelryHolderGeometry(params_ as JewelryHolderParams)
      default:
        return generateStandardGeometry(params_ as StandardShapeParams)
    }
  }, [params])

  const materialConfig = materials[params.material]

  if (!materialConfig) {
    console.warn(`Material ${params.material} not found, falling back to matte`)
    return (
      <group>
        <mesh ref={meshRef}>
          {isThreeBufferGeometry(geometry) ? (
            <primitive object={geometry} />
          ) : (
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
          )}
          <meshStandardMaterial {...materials.matte.props} />
        </mesh>
      </group>
    )
  }

  return (
    <group>
      <mesh ref={meshRef}>
        {isThreeBufferGeometry(geometry) ? (
          <primitive object={geometry} />
        ) : (
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
        )}
        {materialConfig.type === "basic" ? (
          <meshBasicMaterial {...materialConfig.props} />
        ) : (
          <meshStandardMaterial {...materialConfig.props} />
        )}
      </mesh>
    </group>
  )
}

// Helper function to type check geometry
function isThreeBufferGeometry(geometry: THREE.BufferGeometry | { vertices: number[], indices: number[], normals: number[] }): geometry is THREE.BufferGeometry {
  return geometry instanceof THREE.BufferGeometry;
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

                {(shapeParams.type === 'coaster' || shapeParams.type === 'wallArt' || shapeParams.type === 'candleHolder' || shapeParams.type === 'bracelet' || shapeParams.type === 'ring') && (
                  <div className="space-y-3">
                    <Label className="text-sm font-medium">Pattern Type</Label>
                    <Select 
                      value={(() => {
                        switch (shapeParams.type) {
                          case 'coaster':
                            return (shapeParams as CoasterShapeParams).patternType;
                          case 'wallArt':
                            return (shapeParams as WallArtParams).patternType;
                          case 'candleHolder':
                            return (shapeParams as CandleHolderParams).patternType;
                          case 'bracelet':
                            return (shapeParams as BraceletParams).patternType;
                          case 'ring':
                            return (shapeParams as RingParams).patternType;
                          default:
                            return 'plain';
                        }
                      })()}
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
                        {shapeParams.type === 'ring' && (
                          <>
                            <SelectItem value="plain" className="text-white hover:bg-zinc-800">Plain</SelectItem>
                            <SelectItem value="waves" className="text-white hover:bg-zinc-800">Waves</SelectItem>
                            <SelectItem value="geometric" className="text-white hover:bg-zinc-800">Geometric</SelectItem>
                            <SelectItem value="organic" className="text-white hover:bg-zinc-800">Organic</SelectItem>
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
                          ? ((shapeParams as any)[control.id]?.toFixed?.(
                              shapeParams.type === 'ring' ? 2 : 
                              control.step === 0.01 ? 2 : 
                              control.step === 0.1 ? 1 : 0
                            ) || (shapeParams as any)[control.id])
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

                {shapeParams.type === 'charmAttachment' && (
                  <>
                    <div className="space-y-1.5">
                      <p className="text-sm text-zinc-400">
                        A flat charm bail with a loop and horizontal pin that can be attached to existing 3D models.
                      </p>
                    </div>
                  </>
                )}

                {shapeParams.type === 'monitorStand' && (
                  <>
                    <div className="flex flex-col space-y-2">
                      <Label className="text-white">Leg Style</Label>
                      <Select
                        value={(shapeParams as MonitorStandParams).legStyle}
                        onValueChange={(value) => {
                          updateParam("legStyle", value);
                        }}
                      >
                        <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white">
                          <SelectValue placeholder="Select leg style" />
                        </SelectTrigger>
                        <SelectContent className="bg-zinc-900 border-zinc-700">
                          <SelectItem value="minimal" className="text-white hover:bg-zinc-800">Minimal</SelectItem>
                          <SelectItem value="solid" className="text-white hover:bg-zinc-800">Solid</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </>
                )}

                {shapeParams.type === 'jewelryHolder' && (
                  <>
                    <div className="flex flex-col space-y-2">
                      <Label className="text-white">Base Style</Label>
                      <Select
                        value={(shapeParams as JewelryHolderParams).baseStyle}
                        onValueChange={(value) => {
                          updateParam("baseStyle", value);
                        }}
                      >
                        <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white">
                          <SelectValue placeholder="Select base style" />
                        </SelectTrigger>
                        <SelectContent className="bg-zinc-900 border-zinc-700">
                          <SelectItem value="square" className="text-white hover:bg-zinc-800">Square</SelectItem>
                          <SelectItem value="round" className="text-white hover:bg-zinc-800">Round</SelectItem>
                          <SelectItem value="curved" className="text-white hover:bg-zinc-800">Curved</SelectItem>
                          <SelectItem value="tiered" className="text-white hover:bg-zinc-800">Tiered</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex flex-col space-y-2">
                      <Label className="text-white">Peg Arrangement</Label>
                      <Select
                        value={(shapeParams as JewelryHolderParams).pegArrangement}
                        onValueChange={(value) => {
                          updateParam("pegArrangement", value);
                        }}
                      >
                        <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white">
                          <SelectValue placeholder="Select peg arrangement" />
                        </SelectTrigger>
                        <SelectContent className="bg-zinc-900 border-zinc-700">
                          <SelectItem value="linear" className="text-white hover:bg-zinc-800">Linear</SelectItem>
                          <SelectItem value="circular" className="text-white hover:bg-zinc-800">Circular</SelectItem>
                          <SelectItem value="scattered" className="text-white hover:bg-zinc-800">Scattered</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex flex-col space-y-2">
                      <Label className="text-white">Peg Branch Style</Label>
                      <Select
                        value={(shapeParams as JewelryHolderParams).pegBranchStyle}
                        onValueChange={(value) => {
                          updateParam("pegBranchStyle", value);
                        }}
                      >
                        <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white">
                          <SelectValue placeholder="Select branch style" />
                        </SelectTrigger>
                        <SelectContent className="bg-zinc-900 border-zinc-700">
                          <SelectItem value="none" className="text-white hover:bg-zinc-800">None</SelectItem>
                          <SelectItem value="simple" className="text-white hover:bg-zinc-800">Simple</SelectItem>
                          <SelectItem value="tree" className="text-white hover:bg-zinc-800">Tree</SelectItem>
                          <SelectItem value="cross" className="text-white hover:bg-zinc-800">Cross</SelectItem>
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


