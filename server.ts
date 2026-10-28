import express, { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = parseInt(process.env.PORT || '3000', 10);

app.use(express.json({ limit: '10mb' }));

// Shared Gemini client utility on the server
const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY || '';
const ai = new GoogleGenAI({
  apiKey,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

const analysisResponseSchema = {
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
        efficiencyDescription: { type: Type.STRING },
      },
      required: ['distanceAvg', 'timeAvg', 'criticalRegions', 'efficiency', 'efficiencyDescription'],
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
            monthlySavings: { type: Type.STRING },
          },
          required: ['currentAvgTime', 'suggestedAvgTime', 'monthlySavings'],
        },
      },
      required: ['topNeighborhoods', 'centroidDescription', 'comparison'],
    },
    clusters: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING },
          sites: { type: Type.ARRAY, items: { type: Type.STRING } },
          region: { type: Type.STRING },
        },
        required: ['name', 'sites', 'region'],
      },
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
                isFullTurn: { type: Type.BOOLEAN },
              },
              required: ['siteName', 'isFullTurn'],
            },
          },
          estimatedTravelTime: { type: Type.STRING },
          totalTime: { type: Type.STRING },
        },
        required: ['day', 'visits', 'estimatedTravelTime', 'totalTime'],
      },
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
              Segunda: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    siteName: { type: Type.STRING },
                    metroLine: { type: Type.STRING },
                    walkingMinutes: { type: Type.NUMBER },
                    busInfo: { type: Type.STRING },
                    isFullTurn: { type: Type.BOOLEAN },
                  },
                  required: ['siteName', 'isFullTurn'],
                },
              },
              Terça: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    siteName: { type: Type.STRING },
                    metroLine: { type: Type.STRING },
                    walkingMinutes: { type: Type.NUMBER },
                    busInfo: { type: Type.STRING },
                    isFullTurn: { type: Type.BOOLEAN },
                  },
                  required: ['siteName', 'isFullTurn'],
                },
              },
              Quarta: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    siteName: { type: Type.STRING },
                    metroLine: { type: Type.STRING },
                    walkingMinutes: { type: Type.NUMBER },
                    busInfo: { type: Type.STRING },
                    isFullTurn: { type: Type.BOOLEAN },
                  },
                  required: ['siteName', 'isFullTurn'],
                },
              },
              Quinta: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    siteName: { type: Type.STRING },
                    metroLine: { type: Type.STRING },
                    walkingMinutes: { type: Type.NUMBER },
                    busInfo: { type: Type.STRING },
                    isFullTurn: { type: Type.BOOLEAN },
                  },
                  required: ['siteName', 'isFullTurn'],
                },
              },
              Sexta: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    siteName: { type: Type.STRING },
                    metroLine: { type: Type.STRING },
                    walkingMinutes: { type: Type.NUMBER },
                    busInfo: { type: Type.STRING },
                    isFullTurn: { type: Type.BOOLEAN },
                  },
                  required: ['siteName', 'isFullTurn'],
                },
              },
            },
            required: ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta'],
          },
        },
        required: ['week', 'schedule'],
      },
    },
    timeSavingsSummary: { type: Type.STRING },
  },
  required: [
    'diagnosis',
    'currentEvaluation',
    'housingRecommendation',
    'clusters',
    'weeklyRoute',
    'monthlyAgenda',
    'timeSavingsSummary',
  ],
};

// Health check endpoint
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    hasApiKey: Boolean(apiKey),
    timestamp: new Date().toISOString(),
  });
});

// Proxy route for Gemini route optimization and logistics analysis
app.post('/api/gemini/analyze', async (req: Request, res: Response) => {
  try {
    const { prompt } = req.body;
    if (!prompt || typeof prompt !== 'string') {
      return res.status(400).json({ error: 'Campo "prompt" obrigatório.' });
    }

    if (!apiKey) {
      return res.status(500).json({ 
        error: 'Chave GEMINI_API_KEY não configurada no servidor.' 
      });
    }

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: analysisResponseSchema,
      },
    });

    const text = response.text || '{}';
    const parsed = JSON.parse(text);

    return res.json({ success: true, data: parsed });
  } catch (error: any) {
    console.error('Erro no servidor Gemini:', error);
    return res.status(500).json({
      success: false,
      error: error?.message || 'Falha ao processar análise via Gemini no servidor.',
    });
  }
});

// Mount Vite middleware in development or serve static build in production
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`Server listening on http://0.0.0.0:${port}`);
  });
}

startServer();
