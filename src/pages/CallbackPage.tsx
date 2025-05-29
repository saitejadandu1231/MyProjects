import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Center, Spinner, Text, VStack, useToast } from '@chakra-ui/react';
import { fetchUpstoxToken } from '../services/upstoxService';
import { useAuth } from '../contexts/AuthContext';

export default function CallbackPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { setToken } = useAuth();
  const toast = useToast();
  const [isProcessing, setIsProcessing] = React.useState(true);

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

        const data = await fetchUpstoxToken(code, state || undefined);
        
        if (!data?.access_token) {
          throw new Error('No access token in response');
        }

        console.log('[Auth] Token received successfully');
        setToken(data.access_token);
        
        // Redirect after a short delay to ensure token is saved
        setTimeout(() => {
          navigate('/', { replace: true });
        }, 500);

      } catch (error: any) {
        console.error('[Auth] Callback error:', error);
        toast({
          title: 'Authentication Failed',
          description: error.message || 'Please try logging in again',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
        setIsProcessing(false);
        setTimeout(() => {
          navigate('/login', { replace: true });
        }, 2000);
      }
    };

    handleCallback();
  }, [location, navigate, setToken, toast]);

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
