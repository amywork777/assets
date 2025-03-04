"use client"

import { useState, useRef, Suspense, useCallback, useEffect, useMemo } from "react"
import { Canvas } from "@react-three/fiber"
import { OrbitControls, Environment, MeshTransmissionMaterial, Center, PerspectiveCamera } from "@react-three/drei"
import { Slider } from "@/components/ui/slider"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Download, Upload } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { STLExporter } from 'three/addons/exporters/STLExporter.js'
import { STLLoader } from 'three/addons/loaders/STLLoader.js'
import * as THREE from 'three'
import { DoubleSide } from 'three'
import Image from 'next/image'
import { cloneDeep } from 'lodash'
import * as BufferGeometryUtils from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import Link from 'next/link'
import { useFrame } from "@react-three/fiber"
import { supabase, uploadSTLFile, testSupabaseConnection, UploadedModel } from './lib/supabase'

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
  customizable: boolean; // Add customizable property
}

const categories: Record<string, CategoryInfo> = {
  cylinderBase: {
    name: "Base",
    description: "Solid bases for lamps, vases, or display stands. Simple, clean design with top and bottom closed. Choose from cylinder, star, or square shapes. For custom dimensions or special requests, use our Custom Order button.",
    priceInfo: {
      small: {
        dimensions: "3.5 x 3.5 x 1 in",
        price: 19.99,
        priceId: "price_1Ot41TI0wQgEQ20bwwJFuJZt"
      },
      medium: {
        dimensions: "5 x 5 x 1.5 in",
        price: 29.99,
        priceId: "price_1Ot42FI0wQgEQ20bYkHPLKAO"
      }
    },
    defaults: {
      type: 'cylinderBase',
      shape: 'cylinder',
      material: 'shiny',
      height: 2,
      diameter: 10,
      flowerPetals: 6,
      petalPointiness: 0.3
    },
    customizable: true, // Mark as customizable
  },
  phoneHolder: {
    name: "Phone Holder",
    description: "A customizable phone holder for your desk.",
    priceInfo: {
      small: { dimensions: "4 x 4 x 5 in", price: 18.99, priceId: "price_1Ot41TI0wQgEQ20bwwJFuJZt" },
      medium: { dimensions: "4.5 x 4.5 x 5.5 in", price: 21.99, priceId: "price_1Ot42FI0wQgEQ20bYkHPLKAO" },
    },
    defaults: {
      type: 'phoneHolder',
      material: 'shiny',
      baseWidth: 4,
      baseDepth: 4,
      height: 5,
      angle: 65,
      phoneThickness: 0.5,
      lipHeight: 0.75,
      cableOpening: true,
      standThickness: 0.5,
    },
    customizable: true, // Mark as customizable
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
    },
    customizable: true, // Mark as customizable
  },
  napkinHolder: {
    name: 'Napkin Holder',
    description: 'Elegant napkin holder with two upright panels to keep napkins organized and accessible.',
    priceInfo: {
      small: { dimensions: '6"W × 3"D × 4"H', price: 29.99, priceId: 'price_napkinholder_small' },
      medium: { dimensions: '7"W × 3.5"D × 5"H', price: 39.99, priceId: 'price_napkinholder_medium' },
    },
    defaults: {
      type: 'napkinHolder',
      material: 'shiny',
      baseWidth: 6,
      baseDepth: 3,
      baseHeight: 0.75,
      wallThickness: 0.2,
      wallHeight: 4,
      wallStyle: 'curved',
      openingWidth: 5,
    },
    customizable: true, // Mark as customizable
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
    },
    customizable: true, // Mark as customizable
  },
  ring: {
    name: "Ring",
    description: "A customizable ring that can be adjusted to your finger size.",
    priceInfo: {
      small: {
        dimensions: "0.8 x 0.2 x 0.1 in",
        price: 14.99,
        priceId: "price_1Ot42FI0wQgEQ20bYkHPLKAO"
      },
      medium: {
        dimensions: "1.0 x 0.3 x 0.15 in",
        price: 19.99,
        priceId: "price_1Ot42FI0wQgEQ20bYkHPLKAO"
      }
    },
    defaults: {
      type: 'ring',
      material: 'shiny',
      innerDiameter: 0.8,
      thickness: 0.1,
      width: 0.25,
      patternType: 'plain',
      patternScale: 1.0,
      gapSize: 0
    },
    customizable: true,
  },
  coaster: {
    name: "Decorative Coaster",
    description: "Stylish protection for your surfaces with unique patterns. For custom dimensions or special requests, use our Custom Order button.",
    priceInfo: {
      mini: {
        dimensions: "2\" × 2\" × 0.25\"",
        price: 15,
        priceId: "price_1QmGnoCLoBz9jXRliwBcAA5a"
      },
      small: {
        dimensions: "3.5\" × 3.5\" × 0.5\"",
        price: 20,
        priceId: "price_1QmGpfCLoBz9jXRlBcrkWyUj"
      },
      medium: {
        dimensions: "5\" × 5\" × 0.75\"",
        price: 25,
        priceId: "price_1QmGquCLoBz9jXRlh9SG2fqs"
      }
    },
    defaults: {
      type: 'coaster',
      diameter: 10,
      thickness: 0.5,
      patternType: 'hexagonal',
      patternScale: 1,
      patternDepth: 0.2,
      rimHeight: 0.3,
      material: "shiny" as const,
    },
    customizable: true, // Change from ready-made to customizable
  },
  monitorStand: {
    name: "Monitor Stand",
    description: "Elevate your monitor for improved ergonomics and organize your desk space.",
    priceInfo: {
      small: {
        dimensions: "12 x 8 x 3 in",
        price: 34.99,
        priceId: "price_1Ot42FI0wQgEQ20bYkHPLKAO"
      },
      medium: {
        dimensions: "15 x 10 x 4 in",
        price: 44.99,
        priceId: "price_1Ot42FI0wQgEQ20bYkHPLKAO"
      }
    },
    defaults: {
      type: 'monitorStand',
      width: 12,
      depth: 8,
      height: 3,
      thickness: 0.8,
      legStyle: 'minimal',
      material: 'matte', // Add missing material property
    },
    customizable: true, // Change from ready-made to customizable
  },
  jewelryHolder: {
    name: "Jewelry Holder",
    description: "An elegant organizer for necklaces, earrings, and other jewelry items with customizable pegs.",
    priceInfo: {
      small: {
        dimensions: "5 x 5 x 6 in",
        price: 29.99,
        priceId: "price_1Ot42FI0wQgEQ20bYkHPLKAO"
      },
      medium: {
        dimensions: "6 x 6 x 8 in",
        price: 39.99,
        priceId: "price_1Ot42FI0wQgEQ20bYkHPLKAO"
      }
    },
    defaults: {
      type: 'jewelryHolder',
      material: 'shiny',
      baseWidth: 5,
      baseDepth: 5,
      baseHeight: 1,
      baseStyle: 'round',
      pegHeight: 4,
      pegDiameter: 0.4,
      pegArrangement: 'circular',
      pegCount: 5
    },
    customizable: true,
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
    customizable: true,
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
    customizable: true,
  },
  vase: {
    name: "Vase",
    description: "Create elegant vases for flowers and decorative displays. For custom dimensions or special requests, use our Custom Order button.",
    priceInfo: {
      mini: {
        dimensions: "3\" × 3\" × 4\"",
        price: 30,
        priceId: "price_1QmGnoCLoBz9jXRliwBcAA5a"
      },
      small: {
        dimensions: "4\" × 4\" × 6\"",
        price: 40,
        priceId: "price_1QmGpfCLoBz9jXRlBcrkWyUj"
      },
      medium: {
        dimensions: "5\" × 5\" × 8\"",
        price: 50,
        priceId: "price_1QmGquCLoBz9jXRlh9SG2fqs"
      }
    },
    defaults: {
      type: 'standard' as const,
      height: 24,
      topRadius: 8,
      bottomRadius: 5,
      waveAmplitude: 1.5,
      waveFrequency: 3,
      twist: 1.2,
      hasBottom: true,
      hasTop: false,
      material: "shiny" as const,
    },
    customizable: true, // Add customizable property
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
    customizable: true,
  },
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
      hasBottom: false, // Bottom open
      hasTop: false,    // Top open
      material: "shiny" as const,
    },
    customizable: true,
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
    },
    customizable: true, // Change from ready-made to customizable
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
        { id: "hasBottom" as const, label: "Has Bottom", min: 0, max: 1, step: 1 },
        { id: "hasTop" as const, label: "Has Top", min: 0, max: 1, step: 1 },
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
        { id: "pegCount" as const, label: "Number of Branches", min: 3, max: 8, step: 1 },
      ] as const
    case 'napkinHolder':
      return [
        { id: "baseWidth" as const, label: "Base Width (in)", min: 4, max: 8, step: 0.5 },
        { id: "baseDepth" as const, label: "Base Depth (in)", min: 4, max: 8, step: 0.5 },
        { id: "baseHeight" as const, label: "Base Height (in)", min: 0.5, max: 1.5, step: 0.1 },
        { id: "wallThickness" as const, label: "Wall Thickness (in)", min: 0.1, max: 0.5, step: 0.05 },
        { id: "wallHeight" as const, label: "Wall Height (in)", min: 1, max: 5, step: 0.5 },
        { id: "openingWidth" as const, label: "Opening Width (in)", min: 2, max: 5, step: 0.5 },
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
    type: 'physical',
    props: {
      color: '#ffffff',
      metalness: 0.9,
      roughness: 0.1,
      reflectivity: 1.0,
      envMapIntensity: 2.0,
      metalness: 1.0,
      roughness: 0.2,
      clearcoat: 1.0,
      clearcoatRoughness: 0.1,
      envMapIntensity: 1.5,
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
  scaleX?: number
  scaleY?: number
  scaleZ?: number
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
  hasTop?: boolean  // New property to control top cap
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
}

interface NapkinHolderParams extends BaseShapeParams {
  type: 'napkinHolder';
  baseWidth: number;
  baseDepth: number;
  baseHeight: number;
  wallThickness: number;
  wallHeight: number;
  wallStyle: 'curved' | 'straight';
  openingWidth: number;
}

// Update ShapeParams type to include uploaded type
interface UploadedShapeParams extends BaseShapeParams {
  type: 'uploaded'
  uploadedGeometry?: THREE.BufferGeometry
}

// Update the ShapeParams union type
type ShapeParams = StandardShapeParams | CoasterShapeParams | WallArtParams | CandleHolderParams | BowlParams | CylinderBaseParams | PhoneHolderParams | BraceletParams | PencilHolderParams | CharmAttachmentParams | RingParams | MonitorStandParams | JewelryHolderParams | NapkinHolderParams | UploadedShapeParams

interface ParametricShapeProps {
  params: ShapeParams
  meshRef: React.RefObject<THREE.Mesh>
}

interface SceneProps {
  params: ShapeParams & { meshRef: React.RefObject<THREE.Mesh> }
}

function Scene({ params }: SceneProps) {
  const { meshRef, ...shapeParams } = params
  
  // Product-specific camera and scale adjustments for main view
  const getProductSettings = () => {
    let cameraPosition: [number, number, number] = [70, 35, 70];
    let scale = 0.3;
    let fov = 20;
    
    switch (shapeParams.type) {
      case 'standard': // This is for lampshade/vase products
        // Since we can't easily tell if this is a lampshade or vase here,
        // use settings that work well for both
        cameraPosition = [90, 70, 90]; // Pulled back for both
        scale = 0.15; // Smaller scale
        fov = 16;
        break;
      case 'coaster':
        cameraPosition = [0, 80, 0.1]; // Pull back significantly for coaster
        scale = 0.18;
        fov = 15;
        break;
      case 'wallArt':
        cameraPosition = [0, 0, 90]; // Pull back significantly for wall art
        scale = 0.1;
        fov = 15;
        break;
      case 'candleHolder':
        cameraPosition = [65, 50, 65];
        scale = 0.25;
        fov = 18;
        break;
      case 'bowl':
        cameraPosition = [60, 65, 60];
        scale = 0.2;
        fov = 18;
        break;
      case 'cylinderBase': // Base
        cameraPosition = [45, 55, 45];
        scale = 0.2;
        fov = 18;
        break;
      case 'phoneHolder':
        cameraPosition = [65, 45, 65];
        scale = 0.25;
        fov = 18;
        break;
      case 'bracelet':
        cameraPosition = [50, 30, 50];
        scale = 0.45;
        fov = 18;
        break;
      case 'pencilHolder':
        cameraPosition = [65, 60, 65];
        scale = 0.25;
        fov = 18;
        break;
      case 'charmAttachment':
        cameraPosition = [45, 40, 45];
        scale = 0.5;
        fov = 18;
        break;
      case 'ring':
        cameraPosition = [40, 40, 40];
        scale = 0.65;
        fov = 16;
        break;
      case 'monitorStand':
        cameraPosition = [70, 50, 70];
        scale = 0.22;
        fov = 18;
        break;
      case 'jewelryHolder':
        cameraPosition = [65, 60, 65];
        scale = 0.25;
        fov = 18;
        break;
      case 'napkinHolder':
        cameraPosition = [65, 55, 65];
        scale = 0.25;
        fov = 18;
        break;
      default:
        cameraPosition = [70, 35, 70];
        scale = 0.3;
        fov = 20;
    }
    
    return { cameraPosition, scale, fov };
  };
  
  const { cameraPosition, scale, fov } = getProductSettings();
  
  // Apply the product-specific settings
  const scaleX = shapeParams.scaleX || 1;
  const scaleY = shapeParams.scaleY || 1;
  const scaleZ = shapeParams.scaleZ || 1;
  
  return (
    <>
      <color attach="background" args={["#1a1a1a"]} />
      <ambientLight intensity={0.8} />
      <spotLight position={[10, 10, 10]} angle={0.4} penumbra={0.8} intensity={2.5} castShadow />
      <spotLight position={[-10, 10, -10]} angle={0.4} penumbra={0.8} intensity={2.5} castShadow />
      <spotLight position={[0, -10, 0]} angle={0.4} penumbra={0.8} intensity={1} castShadow />
      <Center scale={scale} position={[0, 0, 0]}>
        <group scale={[scaleX, scaleY, scaleZ]}>
          <ParametricShape params={shapeParams} meshRef={meshRef} />
        </group>
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
    hasBottom,
    hasTop = true  // Default to true for backward compatibility
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
    
    // Fix the last triangle to close the bottom cap properly
    indices.push(baseIndex, baseIndex + segments, baseIndex + 1);
  }
  
  // Add top cap if needed (was previously always added)
  if (hasTop) {
    const topIndex = vertices.length / 3
    vertices.push(0, height / 2, 0)
    normals.push(0, 1, 0)

    for (let i = 0; i <= segments; i++) {
      const theta = (i / segments) * Math.PI * 2
      // Apply twist to the top cap for consistency
      const twistAngle = twist * Math.PI * 2
      const finalTheta = theta + twistAngle
      
      // Apply wave pattern at the top for consistency
      const waveOffset = Math.sin(Math.PI * waveFrequency) * waveAmplitude
      const finalTopRadius = topRadius + waveOffset
      
      const x = Math.cos(finalTheta) * finalTopRadius
      const z = Math.sin(finalTheta) * finalTopRadius
      vertices.push(x, height / 2, z)
      normals.push(0, 1, 0)
    }

    // Connect top cap triangles in REVERSE order compared to bottom cap
    // This ensures proper orientation (facing outward) for the top cap
    for (let i = 0; i < segments; i++) {
      indices.push(topIndex, topIndex + i + 2, topIndex + i + 1)
    }
    
    // Fix the last triangle to close the top cap properly
    indices.push(topIndex, topIndex + 1, topIndex + segments);
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
    standStartIndex + 1, standStartIndex + 5, standStartIndex + 3,
    standStartIndex + 3, standStartIndex + 5, standStartIndex + 7,
    
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
  
  // Generate triangles for the top and bottom faces
  const topFaceStartIndex = 0;
  const bottomFaceStartIndex = (actualSegments + 1) * 2;
  
  // Top face triangles
  for (let i = 0; i < actualSegments; i++) {
    const innerIndex = topFaceStartIndex + i * 2;
    const outerIndex = innerIndex + 1;
    const nextInnerIndex = innerIndex + 2;
    const nextOuterIndex = outerIndex + 2;
    
    // Create two triangles for each quad on the top face
    indices.push(innerIndex, outerIndex, nextInnerIndex);
    indices.push(nextInnerIndex, outerIndex, nextOuterIndex);
  }
  
  // Bottom face triangles - note the reverse winding order for correct orientation
  for (let i = 0; i < actualSegments; i++) {
    const innerIndex = bottomFaceStartIndex + i * 2;
    const outerIndex = innerIndex + 1;
    const nextInnerIndex = innerIndex + 2;
    const nextOuterIndex = outerIndex + 2;
    
    // Create two triangles for each quad on the bottom face
    indices.push(innerIndex, nextInnerIndex, outerIndex);
    indices.push(nextInnerIndex, nextOuterIndex, outerIndex);
  }
  
  // Generate the inner wall
  for (let i = 0; i < actualSegments; i++) {
    const topInnerIndex = topFaceStartIndex + i * 2;
    const bottomInnerIndex = bottomFaceStartIndex + i * 2;
    const nextTopInnerIndex = topInnerIndex + 2;
    const nextBottomInnerIndex = bottomInnerIndex + 2;
    
    // Calculate the normal - pointing inward
    const angle = startAngle + (i / actualSegments) * (endAngle - startAngle);
    const nx = -Math.cos(angle);
    const nz = -Math.sin(angle);
    
    // Create two triangles for each quad on the inner wall
    indices.push(topInnerIndex, bottomInnerIndex, nextTopInnerIndex);
    indices.push(nextTopInnerIndex, bottomInnerIndex, nextBottomInnerIndex);
  }
  
  // Generate the outer wall
  for (let i = 0; i < actualSegments; i++) {
    const topOuterIndex = topFaceStartIndex + i * 2 + 1;
    const bottomOuterIndex = bottomFaceStartIndex + i * 2 + 1;
    const nextTopOuterIndex = topOuterIndex + 2;
    const nextBottomOuterIndex = bottomOuterIndex + 2;
    
    // Calculate the normal - pointing outward
    const angle = startAngle + (i / actualSegments) * (endAngle - startAngle);
    const nx = Math.cos(angle);
    const nz = Math.sin(angle);
    
    // Create two triangles for each quad on the outer wall
    indices.push(topOuterIndex, nextTopOuterIndex, bottomOuterIndex);
    indices.push(bottomOuterIndex, nextTopOuterIndex, nextBottomOuterIndex);
  }
  
  // Create end caps to make the bracelet watertight
  // First end cap (at the start of the C-shape)
  const startTopInner = topFaceStartIndex;
  const startTopOuter = startTopInner + 1;
  const startBottomInner = bottomFaceStartIndex;
  const startBottomOuter = startBottomInner + 1;
  
  // Calculate the normal for the start cap - facing the start angle
  const startNx = Math.cos(startAngle - Math.PI/2);
  const startNz = Math.sin(startAngle - Math.PI/2);
  
  // Add triangles for the start end cap
  indices.push(startTopInner, startBottomInner, startTopOuter);
  indices.push(startTopOuter, startBottomInner, startBottomOuter);
  
  // Second end cap (at the end of the C-shape)
  const endTopInner = topFaceStartIndex + actualSegments * 2;
  const endTopOuter = endTopInner + 1;
  const endBottomInner = bottomFaceStartIndex + actualSegments * 2;
  const endBottomOuter = endBottomInner + 1;
  
  // Calculate the normal for the end cap - facing the end angle
  const endNx = Math.cos(endAngle + Math.PI/2);
  const endNz = Math.sin(endAngle + Math.PI/2);
  
  // Add triangles for the end cap
  indices.push(endTopInner, endTopOuter, endBottomInner);
  indices.push(endBottomInner, endTopOuter, endBottomOuter);
  
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
    innerDiameter: innerDiameterInches,
    thickness: thicknessInches,
    width: widthInches,
    patternType,
    patternScale: patternScaleValue,
    gapSize
  } = params;

  // Convert to cm
  const innerDiameter = inchesToCm(innerDiameterInches);
  const thickness = inchesToCm(thicknessInches);
  const width = inchesToCm(widthInches);
  
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
  
  // The starting angle of the C-shape (half of the gap on each side)
  const startAngle = gapAngle / 2;
  const endAngle = 2 * Math.PI - gapAngle / 2;
  
  // Function to create a point on a circle at given angle
  const createCirclePoint = (diameter: number, angle: number, y: number) => {
    const radius = diameter / 2;
    const x = radius * Math.cos(angle);
    const z = radius * Math.sin(angle);
    return [x, y, z];
  };
  
  // Generate the top face
  for (let i = 0; i <= actualSegments; i++) {
    // Calculate the current angle, interpolating from start to end
    const t = i / actualSegments;
    const angle = startAngle + t * (endAngle - startAngle);
    
    // Apply pattern to the diameter if needed
    let patternOffset = 0;
    if (patternType !== 'plain') {
      // The pattern variation based on the ring's pattern type
      const patternScale = patternScaleValue * 5; // Scale the pattern
      
      switch (patternType) {
        case 'waves':
          patternOffset = thickness * 0.2 * Math.sin(angle * patternScale);
          break;
        case 'geometric':
          patternOffset = thickness * 0.15 * Math.abs(Math.sin(angle * patternScale));
          break;
        case 'organic':
          // A more random looking pattern
          patternOffset = thickness * 0.2 * (
            Math.sin(angle * patternScale) * 0.6 + 
            Math.sin(angle * patternScale * 2.7) * 0.3 + 
            Math.sin(angle * patternScale * 5.1) * 0.1
          );
          break;
      }
    }
    
    // Inner circle points (top face)
    const [innerX, innerY, innerZ] = createCirclePoint(innerDiameter - patternOffset * 2, angle, width / 2);
    vertices.push(innerX, innerY, innerZ);
    normals.push(0, 1, 0); // Top face normal
    
    // Outer circle points (top face)
    const [outerX, outerY, outerZ] = createCirclePoint(outerDiameter + patternOffset * 2, angle, width / 2);
    vertices.push(outerX, outerY, outerZ);
    normals.push(0, 1, 0); // Top face normal
  }
  
  // Generate the bottom face
  for (let i = 0; i <= actualSegments; i++) {
    // Calculate the current angle, interpolating from start to end
    const t = i / actualSegments;
    const angle = startAngle + t * (endAngle - startAngle);
    
    // Apply the same pattern for consistency
    let patternOffset = 0;
  if (patternType !== 'plain') {
      const patternScale = patternScaleValue * 5;
      
      switch (patternType) {
        case 'waves':
          patternOffset = thickness * 0.2 * Math.sin(angle * patternScale);
          break;
        case 'geometric':
          patternOffset = thickness * 0.15 * Math.abs(Math.sin(angle * patternScale));
          break;
        case 'organic':
          patternOffset = thickness * 0.2 * (
            Math.sin(angle * patternScale) * 0.6 + 
            Math.sin(angle * patternScale * 2.7) * 0.3 + 
            Math.sin(angle * patternScale * 5.1) * 0.1
          );
          break;
      }
    }
    
    // Inner circle points (bottom face)
    const [innerX, innerY, innerZ] = createCirclePoint(innerDiameter - patternOffset * 2, angle, -width / 2);
    vertices.push(innerX, innerY, innerZ);
    normals.push(0, -1, 0); // Bottom face normal
    
    // Outer circle points (bottom face)
    const [outerX, outerY, outerZ] = createCirclePoint(outerDiameter + patternOffset * 2, angle, -width / 2);
    vertices.push(outerX, outerY, outerZ);
    normals.push(0, -1, 0); // Bottom face normal
  }
  
  // Generate triangles for the top and bottom faces
  const topFaceStartIndex = 0;
  const bottomFaceStartIndex = (actualSegments + 1) * 2;
  
  // Top face triangles
  for (let i = 0; i < actualSegments; i++) {
    const innerIndex = topFaceStartIndex + i * 2;
    const outerIndex = innerIndex + 1;
    const nextInnerIndex = innerIndex + 2;
    const nextOuterIndex = outerIndex + 2;
    
    // Create two triangles for each quad on the top face
    indices.push(innerIndex, outerIndex, nextInnerIndex);
    indices.push(nextInnerIndex, outerIndex, nextOuterIndex);
  }
  
  // Bottom face triangles - note the reverse winding order for correct orientation
  for (let i = 0; i < actualSegments; i++) {
    const innerIndex = bottomFaceStartIndex + i * 2;
    const outerIndex = innerIndex + 1;
    const nextInnerIndex = innerIndex + 2;
    const nextOuterIndex = outerIndex + 2;
    
    // Create two triangles for each quad on the bottom face
    indices.push(innerIndex, nextInnerIndex, outerIndex);
    indices.push(nextInnerIndex, nextOuterIndex, outerIndex);
  }
  
  // Generate the inner wall
  for (let i = 0; i < actualSegments; i++) {
    const topInnerIndex = topFaceStartIndex + i * 2;
    const bottomInnerIndex = bottomFaceStartIndex + i * 2;
    const nextTopInnerIndex = topInnerIndex + 2;
    const nextBottomInnerIndex = bottomInnerIndex + 2;
    
    // Calculate the normal - pointing inward
    const angle = startAngle + (i / actualSegments) * (endAngle - startAngle);
    const nx = -Math.cos(angle);
    const nz = -Math.sin(angle);
    
    // Create two triangles for each quad on the inner wall
    indices.push(topInnerIndex, bottomInnerIndex, nextTopInnerIndex);
    indices.push(nextTopInnerIndex, bottomInnerIndex, nextBottomInnerIndex);
  }
  
  // Generate the outer wall
  for (let i = 0; i < actualSegments; i++) {
    const topOuterIndex = topFaceStartIndex + i * 2 + 1;
    const bottomOuterIndex = bottomFaceStartIndex + i * 2 + 1;
    const nextTopOuterIndex = topOuterIndex + 2;
    const nextBottomOuterIndex = bottomOuterIndex + 2;
    
    // Calculate the normal - pointing outward
    const angle = startAngle + (i / actualSegments) * (endAngle - startAngle);
    const nx = Math.cos(angle);
    const nz = Math.sin(angle);
    
    // Create two triangles for each quad on the outer wall
    indices.push(topOuterIndex, nextTopOuterIndex, bottomOuterIndex);
    indices.push(bottomOuterIndex, nextTopOuterIndex, nextBottomOuterIndex);
  }
  
  // Create end caps to make the ring watertight
  // First end cap (at the start of the C-shape)
  const startTopInner = topFaceStartIndex;
  const startTopOuter = startTopInner + 1;
  const startBottomInner = bottomFaceStartIndex;
  const startBottomOuter = startBottomInner + 1;
  
  // Calculate the normal for the start cap - facing the start angle
  const startNx = Math.cos(startAngle - Math.PI/2);
  const startNz = Math.sin(startAngle - Math.PI/2);
  
  // Add triangles for the start end cap
  indices.push(startTopInner, startBottomInner, startTopOuter);
  indices.push(startTopOuter, startBottomInner, startBottomOuter);
  
  // Second end cap (at the end of the C-shape)
  const endTopInner = topFaceStartIndex + actualSegments * 2;
  const endTopOuter = endTopInner + 1;
  const endBottomInner = bottomFaceStartIndex + actualSegments * 2;
  const endBottomOuter = endBottomInner + 1;
  
  // Calculate the normal for the end cap - facing the end angle
  const endNx = Math.cos(endAngle + Math.PI/2);
  const endNz = Math.sin(endAngle + Math.PI/2);
  
  // Add triangles for the end cap
  indices.push(endTopInner, endTopOuter, endBottomInner);
  indices.push(endBottomInner, endTopOuter, endBottomOuter);
  
  return { vertices, indices, normals };
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
      // Improved round base with better proportions
      const roundRadius = Math.min(baseWidthCm, baseDepthCm) / 2;
      baseGeometry = new THREE.CylinderGeometry(
        roundRadius, 
        roundRadius * 1.05, // Slightly wider at bottom for stability
        baseHeightCm, 
        32
      );
      // Center vertically with bottom at y=0
      baseGeometry.translate(0, baseHeightCm / 2, 0);
      break;
      
    case 'curved':
      // Create a curved base with proper beveled edges
      const shape = new THREE.Shape();
      const width = baseWidthCm;
      const depth = baseDepthCm;
      const radius = Math.min(width, depth) * 0.15; // Corner radius
      
      // Draw the shape with proper curves
      shape.moveTo(-width/2 + radius, -depth/2);
      shape.lineTo(width/2 - radius, -depth/2);
      shape.arc(0, radius, radius, -Math.PI/2, 0, false);
      shape.lineTo(width/2, depth/2 - radius);
      shape.arc(0, radius, radius, 0, Math.PI/2, false);
      shape.lineTo(-width/2 + radius, depth/2);
      shape.arc(0, radius, radius, Math.PI/2, Math.PI, false);
      shape.lineTo(-width/2, -depth/2 + radius);
      shape.arc(0, radius, radius, Math.PI, Math.PI*3/2, false);
      
      const extrudeSettings = {
        steps: 2,
        depth: baseHeightCm,
        bevelEnabled: true,
        bevelThickness: baseHeightCm * 0.1,
        bevelSize: baseHeightCm * 0.05,
        bevelOffset: 0,
        bevelSegments: 5
      };
      
      baseGeometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
      
      // Fix orientation and positioning
      const curvedBaseMesh = new THREE.Mesh(baseGeometry);
      curvedBaseMesh.rotation.x = -Math.PI/2; // Rotate to make the base flat on the XZ plane
      const curvedBaseGeometry = baseGeometry.clone();
      curvedBaseGeometry.applyMatrix4(curvedBaseMesh.matrix);
      
      // Adjust position so bottom is at y=0 and top surface is at y=baseHeightCm
      curvedBaseGeometry.translate(0, 0, 0);
      baseGeometry = curvedBaseGeometry;
      break;
      
    case 'tiered':
      // Create a properly tiered base with graduated levels
      const tierCount = 3;
      const tierGeometries: THREE.BufferGeometry[] = [];
      
      for (let i = 0; i < tierCount; i++) {
        // Scale each tier progressively smaller
        const tierScale = 1 - (i * 0.25);
        const tierWidth = baseWidthCm * tierScale;
        const tierDepth = baseDepthCm * tierScale;
        const tierHeight = baseHeightCm / tierCount;
        
        // Position each tier with proper stacking
        const tierY = i * tierHeight;
        
        // Create tier with rounded edges for better appearance
        const tierShape = new THREE.Shape();
        const tierRadius = Math.min(tierWidth, tierDepth) * 0.1;
        
        // Draw rounded rectangle shape for each tier
        tierShape.moveTo(-tierWidth/2 + tierRadius, -tierDepth/2);
        tierShape.lineTo(tierWidth/2 - tierRadius, -tierDepth/2);
        tierShape.arc(0, tierRadius, tierRadius, -Math.PI/2, 0, false);
        tierShape.lineTo(tierWidth/2, tierDepth/2 - tierRadius);
        tierShape.arc(0, tierRadius, tierRadius, 0, Math.PI/2, false);
        tierShape.lineTo(-tierWidth/2 + tierRadius, tierDepth/2);
        tierShape.arc(0, tierRadius, tierRadius, Math.PI/2, Math.PI, false);
        tierShape.lineTo(-tierWidth/2, -tierDepth/2 + tierRadius);
        tierShape.arc(0, tierRadius, tierRadius, Math.PI, Math.PI*3/2, false);
        
        const tierExtrudeSettings = {
          steps: 1,
          depth: tierHeight,
          bevelEnabled: false
        };
        
        const tierGeometry = new THREE.ExtrudeGeometry(tierShape, tierExtrudeSettings);
        
        // Fix orientation for each tier
        const tierMesh = new THREE.Mesh(tierGeometry);
        tierMesh.rotation.x = -Math.PI/2; // Rotate to make the tier flat on the XZ plane
        const rotatedTierGeometry = tierGeometry.clone();
        rotatedTierGeometry.applyMatrix4(tierMesh.matrix);
        
        // Position tier correctly at its height
        rotatedTierGeometry.translate(0, tierY, 0);
        
        tierGeometries.push(rotatedTierGeometry);
      }
      
      baseGeometry = BufferGeometryUtils.mergeGeometries(tierGeometries);
      break;
      
    case 'square':
    default:
      // Improved square base with slightly beveled edges
      const boxWidth = baseWidthCm;
      const boxDepth = baseDepthCm;
      const boxHeight = baseHeightCm;
      const segments = 2; // More segments for smoother edges
      
      baseGeometry = new THREE.BoxGeometry(boxWidth, boxHeight, boxDepth, segments, segments, segments);
      baseGeometry.translate(0, boxHeight / 2, 0);
      break;
  }

  // Combine all geometries
  const geometries: THREE.BufferGeometry[] = [baseGeometry];
  
  // Function to create branches based on style
  const createBranches = (pegGeometry: THREE.BufferGeometry, x: number, y: number, z: number): THREE.BufferGeometry[] => {
    const branchGeometries: THREE.BufferGeometry[] = [pegGeometry];
    
    const branchDiameter = pegDiameterCm * 0.6;  // Branch diameter smaller than peg
    const branchLength = pegDiameterCm * 3.5;    // Branch length relative to peg size
    
    // Cross design with angled hooks - using pegCount for number of branches
    const barLength = branchLength * 0.8; 
    const barWidth = branchDiameter * 0.7; // Slightly thicker bars
    
    // Use pegCount for number of branches
    const branchCount = pegCount;
    const angleStep = (2 * Math.PI) / branchCount;
    
    // Create branches distributed in a circle
        for (let i = 0; i < branchCount; i++) {
      const angle = i * angleStep;
      
      // Create a branch (horizontal bar)
      const branch = new THREE.BoxGeometry(barLength, barWidth, barWidth);
      
      // Position branch
          const branchMesh = new THREE.Mesh(branch);
      branchMesh.position.set(0, pegHeightCm * 0.9, 0);
      
      // Rotate branch to point in the right direction
      branchMesh.rotation.y = angle;
          
          const branchGeometry = branch.clone();
          branchGeometry.applyMatrix4(branchMesh.matrix);
          branchGeometry.translate(x, y, z);
          branchGeometries.push(branchGeometry);
          
      // Add angled hook and ball at the end of each branch
      const hookRadius = branchLength * 0.15;
      const hookTubeRadius = branchDiameter * 0.3;
      const hookArc = Math.PI; // 180 degree hook
      const upAngle = 30; // 30 degree upward angle
      
      // Create a curved hook
      const hook = new THREE.TorusGeometry(
        hookRadius,        // radius of the entire torus
        hookTubeRadius,    // thickness of the tube
        8,                 // tubular segments
        12,                // radial segments
        hookArc            // arc (partial torus)
      );
      
      const hookMesh = new THREE.Mesh(hook);
      
      // Position the hook at end of branch and rotate properly
      const tipX = Math.sin(angle) * (barLength/2);
      const tipZ = Math.cos(angle) * (barLength/2);
      
      hookMesh.position.set(tipX, pegHeightCm * 0.9, tipZ);
      hookMesh.rotation.y = angle + Math.PI/2;
      hookMesh.rotation.z = (upAngle * Math.PI) / 180; // Angled upward
      
      const hookGeometry = hook.clone();
      hookGeometry.applyMatrix4(hookMesh.matrix);
      hookGeometry.translate(x, y, z);
      branchGeometries.push(hookGeometry);
      
      // Add ball at end of hook
      const ball = new THREE.SphereGeometry(hookTubeRadius * 1.5, 10, 10);
          const ballMesh = new THREE.Mesh(ball);
          
      // Calculate ball position with angle adjustment
      const angleRad = (upAngle * Math.PI) / 180;
      const hookEndX = tipX + Math.sin(angle + Math.PI/2) * hookRadius * 2 * Math.cos(angleRad);
      const hookEndY = pegHeightCm * 0.9 + hookRadius * 2 * Math.sin(angleRad);
      const hookEndZ = tipZ + Math.cos(angle + Math.PI/2) * hookRadius * 2 * Math.cos(angleRad);
      
      ballMesh.position.set(hookEndX, hookEndY, hookEndZ);
          
          const ballGeometry = ball.clone();
          ballGeometry.applyMatrix4(ballMesh.matrix);
          ballGeometry.translate(x, y, z);
          branchGeometries.push(ballGeometry);
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

function generateNapkinHolderGeometry(params: NapkinHolderParams) {
  const {
    baseWidth: baseWidthInches,
    baseDepth: baseDepthInches,
    baseHeight: baseHeightInches,
    wallThickness: wallThicknessInches,
    wallHeight: wallHeightInches,
    wallStyle,
    openingWidth: openingWidthInches
  } = params;
  
  // Convert inches to cm
  const baseWidth = inchesToCm(baseWidthInches);
  const baseDepth = inchesToCm(baseDepthInches);
  const baseHeight = inchesToCm(baseHeightInches);
  const wallThickness = inchesToCm(wallThicknessInches);
  const wallHeight = inchesToCm(wallHeightInches);
  const openingWidth = inchesToCm(openingWidthInches);
  
  // Calculate dimensions for a proper napkin holder
  const baseThickness = 1.0; // cm - thickness of the base
  
  // Increase base depth to better support napkins (at least 5 inches / 12.7 cm)
  const adjustedBaseDepth = Math.max(baseDepth, inchesToCm(5));
  
  // Adjust opening width to maintain proper side wall thickness
  const adjustedOpeningWidth = Math.min(openingWidth, baseWidth - inchesToCm(1.5));
  
  // Increase wall thickness slightly for better structural integrity
  const adjustedWallThickness = Math.max(wallThickness, inchesToCm(0.25));
  
  const vertices: number[] = [];
  const indices: number[] = [];
  const normals: number[] = [];
  
  // --- BASE ---
  // Define the base - a solid rectangular prism
  // Base vertices - bottom face
  vertices.push(
    -baseWidth/2, 0, -adjustedBaseDepth/2,  // 0: bottom left back
    baseWidth/2, 0, -adjustedBaseDepth/2,   // 1: bottom right back
    baseWidth/2, 0, adjustedBaseDepth/2,    // 2: bottom right front
    -baseWidth/2, 0, adjustedBaseDepth/2    // 3: bottom left front
  );
  
  // Base normals - all pointing down
  for (let i = 0; i < 4; i++) {
    normals.push(0, -1, 0);
  }
  
  // Base top face vertices
  vertices.push(
    -baseWidth/2, baseThickness, -adjustedBaseDepth/2,  // 4: top left back
    baseWidth/2, baseThickness, -adjustedBaseDepth/2,   // 5: top right back
    baseWidth/2, baseThickness, adjustedBaseDepth/2,    // 6: top right front
    -baseWidth/2, baseThickness, adjustedBaseDepth/2    // 7: top left front
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
  
  // --- FRONT PANEL ---
  // The front panel will be a separate watertight mesh that connects to the base
  const frontPanelStartIndex = vertices.length / 3;
  const panelFullHeight = baseThickness + wallHeight;
  
  // Define the front panel thickness
  const panelThickness = adjustedWallThickness;
  
  // Front face - starting from the bottom of the base (for visual continuity)
  vertices.push(
    -baseWidth/2, 0, adjustedBaseDepth/2,           // 8: Bottom left
    baseWidth/2, 0, adjustedBaseDepth/2,            // 9: Bottom right
    -baseWidth/2, panelFullHeight, adjustedBaseDepth/2,         // 10: Top left
    baseWidth/2, panelFullHeight, adjustedBaseDepth/2           // 11: Top right
  );
  
  // Front face normals - pointing in +Z direction
  for (let i = 0; i < 4; i++) {
    normals.push(0, 0, 1);
  }
  
  // Back face of front panel
  vertices.push(
    -baseWidth/2, 0, adjustedBaseDepth/2 - panelThickness,    // 12: Bottom left
    baseWidth/2, 0, adjustedBaseDepth/2 - panelThickness,     // 13: Bottom right
    -baseWidth/2, panelFullHeight, adjustedBaseDepth/2 - panelThickness,  // 14: Top left
    baseWidth/2, panelFullHeight, adjustedBaseDepth/2 - panelThickness    // 15: Top right
  );
  
  // Back face normals - pointing in -Z direction
  for (let i = 0; i < 4; i++) {
    normals.push(0, 0, -1);
  }
  
  // Connect the front panel faces to create a watertight mesh
  indices.push(
    // Front face
    frontPanelStartIndex, frontPanelStartIndex + 1, frontPanelStartIndex + 2,
    frontPanelStartIndex + 1, frontPanelStartIndex + 3, frontPanelStartIndex + 2,
    
    // Back face
    frontPanelStartIndex + 4, frontPanelStartIndex + 6, frontPanelStartIndex + 5,
    frontPanelStartIndex + 5, frontPanelStartIndex + 6, frontPanelStartIndex + 7,
    
    // Left edge
    frontPanelStartIndex, frontPanelStartIndex + 2, frontPanelStartIndex + 4,
    frontPanelStartIndex + 4, frontPanelStartIndex + 2, frontPanelStartIndex + 6,
    
    // Right edge
    frontPanelStartIndex + 1, frontPanelStartIndex + 5, frontPanelStartIndex + 3,
    frontPanelStartIndex + 5, frontPanelStartIndex + 7, frontPanelStartIndex + 3,
    
    // Top edge
    frontPanelStartIndex + 2, frontPanelStartIndex + 3, frontPanelStartIndex + 6,
    frontPanelStartIndex + 6, frontPanelStartIndex + 3, frontPanelStartIndex + 7,
    
    // Bottom edge - critical for watertightness
    frontPanelStartIndex, frontPanelStartIndex + 4, frontPanelStartIndex + 1,
    frontPanelStartIndex + 1, frontPanelStartIndex + 4, frontPanelStartIndex + 5
  );
  
  // --- BACK PANEL ---
  // Create the back panel as a separate watertight mesh
  const backPanelStartIndex = vertices.length / 3;
  
  // Different styles for the back panel based on wallStyle
  if (wallStyle === 'curved') {
    // Create a curved back panel with increased thickness
    const numSegments = 12;
    const curveRadius = wallHeight * 0.8;
    const curveStartAngle = Math.PI / 2; // Start from vertical position
    const curveSweepAngle = Math.PI / 4; // Sweep 45 degrees
    
    // Double the panel thickness for the curved style
    const curvedThickness = adjustedWallThickness * 2.0; // Increased for better stability
    
    // First create vertices for the base-wall connection
    // Bottom face vertices (at y=0)
    vertices.push(
      // Base bottom vertices (at y=0)
      -baseWidth/2, 0, -adjustedBaseDepth/2,                      // 0: Back left bottom (outer)
      baseWidth/2, 0, -adjustedBaseDepth/2,                       // 1: Back right bottom (outer)
      -baseWidth/2, 0, -adjustedBaseDepth/2 - curvedThickness,    // 2: Back left bottom (inner)
      baseWidth/2, 0, -adjustedBaseDepth/2 - curvedThickness      // 3: Back right bottom (inner)
    );
    
    // Add normals for bottom vertices - all pointing down
    for (let i = 0; i < 4; i++) {
      normals.push(0, -1, 0);
    }
    
    // Top of base vertices (at y=baseThickness)
    vertices.push(
      -baseWidth/2, baseThickness, -adjustedBaseDepth/2,                      // 4: Back left top (outer)
      baseWidth/2, baseThickness, -adjustedBaseDepth/2,                       // 5: Back right top (outer)
      -baseWidth/2, baseThickness, -adjustedBaseDepth/2 - curvedThickness,    // 6: Back left top (inner)
      baseWidth/2, baseThickness, -adjustedBaseDepth/2 - curvedThickness      // 7: Back right top (inner)
    );
    
    // Add normals for top of base vertices - pointing up
    for (let i = 0; i < 4; i++) {
      normals.push(0, 1, 0);
    }
    
    // Connect the base vertices to form the base part of the wall
    indices.push(
      // Bottom face
      backPanelStartIndex, backPanelStartIndex + 1, backPanelStartIndex + 2,
      backPanelStartIndex + 1, backPanelStartIndex + 3, backPanelStartIndex + 2,
      
      // Outer back edge (front facing)
      backPanelStartIndex, backPanelStartIndex + 4, backPanelStartIndex + 1,
      backPanelStartIndex + 1, backPanelStartIndex + 4, backPanelStartIndex + 5,
      
      // Inner back edge (back facing)
      backPanelStartIndex + 2, backPanelStartIndex + 3, backPanelStartIndex + 6,
      backPanelStartIndex + 3, backPanelStartIndex + 7, backPanelStartIndex + 6,
      
      // Left edge
      backPanelStartIndex, backPanelStartIndex + 2, backPanelStartIndex + 4,
      backPanelStartIndex + 2, backPanelStartIndex + 6, backPanelStartIndex + 4,
      
      // Right edge
      backPanelStartIndex + 1, backPanelStartIndex + 5, backPanelStartIndex + 3,
      backPanelStartIndex + 5, backPanelStartIndex + 7, backPanelStartIndex + 3
    );
    
    // Now create curved segments starting from the top of the base
    // We'll directly connect to the vertices we already created for the base top
    const baseVertexCount = 8; // We added 8 vertices for the base part
    const firstCurveLevel = [
      backPanelStartIndex + 4, // Back left outer (connects to the base)
      backPanelStartIndex + 5, // Back right outer
      backPanelStartIndex + 6, // Back left inner
      backPanelStartIndex + 7  // Back right inner
    ];
    
    // Array to store the indices for all levels to make connections clearer
    const levelIndices: number[][] = [firstCurveLevel];
    
    // Create the curved segments
    for (let i = 1; i <= numSegments; i++) {
      const angle = curveStartAngle - (curveSweepAngle * i / numSegments);
      const yOffset = curveRadius * Math.sin(angle);
      const zOffset = curveRadius * Math.cos(angle);
      
      const y = baseThickness + wallHeight - yOffset;
      const z = -adjustedBaseDepth/2 + zOffset;
      const zInner = z - curvedThickness;
      
      const levelStartIndex = vertices.length / 3;
      
      // Add vertices for this level
      vertices.push(
        -baseWidth/2, y, z,      // Left outer
        baseWidth/2, y, z,       // Right outer
        -baseWidth/2, y, zInner, // Left inner
        baseWidth/2, y, zInner   // Right inner
      );
      
      // Normals for outer face - pointing away from the curve center
      const normalX = 0;
      const normalY = Math.sin(angle);
      const normalZ = Math.cos(angle);
      
      normals.push(
        normalX, normalY, normalZ,  // Left outer
        normalX, normalY, normalZ,  // Right outer
        -normalX, -normalY, -normalZ, // Left inner
        -normalX, -normalY, -normalZ  // Right inner
      );
      
      levelIndices.push([
        levelStartIndex,     // Left outer
        levelStartIndex + 1, // Right outer
        levelStartIndex + 2, // Left inner
        levelStartIndex + 3  // Right inner
      ]);
    }
    
    // Connect all the curve segments
    for (let i = 0; i < numSegments; i++) {
      const currentLevel = levelIndices[i];
      const nextLevel = levelIndices[i + 1];
      
      // Front (outer) face
      indices.push(
        currentLevel[0], currentLevel[1], nextLevel[0], // Left triangle
        currentLevel[1], nextLevel[1], nextLevel[0]     // Right triangle
      );
      
      // Back (inner) face
      indices.push(
        currentLevel[2], nextLevel[2], currentLevel[3], // Left triangle
        currentLevel[3], nextLevel[2], nextLevel[3]     // Right triangle
      );
      
      // Left side face
      indices.push(
        currentLevel[0], nextLevel[0], currentLevel[2], // Outer triangle
        currentLevel[2], nextLevel[0], nextLevel[2]     // Inner triangle
      );
      
      // Right side face
      indices.push(
        currentLevel[1], currentLevel[3], nextLevel[1], // Outer triangle
        currentLevel[3], nextLevel[3], nextLevel[1]     // Inner triangle
      );
    }
    
    // Add a top face to close the mesh (last level)
    const lastLevel = levelIndices[numSegments];
    indices.push(
      // Top face
      lastLevel[0], lastLevel[2], lastLevel[1], // Front half
      lastLevel[1], lastLevel[2], lastLevel[3]  // Back half
    );
  } else if (wallStyle === 'straight') {
    // Create a straight back panel with proper watertightness
    // Front face
    vertices.push(
      -baseWidth/2, 0, -adjustedBaseDepth/2,          // 0: Bottom left - at the base edge
      baseWidth/2, 0, -adjustedBaseDepth/2,           // 1: Bottom right - at the base edge
      -baseWidth/2, panelFullHeight, -adjustedBaseDepth/2,        // 2: Top left
      baseWidth/2, panelFullHeight, -adjustedBaseDepth/2          // 3: Top right
    );
    
    // Front face normals - pointing in -Z direction
    for (let i = 0; i < 4; i++) {
      normals.push(0, 0, -1);
    }
    
    // Back face
    vertices.push(
      -baseWidth/2, 0, -adjustedBaseDepth/2 - panelThickness,    // 4: Bottom left
      baseWidth/2, 0, -adjustedBaseDepth/2 - panelThickness,     // 5: Bottom right
      -baseWidth/2, panelFullHeight, -adjustedBaseDepth/2 - panelThickness,  // 6: Top left
      baseWidth/2, panelFullHeight, -adjustedBaseDepth/2 - panelThickness    // 7: Top right
    );
    
    // Back face normals - pointing in +Z direction
    for (let i = 0; i < 4; i++) {
      normals.push(0, 0, 1);
    }
    
    // Connect the straight panel faces
    indices.push(
      // Front face
      backPanelStartIndex, backPanelStartIndex + 1, backPanelStartIndex + 2,
      backPanelStartIndex + 1, backPanelStartIndex + 3, backPanelStartIndex + 2,
      
      // Back face
      backPanelStartIndex + 4, backPanelStartIndex + 6, backPanelStartIndex + 5,
      backPanelStartIndex + 5, backPanelStartIndex + 6, backPanelStartIndex + 7,
      
      // Left edge
      backPanelStartIndex, backPanelStartIndex + 2, backPanelStartIndex + 4,
      backPanelStartIndex + 4, backPanelStartIndex + 2, backPanelStartIndex + 6,
      
      // Right edge
      backPanelStartIndex + 1, backPanelStartIndex + 5, backPanelStartIndex + 3,
      backPanelStartIndex + 5, backPanelStartIndex + 7, backPanelStartIndex + 3,
      
      // Bottom face - crucial for watertightness
      backPanelStartIndex, backPanelStartIndex + 4, backPanelStartIndex + 1,
      backPanelStartIndex + 1, backPanelStartIndex + 4, backPanelStartIndex + 5,
      
      // Top edge - completes the watertight mesh
      backPanelStartIndex + 2, backPanelStartIndex + 3, backPanelStartIndex + 6,
      backPanelStartIndex + 6, backPanelStartIndex + 3, backPanelStartIndex + 7
    );
  }
  
  // Merge all meshes together by returning the complete set of vertices, indices, and normals
  return { vertices, indices, normals };
}

function ParametricShape({ params, meshRef }: ParametricShapeProps) {
  const geometry = useMemo(() => {
    const params_ = cloneDeep(params)
    switch (params_.type) {
      case 'uploaded':
        return params_.uploadedGeometry || generateStandardGeometry({ ...params_ as unknown as StandardShapeParams })
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
      case 'napkinHolder':
        return generateNapkinHolderGeometry(params_ as NapkinHolderParams)
      default:
        return generateStandardGeometry(params_ as StandardShapeParams)
    }
  }, [params])

  // Add this function to handle camera framing
  const frameGeometry = useCallback((geom: THREE.BufferGeometry | { vertices: number[], indices: number[], normals: number[] }) => {
    const geometry = isThreeBufferGeometry(geom) ? geom : new THREE.BufferGeometry().setAttribute(
      'position',
      new THREE.Float32BufferAttribute(geom.vertices, 3)
    ).setAttribute(
      'normal',
      new THREE.Float32BufferAttribute(geom.normals, 3)
    ).setIndex(
      geom.indices
    );

    if (!geometry.boundingBox) {
      geometry.computeBoundingBox();
    }
    
    const boundingBox = geometry.boundingBox;
    if (boundingBox && meshRef.current && meshRef.current.parent) {
      const scene = meshRef.current.parent;
      const camera = scene.children.find(child => child instanceof THREE.PerspectiveCamera);
      if (camera instanceof THREE.PerspectiveCamera) {
        const size = new THREE.Vector3();
        boundingBox.getSize(size);
        const maxDim = Math.max(size.x, size.y, size.z);
        const fov = camera.fov * (Math.PI / 180);
        const cameraZ = Math.abs(maxDim / Math.tan(fov / 2)) * 2.5;
        
        camera.position.set(cameraZ * 0.7, cameraZ * 0.7, cameraZ);
        camera.lookAt(0, 0, 0);
        camera.updateProjectionMatrix();
      }
    }
  }, [meshRef]);

  // Frame the geometry when it changes
  useEffect(() => {
    if (geometry) {
      frameGeometry(geometry);
    }
  }, [geometry, frameGeometry]);

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

// Add a new MiniPreview component for product cards
function MiniPreview({ categoryId, defaults }: { categoryId: string, defaults: ShapeParams }) {
  // Create a new mesh ref for the mini preview
  const meshRef = useRef<THREE.Mesh>(null);
  
  // Product-specific camera positions and scales for optimal preview in cards
  const getProductSpecificSettings = () => {
    const type = defaults.type;
    
    // Default camera position - pulling back significantly for all products
    let cameraPosition: [number, number, number] = [30, 25, 30];
    let scale = 0.22;
    let rotate = false;
    let fov = 20;
    
    switch(type) {
      case 'standard': // This is for lampshade/vase products
        // Check if this is a lampshade (we can tell by looking at categoryId)
        if (categoryId === 'lampshade') {
          cameraPosition = [30, 30, 30]; // Pulled back further for lampshade
          scale = 0.09; // Smaller scale
        } else {
          // This is for the vase
          cameraPosition = [20, 20, 20];
          scale = 0.12;
        }
        rotate = true;
        fov = 18;
        break;
      case 'coaster':
        cameraPosition = [0, 30, 0.1]; // Pull back significantly for coaster
        scale = 0.15;
        fov = 15;
        break;
      case 'wallArt':
        cameraPosition = [0, 0, 50]; // Pull back significantly for wall art
        scale = 0.08;
        fov = 14;
        break;
      case 'candleHolder':
        cameraPosition = [20, 20, 20];
        scale = 0.16;
        rotate = true;
        fov = 18;
        break;
      case 'bowl':
        cameraPosition = [20, 25, 20];
        scale = 0.15;
        fov = 18;
        break;
      case 'cylinderBase': // Base
        cameraPosition = [15, 20, 15];
        scale = 0.18;
        fov = 18;
        break;
      case 'phoneHolder':
        cameraPosition = [20, 15, 20];
        scale = 0.15;
        fov = 16;
        break;
      case 'bracelet':
        cameraPosition = [15, 10, 15];
        scale = 0.3;
        rotate = true;
        fov = 16;
        break;
      case 'pencilHolder':
        cameraPosition = [20, 20, 20];
        scale = 0.15;
        fov = 18;
        break;
      case 'charmAttachment':
        cameraPosition = [10, 10, 10];
        scale = 0.4;
        rotate = true;
        fov = 16;
        break;
      case 'ring':
        cameraPosition = [8, 8, 8];
        scale = 0.6;
        rotate = true;
        fov = 16;
        break;
      case 'monitorStand':
        cameraPosition = [25, 18, 25];
        scale = 0.08;
        fov = 16;
        break;
      case 'jewelryHolder':
        cameraPosition = [20, 20, 20];
        scale = 0.12;
        fov = 18;
        break;
      case 'napkinHolder':
        cameraPosition = [22, 15, 22];
        scale = 0.12;
        fov = 16;
        break;
    }
    
    return { cameraPosition, scale, rotate, fov };
  };
  
  const { cameraPosition, scale, rotate, fov } = getProductSpecificSettings();
  
  // Apply scale factors if they exist
  const scaleX = defaults.scaleX || 1;
  const scaleY = defaults.scaleY || 1;
  const scaleZ = defaults.scaleZ || 1;
  
  // Rotation animation for certain products
  const RotatingGroup = ({ children, rotate }: { children: React.ReactNode, rotate: boolean }) => {
    const groupRef = useRef<THREE.Group>(null);
    
    useFrame(({ clock }) => {
      if (rotate && groupRef.current) {
        groupRef.current.rotation.y = clock.getElapsedTime() * 0.5;
      }
    });
    
    return <group ref={groupRef}>{children}</group>;
  };
  
  return (
    <div className="aspect-square w-full overflow-hidden bg-zinc-900 rounded-t-md">
      <Canvas camera={{ position: cameraPosition, fov: fov }} className="w-full h-full">
        <Suspense fallback={null}>
          <color attach="background" args={["#1a1a1a"]} />
          <ambientLight intensity={0.8} />
          <spotLight position={[10, 10, 10]} angle={0.4} penumbra={0.8} intensity={2.5} castShadow />
          <spotLight position={[-10, 10, -10]} angle={0.4} penumbra={0.8} intensity={2.5} castShadow />
          <spotLight position={[0, -10, 0]} angle={0.4} penumbra={0.8} intensity={1} castShadow />
          <Center scale={scale} position={[0, 0, 0]}>
            <RotatingGroup rotate={rotate}>
              <group scale={[scaleX, scaleY, scaleZ]}>
                <ParametricShape params={defaults} meshRef={meshRef} />
              </group>
            </RotatingGroup>
          </Center>
          <Environment preset="studio" background={false} />
        </Suspense>
      </Canvas>
    </div>
  );
}

export default function Component() {
  const [currentCategory, setCurrentCategory] = useState<keyof typeof categories>("cylinderBase")
  const [shapeParams, setShapeParams] = useState<ShapeParams>({
    ...categories[currentCategory].defaults,
    scaleX: 1,
    scaleY: 1,
    scaleZ: 1
  })
  const [selectedSize, setSelectedSize] = useState<keyof CategoryPriceInfo>('small')
  const [isLoading, setIsLoading] = useState(false)
  const [key, setKey] = useState(0)
  const [addToCartStatus, setAddToCartStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const meshRef = useRef<THREE.Mesh>(null)
  const [customOrderEmail, setCustomOrderEmail] = useState("")
  const [showCustomOrderModal, setShowCustomOrderModal] = useState(false)
  const [searchQuery, setSearchQuery] = useState('') // Add search query state
  const [showAllProducts, setShowAllProducts] = useState(false) // Add state for showing all products
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'customizable' | 'ready-made'>('all') // Remove ai-generated and my-uploads options
  const [uploadedSTL, setUploadedSTL] = useState<THREE.BufferGeometry | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadedModels, setUploadedModels] = useState<UploadedModel[]>([])
  const [isUploading, setIsUploading] = useState(false)
  // Add new state variables for upload modal
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadDescription, setUploadDescription] = useState('');
  // Add isAdmin state at the top of the component
  const [isAdmin, setIsAdmin] = useState(false);

  // Extract fetchUploadedModels to be reusable
  const fetchUploadedModels = useCallback(async () => {
    const { data, error } = await supabase
      .from('assets')
      .select('*')
      .or('approved.eq.true,type.eq.ready-made')
      .order('uploaded_at', { ascending: false })

    if (error) {
      console.error('Error fetching models:', error)
    } else {
      setUploadedModels(data || [])
    }
  }, [])

  // Fetch uploaded models on component mount
  useEffect(() => {
    fetchUploadedModels()
  }, [fetchUploadedModels])

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
      // Handle boolean toggles
      if (paramId === 'cableOpening' || paramId === 'hasTop' || paramId === 'hasBottom') {
        return {
          ...prev,
          [paramId]: paramId === 'cableOpening' ? value === 'true' : Boolean(Number(value))
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
    // Preserve scale values when switching categories
    const { scaleX, scaleY, scaleZ } = shapeParams;
    setShapeParams({
      ...categories[categoryId as keyof typeof categories].defaults,
      scaleX: scaleX || 1,
      scaleY: scaleY || 1,
      scaleZ: scaleZ || 1
    })
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

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Set the selected file and initialize the title with the file name (without extension)
    setSelectedFile(file);
    setUploadTitle(file.name.replace(/\.[^/.]+$/, ''));
    setIsUploadModalOpen(true);
  };

  const handleUploadSubmit = async () => {
    if (!selectedFile || !uploadTitle) return;

    setIsUploading(true);
    try {
      // Test Supabase connection
      const { data: testData, error: testError } = await supabase.from('assets').select('*').limit(1);
      if (testError) throw new Error(`Database connection failed: ${testError.message}`);

      const fileName = `${Date.now()}-${selectedFile.name}`;

      // Upload the file
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('stls')
        .upload(fileName, selectedFile);

      if (uploadError) throw uploadError;

      // Get the public URL for the uploaded file
      const { data: { publicUrl } } = supabase.storage
        .from('stls')
        .getPublicUrl(fileName);

      // Create database entry
      const { data: modelData, error: modelError } = await supabase.from('assets').insert([
        {
          name: uploadTitle,
          description: uploadDescription,
          file_path: fileName,
          type: 'uploaded',
          material: 'matte',
          customizable: true,  // Changed from false to true
          approved: true,
          submitted_by: 'user',
          uploaded_at: new Date().toISOString(),
          price: 0,
          dimensions: {
            width: 0,
            height: 0,
            depth: 0
          }
        },
      ]).select();

      if (modelError) throw modelError;

      // Refresh the models list
      await fetchUploadedModels();

      // Reset modal state
      setIsUploadModalOpen(false);
      setSelectedFile(null);
      setUploadTitle('');
      setUploadDescription('');

    } catch (error) {
      console.error('Upload error:', error);
      alert('Error uploading file');
    } finally {
      setIsUploading(false);
    }
  };

  // Load an uploaded model
  const loadUploadedModel = useCallback(async (model: UploadedModel) => {
    try {
      setIsLoading(true);
      console.log('Loading model:', model);

      // Download the file from Supabase storage
      const { data, error } = await supabase.storage
        .from('stls')
        .download(model.file_path);

      if (error) {
        console.error('Storage download error:', error);
        throw error;
      }

      if (!data) {
        throw new Error('No data received from storage');
      }

      // Convert the blob to geometry
      const loader = new STLLoader();
      const arrayBuffer = await data.arrayBuffer();
      const geometry = loader.parse(arrayBuffer);
      
      // Center the geometry and adjust scale
      geometry.computeBoundingBox();
      const boundingBox = geometry.boundingBox;
      if (boundingBox) {
        const center = new THREE.Vector3();
        boundingBox.getCenter(center);
        geometry.translate(-center.x, -center.y, -center.z);
        
        // Calculate size and scale
        const size = new THREE.Vector3();
        boundingBox.getSize(size);
        const maxDim = Math.max(size.x, size.y, size.z);
        
        // Scale the model to be much larger (50 units instead of 10)
        const scale = 50 / maxDim;
        
        // Set the shape params with the calculated scale
        setShapeParams({
          type: 'uploaded',
          material: 'matte',  // Change from 'shiny' to 'matte' for uploaded models
          uploadedGeometry: geometry,
          scaleX: scale,
          scaleY: scale,
          scaleZ: scale,
        });

        setUploadedSTL(geometry);
      }

    } catch (error) {
      console.error('Error loading model:', error);
      alert('Failed to load model. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Filter categories based on search query and category filter
  const filteredCategories = useMemo(() => {
    // Start with the regular categories
    let allCategories = Object.entries(categories).map(([id, category]) => ({
      id,
      ...category,
      isUploaded: false
    }));
    
    // Add uploaded models as categories
    const uploadedCategories = uploadedModels.map(model => ({
      id: `uploaded-${model.id}`,
      name: model.name,
      description: model.description || '',
      customizable: false,
      isUploaded: true,
      model: model,
      priceInfo: {
        small: {
          dimensions: 'default',
          price: 0,
          priceId: ''
        }
      },
      defaults: {
        type: 'uploaded' as const,
        material: 'matte',
      }
    }));
    
    allCategories = [...allCategories, ...uploadedCategories];
    
    // Filter based on search and category
    return allCategories.filter(({ name, description, customizable, isUploaded }) => {
      // Apply search filter
      const matchesSearch = 
        name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        description.toLowerCase().includes(searchQuery.toLowerCase());
        
      // Apply category filter
      if (categoryFilter === 'all') {
        return matchesSearch;
      } else if (categoryFilter === 'customizable') {
        return matchesSearch && customizable && !isUploaded;
      } else if (categoryFilter === 'ready-made') {
        return matchesSearch && (!customizable || isUploaded);
      }
      
      return false;
    });
  }, [searchQuery, categoryFilter, categories, uploadedModels]);

  // Update the click handler for categories to handle uploaded models
  const handleCategoryClick = (category: any) => {
    if (category.isUploaded) {
      loadUploadedModel(category.model);
    } else {
      switchCategory(category.id);
    }
  };

  // Limit categories to 4 if not showing all
  const displayedCategories = useMemo(() => {
    return showAllProducts ? filteredCategories : filteredCategories.slice(0, 4);
  }, [filteredCategories, showAllProducts]);

  const hasMoreProducts = filteredCategories.length > 4;

  // Add UploadModal component
  const UploadModal = () => {
    return (
      <div className={`fixed inset-0 z-50 ${isUploadModalOpen ? 'block' : 'hidden'}`}>
        <div className="fixed inset-0 bg-black opacity-50"></div>
        <div className="fixed inset-0 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg shadow-xl w-96" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-xl font-bold mb-4 text-gray-900">Upload STL File</h2>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700">Selected File</label>
              <p className="mt-1 text-sm text-gray-500">{selectedFile?.name}</p>
            </div>
            <div className="mb-4">
              <label htmlFor="title" className="block text-sm font-medium text-gray-700">Title</label>
              <input
                type="text"
                id="title"
                value={uploadTitle}
                onChange={(e) => setUploadTitle(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-gray-900 bg-white"
                required
                autoFocus
              />
            </div>
            <div className="mb-4">
              <label htmlFor="description" className="block text-sm font-medium text-gray-700">Description</label>
              <textarea
                id="description"
                value={uploadDescription}
                onChange={(e) => setUploadDescription(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-gray-900 bg-white p-2 resize-y min-h-[100px]"
                rows={4}
                placeholder="Enter a description for your model..."
              />
            </div>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setIsUploadModalOpen(false);
                  setSelectedFile(null);
                  setUploadTitle('');
                  setUploadDescription('');
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={handleUploadSubmit}
                disabled={!uploadTitle || isUploading}
                className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isUploading ? 'Uploading...' : 'Upload'}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Add delete handler function
  const handleDeleteModel = async (modelId: string, event: React.MouseEvent) => {
    event.stopPropagation(); // Prevent triggering the card click
    
    if (!confirm('Are you sure you want to delete this model?')) return;

    try {
      // Delete from storage first
      const model = uploadedModels.find(m => m.id === modelId);
      if (!model) return;

      const { error: storageError } = await supabase.storage
        .from('stls')
        .remove([model.file_path]);

      if (storageError) throw storageError;

      // Then delete from database
      const { error: dbError } = await supabase
        .from('assets')
        .delete()
        .eq('id', modelId);

      if (dbError) throw dbError;

      // Refresh the models list
      await fetchUploadedModels();
    } catch (error) {
      console.error('Error deleting model:', error);
      alert('Failed to delete model');
    }
  };

  // Add admin toggle button in the header
  return (
    <div className="min-h-screen bg-zinc-900 text-white pb-20">
      <div className="sticky top-0 z-50 w-full border-b border-white/10 bg-zinc-900/50 backdrop-blur-sm">
        <div className="container flex h-14 max-w-screen-2xl items-center">
          <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
            <div className="w-full flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Link href="/" className="font-semibold">
                  Home
                </Link>
                <button
                  onClick={() => setIsAdmin(!isAdmin)}
                  className={`px-3 py-1 rounded text-sm ${
                    isAdmin ? 'bg-red-500 hover:bg-red-600' : 'bg-gray-600 hover:bg-gray-700'
                  }`}
                >
                  {isAdmin ? 'Exit Admin Mode' : 'Admin Mode'}
                </button>
              </div>
              <div className="flex items-center gap-4">
                <input
                  type="file"
                  accept=".stl"
                  onChange={handleFileUpload}
                  ref={fileInputRef}
                  className="hidden"
                />
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className="bg-green-500 hover:bg-green-600 text-white flex items-center justify-center gap-2"
                >
                  {isUploading ? (
                    <>
                      <span className="animate-spin">⏳</span>
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4" />
                      Upload STL to Library
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container max-w-screen-2xl pt-8">
        {/* Products grid */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-4">Products</h2>
          
          {/* Category Filter Tabs */}
          <div className="mb-4 flex flex-wrap gap-2">
            <Button 
              variant={categoryFilter === 'all' ? "default" : "outline"}
              onClick={() => setCategoryFilter('all')}
              className="text-sm bg-zinc-800 text-white hover:bg-zinc-700 border-zinc-600"
            >
              All
            </Button>
            <Button 
              variant={categoryFilter === 'customizable' ? "default" : "outline"}
              onClick={() => setCategoryFilter('customizable')}
              className="text-sm bg-zinc-800 text-white hover:bg-zinc-700 border-zinc-600"
            >
              Customizable
            </Button>
            <Button 
              variant={categoryFilter === 'ready-made' ? "default" : "outline"}
              onClick={() => setCategoryFilter('ready-made')}
              className="text-sm bg-zinc-800 text-white hover:bg-zinc-700 border-zinc-600"
            >
              Ready-made
            </Button>
          </div>
          
          {/* Add search bar */}
          <div className="mb-4">
            <div className="relative">
              <input
                type="text"
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-md text-white placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* Products grid */}
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-2 xl:grid-cols-2 2xl:grid-cols-2 gap-4">
            {displayedCategories.map((category) => (
              <div
                key={category.id}
                className="bg-white/5 p-4 rounded-lg cursor-pointer hover:bg-white/10 transition-colors relative"
                onClick={() => handleCategoryClick(category)}
              >
                <div className="flex flex-col h-full">
                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <h3 className="font-medium text-white pr-20">{category.name}</h3>
                      {isAdmin && category.isUploaded && (
                        <button
                          onClick={(e) => handleDeleteModel(category.model.id, e)}
                          className="absolute top-2 right-2 p-1 bg-red-500 hover:bg-red-600 rounded-full text-white"
                          title="Delete model"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                        </button>
                      )}
                    </div>
                    <p className="text-sm text-gray-400 mt-1">{category.description}</p>
                  </div>
                  <div className="mt-4">
                    <span className={`inline-block px-2 py-1 text-xs rounded-full ${
                      category.isUploaded
                        ? 'bg-blue-500 text-white'
                        : category.customizable
                          ? 'bg-emerald-800 text-emerald-100' 
                          : 'bg-amber-800 text-amber-100'
                    }`}>
                      {category.isUploaded ? 'Ready Made' : category.customizable ? 'Customizable' : 'Ready-made'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {/* Show more button */}
          {hasMoreProducts && (
            <Button 
              variant="secondary" 
              className="mt-4 w-full text-black"
              onClick={() => setShowAllProducts(!showAllProducts)}
            >
              {showAllProducts ? "Show Less" : `Show More (${filteredCategories.length - 4} more)`}
            </Button>
          )}
        </div>

        <div className="flex-1 grid lg:grid-cols-[1fr_320px] gap-8">
          <div className="relative rounded-2xl overflow-hidden bg-zinc-800/50 backdrop-blur-sm border border-white/10 h-[50vh] lg:h-[600px]">
            <div className="absolute inset-0">
              <Canvas camera={{ position: [70, 35, 70], fov: 20 }} className="w-full h-full">
                <Suspense fallback={null}>
                  <Scene key={key} params={{ ...shapeParams, meshRef }} />
                </Suspense>
              </Canvas>
            </div>
          </div>

          <div className="space-y-8">
            <div className="space-y-6 bg-zinc-800/50 backdrop-blur-sm border border-white/10 p-6 rounded-xl">
              <h3 className="text-lg font-semibold">Design</h3>
              
              {/* Show customization options only for customizable products */}
              {categories[currentCategory].customizable ? (
                <div className="space-y-6">
                  <div className="space-y-3">
                    <Label className="text-sm font-medium">Rendering</Label>
                    <Select value={shapeParams.material || 'shiny'} onValueChange={(value) => updateParam("material", value)}>
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
                  
                  {/* XYZ dimension sliders removed from customizable section */}
                  
                  {(shapeParams.type === 'coaster' || shapeParams.type === 'wallArt' || shapeParams.type === 'candleHolder' || shapeParams.type === 'bracelet' || shapeParams.type === 'ring' || shapeParams.type === 'bowl') && (
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
                            case 'bowl':
                              return (shapeParams as BowlParams).patternType;
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
                          {shapeParams.type === 'bowl' && (
                            <>
                              <SelectItem value="geometric" className="text-white hover:bg-zinc-800">Geometric</SelectItem>
                              <SelectItem value="stars" className="text-white hover:bg-zinc-800">Stars</SelectItem>
                              <SelectItem value="leaves" className="text-white hover:bg-zinc-800">Leaves</SelectItem>
                              <SelectItem value="abstract" className="text-white hover:bg-zinc-800">Abstract</SelectItem>
                            </>
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {/* Show other customization controls based on product type */}
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

                  {/* Product-specific controls */}
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
                    </>
                  )}

                  {shapeParams.type === 'napkinHolder' && (
                    <div className="space-y-3">
                      <Label className="text-sm font-medium">Wall Style</Label>
                      <Select
                        value={(shapeParams as NapkinHolderParams).wallStyle}
                        onValueChange={(value) => updateParam("wallStyle", value)}
                      >
                        <SelectTrigger className="bg-zinc-900 border-zinc-700 text-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-zinc-900 border-zinc-700">
                          <SelectItem value="curved" className="text-white hover:bg-zinc-800">Curved</SelectItem>
                          <SelectItem value="straight" className="text-white hover:bg-zinc-800">Straight</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {shapeParams.type === 'cylinderBase' && (
                    <div className="space-y-3">
                      <Label className="text-sm font-medium">Shape</Label>
                      <Select 
                        value={(shapeParams as CylinderBaseParams).shape}
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

                  {shapeParams.type === 'jewelryHolder' && (
                    <div className="space-y-3">
                      <Label className="text-sm font-medium">Base Style</Label>
                      <Select 
                        value={(shapeParams as JewelryHolderParams).baseStyle}
                        onValueChange={(value) => updateParam("baseStyle", value)}
                      >
                        <SelectTrigger className="bg-zinc-900 border-zinc-700 text-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-zinc-900 border-zinc-700">
                          <SelectItem value="square" className="text-white hover:bg-zinc-800">Square</SelectItem>
                          <SelectItem value="round" className="text-white hover:bg-zinc-800">Round</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>
              ) : (
                <div className="py-4 space-y-6">
                  <div className="space-y-3">
                    <Label className="text-sm font-medium">Rendering</Label>
                    <Select value={shapeParams.material || 'shiny'} onValueChange={(value) => updateParam("material", value)}>
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
                  
                  {!categories[currentCategory].customizable && (
                    <>
                      <div className="space-y-3">
                        <Label className="text-sm font-medium">Width (X)</Label>
                        <div className="flex items-center space-x-2">
                          <Slider
                            defaultValue={[1]}
                            value={[shapeParams.scaleX || 1]}
                            min={0.5}
                            max={2}
                            step={0.1}
                            onValueChange={([value]) => updateParam("scaleX", value)}
                            className="flex-1"
                          />
                          <span className="w-12 text-center text-sm">{(shapeParams.scaleX || 1).toFixed(1)}x</span>
                        </div>
                      </div>
                      
                      <div className="space-y-3">
                        <Label className="text-sm font-medium">Height (Y)</Label>
                        <div className="flex items-center space-x-2">
                          <Slider
                            defaultValue={[1]}
                            value={[shapeParams.scaleY || 1]}
                            min={0.5}
                            max={2}
                            step={0.1}
                            onValueChange={([value]) => updateParam("scaleY", value)}
                            className="flex-1"
                          />
                          <span className="w-12 text-center text-sm">{(shapeParams.scaleY || 1).toFixed(1)}x</span>
                        </div>
                      </div>
                      
                      <div className="space-y-3">
                        <Label className="text-sm font-medium">Depth (Z)</Label>
                        <div className="flex items-center space-x-2">
                          <Slider
                            defaultValue={[1]}
                            value={[shapeParams.scaleZ || 1]}
                            min={0.5}
                            max={2}
                            step={0.1}
                            onValueChange={([value]) => updateParam("scaleZ", value)}
                            className="flex-1"
                          />
                          <span className="w-12 text-center text-sm">{(shapeParams.scaleZ || 1).toFixed(1)}x</span>
                        </div>
                      </div>
                      
                      <p className="text-zinc-400 mt-4">This is a ready-made design with basic dimension adjustments.</p>
                    </>
                  )}
                </div>
              )}
            </div>

            <div className="space-y-6 bg-zinc-800/50 backdrop-blur-sm border border-white/10 p-6 rounded-xl">
              <h3 className="text-lg font-semibold">Actions</h3>
              <div className="space-y-6">
                <div className="space-y-3">
                  <Button
                    onClick={handleExportSTL}
                    disabled={isLoading}
                    className="w-full bg-blue-500 hover:bg-blue-600 text-white flex items-center justify-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    Download STL
                  </Button>
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
      {/* Upload Modal */}
      <UploadModal />
    </div>
  )
}


