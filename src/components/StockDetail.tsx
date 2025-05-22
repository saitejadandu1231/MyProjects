import React, { useState } from 'react';
import { Box, Flex, Grid, GridItem, Heading, HStack, Tab, TabList, TabPanel, TabPanels, Tabs, Text, VStack, Badge, useColorModeValue } from '@chakra-ui/react'
import { StockRecommendation } from '../types'
import PriceChart from './PriceChart'
import IndicatorTable from './IndicatorTable'
import RecommendationCard from './RecommendationCard'

interface StockDetailProps {
  stockData: StockRecommendation;
}

const StockDetail: React.FC<StockDetailProps> = ({ stockData }) => {
  const [isLoading, setIsLoading] = useState(false);
  const gainColor = useColorModeValue('green.500', 'green.300')
  const lossColor = useColorModeValue('red.500', 'red.300')
  const borderColor = useColorModeValue('gray.200', 'gray.700')
  const bgColor = useColorModeValue('white', 'gray.700');
  const secondaryTextColor = useColorModeValue('gray.600', 'gray.300');
  
  const { stock, recommendation, targetPrice, buyPrice, stopLoss } = stockData;
  
  // Get appropriate colors for recommendation type
  const getRecommendationColor = () => {
    if (recommendation.toLowerCase().includes('strong buy')) return 'green';
    if (recommendation.toLowerCase().includes('buy')) return 'teal';
    if (recommendation.toLowerCase().includes('sell')) return 'red';
    if (recommendation.toLowerCase().includes('strong sell')) return 'orange';
    return 'gray';
  };
  
  const recommendationColor = getRecommendationColor();
  
  // Convert strategy string to array for rendering
  const strategyTags = stock.strategy.split(',').map(s => s.trim()).filter(s => s);
  
  return (
    <VStack spacing={6} align="stretch">
      <Flex justifyContent="space-between" alignItems="flex-start">
        <Box>
          <HStack spacing={2} mb={1}>
            <Heading size="lg">{stock.stock.symbol}</Heading>
            <Text color="gray.500" fontSize="md" alignSelf="flex-end">
              {stock.stock.name}
            </Text>
          </HStack>
          
          <HStack spacing={4}>
            <Heading size="lg">₹{stock.stock.price.toFixed(2)}</Heading>
            <Text 
              color={stock.stock.change >= 0 ? gainColor : lossColor}
              fontWeight="bold"
              fontSize="md"
            >
              {stock.stock.change >= 0 ? '+' : ''}{stock.stock.change.toFixed(2)} ({stock.stock.changePercent.toFixed(2)}%)
            </Text>
          </HStack>
        </Box>
        
        <RecommendationCard stock={stock} />
      </Flex>
      
      <Box height="400px" borderWidth="1px" borderRadius="md" borderColor={borderColor} overflow="hidden">
        <PriceChart 
          stockData={stock.stock} 
          historicalData={stock.historicalData || []} 
          timeRange="1d"
          isLoading={isLoading}
        />
      </Box>
      
      <Tabs colorScheme="brand" variant="enclosed">
        <TabList>
          <Tab>Technical Indicators</Tab>
          <Tab>Stock Info</Tab>
          <Tab>Strategy Details</Tab>
        </TabList>
        
        <TabPanels>
          <TabPanel>
            <IndicatorTable indicators={stock.indicators} isLoading={isLoading} />
          </TabPanel>
          
          <TabPanel>
            <Grid templateColumns={{ base: "1fr", md: "repeat(2, 1fr)" }} gap={4}>
              <GridItem>
                <VStack align="stretch" spacing={3}>
                  <Flex justify="space-between">
                    <Text color="gray.500">Open</Text>
                    <Text fontWeight="medium">₹{stock.stock.open.toFixed(2)}</Text>
                  </Flex>
                  <Flex justify="space-between">
                    <Text color="gray.500">Previous Close</Text>
                    <Text fontWeight="medium">₹{stock.stock.previousClose.toFixed(2)}</Text>
                  </Flex>
                  <Flex justify="space-between">
                    <Text color="gray.500">Day High</Text>
                    <Text fontWeight="medium">₹{stock.stock.dayHigh?.toFixed(2) || 'N/A'}</Text>
                  </Flex>
                  <Flex justify="space-between">
                    <Text color="gray.500">Day Low</Text>
                    <Text fontWeight="medium">₹{stock.stock.dayLow?.toFixed(2) || 'N/A'}</Text>
                  </Flex>
                </VStack>
              </GridItem>
              
              <GridItem>
                <VStack align="stretch" spacing={3}>
                  <Flex justify="space-between">
                    <Text color="gray.500">Volume</Text>
                    <Text fontWeight="medium">{stock.stock.volume.toLocaleString()}</Text>
                  </Flex>
                  {stock.stock.marketCap && (
                    <Flex justify="space-between">
                      <Text color="gray.500">Market Cap</Text>
                      <Text fontWeight="medium">₹{(stock.stock.marketCap / 10000000).toFixed(2)} Cr</Text>
                    </Flex>
                  )}
                  {stock.stock.high52W && (
                    <Flex justify="space-between">
                      <Text color="gray.500">52W High</Text>
                      <Text fontWeight="medium">₹{stock.stock.high52W.toFixed(2)}</Text>
                    </Flex>
                  )}
                  {stock.stock.low52W && (
                    <Flex justify="space-between">
                      <Text color="gray.500">52W Low</Text>
                      <Text fontWeight="medium">₹{stock.stock.low52W.toFixed(2)}</Text>
                    </Flex>
                  )}
                </VStack>
              </GridItem>
            </Grid>
          </TabPanel>
          
          <TabPanel>
            <VStack align="stretch" spacing={4}>
              <Box>
                <Text fontWeight="medium" mb={2}>Strategy Tags</Text>
                <Flex wrap="wrap" gap={2}>
                  {strategyTags.map((tag, index) => (
                    <Badge key={index} colorScheme="brand" px={2} py={0.5} borderRadius="full">
                      {tag}
                    </Badge>
                  ))}
                </Flex>
              </Box>
              
              <Box>
                <Text fontWeight="medium" mb={2}>Strategy Logic</Text>
                <Text>
                  {getStrategyDescription(strategyTags)}
                </Text>
              </Box>
              
              <Box>
                <Text fontWeight="medium" mb={2}>Confidence Score</Text>
                <HStack>
                  <Text fontWeight="bold" fontSize="lg">{stock.confidence}%</Text>
                  <Badge 
                    colorScheme={stock.confidence > 70 ? "green" : stock.confidence > 40 ? "yellow" : "red"}
                  >
                    {stock.confidence > 70 ? "High" : stock.confidence > 40 ? "Medium" : "Low"}
                  </Badge>
                </HStack>
              </Box>
            </VStack>
          </TabPanel>
        </TabPanels>
      </Tabs>
    </VStack>
  )
}

// Helper function to generate strategy descriptions based on the tags
function getStrategyDescription(strategies: string[]): string {
  const descriptions: {[key: string]: string} = {
    'RSI Oversold': 'The Relative Strength Index (RSI) indicates that this stock is currently oversold, suggesting a potential buying opportunity as the price may reverse and move higher.',
    'MACD Crossover': 'The Moving Average Convergence Divergence (MACD) line has crossed above the signal line, typically indicating a bullish trend is forming.',
    'Bollinger Bounce': 'The price has touched the lower Bollinger Band and is starting to move back toward the middle band, suggesting a potential reversal.',
    'Golden Cross': 'A shorter-term moving average has crossed above a longer-term moving average, potentially indicating the beginning of a