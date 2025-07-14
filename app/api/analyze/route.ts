import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const imageFile = formData.get('image') as File;
    const audioFile = formData.get('audio') as File | null;
    let userDescription = formData.get('description') as string || '';
    
    console.log('=== PROCESSING WITH GOOGLE SEARCH GROUNDING ===');
    console.log('Image:', imageFile?.name, imageFile?.size);
    console.log('Description:', userDescription);
    console.log('Audio:', audioFile?.name, audioFile?.size);

    if (!imageFile) {
      return NextResponse.json({ error: 'No image provided' }, { status: 400 });
    }

    const imageBytes = await imageFile.arrayBuffer();
    const base64Image = Buffer.from(imageBytes).toString('base64');
    
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'API key not configured' }, { status: 500 });
    }

    // If there's an audio file, transcribe it and prepend it to the description
    if (audioFile) {
      try {
        console.log('Transcribing audio...');
        const audioBytes = await audioFile.arrayBuffer();
        const base64Audio = Buffer.from(audioBytes).toString('base64');

        const transcriptionResponse = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro-latest:generateContent?key=${apiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{
                parts: [
                  { text: "Transcribe this audio recording of a user describing an item for sale." },
                  { inline_data: { mime_type: audioFile.type, data: base64Audio } }
                ]
              }]
            })
          }
        );

        if (transcriptionResponse.ok) {
          const transcriptionResult = await transcriptionResponse.json();
          const transcribedText = transcriptionResult.candidates?.[0]?.content?.parts?.[0]?.text || '';
          console.log('Transcription successful:', transcribedText);
          userDescription = transcribedText + '\n\n' + userDescription;
        } else {
          console.error('Audio transcription failed:', await transcriptionResponse.text());
        }
      } catch (transcriptionError) {
        console.error('Error during transcription:', transcriptionError);
      }
    }
    
    // ENHANCED PROMPT FOR WEB SEARCH + IMAGE ANALYSIS
    const prompt = `You are a JSON-only AI. Your only output will be a single, valid JSON object. Any other output is a failure.

Based on the user's image and description, create a complete and accurate marketplace listing.

**User's Description:** "${userDescription}"

**Instructions:**

1.  **Analyze and Research:**
    *   Thoroughly analyze the user's image and description.
    *   Use Google Search to find the exact product name, brand, model, dimensions, materials, and current resale value.
    *   Synthesize all information to create a complete and accurate listing.

2.  **Categorize the Item:**
    *   You MUST choose a category from the following list. You must choose the most specific sub-category possible.
    *   **Category Hierarchy:**
        *   **Furniture**: Living Room, Bedroom, Dining Room, Office, Outdoor
        *   **Electronics**: Computing, Mobile, Entertainment, Cameras, Home Tech
        *   **Clothing & Accessories**: Women's, Men's, Children's, Accessories
        *   **Baby & Kids**: Furniture, Gear, Toys, Clothing
        *   **Home & Garden**: Kitchen, Bathroom, Decor, Garden, Storage
        *   **Vehicles & Parts**: Vehicles, Parts, Maintenance
        *   **Hobbies & Collectibles**: Music, Art, Sports, Collectibles, Books
        *   **Tools & Equipment**: Power Tools, Hand Tools, Lawn & Garden, Workshop
    *   Follow this detection priority: 1. Visual object recognition, 2. Context clues, 3. Size indicators, 4. Condition/usage hints, 5. Specialized features.

3.  **Generate JSON Output:**
    *   You MUST respond with only a valid JSON object.
    *   Use the following structure and fill every field with accurate and well-written content. If you cannot determine a value with high confidence, leave the field blank.

**JSON Structure:**

\`\`\`json
{
  "category": "The full category path (e.g., 'Home & Garden > Kitchen').",
  "confidence": "Your confidence in the category selection ('High', 'Medium', 'Low').",
  "brand": "The brand name (e.g., 'Seville Classics').",
  "model": "The model name or number (e.g., 'SHE18321B').",
  "title": "An enticing, descriptive title for the listing (e.g., 'Seville Classics Kitchen Island Cart - Stainless Steel & Wood Top').",
  "condition": "Choose one based on the user's input and image: 'New', 'Used - Like New', 'Used - Good', 'Used - Fair'.",
  "description": "A compelling, narrative description. Start with a one-sentence hook. Follow with a paragraph that details the item's features and benefits. End with a sentence about the ideal use case. Use \\n\\n for paragraph breaks.",
  "features": [
    "A key feature or benefit (e.g., 'Stainless steel frame and drawers').",
    "Another key feature (e.g., 'Beautiful natural wood top').",
    "A third key feature (e.g., 'Lower shelf for additional storage')."
  ],
  "dimensions": {
    "inches": "Dimensions in inches (e.g., '36.5\\\" H x 48\\\" W x 20\\\" D').",
    "cm": "Dimensions in centimeters (e.g., '92.7 cm H x 121.9 cm W x 50.8 cm D')."
  },
  "usage": "The ideal use case for the item (e.g., 'Perfect for adding extra counter space and storage to any kitchen.').",
  "price_analysis": {
    "suggested_price": "A specific, market-researched price (e.g., '$125').",
    "reasoning": "Explain your pricing strategy. For example: 'I set the price based on 5 similar items found on Facebook Marketplace in the area. The description highlights the minimalist style and versatile mounting options to attract buyers looking for modern decor.'"
  }
}
\`\`\`
`;

    const requestBody = {
      contents: [{
        parts: [
          { text: prompt },
          {
            inline_data: {
              mime_type: imageFile.type,
              data: base64Image
            }
          }
        ]
      }],
      generationConfig: {
        temperature: 0.3,
        maxOutputTokens: 3000
      },
      // Enable Google Search grounding
      tools: [{
        google_search_retrieval: {
          dynamic_retrieval_config: {
            mode: "MODE_DYNAMIC",
            dynamic_threshold: 0.5  // Search when 50%+ confidence it will help
          }
        }
      }]
    };

    console.log('Making API call with Google Search grounding...');
    
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro-latest:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      }
    );

    console.log('Response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('API error:', errorText);
      
      // If grounding fails, try without it
      if (response.status === 400 || response.status === 403) {
        console.log('Grounding failed, trying without web search...');
        return await fallbackWithoutSearch(apiKey, requestBody, userDescription);
      }
      
      throw new Error(`API failed: ${response.status}`);
    }

    const result = await response.json();
    const text = result.candidates?.[0]?.content?.parts?.[0]?.text || '';
    const groundingMetadata = result.candidates?.[0]?.groundingMetadata;
    
    console.log('Raw AI response:', text.substring(0, 300) + '...');
    console.log('Grounding metadata:', !!groundingMetadata);
    
    if (groundingMetadata) {
      console.log('SUCCESS: Web search was used!');
      console.log('Search queries:', groundingMetadata.webSearchQueries);
    }
    
    // Parse the comprehensive JSON response
    let comprehensiveData;
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        comprehensiveData = JSON.parse(jsonMatch[0]);
        console.log('Successfully parsed comprehensive data');
      }
    } catch (parseError) {
      console.log('JSON parse failed, creating intelligent fallback');
    }
    
    // Create the response based on what we got
    if (comprehensiveData) {
      return NextResponse.json({
        success: true,
        web_search_used: !!groundingMetadata,
        search_queries: groundingMetadata?.webSearchQueries || [],
        listing: comprehensiveData
      });
    } else {
      // Create intelligent fallback from the response text
      return NextResponse.json({
        success: true,
        web_search_used: !!groundingMetadata,
        search_queries: groundingMetadata?.webSearchQueries || [],
        listing: createIntelligentFallback(text, userDescription, groundingMetadata)
      });
    }

  } catch (error) {
    console.error('Request failed:', error);
    
    return NextResponse.json({
      success: false,
      listing: createBasicFallback(),
      error: 'Service temporarily unavailable'
    });
  }
}

// Fallback without web search
async function fallbackWithoutSearch(apiKey: string, originalRequest: any, userDescription: string) {
  console.log('Attempting fallback without web search...');
  
  const fallbackRequest = {
    ...originalRequest,
    tools: undefined  // Remove web search tools
  };
  
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro-latest:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(fallbackRequest)
      }
    );
    
    if (response.ok) {
      const result = await response.json();
      const text = result.candidates?.[0]?.content?.parts?.[0]?.text || '';
      
      return NextResponse.json({
        success: true,
        web_search_used: false,
        fallback_mode: true,
        listing: createIntelligentFallback(text, userDescription, null)
      });
    }
  } catch (error) {
    console.error('Fallback also failed:', error);
  }
  
  return NextResponse.json({
    success: false,
    listing: createBasicFallback(),
    error: 'Analysis service unavailable'
  });
}

// Create intelligent listing from AI response
function createIntelligentFallback(aiText: string, userDescription: string, groundingMetadata: any) {
  // This is a simplified fallback and may not perfectly parse all fields.
  const titleMatch = aiText.match(/"title":\s*"(.*?)"/);
  const descriptionMatch = aiText.match(/"description":\s*"(.*?)"/s);

  return {
    category: 'Miscellaneous',
    confidence: 'Low',
    brand: '',
    model: '',
    title: titleMatch ? titleMatch[1] : 'Quality Item for Sale',
    condition: 'Good',
    description: descriptionMatch ? descriptionMatch[1] : userDescription,
    features: [],
    dimensions: { inches: '', cm: '' },
    usage: '',
    ai_reasoning: 'This is a fallback listing. The AI was unable to generate a full listing.'
  };
}

// Basic fallback when everything fails
function createBasicFallback() {
  return {
    category: 'Miscellaneous',
    confidence: 'Low',
    brand: 'N/A',
    model: 'N/A',
    title: 'Item for Sale',
    condition: 'Good',
    description: 'Please see the photo for details.',
    features: [],
    dimensions: { inches: 'N/A', cm: 'N/A' },
    usage: 'General use',
    ai_reasoning: 'The AI analysis failed. This is a basic fallback listing.'
  };
}
