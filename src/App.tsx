import React, { lazy, Suspense } from 'react'
import { ChakraProvider, Box, Center, Spinner, Text, Button } from '@chakra-ui/react'
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
    const storeTokenAndRedirect = async (token: string) => {
      try {
        // Clear any existing data
        localStorage.clear();
        sessionStorage.clear();
        
        // Store new token
        localStorage.setItem('upstox_token', token);
        
        // Verify storage
        const storedToken = localStorage.getItem('upstox_token');
        console.log('[Upstox] Token stored:', !!storedToken);
        
        if (!storedToken) {
          throw new Error('Failed to store token');
        }
        
        // Dispatch multiple events to ensure token state updates
        ['storage', 'tokenUpdate'].forEach(eventName => {
          window.dispatchEvent(new Event(eventName));
        });
        
        // Wait for events to propagate
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Do one final check
        const finalCheck = localStorage.getItem('upstox_token');
        console.log('[Upstox] Final token check:', !!finalCheck);
        
        // Redirect to homepage
        const baseUrl = window.location.hostname.includes('netlify.app')
          ? 'https://leafy-bublanina-ae33e8.netlify.app'
          : window.location.origin;
        
        console.log('[Upstox] Redirecting to:', baseUrl);
        window.location.replace(baseUrl);
      } catch (err) {
        console.error('[Upstox] Error storing token:', err);
        throw err;
      }
    };

    const handleCallback = async () => {
      try {
        const params = new URLSearchParams(window.location.search);
        const code = params.get('code');
        const state = params.get('state');
        
        console.log('[Upstox] Processing callback with code:', !!code);
        
        if (!code) {
          throw new Error('No authorization code found');
        }
        
        const data = await fetchUpstoxToken(code, state || undefined);
        
        if (!data?.access_token) {
          throw new Error('No access token in response');
        }
        
        await storeTokenAndRedirect(data.access_token);
      } catch (err: any) {
        console.error('[Upstox] Callback error:', err);
        setError(err.message || 'Authentication failed');
        setLoading(false);
      }
    };

    handleCallback();
  }, []);

  if (loading) {
    return (
      <Center h="50vh">
        <Box textAlign="center">
          <Spinner size="xl" mb={4} />
          <Text>Processing login...</Text>
        </Box>
      </Center>
    );
  }

  if (error) {
    return (
      <Center h="50vh">
        <Box textAlign="center" color="red.500">
          <Text>{error}</Text>
          <Box mt={4}>
            <a href={getUpstoxAuthUrl()}>
              <Button colorScheme="blue">Try Again</Button>
            </a>
          </Box>
        </Box>
      </Center>
    );
  }

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
  const [hasToken, setHasToken] = React.useState(() => {
    try {
      const token = localStorage.getItem('upstox_token');
      console.log('[Upstox] Initial token check:', !!token, 'Value:', token?.slice(0, 10));
      return !!token;
    } catch (err) {
      console.error('[Upstox] Storage access error:', err);
      return false;
    }
  });

  React.useEffect(() => {
    let isMounted = true;
    let intervalId: number | undefined;

    const checkToken = () => {
      if (!isMounted) return;

      try {
        const token = localStorage.getItem('upstox_token');
        console.log('[Upstox] Token check:', token ? 'present' : 'missing');
        
        if (isMounted) {
          setHasToken(!!token);
        }
      } catch (err) {
        console.error('[Upstox] Token check error:', err);
        if (isMounted) {
          setHasToken(false);
        }
      }
    };

    // Initial check
    checkToken();

    // Set up event listeners
    const events = ['storage', 'tokenUpdate'];
    events.forEach(event => window.addEventListener(event, checkToken));

    // Check periodically for the first 5 seconds
    intervalId = window.setInterval(checkToken, 1000);
    const timeoutId = window.setTimeout(() => {
      if (intervalId) {
        window.clearInterval(intervalId);
        console.log('[Upstox] Stopping periodic token checks');
      }
    }, 5000);

    // Cleanup
    return () => {
      isMounted = false;
      events.forEach(event => window.removeEventListener(event, checkToken));
      if (intervalId) {
        window.clearInterval(intervalId);
      }
      window.clearTimeout(timeoutId);
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