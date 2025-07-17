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
    
const prompt = `You are an Expert Sales Agent AI for FlipEasy. Your mission is to transform a user's simple photo and description into a polished, professional, and persuasive marketplace listing.

**User's Description:** "${userDescription}"

**YOUR PROCESS:**

1.  **Image-First Analysis:** Your primary source of truth is the image. Analyze it for objective details:
    *   **Identify:** What is the exact item, brand, and model?
    *   **Materials & Color:** What is it made of? What are the exact colors and finish?
    *   **Condition:** Look for any visible wear, scratches, or damage. If the image is clean, assume the item is in excellent condition, unless the user states otherwise. **Do not invent flaws.**

2.  **Web & Market Research:**
    *   Use the information from your visual analysis to perform a Google search and confirm the item's identity.
    *   Research the market value of similar new and used items.

3.  **Synthesize & Sell:**
    *   Combine your expert analysis with the user's personal story.
    *   Adopt the persona of a master salesperson. **Never use phrases like "the seller said."** Instead, weave their story into a compelling narrative.

4.  **Generate a Single, Perfect Listing:**
    *   You MUST respond with only a valid JSON object.
    *   The title must follow the format: \`Item Name - Condition\`.

**JSON STRUCTURE:**

{
  "listings": [
    {
      "persona": "AI Expert",
      "title": "A specific, professional title in the format: Item Name - Condition.",
      "description": "A persuasive, multi-paragraph description. Start with a powerful hook. Then, write a value-driven paragraph about the item's benefits. Follow with a bulleted list of key features. Finally, weave in the user's personal story and end with a clear call to action. Use \\n\\n for paragraph breaks.",
      "price": "A fair but compelling market price, based on your research.",
      "reasoning": "A detailed explanation of your pricing strategy, referencing your market research and the item's condition. Also, explain why your suggested title and description will be effective."
    }
  ]
}
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
