import Groq from 'groq-sdk';
import { AudioUtils } from './audio-utils';
import path from 'path';
import fs from 'fs';
import os from 'os';

interface ProcessRequest {
  action?: string;
  feature: string;
  query: string;
  pageInfo?: {
    title?: string;
    url?: string;
    selectedText?: string;
  };
  model?: string;
}

interface TranscriptionOptions {
  model?: string;
  prompt?: string;
  response_format?: string;
  language?: string;
  temperature?: number;
}

export class GroqHandler {
  private client: Groq;
  private defaultModel: string;

  constructor() {
    if (!process.env.GROQ_API_KEY) {
      throw new Error('GROQ_API_KEY environment variable is not set');
    }
    this.client = new Groq({ apiKey: process.env.GROQ_API_KEY });
    this.defaultModel = 'meta-llama/llama-4-maverick-17b-128e-instruct';
  }

  async processRequest(request: ProcessRequest) {
    const { feature, query, pageInfo, model } = request;
    
    const prompt = this.buildPrompt(feature, query, pageInfo);
    
    try {
      const completion = await this.client.chat.completions.create({
        messages: [
          { 
            role: 'system', 
            content: 'You are a helpful AI assistant that helps with web browsing tasks. Provide clear, concise, and accurate responses. Also, ensure to follow any specific instructions given by the user.'
          },
          { 
            role: 'user', 
            content: prompt 
          }
        ],
        model: model || this.defaultModel,
        temperature: 0.7,
        max_tokens: 2048,
        top_p: 1,
      });
      
      if (!completion.choices?.[0]?.message?.content) {
        throw new Error('No response content received from Groq API');
      }
      
      return { 
        response: completion.choices[0].message.content,
        model: completion.model,
        usage: completion.usage
      };
    } catch (error : unknown) {
      throw new Error(`Groq AI error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private buildPrompt(feature: string, query: string, pageInfo?: unknown): string {
    const basePrompt = `You are an AI assistant helping with web browsing tasks.`;
    const currentDate = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZoneName: 'short'
    });
    //@ts-expect-error - pageInfo typing
    const context = [`Current date and time: ${currentDate}`, pageInfo?.title && `Current page title: ${pageInfo.title}`, pageInfo?.url && `Current page URL: ${pageInfo.url}`, pageInfo?.selectedText && `Selected text: "${pageInfo.selectedText}"`].filter(Boolean).join('\n');
    
    let taskDescription = query;
    //@ts-expect-error - pageInfo typing
    if (pageInfo?.selectedText) {
      //@ts-expect-error - pageInfo typing
        const selectedContent = pageInfo.selectedText;
        
        switch (feature) {
          case 'explain':
            taskDescription = `Explain the following **selected text** in simple, easy-to-understand terms. Break down complex concepts and provide analogies.

            Selected Content: "${selectedContent}"

            User's specific request/query: ${query || 'General explanation.'}`;
            break;
          case 'summarize':
          case 'extract':
            taskDescription = `Perform the **${feature}** action specifically on the following **selected text**. If a user query is provided, use it to guide the output.

            Selected Content: "${selectedContent}"

            User's specific request/query: ${query || `General ${feature} request on selected content.`}`;
            break;
          default:
            taskDescription = `${query || 'General request'}. Context for your task is the following selected text: "${selectedContent}"`;
        }
    } else {
      const featurePrompts: { [key: string]: string } = {
        search: `Perform a web search for: ${query}. Provide a comprehensive answer with relevant details.`,
        explain: `Explain the following in detail: ${query}. Break down complex concepts and provide examples. (Based on full page content)`,
        ask: `Answer this question about the current page: ${query}`,
        summarize: `Provide a clear and concise summary of the current page. Focus on key points and main ideas.`,
        extract: `Extract and organize the key information from the current page. Present it in a structured format.`,
        reply: `Compose a professional and appropriate reply to: ${query}`
      };
      taskDescription = featurePrompts[feature] || query;
    }
    
    return [
        basePrompt,
        '\n## Context:',
        context, 
        '\n## Task:',
        taskDescription,
        '\n## Response Requirements:',
        '- Be clear and concise',
        '- Use markdown formatting when appropriate',
        '- Include relevant details and examples',
        '- If citing information, indicate the source',
        '- If the request is unclear or ambiguous, ask for clarification',
        '- If you cannot provide a complete answer, explain why and suggest next steps'
    ].filter(Boolean).join('\n');
  }

  async transcribeAudio(audioBuffer: Buffer, mimeType: string, options: TranscriptionOptions = {}) {
    try {
      if (!AudioUtils.validateAudioFormat(mimeType)) {
        throw new Error(`Unsupported audio format: ${mimeType}`);
      }

      const tempFilePath = path.join(os.tmpdir(), `audio-${Date.now()}.${this.getFfmpegFormat(mimeType)}`);
      console.log('Temporary file path for transcription:', tempFilePath);
      
      try {
        fs.writeFileSync(tempFilePath, audioBuffer);
        //@ts-expect-error - groq-sdk typing
        const transcription = await this.client.audio.transcriptions.create({ file: fs.createReadStream(tempFilePath) as unknown, model: options.model || "whisper-large-v3-turbo", prompt: options.prompt || "", response_format: options.response_format || "json", language: options.language || "en", temperature: options.temperature || 0.0
        });

        fs.unlinkSync(tempFilePath);
        return transcription.text;

      } catch (fileError) {
        if (fs.existsSync(tempFilePath)) {
          fs.unlinkSync(tempFilePath);
        }
        throw fileError;
      }

    } catch (error) {
      console.error('Groq transcription error:', error);
      //@ts-expect-error - error typing
      throw new Error(`Transcription failed: ${error.message}`);
    }
  }

  private getFfmpegFormat(mimeType: string): string {
    const formatMap: { [key: string]: string } = {
      'audio/webm': 'webm',
      'audio/mpeg': 'mp3',
      'audio/mp4': 'mp4',
      'audio/ogg': 'ogg',
      'audio/wav': 'wav'
    };
    
    return formatMap[mimeType] || 'wav';
  }

  getDemoResponse(feature: string, query: string): string {
    return `I'm sorry, I encountered an issue processing your request. Please check your API key and try again. (Feature: ${feature}, Query: ${query})`;
  }
}