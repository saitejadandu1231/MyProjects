/**
 * Simple technical indicators implementation for stock analysis
 */

interface RSIInput {
  values: number[];
  period: number;
}

interface MACDInput {
  values: number[];
  fastPeriod: number;
  slowPeriod: number;
  signalPeriod: number;
  SimpleMAOscillator: boolean;
  SimpleMASignal: boolean;
}

interface MACDResult {
  MACD: number;
  signal: number;
  histogram: number;
}

/**
 * Calculate Relative Strength Index
 * @param input RSI input parameters
 * @returns Array of RSI values corresponding to the input values
 */
export function rsi(input: RSIInput): number[] {
  const { values, period } = input;
  const result: number[] = [];
  
  if (values.length <= period) {
    return [50]; // Default value if not enough data
  }
  
  // First, calculate the price changes
  const changes: number[] = [];
  for (let i = 1; i < values.length; i++) {
    changes.push(values[i] - values[i - 1]);
  }
  
  // Calculate the first RSI
  let gains = 0;
  let losses = 0;
  
  // Initialize using first 'period' elements
  for (let i = 0; i < period; i++) {
    if (changes[i] > 0) {
      gains += changes[i];
    } else {
      losses -= changes[i];
    }
  }
  
  // To avoid division by zero
  if (losses === 0) {
    result.push(100);
  } else {
    const rs = gains / losses;
    result.push(100 - (100 / (1 + rs)));
  }
  
  // Calculate subsequent RSI values using smoothed averages
  let avgGain = gains / period;
  let avgLoss = losses / period;
  
  for (let i = period; i < changes.length; i++) {
    // Update average gain and loss
    if (changes[i] > 0) {
      avgGain = (avgGain * (period - 1) + changes[i]) / period;
      avgLoss = (avgLoss * (period - 1)) / period;
    } else {
      avgGain = (avgGain * (period - 1)) / period;
      avgLoss = (avgLoss * (period - 1) - changes[i]) / period;
    }
    
    // Calculate RSI
    if (avgLoss === 0) {
      result.push(100);
    } else {
      const rs = avgGain / avgLoss;
      result.push(100 - (100 / (1 + rs)));
    }
  }
  
  return result;
}

/**
 * Calculate Simple Moving Average
 * @param values Array of price values
 * @param period SMA period
 * @returns Array of SMA values
 */
export function sma(values: number[], period: number): number[] {
  const result: number[] = [];
  
  if (values.length < period) {
    return [];
  }
  
  // Calculate first SMA
  let sum = 0;
  for (let i = 0; i < period; i++) {
    sum += values[i];
  }
  
  result.push(sum / period);
  
  // Calculate subsequent SMAs
  for (let i = period; i < values.length; i++) {
    sum = sum - values[i - period] + values[i];
    result.push(sum / period);
  }
  
  return result;
}

/**
 * Calculate Exponential Moving Average
 * @param values Array of price values
 * @param period EMA period
 * @returns Array of EMA values
 */
export function ema(values: number[], period: number): number[] {
  const result: number[] = [];
  
  if (values.length < period) {
    return [];
  }
  
  // Calculate first EMA using SMA
  let sum = 0;
  for (let i = 0; i < period; i++) {
    sum += values[i];
  }
  
  const multiplier = 2 / (period + 1);
  let emaValue = sum / period;
  result.push(emaValue);
  
  // Calculate subsequent EMAs
  for (let i = period; i < values.length; i++) {
    emaValue = (values[i] - emaValue) * multiplier + emaValue;
    result.push(emaValue);
  }
  
  return result;
}

/**
 * Calculate MACD (Moving Average Convergence Divergence)
 * @param input MACD input parameters
 * @returns Array of MACD result objects
 */
export function macd(input: MACDInput): MACDResult[] {
  const { values, fastPeriod, slowPeriod, signalPeriod } = input;
  const result: MACDResult[] = [];
  
  if (values.length < Math.max(fastPeriod, slowPeriod) + signalPeriod) {
    return [{
      MACD: 0,
      signal: 0,
      histogram: 0
    }];
  }
  
  // Calculate EMAs
  const fastEMA = ema(values, fastPeriod);
  const slowEMA = ema(values, slowPeriod);
  
  // Calculate MACD line
  const macdLine: number[] = [];
  const startIdx = slowPeriod - fastPeriod; // Adjust for different lengths
  
  for (let i = 0; i < fastEMA.length; i++) {
    if (i + startIdx >= 0 && i < slowEMA.length) {
      macdLine.push(fastEMA[i + startIdx] - slowEMA[i]);
    }
  }
  
  // Calculate signal line (EMA of MACD line)
  const signalLine = ema(macdLine, signalPeriod);
  
  // Calculate histogram (MACD - signal)
  for (let i = 0; i < signalLine.length; i++) {
    result.push({
      MACD: macdLine[i + signalPeriod - 1],
      signal: signalLine[i],
      histogram: macdLine[i + signalPeriod - 1] - signalLine[i]
    });
  }
  
  return result;
}