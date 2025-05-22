import { StockData, HistoricalData, StockRecommendation, FilterOptions, TechnicalIndicator, ManualStockInput } from '../types';
import { fetchStockData, fetchHistoricalData } from './apiService';
import * as technicalIndicators from '../utils/technicalIndicators';

/**
 * Analyzes a list of stock symbols and returns recommendations
 * @param symbols Array of stock symbols to analyze
 * @param filters User-selected filter options
 * @returns Array of stock recommendations with analysis
 */
export const analyzeStocks = async (
  symbols: string[],
  filters: FilterOptions
): Promise<StockRecommendation[]> => {
  try {
    // Fetch data for all symbols in parallel
    const stockPromises = symbols.map(symbol => fetchStockData(symbol));
    const stockDataResults = await Promise.all(stockPromises);

    // For each stock, fetch historical data and analyze
    const recommendationPromises = stockDataResults.map(async (stockData) => {
      // Get the appropriate range based on trade type
      const range = filters.tradeType === 'intraday' ? filters.timeRange : filters.dayRange;
      const interval = filters.tradeType === 'intraday' ? filters.timeRange : '1d';
      
      // Fetch historical data for technical analysis
      const historicalData = await fetchHistoricalData(stockData.symbol, range, interval);
      
      // Analyze the stock and generate recommendation
      const recommendation = analyzeStock(stockData, historicalData);
      
      return recommendation;
    });

    // Wait for all analyses to complete
    const recommendations = await Promise.all(recommendationPromises);
    
    // Sort recommendations by score (descending)
    return recommendations.sort((a, b) => b.score - a.score);
  } catch (error) {
    console.error('Error analyzing stocks:', error);
    throw new Error('Failed to analyze stocks. Please try again later.');
  }
};

/**
 * Analyzes manually entered stock data and generates a recommendation
 * @param manualData Manually entered stock data by the user
 * @returns Stock recommendation with technical analysis
 */
export const analyzeManualStockData = async (manualData: ManualStockInput): Promise<StockRecommendation> => {
  try {
    // Calculate price change and change percent from the provided data
    const change = manualData.price - manualData.previousClose;
    const changePercent = (change / manualData.previousClose) * 100;
    
    // Convert ManualStockInput to StockData format
    const stockData: StockData = {
      symbol: manualData.symbol,
      name: manualData.name,
      price: manualData.price,
      open: manualData.open,
      dayHigh: manualData.high,
      dayLow: manualData.low,
      previousClose: manualData.previousClose,
      volume: manualData.volume,
      change,
      changePercent,
    };
    
    // Generate historical data from the manual input
    const historicalData: HistoricalData[] = [];
    
    // If user provided historical prices, convert them to HistoricalData format
    if (manualData.historicalPrices && manualData.historicalPrices.length > 0) {
      manualData.historicalPrices.forEach(price => {
        // For each historical price point, create a full candle with estimated OHLC values
        // This is a simplification since the user only enters closing prices
        const close = price.price;
        // Estimate other values with small variations
        const open = close * (1 - 0.005 + Math.random() * 0.01);
        const high = Math.max(open, close) * (1 + Math.random() * 0.01);
        const low = Math.min(open, close) * (1 - Math.random() * 0.01);
        const volume = manualData.volume * (0.8 + Math.random() * 0.4); // Random volume based on current volume
        
        historicalData.push({
          date: price.date,
          open,
          high,
          low,
          close,
          volume: Math.floor(volume),
        });
      });
      
      // Sort historical data by date (oldest first)
      historicalData.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    }
    
    // Extract prices from historical data for technical analysis
    const prices = historicalData.map(data => data.close);
    
    // If we don't have enough historical data, add current price to the array for basic analysis
    if (prices.length < 5) {
      prices.push(manualData.price);
    }
    
    // Calculate technical indicators with consideration for trade type
    // For intraday, we might use more sensitive settings
    const indicators = calculateTechnicalIndicators(
      prices, 
      stockData, 
      historicalData,
      manualData.tradeType || 'delivery' // Default to delivery if not specified
    );
    
    // Calculate overall score and recommendation
    const score = calculateScore(indicators, stockData);
    const recommendation = getRecommendation(score);
    
    // Calculate volatility differently based on trade type
    const volatilityFactor = manualData.tradeType === 'intraday' ? 1.5 : 1.0;
    const volatility = calculateVolatility(prices) * volatilityFactor;
    
    // Adjust target price and stop loss based on trade type
    let targetPriceMultiplier = 2.0; // Default for delivery
    let stopLossMultiplier = 1.0; // Default for delivery
    
    if (manualData.tradeType === 'intraday') {
      targetPriceMultiplier = 1.0; // Smaller targets for intraday
      stopLossMultiplier = 0.7; // Tighter stop loss for intraday
    } else if (manualData.tradeType === 'swing') {
      targetPriceMultiplier = 2.5;
      stopLossMultiplier = 1.2;
    } else if (manualData.tradeType === 'longTerm') {
      targetPriceMultiplier = 3.0;
      stopLossMultiplier = 1.5;
    }
    
    const targetPrice = manualData.price * (1 + volatility * targetPriceMultiplier);
    const stopLoss = manualData.price * (1 - volatility * stopLossMultiplier);
    
    // Find strategies based on indicators
    const strategies: string[] = [];
    indicators.forEach(indicator => {
      if (indicator.signal?.toLowerCase().includes('buy') || 
          indicator.signal?.toLowerCase().includes('bullish')) {
        strategies.push(indicator.name);
      }
    });
    
    // Join strategies or use default
    const strategy = strategies.length > 0 
      ? strategies.join(', ') 
      : 'Custom analysis';
    
    // Calculate confidence level based on score
    const confidence = Math.round(score);
    
    // Return the complete recommendation with trade type and time frame
    return {
      stock: stockData,
      indicators,
      score,
      recommendation,
      historicalData,
      targetPrice,
      buyPrice: manualData.price,
      stopLoss,
      strategy,
      confidence,
      tradeType: manualData.tradeType || 'delivery', // Include selected trade type
      timeFrame: manualData.timeFrame || '1d' // Include selected time frame
    };
  } catch (error) {
    console.error('Error analyzing manual stock data:', error);
    throw new Error('Failed to analyze manual stock data. Please check your inputs and try again.');
  }
};

/**
 * Analyzes a single stock and generates a recommendation
 * @param stockData Current stock data
 * @param historicalData Historical price data 
 * @returns Stock recommendation with technical analysis
 */
const analyzeStock = (
  stockData: StockData,
  historicalData: HistoricalData[]
): StockRecommendation => {
  // Extract prices from historical data for analysis
  const prices = historicalData.map(data => data.close);
  
  // Calculate various technical indicators
  const indicators = calculateTechnicalIndicators(prices, stockData, historicalData);
  
  // Calculate overall recommendation score (0-100) based on indicators
  const score = calculateScore(indicators, stockData);
  
  // Determine recommendation based on score
  const recommendation = getRecommendation(score);
  
  // Calculate target price and stop loss (simplified)
  const currentPrice = stockData.price;
  const targetPrice = currentPrice * 1.1; // 10% profit target
  const stopLoss = currentPrice * 0.95; // 5% stop loss
  
  // Generate a basic strategy based on indicators
  const strategies: string[] = [];
  for (const indicator of indicators) {
    if (indicator.signal?.toLowerCase().includes('buy') || 
        indicator.signal?.toLowerCase().includes('bullish')) {
      strategies.push(indicator.name);
    }
  }
  
  const strategy = strategies.length > 0 
    ? strategies.join(', ') 
    : 'Momentum trading';
  
  // Calculate confidence level based on the score
  const confidence = Math.round(score);
  
  return {
    stock: stockData,
    indicators,
    score,
    recommendation,
    historicalData,
    targetPrice,
    buyPrice: currentPrice,
    stopLoss,
    strategy,
    confidence
  };
};

/**
 * Calculate technical indicators for a stock
 * @param prices Array of historical closing prices
 * @param stockData Current stock data
 * @param historicalData Historical price data
 * @returns Array of technical indicators with values and signals
 */
const calculateTechnicalIndicators = (
  prices: number[],
  stockData: StockData,
  historicalData: HistoricalData[],
  tradeType: 'intraday' | 'swing' | 'delivery' = 'delivery'
): TechnicalIndicator[] => {
  const indicators: TechnicalIndicator[] = [];
  
  // Only calculate indicators if we have enough price data
  if (prices.length <= 1) {
    return [
      {
        name: 'Insufficient Data',
        value: 'N/A',
        signal: 'Neutral',
        description: 'Not enough historical data to calculate indicators',
      }
    ];
  }
  
  // Current price
  const currentPrice = prices[prices.length - 1];
  
  try {
    // 1. Calculate Moving Averages
    // Simple Moving Average (SMA)
    const smaPeriod = tradeType === 'intraday' ? 10 : 20; // Shorter SMA for intraday
    const sma20 = calculateSMA(prices, smaPeriod);
    const sma50 = calculateSMA(prices, 50);
    
    // Add SMA indicators
    if (sma20) {
      const smaSignal = currentPrice > sma20 ? 'Bullish' : 'Bearish';
      indicators.push({
        name: 'SMA (20)',
        value: sma20.toFixed(2),
        signal: smaSignal,
        description: '20-day Simple Moving Average',
      });
    }
    
    if (sma50) {
      const smaSignal = currentPrice > sma50 ? 'Bullish' : 'Bearish';
      indicators.push({
        name: 'SMA (50)',
        value: sma50.toFixed(2),
        signal: smaSignal,
        description: '50-day Simple Moving Average',
      });
    }
    
    // 2. Calculate Relative Strength Index (RSI)
    const rsiPeriod = tradeType === 'intraday' ? 7 : 14; // Shorter RSI period for intraday
    const rsi = calculateRSI(prices, rsiPeriod);
    if (rsi) {
      let rsiSignal = 'Neutral';
      if (rsi > 70) {
        rsiSignal = 'Overbought (Sell)';
      } else if (rsi < 30) {
        rsiSignal = 'Oversold (Buy)';
      }
      
      indicators.push({
        name: 'RSI (14)',
        value: rsi.toFixed(2),
        signal: rsiSignal,
        description: 'Relative Strength Index - measures momentum',
      });
    }
    
    // 3. Calculate MACD
    const macd = calculateMACD(prices);
    if (macd && macd.MACD !== undefined && macd.signal !== undefined) {
      const macdSignal = macd.MACD > macd.signal ? 'Bullish' : 'Bearish';
      indicators.push({
        name: 'MACD',
        value: macd.MACD.toFixed(2),
        signal: macdSignal,
        description: 'Moving Average Convergence Divergence',
      });
    }
    
    // 4. Price relative to previous close
    const priceChangePercent = ((currentPrice - stockData.previousClose) / stockData.previousClose) * 100;
    indicators.push({
      name: 'Price Change',
      value: `${priceChangePercent.toFixed(2)}%`,
      signal: priceChangePercent > 0 ? 'Bullish' : 'Bearish',
      description: 'Percentage change from previous closing price',
    });
    
    // 5. Volume Analysis
    const averageVolume = prices.length > 5 ? 
      historicalData.slice(-5).reduce((sum, bar) => sum + bar.volume, 0) / 5 : 
      stockData.volume;
    
    const volumeSignal = stockData.volume > averageVolume ? 'High Volume' : 'Low Volume';
    indicators.push({
      name: 'Volume',
      value: stockData.volume.toLocaleString(),
      signal: volumeSignal,
      description: 'Trading volume compared to 5-day average',
    });
    
  } catch (error) {
    console.error('Error calculating indicators:', error);
    // Add a fallback indicator if calculations fail
    indicators.push({
      name: 'Calculation Error',
      value: 'Error',
      signal: 'Neutral',
      description: 'Error calculating technical indicators',
    });
  }
  
  return indicators;
};

/**
 * Calculate Simple Moving Average
 */
const calculateSMA = (prices: number[], period: number): number | null => {
  if (prices.length < period) return null;
  
  const sum = prices.slice(-period).reduce((total, price) => total + price, 0);
  return sum / period;
};

/**
 * Calculate Relative Strength Index
 */
const calculateRSI = (prices: number[], period: number): number | null => {
  if (prices.length <= period) return null;
  
  try {
    const rsiResult = technicalIndicators.rsi({ period, values: prices });
    return rsiResult[rsiResult.length - 1];
  } catch (error) {
    console.error('RSI calculation error:', error);
    return null;
  }
};

/**
 * Calculate MACD (Moving Average Convergence Divergence)
 */
const calculateMACD = (prices: number[]): { MACD?: number; signal?: number; histogram?: number } => {
  try {
    const macdResult = technicalIndicators.macd({
      values: prices,
      fastPeriod: 12,
      slowPeriod: 26,
      signalPeriod: 9,
      SimpleMAOscillator: false,
      SimpleMASignal: false
    });
    
    const lastMACD = macdResult[macdResult.length - 1];
    return lastMACD;
  } catch (error) {
    console.error('MACD calculation error:', error);
    return {};
  }
};

/**
 * Calculate overall recommendation score based on indicators
 */
const calculateScore = (indicators: TechnicalIndicator[], stockData: StockData): number => {
  let score = 50; // Start with neutral score
  
  // Count bullish and bearish signals
  const bullishSignals = indicators.filter(i => 
    i.signal?.toLowerCase().includes('bullish') || 
    i.signal?.toLowerCase().includes('buy')
  ).length;
  
  const bearishSignals = indicators.filter(i => 
    i.signal?.toLowerCase().includes('bearish') || 
    i.signal?.toLowerCase().includes('sell')
  ).length;
  
  // Adjust score based on signal counts
  score += (bullishSignals * 10);
  score -= (bearishSignals * 10);
  
  // Adjust for price momentum
  if (stockData.change > 0) {
    score += 5;
  } else {
    score -= 5;
  }
  
  // Cap score between 0-100
  return Math.max(0, Math.min(100, score));
};

/**
 * Determine recommendation based on score
 */
const getRecommendation = (score: number): 'Strong Buy' | 'Buy' | 'Hold' | 'Sell' | 'Strong Sell' => {
  if (score >= 80) return 'Strong Buy';
  if (score >= 60) return 'Buy';
  if (score >= 40) return 'Hold';
  if (score >= 20) return 'Sell';
  return 'Strong Sell';
};

/**
 * Calculate price volatility from an array of prices
 * @param prices Array of historical prices
 * @returns Volatility as a decimal (e.g., 0.05 for 5% volatility)
 */
const calculateVolatility = (prices: number[]): number => {
  if (prices.length < 2) return 0.05; // Default volatility of 5% if not enough data
  
  // Calculate daily returns
  const returns: number[] = [];
  for (let i = 1; i < prices.length; i++) {
    returns.push((prices[i] - prices[i - 1]) / prices[i - 1]);
  }
  
  // Calculate standard deviation of returns (volatility)
  const meanReturn = returns.reduce((sum, val) => sum + val, 0) / returns.length;
  const squaredDiffs = returns.map(r => Math.pow(r - meanReturn, 2));
  const variance = squaredDiffs.reduce((sum, val) => sum + val, 0) / squaredDiffs.length;
  const stdDev = Math.sqrt(variance);
  
  // Return volatility with minimum of 2% and maximum of 15%
  return Math.min(Math.max(stdDev, 0.02), 0.15);
};