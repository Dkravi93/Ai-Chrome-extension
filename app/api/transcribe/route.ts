// app/api/transcribe/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { groqHandler } from '@/lib/groq-handler';

export async function POST(request: NextRequest) {
  try {
    console.log('🔍 TRANSCRIBE API: Received request');
    
    const formData = await request.formData();
    const audioFile = formData.get('audio') as File;
    const model = formData.get('model') as string || 'whisper-large-v3-turbo';
    const language = formData.get('language') as string || 'en';
    const temperature = formData.get('temperature') as string || '0.0';

    if (!audioFile) {
      return NextResponse.json({ 
        error: 'No audio file provided' 
      }, { status: 400 });
    }

    console.log('🎵 TRANSCRIBE API: Processing audio file:', {
      name: audioFile.name,
      type: audioFile.type,
      size: audioFile.size
    });

    // Convert File to Buffer
    const arrayBuffer = await audioFile.arrayBuffer();
    const audioBuffer = Buffer.from(arrayBuffer);

    const transcription = await groqHandler.transcribeAudio(
      audioBuffer,
      audioFile.type,
      {
        model,
        language,
        temperature: parseFloat(temperature)
      }
    );

    console.log('✅ TRANSCRIBE API: Transcription successful');
    
    return NextResponse.json({ 
      transcription,
      success: true,
      model,
      language
    });
  } catch (error: any) {
    console.error('❌ TRANSCRIBE API: Error:', error);
    
    return NextResponse.json({ 
      error: 'Transcription failed',
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 });
  }
}

// Handle OPTIONS for CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}