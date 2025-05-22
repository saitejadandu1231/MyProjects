import React, { lazy, Suspense } from 'react'
import { ChakraProvider, Box, Center, Spinner } from '@chakra-ui/react'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom'
import theme from './theme'
import Header from './components/Header'
import { StockProvider } from './contexts/StockContext'
import { FilterOptions } from './types'

// Lazy-loaded components
const Dashboard = lazy(() => import('./pages/Dashboard'))

// Default filter options
const defaultFilters: FilterOptions = {
  tradeType: 'delivery',
  timeRange: '1d',
  dayRange: '1mo',
  riskTolerance: 3,
  priceRange: [0, 5000],
  onlyProfitableStocks: false,
  highVolumeOnly: false, 
  includeTechnicalAnalysis: true
}

function App() {
  return (
    <ChakraProvider theme={theme}>
      <StockProvider>
        <Router>
          <Box minH="100vh">
            <Header />
            <Box as="main" p={4}>
              <Suspense fallback={
                <Center h="50vh">
                  <Spinner size="xl" color="brand.500" />
                </Center>
              }>
                <Routes>
                  <Route path="/" element={<Dashboard defaultFilters={defaultFilters} />} />
                </Routes>
              </Suspense>
            </Box>
          </Box>
        </Router>
      </StockProvider>
    </ChakraProvider>
  )
}

export default App