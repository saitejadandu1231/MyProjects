import React from 'react';
import {
  Box,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Text,
  Tooltip,
  HStack,
  useColorModeValue,
  Heading,
  Badge,
  Flex,
  SlideFade,
} from '@chakra-ui/react';
import { QuestionIcon } from '@chakra-ui/icons';
import { TechnicalIndicator } from '../types';
import SkeletonLoader from './ui/SkeletonLoader';

interface IndicatorTableProps {
  indicators: TechnicalIndicator[];
  isLoading: boolean;
}

const IndicatorTable: React.FC<IndicatorTableProps> = ({ indicators, isLoading }) => {
  const bgColor = useColorModeValue('white', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.600');

  // Helper function to render signal badge with appropriate color
  const renderSignalBadge = (signal?: string) => {
    if (!signal) {
      return (
        <Badge colorScheme="gray" px={2} py={1} borderRadius="md">
          N/A
        </Badge>
      );
    }
    
    let colorScheme;
    switch (signal.toLowerCase()) {
      case 'buy':
        colorScheme = 'green';
        break;
      case 'sell':
        colorScheme = 'red';
        break;
      case 'neutral':
        colorScheme = 'gray';
        break;
      case 'strong buy':
        colorScheme = 'teal';
        break;
      case 'strong sell':
        colorScheme = 'orange';
        break;
      default:
        colorScheme = 'purple';
    }

    return (
      <Badge colorScheme={colorScheme} px={2} py={1} borderRadius="md">
        {signal}
      </Badge>
    );
  };

  // Descriptions for each indicator to show in tooltips
  const indicatorDescriptions: Record<string, string> = {
    'RSI': 'Relative Strength Index: Measures the speed and change of price movements on a scale of 0-100. Values above 70 suggest overbought conditions, while values below 30 suggest oversold conditions.',
    'MACD': 'Moving Average Convergence Divergence: Shows the relationship between two moving averages. Signals are generated when the MACD crosses its signal line.',
    'Moving Averages': 'Averages of the closing price over different periods. Signals are based on price crossing above or below these averages.',
    'Bollinger Bands': 'Shows price volatility bands around a moving average. Signals are based on price reaching the upper or lower bands.',
    'Stochastic Oscillator': 'Compares current price to its price range over a period on a scale of 0-100. Values above 80 suggest overbought conditions, while values below 20 suggest oversold conditions.',
    'ADX': 'Average Directional Index: Measures trend strength on a scale of 0-100. Values above 25 indicate a strong trend.',
  };

  if (isLoading) {
    return <SkeletonLoader type="table" count={5} />;
  }

  return (
    <Box
      p={4}
      borderRadius="lg"
      borderWidth="1px"
      bg={bgColor}
      borderColor={borderColor}
    >
      <SlideFade in={true} offsetY="20px">
        <Heading size="md" mb={4}>Technical Indicators</Heading>

        {indicators.length === 0 ? (
          <Flex justifyContent="center" alignItems="center" py={10}>
            <Text color="gray.500">No indicators available</Text>
          </Flex>
        ) : (
          <Table variant="simple" size="sm">
            <Thead>
              <Tr>
                <Th>Indicator</Th>
                <Th>Value</Th>
                <Th>Signal</Th>
              </Tr>
            </Thead>
            <Tbody>
              {indicators.map((indicator, index) => (
                <Tr 
                  key={indicator.name}
                  sx={{ 
                    // Add a subtle animation delay for each row
                    opacity: 0,
                    animation: `fadeIn 0.3s ease-in-out forwards`,
                    animationDelay: `${index * 0.1}s`,
                  }}
                >
                  <Td>
                    <HStack spacing={1}>
                      <Text fontWeight="medium">{indicator.name}</Text>
                      <Tooltip label={indicatorDescriptions[indicator.name] || 'Technical indicator'}>
                        <QuestionIcon boxSize={3} color="gray.500" />
                      </Tooltip>
                    </HStack>
                  </Td>
                  <Td>
                    <Text>{indicator.value}</Text>
                  </Td>
                  <Td>{renderSignalBadge(indicator.signal)}</Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        )}
      </SlideFade>
    </Box>
  );
};

export default IndicatorTable;