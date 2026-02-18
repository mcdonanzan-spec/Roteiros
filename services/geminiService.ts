
import { GoogleGenAI, Type } from "@google/genai";
import { ConstructionSite, AnalysisResult } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export async function analyzeLogistics(
  currentAddress: string,
  sites: ConstructionSite[]
): Promise<AnalysisResult> {
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: `
    Aja como um Agente Especialista em Logística Urbana de São Paulo (Metrô/CPTM).
    
    DADOS DE ENTRADA:
    Moradia: ${currentAddress}
    Obras: ${JSON.stringify(sites)}

    OBJETIVO PRINCIPAL:
    Criar uma agenda MENSAL (4 semanas). Cada obra deve ser visitada apenas 1 vez no mês.
    Distribua as visitas de forma equilibrada nos dias úteis, evitando acúmulo em uma só semana.

    REGRAS DE NEGÓCIO:
    1. DISTRIBUIÇÃO MENSAL: Não tente colocar todas as obras na primeira semana. Use as 4 semanas do mês.
    2. MODAL TRILHOS: Identifique a melhor linha de metrô/trem para cada obra.
    3. COMPLEXOS/PROXIMIDADE: Obras que são muito próximas (mesma rua ou bairro) devem ser visitadas no mesmo dia (máx 3-4 obras se forem um "complexo").
    4. CIDADES SATÉLITES: Obras em Mogi, Taboão, etc., devem ocupar um "Turno Integral" devido ao tempo de deslocamento.
    5. FORMATO DE ROTA (Referência): Inclua no campo 'estimatedTravelTime' a linha utilizada, ex: "45 min (Ida via Linha 1-Azul)".

    NOMES DAS OBRAS: Os nomes como "Rio São Francisco" ou "Rio Madeira" vêm da coluna 'Nome da Obra'. Utilize-os para identificar os destinos.
    `,
    config: {
      responseMimeType: "application/json",
      thinkingConfig: { thinkingBudget: 15000 },
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          diagnosis: { type: Type.STRING },
          currentEvaluation: {
            type: Type.OBJECT,
            properties: {
              distanceAvg: { type: Type.STRING },
              timeAvg: { type: Type.STRING },
              criticalRegions: { type: Type.ARRAY, items: { type: Type.STRING } },
              efficiency: { type: Type.STRING },
              efficiencyDescription: { type: Type.STRING }
            },
            required: ["distanceAvg", "timeAvg", "criticalRegions", "efficiency", "efficiencyDescription"]
          },
          housingRecommendation: {
            type: Type.OBJECT,
            properties: {
              topNeighborhoods: { type: Type.ARRAY, items: { type: Type.STRING } },
              centroidDescription: { type: Type.STRING },
              comparison: {
                type: Type.OBJECT,
                properties: {
                  currentAvgTime: { type: Type.STRING },
                  suggestedAvgTime: { type: Type.STRING },
                  monthlySavings: { type: Type.STRING }
                },
                required: ["currentAvgTime", "suggestedAvgTime", "monthlySavings"]
              }
            },
            required: ["topNeighborhoods", "centroidDescription", "comparison"]
          },
          clusters: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                sites: { type: Type.ARRAY, items: { type: Type.STRING } },
                region: { type: Type.STRING }
              },
              required: ["name", "sites", "region"]
            }
          },
          weeklyRoute: {
            type: Type.ARRAY,
            description: "Exemplo de uma semana típica (Padrão de Roteiro)",
            items: {
              type: Type.OBJECT,
              properties: {
                day: { type: Type.STRING },
                visits: { type: Type.ARRAY, items: { type: Type.STRING } },
                estimatedTravelTime: { type: Type.STRING },
                totalTime: { type: Type.STRING }
              },
              required: ["day", "visits", "estimatedTravelTime", "totalTime"]
            }
          },
          monthlyAgenda: {
            type: Type.ARRAY,
            description: "Distribuição completa das obras pelas 4 semanas",
            items: {
              type: Type.OBJECT,
              properties: {
                week: { type: Type.NUMBER },
                schedule: { type: Type.OBJECT }
              },
              required: ["week", "schedule"]
            }
          },
          timeSavingsSummary: { type: Type.STRING }
        },
        required: ["diagnosis", "currentEvaluation", "housingRecommendation", "clusters", "weeklyRoute", "monthlyAgenda", "timeSavingsSummary"]
      }
    },
  });

  return JSON.parse(response.text || "{}");
}
