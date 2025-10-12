/**
 * Error Display Components
 * Provides consistent error display patterns across the Fast Track Leaderboard application
 */

import React from 'react'
import { AppErrorInterface } from '@/utils/errorHandler'

interface ErrorDisplayProps {
  error: string | AppErrorInterface | null
  onRetry?: () => void
  onDismiss?: () => void
  className?: string
  showRetry?: boolean
  showDismiss?: boolean
}

export const ErrorDisplay: React.FC<ErrorDisplayProps> = ({
  error,
  onRetry,
  onDismiss,
  className = '',
  showRetry = true,
  showDismiss = false
}) => {
  if (!error) return null

  const errorMessage = typeof error === 'string' ? error : error.message
  const errorCode = typeof error === 'object' && 'code' in error ? error.code : 'UNKNOWN_ERROR'

  return (
    <div className={`bg-red-50 border border-red-200 rounded-lg p-4 ${className}`}>
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
        </div>
        <div className="ml-3 flex-1">
          <h3 className="text-sm font-medium text-red-800 font-heading">
            Error
          </h3>
          <div className="mt-2 text-sm text-red-700 font-body">
            <p>{errorMessage}</p>
            {process.env.NODE_ENV === 'development' && typeof error === 'object' && 'code' in error && (
              <p className="mt-1 text-xs text-red-600">
                Error Code: {errorCode}
              </p>
            )}
          </div>
          <div className="mt-4 flex space-x-3">
            {showRetry && onRetry && (
              <button
                type="button"
                onClick={onRetry}
                className="text-sm font-medium text-red-800 hover:text-red-700 underline font-heading"
              >
                Try Again
              </button>
            )}
            {showDismiss && onDismiss && (
              <button
                type="button"
                onClick={onDismiss}
                className="text-sm font-medium text-red-800 hover:text-red-700 underline font-heading"
              >
                Dismiss
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

interface ErrorBoundaryProps {
  error: string | AppErrorInterface | null
  onRetry?: () => void
  className?: string
}

export const ErrorBoundary: React.FC<ErrorBoundaryProps> = ({
  error,
  onRetry,
  className = ''
}) => {
  if (!error) return null

  return (
    <div className={`min-h-screen bg-gray-50 flex items-center justify-center p-4 ${className}`}>
      <div className="max-w-md w-full">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4 font-heading">
            Something went wrong
          </h1>
          <p className="text-gray-600 mb-6 font-body">
            We&apos;re sorry, but something unexpected happened. Please try refreshing the page.
          </p>
          
          <ErrorDisplay
            error={error}
            onRetry={onRetry}
            className="mb-6"
          />

          <div className="flex space-x-4 justify-center">
            {onRetry && (
              <button
                onClick={onRetry}
                className="bg-red-600 text-white px-6 py-3 rounded-lg font-heading hover:bg-red-700 transition-colors"
              >
                Try Again
              </button>
            )}
            <button
              onClick={() => window.location.reload()}
              className="bg-gray-600 text-white px-6 py-3 rounded-lg font-heading hover:bg-gray-700 transition-colors"
            >
              Refresh Page
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

interface InlineErrorProps {
  error: string | null
  className?: string
}

export const InlineError: React.FC<InlineErrorProps> = ({
  error,
  className = ''
}) => {
  if (!error) return null

  return (
    <div className={`text-red-600 text-sm mt-1 font-body ${className}`}>
      {error}
    </div>
  )
}

interface ErrorToastProps {
  error: string | AppErrorInterface | null
  onDismiss: () => void
  className?: string
}

export const ErrorToast: React.FC<ErrorToastProps> = ({
  error,
  onDismiss,
  className = ''
}) => {
  if (!error) return null

  const errorMessage = typeof error === 'string' ? error : error.message

  return (
    <div className={`fixed top-4 right-4 z-50 max-w-sm w-full ${className}`}>
      <div className="bg-red-500 text-white px-4 py-3 rounded-lg shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <svg className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <span className="font-body text-sm">{errorMessage}</span>
          </div>
          <button
            onClick={onDismiss}
            className="ml-4 text-white hover:text-gray-200"
          >
            <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}
