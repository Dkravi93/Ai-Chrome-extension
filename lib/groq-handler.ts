// lib/groq-handler.ts
import Groq from 'groq-sdk';
import { AudioUtils } from './audio-utils';
import fs from 'fs';
import os from 'os';
import path from 'path';

interface ProcessRequest {
  action?: string;
  feature: string;
  featurePrompt?: string;
  conversationHistory?: any[];
  query?: string;
  userQuery?: string;
  pageInfo?: any;
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
    const {
      action,
      feature,
      featurePrompt,
      conversationHistory,
      query,
      userQuery,
      pageInfo,
      model,
    } = request;

    // Use userQuery if available, otherwise fall back to query
    const finalQuery = userQuery || query;

    console.log('🔧 GROQ HANDLER: Processing request with full context', {
      feature: feature,
      query: finalQuery,
      hasConversationHistory: conversationHistory?.length > 0,
      historyLength: conversationHistory?.length,
      hasPageInfo: !!pageInfo,
      model: model,
    });

    // Build enhanced prompt with all available context
    const messages = this.buildEnhancedMessages(
      feature,
      finalQuery,
      pageInfo,
      conversationHistory,
      featurePrompt
    );

    try {
      const completion = await this.client.chat.completions.create({
        messages: messages,
        model: model || this.defaultModel,
        temperature: this.getTemperatureForFeature(feature),
        max_tokens: this.getMaxTokensForFeature(feature),
        top_p: 1,
      });

      if (!completion.choices?.[0]?.message?.content) {
        throw new Error('No response content received from Groq API');
      }

      console.log('✅ GROQ HANDLER: Response generated with enhanced context', {
        responseLength: completion.choices[0].message.content.length,
        model: completion.model,
        tokensUsed: completion.usage?.total_tokens,
      });

      return {
        response: completion.choices[0].message.content,
        model: completion.model,
        usage: completion.usage,
      };
    } catch (error: any) {
      console.error('❌ GROQ HANDLER: Error:', error);
      throw new Error(`Groq AI error: ${error.message}`);
    }
  }

  private buildEnhancedMessages(
    feature: string,
    query: string = '',
    pageInfo?: any,
    conversationHistory: any[] = [],
    featurePrompt?: string
  ) {
    const messages = [];
    const currentDate = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZoneName: 'short',
    });

    // 1. SYSTEM PROMPT with feature-specific instructions
    const systemPrompt = this.buildSystemPrompt(
      feature,
      featurePrompt,
      pageInfo,
      currentDate
    );
    messages.push({ role: 'system', content: systemPrompt });

    // 2. CONVERSATION HISTORY (maintains context across interactions)
    if (conversationHistory && conversationHistory.length > 0) {
      console.log(
        '📚 Including conversation history:',
        conversationHistory.length,
        'messages'
      );

      conversationHistory.forEach((msg) => {
        if (msg.content && msg.content.trim()) {
          messages.push({
            role: msg.type === 'user' ? 'user' : 'assistant',
            content: msg.content,
          });
        }
      });
    }

    // 3. CURRENT QUERY with rich context
    const userMessage = this.buildUserMessage(
      feature,
      query,
      pageInfo,
      currentDate
    );
    messages.push({ role: 'user', content: userMessage });

    console.log('💬 Final message structure:', {
      totalMessages: messages.length,
      systemPromptLength: systemPrompt.length,
      userMessageLength: userMessage.length,
      hasHistory: conversationHistory?.length > 0,
    });

    return messages;
  }

  private buildSystemPrompt(feature: string, featurePrompt?: string, pageInfo?: any, currentDate?: string) {
    const baseInstructions = [
      'You are a helpful AI assistant that helps with web browsing tasks.',
      `Current date and time: ${currentDate}`,
      'Provide clear, concise, and accurate responses.',
      'Use markdown formatting when appropriate for better readability.',
      'Be honest about the limitations of your knowledge.',
      'If you need more context, ask clarifying questions.',
    ];

    const featureSpecificInstructions: { [key: string]: string } = {
      search: 'Provide comprehensive, well-researched answers. Include relevant details and sources when possible.',
      explain: 'Break down complex concepts into simple, easy-to-understand terms. Use analogies and examples.',
      summarize: 'Focus on key points and main ideas. Be concise but comprehensive.',
      extract: 'Organize information in a structured format. Use tables, lists, or bullet points when helpful.',
      analyze: 'Provide critical analysis with balanced perspectives. Support your analysis with evidence.',
      reply: 'Craft professional, context-appropriate responses. Match the tone to the situation.',
      ask: 'Answer questions accurately based on the provided context. Cite specific parts of the content when relevant.',
      stt: 'Process spoken input naturally and contextually.',
    };

    const instructions = [
      ...baseInstructions,
      featureSpecificInstructions[feature] || featurePrompt,
      pageInfo?.title && `Current page: ${pageInfo.title}`,
      pageInfo?.contentType && `Content type: ${pageInfo.contentType}`,
    ].filter(Boolean);

    return instructions.join('\n');
  }

  private buildUserMessage(feature: string, query: string, pageInfo?: any, currentDate?: string) {
    const contextParts = [];
    
    console.log('📋 GROQ HANDLER: Building user message with pageInfo:', {
      hasPageInfo: !!pageInfo,
      title: pageInfo?.title,
      hasSelectedText: !!pageInfo?.selectedText,
      hasMainText: !!pageInfo?.mainText,
    });

    // Page context
    if (pageInfo) {
      contextParts.push(
        pageInfo.title && `Page Title: ${pageInfo.title}`,
        pageInfo.url && `Page URL: ${pageInfo.url}`,
        pageInfo.contentType && `Content Type: ${pageInfo.contentType}`,
        pageInfo.wordCount && `Content Length: ${pageInfo.wordCount} words`
      );
    }

    // Selected text (high priority)
    if (pageInfo?.selectedText) {
      const truncatedSelectedText = pageInfo.selectedText.substring(0, 2000);
      contextParts.push(`SELECTED TEXT:\n"${truncatedSelectedText}"`);
    }

    // Main content (truncated for token limits)
    if (pageInfo?.mainText) {
      const truncatedContent = pageInfo.mainText.substring(0, 6000);
      contextParts.push(`PAGE CONTENT:\n${truncatedContent}`);
    }

    const context = contextParts.filter(Boolean).join('\n\n');

    // Feature-specific task framing
    const taskFraming: { [key: string]: string } = {
      search: `Search and provide information about: ${query}`,
      explain: `Explain: ${query}`,
      summarize: `Summarize the content${query ? ` focusing on: ${query}` : ''}`,
      extract: `Extract key information${query ? ` related to: ${query}` : ''}`,
      analyze: `Analyze: ${query}`,
      reply: `Compose a reply: ${query}`,
      ask: `Answer: ${query}`,
      stt: `Process spoken input: ${query}`,
    };

    const task = taskFraming[feature] || query;

    return [context && `CONTEXT:\n${context}`, `TASK: ${task}`]
      .filter(Boolean)
      .join('\n\n');
  }

  private getTemperatureForFeature(feature: string): number {
    const temperatures: { [key: string]: number } = {
      search: 0.7,
      explain: 0.3,
      summarize: 0.2,
      extract: 0.1,
      analyze: 0.5,
      reply: 0.6,
      ask: 0.3,
      stt: 0.4,
    };
    return temperatures[feature] || 0.7;
  }

  private getMaxTokensForFeature(feature: string): number {
    const tokenLimits: { [key: string]: number } = {
      summarize: 1024,
      extract: 1024,
      reply: 512,
      explain: 2048,
      analyze: 2048,
      search: 2048,
      ask: 2048,
      stt: 1024,
    };
    return tokenLimits[feature] || 2048;
  }

  async transcribeAudio(audioBuffer: Buffer, mimeType: string, options: TranscriptionOptions = {}) {
    try {
      // Validate audio format
      if (!AudioUtils.validateAudioFormat(mimeType)) {
        throw new Error(`Unsupported audio format: ${mimeType}`);
      }

      const tempFilePath = path.join(
        os.tmpdir(),
        `audio-${Date.now()}.${this.getFfmpegFormat(mimeType)}`
      );
      
      console.log('Temporary file path for transcription:', tempFilePath);
      
      try {
        fs.writeFileSync(tempFilePath, audioBuffer);

        const transcription = await this.client.audio.transcriptions.create({
          file: fs.createReadStream(tempFilePath),
          model: options.model || 'whisper-large-v3-turbo',
          prompt: options.prompt || '',
          response_format: options.response_format || 'json',
          language: options.language || 'en',
          temperature: options.temperature || 0.0,
        });

        console.log('Transcription completed:', {
          text: transcription.text,
          duration: transcription.duration,
          language: transcription.language,
        });

        fs.unlinkSync(tempFilePath);
        return transcription.text;
      } catch (fileError: any) {
        if (fs.existsSync(tempFilePath)) {
          fs.unlinkSync(tempFilePath);
        }
        throw fileError;
      }
    } catch (error: any) {
      console.error('Groq transcription error:', error);
      throw new Error(`Transcription failed: ${error.message}`);
    }
  }

  private getFfmpegFormat(mimeType: string): string {
    const formatMap: { [key: string]: string } = {
      'audio/webm': 'webm',
      'audio/mpeg': 'mp3',
      'audio/mp4': 'mp4',
      'audio/ogg': 'ogg',
      'audio/wav': 'wav',
    };

    return formatMap[mimeType] || 'wav';
  }
}

// Export a singleton instance
export const groqHandler = new GroqHandler();