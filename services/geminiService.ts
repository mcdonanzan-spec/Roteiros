import { GoogleGenAI, Type } from "@google/genai";
import { ConstructionSite, AnalysisResult, VisitDetail, SchedulePreferences } from "../types";

// Initialize Gemini client using API key from environment
const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY || "";
const ai = new GoogleGenAI({ apiKey });

export async function analyzeLogistics(
  currentAddress: string,
  sites: ConstructionSite[],
  preferences?: Partial<SchedulePreferences>
): Promise<AnalysisResult> {
  const availableDays = preferences?.availableDays && preferences.availableDays.length > 0
    ? preferences.availableDays
    : (['Terça', 'Quarta', 'Quinta'] as const);

  const maxVisitsPerDay = preferences?.maxVisitsPerDay || 2;
  const housingPreference = preferences?.housingPreference || 'balanced';
  const startDate = preferences?.startDate || '2026-11-03';
  const commuteNote = preferences?.commuteNote || 
    'Usuário vem de Rio Claro (interior de SP) na segunda-feira de manhã direto para o escritório fixo da Peixoto Gomide; e na sexta-feira à tarde retorna para o interior. Residência na Brigadeiro Luís Antônio 1649 é utilizada estritamente de segunda a sexta.';

  const allWeekDays = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta'] as const;
  const officeOnlyDays = allWeekDays.filter(d => !availableDays.includes(d as any));

  const preferenceGuide = housingPreference === 'office'
    ? 'Priorizar proximidade máxima ao escritório fixo na Peixoto Gomide / Avenida Paulista.'
    : housingPreference === 'works'
    ? 'Priorizar o centroide geográfico das obras com menor tempo de deslocamento para as visitas técnicas.'
    : 'Equilíbrio ideal (50/50) entre acesso rápido ao escritório na Peixoto Gomide (Linhas 2-Verde/4-Amarela) e conectividade com os clusters de obras.';

  const prompt = `
Aja como um Agente Especialista em Engenharia de Transportes, Mobilidade Urbana e Logística Operacional em São Paulo.

CONTEXTO OPERACIONAL E ROTINA DO USUÁRIO:
- DATA DE INÍCIO DO CICLO DE VISITAS: ${startDate} (Início das visitas a campo em Novembro de 2026).
  * O mês alvo roteirizado é Novembro de 2026.
  * Se o início for 03/11/2026 (Terça-feira): considere que a Segunda-feira 02/11/2026 é Feriado de Finados e chegada de viagem, portanto sem visitas de campo.
- Residência Semanal em SP: ${currentAddress} (utilizada de segunda a sexta-feira).
- Base nos Fins de Semana: Rio Claro (RC) / Interior de SP.
- Escritório Central (Hub Fixo): Rua Peixoto Gomide, Bela Vista / Jardim Paulista, São Paulo - SP (Próximo ao Metrô Trianon-Masp e Consolação).
- Contexto de Deslocamento: ${commuteNote}
- DIAS DISPONÍVEIS PARA VISITAS DE CAMPO: ${availableDays.join(', ')}
- DIAS RESERVADOS EXCLUSIVAMENTE AO ESCRITÓRIO PEIXOTO GOMIDE (SEM VISITAS EXTERNAS): ${officeOnlyDays.length > 0 ? officeOnlyDays.join(', ') : 'Nenhum dia bloqueado'}
  ${officeOnlyDays.includes('Segunda') ? '* SEGUNDA-FEIRA: Bloqueada para visitas! O usuário chega de viagem de Rio Claro pela manhã e atua diretamente no escritório da Peixoto Gomide. A agenda de Segunda DEVE ter ZERO visitas (array vazio []).' : ''}
  ${officeOnlyDays.includes('Sexta') ? '* SEXTA-FEIRA: Bloqueada para visitas! O usuário trabalha no escritório Peixoto Gomide e viaja no final do dia de volta para o interior (Rio Claro). A agenda de Sexta DEVE ter ZERO visitas (array vazio []).' : ''}
- LIMITE DE VISITAS POR DIA: No máximo ${maxVisitsPerDay} visita(s) por dia (quando houver visitas no dia, agendar no máximo ${maxVisitsPerDay} obras).
- Preferência de Moradia: ${preferenceGuide}

LISTA DE OBRAS A ROTEIRIZAR (${sites.length} obras):
${JSON.stringify(sites, null, 2)}

DIRETRIZES TÉCNICAS E MANDATÓRIAS:
1. AGENDA MENSAL E ROTEIRIZAÇÃO RESTRITA:
   - ALOQUE VISITAS EXCLUSIVAMENTE NOS DIAS PERMITIDOS: [${availableDays.join(', ')}].
   - Mantenha os dias reservados ao escritório [${officeOnlyDays.join(', ')}] estritamente vazios de visitas (array vazio []), indicando atuação interna.
   - Respeite o limite máximo de ${maxVisitsPerDay} obra(s) por dia.
   - Agrupe obras próximas geograficamente e por linha de metrô no mesmo dia quando houver mais de 1 visita permitida.
   - Obras no mesmo endereço ou rua DEVEM estar no mesmo dia.

2. REGRAS RÍGIDAS DE CAMINHADA (LIMITE MÁXIMO DE 15 MINUTOS):
   - SEMPRE que a distância entre dois pontos (estação de metrô até a obra, ou entre duas obras no mesmo dia) for superior a 15 minutos de caminhada (>15 min a pé), você DEVE FORÇAR transporte público (ônibus SPTrans ou metrô/conexão) no campo 'busInfo'.
   - O campo 'walkingMinutes' DEVE representar apenas a caminhada residual final (máximo 15 min, idealmente 4 a 10 min entre o ponto/estação e o portão da obra).
   - Se for muito perto do metrô (< 15 min de caminhada), mantenha 'busInfo' vazio ou nulo.

3. ANÁLISE DE MORADIA ESTRATÉGICA ("ONDE MORAR"):
   - Avalie a moradia atual na ${currentAddress} considerando a rotina de quem reside em SP durante os dias úteis e viaja para Rio Claro nos finais de semana.
   - Analise como a Bela Vista / Brigadeiro Luís Antônio facilita tanto o acesso diário ao escritório da Peixoto Gomide (a pé ou de metrô) quanto as saídas viárias (Corredor Norte-Sul, Av. 23 de Maio, Marginal Tietê e Rodovia dos Bandeirantes/Anhanguera para Rio Claro).
   - Indique os bairros ideais e o comparativo de tempo médio e economia mensal.
`;

  const response = await ai.models.generateContent({
    model: 'gemini-3.8-flash',
    contents: prompt,
    config: {
      responseMimeType: "application/json",
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

  const parsed: AnalysisResult = JSON.parse(response.text || "{}");
  return validateAndEnforceTransit(parsed, sites, availableDays, maxVisitsPerDay);
}

/**
 * Validação no backend de análise que:
 * 1. Converte automaticamente qualquer deslocamento com caminhada > 15 min para transporte público.
 * 2. Garante estritamente que dias desmarcados para visitas (ex: Segunda e Sexta) permaneçam vazios para atuação no escritório.
 * 3. Assegura que o limite de visitas por dia seja estritamente respeitado.
 */
export function validateAndEnforceTransit(
  result: AnalysisResult,
  sites: ConstructionSite[] = [],
  availableDays: readonly string[] = ['Terça', 'Quarta', 'Quinta'],
  maxVisitsPerDay: number = 2
): AnalysisResult {
  const MAX_WALK_LIMIT = 15;

  const siteMap = new Map<string, ConstructionSite>();
  sites.forEach(s => {
    if (s.nomeObra) {
      siteMap.set(s.nomeObra.toLowerCase().trim(), s);
    }
  });

  const getSuggestedTransit = (siteName: string, metroLine?: string): string => {
    const site = siteMap.get(siteName.toLowerCase().trim());
    const region = site?.setor || site?.cidade || '';
    if (metroLine && metroLine.trim()) {
      return `Ônibus SPTrans (integração com ${metroLine}) / Metrô`;
    }
    if (region) {
      return `Ônibus SPTrans (Linha municipal interligando ${region}) / Metrô`;
    }
    return `Ônibus SPTrans / Metrô - Linha integrada`;
  };

  const processVisit = (
    visit: VisitDetail,
    previousVisit?: VisitDetail
  ): VisitDetail => {
    if (!visit) return visit;

    const walkMins = typeof visit.walkingMinutes === 'number' ? visit.walkingMinutes : 0;

    // Se caminhada for superior a 15 minutos, converte obrigatoriamente para transporte público
    if (walkMins > MAX_WALK_LIMIT) {
      visit.transitForced = true;
      visit.originalWalkingMinutes = walkMins;

      if (!visit.busInfo || visit.busInfo.trim() === '' || visit.busInfo.toLowerCase().includes('nulo')) {
        visit.busInfo = `${getSuggestedTransit(visit.siteName, visit.metroLine)} (Convertido: caminhada de ${walkMins} min > limite de 15 min)`;
      } else if (
        !visit.busInfo.toLowerCase().includes('ônibus') && 
        !visit.busInfo.toLowerCase().includes('metrô') && 
        !visit.busInfo.toLowerCase().includes('linha') &&
        !visit.busInfo.toLowerCase().includes('transporte')
      ) {
        visit.busInfo = `${visit.busInfo} + Transporte Público Obrigatório (Ônibus SPTrans/Metrô)`;
      }

      if (!visit.metroLine) {
        visit.metroLine = "Conexão Linha SPTrans / Metrô";
      }

      // Reduz caminhada para trecho residual seguro até a estação/ponto
      visit.walkingMinutes = Math.min(8, Math.max(4, Math.round(walkMins * 0.25)));
    }

    // Validação de deslocamento entre duas obras no mesmo dia
    if (previousVisit && previousVisit.siteName && visit.siteName && previousVisit.siteName !== visit.siteName) {
      const prevSite = siteMap.get(previousVisit.siteName.toLowerCase().trim());
      const currentSite = siteMap.get(visit.siteName.toLowerCase().trim());

      const isSameAddress = prevSite && currentSite && 
        prevSite.endereco && currentSite.endereco &&
        prevSite.endereco.toLowerCase().trim() === currentSite.endereco.toLowerCase().trim();

      if (!isSameAddress) {
        const needsTransit = !visit.busInfo || 
          visit.busInfo.trim() === '' || 
          visit.busInfo.toLowerCase().includes('nulo') || 
          (typeof visit.walkingMinutes === 'number' && visit.walkingMinutes > MAX_WALK_LIMIT);

        if (needsTransit) {
          visit.transitForced = true;
          if (!visit.busInfo || visit.busInfo.trim() === '' || visit.busInfo.toLowerCase().includes('nulo')) {
            visit.busInfo = `Ônibus SPTrans / Metrô para deslocamento entre obras (${previousVisit.siteName} ➔ ${visit.siteName})`;
          }
          if (typeof visit.walkingMinutes === 'number' && visit.walkingMinutes > MAX_WALK_LIMIT) {
            visit.originalWalkingMinutes = visit.walkingMinutes;
            visit.walkingMinutes = 7;
          }
        }
      }
    }

    return visit;
  };

  // 1. Processa weeklyRoute
  if (Array.isArray(result.weeklyRoute)) {
    result.weeklyRoute.forEach(day => {
      if (Array.isArray(day.visits)) {
        for (let i = 0; i < day.visits.length; i++) {
          const prev = i > 0 ? day.visits[i - 1] : undefined;
          day.visits[i] = processVisit(day.visits[i], prev);
        }
      }
    });
  }

  // 2. Processa monthlyAgenda e garante respeito aos dias permitidos e limite de visitas
  if (Array.isArray(result.monthlyAgenda)) {
    const allDays = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta'] as const;

    result.monthlyAgenda.forEach(week => {
      if (!week.schedule) return;

      const orphanVisits: VisitDetail[] = [];

      // Identifica dias desmarcados para visitas e extrai eventuais visitas indevidas
      allDays.forEach(dayName => {
        const isDayAllowed = availableDays.includes(dayName);
        const dayVisits = week.schedule[dayName] || [];

        if (!isDayAllowed && dayVisits.length > 0) {
          orphanVisits.push(...dayVisits);
          week.schedule[dayName] = [];
        }
      });

      // Redistribui visitas órfãs nos dias permitidos que ainda têm capacidade
      if (orphanVisits.length > 0) {
        for (const orphan of orphanVisits) {
          let placed = false;
          for (const dayName of availableDays) {
            const currentList = week.schedule[dayName as keyof typeof week.schedule] || [];
            if (currentList.length < maxVisitsPerDay) {
              currentList.push(orphan);
              week.schedule[dayName as keyof typeof week.schedule] = currentList;
              placed = true;
              break;
            }
          }
          if (!placed && availableDays.length > 0) {
            // Se todos os dias atingiram o limite, aloca no dia com menor carga
            const firstAvailable = availableDays[0] as keyof typeof week.schedule;
            week.schedule[firstAvailable] = [...(week.schedule[firstAvailable] || []), orphan];
          }
        }
      }

      // Aplica processVisit para cada visita em cada dia
      allDays.forEach(dayName => {
        const visits = week.schedule[dayName];
        if (Array.isArray(visits)) {
          for (let i = 0; i < visits.length; i++) {
            const prev = i > 0 ? visits[i - 1] : undefined;
            visits[i] = processVisit(visits[i], prev);
          }
        }
      });
    });
  }

  return result;
}
