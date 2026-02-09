
import { GoogleGenAI } from "@google/genai";

// Always use the direct process.env.API_KEY for initialization as per guidelines
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateNoteSummary = async (notes: string[]): Promise<string> => {
  if (notes.length === 0) return "Keine Notizen vorhanden.";
  
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Fasse die folgenden Aktenvermerke eines CRM-Systems kurz und prägnant zusammen: \n\n${notes.join('\n--- \n')}`,
      config: {
        systemInstruction: "Du bist ein professioneller Assistent für einen Sachverständigen. Erstelle eine sachliche Zusammenfassung der wichtigsten Punkte.",
        temperature: 0.7,
      }
    });
    // The .text property is used directly as per guidelines (not a method)
    return response.text || "Zusammenfassung konnte nicht erstellt werden.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Fehler bei der Zusammenfassung.";
  }
};

export const suggestTextSnippets = async (title: string): Promise<string[]> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Erstelle 3 kurze Textbausteine für einen Aktenvermerk zum Thema: "${title}". Gib nur die Bausteine als Liste zurück.`,
      config: {
        systemInstruction: "Antworte als hilfreicher CRM-Assistent. Gib nur ein JSON Array mit Strings zurück.",
        responseMimeType: "application/json",
      }
    });
    // The .text property is used directly as per guidelines (not a method)
    return JSON.parse(response.text || "[]");
  } catch (error) {
    return ["Termin wahrgenommen", "Unterlagen erhalten", "Rückruf erbeten"];
  }
};
