import React, { lazy, Suspense } from 'react';
import { ChakraProvider, Box, Center, Spinner } from '@chakra-ui/react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { StockProvider } from './contexts/StockContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { FilterOptions } from './types';
import theme from './theme';
import Header from './components/Header';

// Lazy-loaded components
const Dashboard = lazy(() => import('./pages/Dashboard'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const CallbackPage = lazy(() => import('./pages/CallbackPage'));

// Default filter options
const defaultFilters: FilterOptions = {
  tradeType: 'delivery',
  timeRange: '1d',
  dayRange: '1mo',
  riskTolerance: 3,
  priceRange: [0, 5000],
  onlyProfitableStocks: false,
  highVolumeOnly: false, 
  includeTechnicalAnalysis: true
};

// Loading component for suspense fallback
const PageLoader = () => (
  <Center h="50vh">
    <Spinner size="xl" color="blue.500" />
  </Center>
);

function AppRoutes() {
  return (
    <Box minH="100vh">
      <Header />
      <Box as="main" p={4}>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/callback" element={<CallbackPage />} />
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <Dashboard defaultFilters={defaultFilters} />
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </Box>
    </Box>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <ChakraProvider theme={theme}>
        <AuthProvider>
          <StockProvider>
            <AppRoutes />
          </StockProvider>
        </AuthProvider>
      </ChakraProvider>
    </BrowserRouter>
  );
}