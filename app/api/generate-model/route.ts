import { NextRequest, NextResponse } from "next/server";

// Load API key from environment or use a placeholder for now
const CLAUDE_API_KEY = process.env.CLAUDE_API_KEY || "";
const CLAUDE_API_URL = "https://api.anthropic.com/v1/messages";

export async function POST(req: NextRequest) {
  try {
    const { prompt, baseModel } = await req.json();
    
    if (!prompt) {
      return NextResponse.json({ error: "No prompt provided" }, { status: 400 });
    }
    
    const isRefinement = !!baseModel;
    
    if (!CLAUDE_API_KEY || CLAUDE_API_KEY === "your_api_key_here") {
      // If no API key, return a sample model for testing
      console.log("No Claude API key found. Using sample model generator.");
      const sampleModel = isRefinement ? 
        refineModelWithSampleGenerator(prompt, baseModel) : 
        generateSampleModel(prompt);
      
      return NextResponse.json({
        ...sampleModel,
        _generationMethod: "sample_generator", // Add metadata about how this was generated
        description: `${sampleModel.description} (DEMO MODE: Using sample generator - set CLAUDE_API_KEY in .env.local for AI generation)`
      });
    }
    
    console.log(`Using Claude API to ${isRefinement ? 'refine' : 'generate'} model specification...`);
    console.log(`Prompt: "${prompt}"`);
    if (isRefinement) {
      console.log("Refinement based on existing model");
    }
    
    // Prepare the system prompt for Claude
    const systemPrompt = `You are an expert 3D modeler specializing in creating detailed and visually appealing 3D models using primitive shapes and CSG (Constructive Solid Geometry) operations.

${isRefinement 
  ? `I'll provide you with a base 3D model specification and a prompt requesting changes or refinements to make to it. Your task is to modify the model based on the refinement prompt.`
  : `I'll provide a description of a 3D object, and you'll create a detailed 3D model specification from scratch.`
}

For the BEST results, follow these guidelines:
1. Create a composition of multiple primitive shapes (5-10 shapes) to build complex, detailed models.
2. Make EXTENSIVE use of CSG operations to create hollow objects, cutouts, and intricate details.
3. Consider the visual appeal and functionality of the object in your design.
4. Ensure proper positioning and scaling of all parts relative to each other.
5. Use a variety of colors and materials to enhance visual distinction between parts.
6. Prioritize realism and detail in your model specifications.
7. ALWAYS include at least 3-5 customization parameters in the customizationOptions section.

For customization parameters, include a mix of the following types:
- 'slider' parameters for continuous values like scale, size, thickness, height, or rotation
- 'select' parameters for discrete options like style variants, shape types, or feature presence
- 'boolean' parameters for toggleable features

Good customization parameter examples:
- "scale": { "type": "slider", "min": 0.5, "max": 2.0, "step": 0.1 }
- "height": { "type": "slider", "min": 0.5, "max": 3.0, "step": 0.1 }
- "thickness": { "type": "slider", "min": 0.1, "max": 0.5, "step": 0.05 }
- "style": { "type": "select", "options": ["modern", "classic", "minimalist"] }
- "showBase": { "type": "boolean" }

CSG operations are CRITICAL for creating sophisticated models:
- 'union': Combines two shapes together (use for adding parts)
- 'subtract': Cuts out one shape from another (use for hollowing, creating openings, carving details)
- 'intersect': Creates a shape that exists only where both shapes overlap (use for complex curved surfaces)

When using 'subtract' operations:
- Make the cutting shape slightly larger than the area you want to remove
- Position it precisely to ensure clean cutouts
- Use it to create hollow interiors, openings, and intricate details

Available primitive shapes include:
- box (cuboid): For rectangular structures, buildings, furniture
- sphere: For round elements, globes, planets, balls
- cylinder: For columns, pipes, handles, legs
- cone: For pointed features, roofs, tips
- torus (donut): For rings, wheels, round handles
- torusKnot: For complex decorative elements
- ring (flat ring/disc with hole): For flat circular objects with holes
- plane (flat rectangle): For panels, screens, flat surfaces
- circle (flat disc): For flat circular objects
- dodecahedron (12-sided polyhedron): For crystalline structures, gems
- icosahedron (20-sided polyhedron): For complex geometric forms
- octahedron (8-sided polyhedron): For diamond shapes, crystals
- tetrahedron (4-sided polyhedron): For pyramidal shapes
- capsule (pill shape): For rounded cylinders, pills, organic forms

Your response should be a valid JSON object with this structure:
{
  "parts": [
    {
      "geometryType": "one of the available shape types",
      "parameters": {
        // Parameters specific to the geometry type
      },
      "material": {
        "type": "standard" or "physical" or "basic",
        "color": string (hexadecimal),
        "metalness": number (0-1),
        "roughness": number (0-1),
        "wireframe": boolean
      },
      "position": [x, y, z],
      "rotation": [x, y, z] (in degrees),
      "operation": "union" or "subtract" or "intersect" (optional),
      "targetPart": number (index of the target part for CSG operations, optional)
    },
    // More parts...
  ],
  "description": "A detailed description of your 3D model",
  "customizationOptions": {
    "parameters": {
      "paramName1": {
        "type": "slider",
        "min": number,
        "max": number,
        "step": number
      },
      "paramName2": {
        "type": "select",
        "options": ["option1", "option2", ...]
      },
      "paramName3": {
        "type": "boolean"
      }
    },
    "materials": {
      "types": ["standard", "physical", "basic"],
      "colors": ["#hexcode1", "#hexcode2", ...]
    }
  }
}

Advanced Creative Examples:

1. Coffee Mug with Handle:
   - Cylinder for the main mug body (part 0)
   - Slightly smaller cylinder inside (part 1)
     - Set operation: "subtract"
     - Set targetPart: 0
     - This hollows out the mug to create the interior
   - Torus for the handle (part 2)
     - Set operation: "union"
     - Set targetPart: 0
   - Cylinder for bottom thickness (part 3)
     - Set operation: "subtract" 
     - Set targetPart: 1
     - Creates a solid bottom with proper thickness
   - Ring at the top for rim detail
     - Set operation: "union"
     - Set targetPart: 0

2. Detailed Vase with Cutout Pattern:
   - Cylinder for the main vase body (part 0)
   - Smaller cylinder inside (part 1)
     - Set operation: "subtract"
     - Set targetPart: 0
     - Hollows out the vase
   - Multiple small spheres arranged in a pattern (parts 2-9)
     - Each with operation: "subtract"
     - Each with targetPart: 0
     - Creates decorative cutout pattern in the vase surface
   - Torus at the bottom for a base (part 10)
     - Set operation: "union"
     - Set targetPart: 0

3. Architectural Column with Fluted Design:
   - Cylinder for the main column shaft (part 0)
   - Cylinder for the hollow interior (part 1)
     - Set operation: "subtract"
     - Set targetPart: 0
   - Multiple small cylinders arranged around the perimeter (parts 2-9)
     - Each with operation: "subtract"
     - Each with targetPart: 0
     - Creates fluted details on the column surface
   - Torus for the base (part 10)
     - Set operation: "union"
     - Set targetPart: 0
   - Torus for the capital (part 11)
     - Set operation: "union"
     - Set targetPart: 0

4. Mechanical Part with Holes and Details:
   - Box for the main body (part 0)
   - Multiple cylinders for bolt holes (parts 1-4)
     - Each with operation: "subtract"
     - Each with targetPart: 0
   - Cylinder for a central bore (part 5)
     - Set operation: "subtract"
     - Set targetPart: 0
   - Multiple boxes for detail features (parts 6-9)
     - Some with operation: "union" to add details
     - Some with operation: "subtract" to create recesses

${isRefinement 
  ? `Here's the original model specification:
${JSON.stringify(baseModel, null, 2)}

Apply the refinement based on this prompt, while maintaining the overall integrity of the model. You may add new parts, modify existing parts, or remove parts if needed. Remember to use CSG operations effectively to create complex details.`
  : `Create a complete model specification based on the prompt. Be creative and detailed in your design. Use CSG operations extensively to create intricately detailed and realistic models beyond what simple primitive shapes could achieve alone.`
}

Respond ONLY with the complete, valid JSON for the 3D model specification. The JSON should be directly parseable with JSON.parse().`;

    // Call Claude API
    try {
      console.log("Sending request to Claude API...");
      
      const response = await fetch(CLAUDE_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": CLAUDE_API_KEY,
          "anthropic-version": "2023-06-01"
        },
        body: JSON.stringify({
          model: "claude-3-haiku-20240307",
          max_tokens: 4000,
          system: systemPrompt,
          messages: [
            {
              role: "user",
              content: isRefinement ? 
                `Refine this 3D model with these changes: ${prompt}` : 
                `Create a 3D model specification for: ${prompt}`
            }
          ]
        })
      });

      if (!response.ok) {
        const errorData = await response.text();
        console.error("Claude API error:", errorData);
        return NextResponse.json({ 
          error: "Failed to generate model", 
          details: errorData,
          _generationMethod: "claude_api_error"
        }, { status: 500 });
      }

      console.log("Received response from Claude API");
      const data = await response.json();
      console.log("Response data:", JSON.stringify(data, null, 2));
      
      if (!data.content || !Array.isArray(data.content) || data.content.length === 0) {
        console.error("Unexpected API response format:", data);
        return NextResponse.json({ 
          error: "Unexpected API response format", 
          details: JSON.stringify(data),
          _generationMethod: "claude_api_format_error"
        }, { status: 500 });
      }
      
      const textContent = data.content.find((item: { type: string; text?: string }) => item.type === 'text')?.text || '';
      console.log("Text content:", textContent);
      
      try {
        // Try to parse the content directly first
        try {
          // If the response is already a clean JSON object
          const modelSpec = JSON.parse(textContent);
          console.log("Successfully parsed JSON directly");
          return NextResponse.json({
            ...modelSpec,
            _generationMethod: "claude_api" 
          });
        } catch (directParseError) {
          // Extract JSON from the response
          console.log("Couldn't parse directly, trying to extract JSON from text...");
          const jsonMatch = textContent.match(/```json\s*([\s\S]*?)\s*```/) || 
                          textContent.match(/```\s*([\s\S]*?)\s*```/) ||
                          textContent.match(/{[\s\S]*?}/);
          
          if (jsonMatch) {
            const jsonStr = jsonMatch[0].startsWith('{') ? jsonMatch[0] : jsonMatch[1];
            console.log("Extracted JSON string:", jsonStr);
            const modelSpec = JSON.parse(jsonStr);
            return NextResponse.json({
              ...modelSpec,
              _generationMethod: "claude_api" 
            });
          } else {
            console.error("No JSON found in Claude response");
            return NextResponse.json({ 
              error: "Failed to parse model specification", 
              _generationMethod: "claude_api_parse_error",
              details: textContent
            }, { status: 500 });
          }
        }
      } catch (error) {
        console.error("JSON parsing error:", error, "Text content:", textContent);
        
        // Fallback to the sample model if we can't parse the response
        console.log("Falling back to sample model due to parsing error");
        const sampleModel = generateSampleModel(prompt);
        return NextResponse.json({
          ...sampleModel,
          _generationMethod: "fallback_after_parse_error",
          error: String(error),
          description: `${sampleModel.description} (Fallback after Claude API parse error)`
        });
      }
    } catch (error) {
      console.error("Error calling Claude API:", error);
      
      // Fallback to sample model if the API call fails
      console.log("Falling back to sample model generator after API error.");
      const sampleModel = generateSampleModel(prompt);
      return NextResponse.json({
        ...sampleModel,
        _generationMethod: "fallback_after_api_error",
        description: `${sampleModel.description} (Fallback after Claude API error)`
      });
    }
    
  } catch (error) {
    console.error("Error processing request:", error);
    return NextResponse.json({ error: "Server error", details: String(error) }, { status: 500 });
  }
}

// Function to refine a model with sample generator
function refineModelWithSampleGenerator(prompt: string, baseModel: any) {
  // Start with the base model
  const refinedModel = {...baseModel};
  const lowerPrompt = prompt.toLowerCase();
  
  // Simple keyword-based refinement
  if (lowerPrompt.includes("taller") || lowerPrompt.includes("higher")) {
    // Make the model taller
    if (refinedModel.geometryType === "box") {
      refinedModel.parameters.height = refinedModel.parameters.height * 1.5;
    } else if (refinedModel.geometryType === "cylinder" || refinedModel.geometryType === "cone") {
      refinedModel.parameters.height = refinedModel.parameters.height * 1.5;
    }
  }
  
  if (lowerPrompt.includes("wider") || lowerPrompt.includes("broader")) {
    // Make the model wider
    if (refinedModel.geometryType === "box") {
      refinedModel.parameters.width = refinedModel.parameters.width * 1.5;
    } else if (refinedModel.geometryType === "cylinder" || refinedModel.geometryType === "cone") {
      refinedModel.parameters.radiusTop = refinedModel.parameters.radiusTop * 1.5;
      refinedModel.parameters.radiusBottom = refinedModel.parameters.radiusBottom * 1.5;
    } else if (refinedModel.geometryType === "sphere") {
      refinedModel.parameters.radius = refinedModel.parameters.radius * 1.5;
    }
  }
  
  // Color refinements
  if (lowerPrompt.includes("red")) {
    refinedModel.material.color = "#E11D48";
  } else if (lowerPrompt.includes("blue")) {
    refinedModel.material.color = "#3B82F6";
  } else if (lowerPrompt.includes("green")) {
    refinedModel.material.color = "#10B981";
  } else if (lowerPrompt.includes("yellow")) {
    refinedModel.material.color = "#FBBF24";
  } else if (lowerPrompt.includes("purple")) {
    refinedModel.material.color = "#8B5CF6";
  } else if (lowerPrompt.includes("orange")) {
    refinedModel.material.color = "#F97316";
  } else if (lowerPrompt.includes("pink")) {
    refinedModel.material.color = "#EC4899";
  } else if (lowerPrompt.includes("black")) {
    refinedModel.material.color = "#111827";
  } else if (lowerPrompt.includes("white")) {
    refinedModel.material.color = "#F3F4F6";
  }
  
  // Material type refinements
  if (lowerPrompt.includes("metallic") || lowerPrompt.includes("metal")) {
    refinedModel.material.type = "physical";
    refinedModel.material.metalness = 0.9;
    refinedModel.material.roughness = 0.2;
  } else if (lowerPrompt.includes("glossy") || lowerPrompt.includes("shiny")) {
    refinedModel.material.type = "physical";
    refinedModel.material.metalness = 0.2;
    refinedModel.material.roughness = 0.1;
  } else if (lowerPrompt.includes("matte") || lowerPrompt.includes("flat")) {
    refinedModel.material.type = "standard";
    refinedModel.material.metalness = 0.0;
    refinedModel.material.roughness = 0.9;
  }
  
  // Transparency refinements
  if (lowerPrompt.includes("transparent") || lowerPrompt.includes("clear")) {
    refinedModel.material.transparent = true;
    refinedModel.material.opacity = 0.5;
  }
  
  refinedModel.description = `${baseModel.description} (refined with: "${prompt}")`;
  
  return refinedModel;
}

// Function to generate a sample model for testing when no API key is available
function generateSampleModel(prompt: string) {
  const lowerPrompt = prompt.toLowerCase();
  
  // Initial model setup
  let parts = [];
  let description = `A model based on the description: "${prompt}"`;
  
  // Determine model type based on keywords
  if (lowerPrompt.includes("cup") || lowerPrompt.includes("mug")) {
    // Coffee cup/mug with a handle and base
    parts = [
      // Main cup body
      {
        geometryType: "cylinder",
        parameters: {
          radiusTop: 0.5,
          radiusBottom: 0.4,
          height: 1.2,
          radialSegments: 32
        },
        material: {
          type: "physical",
          color: "#E11D48", // red
          metalness: 0.1,
          roughness: 0.5,
          transparent: false,
          opacity: 1.0
        },
        position: [0, 0, 0],
        rotation: [0, 0, 0]
      },
      // Handle
      {
        geometryType: "torus",
        parameters: {
          radius: 0.25,
          tube: 0.08,
          radialSegments: 12,
          tubularSegments: 48
        },
        material: {
          type: "physical",
          color: "#E11D48", // red
          metalness: 0.1,
          roughness: 0.5,
          transparent: false,
          opacity: 1.0
        },
        position: [0.65, 0, 0],
        rotation: [0, 0, 90]
      },
      // Base (optional)
      {
        geometryType: "cylinder",
        parameters: {
          radiusTop: 0.42,
          radiusBottom: 0.48,
          height: 0.1,
          radialSegments: 32
        },
        material: {
          type: "physical",
          color: "#E11D48", // red
          metalness: 0.1,
          roughness: 0.5,
          transparent: false,
          opacity: 1.0
        },
        position: [0, -0.65, 0],
        rotation: [0, 0, 0]
      }
    ];
    description = `A composite coffee mug with a handle based on: "${prompt}"`;
  } else if (lowerPrompt.includes("vase") || lowerPrompt.includes("flower")) {
    // Vase with base and top rim
    parts = [
      // Main vase body
      {
        geometryType: "cylinder",
        parameters: {
          radiusTop: 0.6,
          radiusBottom: 0.4,
          height: 1.5,
          radialSegments: 32
        },
        material: {
          type: "physical",
          color: "#8B5CF6", // purple
          metalness: 0.2,
          roughness: 0.3,
          transparent: false,
          opacity: 1.0
        },
        position: [0, 0, 0],
        rotation: [0, 0, 0]
      },
      // Base
      {
        geometryType: "cylinder",
        parameters: {
          radiusTop: 0.45,
          radiusBottom: 0.5,
          height: 0.2,
          radialSegments: 32
        },
        material: {
          type: "physical",
          color: "#8B5CF6", // purple
          metalness: 0.2,
          roughness: 0.3,
          transparent: false,
          opacity: 1.0
        },
        position: [0, -0.85, 0],
        rotation: [0, 0, 0]
      },
      // Rim
      {
        geometryType: "torus",
        parameters: {
          radius: 0.6,
          tube: 0.05,
          radialSegments: 12,
          tubularSegments: 48
        },
        material: {
          type: "physical",
          color: "#8B5CF6", // purple
          metalness: 0.2,
          roughness: 0.3,
          transparent: false,
          opacity: 1.0
        },
        position: [0, 0.75, 0],
        rotation: [0, 0, 0]
      }
    ];
    description = `A composite flower vase with base and rim based on: "${prompt}"`;
  } else if (lowerPrompt.includes("chair") || lowerPrompt.includes("seat")) {
    // Chair with seat, back, and legs
    parts = [
      // Seat
      {
        geometryType: "box",
        parameters: {
          width: 1.2,
          height: 0.15,
          depth: 1.0
        },
        material: {
          type: "standard",
          color: "#964B00", // brown
          metalness: 0.1,
          roughness: 0.8,
          transparent: false,
          opacity: 1.0
        },
        position: [0, 0, 0],
        rotation: [0, 0, 0]
      },
      // Back
      {
        geometryType: "box",
        parameters: {
          width: 1.2,
          height: 1.2,
          depth: 0.15
        },
        material: {
          type: "standard",
          color: "#964B00", // brown
          metalness: 0.1,
          roughness: 0.8,
          transparent: false,
          opacity: 1.0
        },
        position: [0, 0.6, -0.5],
        rotation: [0, 0, 0]
      },
      // Legs (front left, front right, back left, back right)
      {
        geometryType: "box",
        parameters: {
          width: 0.1,
          height: 0.8,
          depth: 0.1
        },
        material: {
          type: "standard",
          color: "#5D4037", // dark brown
          metalness: 0.1,
          roughness: 0.8,
          transparent: false,
          opacity: 1.0
        },
        position: [0.5, -0.5, 0.4],
        rotation: [0, 0, 0]
      },
      {
        geometryType: "box",
        parameters: {
          width: 0.1,
          height: 0.8,
          depth: 0.1
        },
        material: {
          type: "standard",
          color: "#5D4037", // dark brown
          metalness: 0.1,
          roughness: 0.8,
          transparent: false,
          opacity: 1.0
        },
        position: [-0.5, -0.5, 0.4],
        rotation: [0, 0, 0]
      },
      {
        geometryType: "box",
        parameters: {
          width: 0.1,
          height: 0.8,
          depth: 0.1
        },
        material: {
          type: "standard",
          color: "#5D4037", // dark brown
          metalness: 0.1,
          roughness: 0.8,
          transparent: false,
          opacity: 1.0
        },
        position: [0.5, -0.5, -0.4],
        rotation: [0, 0, 0]
      },
      {
        geometryType: "box",
        parameters: {
          width: 0.1,
          height: 0.8,
          depth: 0.1
        },
        material: {
          type: "standard",
          color: "#5D4037", // dark brown
          metalness: 0.1,
          roughness: 0.8,
          transparent: false,
          opacity: 1.0
        },
        position: [-0.5, -0.5, -0.4],
        rotation: [0, 0, 0]
      }
    ];
    description = `A composite chair with seat, back, and legs based on: "${prompt}"`;
  } else if (lowerPrompt.includes("lamp")) {
    // Lamp with base, stem, and shade
    parts = [
      // Base
      {
        geometryType: "cylinder",
        parameters: {
          radiusTop: 0.4,
          radiusBottom: 0.5,
          height: 0.2,
          radialSegments: 32
        },
        material: {
          type: "physical",
          color: "#454545", // dark gray
          metalness: 0.8,
          roughness: 0.2,
          transparent: false,
          opacity: 1.0
        },
        position: [0, -0.8, 0],
        rotation: [0, 0, 0]
      },
      // Stem
      {
        geometryType: "cylinder",
        parameters: {
          radiusTop: 0.05,
          radiusBottom: 0.05,
          height: 1.5,
          radialSegments: 16
        },
        material: {
          type: "physical",
          color: "#757575", // medium gray
          metalness: 0.8,
          roughness: 0.2,
          transparent: false,
          opacity: 1.0
        },
        position: [0, 0, 0],
        rotation: [0, 0, 0]
      },
      // Shade
      {
        geometryType: "cone",
        parameters: {
          radius: 0.6,
          height: 0.8,
          radialSegments: 32
        },
        material: {
          type: "standard",
          color: "#F5F5DC", // beige
          metalness: 0.0,
          roughness: 0.9,
          transparent: true,
          opacity: 0.8
        },
        position: [0, 0.8, 0],
        rotation: [180, 0, 0]
      }
    ];
    description = `A composite desk lamp with base, stem and lampshade based on: "${prompt}"`;
  } else if (lowerPrompt.includes("table")) {
    // Table with top and four legs
    parts = [
      // Table top
      {
        geometryType: "box",
        parameters: {
          width: 1.5,
          height: 0.1,
          depth: 1.0
        },
        material: {
          type: "standard",
          color: "#A87328", // medium brown
          metalness: 0.1,
          roughness: 0.7,
          transparent: false,
          opacity: 1.0
        },
        position: [0, 0, 0],
        rotation: [0, 0, 0]
      },
      // Legs
      {
        geometryType: "box",
        parameters: {
          width: 0.1,
          height: 0.8,
          depth: 0.1
        },
        material: {
          type: "standard",
          color: "#8B5A2B", // dark brown
          metalness: 0.1,
          roughness: 0.7,
          transparent: false,
          opacity: 1.0
        },
        position: [0.65, -0.45, 0.4],
        rotation: [0, 0, 0]
      },
      {
        geometryType: "box",
        parameters: {
          width: 0.1,
          height: 0.8,
          depth: 0.1
        },
        material: {
          type: "standard",
          color: "#8B5A2B", // dark brown
          metalness: 0.1,
          roughness: 0.7,
          transparent: false,
          opacity: 1.0
        },
        position: [-0.65, -0.45, 0.4],
        rotation: [0, 0, 0]
      },
      {
        geometryType: "box",
        parameters: {
          width: 0.1,
          height: 0.8,
          depth: 0.1
        },
        material: {
          type: "standard",
          color: "#8B5A2B", // dark brown
          metalness: 0.1,
          roughness: 0.7,
          transparent: false,
          opacity: 1.0
        },
        position: [0.65, -0.45, -0.4],
        rotation: [0, 0, 0]
      },
      {
        geometryType: "box",
        parameters: {
          width: 0.1,
          height: 0.8,
          depth: 0.1
        },
        material: {
          type: "standard",
          color: "#8B5A2B", // dark brown
          metalness: 0.1,
          roughness: 0.7,
          transparent: false,
          opacity: 1.0
        },
        position: [-0.65, -0.45, -0.4],
        rotation: [0, 0, 0]
      }
    ];
    description = `A composite table with top and four legs based on: "${prompt}"`;
  } else if (lowerPrompt.includes("snowman")) {
    // Snowman with three stacked spheres and accessories
    parts = [
      // Bottom sphere (largest)
      {
        geometryType: "sphere",
        parameters: {
          radius: 0.6,
          widthSegments: 32,
          heightSegments: 32
        },
        material: {
          type: "physical",
          color: "#FFFFFF", // white
          metalness: 0.0,
          roughness: 0.9,
          transparent: false,
          opacity: 1.0
        },
        position: [0, -0.6, 0],
        rotation: [0, 0, 0]
      },
      // Middle sphere
      {
        geometryType: "sphere",
        parameters: {
          radius: 0.45,
          widthSegments: 32,
          heightSegments: 32
        },
        material: {
          type: "physical",
          color: "#FFFFFF", // white
          metalness: 0.0,
          roughness: 0.9,
          transparent: false,
          opacity: 1.0
        },
        position: [0, 0.3, 0],
        rotation: [0, 0, 0]
      },
      // Head (smallest sphere)
      {
        geometryType: "sphere",
        parameters: {
          radius: 0.3,
          widthSegments: 32,
          heightSegments: 32
        },
        material: {
          type: "physical",
          color: "#FFFFFF", // white
          metalness: 0.0,
          roughness: 0.9,
          transparent: false,
          opacity: 1.0
        },
        position: [0, 0.95, 0],
        rotation: [0, 0, 0]
      },
      // Carrot nose
      {
        geometryType: "cone",
        parameters: {
          radius: 0.06,
          height: 0.25,
          radialSegments: 16
        },
        material: {
          type: "standard",
          color: "#FF8C00", // orange
          metalness: 0.0,
          roughness: 0.9,
          transparent: false,
          opacity: 1.0
        },
        position: [0, 0.95, 0.3],
        rotation: [90, 0, 0]
      },
      // Button 1
      {
        geometryType: "sphere",
        parameters: {
          radius: 0.05,
          widthSegments: 16,
          heightSegments: 16
        },
        material: {
          type: "standard",
          color: "#000000", // black
          metalness: 0.0,
          roughness: 0.9,
          transparent: false,
          opacity: 1.0
        },
        position: [0, 0.25, 0.44],
        rotation: [0, 0, 0]
      },
      // Button 2
      {
        geometryType: "sphere",
        parameters: {
          radius: 0.05,
          widthSegments: 16,
          heightSegments: 16
        },
        material: {
          type: "standard",
          color: "#000000", // black
          metalness: 0.0,
          roughness: 0.9,
          transparent: false,
          opacity: 1.0
        },
        position: [0, 0.1, 0.45],
        rotation: [0, 0, 0]
      }
    ];
    description = `A composite snowman with three stacked spheres, carrot nose, and buttons based on: "${prompt}"`;
  } else {
    // Default: box model with some decorative elements
    parts = [
      // Main box
      {
        geometryType: "box",
        parameters: {
          width: 1.0,
          height: 0.8,
          depth: 0.6
        },
        material: {
          type: "standard",
          color: "#3B82F6", // blue
          metalness: 0.2,
          roughness: 0.5,
          transparent: false,
          opacity: 1.0
        },
        position: [0, 0, 0],
        rotation: [0, 0, 0]
      },
      // Decorative sphere on top
      {
        geometryType: "sphere",
        parameters: {
          radius: 0.15,
          widthSegments: 32,
          heightSegments: 32
        },
        material: {
          type: "standard",
          color: "#10B981", // green
          metalness: 0.3,
          roughness: 0.4,
          transparent: false,
          opacity: 1.0
        },
        position: [0, 0.55, 0],
        rotation: [0, 0, 0]
      },
      // Decorative cylinder
      {
        geometryType: "cylinder",
        parameters: {
          radiusTop: 0.12,
          radiusBottom: 0.12,
          height: 0.15,
          radialSegments: 16
        },
        material: {
          type: "standard",
          color: "#EF4444", // red
          metalness: 0.3,
          roughness: 0.4,
          transparent: false,
          opacity: 1.0
        },
        position: [0.4, 0, 0],
        rotation: [0, 0, 90]
      }
    ];
    description = `A composite model with a main box and decorative elements based on: "${prompt}"`;
  }
  
  // Return complete model specification
  return {
    parts: parts,
    description: description,
    customizationOptions: {
      parameters: {
        'scale': {
          type: 'slider',
          min: 0.5,
          max: 2.0,
          step: 0.1
        },
        'rotation': {
          type: 'slider',
          min: 0,
          max: 360,
          step: 15
        },
        'detail': {
          type: 'slider',
          min: 0,
          max: 1,
          step: 0.1
        }
      },
      materials: {
        types: ["standard", "basic", "phong", "physical", "lambert", "toon"],
        colors: [
          "#3B82F6", // blue
          "#EF4444", // red
          "#10B981", // green
          "#F59E0B", // amber
          "#8B5CF6", // purple
          "#EC4899", // pink
          "#14B8A6", // teal
          "#ffffff", // white
          "#000000"  // black
        ]
      }
    }
  };
} 