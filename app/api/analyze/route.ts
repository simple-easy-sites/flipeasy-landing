import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextRequest, NextResponse } from 'next/server';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const imageFile = formData.get('image') as File;
    const userDescription = formData.get('description') as string || '';
    
    if (!imageFile) {
      return NextResponse.json({ error: 'No image provided' }, { status: 400 });
    }

    // Convert image to base64
    const bytes = await imageFile.arrayBuffer();
    const base64Image = Buffer.from(bytes).toString('base64');
    
    // Use Gemini 2.0 Flash Experimental (latest model)
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });

    const prompt = `
    You are an expert marketplace listing creator. Analyze this image and create professional listings optimized for different platforms.

    User context: "${userDescription}"

    Please perform these tasks:
    1. Identify the item (name, brand if visible, category, estimated condition)
    2. Research typical market prices for similar items online
    3. Create compelling, platform-optimized listings that will actually sell
    4. Generate follow-up questions to improve the listing

    Return a JSON response with this EXACT structure:
    {
      "item_analysis": {
        "name": "Item name",
        "brand": "Brand if identifiable or 'Unknown'",
        "category": "furniture/electronics/clothing/etc",
        "condition": "excellent/good/fair/poor",
        "estimated_value_range": "$X - $Y",
        "key_features": ["feature1", "feature2", "feature3"]
      },
      "follow_up_questions": [
        "What did you originally pay for this?",
        "How long have you owned it?",
        "Why are you selling it?",
        "Any defects or issues we should mention?"
      ],
      "listings": {
        "facebook": {
          "title": "Engaging title under 80 characters",
          "description": "Casual, local tone. Mention condition, why selling, pickup details. 2-3 paragraphs.",
          "price": "$XXX",
          "tags": ["tag1", "tag2", "tag3"]
        },
        "craigslist": {
          "title": "Detailed title with key specs - $XXX",
          "description": "Detailed, practical description. Include dimensions, condition details, firm price policy. Professional but direct tone.",
          "price": "$XXX",
          "tags": ["tag1", "tag2"]
        },
        "offerup": {
          "title": "Brief, catchy title!",
          "description": "Mobile-friendly short description. Use emojis sparingly. Quick sale focused.",
          "price": "$XXX",
          "tags": ["tag1", "tag2", "tag3", "tag4"]
        }
      },
      "selling_tips": [
        "Best time to post for this category",
        "Photography suggestions",
        "Safety tip for this item type"
      ]
    }

    Important guidelines:
    - Make listings compelling and honest
    - Price competitively based on condition
    - Use platform-appropriate language and format
    - Include specific details visible in the image
    - Mention any wear or imperfections you can see
    - Create urgency without being pushy
    - Optimize for local search terms
    - Consider seasonal demand if relevant

    Be thorough in your analysis and create listings that will actually help this item sell quickly and safely.
    `;

    const imagePart = {
      inlineData: {
        data: base64Image,
        mimeType: imageFile.type,
      },
    };

    const result = await model.generateContent([prompt, imagePart]);
    const response = await result.response;
    const text = response.text();
    
    // Parse JSON response from Gemini
    let parsedResponse;
    try {
      // Extract JSON from the response (in case there's extra text)
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsedResponse = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found in response');
      }
    } catch (parseError) {
      console.error('Failed to parse Gemini response:', text);
      // Fallback response if parsing fails
      parsedResponse = {
        item_analysis: {
          name: "Item",
          brand: "Unknown",
          category: "general",
          condition: "good",
          estimated_value_range: "$50 - $150",
          key_features: ["Well-maintained", "Ready for new home"]
        },
        follow_up_questions: [
          "What did you originally pay for this?",
          "How long have you owned it?",
          "Why are you selling it?"
        ],
        listings: {
          facebook: {
            title: "Great condition item for sale",
            description: `${userDescription}\n\nThis item is in good condition and ready for a new home. Selling due to downsizing. Pick up only, cash preferred. Smoke-free home.`,
            price: "$75",
            tags: ["furniture", "home", "local"]
          },
          craigslist: {
            title: "Item for Sale - $75",
            description: `${userDescription}\n\nItem in good condition. Serious buyers only. Cash only, you pick up. Contact for more details.`,
            price: "$75",
            tags: ["furniture", "home"]
          },
          offerup: {
            title: "Item - Good Condition!",
            description: `${userDescription}\n\nGreat condition! Pick up only. Message me if interested! 📱`,
            price: "$75",
            tags: ["furniture", "home", "local", "pickup"]
          }
        },
        selling_tips: [
          "Post during evening hours (6-8 PM) for best visibility",
          "Take photos in good lighting from multiple angles",
          "Meet in public places for safety"
        ]
      };
    }

    return NextResponse.json({
      success: true,
      data: parsedResponse
    });

  } catch (error) {
    console.error('Error in analyze API:', error);
    return NextResponse.json(
      { 
        error: 'Failed to analyze item',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, 
      { status: 500 }
    );
  }
}
