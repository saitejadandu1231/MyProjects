import React from 'react';
import {
  Box,
  Heading,
  Text,
  Badge,
  Flex,
  Stack,
  useColorModeValue,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  StatArrow,
  Divider,
  Progress,
  SlideFade,
  HStack,
} from '@chakra-ui/react';
import { StockRecommendation } from '../types';

interface RecommendationCardProps {
  recommendation: StockRecommendation;
  isLoadingDetails: boolean;
}

const RecommendationCard: React.FC<RecommendationCardProps> = ({
  recommendation,
  isLoadingDetails,
}) => {
  const { stock, score, confidence, recommendation: recommendationType, strategy, tradeType, timeFrame } = recommendation;
  
  // Color mode values for light/dark theme compatibility
  const bgColor = useColorModeValue('white', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const secondaryTextColor = useColorModeValue('gray.600', 'gray.300');
  
  // Get appropriate colors for recommendation type
  const getRecommendationColor = () => {
    if (recommendationType.toLowerCase().includes('strong buy')) return 'green';
    if (recommendationType.toLowerCase().includes('buy')) return 'teal';
    if (recommendationType.toLowerCase().includes('sell')) return 'red';
    if (recommendationType.toLowerCase().includes('strong sell')) return 'orange';
    return 'gray';
  };
  
  const recommendationColor = getRecommendationColor();
  
  // Get appropriate colors for trade type
  const getTradeTypeColor = () => {
    if (tradeType === 'intraday') return 'blue';
    if (tradeType === 'delivery') return 'teal'; 
    if (tradeType === 'swing') return 'purple';
    if (tradeType === 'longTerm') return 'green';
    return 'gray';
  };

  // Get trade type display text
  const getTradeTypeDisplay = () => {
    if (tradeType === 'intraday') return 'Intraday';
    if (tradeType === 'delivery') return 'Delivery';
    if (tradeType === 'swing') return 'Swing';
    if (tradeType === 'longTerm') return 'Long Term';
    return 'Custom';
  };
  
  return (
    <SlideFade in={true} offsetY="20px">
      <Box
        borderRadius="lg"
        overflow="hidden"
        borderWidth="1px"
        bg={bgColor}
        borderColor={borderColor}
        position="relative"
        transition="all 0.2s"
        _hover={{
          transform: 'translateY(-2px)',
          boxShadow: 'md',
        }}
      >
        <Box p={5}>
          {/* Header with stock symbol and recommendation */}
          <Flex justifyContent="space-between" alignItems="center" mb={3}>
            <Flex alignItems="center">
              <Heading size="md">{stock.symbol}</Heading>
            </Flex>
            <Badge
              colorScheme={recommendationColor}
              fontSize="sm"
              px={2}
              py={1}
              borderRadius="md"
            >
              {recommendationType}
            </Badge>
          </Flex>
          
          <Text fontSize="sm" color={secondaryTextColor} mb={2} noOfLines={1}>
            {stock.name}
          </Text>

          {/* Trade type and time frame */}
          {tradeType && (
            <HStack spacing={2} mb={2}>
              <Badge colorScheme={getTradeTypeColor()} variant="subtle">
                {getTradeTypeDisplay()}
              </Badge>
              {timeFrame && (
                <Text fontSize="xs" color={secondaryTextColor}>
                  {timeFrame}
                </Text>
              )}
            </HStack>
          )}
          
          <Divider my={3} />
          
          {/* Current price and change */}
          <Stack spacing={4}>
            <Stat>
              <StatLabel fontSize="sm">Current Price</StatLabel>
              <Flex align="baseline">
                <StatNumber>₹{stock.price.toFixed(2)}</StatNumber>
                <StatHelpText ml={2}>
                  <StatArrow
                    type={stock.change >= 0 ? 'increase' : 'decrease'}
                  />
                  {Math.abs(stock.changePercent).toFixed(2)}%
                </StatHelpText>
              </Flex>
            </Stat>
            
            {/* Confidence score */}
            <Box>
              <Flex justify="space-between" mb={1}>
                <Text fontSize="sm">Confidence</Text>
                <Text fontSize="sm" fontWeight="medium">
                  {confidence}%
                </Text>
              </Flex>
              <Progress 
                value={confidence} 
                colorScheme={recommendationColor} 
                size="sm" 
                borderRadius="full"
                sx={{
                  '& > div': {
                    transition: 'width 0.8s ease-in-out'
                  }
                }}
              />
            </Box>
            
            {/* Strategy instead of Reasoning */}
            <Box>
              <Text fontSize="sm" fontWeight="medium" mb={1}>
                Strategy:
              </Text>
              <Text fontSize="sm" color={secondaryTextColor} noOfLines={3}>
                {strategy}
              </Text>
            </Box>
          </Stack>
        </Box>
      </Box>
    </SlideFade>
  );
};

export defa