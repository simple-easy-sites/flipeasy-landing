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
    const prompt = `You are a Marketplace Listing Expert. Your task is to create a complete, enticing, and ready-to-post listing for a marketplace like Facebook Marketplace or Craigslist.

Analyze the provided image and the user's description, then use Google Search to find all relevant details about the item.

**User's Description:** "${userDescription}"

**Your Task:**

1.  **Analyze and Research:**
    *   Identify the item, brand, and model from the image and description.
    *   Use Google Search to find the product's official name, specifications (dimensions, materials, etc.), original retail price, and current resale market value.
    *   Synthesize the user's description with your research to understand the item's story and condition.

2.  **Create the Listing:**
    *   Generate a complete listing in the following JSON format.
    *   Do NOT use canned phrases. Create a unique, compelling narrative in the description.
    *   Be a helpful selling assistant. The tone should be professional, friendly, and persuasive.

**JSON Output Format:**

\`\`\`json
{
  "title": "A descriptive and enticing title (under 80 characters).",
  "price": "A specific, market-researched price (e.g., '$125').",
  "category": "Choose the best category from this list: Antiques & Collectibles, Arts & Crafts, Auto Parts & Accessories, Baby Products, Books/Movies/Music, Cell Phones & Accessories, Clothing/Shoes/Accessories, Electronics, Furniture, Health & Beauty, Home & Kitchen, Jewelry & Watches, Miscellaneous, Musical Instruments, Office Supplies, Patio & Garden, Pets/Pet Supplies, Sporting Goods, Tools & Home Improvement, Toys & Games, Travel/Luggage, Video Games & Consoles, Vehicles, Real Estate.",
  "condition": "Choose one: New, Like New, Good, Fair, Poor.",
  "description": "A detailed, original, and compelling description. Start with a strong opening sentence. Mention key features, benefits, and any interesting details from the user's description or your research. Keep it easy to read with paragraphs and bullet points.",
  "location": "A general location (e.g., 'San Francisco Bay Area'). You can infer this or use a placeholder.",
  "tags": ["up", "to", "ten", "relevant", "search", "tags"],
  "brand": "The item's brand, if known.",
  "model": "The item's model, if known.",
  "dimensions": "The item's dimensions (e.g., '45\" H x 30\" W x 15\" D').",
  "color": "The primary color of the item.",
  "style": "The style of the item (e.g., 'Mid-Century Modern').",
  "material": "The primary material of the item (e.g., 'Solid Oak')."
}
\`\`\`

**CRITICAL:** Fill every field in the JSON object with accurate, well-researched, and well-written information. The user will be copying and pasting this directly into a marketplace listing.`;

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
  const titleMatch = aiText.match(/"title":\s*"(.*?)"/);
  const priceMatch = aiText.match(/"price":\s*"(.*?)"/);
  const descriptionMatch = aiText.match(/"description":\s*"(.*?)"/s);

  return {
    title: titleMatch ? titleMatch[1] : 'Quality Item - Excellent Condition',
    price: priceMatch ? priceMatch[1] : '$75',
    description: descriptionMatch ? descriptionMatch[1] : `Here are some details about the item:\n\n${userDescription}`,
    category: 'Miscellaneous',
    condition: 'Good',
    tags: [],
    brand: '',
    model: '',
    dimensions: '',
    color: '',
    style: '',
    material: ''
  };
}

// Basic fallback when everything fails
function createBasicFallback() {
  return {
    title: 'Quality Item - Excellent Condition',
    price: '$75',
    description: `Quality item in excellent condition.

• Well-maintained and cared for
• From clean, smoke-free home
• Ready for immediate pickup
• Cash preferred
• Serious inquiries only

Great piece at a fair price!`,
    category: 'General',
    condition: 'Good',
    features: ['Well-maintained', 'Ready for pickup']
  };
}
