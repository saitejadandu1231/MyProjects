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

  return (
    <Center h="60vh">
      <Box textAlign="center">
        <Text fontSize="xl" mb={6}>
          Welcome to SmartStockPredictor
        </Text>
        <Text mb={8} color="gray.600">
          Please login with Upstox to access real-time market data and AI-powered recommendations.
        </Text>
        <a href={getUpstoxAuthUrl()}>
          <Button
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
        </a>
      </Box>
    </Center>
  );
}
