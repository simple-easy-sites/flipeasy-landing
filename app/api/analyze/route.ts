import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const imageFile = formData.get('image') as File;
    const userDescription = formData.get('description') as string || '';
    
    console.log('=== ADVANCED AI WITH WEB SEARCH ===');
    console.log('Processing image:', imageFile?.name, imageFile?.size);
    console.log('User said:', userDescription);
    
    if (!imageFile) {
      return NextResponse.json({ error: 'No image provided' }, { status: 400 });
    }

    // Convert image to base64
    const bytes = await imageFile.arrayBuffer();
    const base64Image = Buffer.from(bytes).toString('base64');
    
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'API key not configured' }, { status: 500 });
    }
    
    // ADVANCED PROMPT WITH WEB SEARCH INSTRUCTIONS
    const prompt = `You are an expert marketplace listing creator with internet search capabilities. Analyze this image and user input to create comprehensive, research-backed listings.

User description: "${userDescription}"

REQUIRED ACTIONS:
1. IDENTIFY THE ITEM: Look carefully at the image to identify the exact item, brand, model, style, and key features
2. SEARCH THE INTERNET: Research this specific item online to find:
   - Original retail price and where it's sold
   - Product specifications and dimensions  
   - Similar items currently for sale
   - Market price ranges for used versions
   - Brand information and product reviews
3. PRICING RESEARCH: Look up current marketplace prices for this item in used condition
4. DETAILED ANALYSIS: Combine image analysis with internet research

If the user mentions a specific store (IKEA, Target, Wayfair, etc.), prioritize searching that retailer's website for the exact product.

Provide a comprehensive JSON response:
{
  "item_identification": {
    "name": "Exact product name if found online",
    "brand": "Brand name",
    "model": "Model/SKU if available", 
    "category": "Furniture/Electronics/Home/etc",
    "style": "Modern/Traditional/Contemporary/etc",
    "materials": "What materials you can see",
    "colors": "Exact colors visible",
    "condition_assessment": "Excellent/Very Good/Good/Fair based on image"
  },
  "internet_research": {
    "original_retail_price": "Price from retailer websites",
    "where_sold": "Which stores/websites sell this",
    "product_specifications": "Detailed specs found online",
    "dimensions": "Size information if found",
    "similar_items_found": "What similar products exist",
    "market_research": "Current resale prices found online"
  },
  "pricing_strategy": {
    "suggested_price": "$XX (main recommendation)",
    "quick_sale_price": "$XX (fast turnover)",
    "optimistic_price": "$XX (best case)",
    "pricing_rationale": "Detailed explanation based on research"
  },
  "marketplace_listings": {
    "facebook_marketplace": {
      "title": "Optimized for Facebook (casual tone)",
      "description": "Personal, story-driven description with research details",
      "price": "$XX"
    },
    "craigslist": {
      "title": "Professional title with specs",
      "description": "Detailed, factual description with dimensions/specs",
      "price": "$XX"
    },
    "offerup": {
      "title": "Mobile-friendly title",
      "description": "Concise but complete description",
      "price": "$XX"
    }
  },
  "selling_optimization": {
    "key_selling_points": ["Most important features to highlight"],
    "target_buyers": "Who would want this item",
    "best_posting_times": "When to post for maximum visibility",
    "negotiation_advice": "How to handle offers",
    "photos_needed": "Additional angles that would help sell"
  }
}

CRITICAL: Use your web search capabilities to find real, current information about this item. Don't guess - research it online and provide factual, verified details.`;

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
        temperature: 0.2,
        maxOutputTokens: 4000
      },
      // Enable web search capabilities
      tools: [{
        googleSearchRetrieval: {
          disableAttribution: false
        }
      }]
    };

    console.log('Making advanced API call with web search...');
    
    // Use Gemini 2.0 Flash with web search capabilities
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      }
    );

    console.log('API Response:', response.status, response.statusText);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('API Error:', errorText);
      
      // Fallback to regular Gemini if web search fails
      if (response.status === 400) {
        console.log('Web search not available, falling back to regular analysis');
        return await fallbackToRegularGemini(apiKey, requestBody, userDescription);
      }
      
      throw new Error(`API Error: ${response.status}`);
    }

    const result = await response.json();
    const text = result.candidates?.[0]?.content?.parts?.[0]?.text || '';
    
    console.log('Got advanced response with web search:', text.substring(0, 300) + '...');
    
    // Parse the comprehensive JSON response
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const comprehensiveData = JSON.parse(jsonMatch[0]);
        
        console.log('Successfully parsed comprehensive listing');
        
        return NextResponse.json({
          success: true,
          web_search_used: true,
          comprehensive_data: comprehensiveData,
          // Convert to simplified format for frontend compatibility
          listing: {
            title: comprehensiveData.marketplace_listings?.facebook_marketplace?.title || 
                   comprehensiveData.item_identification?.name || 'Quality Item',
            price: comprehensiveData.pricing_strategy?.suggested_price || '$75',
            description: comprehensiveData.marketplace_listings?.facebook_marketplace?.description || 
                        generateFallbackDescription(comprehensiveData, userDescription),
            category: comprehensiveData.item_identification?.category || 'General',
            condition: comprehensiveData.item_identification?.condition_assessment || 'Good',
            features: comprehensiveData.selling_optimization?.key_selling_points || ['Well-maintained']
          }
        });
      }
    } catch (parseError) {
      console.log('JSON parse failed, using fallback with available text');
      return NextResponse.json({
        success: false,
        web_search_attempted: true,
        raw_response: text,
        listing: createIntelligentFallback(text, userDescription)
      });
    }
    
    // Fallback if no JSON found
    return NextResponse.json({
      success: false,
      listing: createFallbackListing(userDescription),
      message: 'AI analysis completed but response format needs adjustment'
    });

  } catch (error) {
    console.error('Request failed:', error);
    
    return NextResponse.json({
      success: false,
      listing: createFallbackListing(''),
      message: 'Temporary service issue - using offline analysis'
    });
  }
}

// Fallback to regular Gemini without web search
async function fallbackToRegularGemini(apiKey: string, originalRequest: any, userDescription: string) {
  console.log('Attempting fallback to regular Gemini...');
  
  // Remove web search tools for fallback
  const fallbackRequest = {
    ...originalRequest,
    tools: undefined
  };
  
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=${apiKey}`,
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
        fallback_used: true,
        listing: createIntelligentFallback(text, userDescription)
      });
    }
  } catch (error) {
    console.error('Fallback also failed:', error);
  }
  
  return NextResponse.json({
    success: false,
    listing: createFallbackListing(userDescription),
    message: 'Using basic analysis due to service limitations'
  });
}

// Create intelligent fallback from AI response text
function createIntelligentFallback(aiText: string, userDescription: string) {
  // Extract any useful information from the AI response
  const priceMatch = aiText.match(/\$\d+/);
  const price = priceMatch ? priceMatch[0] : '$75';
  
  // Look for item identification in the text
  const sentences = aiText.split(/[.!?]+/);
  const titleSentence = sentences.find(s => s.includes('chair') || s.includes('table') || s.includes('item')) || sentences[0];
  const title = titleSentence ? titleSentence.trim().substring(0, 60) + ' - Excellent Condition' : 'Quality Item - Excellent Condition';
  
  return {
    title: title,
    price: price,
    description: `${userDescription}

${aiText.substring(0, 200)}...

• Excellent condition as shown
• From clean, smoke-free home
• Ready for immediate pickup
• Cash preferred, serious buyers only

Perfect for someone looking for a quality piece. Priced to sell!`,
    category: 'General',
    condition: 'Good',
    features: ['Excellent condition', 'Ready for pickup', 'Quality item']
  };
}

// Simple fallback function
function createFallbackListing(userDescription: string) {
  const itemName = userDescription.split(' ').slice(0, 3).join(' ') || 'Quality Item';
  
  return {
    title: `${itemName} - Excellent Condition`,
    price: '$75',
    description: `${userDescription || 'Quality item in excellent condition'}

• Well-maintained and cared for
• From clean, smoke-free home  
• Ready for immediate pickup
• Cash preferred, local pickup only
• Serious buyers only please

Perfect for someone looking for a quality ${itemName.toLowerCase()}. Priced to sell quickly!`,
    category: 'General',
    condition: 'Good',
    features: ['Well-maintained', 'Ready for pickup', 'Great condition']
  };
}

// Generate comprehensive description from research data
function generateFallbackDescription(data: any, userDescription: string) {
  const name = data.item_identification?.name || 'item';
  const brand = data.item_identification?.brand || '';
  const originalPrice = data.internet_research?.original_retail_price || '';
  const specs = data.internet_research?.product_specifications || '';
  
  return `${brand} ${name} in ${data.item_identification?.condition_assessment || 'excellent'} condition.

${userDescription}

${specs ? `• ${specs}` : ''}
${originalPrice ? `• Originally retailed for ${originalPrice}` : ''}
• ${data.item_identification?.materials || 'Quality materials'}
• From clean, smoke-free home
• Ready for immediate pickup
• Cash preferred, serious inquiries only

${data.selling_optimization?.target_buyers ? `Perfect for ${data.selling_optimization.target_buyers}.` : ''} Priced for quick sale!`;
}
