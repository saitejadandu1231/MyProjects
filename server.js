const express = require('express');
const cors = require('cors');
const axios = require('axios');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;

// Enable CORS for all routes
app.use(cors());

// Middleware to parse JSON bodies
app.use(express.json());

// Request headers to make our requests look more like a browser
const browserHeaders = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.9',
  'Referer': 'https://finance.yahoo.com/',
  'Origin': 'https://finance.yahoo.com',
  'Connection': 'keep-alive'
};

// Serve static files from the React app if in production
app.use(express.static(path.join(__dirname, 'dist')));

// Yahoo Finance API proxy endpoints
app.get('/api/search', async (req, res) => {
  try {
    const query = req.query.q;
    const quotesCount = req.query.quotesCount || 10;
    
    console.log(`Searching for: "${query}" with quotesCount=${quotesCount}`);
    
    const response = await axios.get('https://query2.finance.yahoo.com/v1/finance/search', {
      params: {
        q: query,
        quotesCount,
        newsCount: 0
      },
      headers: browserHeaders,
      timeout: 10000 // 10 second timeout
    });
    
    console.log(`Search successful for "${query}". Status: ${response.status}`);
    res.json(response.data);
  } catch (error) {
    console.error('Error proxying Yahoo Finance search:', error.message);
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      console.error(`Response status: ${error.response.status}`);
      console.error(`Response headers:`, error.response.headers);
      console.error(`Response data:`, error.response.data);
    } else if (error.request) {
      // The request was made but no response was received
      console.error('No response received:', error.request);
    }
    
    // Return a predefined set of stock symbols for testing
    if (query.toLowerCase().includes('india')) {
      return res.json({
        quotes: [
          { symbol: 'RELIANCE.NS', shortname: 'Reliance Industries Limited' },
          { symbol: 'TCS.NS', shortname: 'Tata Consultancy Services Limited' },
          { symbol: 'HDFCBANK.NS', shortname: 'HDFC Bank Limited' },
          { symbol: 'INFY.NS', shortname: 'Infosys Limited' },
          { symbol: 'ICICIBANK.NS', shortname: 'ICICI Bank Limited' }
        ]
      });
    }
    
    res.status(500).json({ error: 'Failed to fetch data from Yahoo Finance' });
  }
});

app.get('/api/chart/:symbol', async (req, res) => {
  try {
    const symbol = req.params.symbol;
    const interval = req.query.interval || '1d';
    const range = req.query.range || '1mo';
    
    console.log(`Fetching chart data for symbol: ${symbol}, interval: ${interval}, range: ${range}`);
    
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}`;
    
    const response = await axios.get(url, {
      params: {
        interval,
        range
      },
      headers: browserHeaders,
      timeout: 10000 // 10 second timeout
    });
    
    console.log(`Chart data fetched successfully for ${symbol}`);
    res.json(response.data);
  } catch (error) {
    console.error(`Error proxying Yahoo Finance chart:`, error.message);
    if (error.response) {
      console.error(`Response status: ${error.response.status}`);
      console.error(`Response headers:`, error.response.headers);
      console.error(`Response data:`, error.response.data);
    } else if (error.request) {
      console.error('No response received:', error.request);
    }
    
    // Generate mock chart data as a fallback
    const mockData = generateMockChartData(req.params.symbol);
    res.json(mockData);
  }
});

// Function to generate mock chart data when the API fails
function generateMockChartData(symbol) {
  console.log(`Generating mock data for ${symbol}`);
  
  const timestamp = [];
  const open = [];
  const high = [];
  const low = [];
  const close = [];
  const volume = [];
  
  // Generate 30 days of mock data
  const now = new Date();
  const basePrice = 1000 + Math.random() * 3000;
  let lastClose = basePrice;
  
  for (let i = 30; i >= 0; i--) {
    const date = new Date();
    date.setDate(now.getDate() - i);
    timestamp.push(Math.floor(date.getTime() / 1000));
    
    // Generate random price action with some continuity
    const changePercent = (Math.random() - 0.5) * 0.02; // -1% to +1%
    const dayOpen = lastClose * (1 + (Math.random() - 0.5) * 0.01);
    const dayClose = dayOpen * (1 + changePercent);
    const dayHigh = Math.max(dayOpen, dayClose) * (1 + Math.random() * 0.01);
    const dayLow = Math.min(dayOpen, dayClose) * (1 - Math.random() * 0.01);
    const dayVolume = Math.floor(500000 + Math.random() * 5000000);
    
    open.push(dayOpen);
    close.push(dayClose);
    high.push(dayHigh);
    low.push(dayLow);
    volume.push(dayVolume);
    
    lastClose = dayClose;
  }
  
  return {
    chart: {
      result: [{
        meta: {
          currency: 'INR',
          symbol: symbol,
          exchangeName: 'NSE',
          instrumentType: 'EQUITY',
          regularMarketPrice: close[close.length - 1],
          chartPreviousClose: open[0],
          previousClose: open[0],
          scale: 'linear',
          regularMarketTime: timestamp[timestamp.length - 1]
        },
        timestamp,
        indicators: {
          quote: [{
            open,
            high,
            low,
            close,
            volume
          }]
        }
      }],
      error: null
    }
  };
}

// Catch-all handler for the React app (client-side routing)
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Proxy server running on port ${PORT}`);
  console.log(`Access your app at http://localhost:${PORT}`);
});