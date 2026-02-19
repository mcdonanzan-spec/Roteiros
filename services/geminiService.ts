
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
    Aja como um Agente Especialista em Logística Urbana e Engenheiro de Transportes de São Paulo.
    
    DADOS:
    Moradia: ${currentAddress}
    Obras: ${JSON.stringify(sites)}

    OBJETIVO:
    Crie um roteirizador completo. Para cada obra, identifique a melhor estação de Metrô/Trem e o tempo de caminhada.
    
    REGRAS DE ROTEIRIZAÇÃO:
    1. METRÔ: Identifique a linha principal (ex: L4 Amarela, L2 Verde, L9 Esmeralda).
    2. ÚLTIMA MILHA: Calcule o tempo de caminhada da estação mais próxima até a obra.
    3. ÔNIBUS: Se a obra for > 15min de caminhada do metrô, sugira conexão com ônibus/terminal.
    4. DISTRIBUIÇÃO: Distribua as obras em 4 semanas.

    ESTRUTURA DE RESPOSTA (JSON):
    - monthlyAgenda: Cada dia deve conter um array de objetos { siteName, metroLine, walkingMinutes, busInfo, isFullTurn }.
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
                visits: { 
                  type: Type.ARRAY, 
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      siteName: { type: Type.STRING },
                      metroLine: { type: Type.STRING },
                      walkingMinutes: { type: Type.NUMBER },
                      busInfo: { type: Type.STRING },
                      isFullTurn: { type: Type.BOOLEAN }
                    },
                    required: ["siteName", "isFullTurn"]
                  }
                },
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
                    Segunda: { type: Type.ARRAY, items: { 
                      type: Type.OBJECT,
                      properties: {
                        siteName: { type: Type.STRING },
                        metroLine: { type: Type.STRING },
                        walkingMinutes: { type: Type.NUMBER },
                        busInfo: { type: Type.STRING },
                        isFullTurn: { type: Type.BOOLEAN }
                      },
                      required: ["siteName", "isFullTurn"]
                    } },
                    Terça: { type: Type.ARRAY, items: { 
                      type: Type.OBJECT,
                      properties: {
                        siteName: { type: Type.STRING },
                        metroLine: { type: Type.STRING },
                        walkingMinutes: { type: Type.NUMBER },
                        busInfo: { type: Type.STRING },
                        isFullTurn: { type: Type.BOOLEAN }
                      },
                      required: ["siteName", "isFullTurn"]
                    } },
                    Quarta: { type: Type.ARRAY, items: { 
                      type: Type.OBJECT,
                      properties: {
                        siteName: { type: Type.STRING },
                        metroLine: { type: Type.STRING },
                        walkingMinutes: { type: Type.NUMBER },
                        busInfo: { type: Type.STRING },
                        isFullTurn: { type: Type.BOOLEAN }
                      },
                      required: ["siteName", "isFullTurn"]
                    } },
                    Quinta: { type: Type.ARRAY, items: { 
                      type: Type.OBJECT,
                      properties: {
                        siteName: { type: Type.STRING },
                        metroLine: { type: Type.STRING },
                        walkingMinutes: { type: Type.NUMBER },
                        busInfo: { type: Type.STRING },
                        isFullTurn: { type: Type.BOOLEAN }
                      },
                      required: ["siteName", "isFullTurn"]
                    } },
                    Sexta: { type: Type.ARRAY, items: { 
                      type: Type.OBJECT,
                      properties: {
                        siteName: { type: Type.STRING },
                        metroLine: { type: Type.STRING },
                        walkingMinutes: { type: Type.NUMBER },
                        busInfo: { type: Type.STRING },
                        isFullTurn: { type: Type.BOOLEAN }
                      },
                      required: ["siteName", "isFullTurn"]
                    } }
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
