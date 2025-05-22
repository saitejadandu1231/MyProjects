import React, { useState, useContext } from 'react';
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Input,
  VStack,
  HStack,
  Heading,
  Text,
  useColorModeValue,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  Divider,
  Flex,
  IconButton,
  useToast,
  FormHelperText,
  Tooltip,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  Select,
  Badge,
} from '@chakra-ui/react';
import { InfoIcon, AddIcon, DeleteIcon } from '@chakra-ui/icons';
import { ManualStockInput as ManualStockInputType } from '../types';
import { StockContext } from '../contexts/StockContext';

interface ManualStockInputProps {
  onAnalysisComplete?: () => void; // Optional callback
}

const ManualStockInput: React.FC<ManualStockInputProps> = ({ 
  onAnalysisComplete 
}) => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const toast = useToast();
  const { analyzeManualStock, setIsLoading, setError } = useContext(StockContext);
  
  const [stockInput, setStockInput] = useState<ManualStockInputType>({
    symbol: '',
    name: '',
    price: 0,
    open: 0,
    high: 0,
    low: 0,
    previousClose: 0,
    volume: 0,
    lastUpdated: new Date().toISOString(),
    historicalPrices: [
      { date: new Date(Date.now() - 24*60*60*1000).toISOString().split('T')[0], price: 0 },
      { date: new Date(Date.now() - 2*24*60*60*1000).toISOString().split('T')[0], price: 0 },
      { date: new Date(Date.now() - 3*24*60*60*1000).toISOString().split('T')[0], price: 0 },
    ],
    tradeType: 'delivery', // Default trade type
    timeFrame: '1d' // Default time frame
  });

  const bgColor = useColorModeValue('white', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.600');

  const handleChange = (field: string, value: string | number) => {
    setStockInput(prev => ({ ...prev, [field]: value }));
  };

  const handleHistoricalPriceChange = (index: number, value: number) => {
    setStockInput(prev => {
      const updatedPrices = [...(prev.historicalPrices || [])];
      updatedPrices[index] = { ...updatedPrices[index], price: value };
      return { ...prev, historicalPrices: updatedPrices };
    });
  };

  const addHistoricalPrice = () => {
    const newDate = new Date();
    if (stockInput.historicalPrices && stockInput.historicalPrices.length > 0) {
      const lastDate = new Date(stockInput.historicalPrices[stockInput.historicalPrices.length - 1].date);
      newDate.setDate(lastDate.getDate() - 1);
    } else {
      newDate.setDate(newDate.getDate() - 1);
    }

    setStockInput(prev => ({
      ...prev,
      historicalPrices: [
        ...(prev.historicalPrices || []),
        { date: newDate.toISOString().split('T')[0], price: prev.price },
      ],
    }));
  };

  const removeHistoricalPrice = (index: number) => {
    setStockInput(prev => {
      const updatedPrices = [...(prev.historicalPrices || [])];
      updatedPrices.splice(index, 1);
      return { ...prev, historicalPrices: updatedPrices };
    });
  };

  const handleSubmit = async () => {
    // Basic validation
    if (!stockInput.symbol || !stockInput.name || stockInput.price <= 0) {
      toast({
        title: 'Validation Error',
        description: 'Please fill in all required fields with valid values.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      
      if (analyzeManualStock) {
        // Set last updated to current time
        const inputWithTimestamp = {
          ...stockInput,
          lastUpdated: new Date().toISOString(),
        };

        await analyzeManualStock(inputWithTimestamp);
        
        toast({
          title: 'Analysis Complete',
          description: 'Stock data has been analyzed successfully.',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
        
        onClose();
        
        // Only call onAnalysisComplete if it exists
        if (typeof onAnalysisComplete === 'function') {
          onAnalysisComplete();
        }
      } else {
        throw new Error('Analysis function not available');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      setError(errorMessage);
      toast({
        title: 'Analysis Failed',
        description: errorMessage,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Button colorScheme="blue" onClick={onOpen} size="sm">
        Enter Custom Stock Data
      </Button>

      <Modal isOpen={isOpen} onClose={onClose} size="xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Enter Custom Stock Data</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Text mb={4}>
              Enter your stock data for analysis. The system will use this data to generate 
              technical indicators and provide recommendations.
            </Text>
            
            <VStack spacing={4} align="stretch" bg={bgColor} borderWidth="1px" borderColor={borderColor} borderRadius="md" p={4}>
              {/* Stock Identity */}
              <HStack spacing={4}>
                <FormControl isRequired>
                  <FormLabel>Symbol</FormLabel>
                  <Input 
                    value={stockInput.symbol} 
                    onChange={(e) => handleChange('symbol', e.target.value.toUpperCase())}
                    placeholder="e.g., AAPL" 
                  />
                </FormControl>
                
                <FormControl isRequired>
                  <FormLabel>Company Name</FormLabel>
                  <Input 
                    value={stockInput.name} 
                    onChange={(e) => handleChange('name', e.target.value)} 
                    placeholder="e.g., Apple Inc."
                  />
                </FormControl>
              </HStack>

              {/* Trade Type Selection */}
              <FormControl isRequired>
                <FormLabel>Trade Type</FormLabel>
                <HStack>
                  <Select
                    value={stockInput.tradeType}
                    onChange={(e) => handleChange('tradeType', e.target.value)}
                  >
                    <option value="intraday">Intraday</option>
                    <option value="delivery">Delivery</option>
                    <option value="swing">Swing Trade</option>
                    <option value="longTerm">Long Term</option>
                  </Select>
                  
                  {stockInput.tradeType === 'intraday' && (
                    <Badge colorScheme="blue">Same day</Badge>
                  )}
                  {stockInput.tradeType === 'delivery' && (
                    <Badge colorScheme="teal">Few days</Badge>
                  )}
                  {stockInput.tradeType === 'swing' && (
                    <Badge colorScheme="purple">Days to weeks</Badge>
                  )}
                  {stockInput.tradeType === 'longTerm' && (
                    <Badge colorScheme="green">Months+</Badge>
                  )}
                </HStack>
              </FormControl>

              {/* Time Frame Selection - changes based on trade type */}
              <FormControl isRequired>
                <FormLabel>{stockInput.tradeType === 'intraday' ? 'Time Frame' : 'History Period'}</FormLabel>
                {stockInput.tradeType === 'intraday' ? (
                  <Select
                    value={stockInput.timeFrame}
                    onChange={(e) => handleChange('timeFrame', e.target.value)}
                  >
                    <option value="1m">1 Minute</option>
                    <option value="5m">5 Minutes</option>
                    <option value="15m">15 Minutes</option>
                    <option value="30m">30 Minutes</option>
                    <option value="1h">1 Hour</option>
                  </Select>
                ) : (
                  <Select
                    value={stockInput.timeFrame}
                    onChange={(e) => handleChange('timeFrame', e.target.value)}
                  >
                    <option value="1d">1 Day</option>
                    <option value="5d">5 Days</option>
                    <option value="1mo">1 Month</option>
                    <option value="3mo">3 Months</option>
                    <option value="6mo">6 Months</option>
                    <option value="1y">1 Year</option>
                    <option value="2y">2 Years</option>
                  </Select>
                )}
              </FormControl>

              {/* Current Price Data */}
              <Heading size="sm" mt={2}>Current Price Information</Heading>
              <Divider />
              
              <HStack spacing={4}>
                <FormControl isRequired>
                  <FormLabel>Current Price (₹)</FormLabel>
                  <NumberInput 
                    min={0} 
                    precision={2} 
                    value={stockInput.price} 
                    onChange={(_, val) => handleChange('price', val)}
                  >
                    <NumberInputField />
                    <NumberInputStepper>
                      <NumberIncrementStepper />
                      <NumberDecrementStepper />
                    </NumberInputStepper>
                  </NumberInput>
                </FormControl>
                
                <FormControl isRequired>
                  <FormLabel>Previous Close (₹)</FormLabel>
                  <NumberInput 
                    min={0} 
                    precision={2} 
                    value={stockInput.previousClose} 
                    onChange={(_, val) => handleChange('previousClose', val)}
                  >
                    <NumberInputField />
                    <NumberInputStepper>
                      <NumberIncrementStepper />
                      <NumberDecrementStepper />
                    </NumberInputStepper>
                  </NumberInput>
                </FormControl>
              </HStack>

              <HStack spacing={4}>
                <FormControl isRequired>
                  <FormLabel>Open (₹)</FormLabel>
                  <NumberInput 
                    min={0} 
                    precision={2} 
                    value={stockInput.open} 
                    onChange={(_, val) => handleChange('open', val)}
                  >
                    <NumberInputField />
                    <NumberInputStepper>
                      <NumberIncrementStepper />
                      <NumberDecrementStepper />
                    </NumberInputStepper>
                  </NumberInput>
                </FormControl>
                
                <FormControl isRequired>
                  <FormLabel>Day High (₹)</FormLabel>
                  <NumberInput 
                    min={0} 
                    precision={2} 
                    value={stockInput.high} 
                    onChange={(_, val) => handleChange('high', val)}
                  >
                    <NumberInputField />
                    <NumberInputStepper>
                      <NumberIncrementStepper />
                      <NumberDecrementStepper />
                    </NumberInputStepper>
                  </NumberInput>
                </FormControl>
                
                <FormControl isRequired>
                  <FormLabel>Day Low (₹)</FormLabel>
                  <NumberInput 
                    min={0} 
                    precision={2} 
                    value={stockInput.low} 
                    onChange={(_, val) => handleChange('low', val)}
                  >
                    <NumberInputField />
                    <NumberInputStepper>
                      <NumberIncrementStepper />
                      <NumberDecrementStepper />
                    </NumberInputStepper>
                  </NumberInput>
                </FormControl>
              </HStack>

              <FormControl isRequired>
                <FormLabel>Volume</FormLabel>
                <NumberInput 
                  min={0} 
                  step={1000}
                  value={stockInput.volume} 
                  onChange={(_, val) => handleChange('volume', val)}
                >
                  <NumberInputField />
                  <NumberInputStepper>
                    <NumberIncrementStepper />
                    <NumberDecrementStepper />
                  </NumberInputStepper>
                </NumberInput>
                <FormHelperText>Number of shares traded today</FormHelperText>
              </FormControl>

              {/* Historical Prices */}
              <Box mt={4}>
                <HStack justify="space-between" mb={2}>
                  <Heading size="sm">Historical Prices</Heading>
                  <Tooltip label="Add more historical price points for better analysis">
                    <IconButton
                      aria-label="Add historical price"
                      icon={<AddIcon />}
                      size="sm"
                      onClick={addHistoricalPrice}
                    />
                  </Tooltip>
                </HStack>
                <Divider mb={3} />
                
                {stockInput.historicalPrices && stockInput.historicalPrices.map((price, index) => (
                  <Flex key={index} mb={2} align="center">
                    <Text minWidth="100px" fontSize="sm">{price.date}</Text>
                    <NumberInput 
                      min={0} 
                      precision={2} 
                      value={price.price} 
                      onChange={(_, val) => handleHistoricalPriceChange(index, val)}
                      size="sm"
                      flex={1}
                    >
                      <NumberInputField placeholder="Price (₹)" />
                      <NumberInputStepper>
                        <NumberIncrementStepper />
                        <NumberDecrementStepper />
                      </NumberInputStepper>
                    </NumberInput>
                    <IconButton
                      aria-label="Remove price point"
                      icon={<DeleteIcon />}
                      size="sm"
                      variant="ghost"
                      colorScheme="red"
                      ml={2}
                      onClick={() => removeHistoricalPrice(index)}
                      isDisabled={stockInput.historicalPrices?.length === 1}
                    />
                  </Flex>
                ))}
                <Text fontSize="xs" color="gray.500" mt={1}>
                  <InfoIcon mr={1} boxSize={3} />
                  More historical data points provide more accurate technical analysis
                </Text>
              </Box>
            </VStack>
          </ModalBody>

          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onClose}>
              Cancel
            </Button>
            <Button colorScheme="blue" onClick={handleSubmit}>
              Analyze Stock
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
};

export default ManualStockInput;