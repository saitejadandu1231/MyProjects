// Stock data interfaces
export interface StockData {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  marketCap?: number;
  high52W?: number;
  low52W?: number;
  open: number;
  previousClose: number;
  dayHigh?: number;
  dayLow?: number;
}

// Historical price data
export interface HistoricalData {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

// Technical indicators
export interface TechnicalIndicator {
  name: string;
  value: string | number;
  signal?: string;
  trend?: 'bullish' | 'bearish' | 'neutral';
  description?: string;
}

// Stock recommendation with analysis
export interface StockRecommendation {
  stock: StockData;
  score: number;
  recommendation: 'Buy' | 'Sell' | 'Hold' | 'Strong Buy' | 'Strong Sell';
  indicators: TechnicalIndicator[];
  priceTarget?: {
    low: number;
    high: number;
  };
  historicalData?: HistoricalData[];
  targetPrice: number;
  buyPrice: number;
  stopLoss: number;
  strategy: string;
  confidence: number;
  tradeType?: 'intraday' | 'delivery' | 'swing' | 'longTerm';
  timeFrame?: string;
}

// Filter options for stock screening
export interface FilterOptions {
  tradeType: 'intraday' | 'delivery' | 'swing' | 'longTerm';
  timeRange: '1m' | '5m' | '15m' | '30m' | '1h' | '1d';
  dayRange: '1d' | '5d' | '1mo' | '3mo' | '6mo' | '1y' | '2y';
  riskTolerance: number;
  priceRange: [number, number];
  onlyProfitableStocks: boolean;
  highVolumeOnly: boolean;
  includeTechnicalAnalysis: boolean;
}

// Interface for manual stock data input
export interface ManualStockInput {
  symbol: string;
  name: string;
  price: number;
  open: number;
  high: number;
  low: number;
  previousClose: number;
  volume: number;
  lastUpdated: string; // Current timestamp
  historicalPrices?: {
    date: string;
    price: number;
  }[];
  tradeType?: 'intraday' | 'delivery' | 'swing' | 'longTerm';
  timeFrame?: string;
}

// Stock Context Type for React Context
export interface StockContextType {
  recommendations: StockRecommendation[];
  setRecommendations: (recommendations: StockRecommendation[]) => void;
  isLoading: boolean;
  setIsLoading: (isLoading: boolean) => void;
  error: string | null;
  setError: (error: string | null) => void;
  analyzeManualStock?: (data: ManualStockInput) => Promise<StockRecommendation>;
  useAI: boolean;
  setUseAI: (useAI: boolean) => void;
}

// MACD Indicator Interface for technical analysis
export interface MACDResult {
  MACD?: number;
  signal?: number;
  histogram?: number;
}

export interface MACDInput {
  values: number[];
  fastPeriod: number;
  slowPeriod: number;
  signalPeriod: number;
  SimpleMAOscillator: boolean;
  SimpleMASignal: boolean;
}