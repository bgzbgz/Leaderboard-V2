/**
 * Centralized Error Handling Utilities
 * Provides consistent error handling across the Fast Track Leaderboard application
 */

export interface AppErrorInterface {
  message: string
  code: string
  details?: unknown
  timestamp: string
}

export interface ErrorContext {
  component?: string
  action?: string
  userId?: string
  additionalData?: Record<string, unknown>
}

export class ErrorHandler {
  /**
   * Handle and categorize different types of errors
   */
  static handle(error: unknown, context?: ErrorContext): AppErrorInterface {
    const timestamp = new Date().toISOString()
    
    // Log error for debugging
    console.error('Error occurred:', {
      error,
      context,
      timestamp
    })

    // Handle Supabase errors
    if (error && typeof error === 'object' && 'code' in error) {
      return this.handleSupabaseError(error, context, timestamp)
    }

    // Handle network errors
    if (error && typeof error === 'object' && 'message' in error && 
        typeof error.message === 'string' && 
        (error.message.includes('network') || error.message.includes('fetch'))) {
      return {
        message: 'Network error. Please check your internet connection and try again.',
        code: 'NETWORK_ERROR',
        details: error,
        timestamp
      }
    }

    // Handle authentication errors
    if (error && typeof error === 'object' && 'message' in error && 
        typeof error.message === 'string' && 
        (error.message.includes('JWT') || error.message.includes('auth'))) {
      return {
        message: 'Session expired. Please log in again.',
        code: 'AUTH_ERROR',
        details: error,
        timestamp
      }
    }

    // Handle validation errors
    if (error && typeof error === 'object' && 'message' in error && 
        typeof error.message === 'string' && 
        (error.message.includes('validation') || error.message.includes('required'))) {
      return {
        message: error.message || 'Please check your input and try again.',
        code: 'VALIDATION_ERROR',
        details: error,
        timestamp
      }
    }

    // Handle database errors
    if (error && typeof error === 'object' && 'message' in error && 
        typeof error.message === 'string' && 
        (error.message.includes('database') || error.message.includes('constraint'))) {
      return {
        message: 'Database error occurred. Please try again later.',
        code: 'DATABASE_ERROR',
        details: error,
        timestamp
      }
    }

    // Default error handling
    const errorMessage = error && typeof error === 'object' && 'message' in error && 
      typeof error.message === 'string' ? error.message : 'An unexpected error occurred. Please try again.';
    
    return {
      message: errorMessage,
      code: 'UNKNOWN_ERROR',
      details: error,
      timestamp
    }
  }

  /**
   * Handle Supabase-specific errors
   */
  private static handleSupabaseError(error: unknown, context?: ErrorContext, timestamp?: string): AppErrorInterface {
    const timestampValue = timestamp || new Date().toISOString()

    if (error && typeof error === 'object' && 'code' in error) {
      const errorCode = error.code as string;
      switch (errorCode) {
      case 'PGRST116':
        return {
          message: 'The requested data was not found.',
          code: 'NOT_FOUND',
          details: error,
          timestamp: timestampValue
        }
      
      case '23505': // Unique constraint violation
        return {
          message: 'This item already exists. Please use a different value.',
          code: 'DUPLICATE_ERROR',
          details: error,
          timestamp: timestampValue
        }
      
      case '23503': // Foreign key constraint violation
        return {
          message: 'Cannot perform this action due to data dependencies.',
          code: 'CONSTRAINT_ERROR',
          details: error,
          timestamp: timestampValue
        }
      
      case '42501': // Insufficient privilege
        return {
          message: 'You do not have permission to perform this action.',
          code: 'PERMISSION_ERROR',
          details: error,
          timestamp: timestampValue
        }
      
      case 'PGRST301': // JWT expired
        return {
          message: 'Your session has expired. Please log in again.',
          code: 'AUTH_ERROR',
          details: error,
          timestamp: timestampValue
        }
      
      default:
        const errorMessage = error && typeof error === 'object' && 'message' in error && 
          typeof error.message === 'string' ? error.message : 'Database operation failed. Please try again.';
        return {
          message: errorMessage,
          code: 'DATABASE_ERROR',
          details: error,
          timestamp: timestampValue
        }
      }
    }
    
    // Fallback for non-object errors
    return {
      message: 'Database operation failed. Please try again.',
      code: 'DATABASE_ERROR',
      details: error,
      timestamp: timestampValue
    }
  }

  /**
   * Create user-friendly error messages
   */
  static getUserFriendlyMessage(error: AppErrorInterface): string {
    // Return the message as-is for now, but this could be enhanced
    // to provide more contextual messages based on the error code
    return error.message
  }

  /**
   * Check if an error is retryable
   */
  static isRetryable(error: AppErrorInterface): boolean {
    const retryableCodes = ['NETWORK_ERROR', 'DATABASE_ERROR', 'UNKNOWN_ERROR']
    return retryableCodes.includes(error.code)
  }

  /**
   * Get error severity level
   */
  static getSeverity(error: AppErrorInterface): 'low' | 'medium' | 'high' | 'critical' {
    switch (error.code) {
      case 'AUTH_ERROR':
      case 'PERMISSION_ERROR':
        return 'high'
      case 'NETWORK_ERROR':
      case 'DATABASE_ERROR':
        return 'medium'
      case 'VALIDATION_ERROR':
      case 'NOT_FOUND':
        return 'low'
      case 'UNKNOWN_ERROR':
        return 'critical'
      default:
        return 'medium'
    }
  }
}

/**
 * Custom error class for application-specific errors
 */
export class AppError extends Error {
  public code: string
  public details?: unknown
  public timestamp: string

  constructor(message: string, code: string, details?: unknown) {
    super(message)
    this.name = 'AppError'
    this.code = code
    this.details = details
    this.timestamp = new Date().toISOString()
  }
}

/**
 * Error boundary hook for React components
 */
export const useErrorHandler = () => {
  const handleError = (error: unknown, context?: ErrorContext) => {
    const appError = ErrorHandler.handle(error, context)
    
    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Error handled:', appError)
    }
    
    return appError
  }

  return { handleError }
}
