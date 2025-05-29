// Upstox API integration service
// Handles OAuth, token storage, and real-time market data fetch

import axios, { AxiosError } from 'axios';

const UPSTOX_API_KEY = '11c273a8-ff5b-412e-b4da-bf686ed365af';
const UPSTOX_API_SECRET = '9kyef0cwz0';

// Get redirect URI dynamically based on current URL
function getRedirectUri() {
  // For deployed Netlify site
  if (window.location.hostname.includes('netlify.app')) {
    return 'https://leafy-bublanina-ae33e8.netlify.app/callback';
  }
  // For local development
  return `${window.location.origin}/callback`;
}

// Generate a random state for CSRF protection
function generateRandomState(length = 32) {
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

// Step 1: Redirect user to AUTH_URL for login, with dynamic state
export function getUpstoxAuthUrl() {
  const state = generateRandomState();
  const redirectUri = getRedirectUri();
  
  // Store state in sessionStorage for verification
  sessionStorage.setItem('upstox_oauth_state', state);
  
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: UPSTOX_API_KEY,
    redirect_uri: redirectUri,
    state: state
  });
  
  return `https://api-v2.upstox.com/v2/login/authorization/dialog?${params.toString()}`;
}

// Step 2: Exchange code for access token, with error handling
export async function fetchUpstoxToken(code: string, state?: string) {
  try {
    // Verify state if provided
    const storedState = sessionStorage.getItem('upstox_oauth_state');
    if (state && (!storedState || state !== storedState)) {
      throw new Error('Invalid state parameter. Possible CSRF attack.');
    }
    
    // Clear stored state
    sessionStorage.removeItem('upstox_oauth_state');
    
    const redirectUri = getRedirectUri();
    const response = await axios.post(
      'https://api-v2.upstox.com/v2/login/authorization/token',
      {
        code,
        client_id: UPSTOX_API_KEY,
        client_secret: UPSTOX_API_SECRET,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code'
      },
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
    
    if (!response.data?.access_token) {
      throw new Error('No access token in response');
    }
    
    return response.data;
  } catch (error) {
    if (error instanceof AxiosError && error.response?.data?.message) {
      throw new Error(`Upstox API Error: ${error.response.data.message}`);
    }
    throw error;
  }
}

// Fetch real-time market data (example: NSE_EQ)
export async function fetchUpstoxMarketQuote(token: string, instrumentKey: string) {
  try {
    const response = await axios.get(
      `https://api-v2.upstox.com/v2/market-quote/ltp?instrument_key=${instrumentKey}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );
    return response.data;
  } catch (error) {
    if (error instanceof AxiosError && error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('upstox_token');
      window.dispatchEvent(new Event('storage'));
      throw new Error('Session expired. Please login again.');
    }
    throw error;
  }
}

// Fetch all instruments from Upstox (NSE_EQ)
export async function fetchUpstoxInstruments(token: string) {
  try {
    const response = await axios.get(
      'https://api-v2.upstox.com/v2/instruments',
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );
    return response.data;
  } catch (error) {
    if (error instanceof AxiosError && error.response?.status === 401) {
      localStorage.removeItem('upstox_token');
      window.dispatchEvent(new Event('storage'));
      throw new Error('Session expired. Please login again.');
    }
    throw error;
  }
}
