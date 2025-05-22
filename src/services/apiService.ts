import { StockData, HistoricalData } from '../types';

// Alpha Vantage API configuration
const ALPHA_VANTAGE_API_KEY = '6XMY7EX85IT8BVVH'; // Replace with your Alpha Vantage API key
const ALPHA_VANTAGE_BASE_URL = 'https://www.alphavantage.co/query';

/**
 * Search for stock symbols using Alpha Vantage API
 * @param query Search term
 * @returns Promise with array of symbols and names
 */
const searchSymbols = async (query: string): Promise<{symbol: string, name: string}[]> => {
  try {
    const url = `${ALPHA_VANTAGE_BASE_URL}?function=SYMBOL_SEARCH&keywords=${encodeURIComponent(query)}&apikey=${ALPHA_VANTAGE_API_KEY}`;
    const response = await fetch(url);
    
    if (!response.ok) throw new Error(`Search request failed: ${response.status}`);
    
    const data = await response.json();
    
    if (!data.bestMatches || !Array.isArray(data.bestMatches)) {
      throw new Error('Invalid response format from Alpha Vantage API');
    }
    
    return data.bestMatches.map(match => ({
      symbol: match['1. symbol'],
      name: match['2. name']
    }));
  } catch (error) {
    console.error(`Error searching for symbols: ${error}`);
    return [];
  }
};

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
  try {
    // Define top Indian companies to search for
    const searchTerms = ['reliance', 'tata', 'hdfc', 'infosys', 'icici', 'wipro'];
    const searchPromises = searchTerms.map(term => searchSymbols(`${term} NSE`));
    const searchResults = await Promise.all(searchPromises);
    
    // Flatten and filter results
    const results: {symbol: string, name: string}[] = [];
    searchResults.forEach(result => {
      result.forEach(item => {
        // Only add Indian stock symbols
        if (item.symbol.includes('NSE:') || item.symbol.includes('BSE:') || 
            item.name.toLowerCase().includes('india')) {
          results.push({
            symbol: reformatToStandardSymbol(item.symbol),
            name: item.name
          });
        }
      });
    });
    
    // Deduplicate by symbol
    const uniqueResults = Array.from(
      new Map(results.map(item => [item.symbol, item])).values()
    );
    
    const symbols = uniqueResults.map(item => item.symbol);
    
    // If we couldn't find any symbols, throw an error
    if (symbols.length === 0) {
      throw new Error('No stock symbols found. API may be unavailable.');
    }
    
    return symbols;
  } catch (error) {
    console.error('Error fetching stock symbols:', error);
    throw new Error('Failed to fetch stock symbols. Please try again later.');
  }
};

/**
 * Fetch company name for a symbol
 */
const fetchCompanyName = async (symbol: string): Promise<string> => {
  try {
    const formattedSymbol = formatIndianSymbol(symbol);
    const url = `${ALPHA_VANTAGE_BASE_URL}?function=OVERVIEW&symbol=${encodeURIComponent(formattedSymbol)}&apikey=${ALPHA_VANTAGE_API_KEY}`;
    const response = await fetch(url);
    
    if (!response.ok) throw new Error(`Company info request failed: ${response.status}`);
    
    const data = await response.json();
    
    if (data.Name) {
      return data.Name;
    }
    
    // If we couldn't get the name, try search
    const searchResult = await searchSymbols(symbol.replace(/\.[A-Z]+$/, ''));
    const match = searchResult.find(item => 
      reformatToStandardSymbol(item.symbol) === symbol || 
      item.symbol === symbol
    );
    
    return match?.name || symbol.replace(/\.[A-Z]+$/, '');
  } catch (error) {
    // If all else fails, just clean up the symbol and use that as the name
    return symbol.replace(/\.[A-Z]+$/, '');
  }
};

/**
 * Fetch current stock data for a given symbol using Alpha Vantage
 * @param symbol Stock ticker symbol
 * @returns Current stock data
 */
export const fetchStockData = async (symbol: string): Promise<StockData> => {
  try {
    const formattedSymbol = formatIndianSymbol(symbol);
    
    // Get quote data
    const quoteUrl = `${ALPHA_VANTAGE_BASE_URL}?function=GLOBAL_QUOTE&symbol=${encodeURIComponent(formattedSymbol)}&apikey=${ALPHA_VANTAGE_API_KEY}`;
    const quoteResponse = await fetch(quoteUrl);
    
    if (!quoteResponse.ok) {
      throw new Error(`API request failed with status ${quoteResponse.status}`);
    }
    
    const quoteData = await quoteResponse.json();
    
    // Check if we got valid data
    if (!quoteData['Global Quote'] || Object.keys(quoteData['Global Quote']).length === 0) {
      throw new Error('No data available for this stock symbol');
    }
    
    const quote = quoteData['Global Quote'];
    
    // Get overview data for additional information (like market cap)
    const overviewUrl = `${ALPHA_VANTAGE_BASE_URL}?function=OVERVIEW&symbol=${encodeURIComponent(formattedSymbol)}&apikey=${ALPHA_VANTAGE_API_KEY}`;
    const overviewResponse = await fetch(overviewUrl);
    let overviewData = {};
    
    if (overviewResponse.ok) {
      overviewData = await overviewResponse.json();
    }
    
    // Get company name
    const name = await fetchCompanyName(symbol);
    
    const price = parseFloat(quote['05. price']);
    const previousClose = parseFloat(quote['08. previous close']);
    const open = parseFloat(quote['02. open']);
    const high = parseFloat(quote['03. high']);
    const low = parseFloat(quote['04. low']);
    const volume = parseInt(quote['06. volume']);
    const change = price - previousClose;
    const changePercent = parseFloat(quote['10. change percent'].replace('%', ''));
    
    return {
      symbol,
      name,
      price,
      change,
      changePercent,
      open,
      dayHigh: high,
      dayLow: low,
      previousClose,
      volume,
      marketCap: overviewData['MarketCapitalization'] ? parseInt(overviewData['MarketCapitalization']) : undefined,
      high52W: overviewData['52WeekHigh'] ? parseFloat(overviewData['52WeekHigh']) : undefined,
      low52W: overviewData['52WeekLow'] ? parseFloat(overviewData['52WeekLow']) : undefined,
    };
  } catch (error) {
    console.error(`Error fetching stock data for ${symbol}:`, error);
    throw new Error(`Failed to fetch data for ${symbol}: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

/**
 * Fetch historical stock data from Alpha Vantage
 * @param symbol Stock ticker symbol
 * @param range Time range
 * @param interval Time interval
 * @returns Array of historical price data points
 */
export const fetchHistoricalData = async (
  symbol: string,
  range: string,
  interval: string
): Promise<HistoricalData[]> => {
  try {
    const formattedSymbol = formatIndianSymbol(symbol);
    
    // Determine Alpha Vantage function based on interval
    let alphaVantageFunction: string;
    let outputSize = 'compact'; // Default to 100 data points
    
    if (interval.includes('m')) {
      // Intraday data
      alphaVantageFunction = 'TIME_SERIES_INTRADAY';
      
      // Convert interval to Alpha Vantage format
      const minutes = parseInt(interval);
      const validIntervals = [1, 5, 15, 30, 60];
      const closestInterval = validIntervals.reduce((prev, curr) => 
        Math.abs(curr - minutes) < Math.abs(prev - minutes) ? curr : prev
      );
      
      interval = `${closestInterval}min`;
      
      // For longer ranges, use full output
      if (parseInt(range) > 10) {
        outputSize = 'full';
      }
    } else if (interval === '1d' || interval === 'daily') {
      // Daily data
      alphaVantageFunction = 'TIME_SERIES_DAILY';
      interval = 'Daily';
      
      // For longer ranges, use full output
      if (range.includes('mo') || range.includes('y')) {
        outputSize = 'full';
      }
    } else if (interval === 'weekly' || interval === '1w') {
      alphaVantageFunction = 'TIME_SERIES_WEEKLY';
      interval = 'Weekly';
    } else {
      // Default to daily
      alphaVantageFunction = 'TIME_SERIES_DAILY';
      interval = 'Daily';
    }
    
    // Build API URL
    let url = `${ALPHA_VANTAGE_BASE_URL}?function=${alphaVantageFunction}&symbol=${encodeURIComponent(formattedSymbol)}`;
    
    // Add interval for intraday data
    if (alphaVantageFunction === 'TIME_SERIES_INTRADAY') {
      url += `&interval=${interval}`;
    }
    
    // Add output size
    url += `&outputsize=${outputSize}&apikey=${ALPHA_VANTAGE_API_KEY}`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }
    
    const data = await response.json();
    
    // Check for rate limit or error messages
    if (data['Note'] || data['Information']) {
      throw new Error(data['Note'] || data['Information'] || 'API rate limit exceeded');
    }
    
    // Get the appropriate time series key
    const timeSeriesKey = Object.keys(data).find(key => key.includes('Time Series'));
    
    if (!timeSeriesKey || !data[timeSeriesKey]) {
      throw new Error('No historical data available for this symbol');
    }
    
    const timeSeries = data[timeSeriesKey];
    const historicalData: HistoricalData[] = [];
    
    // Determine how many data points we want based on the range
    let maxDataPoints = 100; // Default
    
    if (range.includes('d')) {
      const days = parseInt(range);
      maxDataPoints = Math.min(days, 100);
    } else if (range.includes('mo')) {
      const months = parseInt(range);
      maxDataPoints = Math.min(months * 22, 250);
    } else if (range.includes('y')) {
      const years = parseInt(range);
      maxDataPoints = Math.min(years * 250, 1000);
    }
    
    // Process the data
    let count = 0;
    for (const dateStr in timeSeries) {
      if (count >= maxDataPoints) break;
      
      const dataPoint = timeSeries[dateStr];
      
      historicalData.push({
        date: new Date(dateStr).toISOString(),
        open: parseFloat(dataPoint['1. open']),
        high: parseFloat(dataPoint['2. high']),
        low: parseFloat(dataPoint['3. low']),
        close: parseFloat(dataPoint['4. close']),
        volume: parseInt(dataPoint['5. volume']),
      });
      
      count++;
    }
    
    // Sort by date, oldest first
    historicalData.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    if (historicalData.length === 0) {
      throw new Error('No historical data points found');
    }
    
    return historicalData;
  } catch (error) {
    console.error(`Error fetching historical data for ${symbol}:`, error);
    throw new Error(`Failed to fetch historical data: ${error instanceof Error ? error.message : 'Unknown error'}`);
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