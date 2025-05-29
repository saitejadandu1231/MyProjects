import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Center, Spinner, Text, VStack, useToast, Button, Box } from '@chakra-ui/react';
import { fetchUpstoxToken, getUpstoxAuthUrl } from '../services/upstoxService';
import { useAuth } from '../contexts/AuthContext';

export default function CallbackPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { setToken } = useAuth();
  const toast = useToast();
  const [isProcessing, setIsProcessing] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    const handleCallback = async () => {
      try {
        console.log('[Auth] Processing callback');
        const params = new URLSearchParams(location.search);
        const code = params.get('code');
        const state = params.get('state');

        if (!code) {
          throw new Error('No authorization code received');
        }

        // Log the stored state for debugging
        const storedState = sessionStorage.getItem('upstox_oauth_state');
        console.log('[Auth] State verification:', {
          received: state,
          stored: storedState,
          match: state === storedState
        });

        const data = await fetchUpstoxToken(code, state || undefined);
        
        if (!data?.access_token) {
          throw new Error('No access token in response');
        }

        console.log('[Auth] Token received successfully');
        
        // Clear any existing tokens first
        localStorage.clear();
        sessionStorage.removeItem('upstox_oauth_state');
        sessionStorage.removeItem('upstox_redirect_uri');
        
        // Set the new token
        setToken(data.access_token);
        
        // Wait a moment for token to be saved
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Verify token was saved
        const savedToken = localStorage.getItem('upstox_token');
        if (!savedToken) {
          throw new Error('Failed to save authentication token');
        }

        // Success! Redirect to home
        navigate('/', { replace: true });
      } catch (error: any) {
        console.error('[Auth] Callback error:', error);
        setError(error.message || 'Authentication failed');
        setIsProcessing(false);
        
        toast({
          title: 'Authentication Error',
          description: error.message || 'Please try logging in again',
          status: 'error',
          duration: 8000,
          isClosable: true,
        });
      }
    };

    handleCallback();
  }, [location, navigate, setToken, toast]);

  if (error) {
    return (
      <Center h="60vh">
        <VStack spacing={6}>
          <Text color="red.500" fontSize="lg">
            {error}
          </Text>
          <Box>
            <a href={getUpstoxAuthUrl()}>
              <Button colorScheme="blue" size="lg">
                Try Again
              </Button>
            </a>
          </Box>
        </VStack>
      </Center>
    );
  }

  return (
    <Center h="60vh">
      <VStack spacing={6}>
        <Spinner size="xl" color="blue.500" />
        <Text fontSize="lg">
          {isProcessing ? 'Completing your login...' : 'Redirecting...'}
        </Text>
      </VStack>
    </Center>
  );
}
