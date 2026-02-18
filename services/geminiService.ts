
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

    OBJETIVO:
    Você deve criar uma agenda de visitas para o MÊS INTEIRO (4 semanas). 
    Existem ${sites.length} obras no total. 
    Cada obra deve ser visitada EXATAMENTE 1 vez no mês.

    REGRAS DE DISTRIBUIÇÃO:
    1. AGENDA MENSAL OBRIGATÓRIA: Distribua as ${sites.length} obras ao longo das 4 semanas na propriedade 'monthlyAgenda'.
    2. CARGA DE TRABALHO: Planeje cerca de 1 a 2 obras por dia útil, dependendo da proximidade.
    3. FOCO EM TRILHOS: Agrupe obras que usem a mesma linha de metrô/trem no mesmo dia ou semana.
    4. COMPLEXOS: Se houver obras no mesmo endereço ou rua, coloque-as no mesmo dia.
    5. NOMES: Use os nomes das obras (ex: "Rio São Francisco", "Rio Madeira") para preencher os dias.

    ESTRUTURA DO ROTEIRO:
    O 'weeklyRoute' deve ser apenas um exemplo detalhado da Semana 1.
    O 'monthlyAgenda' deve conter o planejamento COMPLETO de todas as obras fornecidas.
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
