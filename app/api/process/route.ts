// app/api/process/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { groqHandler } from '@/lib/groq-handler';

export async function POST(request: NextRequest) {
  try {
    console.log('🔍 PROCESS API: Received request');
    
    const body = await request.json();
    
    console.log('📦 PROCESS API: Request body:', JSON.stringify(body, null, 2));

    const { 
      action, 
      feature, 
      featurePrompt, 
      conversationHistory, 
      userQuery,
      query,
      pageInfo,
      pageContext,
      selectedText,
      model
    } = body;

    // Use userQuery if available, otherwise fall back to query
    const finalQuery = userQuery || query;

    if (!feature || !finalQuery) {
      return NextResponse.json({ 
        error: 'Missing required fields',
        received: { feature, userQuery, query: finalQuery },
        required: ['feature', 'userQuery or query']
      }, { status: 400 });
    }

    // Merge pageContext into pageInfo
    const enhancedPageInfo = {
      ...pageInfo,
      ...pageContext,
      selectedText: selectedText || pageInfo?.selectedText
    };

    console.log('📋 PROCESS API: Enhanced page info:', {
      title: enhancedPageInfo?.title,
      url: enhancedPageInfo?.url,
      hasSelectedText: !!enhancedPageInfo?.selectedText,
      hasMainText: !!enhancedPageInfo?.mainText
    });

    const result = await groqHandler.processRequest({
      action,
      feature,
      featurePrompt,
      conversationHistory,
      query: finalQuery,
      pageInfo: enhancedPageInfo,
      model: model || 'openai/gpt-oss-120b'
    });

    console.log('✅ PROCESS API: Success');
    
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('❌ PROCESS API: Error:', error);
    
    return NextResponse.json({ 
      error: 'Failed to process request',
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 });
  }
}

// Add OPTIONS handler for CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}