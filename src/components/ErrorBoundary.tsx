'use client'

import React, { Component, ErrorInfo, ReactNode } from 'react'
import { ErrorHandler, AppErrorInterface } from '@/utils/errorHandler'

interface Props {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: AppErrorInterface) => void
}

interface State {
  hasError: boolean
  error: AppErrorInterface | null
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI
    const appError = ErrorHandler.handle(error, {
      component: 'ErrorBoundary',
      action: 'getDerivedStateFromError'
    })
    
    return { hasError: true, error: appError }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error details
    const appError = ErrorHandler.handle(error, {
      component: 'ErrorBoundary',
      action: 'componentDidCatch',
      additionalData: {
        errorInfo: errorInfo.componentStack
      }
    })

    this.setState({ error: appError })

    // Call onError callback if provided
    if (this.props.onError) {
      this.props.onError(appError)
    }

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('ErrorBoundary caught an error:', error, errorInfo)
    }
  }

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback
      }

      // Default fallback UI
      return (
        <div className="min-h-screen bg-black flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-8 max-w-md w-full text-center">
            <div className="text-red-500 text-6xl mb-4">⚠️</div>
            <h1 className="text-2xl font-bold text-black mb-4 font-heading">
              Something went wrong
            </h1>
            <p className="text-gray-600 mb-6 font-body">
              We&apos;re sorry, but something unexpected happened. Please try refreshing the page.
            </p>
            
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <div className="bg-gray-100 p-4 rounded text-left text-sm mb-4">
                <p className="font-bold text-red-600">Error Details:</p>
                <p className="text-gray-700">Code: {this.state.error.code}</p>
                <p className="text-gray-700">Message: {this.state.error.message}</p>
                <p className="text-gray-700">Time: {this.state.error.timestamp}</p>
              </div>
            )}
            
            <div className="space-y-3">
              <button
                onClick={() => window.location.reload()}
                className="w-full bg-black text-white py-2 px-4 rounded hover:bg-gray-800 transition-colors font-heading"
              >
                Refresh Page
              </button>
              <button
                onClick={() => window.location.href = '/'}
                className="w-full bg-gray-200 text-black py-2 px-4 rounded hover:bg-gray-300 transition-colors font-heading"
              >
                Go Home
              </button>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

/**
 * Hook for using error boundary functionality in functional components
 */
export const useErrorBoundary = () => {
  const [error, setError] = React.useState<AppErrorInterface | null>(null)

  const resetError = () => setError(null)

  const captureError = (error: unknown, context?: { component?: string; action?: string }) => {
    const appError = ErrorHandler.handle(error, context)
    setError(appError)
    return appError
  }

  // Throw error to be caught by ErrorBoundary
  if (error) {
    throw error
  }

  return { captureError, resetError }
}

export default ErrorBoundary
