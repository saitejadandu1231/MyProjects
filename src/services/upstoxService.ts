// Upstox API integration service
// Handles OAuth, token storage, and real-time market data fetch

import axios, { AxiosError } from 'axios';

// API Configuration
export const CONFIG = {
  live: {
    apiKey: '11c273a8-ff5b-412e-b4da-bf686ed365af',
    apiSecret: '9kyef0cwz0',
    baseUrl: 'https://api-v2.upstox.com/v2',
  },
  sandbox: {
    baseUrl: 'https://api-v2.upstox.com/sandbox/ps/v2', // Sandbox base URL
    token: 'eyJ0eXAiOiJKV1QiLCJrZXlfaWQiOiJza192MS4wIiwiYWxnIjoiSFMyNTYifQ.eyJzdWIiOiI3NDc3NDkiLCJqdGkiOiI2ODM4OTAzMzFhMmEwZTZmNTY1NzRiOWEiLCJpc011bHRpQ2xpZW50IjpmYWxzZSwiaXNQbHVzUGxhbiI6dHJ1ZSwiaWF0IjoxNzQ4NTM3Mzk1LCJpc3MiOiJ1ZGFwaS1nYXRld2F5LXNlcnZpY2UiLCJleHAiOjE3NTEwNjE2MDB9.y5X7IqLWo7fZabajIRtbIEEebRoV07mPEFmYvCq6Ea8'
  }
};

// Default to live environment
let currentEnvironment: 'live' | 'sandbox' = 'live';

// Function to check if market is open (simplified example)
function isMarketOpen() {
  // Get current time in IST
  const now = new Date();
  const istOffset = 5.5 * 60; // IST is UTC+5:30
  const utcMinutes = now.getUTCHours() * 60 + now.getUTCMinutes();
  const istMinutes = utcMinutes + istOffset;
  
  // Adjust day for IST
  let istDay = now.getUTCDay();
  if (istMinutes >= 24 * 60) {
    istDay = (istDay + 1) % 7;
  }
  
  // Convert IST minutes to 0-1440 range
  const timeInMinutes = istMinutes % (24 * 60);
  
  // Market is closed on weekends (0 = Sunday, 6 = Saturday)
  if (istDay === 0 || istDay === 6) {
    console.log('[Upstox] Market closed (Weekend)');
    return false;
  }

  // Market timing: 9:15 AM to 3:30 PM IST
  const marketOpen = 9 * 60 + 15;   // 9:15 AM IST
  const marketClose = 15 * 60 + 30;  // 3:30 PM IST

  const isOpen = timeInMinutes >= marketOpen && timeInMinutes <= marketClose;
  console.log(`[Upstox] Market ${isOpen ? 'open' : 'closed'} (Current IST: ${Math.floor(timeInMinutes/60)}:${timeInMinutes%60})`);
  
  return isOpen;
}

// Function to switch between environments
export function switchToSandbox() {
  if (!CONFIG.sandbox.token) {
    throw new Error('Sandbox token not configured. Please set VITE_UPSTOX_SANDBOX_TOKEN in your environment.');
  }
  currentEnvironment = 'sandbox';
  console.log('[Upstox] Switched to sandbox environment');
}

export function switchToLive() {
  currentEnvironment = 'live';
  console.log('[Upstox] Switched to live environment');
}

// Function to get current environment config
function getCurrentConfig() {
  return CONFIG[currentEnvironment];
}

// Function to determine if we should use sandbox
function shouldUseSandbox() {
  // Use sandbox if explicitly set to sandbox environment or if market is closed
  return currentEnvironment === 'sandbox' || !isMarketOpen();
}

export interface UpstoxTokenResponse {
  access_token: string;
  expires_in: number;
  token_type: string;
  refresh_token?: string;
}

export class UpstoxError extends Error {
  constructor(
    message: string,
    public code?: string,
    public status?: number,
    public details?: any
  ) {
    super(message);
    this.name = 'UpstoxError';
  }
}

// Get redirect URI based on environment
function getRedirectUri() {
  // Get the redirect URI from session storage if it exists
  const storedUri = sessionStorage.getItem('upstox_redirect_uri');
  if (storedUri) {
    console.log('[Upstox] Using stored redirect URI:', storedUri);
    return storedUri;
  }

  // Otherwise generate a new one based on the current environment
  // For development, use localhost
  if (window.location.hostname === 'localhost') {
    const uri = 'http://localhost:5173/callback';
    console.log('[Upstox] Using development redirect URI:', uri);
    return uri;
  }
  
  // For production Netlify deployment
  if (window.location.hostname.includes('netlify.app')) {
    const uri = 'https://leafy-bublanina-ae33e8.netlify.app/callback';
    console.log('[Upstox] Using production redirect URI:', uri);
    return uri;
  }
  
  // For any other environment
  const uri = `${window.location.origin}/callback`;
  console.log('[Upstox] Using default redirect URI:', uri);
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
  
  // If using sandbox, return sandbox token immediately
  if (shouldUseSandbox()) {
    console.log('[Upstox] Using sandbox environment');
    // Don't set the token here, let the CallbackPage handle it
    return '#sandbox'; // Special URL that CallbackPage will recognize
  }

  const params = new URLSearchParams({
    response_type: 'code',
    client_id: CONFIG.live.apiKey,
    redirect_uri: redirectUri,
    state: state
  });
  
  return `https://api-v2.upstox.com/v2/login/authorization/dialog?${params.toString()}`;
}

// Step 2: Exchange code for access token, with error handling
export async function fetchUpstoxToken(code: string, state?: string): Promise<UpstoxTokenResponse> {
  try {
    // Verify state if provided
    const storedState = sessionStorage.getItem('upstox_oauth_state');
    if (state && (!storedState || state !== storedState)) {
      throw new UpstoxError('Invalid state parameter. Possible CSRF attack.', 'INVALID_STATE');
    }
    
    // Clear stored state
    sessionStorage.removeItem('upstox_oauth_state');
    
    const redirectUri = getRedirectUri();
    console.log('[Upstox] Token exchange request params:', {
      code,
      client_id: CONFIG.live.apiKey,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code'
    });

    // If in sandbox mode, return sandbox token
    if (shouldUseSandbox()) {
      return {
        access_token: CONFIG.sandbox.token,
        expires_in: 30 * 24 * 60 * 60, // 30 days in seconds
        token_type: 'Bearer'
      };
    }

    const response = await axios.post<UpstoxTokenResponse>(
      `${CONFIG.live.baseUrl}/login/authorization/token`,
      new URLSearchParams({
        code: code,
        client_id: CONFIG.live.apiKey,
        client_secret: CONFIG.live.apiSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code'
      }).toString(),
      {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }
    );
    
    if (!response.data?.access_token) {
      throw new UpstoxError('No access token in response', 'NO_ACCESS_TOKEN');
    }
    
    return response.data;
  } catch (error) {
    const axiosError = error as AxiosError<any>;
    
    // If there's no response, it's likely a network error
    if (!axiosError.response) {
      throw new UpstoxError(
        'Network error while connecting to Upstox. Please check your internet connection.',
        'NETWORK_ERROR'
      );
    }

    const { status, data } = axiosError.response;
    
    // Handle specific known error cases
    const errorCode = data?.errorCode || data?.error_type;
    const errorMessage = data?.message;
    
    if (errorCode === 'UDAPI100058' || 
        errorMessage?.includes('No segments for these users are active')) {
      throw new UpstoxError(
        'API_NOT_ACTIVATED: Your Upstox account needs API access to be activated.',
        'UDAPI100058',
        status,
        data
      );
    }
    
    if (errorCode === 'UDAPI100068') {
      console.error('[Upstox] Client ID or redirect URI validation failed:', {
        clientId: CONFIG.live.apiKey,
        redirectUri: getRedirectUri()
      });
      throw new UpstoxError(
        'Your redirect URI is not registered with this API key. Please verify your Upstox API settings.',
        'UDAPI100068',
        status,
        data
      );
    }
    
    // Handle general HTTP errors
    if (status === 401) {
      throw new UpstoxError(
        'Authentication failed. Please try logging in again.',
        'AUTH_FAILED',
        status,
        data
      );
    }
    
    if (status === 400) {
      throw new UpstoxError(
        'Invalid request. Please try again.',
        'INVALID_REQUEST',
        status,
        data
      );
    }
    
    // Log error details for debugging
    console.error('[Upstox] Token exchange error:', {
      status: axiosError.response?.status,
      data: axiosError.response?.data,
      config: axiosError.config
    });
    
    // Rethrow as UpstoxError with details
    throw new UpstoxError(
      'Failed to authenticate with Upstox. Please try again.',
      'TOKEN_EXCHANGE_ERROR',
      axiosError.response?.status,
      axiosError.response?.data
    );
  }
}

// Types for Market API responses
export interface MarketQuote {
  last_price: number;
  instrument_token: string;
  exchange: string;
  symbol: string;
  last_quantity: number;
  volume: number;
  change: number;
  average_price: number;
  open: number;
  high: number;
  low: number;
  close: number;
}

export interface Instrument {
  instrument_key: string;
  exchange_token: string;
  tradingsymbol: string;
  name: string;
  last_price: number;
  expiry: string;
  strike: number;
  tick_size: number;
  lot_size: number;
  instrument_type: string;
  option_type: string;
  exchange: string;
}

// Fetch real-time market data
export async function fetchUpstoxMarketQuote(token: string, instrumentKey: string) {
  try {
    const config = getCurrentConfig();
    const baseUrl = config.baseUrl;
    
    // First fetch the market feed auth token
    const authResponse = await axios.get(
      `${baseUrl}/market-quote/auth-token`,
      {
        headers: {
          'Accept': 'application/json',
          Authorization: `Bearer ${token}`
        }
      }
    );

    // Then fetch the market data
    const response = await axios.get(
      `${baseUrl}/market-quote/quotes?symbol=${instrumentKey}`,
      {
        headers: {
          'Accept': 'application/json',
          Authorization: `Bearer ${token}`
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

// Fetch all instruments for a specific exchange
export async function fetchUpstoxInstruments(token: string, exchange: string = 'NSE_EQ') {
  try {
    const config = getCurrentConfig();
    const baseUrl = config.baseUrl;
    
    const response = await axios.get(
      `${baseUrl}/market-quote/instruments/master`,
      {
        params: {
          segment: exchange
        },
        headers: {
          'Accept': 'application/json',
          Authorization: `Bearer ${token}`
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
    
    if (error instanceof AxiosError && error.response?.status === 404) {
      console.error('[Upstox] Instruments API error:', error.response.data);
      throw new Error('Unable to fetch instruments. Please try again later.');
    }
    throw error;
  }
}

// Get OHLC data for a symbol
export async function fetchOHLCData(token: string, instrumentKey: string) {
  try {
    const config = getCurrentConfig();
    const baseUrl = config.baseUrl;
    
    const response = await axios.get(
      `${baseUrl}/historical-candle/${instrumentKey}`,
      {
        params: {
          interval: '1D', // Daily candles
          to_date: new Date().toISOString(),
          from_date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString() // Last 30 days
        },
        headers: {
          'Accept': 'application/json',
          Authorization: `Bearer ${token}`
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

// Get user profile and positions
export async function fetchUserProfile(token: string) {
  try {
    const config = getCurrentConfig();
    const baseUrl = config.baseUrl;
    
    const response = await axios.get(
      `${baseUrl}/user/profile`,
      {
        headers: {
          'Accept': 'application/json',
          Authorization: `Bearer ${token}`
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

// Function to get current environment state
export function getEnvironmentState() {
  const marketOpen = isMarketOpen();
  const forcedSandbox = currentEnvironment === 'sandbox';
  const usingLive = !forcedSandbox && marketOpen;
  
  return {
    marketOpen,
    forcedSandbox,
    usingLive,
    currentMode: usingLive ? 'live' : 'sandbox'
  };
}
