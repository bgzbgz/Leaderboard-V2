/**
 * Loading Components
 * Provides consistent loading UI components across the Fast Track Leaderboard application
 */

import React from 'react'

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  size = 'md', 
  className = '' 
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12'
  }

  return (
    <div className={`animate-spin rounded-full border-2 border-gray-300 border-t-black ${sizeClasses[size]} ${className}`} />
  )
}

interface LoadingOverlayProps {
  isLoading: boolean
  children: React.ReactNode
  message?: string
  className?: string
}

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({ 
  isLoading, 
  children, 
  message = 'Loading...',
  className = ''
}) => {
  if (!isLoading) return <>{children}</>

  return (
    <div className={`relative ${className}`}>
      {children}
      <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-10">
        <div className="flex flex-col items-center space-y-4">
          <LoadingSpinner size="lg" />
          <p className="text-gray-600 font-body">{message}</p>
        </div>
      </div>
    </div>
  )
}

interface LoadingButtonProps {
  isLoading: boolean
  children: React.ReactNode
  onClick?: () => void
  disabled?: boolean
  className?: string
  loadingText?: string
}

export const LoadingButton: React.FC<LoadingButtonProps> = ({ 
  isLoading, 
  children, 
  onClick,
  disabled = false,
  className = '',
  loadingText = 'Loading...'
}) => {
  return (
    <button
      onClick={onClick}
      disabled={disabled || isLoading}
      className={`flex items-center justify-center space-x-2 ${className} ${
        disabled || isLoading ? 'opacity-50 cursor-not-allowed' : ''
      }`}
    >
      {isLoading && <LoadingSpinner size="sm" />}
      <span>{isLoading ? loadingText : children}</span>
    </button>
  )
}

interface LoadingCardProps {
  isLoading: boolean
  children: React.ReactNode
  className?: string
  skeletonLines?: number
}

export const LoadingCard: React.FC<LoadingCardProps> = ({ 
  isLoading, 
  children, 
  className = '',
  skeletonLines = 3
}) => {
  if (!isLoading) return <>{children}</>

  return (
    <div className={`bg-white rounded-lg p-6 ${className}`}>
      <div className="animate-pulse space-y-4">
        {Array.from({ length: skeletonLines }).map((_, index) => (
          <div key={index} className="space-y-2">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        ))}
      </div>
    </div>
  )
}

interface LoadingTableProps {
  isLoading: boolean
  children: React.ReactNode
  rows?: number
  columns?: number
  className?: string
}

export const LoadingTable: React.FC<LoadingTableProps> = ({ 
  isLoading, 
  children, 
  rows = 5,
  columns = 4,
  className = ''
}) => {
  if (!isLoading) return <>{children}</>

  return (
    <div className={`overflow-x-auto ${className}`}>
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            {Array.from({ length: columns }).map((_, index) => (
              <th key={index} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <div className="h-4 bg-gray-200 rounded w-20"></div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {Array.from({ length: rows }).map((_, rowIndex) => (
            <tr key={rowIndex}>
              {Array.from({ length: columns }).map((_, colIndex) => (
                <td key={colIndex} className="px-6 py-4 whitespace-nowrap">
                  <div className="h-4 bg-gray-200 rounded w-24"></div>
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

interface LoadingPageProps {
  isLoading: boolean
  children: React.ReactNode
  message?: string
  className?: string
}

export const LoadingPage: React.FC<LoadingPageProps> = ({ 
  isLoading, 
  children, 
  message = 'Loading...',
  className = ''
}) => {
  if (!isLoading) return <>{children}</>

  return (
    <div className={`min-h-screen bg-gray-50 flex items-center justify-center ${className}`}>
      <div className="text-center">
        <LoadingSpinner size="lg" className="mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2 font-heading">{message}</h2>
        <p className="text-gray-600 font-body">Please wait while we load your data...</p>
      </div>
    </div>
  )
}
