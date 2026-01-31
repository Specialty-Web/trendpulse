
export interface TrendData {
  keyword: string;
  volume: number;
  trend: 'up' | 'down' | 'stable';
  changePercentage: number;
  relevanceScore: number;
}

export interface MarketReport {
  profession: string;
  summary: string;
  topKeywords: TrendData[];
  sources: Array<{ title: string; uri: string }>;
  generatedAt: string;
}

export enum AppState {
  IDLE = 'IDLE',
  LOADING = 'LOADING',
  RESULTS = 'RESULTS',
  ERROR = 'ERROR'
}
