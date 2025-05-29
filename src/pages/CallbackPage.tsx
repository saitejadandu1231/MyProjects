import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Center, VStack, Text, Button, Box, Link, useToast, Spinner } from '@chakra-ui/react';
import { ExternalLinkIcon } from '@chakra-ui/icons';
import { CONFIG, fetchUpstoxToken, getUpstoxAuthUrl } from '../services/upstoxService';
import { useAuth } from '../contexts/AuthContext';

function ErrorDisplay({ error, onRetry }: { error: string; onRetry: () => void }) {
  // Check for specific Upstox error codes
  const isApiActivationError = error.startsWith('API_NOT_ACTIVATED:') || 
                             error.includes('UDAPI100058') || 
                             error.includes('No segments for these users are active');

  if (isApiActivationError) {
    return (
      <Center h="70vh">
        <VStack spacing={6} maxW="600px" p={8}>
          <Text fontSize="2xl" color="red.500" fontWeight="bold">
            API Access Not Activated
          </Text>
          <VStack spacing={4} align="center">
            <Text fontSize="lg" align="center">
              Your Upstox account needs API access to be activated before you can use this application.
            </Text>
            <Box 
              bg="blue.50" 
              p={6} 
              borderRadius="lg" 
              w="100%" 
              border="1px" 
              borderColor="blue.200"
            >
              <Text fontWeight="semibold" mb={4}>
                Follow these steps to activate your API access:
              </Text>
              <VStack align="start" spacing={4}>
                <Text>1. Log in to your Upstox account</Text>
                <Text>2. Go to Settings → Developer Settings → API Access</Text>
                <Text>3. Click on "Enable API Access"</Text>
                <Text>4. Generate a new API key if needed</Text>
                <Text>5. Return here and try logging in again</Text>
              </VStack>
            </Box>
            <VStack spacing={4} w="100%" mt={4}>
              <Link 
                href="https://pro.upstox.com/settings/developer" 
                isExternal 
                w="100%"
              >
                <Button 
                  rightIcon={<ExternalLinkIcon />} 
                  colorScheme="blue" 
                  size="lg"
                  w="100%"
                >
                  Open Upstox Developer Settings
                </Button>
              </Link>
              <Button 
                onClick={onRetry} 
                variant="outline" 
                size="lg"
                w="100%"
              >
                Try Logging In Again
              </Button>
            </VStack>
          </VStack>
        </VStack>
      </Center>
    );
  }

  // Default error display for other errors
  return (
    <Center h="60vh">
      <VStack spacing={6} maxW="500px" p={4}>
        <Text color="red.500" fontSize="xl" fontWeight="semibold">
          Login Error
        </Text>
        <Text align="center" color="gray.700">
          {error}
        </Text>
        <Button 
          onClick={onRetry} 
          colorScheme="blue"
          size="lg"
        >
          Try Again
        </Button>
      </VStack>
    </Center>
  );
}

export default function CallbackPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { setToken } = useAuth();
  const [isProcessing, setIsProcessing] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    const handleCallback = async () => {
      try {
        // Special case for sandbox mode
        if (location.hash === '#sandbox') {
          console.log('[Auth] Setting up sandbox mode...');
          const sandboxToken = CONFIG.sandbox.token;
          setToken(sandboxToken);
          
          // Wait a moment for token to be saved
          await new Promise(resolve => setTimeout(resolve, 500));
          
          // Navigate to dashboard
          navigate('/', { replace: true });
          return;
        }
        // Get code and state from URL
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

        // Clear any existing tokens first
        localStorage.clear();
        sessionStorage.removeItem('upstox_oauth_state');
        sessionStorage.removeItem('upstox_redirect_uri');
        
        // Set the new token
        setToken(data.access_token);
        
        // Success! Redirect to home
        navigate('/', { replace: true });
      } catch (error: any) {
        console.error('[Auth] Callback error:', error);
        const errorMessage = error.response?.data?.errors?.[0]?.message || error.message;
        setError(errorMessage);
        setIsProcessing(false);
      }
    };

    handleCallback();
  }, [location, navigate, setToken]);

  // If there's an error, show error display
  if (error) {
    return (
      <ErrorDisplay 
        error={error} 
        onRetry={() => {
          window.location.href = getUpstoxAuthUrl();
        }}
      />
    );
  }

  // Show loading state
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
