import { Injectable } from '@angular/core';
import { Observable, BehaviorSubject } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import OpenAI from 'openai';

export interface VerseGenerationRequest {
  style: 'magyar' | 'latin' | 'greek' | 'modern';
  meter: string;
  rhymeScheme?: string;
  theme: string;
  length: number; // number of lines
  difficulty: 'beginner' | 'intermediate' | 'advanced';
}

export interface GeneratedVerse {
  text: string;
  analysis: {
    meter: string;
    rhymeScheme: string;
    syllablePattern: string;
    confidence: number;
  };
  explanations: {
    prosody: string;
    style: string;
    historical: string;
  };
}

export interface StyleAnalysisResult {
  period: string;
  author?: string;
  confidence: number;
  characteristics: {
    meter: string;
    vocabulary: string[];
    syntacticFeatures: string[];
    rhetoricalDevices: string[];
  };
  similarities: {
    author: string;
    work: string;
    similarity: number;
  }[];
}

export interface IntelligentSuggestion {
  type: 'correction' | 'improvement' | 'alternative' | 'historical';
  original: string;
  suggestion: string;
  explanation: string;
  confidence: number;
  category: 'meter' | 'rhyme' | 'vocabulary' | 'syntax' | 'style';
}

export interface ConversationContext {
  messages: Array<{
    role: 'user' | 'assistant' | 'system';
    content: string;
    timestamp: number;
  }>;
  topic: 'prosody' | 'meter' | 'history' | 'style' | 'general';
  language: 'hu' | 'en' | 'la';
}

@Injectable({
  providedIn: 'root'
})
export class AIFeaturesService {
  private openai: OpenAI | null = null;
  private isConfigured$ = new BehaviorSubject<boolean>(false);
  private conversationHistory = new Map<string, ConversationContext>();
  
  // Specialized prompts for different features
  private readonly SYSTEM_PROMPTS = {
    verseGeneration: `You are an expert in classical and Hungarian prosody. You create verses following specific metrical patterns and styles. Always provide accurate syllable lengths, proper caesuras, and authentic vocabulary for the requested period/style.`,
    
    styleAnalysis: `You are a literary scholar specializing in prosodic analysis and stylistic attribution. Analyze the given text for period, authorship clues, metrical patterns, vocabulary choices, and syntactic features. Provide confidence scores and similar works.`,
    
    prosodyExpert: `You are a prosody expert specializing in Hungarian, Latin, and Greek metrics. Explain complex prosodic concepts clearly, provide corrections with detailed explanations, and suggest improvements while maintaining historical authenticity.`,
    
    tutor: `You are a friendly and knowledgeable prosody tutor. Help users understand meter, syllable length, and versification through clear explanations, examples, and interactive guidance. Adapt your language to the user's level.`
  };

  constructor() {
    this.initializeOpenAI();
  }

  private initializeOpenAI(): void {
    // In production, API key should be stored securely (environment variables, backend proxy)
    const apiKey = this.getApiKey();
    
    if (apiKey) {
      this.openai = new OpenAI({
        apiKey: apiKey,
        dangerouslyAllowBrowser: true // Only for development
      });
      this.isConfigured$.next(true);
      console.log('🤖 OpenAI service initialized');
    } else {
      console.warn('⚠️ OpenAI API key not configured');
    }
  }

  private getApiKey(): string | null {
    // In production, this should come from a secure backend endpoint
    return localStorage.getItem('openai-api-key') || null;
  }

  public configureApiKey(apiKey: string): void {
    localStorage.setItem('openai-api-key', apiKey);
    this.initializeOpenAI();
  }

  // Verse Generation
  public async generateVerse(request: VerseGenerationRequest): Promise<GeneratedVerse> {
    if (!this.openai) {
      throw new Error('OpenAI not configured');
    }

    const prompt = this.buildVerseGenerationPrompt(request);
    
    try {
      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          { role: 'system', content: this.SYSTEM_PROMPTS.verseGeneration },
          { role: 'user', content: prompt }
        ],
        temperature: 0.8,
        max_tokens: 1000
      });

      const response = completion.choices[0]?.message?.content;
      if (!response) {
        throw new Error('No response from OpenAI');
      }

      return this.parseVerseGenerationResponse(response);
    } catch (error) {
      console.error('Verse generation failed:', error);
      throw error;
    }
  }

  private buildVerseGenerationPrompt(request: VerseGenerationRequest): string {
    return `
Create a ${request.length}-line verse in ${request.style} style with the following specifications:
- Meter: ${request.meter}
- Rhyme scheme: ${request.rhymeScheme || 'free'}
- Theme: ${request.theme}
- Difficulty level: ${request.difficulty}

Please provide:
1. The complete verse text
2. Detailed prosodic analysis (meter, syllable patterns)
3. Explanations of the prosodic choices
4. Historical/stylistic context

Format the response as JSON with fields: text, analysis, explanations.
    `.trim();
  }

  private parseVerseGenerationResponse(response: string): GeneratedVerse {
    try {
      const parsed = JSON.parse(response);
      return {
        text: parsed.text || 'Generation failed',
        analysis: {
          meter: parsed.analysis?.meter || 'Unknown',
          rhymeScheme: parsed.analysis?.rhymeScheme || 'Unknown',
          syllablePattern: parsed.analysis?.syllablePattern || 'Unknown',
          confidence: parsed.analysis?.confidence || 0.8
        },
        explanations: {
          prosody: parsed.explanations?.prosody || 'No explanation provided',
          style: parsed.explanations?.style || 'No style explanation',
          historical: parsed.explanations?.historical || 'No historical context'
        }
      };
    } catch {
      // Fallback parsing if JSON fails
      return {
        text: response,
        analysis: {
          meter: 'Generated',
          rhymeScheme: 'Various',
          syllablePattern: 'Complex',
          confidence: 0.7
        },
        explanations: {
          prosody: 'AI-generated verse following traditional patterns',
          style: 'Classical style with modern adaptation',
          historical: 'Based on traditional prosodic principles'
        }
      };
    }
  }

  // Style Analysis
  public async analyzeStyle(text: string): Promise<StyleAnalysisResult> {
    if (!this.openai) {
      throw new Error('OpenAI not configured');
    }

    const prompt = `
Analyze the following text for literary style, period, and possible authorship:

"${text}"

Please provide:
1. Historical period/era
2. Possible author or school (with confidence)
3. Metrical and stylistic characteristics
4. Vocabulary analysis
5. Similar works or authors

Format as JSON with fields: period, author, confidence, characteristics, similarities.
    `;

    try {
      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          { role: 'system', content: this.SYSTEM_PROMPTS.styleAnalysis },
          { role: 'user', content: prompt }
        ],
        temperature: 0.3,
        max_tokens: 800
      });

      const response = completion.choices[0]?.message?.content;
      if (!response) {
        throw new Error('No response from OpenAI');
      }

      return this.parseStyleAnalysisResponse(response);
    } catch (error) {
      console.error('Style analysis failed:', error);
      throw error;
    }
  }

  private parseStyleAnalysisResponse(response: string): StyleAnalysisResult {
    try {
      const parsed = JSON.parse(response);
      return {
        period: parsed.period || 'Unknown period',
        author: parsed.author,
        confidence: parsed.confidence || 0.5,
        characteristics: {
          meter: parsed.characteristics?.meter || 'Unknown',
          vocabulary: parsed.characteristics?.vocabulary || [],
          syntacticFeatures: parsed.characteristics?.syntacticFeatures || [],
          rhetoricalDevices: parsed.characteristics?.rhetoricalDevices || []
        },
        similarities: parsed.similarities || []
      };
    } catch {
      return {
        period: 'Classical or Modern',
        confidence: 0.6,
        characteristics: {
          meter: 'Various metrical patterns detected',
          vocabulary: ['classical', 'poetic'],
          syntacticFeatures: ['complex syntax'],
          rhetoricalDevices: ['metaphor', 'rhythm']
        },
        similarities: []
      };
    }
  }

  // Intelligent Suggestions
  public async getSuggestions(text: string, context: 'improvement' | 'correction' | 'alternatives'): Promise<IntelligentSuggestion[]> {
    if (!this.openai) {
      throw new Error('OpenAI not configured');
    }

    const prompt = `
Analyze this text for prosodic and stylistic ${context}:

"${text}"

Provide specific suggestions for:
- Metrical improvements
- Syllable length corrections
- Vocabulary alternatives
- Syntactic enhancements
- Stylistic refinements

Format as JSON array with fields: type, original, suggestion, explanation, confidence, category.
    `;

    try {
      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          { role: 'system', content: this.SYSTEM_PROMPTS.prosodyExpert },
          { role: 'user', content: prompt }
        ],
        temperature: 0.4,
        max_tokens: 1200
      });

      const response = completion.choices[0]?.message?.content;
      if (!response) {
        throw new Error('No response from OpenAI');
      }

      return this.parseSuggestionsResponse(response);
    } catch (error) {
      console.error('Suggestions generation failed:', error);
      throw error;
    }
  }

  private parseSuggestionsResponse(response: string): IntelligentSuggestion[] {
    try {
      const parsed = JSON.parse(response);
      return Array.isArray(parsed) ? parsed : [parsed];
    } catch {
      return [{
        type: 'improvement',
        original: 'Original text',
        suggestion: 'AI analysis available with proper configuration',
        explanation: 'Configure OpenAI API key for detailed suggestions',
        confidence: 0.8,
        category: 'general'
      }];
    }
  }

  // Interactive Prosody Tutor
  public async askProsodyQuestion(question: string, conversationId: string = 'default'): Promise<string> {
    if (!this.openai) {
      throw new Error('OpenAI not configured');
    }

    // Get or create conversation context
    let context = this.conversationHistory.get(conversationId);
    if (!context) {
      context = {
        messages: [],
        topic: 'general',
        language: 'hu'
      };
      this.conversationHistory.set(conversationId, context);
    }

    // Add user message to history
    context.messages.push({
      role: 'user',
      content: question,
      timestamp: Date.now()
    });

    // Build messages for API
    const messages = [
      { role: 'system' as const, content: this.SYSTEM_PROMPTS.tutor },
      ...context.messages.slice(-10).map(msg => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content
      }))
    ];

    try {
      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages,
        temperature: 0.6,
        max_tokens: 600
      });

      const response = completion.choices[0]?.message?.content || 'Sorry, I could not generate a response.';
      
      // Add assistant response to history
      context.messages.push({
        role: 'assistant',
        content: response,
        timestamp: Date.now()
      });

      // Limit conversation history
      if (context.messages.length > 20) {
        context.messages = context.messages.slice(-20);
      }

      return response;
    } catch (error) {
      console.error('Prosody question failed:', error);
      return 'I apologize, but I encountered an error. Please try asking your question again.';
    }
  }

  // Verse Completion and Collaboration
  public async completeVerse(partialVerse: string, style: string, meter: string): Promise<string> {
    if (!this.openai) {
      throw new Error('OpenAI not configured');
    }

    const prompt = `
Complete this partial verse while maintaining the established style and meter:

"${partialVerse}"

Style: ${style}
Meter: ${meter}

Continue naturally while preserving:
- The established metrical pattern
- Consistent style and vocabulary
- Logical thematic development
- Proper prosodic structure

Provide only the completion, no analysis.
    `;

    try {
      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          { role: 'system', content: this.SYSTEM_PROMPTS.verseGeneration },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 400
      });

      return completion.choices[0]?.message?.content || 'Unable to complete verse';
    } catch (error) {
      console.error('Verse completion failed:', error);
      throw error;
    }
  }

  // Educational Content Generation
  public async generateExercise(topic: string, difficulty: string): Promise<{
    exercise: string;
    solution: string;
    explanation: string;
  }> {
    if (!this.openai) {
      throw new Error('OpenAI not configured');
    }

    const prompt = `
Create a prosody exercise on ${topic} for ${difficulty} level students.

Provide:
1. A clear exercise with instructions
2. The correct solution
3. A detailed explanation of the prosodic principles

Format as JSON with fields: exercise, solution, explanation.
    `;

    try {
      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          { role: 'system', content: this.SYSTEM_PROMPTS.tutor },
          { role: 'user', content: prompt }
        ],
        temperature: 0.5,
        max_tokens: 800
      });

      const response = completion.choices[0]?.message?.content;
      if (!response) {
        throw new Error('No response from OpenAI');
      }

      try {
        return JSON.parse(response);
      } catch {
        return {
          exercise: response.split('\n')[0] || 'Exercise generation failed',
          solution: 'See generated content above',
          explanation: 'AI-generated exercise with prosodic focus'
        };
      }
    } catch (error) {
      console.error('Exercise generation failed:', error);
      throw error;
    }
  }

  // Batch Analysis
  public async analyzeBatch(texts: string[]): Promise<Array<{
    text: string;
    styleAnalysis: StyleAnalysisResult;
    suggestions: IntelligentSuggestion[];
  }>> {
    const results = [];
    
    for (const text of texts) {
      try {
        const [styleAnalysis, suggestions] = await Promise.all([
          this.analyzeStyle(text),
          this.getSuggestions(text, 'improvement')
        ]);
        
        results.push({
          text,
          styleAnalysis,
          suggestions
        });
      } catch (error) {
        console.error(`Batch analysis failed for text: ${text.substring(0, 50)}...`, error);
        results.push({
          text,
          styleAnalysis: {
            period: 'Unknown',
            confidence: 0,
            characteristics: {
              meter: 'Unknown',
              vocabulary: [],
              syntacticFeatures: [],
              rhetoricalDevices: []
            },
            similarities: []
          },
          suggestions: []
        });
      }
    }
    
    return results;
  }

  // Conversation Management
  public clearConversation(conversationId: string): void {
    this.conversationHistory.delete(conversationId);
  }

  public getConversationHistory(conversationId: string): ConversationContext | null {
    return this.conversationHistory.get(conversationId) || null;
  }

  // Status and Configuration
  public get isConfigured(): Observable<boolean> {
    return this.isConfigured$.asObservable();
  }

  public getUsageStats(): {
    conversationsActive: number;
    totalRequests: number;
    averageResponseTime: number;
  } {
    return {
      conversationsActive: this.conversationHistory.size,
      totalRequests: 0, // Would track in production
      averageResponseTime: 0 // Would track in production
    };
  }

  // Cleanup
  public dispose(): void {
    this.conversationHistory.clear();
    console.log('🧹 AI Features service disposed');
  }
}
