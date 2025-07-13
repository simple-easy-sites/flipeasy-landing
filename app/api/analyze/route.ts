import { GoogleAuth } from 'google-auth-library';
import { NextRequest, NextResponse } from 'next/server';

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
    
    // Initialize Google Auth with service account key
    const auth = new GoogleAuth({
      credentials: process.env.GOOGLE_SERVICE_ACCOUNT_KEY ? 
        JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY) : undefined,
      scopes: ['https://www.googleapis.com/auth/cloud-platform'],
      projectId: process.env.VERTEX_AI_PROJECT_ID,
    });
    
    const accessToken = await auth.getAccessToken();
    
    if (!accessToken) {
      throw new Error('Failed to obtain access token for Vertex AI');
    }
    
    // Prepare the request for Vertex AI Gemini 2.5 Pro
    const vertexAIRequest = {
      contents: [{
        role: 'user',
        parts: [
          {
            text: `You are an expert marketplace listing creator and product researcher with access to web search. Analyze this image carefully and create professional listings optimized for different platforms.

User's description: "${userDescription}"

COMPREHENSIVE ANALYSIS REQUIRED:

1. DETAILED ITEM IDENTIFICATION:
   - Identify the exact item (name, type, category)
   - Look for visible brand names, logos, model numbers, or distinctive features
   - If you see furniture that looks like IKEA, Wayfair, Target, etc., try to identify the specific product
   - Estimate condition based on visible wear, scratches, or damage
   - Note materials, colors, and design style

2. PRODUCT RESEARCH (use web search if available):
   - If this appears to be from IKEA, search for the specific product name and model
   - Look up current retail prices for similar items
   - Find typical used market prices for this type of item
   - Research product dimensions and specifications if identifiable

3. MARKET INTELLIGENCE:
   - Consider seasonal demand factors
   - Account for local vs national market differences
   - Factor in item condition, age, and demand

4. SAFETY & LEGAL CONSIDERATIONS:
   - Note any items that require special safety warnings
   - Identify if this is an item that commonly gets recalled
   - Consider platform-specific restrictions

Return response in this EXACT JSON structure:
{
  "item_analysis": {
    "name": "Specific product name if identifiable, otherwise descriptive name",
    "brand": "Brand name if visible or identifiable, otherwise 'Unknown'",
    "model": "Model number/name if identifiable, otherwise 'N/A'",
    "category": "specific category (e.g., 'office chair', 'dining table', 'smartphone')",
    "condition": "excellent/very good/good/fair/poor",
    "estimated_retail_price": "$XXX (if found) or 'Research needed'",
    "estimated_used_value_range": "$X - $Y based on condition and market",
    "key_features": ["feature1", "feature2", "feature3"],
    "materials": "wood/metal/plastic/fabric/etc",
    "dimensions": "approximate dimensions if visible or known",
    "notable_wear": "describe any visible damage or wear"
  },
  "product_research": {
    "likely_original_source": "IKEA/Wayfair/Target/Unknown/etc",
    "search_recommendations": ["search term 1", "search term 2"],
    "comparable_items": ["similar item 1", "similar item 2"],
    "market_demand": "high/medium/low",
    "seasonality_factor": "relevant seasonal considerations"
  },
  "pricing_strategy": {
    "quick_sale_price": "$XX (15-20% below market)",
    "market_price": "$XX (fair market value)",
    "optimistic_price": "$XX (10-15% above market)",
    "pricing_rationale": "explanation of pricing strategy"
  },
  "listings": {
    "facebook": {
      "title": "Engaging title under 80 chars with key details",
      "description": "Casual, friendly tone. Mention why selling, condition, pickup details. Use local language. Include measurements if furniture. 2-3 paragraphs max.",
      "price": "$XXX",
      "tags": ["tag1", "tag2", "tag3", "tag4", "tag5"]
    },
    "craigslist": {
      "title": "Detailed title with brand, condition, price - $XXX",
      "description": "Professional, detailed description. Include all specifications, condition details, firm/negotiable price policy. Mention cash only, pickup location. Safety-focused language.",
      "price": "$XXX",
      "tags": ["tag1", "tag2", "tag3"]
    },
    "offerup": {
      "title": "Catchy title! Brand + key feature",
      "description": "Mobile-friendly short description. Use 1-2 relevant emojis. Focus on quick sale benefits. Mention if firm price.",
      "price": "$XXX",
      "tags": ["tag1", "tag2", "tag3", "tag4", "tag5", "tag6"]
    }
  },
  "selling_optimization": {
    "best_posting_times": ["specific times for this category"],
    "photo_suggestions": ["specific photo tips for this item"],
    "safety_tips": ["relevant safety considerations"],
    "common_buyer_questions": ["question1", "question2", "question3"],
    "negotiation_strategy": "guidance for handling offers"
  },
  "follow_up_questions": [
    "What did you originally pay for this item?",
    "How long have you owned it?",
    "Are there any defects not visible in the photo?",
    "Do you have the original receipt or manual?",
    "Why are you selling it specifically?"
  ]
}

CRITICAL REQUIREMENTS:
- Make listings that will actually SELL, not just sound good
- Price realistically based on actual market conditions
- Use platform-appropriate language and formatting
- Include ALL visible details and any wear/damage
- Consider local market factors and buyer psychology
- Optimize for search terms buyers actually use
- Create urgency without seeming desperate
- Address common buyer concerns proactively

If you identify this as an IKEA item or other major retailer product:
- Include the specific product name in titles
- Mention current retail price for comparison
- Reference assembly instructions or product features
- Note if original packaging/hardware is included

Be thorough, honest, and strategic in your analysis. The goal is to help this item sell quickly at the best possible price while ensuring buyer and seller safety.`
          },
          {
            inline_data: {
              mime_type: imageFile.type,
              data: base64Image
            }
          }
        ]
      }],
      generation_config: {
        temperature: 0.7,
        top_k: 40,
        top_p: 0.95,
        max_output_tokens: 8192,
      }
    };

    console.log('Sending request to Vertex AI Gemini 2.5 Pro...');
    
    // Make the direct API call to Vertex AI
    const response = await fetch(
      `https://us-central1-aiplatform.googleapis.com/v1/projects/${process.env.VERTEX_AI_PROJECT_ID}/locations/us-central1/publishers/google/models/gemini-2.5-pro:generateContent`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(vertexAIRequest)
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Vertex AI API error:', response.status, response.statusText, errorText);
      throw new Error(`Vertex AI API error: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();
    const text = result.candidates?.[0]?.content?.parts?.[0]?.text || '';
    
    console.log('Received response from Vertex AI:', text.substring(0, 500) + '...');
    
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
      console.error('Failed to parse Vertex AI response:', text);
      
      // Enhanced fallback response with better structure
      const fallbackName = userDescription.includes('IKEA') ? 'IKEA Furniture Item' : 
                          userDescription.includes('chair') ? 'Chair' :
                          userDescription.includes('table') ? 'Table' : 'Household Item';
      
      parsedResponse = {
        item_analysis: {
          name: fallbackName,
          brand: userDescription.includes('IKEA') ? 'IKEA' : 'Unknown',
          model: 'N/A',
          category: "furniture",
          condition: "good",
          estimated_retail_price: "Research needed",
          estimated_used_value_range: "$50 - $150",
          key_features: ["Well-maintained", "Ready for new home", "Good condition"],
          materials: "Mixed materials",
          dimensions: "Standard size",
          notable_wear: "Normal wear for age"
        },
        product_research: {
          likely_original_source: userDescription.includes('IKEA') ? 'IKEA' : 'Unknown',
          search_recommendations: [fallbackName, "similar furniture"],
          comparable_items: ["similar style furniture", "comparable home goods"],
          market_demand: "medium",
          seasonality_factor: "Year-round demand"
        },
        pricing_strategy: {
          quick_sale_price: "$60",
          market_price: "$75",
          optimistic_price: "$90",
          pricing_rationale: "Conservative pricing based on typical used furniture market"
        },
        listings: {
          facebook: {
            title: `${fallbackName} - Excellent Condition!`,
            description: `${userDescription}\n\nThis ${fallbackName.toLowerCase()} is in great condition and ready for a new home! We're moving and need to sell quickly. Smoke-free home, pet-free. Pick up only - serious buyers please. Cash preferred, Venmo/PayPal also accepted.\n\nMessage me with any questions or to schedule pickup!`,
            price: "$75",
            tags: ["furniture", "home", "moving", "local", "pickup"]
          },
          craigslist: {
            title: `${fallbackName} - Good Condition - $75`,
            description: `${userDescription}\n\n${fallbackName} in good condition. Normal wear for age but very functional. Must sell due to relocation.\n\nCash only, you pick up. Located in safe area with easy parking. Serious inquiries only please.\n\nContact for more details or to arrange viewing.`,
            price: "$75",
            tags: ["furniture", "household", "moving"]
          },
          offerup: {
            title: `${fallbackName} - Great Deal! 🏠`,
            description: `${userDescription}\n\nGreat condition ${fallbackName.toLowerCase()}! Perfect for any home. Moving sale - must go! 📦\n\nPick up only. Message me! 📱`,
            price: "$75",
            tags: ["furniture", "home", "moving", "local", "pickup", "deal"]
          }
        },
        selling_optimization: {
          best_posting_times: ["6-8 PM weekdays", "10-12 PM weekends"],
          photo_suggestions: ["Take photos in good lighting", "Show from multiple angles", "Include close-ups of any wear"],
          safety_tips: ["Meet in public parking lot", "Bring a friend", "Cash only at pickup"],
          common_buyer_questions: ["What are the exact dimensions?", "Any damage not shown?", "Why are you selling?"],
          negotiation_strategy: "Be firm but flexible, bundle with other items if possible"
        },
        follow_up_questions: [
          "What did you originally pay for this?",
          "How long have you owned it?",
          "Are there any scratches or defects not visible?",
          "Do you still have assembly instructions?",
          "Are you flexible on price or firm?"
        ]
      };
    }

    return NextResponse.json({
      success: true,
      data: parsedResponse,
      ai_model_used: "vertex-ai-gemini-2.5-pro",
      processing_time: Date.now()
    });

  } catch (error) {
    console.error('Error in Vertex AI analyze API:', error);
    return NextResponse.json(
      { 
        error: 'Failed to analyze item',
        details: error instanceof Error ? error.message : 'Unknown error',
        ai_model: "vertex-ai-gemini-2.5-pro"
      }, 
      { status: 500 }
    );
  }
}