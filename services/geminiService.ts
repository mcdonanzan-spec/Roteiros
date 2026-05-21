
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
    
    CONTEXTO DO USUÁRIO:
    - Moradia Atual: ${currentAddress}
    - Escritório Fixo (Hub Diário): Rua Peixoto Gomide, Jardim Paulista/Bela Vista, SP (Próximo ao Metrô Trianon-Masp/Consolação).
    - Ciclo de Trabalho: 1 mês focado em visitas técnicas às obras e os 2 meses seguintes fixos no escritório da Peixoto Gomide.
    - Obras a Roteirizar: ${JSON.stringify(sites)}

    MISSÃO:
    1. ROTEIRO MENSAL: Organize as visitas para o "Mês Ativo", agrupando obras por proximidade geográfica e CEP.
    2. ANÁLISE DE MORADIA (HUB): A recomendação de moradia deve ser um "meio-termo" perfeito entre:
       a) Facilidade de acesso ao escritório na Peixoto Gomide (Linha 2-Verde / Linha 4-Amarela).
       b) Conectividade com os clusters de obras identificados.
    
    DIRETRIZES TÉCNICAS E DE TRANSPORTE RESTRITAS (MANDATÓRIAS):
    - REGRAS RÍGIDAS DE CAMINHADA (MÁXIMO 15 MINUTOS):
      * NENHUMA caminhada ou deslocamento a pé deve ultrapassar 15 minutos ('walkingMinutes' <= 15).
      * Se o trajeto a pé a partir do metrô/estação mais próxima, ou entre duas obras agendadas no mesmo dia (ex: de 'Teen Bumerangue' para 'Flow'), for superior a 15 minutos de caminhada real, você não deve atribuir apenas caminhada a pé!
      * É OBRIGATÓRIO recomendar transporte público (ônibus específico de SP, integração de metrô ou Uber) no campo 'busInfo' (ex: "Ônibus Municipal Linha XXXXX ou Uber") e limitar 'walkingMinutes' a no máximo 15 minutos (representando o tempo de caminhada final entre o ponto do veículo/estação e o destino).
      * No caso de obras curtas ou fáceis como 'Teen Bumerangue' que não necessitam de ônibus, liste apenas a caminhada dentro do limite ('walkingMinutes' <= 15) e mantenha 'busInfo' vazio ou nulo.
      * No caso de obras distantes e isoladas como 'Flow', use sempre transporte complementar com detalhes específicos em 'busInfo', garantindo que o usuário nunca tenha que caminhar longas distâncias (máximo de 15 minutos).
    - MESMO ENDEREÇO/PROXIMIDADE: Obras no mesmo local ou rua DEVEM estar no mesmo dia.
    - ÚLTIMA MILHA: Detalhe com precisão prática a mobilidade urbana de São Paulo (bilhete único, conexões, linhas de ônibus da SPTrans reais se possível).
    - DIAGNÓSTICO: Explique como a localização na Peixoto Gomide influencia a logística total do trimestre.

    ESTRUTURA DE RESPOSTA (JSON):
    - diagnosis: Análise estratégica considerando o ciclo 1/2 (Visita/Escritório).
    - housingRecommendation: Bairros que equilibram Peixoto Gomide + Obras.
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
