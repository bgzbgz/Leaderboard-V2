/**
 * Performance Optimization Hooks
 * Provides hooks for optimizing React component performance
 */

import { useCallback, useMemo, useRef, useEffect, useState } from 'react'

/**
 * Hook for memoizing expensive calculations
 */
export const useMemoizedCallback = <T extends (...args: unknown[]) => unknown>(
  callback: T,
  deps: React.DependencyList
): T => {
  const callbackRef = useRef(callback)
  
  useEffect(() => {
    callbackRef.current = callback
  }, [callback])

  return useCallback(
    ((...args: Parameters<T>) => callbackRef.current(...args)) as T,
    deps
  )
}

/**
 * Hook for debouncing function calls
 */
export const useDebounce = <T extends (...args: unknown[]) => unknown>(
  callback: T,
  delay: number
): T => {
  const timeoutRef = useRef<NodeJS.Timeout | undefined>(undefined)

  const debouncedCallback = useCallback(
    ((...args: Parameters<T>) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
      
      timeoutRef.current = setTimeout(() => {
        callback(...args)
      }, delay)
    }) as T,
    [callback, delay]
  )

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  return debouncedCallback
}

/**
 * Hook for throttling function calls
 */
export const useThrottle = <T extends (...args: unknown[]) => unknown>(
  callback: T,
  delay: number
): T => {
  const lastCallRef = useRef<number>(0)
  const timeoutRef = useRef<NodeJS.Timeout | undefined>(undefined)

  const throttledCallback = useCallback(
    ((...args: Parameters<T>) => {
      const now = Date.now()
      
      if (now - lastCallRef.current >= delay) {
        lastCallRef.current = now
        callback(...args)
      } else {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current)
        }
        
        timeoutRef.current = setTimeout(() => {
          lastCallRef.current = Date.now()
          callback(...args)
        }, delay - (now - lastCallRef.current))
      }
    }) as T,
    [callback, delay]
  )

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  return throttledCallback
}

/**
 * Hook for managing component visibility
 */
export const useVisibility = () => {
  const [isVisible, setIsVisible] = useState(false)
  const [hasBeenVisible, setHasBeenVisible] = useState(false)
  const elementRef = useRef<HTMLElement>(null)

  useEffect(() => {
    const element = elementRef.current
    if (!element) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        const visible = entry.isIntersecting
        setIsVisible(visible)
        if (visible && !hasBeenVisible) {
          setHasBeenVisible(true)
        }
      },
      { threshold: 0.1 }
    )

    observer.observe(element)

    return () => {
      observer.disconnect()
    }
  }, [hasBeenVisible])

  return {
    isVisible,
    hasBeenVisible,
    elementRef
  }
}

/**
 * Hook for managing component mounting state
 */
export const useIsMounted = () => {
  const isMountedRef = useRef(true)

  useEffect(() => {
    return () => {
      isMountedRef.current = false
    }
  }, [])

  return isMountedRef
}

/**
 * Hook for preventing unnecessary re-renders
 */
export const useStableCallback = <T extends (...args: unknown[]) => unknown>(
  callback: T
): T => {
  const callbackRef = useRef(callback)
  
  useEffect(() => {
    callbackRef.current = callback
  })

  return useCallback(
    ((...args: Parameters<T>) => callbackRef.current(...args)) as T,
    []
  )
}

/**
 * Hook for managing expensive computations with caching
 */
export const useCachedComputation = <T>(
  computeFn: () => T,
  deps: React.DependencyList,
  cacheKey?: string
): T => {
  const cacheRef = useRef<Map<string, T>>(new Map())
  const lastDepsRef = useRef<React.DependencyList>([])

  return useMemo(() => {
    const key = cacheKey || JSON.stringify(deps)
    
    // Check if dependencies have changed
    const depsChanged = deps.some((dep, index) => dep !== lastDepsRef.current[index])
    
    if (depsChanged || !cacheRef.current.has(key)) {
      const result = computeFn()
      cacheRef.current.set(key, result)
      lastDepsRef.current = deps
      return result
    }
    
    return cacheRef.current.get(key)!
  }, [computeFn, deps, cacheKey])
}
