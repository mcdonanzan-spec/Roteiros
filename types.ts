
export interface ConstructionSite {
  razaoSocial: string;
  nomeObra: string;
  endereco: string;
  setor: string;
  cidade: string;
  estado: string;
  cep: string;
}

export interface Cluster {
  name: string;
  sites: string[];
  region: string;
}

export interface DayRoute {
  day: string;
  visits: string[];
  estimatedTravelTime: string;
  totalTime: string;
}

export interface MonthAgenda {
  week: number;
  schedule: { [day: string]: string[] };
}

export interface AnalysisResult {
  diagnosis: string;
  currentEvaluation: {
    distanceAvg: string;
    timeAvg: string;
    criticalRegions: string[];
    efficiency: 'Alta' | 'Média' | 'Baixa';
    efficiencyDescription: string;
  };
  housingRecommendation: {
    topNeighborhoods: string[];
    centroidDescription: string;
    comparison: {
      currentAvgTime: string;
      suggestedAvgTime: string;
      monthlySavings: string;
    };
  };
  clusters: Cluster[];
  weeklyRoute: DayRoute[];
  monthlyAgenda: MonthAgenda[];
  timeSavingsSummary: string;
}
