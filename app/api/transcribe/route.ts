import { NextResponse } from 'next/server';
import { GroqHandler } from '../../../lib/groq-handler';

const groqHandler = new GroqHandler();

export async function POST(request: Request) {
  try {
    console.log('🔍 TRANSCRIBE ENDPOINT: Received request');
    
    const contentType = request.headers.get('content-type') || '';
    console.log('📝 Content-Type:', contentType);

    let audioBuffer: Buffer;
    let mimeType: string;

    // Check if it's FormData (file upload)
    if (contentType.includes('multipart/form-data')) {
      console.log('📁 FormData upload detected');
      const formData = await request.formData();
      const audioFile = formData.get('audio') as File;
      
      if (!audioFile) {
        const response = NextResponse.json(
          { 
            error: 'No audio file provided in FormData',
            instructions: 'Send FormData with "audio" file'
          },
          { status: 400 }
        );
        response.headers.set('Access-Control-Allow-Origin', '*');
        return response;
      }
      
      const bytes = await audioFile.arrayBuffer();
      audioBuffer = Buffer.from(bytes);
      mimeType = audioFile.type || 'audio/webm';
    } 
    // Check if it's JSON with base64 audio
    else if (contentType.includes('application/json')) {
      console.log('📄 JSON base64 audio detected');
      const body = await request.json();
      console.log('📦 Request body keys:', Object.keys(body));
      
      if (!body.audio) {
        const response = NextResponse.json(
          { 
            error: 'No audio data provided',
            instructions: 'Send either FormData with "audio" file or JSON with "audio" (base64) and "mimeType"'
          },
          { status: 400 }
        );
        response.headers.set('Access-Control-Allow-Origin', '*');
        return response;
      }
      
      audioBuffer = Buffer.from(body.audio, 'base64');
      mimeType = body.mimeType || 'audio/webm';
    }
    // No supported content type
    else {
      const response = NextResponse.json(
        { 
          error: 'Unsupported content type',
          instructions: 'Send either FormData with "audio" file or JSON with "audio" (base64) and "mimeType"'
        },
        { status: 400 }
      );
      response.headers.set('Access-Control-Allow-Origin', '*');
      return response;
    }

    // Get options from request body
    let options = {};
    if (contentType.includes('application/json')) {
      options = await request.json();
    } else {
      const formData = await request.formData();
      options = {
        model: formData.get('model'),
        language: formData.get('language'),
        temperature: formData.get('temperature')
      };
    }

    const { model = 'whisper-large-v3-turbo', language = 'en', temperature = 0.0 } = options as any;
    
    console.log('🎵 Processing audio:', {
      size: audioBuffer.length,
      mimeType: mimeType,
      model: model
    });
    
    const transcription = await groqHandler.transcribeAudio(
      audioBuffer,
      mimeType,
      {
        model,
        language,
        temperature: parseFloat(temperature as string)
      }
    );
    
    console.log('✅ TRANSCRIBE ENDPOINT: Transcription successful');
    
    const response = NextResponse.json({ 
      transcription,
      success: true,
      model,
      language
    });
    
    response.headers.set('Access-Control-Allow-Origin', '*');
    return response;
  } catch (error: any) {
    console.error('❌ TRANSCRIBE ENDPOINT: Error:', error);
    
    const response = NextResponse.json(
      { 
        error: 'Transcription failed',
        message: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
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