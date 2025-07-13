import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const imageFile = formData.get('image') as File;
    const userDescription = formData.get('description') as string || '';
    const transcription = formData.get('transcription') as string || '';
    
    if (!imageFile) {
      return NextResponse.json({ error: 'No image provided' }, { status: 400 });
    }

    // Convert image to base64
    const bytes = await imageFile.arrayBuffer();
    const base64Image = Buffer.from(bytes).toString('base64');
    
    const geminiApiKey = process.env.GEMINI_API_KEY;
    if (!geminiApiKey) {
      throw new Error('GEMINI_API_KEY not configured');
    }
    
    // Combine all user input
    const fullUserInput = `
    Written Description: ${userDescription}
    Voice Transcription: ${transcription}
    `;
    
    // Enhanced AI prompt for comprehensive marketplace listings
    const prompt = `You are an expert marketplace listing creator and product researcher. Analyze this image and user input to create comprehensive, professional listings optimized for selling success.

User Input: "${fullUserInput}"

COMPREHENSIVE ANALYSIS REQUIRED:

1. DETAILED ITEM IDENTIFICATION:
   - Identify the exact item (name, type, category, model if visible)
   - Look for visible brand names, logos, model numbers, or distinctive features  
   - If this appears to be IKEA, Target, Wayfair, etc., identify the specific product name
   - Estimate condition based on visible wear, scratches, or damage
   - Note materials, colors, design style, and key features
   - Determine approximate dimensions if visible

2. FACEBOOK MARKETPLACE CATEGORIZATION:
   - Assign to correct Facebook Marketplace category from: Antiques & Collectibles, Arts & Crafts, Auto Parts & Accessories, Baby Products, Books/Movies/Music, Cell Phones & Accessories, Clothing/Shoes/Accessories, Electronics, Furniture, Health & Beauty, Home & Kitchen, Jewelry & Watches, Miscellaneous, Musical Instruments, Office Supplies, Patio & Garden, Pets/Pet Supplies, Sporting Goods, Tools & Home Improvement, Toys & Games, Travel/Luggage, Video Games & Consoles, Vehicles, Real Estate
   - Determine appropriate subcategory (e.g., Furniture → Living Room → Chairs → Accent Chairs)
   - Consider style, finish, material specifications

3. COMPREHENSIVE PRICING STRATEGY:
   - Research typical market prices for this exact item if identifiable
   - Provide 3 pricing options: Quick Sale, Market Value, Optimistic
   - Consider condition, demand, and local market factors
   - Factor in original retail price for comparison

4. PROFESSIONAL LISTING GENERATION:
   Create a single, comprehensive listing with ALL required Facebook Marketplace fields:

Return response in this EXACT JSON structure:
{
  "item_analysis": {
    "name": "Specific product name if identifiable, otherwise descriptive name",
    "brand": "Brand name if visible or identifiable, otherwise 'Unknown'", 
    "model": "Model number/name if identifiable, otherwise 'N/A'",
    "category": "Primary Facebook Marketplace category",
    "subcategory": "Specific subcategory path (e.g., 'Living Room > Chairs > Accent Chairs')",
    "condition": "New/Like New/Good/Fair/Poor (Facebook's condition options)",
    "estimated_retail_price": "$XXX (if found) or 'Research needed'",
    "key_features": ["feature1", "feature2", "feature3"],
    "materials": "Primary material (wood, metal, plastic, fabric, etc.)",
    "color": "Primary color(s)",
    "style": "Design style (modern, vintage, traditional, etc.)",
    "dimensions": "L x W x H (if determinable from image)",
    "notable_wear": "Any visible damage or wear to mention",
    "original_purchase_info": "Where/when bought if user mentioned"
  },
  "pricing_strategy": {
    "quick_sale_price": "$XX",
    "market_price": "$XX", 
    "optimistic_price": "$XX",
    "recommended_price": "$XX",
    "pricing_rationale": "Detailed explanation of pricing strategy",
    "retail_comparison": "Comparison to retail price if known"
  },
  "comprehensive_listing": {
    "title": "Professional, SEO-optimized title under 80 characters",
    "price": "$XXX",
    "condition": "Facebook Marketplace condition (New/Like New/Good/Fair/Poor)",
    "category": "Primary category",
    "subcategory": "Detailed subcategory path",
    "description": "Professional, detailed description with:\n\n• Item specifics (brand, model, dimensions, material, color)\n• Condition details (honest assessment of wear/flaws)\n• Original purchase story (where bought, how long owned, why selling)\n• Key features and benefits\n• Care/usage instructions if relevant\n• Pickup/delivery preferences",
    "tags": ["keyword1", "keyword2", "keyword3", "keyword4", "keyword5"],
    "specifications": {
      "brand": "Brand name",
      "model": "Model if known", 
      "dimensions": "L x W x H",
      "material": "Primary material",
      "color": "Color(s)",
      "style": "Design style",
      "weight": "Approximate weight if determinable",
      "finish": "Surface finish (glossy, matte, textured, etc.)"
    }
  },
  "platform_optimized_listings": {
    "facebook_marketplace": {
      "title": "Facebook-optimized title",
      "price": "$XXX",
      "description": "Casual, friendly description with personal story elements",
      "category": "Facebook category",
      "condition": "Facebook condition",
      "tags": ["facebook", "optimized", "tags"]
    },
    "craigslist": {
      "title": "BRAND MODEL - Condition - $XXX",
      "price": "$XXX", 
      "description": "Professional, detailed sections with clear headers",
      "tags": ["craigslist", "tags"]
    },
    "offerup": {
      "title": "Brand Item Name - Condition",
      "price": "$XXX",
      "description": "Mobile-optimized, brief but informative",
      "tags": ["offerup", "mobile", "tags"]
    }
  },
  "selling_optimization": {
    "best_posting_times": "Optimal times for this category",
    "pricing_advice": "Specific pricing guidance",
    "common_questions": ["What buyers typically ask about this item"],
    "negotiation_tips": "How to handle offers",
    "safety_tips": ["Relevant safety advice for this transaction"],
    "photo_suggestions": ["Additional photo angles that would help sell"]
  }
}

CRITICAL REQUIREMENTS:
- Create listings that will actually SELL at optimal prices
- Include ALL required Facebook Marketplace fields (title, price, condition, category, description, location)
- Be completely honest about condition and any flaws
- Use the user's actual story/details when they provided them
- Make descriptions scannable with bullet points and clear sections
- Include specific measurements, materials, and technical details
- Optimize for search with relevant keywords
- Price realistically based on actual market conditions

LISTING DESCRIPTION FORMAT:
Create a comprehensive description that includes:
1. Opening line with key details (brand, model, condition)
2. Detailed specifications (dimensions, material, color, style)
3. Condition assessment (honest about any wear or flaws)
4. Personal story (why selling, how long owned, original purchase)
5. Key features and benefits
6. Practical information (pickup preferences, payment methods)

Make it professional but approachable, detailed but scannable.`;

    const geminiRequest = {
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
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 6144,
      }
    };

    console.log('Sending request to Gemini API...');
    
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${geminiApiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(geminiRequest)
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Gemini API error:', response.status, response.statusText, errorText);
      throw new Error(`Gemini API error: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();
    const text = result.candidates?.[0]?.content?.parts?.[0]?.text || '';
    
    console.log('Received response from Gemini:', text.substring(0, 500) + '...');
    
    // Parse JSON response from Gemini
    let parsedResponse;
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsedResponse = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found in response');
      }
    } catch (parseError) {
      console.error('Failed to parse Gemini response:', text);
      
      // Enhanced fallback with comprehensive structure
      const fallbackName = userDescription.toLowerCase().includes('chair') ? 'Office Chair' : 
                          userDescription.toLowerCase().includes('table') ? 'Table' : 
                          userDescription.toLowerCase().includes('couch') ? 'Couch' : 'Household Item';
      
      parsedResponse = {
        item_analysis: {
          name: fallbackName,
          brand: 'Unknown',
          model: 'N/A',
          category: 'Furniture',
          subcategory: 'Living Room > Other',
          condition: 'Good',
          estimated_retail_price: 'Research needed',
          key_features: ['Well-maintained', 'Good condition', 'Ready for pickup'],
          materials: 'Mixed materials',
          color: 'Standard',
          style: 'Contemporary',
          dimensions: 'Standard size',
          notable_wear: 'Normal wear for age',
          original_purchase_info: 'Not specified'
        },
        pricing_strategy: {
          quick_sale_price: '$60',
          market_price: '$75',
          optimistic_price: '$90',
          recommended_price: '$75',
          pricing_rationale: 'Conservative pricing for quick sale',
          retail_comparison: 'Significant savings from retail'
        },
        comprehensive_listing: {
          title: `${fallbackName} - Good Condition`,
          price: '$75',
          condition: 'Good',
          category: 'Furniture',
          subcategory: 'Living Room > Other',
          description: `${fallbackName} in good condition. Well-maintained item from smoke-free home.\n\n• Condition: Good condition with normal wear\n• Ready for immediate pickup\n• Cash preferred\n• Serious inquiries only\n\nMoving sale - need gone ASAP!`,
          tags: ['furniture', 'home', 'moving', 'local', 'pickup'],
          specifications: {
            brand: 'Unknown',
            model: 'N/A',
            dimensions: 'Standard size',
            material: 'Mixed materials',
            color: 'Standard',
            style: 'Contemporary',
            weight: 'Standard weight',
            finish: 'Standard finish'
          }
        },
        platform_optimized_listings: {
          facebook_marketplace: {
            title: `${fallbackName} - Great Condition!`,
            price: '$75',
            description: 'Great condition item from smoke-free home. Moving sale!',
            category: 'Furniture',
            condition: 'Good',
            tags: ['furniture', 'home', 'moving', 'local', 'pickup']
          },
          craigslist: {
            title: `${fallbackName} - Good Condition - $75`,
            price: '$75',
            description: `For Sale: ${fallbackName} - Good Condition\n\nQuality item in good condition. Cash only, pickup required.`,
            tags: ['furniture', 'household', 'moving']
          },
          offerup: {
            title: `${fallbackName} - Great Deal!`,
            price: '$75',
            description: 'Great condition item! Must sell!',
            tags: ['furniture', 'home', 'moving', 'local', 'pickup', 'deal']
          }
        },
        selling_optimization: {
          best_posting_times: '6-8 PM weekdays, Weekend mornings',
          pricing_advice: 'Price competitively for quick sale',
          common_questions: ['Dimensions?', 'Condition?', 'Pick up location?'],
          negotiation_tips: 'Be firm but fair',
          safety_tips: ['Meet in public place', 'Cash only', 'Bring a friend'],
          photo_suggestions: ['Multiple angles', 'Better lighting', 'Detail shots']
        }
      };
    }

    return NextResponse.json(parsedResponse);

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