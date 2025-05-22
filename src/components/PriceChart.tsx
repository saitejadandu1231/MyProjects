import React, { useMemo, useState } from 'react'
import {
  Box,
  Heading,
  Text,
  Flex,
  Badge,
  useColorModeValue,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  StatArrow,
  StatGroup,
  SimpleGrid,
  Select,
  Spinner,
  ButtonGroup,
  Button,
  HStack,
  ScaleFade,
} from '@chakra-ui/react'
import { StockData, HistoricalData } from '../types'
import SkeletonLoader from './ui/SkeletonLoader'

interface PriceChartProps {
  stockData: StockData | null
  historicalData: HistoricalData[]
  timeRange?: string
  isLoading: boolean
}

const PriceChart = ({
  stockData,
  historicalData,
  timeRange = '1d',
  isLoading,
}: PriceChartProps) => {
  const [activeRange, setActiveRange] = useState(timeRange)
  const [chartType, setChartType] = useState<string>('candle') // candle, line, area

  const bgColor = useColorModeValue('white', 'gray.700')
  const borderColor = useColorModeValue('gray.200', 'gray.600')
  const buttonActiveBg = useColorModeValue('gray.100', 'gray.600')
  const buttonDefaultBg = useColorModeValue('white', 'gray.700')

  // Time range options
  const timeRanges = [
    { label: '1D', value: '1d' },
    { label: '1W', value: '1w' },
    { label: '1M', value: '1m' },
    { label: '3M', value: '3m' },
    { label: '1Y', value: '1y' },
  ]

  // Calculate some basic stats from historical data
  const stats = useMemo(() => {
    if (!historicalData || historicalData.length === 0) {
      return {
        high: stockData?.dayHigh || 0,
        low: stockData?.dayLow || 0,
        avg:
          stockData?.dayHigh && stockData?.dayLow
            ? (stockData.dayHigh + stockData.dayLow) / 2
            : 0,
        volume: stockData?.volume || 0,
      }
    }

    const prices = historicalData.map((d) => d.close)
    const volumes = historicalData.map((d) => d.volume)

    return {
      high: Math.max(...prices),
      low: Math.min(...prices),
      avg: prices.reduce((sum, price) => sum + price, 0) / prices.length,
      volume: volumes.reduce((sum, vol) => sum + vol, 0) / volumes.length,
    }
  }, [historicalData, stockData])

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
    }).format(price)
  }

  const formatVolume = (volume: number) => {
    if (volume >= 10000000) {
      return `${(volume / 10000000).toFixed(2)} Cr`
    } else if (volume >= 100000) {
      return `${(volume / 100000).toFixed(2)} L`
    } else {
      return volume.toLocaleString()
    }
  }

  const handleTimeframeChange = (newTimeframe: string) => {
    setActiveRange(newTimeframe)
    // In a real implementation, you would fetch new data or filter existing data
  }

  const handleChartTypeChange = (type: string) => {
    setChartType(type)
  }

  if (isLoading) {
    return <SkeletonLoader type="chart" height="400px" />
  }

  if (!stockData || historicalData.length === 0) {
    return (
      <Box
        p={4}
        borderRadius="lg"
        borderWidth="1px"
        bg={bgColor}
        borderColor={borderColor}
        height="400px"
        display="flex"
        justifyContent="center"
        alignItems="center"
      >
        <Text color="gray.500">No chart data available</Text>
      </Box>
    )
  }

  // Calculate price change direction and percentage
  const priceChange = stockData.change || 0
  const changePercent = stockData.changePercent || 0
  const isPositive = priceChange >= 0
  const changeColor = isPositive ? 'green.500' : 'red.500'

  return (
    <ScaleFade initialScale={0.95} in={true}>
      <Box
        p={4}
        borderRadius="lg"
        borderWidth="1px"
        bg={bgColor}
        borderColor={borderColor}
        position="relative"
      >
        <Flex justifyContent="space-between" alignItems="flex-start" mb={6}>
          <Box>
            <Heading size="md" mb={1}>
              {stockData.symbol}
            </Heading>
            <Text fontSize="sm" color="gray.500" noOfLines={1} mb={2}>
              {stockData.name}
            </Text>
            <Text fontSize="xl" fontWeight="bold">
              ₹{stockData.price?.toFixed(2)}
            </Text>
            <HStack mt={1}>
              <Text fontSize="sm" fontWeight="medium" color={changeColor}>
                {isPositive ? '+' : ''}
                {priceChange?.toFixed(2)}
              </Text>
              <Text fontSize="sm" fontWeight="medium" color={changeColor}>
                ({isPositive ? '+' : ''}
                {changePercent?.toFixed(2)}%)
              </Text>
            </HStack>
          </Box>

          <HStack spacing={1} mt={1}>
            {timeRanges.map((range) => (
              <Button
                key={range.value}
                size="xs"
                onClick={() => setActiveRange(range.value)}
                bg={
                  activeRange === range.value
                    ? buttonActiveBg
                    : buttonDefaultBg
                }
                borderWidth={1}
                borderColor={
                  activeRange === range.value
                    ? 'brand.500'
                    : borderColor
                }
                color={
                  activeRange === range.value ? 'brand.500' : 'inherit'
                }
                _hover={{
                  bg: buttonActiveBg,
                  color: 'brand.500',
                }}
                style={{ transition: 'all 0.2s ease' }}
              >
                {range.label}
              </Button>
            ))}
          </HStack>
        </Flex>

        <Box
          height="300px"
          borderRadius="md"
          position="relative"
          className="chart-container"
          sx={{
            animation: 'fadeIn 0.5s ease-in-out forwards',
          }}
        >
          {/* This is where your actual chart would go */}
          {/* Placeholder for chart */}
          <Box
            position="absolute"
            top="0"
            left="0"
            width="100%"
            height="100%"
            bg={`linear-gradient(180deg, 
              ${isPositive ? 'rgba(56, 161, 105, 0.1)' : 'rgba(229, 62, 62, 0.1)'} 0%, 
              rgba(255, 255, 255, 0) 100%)`}
            borderRadius="md"
          >
            {/* Chart placeholder - replace with your actual chart component */}
            <Flex
              height="100%"
              alignItems="center"
              justifyContent="center"
            >
              <Text color="gray.400" fontSize="sm">
                Chart visualization would be displayed here
              </Text>
            </Flex>
          </Box>
        </Box>

        <HStack
          justifyContent="space-between"
          mt={4}
          fontSize="xs"
          color="gray.500"
        >
          <Text>Open: ₹{stockData.open?.toFixed(2)}</Text>
          <Text>High: ₹{stockData.dayHigh?.toFixed(2)}</Text>
          <Text>Low: ₹{stockData.dayLow?.toFixed(2)}</Text>
          <Text>Vol: {stockData.volume?.toLocaleString()}</Text>
        </HStack>
      </Box>
    </ScaleFade>
  )
}

export default PriceChart