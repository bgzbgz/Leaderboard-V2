/**
 * Date Handling Utilities
 * Provides robust date parsing, formatting, and validation for the Fast Track Leaderboard application
 */

export interface DateParseResult {
  isValid: boolean
  date: Date | null
  error: string | null
}

export interface DateFormatOptions {
  includeTime?: boolean
  timezone?: string
  locale?: string
}

/**
 * Safely parse a date string with comprehensive error handling
 */
export const safeParseDate = (dateString: string | null | undefined): DateParseResult => {
  if (!dateString) {
    return {
      isValid: false,
      date: null,
      error: 'Date string is empty or null'
    }
  }

  try {
    // Try parsing with Date constructor first
    const parsedDate = new Date(dateString)
    
    // Check if the date is valid
    if (isNaN(parsedDate.getTime())) {
      return {
        isValid: false,
        date: null,
        error: 'Invalid date format'
      }
    }

    // Check for reasonable date range (not too far in past or future)
    const now = new Date()
    const year = parsedDate.getFullYear()
    const currentYear = now.getFullYear()
    
    if (year < 1900 || year > currentYear + 100) {
      return {
        isValid: false,
        date: null,
        error: 'Date is outside reasonable range (1900 - ' + (currentYear + 100) + ')'
      }
    }

    return {
      isValid: true,
      date: parsedDate,
      error: null
    }
  } catch (error) {
    return {
      isValid: false,
      date: null,
      error: `Date parsing error: ${error instanceof Error ? error.message : 'Unknown error'}`
    }
  }
}

/**
 * Format a date with error handling
 */
export const safeFormatDate = (
  date: Date | string | null | undefined,
  options: DateFormatOptions = {}
): string => {
  const parseResult = typeof date === 'string' ? safeParseDate(date) : { isValid: true, date: date as Date, error: null }
  
  if (!parseResult.isValid || !parseResult.date) {
    return 'Invalid Date'
  }

  try {
    const { includeTime = false, timezone = 'UTC', locale = 'en-US' } = options
    
    const formatOptions: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      timeZone: timezone
    }

    if (includeTime) {
      formatOptions.hour = '2-digit'
      formatOptions.minute = '2-digit'
      formatOptions.second = '2-digit'
    }

    return parseResult.date.toLocaleDateString(locale, formatOptions)
  } catch (error) {
    console.error('Date formatting error:', error)
    return 'Invalid Date'
  }
}

/**
 * Calculate relative time (e.g., "2 days ago", "in 3 hours")
 */
export const getRelativeTime = (date: Date | string | null | undefined): string => {
  const parseResult = typeof date === 'string' ? safeParseDate(date) : { isValid: true, date: date as Date, error: null }
  
  if (!parseResult.isValid || !parseResult.date) {
    return 'Invalid Date'
  }

  try {
    const now = new Date()
    const diffInMs = parseResult.date.getTime() - now.getTime()
    const diffInSeconds = Math.floor(diffInMs / 1000)
    const diffInMinutes = Math.floor(diffInSeconds / 60)
    const diffInHours = Math.floor(diffInMinutes / 60)
    const diffInDays = Math.floor(diffInHours / 24)
    const diffInWeeks = Math.floor(diffInDays / 7)
    const diffInMonths = Math.floor(diffInDays / 30)
    const diffInYears = Math.floor(diffInDays / 365)

    if (Math.abs(diffInYears) >= 1) {
      return diffInYears > 0 ? `in ${diffInYears} year${diffInYears > 1 ? 's' : ''}` : `${Math.abs(diffInYears)} year${Math.abs(diffInYears) > 1 ? 's' : ''} ago`
    } else if (Math.abs(diffInMonths) >= 1) {
      return diffInMonths > 0 ? `in ${diffInMonths} month${diffInMonths > 1 ? 's' : ''}` : `${Math.abs(diffInMonths)} month${Math.abs(diffInMonths) > 1 ? 's' : ''} ago`
    } else if (Math.abs(diffInWeeks) >= 1) {
      return diffInWeeks > 0 ? `in ${diffInWeeks} week${diffInWeeks > 1 ? 's' : ''}` : `${Math.abs(diffInWeeks)} week${Math.abs(diffInWeeks) > 1 ? 's' : ''} ago`
    } else if (Math.abs(diffInDays) >= 1) {
      return diffInDays > 0 ? `in ${diffInDays} day${diffInDays > 1 ? 's' : ''}` : `${Math.abs(diffInDays)} day${Math.abs(diffInDays) > 1 ? 's' : ''} ago`
    } else if (Math.abs(diffInHours) >= 1) {
      return diffInHours > 0 ? `in ${diffInHours} hour${diffInHours > 1 ? 's' : ''}` : `${Math.abs(diffInHours)} hour${Math.abs(diffInHours) > 1 ? 's' : ''} ago`
    } else if (Math.abs(diffInMinutes) >= 1) {
      return diffInMinutes > 0 ? `in ${diffInMinutes} minute${diffInMinutes > 1 ? 's' : ''}` : `${Math.abs(diffInMinutes)} minute${Math.abs(diffInMinutes) > 1 ? 's' : ''} ago`
    } else {
      return 'just now'
    }
  } catch (error) {
    console.error('Relative time calculation error:', error)
    return 'Invalid Date'
  }
}

/**
 * Check if a date is in the past
 */
export const isPastDate = (date: Date | string | null | undefined): boolean => {
  const parseResult = typeof date === 'string' ? safeParseDate(date) : { isValid: true, date: date as Date, error: null }
  
  if (!parseResult.isValid || !parseResult.date) {
    return false
  }

  return parseResult.date < new Date()
}

/**
 * Check if a date is in the future
 */
export const isFutureDate = (date: Date | string | null | undefined): boolean => {
  const parseResult = typeof date === 'string' ? safeParseDate(date) : { isValid: true, date: date as Date, error: null }
  
  if (!parseResult.isValid || !parseResult.date) {
    return false
  }

  return parseResult.date > new Date()
}

/**
 * Calculate days between two dates
 */
export const daysBetween = (
  startDate: Date | string | null | undefined,
  endDate: Date | string | null | undefined
): number | null => {
  const startResult = typeof startDate === 'string' ? safeParseDate(startDate) : { isValid: true, date: startDate as Date, error: null }
  const endResult = typeof endDate === 'string' ? safeParseDate(endDate) : { isValid: true, date: endDate as Date, error: null }
  
  if (!startResult.isValid || !startResult.date || !endResult.isValid || !endResult.date) {
    return null
  }

  try {
    const diffInMs = endResult.date.getTime() - startResult.date.getTime()
    return Math.floor(diffInMs / (1000 * 60 * 60 * 24))
  } catch (error) {
    console.error('Days between calculation error:', error)
    return null
  }
}

/**
 * Get start of day
 */
export const getStartOfDay = (date: Date | string | null | undefined): Date | null => {
  const parseResult = typeof date === 'string' ? safeParseDate(date) : { isValid: true, date: date as Date, error: null }
  
  if (!parseResult.isValid || !parseResult.date) {
    return null
  }

  try {
    const startOfDay = new Date(parseResult.date)
    startOfDay.setHours(0, 0, 0, 0)
    return startOfDay
  } catch (error) {
    console.error('Start of day calculation error:', error)
    return null
  }
}

/**
 * Get end of day
 */
export const getEndOfDay = (date: Date | string | null | undefined): Date | null => {
  const parseResult = typeof date === 'string' ? safeParseDate(date) : { isValid: true, date: date as Date, error: null }
  
  if (!parseResult.isValid || !parseResult.date) {
    return null
  }

  try {
    const endOfDay = new Date(parseResult.date)
    endOfDay.setHours(23, 59, 59, 999)
    return endOfDay
  } catch (error) {
    console.error('End of day calculation error:', error)
    return null
  }
}

/**
 * Format date for display in the application
 */
export const formatDisplayDate = (date: Date | string | null | undefined): string => {
  return safeFormatDate(date, { includeTime: false })
}

/**
 * Format date and time for display in the application
 */
export const formatDisplayDateTime = (date: Date | string | null | undefined): string => {
  return safeFormatDate(date, { includeTime: true })
}

/**
 * Validate date range
 */
export const validateDateRange = (
  startDate: Date | string | null | undefined,
  endDate: Date | string | null | undefined
): { isValid: boolean; error: string | null } => {
  const startResult = typeof startDate === 'string' ? safeParseDate(startDate) : { isValid: true, date: startDate as Date, error: null }
  const endResult = typeof endDate === 'string' ? safeParseDate(endDate) : { isValid: true, date: endDate as Date, error: null }
  
  if (!startResult.isValid || !startResult.date) {
    return { isValid: false, error: 'Invalid start date' }
  }
  
  if (!endResult.isValid || !endResult.date) {
    return { isValid: false, error: 'Invalid end date' }
  }
  
  if (startResult.date > endResult.date) {
    return { isValid: false, error: 'Start date must be before end date' }
  }
  
  return { isValid: true, error: null }
}
