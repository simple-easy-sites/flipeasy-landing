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
    const prompt = `You are a "listing options" generator. Your goal is to generate a JSON object containing an array of three distinct listing options for a marketplace.

**User's Description:** "${userDescription}"

**Instructions:**

1.  **Analyze and Research:**
    *   Thoroughly analyze the user's image and description.
    *   Use Google Search to find the price of similar new and used items.
    *   Synthesize all information to create three distinct, high-quality listing options.

2.  **Generate JSON Output:**
    *   You MUST respond with only a valid JSON object.
    *   The root of the object should be a "listings" array.
    *   Each object in the "listings" array should have a unique persona: "The Professional," "The Storyteller," and "The Marketer."

**JSON Structure:**

\`\`\`json
{
  "listings": [
    {
      "persona": "The Professional",
      "title": "A clean, straightforward title.",
      "description": "A fact-based description focusing on features and specs. Use \\n\\n for paragraph breaks.",
      "price": "A fair market price based on research.",
      "reasoning": "Explain why this price and description are effective for a professional listing."
    },
    {
      "persona": "The Storyteller",
      "title": "A more creative, narrative-driven title.",
      "description": "A description that tells a story about the item, using details from the user's input. Use \\n\\n for paragraph breaks.",
      "price": "A price that reflects the item's story and unique value.",
      "reasoning": "Explain why this price and description will appeal to buyers looking for an item with character."
    },
    {
      "persona": "The Marketer",
      "title": "A sales-focused title that creates urgency.",
      "description": "A persuasive description that uses marketing language to highlight benefits and create a sense of urgency. Use \\n\\n for paragraph breaks.",
      "price": "A competitive price designed to sell quickly.",
      "reasoning": "Explain why this price and description will attract a lot of buyers and lead to a fast sale."
    }
  ]
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
