// Upstox API integration service
// Handles OAuth, token storage, and real-time market data fetch

import axios from 'axios';

const UPSTOX_API_KEY = '11c273a8-ff5b-412e-b4da-bf686ed365af';
const UPSTOX_API_SECRET = '9kyef0cwz0';
const REDIRECT_URI = 'https://leafy-bublanina-ae33e8.netlify.app/callback';
const AUTH_URL = `https://api-v2.upstox.com/v2/login/authorization/dialog?response_type=code&client_id=${UPSTOX_API_KEY}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&state=xyz`;

// Step 1: Redirect user to AUTH_URL for login, with dynamic state
function generateRandomState(length = 16) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export function getUpstoxAuthUrl() {
  const state = generateRandomState();
  sessionStorage.setItem('upstox_oauth_state', state);
  const url = `https://api-v2.upstox.com/v2/login/authorization/dialog?response_type=code&client_id=${UPSTOX_API_KEY}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&state=${state}`;
  return url;
}

// Step 2: Exchange code for access token, with error handling
export async function fetchUpstoxToken(code: string, stateFromUrl?: string) {
  // Validate state if provided
  if (stateFromUrl) {
    const storedState = sessionStorage.getItem('upstox_oauth_state');
    if (!storedState || storedState !== stateFromUrl) {
      throw new Error('Invalid OAuth state. Possible CSRF attack.');
    }
    sessionStorage.removeItem('upstox_oauth_state');
  }
  try {
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
  } catch (err: any) {
    if (err.response && err.response.data) {
      throw new Error(err.response.data.message || 'Failed to fetch Upstox token');
    }
    throw new Error('Failed to fetch Upstox token');
  }
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

// Fetch all instruments from Upstox (NSE_EQ)
export async function fetchUpstoxInstruments(token: string) {
  const res = await axios.get('https://api-v2.upstox.com/v2/instruments', {
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.data;
}
