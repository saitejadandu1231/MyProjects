import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

interface AuthContextType {
  token: string | null;
  isAuthenticated: boolean;
  setToken: (token: string | null) => void;
  logout: () => void;
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

  const setToken = (newToken: string | null) => {
    console.log('[Auth] Setting token:', newToken ? 'present' : 'absent');
    try {
      if (newToken) {
        localStorage.setItem('upstox_token', newToken);
      } else {
        localStorage.removeItem('upstox_token');
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

  const value = {
    token,
    isAuthenticated: !!token,
    setToken,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
