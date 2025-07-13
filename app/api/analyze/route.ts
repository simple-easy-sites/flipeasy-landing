import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const imageFile = formData.get('image') as File;
    const userDescription = formData.get('description') as string || '';
    const transcription = formData.get('transcription') as string || '';
    
    console.log('=== SIMPLE DEBUG ===');
    console.log('Image:', !!imageFile, imageFile?.size);
    console.log('Description:', userDescription);
    console.log('Transcription:', transcription);
    
    if (!imageFile) {
      return NextResponse.json({ error: 'No image provided' }, { status: 400 });
    }

    // Convert image to base64
    const bytes = await imageFile.arrayBuffer();
    const base64Image = Buffer.from(bytes).toString('base64');
    
    const apiKey = process.env.GEMINI_API_KEY;
    console.log('API Key exists:', !!apiKey);
    
    if (!apiKey) {
      return NextResponse.json({ error: 'No API key configured' }, { status: 500 });
    }
    
    // SIMPLE prompt that should work
    const prompt = `Look at this image and tell me what you see. User description: "${userDescription}"

Respond with this JSON format:
{
  "what_i_see": "Describe exactly what you see in the image",
  "item_type": "What type of item is this?",
  "suggested_price": "$50",
  "simple_title": "Item Name - Good Condition",
  "simple_description": "Basic description for selling"
}`;

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
        temperature: 0.1,
        maxOutputTokens: 1024
      }
    };

    console.log('=== TRYING SIMPLE GEMINI CALL ===');
    
    // Try different endpoints to see which works
    const endpoints = [
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=${apiKey}`,
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro-vision:generateContent?key=${apiKey}`
    ];
    
    for (let i = 0; i < endpoints.length; i++) {
      console.log(`Trying endpoint ${i + 1}:`, endpoints[i].split('?')[0]);
      
      try {
        const response = await fetch(endpoints[i], {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody)
        });

        console.log(`Response ${i + 1}:`, response.status, response.statusText);

        if (response.ok) {
          const result = await response.json();
          const text = result.candidates?.[0]?.content?.parts?.[0]?.text || '';
          
          console.log('SUCCESS! Got response:', text.substring(0, 200));
          
          // Try to parse JSON
          try {
            const jsonMatch = text.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
              const parsed = JSON.parse(jsonMatch[0]);
              return NextResponse.json({
                success: true,
                endpoint_used: i + 1,
                result: parsed
              });
            }
          } catch (e) {
            console.log('JSON parse failed, returning raw text');
          }
          
          // Return raw response if JSON parsing fails
          return NextResponse.json({
            success: true,
            endpoint_used: i + 1,
            raw_response: text,
            fallback: {
              what_i_see: text,
              item_type: userDescription || "Unknown item",
              suggested_price: "$50",
              simple_title: `${userDescription || "Item"} - Good Condition`,
              simple_description: text || `${userDescription} in good condition. Ready for pickup!`
            }
          });
        } else {
          const errorText = await response.text();
          console.log(`Endpoint ${i + 1} failed:`, errorText);
        }
      } catch (error) {
        console.log(`Endpoint ${i + 1} error:`, error);
      }
    }
    
    // If all endpoints fail
    return NextResponse.json({
      error: 'All Gemini endpoints failed',
      fallback: {
        what_i_see: "Image analysis not available",
        item_type: userDescription || "Unknown item",
        suggested_price: "$50",
        simple_title: `${userDescription || "Item"} - Good Condition`,
        simple_description: `${userDescription || "Item"} in good condition. Ready for pickup!`
      }
    });

  } catch (error) {
    console.error('Critical error:', error);
    return NextResponse.json({
      error: 'Failed to process request',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
