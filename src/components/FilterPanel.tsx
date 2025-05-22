import React, { useState } from 'react';
import {
  Box,
  Heading,
  VStack,
  HStack,
  FormControl,
  FormLabel,
  Select,
  Slider,
  SliderTrack,
  SliderFilledTrack,
  SliderThumb,
  Text,
  Badge,
  Switch,
  Button,
  useColorModeValue,
  Divider,
  Tooltip,
  Icon,
} from '@chakra-ui/react';
import { InfoIcon, RepeatIcon } from '@chakra-ui/icons';
import { FilterOptions } from '../types';

interface FilterPanelProps {
  defaultFilters: FilterOptions;
  onApplyFilters: (filters: FilterOptions) => void;
}

const FilterPanel: React.FC<FilterPanelProps> = ({
  defaultFilters,
  onApplyFilters,
}) => {
  const [filters, setFilters] = useState<FilterOptions>(defaultFilters);
  const [isLoading, setIsLoading] = useState(false);
  
  const bgColor = useColorModeValue('white', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.600');

  // Local state for sliders to avoid excessive updates
  const [riskScore, setRiskScore] = useState(filters.riskTolerance);
  const [minPrice, setMinPrice] = useState(filters.priceRange[0]);
  const [maxPrice, setMaxPrice] = useState(filters.priceRange[1]);

  // Handle risk score change (only update parent when slider is released)
  const handleRiskScoreChange = (value: number) => {
    setRiskScore(value);
  };

  const handleRiskScoreChangeEnd = (value: number) => {
    setFilters({ ...filters, riskTolerance: value });
  };

  // Handle price range changes
  const handleMinPriceChange = (value: number) => {
    setMinPrice(value);
    if (value >= maxPrice) {
      setMaxPrice(value + 100);
    }
  };

  const handleMaxPriceChange = (value: number) => {
    setMaxPrice(value);
    if (value <= minPrice) {
      setMinPrice(value - 100);
    }
  };

  const handlePriceRangeChangeEnd = () => {
    setFilters({ ...filters, priceRange: [minPrice, maxPrice] as [number, number] });
  };

  // Handle other filter changes
  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFilters({ ...filters, [name]: value });
  };

  const handleSwitchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setFilters({ ...filters, [name]: checked });
  };
  
  // Handle submit
  const handleSubmit = () => {
    setIsLoading(true);
    // Apply filters
    onApplyFilters(filters);
    
    // Simulate a delay to show loading state
    setTimeout(() => {
      setIsLoading(false);
    }, 1000);
  };
  
  // Handle refresh
  const onRefresh = () => {
    setIsLoading(true);
    onApplyFilters(filters);
    
    // Simulate a delay to show loading state
    setTimeout(() => {
      setIsLoading(false);
    }, 1000);
  };

  return (
    <Box
      p={4}
      borderRadius="lg"
      borderWidth="1px"
      bg={bgColor}
      borderColor={borderColor}
    >
      <Heading size="md" mb={4}>
        Analysis Filters
      </Heading>

      <VStack spacing={5} align="stretch">
        {/* Trade Type */}
        <FormControl>
          <FormLabel fontSize="sm">Trade Type</FormLabel>
          <HStack>
            <Select
              name="tradeType"
              size="sm"
              value={filters.tradeType}
              onChange={handleSelectChange}
            >
              <option value="intraday">Intraday</option>
              <option value="delivery">Delivery</option>
              <option value="swing">Swing Trade</option>
              <option value="longTerm">Long Term</option>
            </Select>
            {filters.tradeType === 'intraday' && (
              <Badge colorScheme="blue">Same day</Badge>
            )}
            {filters.tradeType === 'delivery' && (
              <Badge colorScheme="teal">Few days</Badge>
            )}
            {filters.tradeType === 'swing' && (
              <Badge colorScheme="purple">Days to weeks</Badge>
            )}
            {filters.tradeType === 'longTerm' && (
              <Badge colorScheme="green">Months+</Badge>
            )}
          </HStack>
        </FormControl>

        <Divider />

        {/* Time Range Selection */}
        <FormControl>
          <FormLabel fontSize="sm">
            {filters.tradeType === 'intraday' ? 'Time Frame' : 'History Period'}
          </FormLabel>
          {filters.tradeType === 'intraday' ? (
            <Select
              name="timeRange"
              size="sm"
              value={filters.timeRange}
              onChange={handleSelectChange}
            >
              <option value="1m">1 Minute</option>
              <option value="5m">5 Minutes</option>
              <option value="15m">15 Minutes</option>
              <option value="30m">30 Minutes</option>
              <option value="1h">1 Hour</option>
            </Select>
          ) : (
            <Select
              name="dayRange"
              size="sm"
              value={filters.dayRange}
              onChange={handleSelectChange}
            >
              <option value="5d">5 Days</option>
              <option value="1mo">1 Month</option>
              <option value="3mo">3 Months</option>
              <option value="6mo">6 Months</option>
              <option value="1y">1 Year</option>
              <option value="2y">2 Years</option>
            </Select>
          )}
        </FormControl>

        {/* Risk Tolerance */}
        <FormControl>
          <FormLabel fontSize="sm">
            <HStack>
              <Text>Risk Tolerance</Text>
              <Tooltip label="Higher risk may yield higher potential returns but with increased volatility">
                <InfoIcon boxSize={3} color="gray.500" />
              </Tooltip>
            </HStack>
          </FormLabel>
          <HStack spacing={5}>
            <Box flex={1}>
              <Slider
                min={1}
                max={5}
                step={1}
                value={riskScore}
                onChange={handleRiskScoreChange}
                onChangeEnd={handleRiskScoreChangeEnd}
              >
                <SliderTrack>
                  <SliderFilledTrack bg={
                    riskScore < 3 ? 'green.500' : 
                    riskScore === 3 ? 'yellow.500' : 'red.500'
                  } />
                </SliderTrack>
                <SliderThumb boxSize={5} />
              </Slider>
              <HStack justifyContent="space-between" mt={1}>
                <Text fontSize="xs">Conservative</Text>
                <Text fontSize="xs">Balanced</Text>
                <Text fontSize="xs">Aggressive</Text>
              </HStack>
            </Box>
            <Badge>
              {riskScore === 1 && 'Very Low'}
              {riskScore === 2 && 'Low'}
              {riskScore === 3 && 'Moderate'}
              {riskScore === 4 && 'High'}
              {riskScore === 5 && 'Very High'}
            </Badge>
          </HStack>
        </FormControl>

        {/* Price Range */}
        <FormControl>
          <FormLabel fontSize="sm">Price Range (₹)</FormLabel>
          <VStack spacing={3}>
            <HStack width="100%" spacing={3}>
              <Text fontSize="xs" w="40px">Min:</Text>
              <Slider
                flex={1}
                min={0}
                max={10000}
                step={100}
                value={minPrice}
                onChange={handleMinPriceChange}
                onChangeEnd={handlePriceRangeChangeEnd}
              >
                <SliderTrack>
                  <SliderFilledTrack />
                </SliderTrack>
                <SliderThumb boxSize={4} />
              </Slider>
              <Text fontSize="xs" w="60px" textAlign="right">
                ₹{minPrice.toLocaleString()}
              </Text>
            </HStack>

            <HStack width="100%" spacing={3}>
              <Text fontSize="xs" w="40px">Max:</Text>
              <Slider
                flex={1}
                min={minPrice + 100}
                max={10000}
                step={100}
                value={maxPrice}
                onChange={handleMaxPriceChange}
                onChangeEnd={handlePriceRangeChangeEnd}
              >
                <SliderTrack>
                  <SliderFilledTrack />
                </SliderTrack>
                <SliderThumb boxSize={4} />
              </Slider>
              <Text fontSize="xs" w="60px" textAlign="right">
                {maxPrice >= 10000 ? '₹10000+' : `₹${maxPrice.toLocaleString()}`}
              </Text>
            </HStack>
          </VStack>
        </FormControl>

        <Divider />

        {/* Additional Filters */}
        <FormControl>
          <FormLabel fontSize="sm">Additional Filters</FormLabel>
          <VStack align="start" spacing={3}>
            <HStack width="100%" justifyContent="space-between">
              <Text fontSize="sm">Show only profitable stocks</Text>
              <Switch
                name="onlyProfitableStocks"
                isChecked={filters.onlyProfitableStocks}
                onChange={handleSwitchChange}
                size="sm"
              />
            </HStack>

            <HStack width="100%" justifyContent="space-between">
              <Text fontSize="sm">High volume stocks</Text>
              <Switch
                name="highVolumeOnly"
                isChecked={filters.highVolumeOnly}
                onChange={handleSwitchChange}
                size="sm"
              />
            </HStack>

            <HStack width="100%" justifyContent="space-between">
              <Text fontSize="sm">Include technical analysis</Text>
              <Switch
                name="includeTechnicalAnalysis"
                isChecked={filters.includeTechnicalAnalysis}
                onChange={handleSwitchChange}
                size="sm"
                defaultChecked
              />
            </HStack>
          </VStack>
        </FormControl>

        <Button
          leftIcon={<RepeatIcon />}
          colorScheme="blue"
          variant="solid"
          size="sm"
          onClick={onRefresh}
          isLoading={isLoading}
          loadingText="Refreshing..."
        >
          Refresh Analysis
        </Button>
      </VStack>
    </Box>
  );
};

export default FilterPanel;