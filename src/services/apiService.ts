import { StockData } from '../types';
import { fetchUpstoxInstruments, fetchUpstoxMarketQuote } from './upstoxService';

// Dynamically fetch all NSE symbols from Upstox
let upstoxInstrumentsCache: any[] = [];

/**
 * Map Indian stock symbols to Alpha Vantage format
 * @param symbol Stock symbol (e.g., RELIANCE.NS)
 * @returns Formatted symbol (e.g., NSE:RELIANCE)
 */
const formatIndianSymbol = (symbol: string): string => {
  if (symbol.endsWith('.NS')) {
    return `NSE:${symbol.replace('.NS', '')}`;
  } else if (symbol.endsWith('.BO')) {
    return `BSE:${symbol.replace('.BO', '')}`;
  }
  return symbol;
};

/**
 * Reformat Alpha Vantage symbol back to standard format
 * @param symbol Alpha Vantage format (e.g., NSE:RELIANCE)
 * @returns Standard format (e.g., RELIANCE.NS)
 */
const reformatToStandardSymbol = (symbol: string): string => {
  if (symbol.startsWith('NSE:')) {
    return `${symbol.replace('NSE:', '')}.NS`;
  } else if (symbol.startsWith('BSE:')) {
    return `${symbol.replace('BSE:', '')}.BO`;
  }
  return symbol;
};

/**
 * Fetch stock symbols from the Indian market
 */
export const getIndianStockSymbols = async (): Promise<string[]> => {
  const token = localStorage.getItem('upstox_token');
  if (!token) throw new Error('Upstox token not found. Please login.');
  if (upstoxInstrumentsCache.length === 0) {
    const data = await fetchUpstoxInstruments(token);
    upstoxInstrumentsCache = data.data;
  }
  // Return all NSE_EQ symbols in Upstox format (e.g., RELIANCE.NS)
  return upstoxInstrumentsCache.map(inst => inst.tradingsymbol + '.NS');
};

/**
 * Fetch current stock data for a given symbol using Alpha Vantage
 * @param symbol Stock ticker symbol
 * @returns Current stock data
 */
// Replace fetchStockData to use Upstox API for real-time data
export const fetchStockData = async (symbol: string): Promise<StockData> => {
  try {
    const token = localStorage.getItem('upstox_token');
    if (!token) throw new Error('Upstox token not found. Please login.');
    const instrumentKey = getUpstoxInstrumentKey(symbol);
    if (!instrumentKey) throw new Error('Instrument key not found for symbol: ' + symbol);
    const data = await fetchUpstoxMarketQuote(token, instrumentKey);
    const ltp = data.data[instrumentKey]?.ltp;
    const open = data.data[instrumentKey]?.ohlc.open;
    const high = data.data[instrumentKey]?.ohlc.high;
    const low = data.data[instrumentKey]?.ohlc.low;
    const close = data.data[instrumentKey]?.ohlc.close;
    const volume = data.data[instrumentKey]?.volume_traded_today;
    return {
      symbol,
      name: symbol,
      price: ltp,
      change: ltp - close,
      changePercent: ((ltp - close) / close) * 100,
      open,
      dayHigh: high,
      dayLow: low,
      previousClose: close,
      volume,
    };
  } catch (error) {
    console.error(`Error fetching Upstox data for ${symbol}:`, error);
    throw new Error(`Failed to fetch Upstox data for ${symbol}`);
  }
};

/**
 * Parse time interval string to minutes
 * @param interval Time interval string
 * @returns Minutes
 */
const parseTimeInterval = (interval: string): number => {
  const value = parseInt(interval);
  if (interval.includes('m')) {
    return value;
  } else if (interval.includes('h')) {
    return value * 60;
  } else if (interval.includes('d')) {
    return value * 60 * 24;
  }
  return 1; // Default to 1 minute
};

// Helper to get Upstox instrument key from symbol
export function getUpstoxInstrumentKey(symbol: string): string | undefined {
  // Find instrument key for a given symbol (e.g., RELIANCE.NS)
  const base = symbol.replace('.NS', '');
  const inst = upstoxInstrumentsCache.find(inst => inst.tradingsymbol === base);
  return inst?.instrument_key;
}