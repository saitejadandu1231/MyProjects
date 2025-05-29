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
  console.log('[Upstox] Callback component loaded');
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    const handleCallback = async () => {
      console.log('[Upstox] Processing callback...');
      const params = new URLSearchParams(window.location.search);
      const code = params.get('code');
      const state = params.get('state');
      
      if (!code) {
        console.error('[Upstox] No code found in URL.');
        setError('No code found in URL.');
        setLoading(false);
        return;
      }

      try {
        console.log('[Upstox] Attempting to fetch token...');
        const data = await fetchUpstoxToken(code, state || undefined);
        console.log('[Upstox] Token fetch success');

        // Store token
        localStorage.setItem('upstox_token', data.access_token);
        
        // Verify storage
        const storedToken = localStorage.getItem('upstox_token');
        if (!storedToken) {
          throw new Error('Failed to store token in localStorage');
        }
        
        // Dispatch events to update token state
        window.dispatchEvent(new Event('storage'));
        window.dispatchEvent(new Event('tokenUpdate'));
        
        // Wait a moment for events to process
        await new Promise(resolve => setTimeout(resolve, 500));

        // Redirect to home
        const redirectUrl = window.location.hostname.includes('netlify.app')
          ? 'https://leafy-bublanina-ae33e8.netlify.app'
          : window.location.origin;

        console.log('[Upstox] Redirecting to:', redirectUrl);
        window.location.replace(redirectUrl);
      } catch (err: any) {
        console.error('[Upstox] Error:', err);
        setError(err.message || 'Failed to authenticate with Upstox');
        setLoading(false);
      }
    };

    handleCallback();
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
  const [hasToken, setHasToken] = React.useState<boolean>(() => {
    try {
      const token = localStorage.getItem('upstox_token');
      const hasValidToken = !!token;
      console.log('[Upstox] Initial token check:', hasValidToken);
      return hasValidToken;
    } catch (err) {
      console.error('[Upstox] Error checking token:', err);
      return false;
    }
  });

  React.useEffect(() => {
    const checkToken = () => {
      try {
        const token = localStorage.getItem('upstox_token');
        const hasValidToken = !!token;
        console.log('[Upstox] Token check:', hasValidToken ? 'present' : 'missing');
        setHasToken(hasValidToken);
      } catch (err) {
        console.error('[Upstox] Error checking token:', err);
        setHasToken(false);
      }
    };

    // Check immediately
    checkToken();

    // Set up event listeners
    const events = ['storage', 'tokenUpdate'];
    events.forEach(event => window.addEventListener(event, checkToken));

    // Poll for changes for a few seconds to catch any race conditions
    const interval = setInterval(checkToken, 1000);
    const cleanup = setTimeout(() => {
      clearInterval(interval);
      console.log('[Upstox] Stopping token check interval');
    }, 5000);

    return () => {
      events.forEach(event => window.removeEventListener(event, checkToken));
      clearInterval(interval);
      clearTimeout(cleanup);
    };
  }, []);

  return (
    <ChakraProvider theme={theme}>
      <StockProvider>
        <Router>
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