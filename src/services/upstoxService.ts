// Upstox API integration service
// Handles OAuth, token storage, and real-time market data fetch

import axios, { AxiosError } from 'axios';

const UPSTOX_API_KEY = '76987350-d35f-4aef-a6a7-2fee292d73d5';
const UPSTOX_API_SECRET = 'vg47rgiriu';

// Get redirect URI based on environment
function getRedirectUri() {
  // Get the redirect URI from session storage if it exists
  const storedUri = sessionStorage.getItem('upstox_redirect_uri');
  if (storedUri) {
    console.log('[Upstox] Using stored redirect URI:', storedUri);
    return storedUri;
  }

  // Otherwise generate a new one
  const uri = window.location.hostname.includes('netlify.app')
    ? 'https://leafy-bublanina-ae33e8.netlify.app/callback'
    : `${window.location.origin}/callback`;
    
  console.log('[Upstox] Generated redirect URI:', uri);
  return uri;
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
  
  // Store both state and redirect URI
  sessionStorage.setItem('upstox_oauth_state', state);
  sessionStorage.setItem('upstox_redirect_uri', redirectUri);
  
  console.log('[Upstox] Initializing auth with:', { redirectUri, state: state.slice(0, 8) + '...' });
  
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
    console.log('[Upstox] Token exchange request params:', {
      code,
      client_id: UPSTOX_API_KEY,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code'
    });

    const response = await axios.post(
      'https://api-v2.upstox.com/v2/login/authorization/token',
      new URLSearchParams({
        code: code,
        client_id: UPSTOX_API_KEY,
        client_secret: UPSTOX_API_SECRET,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code'
      }).toString(),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }
    );
    
    if (!response.data?.access_token) {
      throw new Error('No access token in response');
    }
    
    return response.data;
  } catch (error) {
    console.error('[Upstox] Token exchange error:', {
      status: (error as AxiosError)?.response?.status,
      data: (error as AxiosError)?.response?.data,
      config: (error as AxiosError)?.config
    });
    
    if (error instanceof AxiosError) {
      const errorMessage = error.response?.data?.errors?.[0]?.message || error.response?.data?.message;
      const errorCode = error.response?.data?.errors?.[0]?.code;
      
      if (errorCode === 'UDAPI100058' || errorMessage?.includes('No segments for these users are active')) {
        throw new Error('API_NOT_ACTIVATED:' + (errorMessage || 'Your Upstox API access needs to be activated'));
      }
      
      if (errorMessage) {
        throw new Error(`Upstox API Error: ${errorMessage}`);
      }
      
      if (error.response?.status === 400) {
        throw new Error('Invalid authorization code or redirect URI');
      }
      if (error.response?.status === 401) {
        throw new Error('Unauthorized. Please check your API credentials.');
      }
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
