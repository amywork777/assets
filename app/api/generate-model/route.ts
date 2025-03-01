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
    
    // Create a system prompt for Claude that explains what we want
    let systemPrompt = `
You are a 3D modeling expert. Your task is to generate a specification for a 3D model based on the user's description.
The specification should define a 3D model that can be rendered using Three.js.

IMPORTANT: Instead of just creating a single primitive shape, create a COMPOSITION of multiple shapes arranged together to form a more complex and interesting model that matches the user's description. Use 2-5 shapes in your composition.

Please return a JSON object with the following structure:
{
  "parts": [
    {
      "geometryType": string, // One of: "box", "sphere", "cylinder", "cone", "torus", "torusKnot"
      "parameters": {
        // Parameters specific to the geometry type
        // For box: width, height, depth
        // For sphere: radius, widthSegments, heightSegments
        // For cylinder: radiusTop, radiusBottom, height, radialSegments
        // For cone: radius, height, radialSegments
        // For torus: radius, tube, radialSegments, tubularSegments
        // For torusKnot: radius, tube, tubularSegments, radialSegments, p, q
      },
      "material": {
        "type": string, // One of: "standard", "basic", "phong", "physical", "lambert", "toon"
        "color": string, // Hex color code like "#ff0000"
        "metalness": number, // 0 to 1, only for standard or physical materials
        "roughness": number, // 0 to 1, only for standard or physical materials
        "transparent": boolean,
        "opacity": number // 0 to 1, only if transparent is true
      },
      "position": [x, y, z], // Position of this part relative to the model center
      "rotation": [x, y, z]  // Rotation of this part in degrees
    }
    // Add more parts to create a composite model
  ],
  "description": string, // A brief description of the model
  "customizationOptions": {
    "materials": {
      "types": string[], // Array of allowed material types
      "colors": string[] // Array of suggested colors
    }
  }
}

BE CREATIVE with your composition! For example:
- For a "coffee cup", create a cylinder for the main body, a torus for the handle, and a thin cylinder for the base
- For a "snowman", use three spheres of decreasing size stacked vertically with small spheres for buttons
- For a "chair", combine boxes for the seat, back, and legs
- For a "lamp", use a cone for the shade, a cylinder for the stem, and a box for the base

Position each part appropriately to create a cohesive whole. The position coordinates are relative to the center of the model.

Respond ONLY with valid JSON. No markdown code blocks, no explanations, just the JSON object.
`;

    // If this is a refinement request, add context about the base model
    if (isRefinement) {
      systemPrompt = `
You are a 3D modeling expert. Your task is to refine an existing 3D model specification based on the user's instructions.
The user will provide modifications they want to make to an existing model.

The current model specification is:
${JSON.stringify(baseModel, null, 2)}

Please create an updated model specification that incorporates the user's requested changes.
The output should be a complete model specification (not just the changes) in the same format as the input.

If the current model has only a single part and the user's refinement would benefit from a multi-part model, 
feel free to convert it to a composition of multiple shapes while maintaining the overall concept.

Respond ONLY with valid JSON. No markdown code blocks, no explanations, just the JSON object.
`;
    }

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