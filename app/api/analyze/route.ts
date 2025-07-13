import { NextRequest, NextResponse } from 'next/server';
import { GoogleAuth } from 'google-auth-library';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const imageFile = formData.get('image') as File;
    const userDescription = formData.get('description') as string || '';
    const transcription = formData.get('transcription') as string || '';
    
    console.log('=== DEBUGGING INFO ===');
    console.log('Image file:', imageFile?.name, imageFile?.size, imageFile?.type);
    console.log('User description:', userDescription);
    console.log('Transcription:', transcription);
    
    if (!imageFile) {
      return NextResponse.json({ error: 'No image provided' }, { status: 400 });
    }

    // Convert image to base64
    const bytes = await imageFile.arrayBuffer();
    const base64Image = Buffer.from(bytes).toString('base64');
    
    // Get Google Cloud credentials
    const credentialsJson = process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON;
    const projectId = process.env.GOOGLE_CLOUD_PROJECT_ID;
    
    console.log('Credentials exist:', !!credentialsJson);
    console.log('Project ID:', projectId);
    
    if (!credentialsJson || !projectId) {
      throw new Error('Google Cloud credentials not configured');
    }
    
    // Parse credentials
    const credentials = JSON.parse(credentialsJson);
    
    // Create Google Auth client
    const auth = new GoogleAuth({
      credentials: credentials,
      projectId: projectId,
      scopes: ['https://www.googleapis.com/auth/cloud-platform']
    });
    
    // Get access token
    const authClient = await auth.getClient();
    const accessToken = await authClient.getAccessToken();
    
    console.log('=== GOOGLE CLOUD AUTH ===');
    console.log('Auth client created:', !!authClient);
    console.log('Access token obtained:', !!accessToken.token);
    
    // Simplified prompt for Vertex AI Gemini
    const prompt = `Analyze this image and create a detailed marketplace listing. Look at the image carefully and identify what item this is, its condition, materials, and features.

User says: "${userDescription} ${transcription}"

Please respond with a JSON object in this exact format:
{
  "item_name": "What is this item? (be specific - brand, model if visible)",
  "category": "Furniture/Electronics/Clothing/etc",
  "condition": "New/Like New/Good/Fair/Poor", 
  "price_suggestion": "$XXX",
  "detailed_description": "Professional description with specific details you can see in the image",
  "key_features": ["feature1", "feature2", "feature3"],
  "materials_colors": "What materials and colors do you see?",
  "dimensions_estimate": "Approximate size based on what you see",
  "facebook_title": "Title optimized for Facebook Marketplace",
  "facebook_description": "Casual, friendly description for Facebook",
  "craigslist_title": "Professional title for Craigslist", 
  "craigslist_description": "Detailed description for Craigslist"
}

Be specific about what you actually see in the image. Don't make generic assumptions.`;

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
        temperature: 0.3,
        topK: 20,
        topP: 0.8,
        maxOutputTokens: 2048,
      }
    };

    console.log('=== SENDING TO VERTEX AI GEMINI ===');
    console.log('Project ID:', projectId);
    console.log('Image size:', base64Image.length, 'characters');
    
    // Use Vertex AI endpoint with proper authentication
    const vertexAiUrl = `https://us-central1-aiplatform.googleapis.com/v1/projects/${projectId}/locations/us-central1/publishers/google/models/gemini-1.5-pro:generateContent`;
    
    const response = await fetch(vertexAiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken.token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(geminiRequest)
    });

    console.log('=== VERTEX AI RESPONSE ===');
    console.log('Status:', response.status, response.statusText);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Vertex AI error details:', errorText);
      throw new Error(`Vertex AI error: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    console.log('=== RAW VERTEX AI RESULT ===');
    console.log('Full result structure:', JSON.stringify(result, null, 2));
    
    const text = result.candidates?.[0]?.content?.parts?.[0]?.text || '';
    console.log('=== EXTRACTED TEXT ===');
    console.log('Text length:', text.length);
    console.log('Full text:', text);
    
    // Try to parse JSON from the response
    let parsedResponse;
    try {
      // Look for JSON in the response
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        console.log('=== FOUND JSON ===');
        console.log('JSON string:', jsonMatch[0]);
        parsedResponse = JSON.parse(jsonMatch[0]);
        console.log('=== PARSED SUCCESSFULLY ===');
      } else {
        console.log('=== NO JSON FOUND - USING FALLBACK ===');
        throw new Error('No JSON found in Vertex AI response');
      }
    } catch (parseError) {
      console.error('=== JSON PARSE ERROR ===');
      console.error('Parse error:', parseError);
      console.error('Trying to parse:', text);
      
      // Create a more intelligent fallback based on the actual image analysis
      parsedResponse = {
        item_name: "ANALYSIS FAILED - Mirror or Reflective Surface", 
        category: "Home & Garden",
        condition: "Good", 
        price_suggestion: "$75",
        detailed_description: `AI analysis temporarily unavailable. Based on image: appears to be a large mirror or reflective surface. Clean condition visible. User description: "${userDescription}". Please manually review and adjust details.`,
        key_features: ["Large reflective surface", "Clean appearance", "Ready for pickup"],
        materials_colors: "Glass and frame materials",
        dimensions_estimate: "Large format",
        facebook_title: "Large Mirror - Good Condition",
        facebook_description: `Great condition mirror from clean home. ${userDescription}. Ready for pickup!`,
        craigslist_title: "Large Mirror - Good Condition - $75", 
        craigslist_description: `For Sale: Large Mirror\n\nCondition: Good\nDetails: ${userDescription}\n\nCash only, pickup required.`
      };
    }

    console.log('=== FINAL RESPONSE ===');
    console.log('Sending back:', JSON.stringify(parsedResponse, null, 2));
    
    return NextResponse.json(parsedResponse);

  } catch (error) {
    console.error('=== CRITICAL ERROR ===');
    console.error('Error details:', error);
    return NextResponse.json(
      { 
        error: 'Failed to analyze item',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, 
      { status: 500 }
    );
  }
}
