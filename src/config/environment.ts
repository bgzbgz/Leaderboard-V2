/**
 * Environment Configuration
 * Centralized configuration management for the Fast Track Leaderboard application
 */

export const config = {
  // Supabase Configuration
  supabase: {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://mfddgywmqdkunzafshpc.supabase.co',
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1mZGRneXdtcWRrdW56YWZzaHBjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAxNjY4ODgsImV4cCI6MjA3NTc0Mjg4OH0.HoU9cdZP6PCv1pgbDEEI1mqBlhIUXBgZyMBfrCVDT1w'
  },

  // Admin Access Codes
  admin: {
    accessCodes: process.env.ADMIN_ACCESS_CODES?.split(',') || ['ADMIN001', 'ADMIN002', 'ADMIN003']
  },

  // Application Configuration
  app: {
    name: process.env.NEXT_PUBLIC_APP_NAME || 'Fast Track Leaderboard',
    version: process.env.NEXT_PUBLIC_APP_VERSION || '2.0.0',
    environment: process.env.NODE_ENV || 'development'
  },

  // Feature Flags
  features: {
    enableErrorReporting: process.env.NODE_ENV === 'production',
    enableAnalytics: process.env.NODE_ENV === 'production',
    enableDebugMode: process.env.NODE_ENV === 'development'
  },

  // Performance Configuration
  performance: {
    debounceDelay: 300,
    throttleDelay: 1000,
    loadingTimeout: 10000,
    retryAttempts: 3
  }
}

// Validation function to check if required environment variables are set
export const validateEnvironment = (): { isValid: boolean; missing: string[] } => {
  const missing: string[] = []
  
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    missing.push('NEXT_PUBLIC_SUPABASE_URL')
  }
  
  if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    missing.push('NEXT_PUBLIC_SUPABASE_ANON_KEY')
  }
  
  return {
    isValid: missing.length === 0,
    missing
  }
}

// Log configuration in development
if (process.env.NODE_ENV === 'development') {
  console.log('Environment Configuration:', {
    supabase: {
      url: config.supabase.url,
      hasAnonKey: !!config.supabase.anonKey
    },
    admin: {
      accessCodesCount: config.admin.accessCodes.length
    },
    app: config.app,
    features: config.features
  })
}
