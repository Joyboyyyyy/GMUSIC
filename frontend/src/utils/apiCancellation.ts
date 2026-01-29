import { useEffect, useRef } from 'react';

/**
 * Hook to create cancellable API requests
 * Automatically cancels requests when component unmounts
 */
export const useCancellableRequest = () => {
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    // Create new AbortController
    abortControllerRef.current = new AbortController();

    // Cleanup on unmount
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const createRequest = () => {
    // Create new controller for each request
    const controller = new AbortController();
    
    return {
      signal: controller.signal,
      cancel: () => controller.abort(),
    };
  };

  const cancelAll = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = new AbortController();
    }
  };

  return { createRequest, cancelAll };
};

/**
 * Utility to create a cancellable API request
 */
export const createCancellableRequest = () => {
  const controller = new AbortController();
  
  return {
    signal: controller.signal,
    cancel: () => controller.abort(),
  };
};

/**
 * Check if error is from cancelled request
 */
export const isCancelledError = (error: any): boolean => {
  return error?.name === 'AbortError' || error?.name === 'CanceledError';
};