
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
    Aja como um Agente Especialista em Logística Urbana de São Paulo, focado estritamente no sistema de METRÔ e TREM (CPTM).
    
    DADOS DE ENTRADA:
    Moradia Atual: ${currentAddress}
    Obras para Visita: ${JSON.stringify(sites)}

    OBJETIVO ESTRATÉGICO:
    1. PRIORIDADE METRÔ: Todas as rotas e cálculos devem priorizar o transporte sobre trilhos. 
    2. AGENDA MENSAL: Distribua as ${sites.length} obras ao longo de 4 semanas (20-22 dias úteis).
    3. VISITA ÚNICA: Cada obra deve ser visitada 1 vez por mês.
    4. CLUSTERIZAÇÃO POR LINHA: Agrupe visitas que utilizem a mesma linha (ex: Linha 4-Amarela, Linha 9-Esmeralda) para otimizar o tempo de baldeação.
    5. TEMPOS: Inclua o tempo de caminhada até a estação e da estação até a obra. Se a obra for distante do metrô, marque como 'Turno Integral'.

    NOMES DAS OBRAS: Use os nomes reais da planilha (ex: "Rio São Francisco", "Rio Madeira") como o destino principal.

    RETORNO:
    Preencha obrigatoriamente a 'monthlyAgenda' com TODAS as obras fornecidas.
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
            items: {
              type: Type.OBJECT,
              properties: {
                week: { type: Type.NUMBER },
                schedule: { 
                  type: Type.OBJECT,
                  properties: {
                    Segunda: { type: Type.ARRAY, items: { type: Type.STRING } },
                    Terça: { type: Type.ARRAY, items: { type: Type.STRING } },
                    Quarta: { type: Type.ARRAY, items: { type: Type.STRING } },
                    Quinta: { type: Type.ARRAY, items: { type: Type.STRING } },
                    Sexta: { type: Type.ARRAY, items: { type: Type.STRING } }
                  },
                  required: ["Segunda", "Terça", "Quarta", "Quinta", "Sexta"]
                }
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
