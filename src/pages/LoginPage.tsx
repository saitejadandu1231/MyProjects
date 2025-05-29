import React from 'react';
import { Box, Center, Text, Button } from '@chakra-ui/react';
import { useLocation, Navigate } from 'react-router-dom';
import { getUpstoxAuthUrl } from '../services/upstoxService';
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
      window.location.href = authUrl;
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
        {location.search.includes('sandbox=true') && (
          <Box mb={8} p={4} bg="yellow.50" borderRadius="md" border="1px" borderColor="yellow.200">
            <Text color="yellow.800">
              Note: Market is currently closed. You will be logged in with sandbox mode, which provides simulated market data for testing.
            </Text>
          </Box>
        )}
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
