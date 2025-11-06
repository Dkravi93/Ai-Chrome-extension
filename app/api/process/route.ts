import { NextResponse } from 'next/server';
import { GroqHandler } from '../../../lib/groq-handler';

const groqHandler = new GroqHandler();

export async function POST(request: Request) {
  try {
    console.log('🔍 PROCESS ENDPOINT: Received request');
    
    const body = await request.json();
    const { action, feature, query, pageInfo } = body;
    
    if (!feature || !query) {
      const response = NextResponse.json(
        { 
          error: 'Missing required fields',
          required: ['feature', 'query']
        },
        { status: 400 }
      );
      response.headers.set('Access-Control-Allow-Origin', '*');
      return response;
    }
    
    const result = await groqHandler.processRequest({
      action,
      feature,
      query,
      pageInfo
    });

    console.log('✅ PROCESS ENDPOINT: Success');
    
    const response = NextResponse.json(result);
    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type');
    
    return response;
  } catch (error: unknown) {
    console.error('❌ PROCESS ENDPOINT: Error:', error);
    
    const response = NextResponse.json(
      { 
        error: 'Failed to process request',
        //@ts-expect-error - error typing
        message: error?.message,
        //@ts-expect-error - error typing
        stack: process.env.NODE_ENV === 'development' ? error?.stack : undefined
      },
      { status: 500 }
    );
    
    response.headers.set('Access-Control-Allow-Origin', '*');
    return response;
  }
}

export async function OPTIONS() {
  const response = new NextResponse(null, { status: 200 });
  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type');
  return response;
}