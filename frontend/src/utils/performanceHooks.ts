import React, { useMemo, useCallback, useRef, useEffect, useState } from 'react';
import { BloodPressureRecord } from '../types';

/**
 * Custom hook to optimize data processing for large datasets
 */
export const useOptimizedData = (records: BloodPressureRecord[], limit?: number) => {
  return useMemo(() => {
    // Limit the dataset size for performance
    const limitedRecords = limit ? records.slice(0, limit) : records;

    // Sort by date (newest first)
    const sortedRecords = limitedRecords.sort((a, b) =>
      new Date(b.measurementTime).getTime() - new Date(a.measurementTime).getTime()
    );

    return sortedRecords;
  }, [records, limit]);
};

/**
 * Custom hook to calculate statistics with memoization
 */
export const useStatistics = (records: BloodPressureRecord[]) => {
  return useMemo(() => {
    if (records.length === 0) {
      return {
        total: 0,
        avgSystolic: 0,
        avgDiastolic: 0,
        avgHeartRate: 0,
        minSystolic: 0,
        maxSystolic: 0,
        minDiastolic: 0,
        maxDiastolic: 0
      };
    }

    const total = records.length;
    const systolicSum = records.reduce((sum, r) => sum + r.systolic, 0);
    const diastolicSum = records.reduce((sum, r) => sum + r.diastolic, 0);

    const heartRateRecords = records.filter(r => r.heartRate && r.heartRate > 0);
    const heartRateSum = heartRateRecords.reduce((sum, r) => sum + (r.heartRate || 0), 0);

    const systolicValues = records.map(r => r.systolic);
    const diastolicValues = records.map(r => r.diastolic);

    return {
      total,
      avgSystolic: Math.round(systolicSum / total),
      avgDiastolic: Math.round(diastolicSum / total),
      avgHeartRate: heartRateRecords.length > 0 ? Math.round(heartRateSum / heartRateRecords.length) : 0,
      minSystolic: Math.min(...systolicValues),
      maxSystolic: Math.max(...systolicValues),
      minDiastolic: Math.min(...diastolicValues),
      maxDiastolic: Math.max(...diastolicValues)
    };
  }, [records]);
};

/**
 * Custom hook for paginated data loading
 */
export const usePagination = <T>(data: T[], itemsPerPage: number = 50) => {
  return useMemo(() => {
    const totalPages = Math.ceil(data.length / itemsPerPage);

    const getPage = (pageNumber: number): T[] => {
      const startIndex = (pageNumber - 1) * itemsPerPage;
      const endIndex = startIndex + itemsPerPage;
      return data.slice(startIndex, endIndex);
    };

    return {
      totalPages,
      totalItems: data.length,
      getPage,
      itemsPerPage
    };
  }, [data, itemsPerPage]);
};

/**
 * Debounce hook for performance optimization
 */
export const useDebounce = <T>(value: T, delay: number): T => {
  const [debouncedValue, setDebouncedValue] = React.useState<T>(value);

  React.useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

/**
 * Throttled function hook for limiting execution frequency
 */
export const useThrottle = <T extends (...args: any[]) => void>(
  callback: T,
  delay: number
): T => {
  const lastCall = useRef<number>(0);

  return useCallback((...args: Parameters<T>) => {
    const now = Date.now();
    if (now - lastCall.current >= delay) {
      lastCall.current = now;
      callback(...args);
    }
  }, [callback, delay]) as T;
};

/**
 * Memory-efficient data caching hook with TTL
 */
const dataCache = new Map<string, { data: any; timestamp: number; ttl: number }>();

export const useDataCache = <T>(
  key: string,
  ttl: number = 5 * 60 * 1000 // 5 minutes default
) => {
  const getCachedData = useCallback((): T | null => {
    const cached = dataCache.get(key);
    if (!cached) return null;

    const now = Date.now();
    if (now - cached.timestamp > cached.ttl) {
      dataCache.delete(key);
      return null;
    }

    return cached.data;
  }, [key]);

  const setCachedData = useCallback((data: T) => {
    dataCache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
  }, [key, ttl]);

  const clearCache = useCallback(() => {
    dataCache.delete(key);
  }, [key]);

  return { getCachedData, setCachedData, clearCache };
};

/**
 * Optimized intersection observer hook for lazy loading
 */
export const useIntersectionObserver = (
  threshold: number = 0.1,
  rootMargin: string = '0px'
) => {
  const [isVisible, setIsVisible] = useState(false);
  const elementRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting);
      },
      { threshold, rootMargin }
    );

    observer.observe(element);

    return () => {
      observer.unobserve(element);
    };
  }, [threshold, rootMargin]);

  return { isVisible, elementRef };
};

/**
 * Performance monitoring hook for elderly user experience
 */
export const usePerformanceMonitor = (componentName: string) => {
  const renderStart = useRef<number>(0);
  const mountTime = useRef<number>(Date.now());

  useEffect(() => {
    renderStart.current = performance.now();
  });

  useEffect(() => {
    const renderTime = performance.now() - renderStart.current;
    const mountDuration = Date.now() - mountTime.current;

    // Log slow renders (>100ms) - important for elderly users
    if (renderTime > 100) {
      console.warn(`⚠️ Slow render [${componentName}]: ${renderTime.toFixed(2)}ms`);
    }

    // Log component mount time
    console.log(`📊 Component [${componentName}] mounted in ${mountDuration}ms`);
  });

  const mark = useCallback((label: string) => {
    const elapsed = performance.now() - renderStart.current;
    console.log(`🔍 Performance mark [${componentName}] ${label}: ${elapsed.toFixed(2)}ms`);
  }, [componentName]);

  return { mark };
};

/**
 * Optimized fetch hook with caching and retry logic for reliability
 */
export const useOptimizedFetch = <T>(
  fetchFunction: () => Promise<T>,
  dependencies: any[] = [],
  options: {
    cacheKey?: string;
    cacheTTL?: number;
    retryAttempts?: number;
    retryDelay?: number;
    background?: boolean;
  } = {}
) => {
  const {
    cacheKey,
    cacheTTL = 5 * 60 * 1000, // 5 minutes
    retryAttempts = 3,
    retryDelay = 1000,
    background = false
  } = options;

  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(!background);
  const [error, setError] = useState<Error | null>(null);

  const { getCachedData, setCachedData } = useDataCache<T>(
    cacheKey || 'default',
    cacheTTL
  );

  const fetchWithRetry = useCallback(async (attempt: number = 0): Promise<T> => {
    try {
      return await fetchFunction();
    } catch (err) {
      if (attempt < retryAttempts) {
        await new Promise(resolve => setTimeout(resolve, retryDelay * Math.pow(2, attempt)));
        return fetchWithRetry(attempt + 1);
      }
      throw err;
    }
  }, [fetchFunction, retryAttempts, retryDelay]);

  const refetch = useCallback(async () => {
    // Try cache first
    if (cacheKey) {
      const cached = getCachedData();
      if (cached) {
        setData(cached);
        if (!background) setLoading(false);
        return;
      }
    }

    if (!background) setLoading(true);
    setError(null);

    try {
      const result = await fetchWithRetry();
      setData(result);

      if (cacheKey) {
        setCachedData(result);
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Fetch failed'));
    } finally {
      if (!background) setLoading(false);
    }
  }, [cacheKey, getCachedData, setCachedData, fetchWithRetry, background]);

  useEffect(() => {
    refetch();
  }, dependencies);

  return { data, loading, error, refetch };
};

/**
 * Memory cleanup hook to prevent memory leaks - important for elderly users who may keep app open long
 */
export const useMemoryCleanup = () => {
  const timers = useRef<Set<NodeJS.Timeout>>(new Set());
  const intervals = useRef<Set<NodeJS.Timer>>(new Set());
  const listeners = useRef<Set<() => void>>(new Set());

  const addTimer = useCallback((timer: NodeJS.Timeout) => {
    timers.current.add(timer);
  }, []);

  const addInterval = useCallback((interval: NodeJS.Timer) => {
    intervals.current.add(interval);
  }, []);

  const addCleanupListener = useCallback((cleanup: () => void) => {
    listeners.current.add(cleanup);
  }, []);

  const cleanup = useCallback(() => {
    // Clear all timers
    timers.current.forEach(clearTimeout);
    timers.current.clear();

    // Clear all intervals
    intervals.current.forEach(clearInterval);
    intervals.current.clear();

    // Run all cleanup listeners
    listeners.current.forEach(listener => listener());
    listeners.current.clear();

    // Clear data cache periodically
    const cacheKeys = Array.from(dataCache.keys());
    const now = Date.now();
    cacheKeys.forEach(key => {
      const cached = dataCache.get(key);
      if (cached && now - cached.timestamp > cached.ttl) {
        dataCache.delete(key);
      }
    });
  }, []);

  useEffect(() => {
    return cleanup;
  }, [cleanup]);

  return { addTimer, addInterval, addCleanupListener, cleanup };
};