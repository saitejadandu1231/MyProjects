import React from 'react';
import {
  Box,
  Skeleton,
  SkeletonCircle,
  SkeletonText,
  Stack,
  useColorModeValue,
} from '@chakra-ui/react';
import { keyframes } from '@emotion/react';

// Define animation keyframes for the pulse effect
const pulseAnimation = keyframes`
  0% { opacity: 0.6; }
  50% { opacity: 0.8; }
  100% { opacity: 0.6; }
`;

interface SkeletonLoaderProps {
  type: 'card' | 'table' | 'chart' | 'list-item' | 'detail';
  count?: number;
  height?: string | number;
  width?: string | number;
  showAnimation?: boolean;
}

const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({
  type,
  count = 1,
  height,
  width,
  showAnimation = true,
}) => {
  const bgColor = useColorModeValue('white', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  
  // Animation style
  const animation = showAnimation ? `${pulseAnimation} 1.5s infinite ease-in-out` : undefined;
  
  // Card skeleton (for recommendation cards)
  if (type === 'card') {
    return (
      <Box
        p={4}
        borderRadius="md"
        borderWidth="1px"
        bg={bgColor}
        borderColor={borderColor}
        width={width || '100%'}
        height={height || 'auto'}
        boxShadow="sm"
        animation={animation}
      >
        <SkeletonText mt={2} noOfLines={1} height="20px" width="70%" />
        <Stack mt={6} spacing={4}>
          <Skeleton height="20px" width="100%" />
          <Skeleton height="20px" width="100%" />
          <Skeleton height="20px" width="70%" />
        </Stack>
      </Box>
    );
  }
  
  // Table skeleton (for indicator tables)
  if (type === 'table') {
    return (
      <Box
        p={4}
        borderRadius="lg"
        borderWidth="1px"
        bg={bgColor}
        borderColor={borderColor}
        animation={animation}
      >
        <Skeleton height="24px" width="60%" mb={6} />
        <Stack spacing={4}>
          {Array(count || 4).fill(0).map((_, index) => (
            <Box key={index} display="flex" justifyContent="space-between">
              <Skeleton height="20px" width="30%" />
              <Skeleton height="20px" width="20%" />
              <Skeleton height="20px" width="20%" />
            </Box>
          ))}
        </Stack>
      </Box>
    );
  }
  
  // Chart skeleton
  if (type === 'chart') {
    return (
      <Box
        p={4}
        borderRadius="lg"
        borderWidth="1px"
        bg={bgColor}
        borderColor={borderColor}
        height={height || "400px"}
        position="relative"
        animation={animation}
      >
        <Skeleton height="24px" width="60%" mb={6} />
        <Stack direction="row" spacing={4} mb={6} justifyContent="space-between">
          {Array(4).fill(0).map((_, index) => (
            <Skeleton key={index} height="40px" width={`${100/4 - 2}%`} />
          ))}
        </Stack>
        <Skeleton height="250px" width="100%" />
      </Box>
    );
  }
  
  // List item skeleton (for stock list)
  if (type === 'list-item') {
    return (
      <Stack spacing={4}>
        {Array(count || 5).fill(0).map((_, index) => (
          <Box 
            key={index}
            p={2}
            animation={animation}
          >
            <Stack>
              <Box display="flex" justifyContent="space-between">
                <Skeleton height="20px" width="30%" />
                <Skeleton height="20px" width="20%" />
              </Box>
              <Box display="flex" justifyContent="space-between" mt={1}>
                <Skeleton height="16px" width="40%" />
                <Skeleton height="16px" width="25%" />
              </Box>
            </Stack>
          </Box>
        ))}
      </Stack>
    );
  }
  
  // Detail skeleton (for stock details)
  if (type === 'detail') {
    return (
      <Stack spacing={6} animation={animation}>
        <Box display="flex" justifyContent="space-between">
          <Stack>
            <Skeleton height="28px" width="180px" />
            <Skeleton height="36px" width="150px" mt={1} />
          </Stack>
          <Skeleton height="120px" width="220px" />
        </Box>
        <Skeleton height="400px" width="100%" />
      </Stack>
    );
  }
  
  // Default fallback
  return (
    <SkeletonText mt="4" noOfLines={count || 3} spacing="4" animation={animation} />
  );
};

export default SkeletonLoader;