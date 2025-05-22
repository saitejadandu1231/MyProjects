import React, { useContext, useEffect, useState } from 'react'
import {
  Box,
  Grid,
  GridItem,
  Heading,
  Text,
  Flex,
  SimpleGrid,
  useToast,
  Alert,
  AlertIcon,
  Spinner,
  Center,
  HStack,
  Spacer,
  VStack,
  Switch,
  FormControl,
  FormLabel,
  useBreakpointValue,
  useColorModeValue,
  SlideFade,
  Fade,
} from '@chakra-ui/react'
import { StockContext } from '../contexts/StockContext'
import FilterPanel from '../components/FilterPanel'
import StockList from '../components/StockList'
import IndicatorTable from '../components/IndicatorTable'
import PriceChart from '../components/PriceChart'
import ManualStockInput from '../components/ManualStockInput'
import RecommendationCard from '../components/RecommendationCard'
import { FilterOptions, StockRecommendation } from '../types'
import { getIndianStockSymbols } from '../services/apiService'
import { analyzeStocks } from '../services/stockAnalyzer'
import SkeletonLoader from '../components/ui/SkeletonLoader'
import ErrorDisplay from '../components/ui/ErrorDisplay'

interface DashboardProps {
  defaultFilters: FilterOptions
}

const Dashboard: React.FC<DashboardProps> = ({ defaultFilters }) => {
  const { recommendations, setRecommendations, isLoading, setIsLoading, error, setError, useAI, setUseAI } = useContext(StockContext)
  const [selectedStock, setSelectedStock] = useState<StockRecommendation | null>(null)
  const [filters, setFilters] = useState<FilterOptions>(defaultFilters)
  const [isLoadingDetails, setIsLoadingDetails] = useState<boolean>(false)
  const [stockListError, setStockListError] = useState<string | null>(null)
  const [chartError, setChartError] = useState<string | null>(null)
  const toast = useToast()
  const columnSpan = useBreakpointValue({ base: 1, md: 2, lg: 3 })
  const bgColor = useColorModeValue('gray.50', 'gray.800')

  // Function to refresh stock list after manual analysis
  const refreshStockList = () => {
    if (recommendations && recommendations.length > 0) {
      // Select the first (newest) recommendation as the current selected stock
      setSelectedStock(recommendations[0]);
      
      // Show success notification
      toast({
        title: 'Stock List Updated',
        description: 'Your custom stock data has been added to the list',
        status: 'success',
        duration: 2000,
        isClosable: true,
      });
    }
  };

  // Load initial stock data
  useEffect(() => {
    const loadStockData = async () => {
      setIsLoading(true)
      setError(null)
      setStockListError(null)
      
      try {
        // Get symbols to analyze
        const symbols = await getIndianStockSymbols()
        
        // Take just the first 10 symbols for initial load (to keep it fast)
        const topSymbols = symbols.slice(0, 10)
        
        // Analyze the stocks
        const results = await analyzeStocks(topSymbols, filters)
        
        // Update context with results
        setRecommendations(results)
        
        // Select the first result as default
        if (results.length > 0) {
          setSelectedStock(results[0])
        }
        
        toast({
          title: 'Stock data loaded',
          description: `Analyzed ${results.length} stocks based on current market conditions.`,
          status: 'success',
          duration: 3000,
          isClosable: true,
        })
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred'
        setError(errorMessage)
        setStockListError(errorMessage)
        toast({
          title: 'Error loading stocks',
          description: errorMessage,
          status: 'error',
          duration: 5000,
          isClosable: true,
        })
      } finally {
        setIsLoading(false)
      }
    }

    loadStockData()
  }, [setRecommendations, setIsLoading, setError, toast, filters])

  // Handle filter changes
  const handleApplyFilters = async (newFilters: FilterOptions) => {
    setFilters(newFilters)
    setIsLoading(true)
    setStockListError(null)
    
    // Re-analyze with new filters
    try {
      const symbols = await getIndianStockSymbols()
      const topSymbols = symbols.slice(0, 10) // Limiting to 10 for performance
      const results = await analyzeStocks(topSymbols, newFilters)
      setRecommendations(results)
      
      // Update selected stock
      if (results.length > 0) {
        // Try to keep the same stock selected if it's still in results
        if (selectedStock) {
          const sameStock = results.find(r => r.stock.symbol === selectedStock.stock.symbol)
          setSelectedStock(sameStock || results[0])
        } else {
          setSelectedStock(results[0])
        }
      } else {
        setSelectedStock(null)
      }
      
      toast({
        title: 'Filters applied',
        description: 'Stock recommendations updated based on new filters.',
        status: 'success',
        duration: 2000,
        isClosable: true,
      })
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred'
      setError(errorMessage)
      setStockListError(errorMessage)
      toast({
        title: 'Error applying filters',
        description: errorMessage,
        status: 'error',
        duration: 5000,
        isClosable: true,
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Handle stock selection
  const handleStockSelect = (stock: StockRecommendation) => {
    setIsLoadingDetails(true)
    setChartError(null)
    setSelectedStock(stock)
    
    // Simulate loading delay for stock details
    setTimeout(() => {
      setIsLoadingDetails(false)
    }, 700)
  }

  // Handle retry
  const handleRetryLoadData = () => {
    handleApplyFilters(filters)
  }

  // Render AI toggle switch
  const renderAIToggle = () => (
    <FormControl display="flex" alignItems="center" mt={4}>
      <FormLabel htmlFor="ai-toggle" mb="0" fontSize="sm">
        Use AI Predictions
      </FormLabel>
      <Switch 
        id="ai-toggle" 
        colorScheme="brand" 
        isChecked={useAI} 
        onChange={(e) => setUseAI(e.target.checked)} 
      />
    </FormControl>
  )
  
  return (
    <Box bg={bgColor} minH="100vh" p={{ base: 2, md: 4 }}>
      <SlideFade in={true} offsetY="-20px">
        <Heading size="lg" mb={6}>Stock Market Dashboard</Heading>
        
        <Grid 
          templateColumns={{ base: 'repeat(1, 1fr)', md: 'repeat(3, 1fr)', lg: 'repeat(4, 1fr)' }} 
          gap={4}
        >
          {/* Left sidebar with filters and stock list */}
          <GridItem colSpan={1} rowSpan={2}>
            <VStack spacing={4} align="stretch">
              <FilterPanel defaultFilters={filters} onApplyFilters={handleApplyFilters} />
              {renderAIToggle()}
              
              <Box h={4} /> {/* Spacer */}
              
              {isLoading ? (
                <SkeletonLoader type="list-item" count={8} />
              ) : stockListError ? (
                <ErrorDisplay 
                  message="Failed to load stocks" 
                  details={stockListError} 
                  onRetry={handleRetryLoadData} 
                />
              ) : (
                <StockList
                  recommendations={recommendations}
                  selectedSymbol={selectedStock?.stock.symbol}
                  onSelectStock={handleStockSelect}
                  isLoading={isLoading}
                />
              )}
            </VStack>
          </GridItem>
          
          {/* Main content area - Charts and details */}
          <GridItem colSpan={{ base: 1, md: 2, lg: 2 }} rowSpan={1}>
            <Box mb={4}>
              {selectedStock ? (
                isLoadingDetails ? (
                  <SkeletonLoader type="chart" height="380px" />
                ) : chartError ? (
                  <ErrorDisplay 
                    message="Failed to load chart data" 
                    details={chartError} 
                  />
                ) : (
                  <PriceChart
                    stockData={selectedStock.stock}
                    historicalData={selectedStock.historicalData || []}
                    timeRange="1d"
                    isLoading={isLoadingDetails}
                  />
                )
              ) : (
                <Flex
                  justifyContent="center"
                  alignItems="center"
                  bg={useColorModeValue('white', 'gray.700')}
                  borderRadius="lg"
                  borderWidth="1px"
                  height="380px"
                  borderColor={useColorModeValue('gray.200', 'gray.600')}
                >
                  <Fade in={true}>
                    <Text color="gray.500">Select a stock to view details</Text>
                  </Fade>
                </Flex>
              )}
            </Box>
            
            {selectedStock && !isLoadingDetails && !chartError ? (
              <IndicatorTable
                indicators={selectedStock.indicators || []}
                isLoading={isLoadingDetails}
              />
            ) : selectedStock && isLoadingDetails ? (
              <SkeletonLoader type="table" count={5} />
            ) : null}
          </GridItem>
          
          {/* Right sidebar with recommendations */}
          <GridItem colSpan={1} rowSpan={2}>
            <VStack spacing={4} align="stretch">
              <ManualStockInput onAnalysisComplete={refreshStockList} />
              
              <Box h={4} /> {/* Spacer */}
              
              <Heading size="md" mb={2}>Top Recommendations</Heading>
              
              {isLoading ? (
                <VStack spacing={4} align="stretch">
                  <SkeletonLoader type="card" />
                  <SkeletonLoader type="card" />
                </VStack>
              ) : error ? (
                <ErrorDisplay 
                  message="Failed to load recommendations" 
                  details={error} 
                  onRetry={handleRetryLoadData} 
                />
              ) : recommendations.length > 0 ? (
                <VStack spacing={4} align="stretch">
                  {recommendations.slice(0, 3).map((rec, index) => (
                    <RecommendationCard
                      key={rec.stock.symbol}
                      recommendation={rec}
                      isLoadingDetails={isLoadingDetails && selectedStock?.stock.symbol === rec.stock.symbol}
                    />
                  ))}
                </VStack>
              ) : (
                <Flex
                  justifyContent="center"
                  alignItems="center"
                  bg={useColorModeValue('white', 'gray.700')}
                  borderRadius="lg"
                  borderWidth="1px"
                  p={6}
                  borderColor={useColorModeValue('gray.200', 'gray.600')}
                >
                  <Text color="gray.500">No recommendations available</Text>
                </Flex>
              )}
            </VStack>
          </GridItem>
        </Grid>
      </SlideFade>
    </Box>
  )
}

export default Dashboard