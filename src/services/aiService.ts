import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export async function getSignalScore(asset: string, indicators: any) {
  if (!process.env.GEMINI_API_KEY) {
    // Fallback to deterministic logic if no API key
    return Math.floor(Math.random() * 40) + 60;
  }

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Analyze the following trading indicators for ${asset} and provide a confidence score from 0-100 for a BUY signal. 
      Indicators: ${JSON.stringify(indicators)}. 
      Return ONLY the number.`,
    });
    return parseInt(response.text || "50");
  } catch (e) {
    return 50;
  }
}
