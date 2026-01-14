
import { GoogleGenerativeAI } from "@google/generative-ai";

export const analyzeSession = async (stats: { total: number, picked: number, rejected: number, orphans: number }) => {
  try {
    // Use a default empty API key for now - users can configure this later
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY || '';
    
    if (!apiKey) {
      console.warn('Gemini API key not configured. Set VITE_GEMINI_API_KEY environment variable.');
      return "Keep going! You're making great progress sorting through your shots.";
    }
    
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    
    const prompt = `You are a professional photography assistant. Analyze this session statistics: 
      Total Photos: ${stats.total}, Picked: ${stats.picked}, Rejected: ${stats.rejected}, Orphans: ${stats.orphans}.
      Provide a very short, encouraging 2-sentence summary about the selection progress.`;
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    return "Keep going! You're making great progress sorting through your shots.";
  }
};
