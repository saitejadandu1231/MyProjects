// Upstox API integration service
// Handles OAuth, token storage, and real-time market data fetch

import axios from 'axios';

const UPSTOX_API_KEY = '11c273a8-ff5b-412e-b4da-bf686ed365af';
const UPSTOX_API_SECRET = '9kyef0cwz0';
const REDIRECT_URI = 'https://leafy-bublanina-ae33e8.netlify.app/callback';
const AUTH_URL = `https://api-v2.upstox.com/v2/login/authorization/dialog?response_type=code&client_id=${UPSTOX_API_KEY}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&state=xyz`;

// Step 1: Redirect user to AUTH_URL for login
export function getUpstoxAuthUrl() {
  return AUTH_URL;
}

// Step 2: Exchange code for access token
export async function fetchUpstoxToken(code: string) {
  console.log('[Upstox] Callback component loaded, exchanging code for token:', { code, client_id: UPSTOX_API_KEY, redirect_uri: REDIRECT_URI });
  try {
    const params = new URLSearchParams();
    params.append('code', code);
    params.append('client_id', UPSTOX_API_KEY);
    params.append('client_secret', UPSTOX_API_SECRET);
    params.append('redirect_uri', REDIRECT_URI);
    params.append('grant_type', 'authorization_code');
    const res = await axios.post(
      'https://api-v2.upstox.com/v2/login/authorization/token',
      params,
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
    );
    console.log('[Upstox] Token exchange response:', res.data);
    return res.data;
  } catch (err) {
    if (axios.isAxiosError(err)) {
      console.error('[Upstox] Token exchange error:', err.response?.data || err.message);
    } else {
      console.error('[Upstox] Unknown error during token exchange:', err);
    }
    throw err;
  }
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
