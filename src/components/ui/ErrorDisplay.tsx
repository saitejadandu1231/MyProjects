import React from 'react';
import { 
  Box, 
  Text, 
  Icon, 
  Flex, 
  useColorModeValue,
  Button,
  VStack,
  Heading,
} from '@chakra-ui/react';
import { keyframes } from '@emotion/react';
import { WarningTwoIcon } from '@chakra-ui/icons';

// Animation for error shake effect
const shakeAnimation = keyframes`
  0% { transform: translateX(0); }
  25% { transform: translateX(-5px); }
  50% { transform: translateX(5px); }
  75% { transform: translateX(-5px); }
  100% { transform: translateX(0); }
`;

// Animation for fade-in
const fadeIn = keyframes`
  from { opacity: 0; }
  to { opacity: 1; }
`;

interface ErrorDisplayProps {
  message: string;
  details?: string;
  onRetry?: () => void;
}

const ErrorDisplay: React.FC<ErrorDisplayProps> = ({ 
  message, 
  details, 
  onRetry 
}) => {
  const bgColor = useColorModeValue('white', 'gray.700');
  const borderColor = useColorModeValue('red.200', 'red.700');
  const textColor = useColorModeValue('red.600', 'red.200');
  const iconColor = useColorModeValue('red.500', 'red.300');
  
  return (
    <Box
      p={6}
      bg={bgColor}
      borderRadius="md"
      borderWidth="1px"
      borderColor={borderColor}
      borderLeftWidth="4px"
      animation={`${fadeIn} 0.5s ease-in, ${shakeAnimation} 0.5s 0.5s`}
      boxShadow="md"
      width="100%"
    >
      <Flex direction="column" alignItems="center">
        <Icon 
          as={WarningTwoIcon} 
          w={10} 
          h={10} 
          color={iconColor} 
          mb={3} 
        />
        
        <VStack spacing={2} mb={4} textAlign="center">
          <Heading size="md" color={textColor}>
            {message}
          </Heading>
          
          {details && (
            <Text fontSize="sm" color={useColorModeValue('gray.600', 'gray.300')}>
              {details}
            </Text>
          )}
        </VStack>
        
        {onRetry && (
          <Button 
            colorScheme="red" 
            variant="outline" 
            size="sm"
            onClick={onRetry}
          >
            Try Again
          </Button>
        )}
      </Flex>
    </Box>
  );
};

export default ErrorDisplay;