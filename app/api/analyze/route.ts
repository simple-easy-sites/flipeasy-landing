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
    
    // SIMPLIFIED PROMPT THAT RETURNS EXACTLY WHAT FRONTEND EXPECTS
    const prompt = `You are a "deep-dive" AI listing generator. Your goal is to perform a thorough analysis of the user's item and then generate a JSON object with three distinct, high-quality listing options.

**User's Description:** "${userDescription}"

**Instructions:**

1.  **Deep-Dive Analysis:**
    *   **Visual Analysis:** First, analyze the image to identify the item's key visual characteristics (e.g., color, material, style).
    *   **Web Search & Identification:** Use these visual cues and the user's description to perform a Google search to identify the exact product name, brand, and model.
    *   **Market Research:** Perform a second Google search to find the price of similar new and used items, as well as any other relevant details (e.g., materials, dimensions).

2.  **Generate JSON Output:**
    *   You MUST respond with only a valid JSON object.
    *   The root of the object should be a "listings" array.
    *   Each object in the "listings" array should have a unique persona: "The Professional," "The Storyteller," and "The Marketer."
    *   The descriptions must be "robust" and "detailed," using the information you have gathered.

**JSON Structure:**

\`\`\`json
{
  "listings": [
    {
      "persona": "The Professional",
      "title": "A clean, straightforward title that includes the brand and model.",
      "description": "A detailed, fact-based description that includes the item's key features, specifications, and condition. Use \\n\\n for paragraph breaks.",
      "price": "A fair market price based on your research.",
      "reasoning": "Explain your choice of title, description, and price, and reference the research you have done."
    },
    {
      "persona": "The Storyteller",
      "title": "A more creative, narrative-driven title that evokes a feeling.",
      "description": "A description that tells a story about the item, using details from the user's input and your research to create an emotional connection. Use \\n\\n for paragraph breaks.",
      "price": "A price that reflects the item's story and unique value.",
      "reasoning": "Explain how the story and emotional connection justify the price."
    },
    {
      "persona": "The Marketer",
      "title": "A sales-focused title that creates urgency and highlights a key benefit.",
      "description": "A persuasive description that uses marketing language to highlight the item's value, create a sense of urgency, and encourage a quick sale. Use \\n\\n for paragraph breaks.",
      "price": "A competitive price designed to sell quickly.",
      "reasoning": "Explain how the title, description, and price work together to create a compelling marketing message."
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
        persona: "The Professional",
        title: "Quality Item for Sale - Excellent Condition",
        description: "Well-maintained item in good working condition. Perfect for someone looking for a reliable option at a great price. Please see photos for details.",
        price: "$50",
        reasoning: "Professional approach focuses on condition and value proposition to attract serious buyers."
      },
      {
        persona: "The Storyteller",
        title: "Beautiful Item with Great Memories",
        description: "This item has been part of our home and served us well. We're moving and hoping it will bring the same joy to a new owner. It's ready for its next chapter!",
        price: "$45",
        reasoning: "Storytelling creates emotional connection and makes the item feel special rather than just functional."
      },
      {
        persona: "The Marketer",
        title: "MUST SELL! Great Deal on Quality Item",
        description: "Don't miss out on this fantastic opportunity! High-quality item at an unbeatable price. Perfect condition, ready to go. First come, first served!",
        price: "$40",
        reasoning: "Marketing language creates urgency and emphasizes the deal aspect to drive quick action."
      }
    ]
  };
}
