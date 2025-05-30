import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

interface AuthContextType {
  token: string | null;
  isAuthenticated: boolean;
  setToken: (token: string | null, expiry?: number) => void;
  logout: () => void;
  refreshToken: () => Promise<boolean>;
  getValidToken: () => Promise<string | null>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setTokenState] = useState<string | null>(() => {
    try {
      return localStorage.getItem('upstox_token');
    } catch {
      return null;
    }
  });
  
  const navigate = useNavigate();

  const setToken = (newToken: string | null, expiry?: number) => {
    console.log('[Auth] Setting token:', newToken ? 'present' : 'absent');
    try {
      if (newToken) {
        localStorage.setItem('upstox_token', newToken);
        if (expiry) {
          localStorage.setItem('upstox_token_expiry', (Date.now() + expiry * 1000).toString());
        }
      } else {
        localStorage.removeItem('upstox_token');
        localStorage.removeItem('upstox_token_expiry');
      }
      setTokenState(newToken);
    } catch (err) {
      console.error('[Auth] Error setting token:', err);
    }
  };

  const logout = () => {
    console.log('[Auth] Logging out');
    setToken(null);
    navigate('/login');
  };

  const refreshToken = async (): Promise<boolean> => {
    try {
      const currentToken = localStorage.getItem('upstox_token');
      if (!currentToken) return false;

      // For sandbox mode, just return true as the token doesn't expire
      if (currentToken.startsWith('eyJ0') && currentToken.length > 500) {
        return true;
      }

      // TODO: Implement real token refresh when Upstox adds refresh token support
      // For now, just check if the token is expired
      const expiry = localStorage.getItem('upstox_token_expiry');
      if (expiry && parseInt(expiry) > Date.now()) {
        return true;
      }

      // Token is expired
      logout();
      return false;
    } catch (error) {
      console.error('[Auth] Token refresh error:', error);
      logout();
      return false;
    }
  };

  const getValidToken = async (): Promise<string | null> => {
    const currentToken = token;
    if (!currentToken) return null;

    // For sandbox token, always return it as it doesn't expire
    if (currentToken.startsWith('eyJ0') && currentToken.length > 500) {
      return currentToken;
    }

    // Check if token is about to expire (within 5 minutes)
    const expiry = localStorage.getItem('upstox_token_expiry');
    if (expiry && parseInt(expiry) - Date.now() > 5 * 60 * 1000) {
      return currentToken;
    }

    // Try to refresh the token
    const refreshed = await refreshToken();
    return refreshed ? localStorage.getItem('upstox_token') : null;
  };

  // Sync token across tabs
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'upstox_token') {
        setTokenState(e.newValue);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Add token check on mount and every 5 minutes
  useEffect(() => {
    const checkToken = async () => {
      if (token) {
        await getValidToken();
      }
    };

    checkToken();
    const interval = setInterval(checkToken, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [token]);

  const value = {
    token,
    isAuthenticated: !!token,
    setToken,
    logout,
    refreshToken,
    getValidToken,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
