import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const imageFile = formData.get('image') as File;
    const audioFile = formData.get('audio') as File | null;
    let userDescription = formData.get('description') as string || '';
    
    console.log('=== PROCESSING REQUEST ===');
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
      console.error('GEMINI_API_KEY not found in environment');
      return NextResponse.json({ error: 'API key not configured' }, { status: 500 });
    }

    // Handle audio transcription if present
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
                  { text: "Transcribe this audio recording of a user describing an item for sale. Return only the transcribed text." },
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
    
const prompt = `You are FlipEasy's expert marketplace listing AI. Analyze the image and user description to create ONE perfect listing that sellers couldn't write themselves.

**User Description:** "${userDescription}"

**YOUR MISSION:**
1. **VISUAL ANALYSIS FIRST**: Look at the image and identify:
   - Exact item type, brand, model if visible
   - Material (wood, metal, fabric, plastic, etc.)
   - Color and finish details
   - Visible condition (scratches, wear, cleanliness)
   - Size/scale indicators relative to surroundings
   - Any unique features or details only visible in photo

2. **CONDITION ASSESSMENT**: Based on image + user description:
   - Evaluate actual condition (New/Like New/Good/Fair/Poor)
   - Note specific wear patterns or damage visible
   - Assess cleanliness and maintenance level

3. **PRICING LOGIC**: 
   - New items: 60-70% of retail value
   - Like New: 50-60% of retail value  
   - Good condition: 40-50% of retail value
   - Fair condition: 25-35% of retail value
   - Consider brand premium (IKEA vs Herman Miller)

4. **GENERATE ONE PERFECT LISTING** that combines:
   - Specific details only AI can extract from image
   - User's personal story/context
   - Professional selling language
   - Honest condition assessment

**RESPOND WITH ONLY THIS JSON (no other text):**

{
  "listings": [
    {
      "persona": "AI Expert",
      "title": "Specific Brand/Type + Key Feature + Condition (under 60 chars)",
      "description": "Start with what makes this item special based on the image. Include specific materials, colors, and condition details you can see. Weave in the user's story naturally. Add one selling tip specific to this item category. Use \\n\\n for paragraph breaks. Be honest about any visible wear.",
      "price": "$XX",
      "reasoning": "Explain the specific image details that determined the price and why this listing will attract serious buyers."
    }
  ]
}

**EXAMPLES OF GOOD TITLES:**
- "Herman Miller Aeron Office Chair Black Mesh Like New"
- "IKEA Hemnes Dresser White 6-Drawer Good Condition" 
- "Vintage Leather Club Chair Brown Distressed Character"
- "MacBook Pro 13inch 2019 Silver Excellent Condition"

**REQUIREMENTS:**
- NO generic descriptions - be specific to THIS item
- Include exact colors, materials, brands visible in image
- Honest condition assessment based on what you see
- Price reflects realistic resale value for condition
- NO emojis anywhere
- Mention specific selling advantages ("perfect for small apartments", "ideal for home office")`;

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
        temperature: 0.7,
        maxOutputTokens: 2000
      }
    };

    console.log('Making Gemini API call...');
    
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
      console.error('Gemini API error:', errorText);
      return NextResponse.json(createFallbackResponse(), { status: 200 });
    }

    const result = await response.json();
    const text = result.candidates?.[0]?.content?.parts?.[0]?.text || '';
    
    console.log('Raw AI response:', text.substring(0, 500) + '...');
    
    // Parse the JSON response
    try {
      // Clean the response text
      let cleanText = text.trim();
      
      // Remove markdown code blocks if present
      if (cleanText.startsWith('```json')) {
        cleanText = cleanText.replace(/```json\n?/, '').replace(/\n?```$/, '');
      }
      if (cleanText.startsWith('```')) {
        cleanText = cleanText.replace(/```\n?/, '').replace(/\n?```$/, '');
      }
      
      // Find JSON object
      const jsonMatch = cleanText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsedData = JSON.parse(jsonMatch[0]);
        
        // Validate the structure
        if (parsedData.listings && Array.isArray(parsedData.listings) && parsedData.listings.length > 0) {
          console.log('Successfully parsed listings:', parsedData.listings.length);
          return NextResponse.json(parsedData);
        } else {
          console.error('Invalid listings structure:', parsedData);
          return NextResponse.json(createFallbackResponse());
        }
      } else {
        console.error('No JSON found in response');
        return NextResponse.json(createFallbackResponse());
      }
    } catch (parseError) {
      console.error('JSON parsing failed:', parseError);
      console.error('Response text:', text);
      return NextResponse.json(createFallbackResponse());
    }

  } catch (error) {
    console.error('Request failed:', error);
    return NextResponse.json(createFallbackResponse());
  }
}

// Create fallback response when AI fails
function createFallbackResponse() {
  return {
    listings: [
      {
        persona: "AI Expert",
        title: "Quality Item for Sale - Good Condition",
        description: "Well-maintained item ready for a new home. Based on the photo, this appears to be in good working condition with normal signs of use. Please see photo for exact condition details.\\n\\nWe're selling because we no longer need it and hope it will be useful to someone else. Item comes from a clean, non-smoking home.",
        price: "$50",
        reasoning: "Moderate pricing reflects good condition with typical wear. Honest description builds buyer trust and encourages serious inquiries."
      }
    ]
  };
}
