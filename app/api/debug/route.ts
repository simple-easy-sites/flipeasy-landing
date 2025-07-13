import { NextRequest, NextResponse } from 'next/server';
import { GoogleAuth } from 'google-auth-library';

export async function GET() {
  try {
    // Check environment
    const credentialsJson = process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON;
    const projectId = process.env.GOOGLE_CLOUD_PROJECT_ID;
    const nodeEnv = process.env.NODE_ENV;
    const vercelEnv = process.env.VERCEL_ENV;
    
    console.log('=== VERCEL DEBUG ===');
    console.log('Node ENV:', nodeEnv);
    console.log('Vercel ENV:', vercelEnv);
    console.log('Credentials exist:', !!credentialsJson);
    console.log('Project ID:', projectId);
    
    if (!credentialsJson || !projectId) {
      return NextResponse.json({ 
        error: 'Google Cloud credentials not configured',
        node_env: nodeEnv,
        vercel_env: vercelEnv,
        credentials_exist: !!credentialsJson,
        project_id_exist: !!projectId,
        available_env_vars: Object.keys(process.env).filter(key => key.includes('GOOGLE')),
      });
    }
    
    // Parse and test credentials
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
    
    console.log('Google Auth successful:', !!accessToken.token);
    
    // Test simple Vertex AI request
    const testRequest = {
      contents: [{
        parts: [{ text: "Reply with exactly: VERTEX_AI_SUCCESS" }]
      }],
      generationConfig: {
        temperature: 0,
        maxOutputTokens: 20
      }
    };
    
    console.log('Testing Vertex AI Gemini API...');
    
    const vertexAiUrl = `https://us-central1-aiplatform.googleapis.com/v1/projects/${projectId}/locations/us-central1/publishers/google/models/gemini-1.5-pro:generateContent`;
    
    const response = await fetch(vertexAiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken.token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testRequest)
    });
    
    console.log('Vertex AI response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Vertex AI error:', errorText);
      return NextResponse.json({
        error: 'Vertex AI call failed',
        status: response.status,
        statusText: response.statusText,
        errorDetails: errorText,
        project_id: projectId,
        client_email: credentials.client_email
      });
    }
    
    const result = await response.json();
    const responseText = result.candidates?.[0]?.content?.parts?.[0]?.text || '';
    
    console.log('Vertex AI response text:', responseText);
    
    return NextResponse.json({
      success: true,
      vertex_ai_works: true,
      project_id: projectId,
      client_email: credentials.client_email,
      node_env: nodeEnv,
      vercel_env: vercelEnv,
      vertex_response: responseText,
      full_result: result
    });
    
  } catch (error) {
    console.error('Debug endpoint error:', error);
    return NextResponse.json({
      error: 'Debug test failed',
      details: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
  }
}
