import React from 'react';
import { Box, Center, Text, Button } from '@chakra-ui/react';
import { useLocation, Navigate } from 'react-router-dom';
import { getUpstoxAuthUrl, getEnvironmentState } from '../services/upstoxService';
import { useAuth } from '../contexts/AuthContext';

export default function LoginPage() {
  const { isAuthenticated } = useAuth();
  const location = useLocation();
  const from = (location.state as any)?.from?.pathname || '/';

  if (isAuthenticated) {
    console.log('[Auth] Already authenticated, redirecting to:', from);
    return <Navigate to={from} replace />;
  }

  const handleLogin = () => {
    try {
      const authUrl = getUpstoxAuthUrl();
      if (authUrl === '#sandbox') {
        // For sandbox mode, we directly navigate to callback
        window.location.href = '/callback#sandbox';
      } else {
        // For live mode, we redirect to Upstox login
        window.location.href = authUrl;
      }
    } catch (error) {
      console.error('Login error:', error);
    }
  };

  return (
    <Center h="60vh">
      <Box textAlign="center" maxW="600px" px={4}>
        <Text fontSize="xl" mb={6}>
          Welcome to SmartStockPredictor
        </Text>
        <Text mb={4} color="gray.600">
          Please login with Upstox to access real-time market data and AI-powered recommendations.
        </Text>
        {(() => {
          const envState = getEnvironmentState();
          if (!envState.usingLive) {
            return (
              <Box mb={8} p={4} bg="yellow.50" borderRadius="md" border="1px" borderColor="yellow.200">
                <Text color="yellow.800" fontWeight="semibold" mb={2}>
                  Using Sandbox Mode
                </Text>
                <Text color="yellow.800" fontSize="sm">
                  {envState.forcedSandbox 
                    ? "Sandbox mode is manually enabled. Using simulated market data for testing."
                    : "Market is currently closed. Using simulated market data for testing."}
                </Text>
              </Box>
            );
          }
          return null;
        })()}
        <Button
          onClick={handleLogin}
          size="lg"
          colorScheme="blue"
          px={8}
          height="56px"
          fontSize="lg"
          _hover={{
            transform: 'translateY(-2px)',
            boxShadow: 'lg',
          }}
          transition="all 0.2s"
        >
          Login with Upstox
        </Button>
      </Box>
    </Center>
  );
}
