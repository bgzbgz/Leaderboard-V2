/**
 * Loading State Management Hook
 * Provides consistent loading state management across the Fast Track Leaderboard application
 */

import { useState, useCallback, useRef, useEffect } from 'react'

export interface LoadingState {
  loading: boolean
  error: string | null
  data: unknown | null
}

export interface UseLoadingOptions {
  initialLoading?: boolean
  onError?: (error: unknown) => void
  onSuccess?: (data: unknown) => void
}

export const useLoading = (options: UseLoadingOptions = {}) => {
  const { initialLoading = false, onError, onSuccess } = options
  const [loading, setLoading] = useState(initialLoading)
  const [error, setError] = useState<string | null>(null)
  const [data, setData] = useState<unknown>(null)
  const isMountedRef = useRef(true)

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false
    }
  }, [])

  const startLoading = useCallback(() => {
    if (isMountedRef.current) {
      setLoading(true)
      setError(null)
    }
  }, [])

  const stopLoading = useCallback(() => {
    if (isMountedRef.current) {
      setLoading(false)
    }
  }, [])

  const setErrorState = useCallback((errorMessage: string) => {
    if (isMountedRef.current) {
      setError(errorMessage)
      setLoading(false)
    }
  }, [])

  const setDataState = useCallback((newData: unknown) => {
    if (isMountedRef.current) {
      setData(newData)
      setLoading(false)
      setError(null)
    }
  }, [])

  const reset = useCallback(() => {
    if (isMountedRef.current) {
      setLoading(false)
      setError(null)
      setData(null)
    }
  }, [])

  const withLoading = useCallback(async <T>(
    asyncFn: () => Promise<T>,
    options?: {
      onSuccess?: (data: T) => void
      onError?: (error: unknown) => void
    }
  ): Promise<T | null> => {
    if (!isMountedRef.current) return null

    startLoading()
    try {
      const result = await asyncFn()
      
      if (isMountedRef.current) {
        setDataState(result)
        onSuccess?.(result)
        options?.onSuccess?.(result)
      }
      
      return result
    } catch (err) {
      if (isMountedRef.current) {
        const errorMessage = err instanceof Error ? err.message : 'An error occurred'
        setErrorState(errorMessage)
        onError?.(err)
        options?.onError?.(err)
      }
      return null
    }
  }, [startLoading, setDataState, setErrorState, onError, onSuccess])

  return {
    loading,
    error,
    data,
    startLoading,
    stopLoading,
    setError: setErrorState,
    setData: setDataState,
    reset,
    withLoading
  }
}

/**
 * Hook for managing multiple loading states
 */
export const useMultipleLoading = (keys: string[]) => {
  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>(
    keys.reduce((acc, key) => ({ ...acc, [key]: false }), {})
  )

  const setLoading = useCallback((key: string, loading: boolean) => {
    setLoadingStates(prev => ({ ...prev, [key]: loading }))
  }, [])

  const isAnyLoading = Object.values(loadingStates).some(loading => loading)
  const isAllLoading = Object.values(loadingStates).every(loading => loading)

  return {
    loadingStates,
    setLoading,
    isAnyLoading,
    isAllLoading
  }
}

/**
 * Hook for debounced loading states
 */
export const useDebouncedLoading = (delay: number = 300) => {
  const [loading, setLoading] = useState(false)
  const timeoutRef = useRef<NodeJS.Timeout | undefined>(undefined)

  const setDebouncedLoading = useCallback((isLoading: boolean) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    if (isLoading) {
      setLoading(true)
    } else {
      timeoutRef.current = setTimeout(() => {
        setLoading(false)
      }, delay)
    }
  }, [delay])

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  return {
    loading,
    setLoading: setDebouncedLoading
  }
}
