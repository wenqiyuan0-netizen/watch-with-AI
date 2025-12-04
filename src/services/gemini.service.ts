import { Injectable } from '@angular/core';
import { GoogleGenAI, Chat, GenerateContentResponse } from '@google/genai';

@Injectable({
  providedIn: 'root'
})
export class GeminiService {
  private ai: GoogleGenAI;
  private chatSession: Chat | null = null;

  constructor() {
    // Initialize Gemini Client
    this.ai = new GoogleGenAI({ apiKey: process.env['API_KEY'] || '' });
  }

  // 1. Analyze Real Media File (Audio/Video)
  async generateTranscriptFromMedia(base64Data: string, mimeType: string): Promise<string> {
    try {
      const response: GenerateContentResponse = await this.ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: {
          parts: [
            {
              inlineData: {
                mimeType: mimeType,
                data: base64Data
              }
            },
            {
              text: `Please listen to this audio/video carefully and generate a detailed, verbatim transcript with timestamps.
              
              Rules:
              1. Format strictly as: [MM:SS] Spoken content...
              2. Capture all technical terms, instructions, and key details accurately.
              3. If there are distinct sections, ensure the flow is logical.
              4. Do not summarize; provide the full transcription content.
              `
            }
          ]
        }
      });
      return response.text || "No transcript generated.";
    } catch (error) {
      console.error('Gemini Transcription Error:', error);
      throw error;
    }
  }

  // 2. Chat with the context of the transcript
  startChat(transcript: string) {
    this.chatSession = this.ai.chats.create({
      model: 'gemini-2.5-flash',
      config: {
          systemInstruction: `You are BiliMind, an intelligent video knowledge assistant. 
          You will be provided with a video transcript below. 
          Your goal is to answer user questions based STRICTLY on the content of the transcript.
          
          CRITICAL RULES:
          1. If the answer is found in the text, you MUST cite the timestamp in the format [MM:SS] or [HH:MM:SS] immediately after the relevant sentence.
          2. If the user asks about a specific topic, locate the sections in the transcript and summarize them, including timestamps for where each point is discussed.
          3. If the answer is not in the transcript, politely state that the video does not cover that topic.
          4. Keep answers concise, professional, and helpful.
          5. Use formatting like bullet points for clarity if explaining multiple steps.

          TRANSCRIPT KNOWLEDGE BASE:
          ${transcript}
          `
      }
    });
  }

  async sendMessage(message: string): Promise<string> {
    if (!this.chatSession) {
      return "Please load a video first to start the chat.";
    }

    try {
      const result = await this.chatSession.sendMessage({ message });
      return result.text || "I couldn't generate a response.";
    } catch (error) {
      console.error('Gemini API Error:', error);
      return "I'm sorry, I encountered an error while analyzing the video content. Please check your API key or try again.";
    }
  }
}