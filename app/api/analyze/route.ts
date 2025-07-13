import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const imageFile = formData.get('image') as File;
    const userDescription = formData.get('description') as string || '';
    
    console.log('=== PROCESSING WITH GOOGLE SEARCH GROUNDING ===');
    console.log('Image:', imageFile?.name, imageFile?.size);
    console.log('Description:', userDescription);
    
    if (!imageFile) {
      return NextResponse.json({ error: 'No image provided' }, { status: 400 });
    }

    const bytes = await imageFile.arrayBuffer();
    const base64Image = Buffer.from(bytes).toString('base64');
    
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'API key not configured' }, { status: 500 });
    }
    
    // ENHANCED PROMPT FOR WEB SEARCH + IMAGE ANALYSIS
    const prompt = `You are an expert marketplace listing creator with access to Google Search. Analyze this image and user description to create a comprehensive, research-backed listing.

User description: "${userDescription}"

STEP 1: ANALYZE THE IMAGE
Look carefully at the image and identify:
- Exact item type, brand, model if visible
- Style, materials, colors, condition
- Any visible brand labels, logos, or design details

STEP 2: SEARCH THE INTERNET
Use Google Search to research:
- If user mentions a specific store (IKEA, Target, etc.), search that retailer for this item
- Find the exact product name, model number, and specifications
- Look up original retail prices and current market values
- Research similar items currently for sale to understand pricing

STEP 3: CREATE COMPREHENSIVE LISTING
Provide a detailed JSON response with your research:

{
  "item_identification": {
    "name": "Exact product name found online (e.g., 'IKEA TOBIAS Chair' or 'Kartell Victoria Ghost Chair')",
    "brand": "Brand name",
    "model": "Model/SKU if found",
    "category": "Furniture/Electronics/Home/etc",
    "style": "Modern/Traditional/etc",
    "materials": "Materials visible in image",
    "condition_assessment": "Based on image analysis",
    "retail_source": "Where this item is sold (IKEA, Kartell, etc.)"
  },
  "internet_research": {
    "original_price": "Current retail price found online",
    "product_specs": "Dimensions, materials, features found online",
    "market_analysis": "Current used prices found online",
    "search_confidence": "How confident you are in the identification"
  },
  "marketplace_listing": {
    "title": "Professional title with brand and model",
    "price": "Recommended selling price based on research",
    "description": "Compelling description combining image details with research",
    "category": "Appropriate marketplace category",
    "condition": "Honest condition assessment",
    "key_features": ["Most important selling points"],
    "why_priced_this_way": "Explanation of pricing based on research"
  }
}

CRITICAL: Use Google Search to find real information about this specific item. If the user mentions a store name, prioritize searching that retailer's website. Provide factual, researched information, not guesses.`;

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
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=${apiKey}`,
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
    if (comprehensiveData && comprehensiveData.marketplace_listing) {
      return NextResponse.json({
        success: true,
        web_search_used: !!groundingMetadata,
        search_queries: groundingMetadata?.webSearchQueries || [],
        comprehensive_data: comprehensiveData,
        listing: {
          title: comprehensiveData.marketplace_listing.title,
          price: comprehensiveData.marketplace_listing.price,
          description: comprehensiveData.marketplace_listing.description,
          category: comprehensiveData.marketplace_listing.category,
          condition: comprehensiveData.marketplace_listing.condition,
          features: comprehensiveData.marketplace_listing.key_features || []
        }
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
      listing: createBasicFallback(userDescription),
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
        fallback_mode: true,
        listing: createIntelligentFallback(text, userDescription, null)
      });
    }
  } catch (error) {
    console.error('Fallback also failed:', error);
  }
  
  return NextResponse.json({
    success: false,
    listing: createBasicFallback(userDescription),
    error: 'Analysis service unavailable'
  });
}

// Create intelligent listing from AI response
function createIntelligentFallback(aiText: string, userDescription: string, groundingMetadata: any) {
  // Extract useful information from the AI response
  const lines = aiText.split('\n').filter(line => line.trim());
  
  // Look for brand/model information
  const brandLine = lines.find(line => 
    line.toLowerCase().includes('ikea') || 
    line.toLowerCase().includes('kartell') || 
    line.toLowerCase().includes('target') ||
    line.toLowerCase().includes('chair') ||
    line.toLowerCase().includes('table')
  );
  
  // Extract price if mentioned
  const priceMatch = aiText.match(/\$\d+/);
  const suggestedPrice = priceMatch ? priceMatch[0] : '$75';
  
  // Create title from the most informative line
  let title = 'Quality Item - Excellent Condition';
  if (brandLine) {
    const cleanLine = brandLine.replace(/[^\w\s$-]/g, '').trim();
    if (cleanLine.length > 0 && cleanLine.length < 80) {
      title = cleanLine + (cleanLine.includes('Condition') ? '' : ' - Excellent Condition');
    }
  }
  
  // Create description combining user input with AI analysis
  const description = `${userDescription}

${groundingMetadata ? '🌐 Researched with Google Search:' : '📝 AI Analysis:'}
${aiText.substring(0, 400)}...

• Excellent condition as shown in photos
• From clean, smoke-free home
• Ready for immediate pickup
• Cash preferred, serious buyers only

${groundingMetadata ? 'Price based on current market research.' : 'Competitively priced for quick sale.'}`;

  return {
    title: title.substring(0, 80),  // Ensure reasonable length
    price: suggestedPrice,
    description: description,
    category: 'Furniture',
    condition: 'Good',
    features: ['Excellent condition', 'Ready for pickup', 'Research-backed pricing']
  };
}

// Basic fallback when everything fails
function createBasicFallback(userDescription: string) {
  const itemName = userDescription.split(' ').slice(0, 3).join(' ') || 'Quality Item';
  
  return {
    title: `${itemName} - Excellent Condition`,
    price: '$75',
    description: `${userDescription || 'Quality item in excellent condition.'}

• Well-maintained and cared for
• From clean, smoke-free home
• Ready for immediate pickup
• Cash preferred
• Serious inquiries only

Great piece at a fair price!`,
    category: 'General',
    condition: 'Good',
    features: ['Well-maintained', 'Ready for pickup']
  };
}
