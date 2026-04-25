import { Injectable } from '@nestjs/common';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { AIAnalysis, CustomerProfile, Formula } from '@sadoo/types';
import { ConfigService } from '@nestjs/config';

interface GeminiResponse {
  candidates: { content: { parts: { text: string }[] } }[];
}

@Injectable()
export class AiService {
  private genAI: GoogleGenerativeAI;
  private model: any;

  constructor(private readonly configService: ConfigService) {
    this.genAI = new GoogleGenerativeAI(
      configService.get<string>('GEMINI_API_KEY'),
    );
    this.model = this.genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
  }

  async analyzeTranscript(
    transcript: string,
    customerProfile: CustomerProfile,
    formulas: Formula[],
  ): Promise<AIAnalysis> {
    const formulasContext = formulas
      .map(
        (f) =>
          `[${f.category.toUpperCase()}] ${f.content.uz} (Success: ${Math.round(
            f.successRate * 100,
          )}%)`,
      )
      .join('\n');

    const prompt = `
You are an AI call center copilot for a bank. Analyze the following conversation and provide real-time guidance.

Customer Profile:
- Needs: ${customerProfile.needs.join(', ') || 'None'}
- Product Interest: ${customerProfile.productInterest.join(', ') || 'None'}
- Mood: ${customerProfile.mood}
- Language: ${customerProfile.language}

Available Formulas:
${formulasContext}

Recent Transcript:
${transcript}

Analyze and respond with ONLY valid JSON in this exact format:
{
  "nextAction": "string (what to do next)",
  "suggestedScript": "string (exact words to say)",
  "toneAdvice": "string (how to sound)",
  "objectionDetected": false,
  "objectionResponse": "string (if objection detected)",
  "recommendedProduct": "string or null",
  "sentiment": "positive|neutral|negative",
  "salesStage": "greeting|discovery|pitch|objection|closing|complete",
  "confidence": 0.0-1.0
}

Respond with only the JSON object, no formatting.
`;

    try {
      const result = await this.model.generateContent(prompt);
      const text = result.response.text();

      // Extract JSON from response (handle markdown code blocks)
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }

      const json = JSON.parse(jsonMatch[0]);
      return json as AIAnalysis;
    } catch (error) {
      console.error('Gemini API error:', error);
      return this.getFallbackAnalysis();
    }
  }

  async buildCustomerProfile(
    chatHistory: string,
    customerName: string,
  ): Promise<CustomerProfile> {
    const prompt = `
Analyze this customer conversation and build a profile.

Customer: ${customerName}
Chat History:
${chatHistory}

Respond with ONLY valid JSON in this exact format:
{
  "needs": ["string"],
  "productInterest": ["string"],
  "mood": "positive|neutral|negative",
  "summary": "string (brief summary)",
  "keywords": ["string"],
  "estimatedValue": number,
  "language": "uz|ru|en"
}
`;

    try {
      const result = await this.model.generateContent(prompt);
      const text = result.response.text();
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }

      return JSON.parse(jsonMatch[0]) as CustomerProfile;
    } catch (error) {
      console.error('Profile generation error:', error);
      return {
        needs: [],
        productInterest: [],
        mood: 'neutral',
        summary: 'Unable to analyze profile',
        keywords: [],
        estimatedValue: 0,
        language: 'uz',
      };
    }
  }

  async generateCustomerMemorySummary(
    callTranscript: string,
    previousMemory: string,
  ): Promise<string> {
    const prompt = `
Based on this call transcript and previous memory, generate a concise summary for the customer's profile.

Previous Memory:
${previousMemory || 'None'}

Call Transcript:
${callTranscript}

Create a 2-3 sentence summary highlighting key points, products discussed, and outcome.
`;

    try {
      const result = await this.model.generateContent(prompt);
      return result.response.text();
    } catch (error) {
      console.error('Memory generation error:', error);
      return 'Summary could not be generated';
    }
  }

  private getFallbackAnalysis(): AIAnalysis {
    return {
      nextAction: 'Continue discovery phase',
      suggestedScript: 'Could you tell me more about your requirements?',
      toneAdvice: 'Be empathetic and attentive',
      objectionDetected: false,
      objectionResponse: '',
      recommendedProduct: null,
      sentiment: 'neutral',
      salesStage: 'discovery',
      confidence: 0.5,
    };
  }
}
