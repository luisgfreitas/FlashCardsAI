import { GoogleGenAI, Type } from "@google/genai";
import { DifficultyLevel, Flashcard } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateFlashcards = async (
  topic: string,
  level: DifficultyLevel,
  count: number = 5
): Promise<Flashcard[]> => {
  
  const prompt = `
    Você é um professor especialista criando material de estudo avançado (Flashcards).
    
    Tópico: "${topic}"
    Nível de Dificuldade: "${level}"
    Quantidade: ${count} itens.
    
    Para cada item, gere:
    1. Uma pergunta clara e instigante.
    2. A resposta correta FORMATADA EM HTML.
    3. Um texto "Cloze": A resposta reescrita com a(s) palavra(s)-chave principal(is) substituída(s) por "______".
    
    --- DIRETRIZ DE FORMATAÇÃO DA RESPOSTA (CRÍTICO) ---
    O cérebro precisa escanear a resposta rapidamente. EVITE PAREDES DE TEXTO.
    Siga estritamente este padrão HTML na string 'answer':
    
    1. Cabeçalho Direto: Comece com a resposta principal em <b>Negrito</b>. Seja telegráfico (máx 5 palavras).
    2. Quebra: Use <br><br> para separar.
    3. Detalhes: Use lista <ul><li>...</li></ul> ou texto curto para explicar.
    4. Destaque: Use <b>negrito</b> em palavras-chave técnicas na explicação.
    
    Exemplo CORRETO de 'answer':
    "<b>Armazenamento Genético.</b><br><br><ul><li>Contém as <b>instruções</b> para o desenvolvimento.</li><li>Presente no <b>núcleo</b> celular.</li></ul>"
    
    Exemplo ERRADO:
    "O DNA é uma molécula que carrega as instruções genéticas..."
    -------------------------------------------------------

    Regras JSON:
    - Retorne APENAS o JSON.
    - O idioma deve ser Português (Brasil).
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              question: {
                type: Type.STRING,
                description: "A pergunta",
              },
              answer: {
                type: Type.STRING,
                description: "A resposta formatada em HTML (<b>, <br>, <ul>)",
              },
              cloze_text: {
                type: Type.STRING,
                description: "A resposta com palavras chave substituídas por ____",
              }
            },
            required: ["question", "answer", "cloze_text"],
          },
        },
      },
    });

    const jsonText = response.text;
    if (!jsonText) {
      throw new Error("No data returned from Gemini");
    }

    const data = JSON.parse(jsonText);
    
    // Add IDs to the cards
    return data.map((item: any, index: number) => ({
      id: `card-${Date.now()}-${index}`,
      topic: topic,
      question: item.question,
      answer: item.answer,
      clozeText: item.cloze_text,
      // Init SRS defaults
      repetition: 0,
      interval: 0,
      easeFactor: 2.5
    }));

  } catch (error) {
    console.error("Error generating flashcards:", error);
    throw error;
  }
};