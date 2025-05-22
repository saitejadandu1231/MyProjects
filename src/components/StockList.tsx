import React, { useState, useEffect } from 'react'
import {
  Box,
  Text,
  VStack,
  HStack,
  List,
  ListItem,
  Flex,
  Badge,
  Input,
  InputGroup,
  InputLeftElement,
  useColorModeValue,
  Divider,
  SlideFade,
  Fade,
} from '@chakra-ui/react'
import { SearchIcon, TriangleUpIcon, TriangleDownIcon } from '@chakra-ui/icons'
import { StockRecommendation } from '../types'
import SkeletonLoader from './ui/SkeletonLoader'

interface StockListProps {
  recommendations: StockRecommendation[]
  selectedSymbol: string | null
  onSelectStock: (stock: StockRecommendation) => void
  isLoading: boolean
}

const StockList: React.FC<StockListProps> = ({
  recommendations,
  selectedSymbol,
  onSelectStock,
  isLoading,
}) => {
  const [searchQuery, setSearchQuery] = useState('')
  const [filteredStocks, setFilteredStocks] = useState<StockRecommendation[]>(recommendations)

  // Background colors for the component
  const bgColor = useColorModeValue('white', 'gray.700')
  const borderColor = useColorModeValue('gray.200', 'gray.600')
  const hoverBg = useColorModeValue('gray.50', 'gray.600')
  const selectedBg = useColorModeValue('blue.50', 'blue.900')

  // Update filtered stocks when stocks or search query changes
  useEffect(() => {
    // Initialize with empty array to prevent undefined errors
    const safeRecommendations = recommendations || [];
    
    if (searchQuery.trim() === '') {
      setFilteredStocks(safeRecommendations);
    } else {
      const query = searchQuery.toLowerCase();
      setFilteredStocks(
        safeRecommendations.filter(
          (recommendation) =>
            recommendation.stock.symbol.toLowerCase().includes(query) ||
            recommendation.stock.name.toLowerCase().includes(query)
        )
      );
    }
  }, [recommendations, searchQuery])

  // Format price change with appropriate color and icon
  const renderPriceChange = (change: number, changePercent: number) => {
    const isPositive = change >= 0
    const color = isPositive ? 'green.500' : 'red.500'
    const Icon = isPositive ? TriangleUpIcon : TriangleDownIcon

    return (
      <HStack spacing={1} color={color}>
        <Icon boxSize={3} />
        <Text fontSize="sm" fontWeight="medium">
          {Math.abs(change).toFixed(2)} ({Math.abs(changePercent).toFixed(2)}%)
        </Text>
      </HStack>
    )
  }

  return (
    <Box
      borderRadius="lg"
      borderWidth="1px"
      p={4}
      bg={bgColor}
      borderColor={borderColor}
      minH="400px"
      maxH="700px"
      overflowY="auto"
      display="flex"
      flexDirection="column"
    >
      <SlideFade in={true} offsetY="-20px">
        <Text fontWeight="bold" mb={4}>
          Indian Stocks
        </Text>

        <InputGroup size="sm" mb={4}>
          <InputLeftElement pointerEvents="none">
            <SearchIcon color="gray.400" />
          </InputLeftElement>
          <Input
            placeholder="Search stocks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            borderRadius="md"
          />
        </InputGroup>
      </SlideFade>

      {isLoading ? (
        <SkeletonLoader type="list-item" count={6} />
      ) : filteredStocks.length === 0 ? (
        <Flex
          justifyContent="center"
          alignItems="center"
          flex={1}
          py={10}
        >
          <Fade in={true}>
            <Text color="gray.500">No stocks found</Text>
          </Fade>
        </Flex>
      ) : (
        <List spacing={1} flex={1}>
          {filteredStocks.map((recommendation, index) => {
            const stock = recommendation.stock;
            const delay = index * 0.05;
            
            return (
              <ListItem
                key={stock.symbol}
                onClick={() => onSelectStock(recommendation)}
                borderRadius="md"
                p={2}
                cursor="pointer"
                bg={selectedSymbol === stock.symbol ? selectedBg : 'transparent'}
                _hover={{ bg: selectedSymbol === stock.symbol ? selectedBg : hoverBg }}
                transition="all 0.2s"
                sx={{
                  opacity: 0,
                  animation: `fadeIn 0.3s ease-in-out forwards`,
                  animationDelay: `${delay}s`,
                  transform: 'translateY(10px)',
                }}
              >
                <VStack align="stretch" spacing={1}>
                  <Flex justify="space-between" align="center">
                    <HStack>
                      <Text fontWeight="bold" fontSize="md">
                        {stock.symbol.replace('.NS', '')}
                      </Text>
                      {stock.volume > 1000000 && (
                        <Badge colorScheme="purple" variant="outline" fontSize="2xs">
                          High Vol
                        </Badge>
                      )}
                    </HStack>
                    <Text
                      fontWeight="semibold"
                      fontSize="md"
                    >
                      ₹{stock.price.toFixed(2)}
                    </Text>
                  </Flex>

                  <Flex justify="space-between" align="center">
                    <Text fontSize="xs" color="gray.500" noOfLines={1}>
                      {stock.name}
                    </Text>
                    {renderPriceChange(stock.change, stock.changePercent)}
                  </Flex>
                </VStack>
                <Divider mt={2} opacity={0.4} />
              </ListItem>
            );
          })}
        </List>
      )}
    </Box>
  )
}

export default StockList;