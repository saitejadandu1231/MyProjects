import React, { lazy, Suspense } from 'react'
import { ChakraProvider, Box, Center, Spinner } from '@chakra-ui/react'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom'
import theme from './theme'
import Header from './components/Header'
import { StockProvider } from './contexts/StockContext'
import { FilterOptions } from './types'
import { getUpstoxAuthUrl, fetchUpstoxToken, fetchUpstoxMarketQuote } from './services/upstoxService'

// Lazy-loaded components
const Dashboard = lazy(() => import('./pages/Dashboard'))

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
}

const Callback = () => {
  // Handles Upstox OAuth redirect
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    if (code) {
      fetchUpstoxToken(code)
        .then((data) => {
          localStorage.setItem('upstox_token', data.access_token);
          window.location.replace('/MyProjects/');
        })
        .catch((err) => {
          setError('Failed to authenticate with Upstox.');
          setLoading(false);
        });
    } else {
      setError('No code found in URL.');
      setLoading(false);
    }
  }, []);

  if (loading) return <Center h="50vh"><Spinner size="xl" /></Center>;
  if (error) return <Center h="50vh">{error}</Center>;
  return null;
};

// Add Upstox login button if token is missing
function UpstoxLoginPrompt() {
  return (
    <Center h="60vh">
      <Box textAlign="center">
        <Box mb={4}>Please login with Upstox to view real-time stock data.</Box>
        <a href={getUpstoxAuthUrl()}>
          <button style={{padding: '12px 24px', background: '#1778ff', color: 'white', border: 'none', borderRadius: 6, fontSize: 18, cursor: 'pointer'}}>Login with Upstox</button>
        </a>
      </Box>
    </Center>
  );
}

function App() {
  const [hasToken, setHasToken] = React.useState(!!localStorage.getItem('upstox_token'));
  React.useEffect(() => {
    const handler = () => setHasToken(!!localStorage.getItem('upstox_token'));
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  }, []);

  return (
    <ChakraProvider theme={theme}>
      <StockProvider>
        <Router basename="/MyProjects/">
          <Box minH="100vh">
            <Header />
            <Box as="main" p={4}>
              {hasToken ? (
                <Suspense fallback={
                  <Center h="50vh">
                    <Spinner size="xl" color="brand.500" />
                  </Center>
                }>
                  <Routes>
                    <Route path="/" element={<Dashboard defaultFilters={defaultFilters} />} />
                    <Route path="callback" element={<Callback />} />
                    <Route path="*" element={<Dashboard defaultFilters={defaultFilters} />} />
                  </Routes>
                </Suspense>
              ) : (
                <UpstoxLoginPrompt />
              )}
            </Box>
          </Box>
        </Router>
      </StockProvider>
    </ChakraProvider>
  )
}

export default App