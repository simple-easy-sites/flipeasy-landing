import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextRequest, NextResponse } from 'next/server';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const imageFile = formData.get('image') as File;
    const description = formData.get('description') as string;
    const location = formData.get('location') as string || 'United States';

    if (!imageFile) {
      return NextResponse.json({ error: 'No image provided' }, { status: 400 });
    }

    // Convert image to base64
    const imageBuffer = await imageFile.arrayBuffer();
    const imageBase64 = Buffer.from(imageBuffer).toString('base64');

    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

    const prompt = `You are FlipEasy's AI listing assistant. ANALYZE THE IMAGE FIRST, then create a marketplace listing.

STRICT REQUIREMENTS:
1. LOOK AT THE IMAGE - Identify the EXACT item, brand, model, condition, materials visible
2. USE USER DESCRIPTION: "${description}"
3. LOCATION: ${location}
4. RESPOND WITH ONLY JSON - NO OTHER TEXT

REQUIRED JSON FORMAT (EXACT):
{
  "title": "Brief descriptive title under 60 characters",
  "description": "2-3 paragraph description combining image analysis and user story",
  "condition": "New/Like New/Good/Fair/Poor",
  "category": "Furniture/Electronics/Baby & Kids/Fashion/Home & Garden/Sports/Other",
  "pricing": {
    "quick_sale": "$XX",
    "market_value": "$XX", 
    "optimistic": "$XX"
  },
  "selling_tips": [
    "Best posting time for this category",
    "Safety tip for meetups",
    "Negotiation guidance",
    "Additional photos to take"
  ]
}

PRICING RULES:
- Quick Sale: 15-20% below market value
- Market Value: Fair price for condition
- Optimistic: 10-15% above market

TIMING BY CATEGORY:
- Furniture: "Post Saturday-Sunday 11 AM-1 PM"
- Electronics: "Post Tuesday-Thursday 2-4 PM"
- Baby & Kids: "Post Monday-Wednesday 9-11 AM"
- Fashion: "Post Wednesday-Friday 6-8 PM"
- Other: "Post Tuesday-Thursday 10 AM-3 PM"

ALWAYS INCLUDE SAFETY TIP: "Meet in public places like Target parking lots"

BE SPECIFIC TO THE IMAGE AND USER'S STORY. NO GENERIC DESCRIPTIONS.`;

    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          mimeType: imageFile.type,
          data: imageBase64,
        },
      },
    ]);

    const response = result.response;
    const text = response.text();

    // Clean and parse JSON
    let cleanedText = text.trim();
    if (cleanedText.startsWith('```json')) {
      cleanedText = cleanedText.replace(/```json\n?/, '').replace(/\n?```$/, '');
    }

    try {
      const listing = JSON.parse(cleanedText);
      return NextResponse.json(listing);
    } catch (parseError) {
      console.error('JSON parsing error:', parseError);
      console.error('Raw response:', text);
      return NextResponse.json({ error: 'Invalid AI response format' }, { status: 500 });
    }

  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Failed to analyze image' }, { status: 500 });
  }
}
