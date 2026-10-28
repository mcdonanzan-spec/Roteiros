
export interface ConstructionSite {
  razaoSocial: string;
  nomeObra: string;
  endereco: string;
  setor: string;
  cidade: string;
  estado: string;
  cep: string;
  lat?: number;
  lng?: number;
  macroRegion?: string;
  cityResolved?: string;
  isOutsideCapital?: boolean;
  distanceFromHubKm?: number;
}

export interface TransitLeg {
  type: 'walk' | 'metro' | 'bus' | 'transfer';
  icon: string;
  instruction: string;
  lineOrRoute?: string;
  durationMinutes: number;
}

export interface InterSiteTransfer {
  fromSite: string;
  toSite: string;
  distanceKm: number;
  metroOption: {
    title: string;
    totalMinutes: number;
    steps: string[];
    legs: TransitLeg[];
    advantageNote: string;
  };
  surfaceOption?: {
    title: string;
    durationMinutes: number;
    steps: string[];
    notes: string;
  };
  verdict: {
    recommendedMode: 'metro' | 'surface' | 'walk';
    title: string;
    explanation: string;
  };
  shortSummary: string;
}

export interface VisitDetail {
  siteName: string;
  metroLine?: string;
  busInfo?: string;
  walkingMinutes?: number;
  isFullTurn: boolean;
  transitForced?: boolean;
  originalWalkingMinutes?: number;
  interSiteTransfer?: InterSiteTransfer;
}

export interface Cluster {
  name: string;
  sites: string[];
  region: string;
  centerLat?: number;
  centerLng?: number;
  radiusKm?: number;
}

export interface DayRoute {
  day: string;
  visits: VisitDetail[];
  estimatedTravelTime: string;
  totalTime: string;
}

export interface MonthAgenda {
  week: number;
  schedule: { 
    Segunda: VisitDetail[];
    Terça: VisitDetail[];
    Quarta: VisitDetail[];
    Quinta: VisitDetail[];
    Sexta: VisitDetail[];
  };
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

export interface CalendarEvent {
  id: string;
  dateStr: string; // 'YYYY-MM-DD' ou 'DD/MM'
  title: string;
  type: 'company' | 'holiday' | 'meeting' | 'bridge';
  blockVisits: boolean;
  notes?: string;
}

export interface SchedulePreferences {
  availableDays: ('Segunda' | 'Terça' | 'Quarta' | 'Quinta' | 'Sexta')[];
  maxVisitsPerDay: 1 | 2 | 3;
  commuteNote?: string;
  housingPreference?: 'balanced' | 'office' | 'works';
  startDate?: string;
  customEvents?: CalendarEvent[];
}
