import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  const apiKey = process.env.GEMINI_API_KEY;
  
  if (!apiKey) {
    return NextResponse.json({ error: 'No API key found' });
  }
  
  try {
    // Simple test request
    const testRequest = {
      contents: [{
        parts: [{ text: "Respond with just the word SUCCESS" }]
      }]
    };
    
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testRequest)
      }
    );
    
    const result = await response.json();
    
    return NextResponse.json({
      status: response.status,
      api_key_works: response.ok,
      response: result
    });
    
  } catch (error) {
    return NextResponse.json({
      error: 'Test failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
