// Handles OAuth, token storage, and real-time market data fetch

import axios, { AxiosError } from 'axios';

// API Configuration
export const CONFIG = {
  live: {
    apiKey: '11c273a8-ff5b-412e-b4da-bf686ed365af',
    apiSecret: '9kyef0cwz0',
    baseUrl: 'https://api-v2.upstox.com/v2',
    authUrl: 'https://api-v2.upstox.com/v2/login/authorization/dialog',
  },
  sandbox: {
    baseUrl: 'https://api-sandbox.upstox.com/v2',
    authUrl: 'https://api-sandbox.upstox.com/v2/login/authorization/dialog',  // Correct sandbox URL
    token: 'eyJ0eXAiOiJKV1QiLCJrZXlfaWQiOiJza192MS4wIiwiYWxnIjoiSFMyNTYifQ.eyJzdWIiOiI3NDc3NDkiLCJqdGkiOiI2ODM4OTAzMzFhMmEwZTZmNTY1NzRiOWEiLCJpc011bHRpQ2xpZW50IjpmYWxzZSwiaXNQbHVzUGxhbiI6dHJ1ZSwiaWF0IjoxNzQ4NTM3Mzk1LCJpc3MiOiJ1ZGFwaS1nYXRld2F5LXNlcnZpY2UiLCJleHAiOjE3NTEwNjE2MDB9.y5X7IqLWo7fZabajIRtbIEEebRoV07mPEFmYvCq6Ea8'
  }
};

// Default to sandbox environment
let currentEnvironment: 'live' | 'sandbox' = 'sandbox';

// Function to check if market is open (simplified example)
function isMarketOpen() {
  // When in forced sandbox mode, always return false
  if (currentEnvironment === 'sandbox') {
    return false;
  }
  
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

// Environment and configuration functions
function getCurrentConfig() {
  return CONFIG.sandbox; // Always return sandbox config
}

// Function to determine if we should use sandbox
export function shouldUseSandbox() {
  return true; // Always use sandbox
}

// Function to get current environment state
export function getEnvironmentState() {
  return {
    marketOpen: false,
    forcedSandbox: true,
    usingLive: false,
    currentMode: 'sandbox'
  };
}

// Function to switch between environments (sandbox only)
export function switchToSandbox() {
  currentEnvironment = 'sandbox';
  console.log('[Upstox] Using sandbox environment');
}

export function switchToLive() {
  console.log('[Upstox] Live mode is disabled. Using sandbox environment.');
  currentEnvironment = 'sandbox';
}

// Get redirect URI based on environment
function getRedirectUri() {
  return `${window.location.origin}/callback`;
}

// Authentication functions
export function getUpstoxAuthUrl() {
  console.log('[Upstox] Using sandbox mode for authentication');
  return '#sandbox';
}

export async function fetchUpstoxToken(code: string, state?: string): Promise<UpstoxTokenResponse> {
  console.log('[Upstox] Using sandbox token');
  return {
    access_token: CONFIG.sandbox.token,
    expires_in: 30 * 24 * 60 * 60, // 30 days in seconds
    token_type: 'Bearer'
  };
}

// Types and interfaces
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

// Helper function to get token from localStorage
function getStoredToken(): string | null {
  return localStorage.getItem('upstox_token');
}

// Helper functions for API calls
function getValidatedHeaders(): { Accept: string; Authorization: string } {
  return {
    'Accept': 'application/json',
    'Authorization': `Bearer ${CONFIG.sandbox.token}`
  };
}

// API functions
export async function fetchUpstoxMarketQuote(instrumentKey: string) {
  const headers = getValidatedHeaders();
  const response = await axios.get(
    `${CONFIG.sandbox.baseUrl}/market-quote/quotes?symbol=${instrumentKey}`,
    { headers }
  );
  return response.data;
}

export async function fetchUpstoxInstruments(exchange: string = 'NSE_EQ') {
  const headers = getValidatedHeaders();
  const response = await axios.get(
    `${CONFIG.sandbox.baseUrl}/market-quote/instruments/master`,
    {
      params: { segment: exchange },
      headers
    }
  );
  return response.data;
}

export async function fetchOHLCData(instrumentKey: string) {
  const headers = getValidatedHeaders();
  const response = await axios.get(
    `${CONFIG.sandbox.baseUrl}/historical-candle/${instrumentKey}`,
    {
      params: {
        interval: '1D',
        to_date: new Date().toISOString(),
        from_date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
      },
      headers
    }
  );
  return response.data;
}

export async function fetchUserProfile() {
  const headers = getValidatedHeaders();
  const response = await axios.get(
    `${CONFIG.sandbox.baseUrl}/user/profile`,
    { headers }
  );
  return response.data;
}
