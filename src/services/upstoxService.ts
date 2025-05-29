// Upstox API integration service
// Handles OAuth, token storage, and real-time market data fetch

import axios from 'axios';

const UPSTOX_API_KEY = '11c273a8-ff5b-412e-b4da-bf686ed365af';
const UPSTOX_API_SECRET = '9kyef0cwz0';
const REDIRECT_URI = 'https://YOUR_NETLIFY_SITE.netlify.app/callback';
const AUTH_URL = `https://api-v2.upstox.com/v2/login/authorization/dialog?response_type=code&client_id=${UPSTOX_API_KEY}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&state=xyz`;

// Step 1: Redirect user to AUTH_URL for login
export function getUpstoxAuthUrl() {
  return AUTH_URL;
}

// Step 2: Exchange code for access token
export async function fetchUpstoxToken(code: string) {
  const res = await axios.post(
    'https://api-v2.upstox.com/v2/login/authorization/token',
    {
      code,
      client_id: UPSTOX_API_KEY,
      client_secret: UPSTOX_API_SECRET,
      redirect_uri: REDIRECT_URI,
      grant_type: 'authorization_code',
    },
    { headers: { 'Content-Type': 'application/json' } }
  );
  return res.data;
}

// Step 3: Fetch all NSE instruments from Upstox
export async function fetchUpstoxInstruments(token: string) {
  const res = await axios.get(
    'https://api-v2.upstox.com/v2/market/instruments/inventory?segment=NSE_EQ',
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return res.data;
}

// Fetch real-time market data (example: NSE_EQ)
export async function fetchUpstoxMarketQuote(token: string, instrumentKey: string) {
  // symbol example: 'NSE_EQ|INE848E01016' (Upstox instrument key)
  const res = await axios.get(
    `https://api-v2.upstox.com/v2/market-quote/ltp?instrument_key=${instrumentKey}`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return res.data;
}
