import React, { createContext, useState, ReactNode } from 'react';
import { StockContextType, StockRecommendation, ManualStockInput } from '../types';
import { analyzeManualStockData } from '../services/stockAnalyzer';

// Create the context with a default value
export const StockContext = createContext<StockContextType>({
  recommendations: [],
  setRecommendations: () => {},
  isLoading: false,
  setIsLoading: () => {},
  error: null,
  setError: () => {},
  useAI: false,
  setUseAI: () => {},
});

interface StockProviderProps {
  children: ReactNode;
}

// Create a provider component to wrap the application
export const StockProvider: React.FC<StockProviderProps> = ({ children }) => {
  const [recommendations, setRecommendations] = useState<StockRecommendation[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [useAI, setUseAI] = useState<boolean>(false);

  // Function to analyze manually entered stock data
  const analyzeManualStock = async (data: ManualStockInput): Promise<StockRecommendation> => {
    try {
      // Process the manual stock data and generate a recommendation
      const recommendation = await analyzeManualStockData(data);
      
      // Add the new recommendation to the existing list (at the beginning)
      setRecommendations(prev => [recommendation, ...prev]);
      
      return recommendation;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error analyzing stock';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  // The context value that will be provided to consumers
  const contextValue: StockContextType = {
    recommendations,
    setRecommendations,
    isLoading,
    setIsLoading,
    error,
    setError,
    analyzeManualStock,
    useAI,
    setUseAI,
  };

  return (
    <StockContext.Provider value={contextValue}>
      {children}
    </StockContext.Provider>
  );
};