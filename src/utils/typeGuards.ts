/**
 * Type Guards and Validation Utilities
 * Provides runtime type checking and validation for the Fast Track Leaderboard application
 */

import { Client, Associate, ClientStatus, Sprint } from '@/types'

/**
 * Type guard to check if a value is a valid Client
 */
export const isValidClient = (data: unknown): data is Client => {
  if (!data || typeof data !== 'object') return false
  
  const obj = data as Record<string, unknown>
  
  return (
    typeof obj.id === 'string' &&
    typeof obj.name === 'string' &&
    typeof obj.accessCode === 'string' &&
    typeof obj.weekNumber === 'number' &&
    typeof obj.onTimeDelivery === 'object' &&
    obj.onTimeDelivery !== null &&
    typeof (obj.onTimeDelivery as Record<string, unknown>).completed === 'number' &&
    typeof (obj.onTimeDelivery as Record<string, unknown>).total === 'number' &&
    Array.isArray(obj.qualityScores) &&
    (obj.qualityScores as unknown[]).every((score: unknown) => typeof score === 'number') &&
    typeof obj.status === 'string' &&
    isValidClientStatus(obj.status) &&
    typeof obj.currentSprint === 'object' &&
    obj.currentSprint !== null &&
    typeof (obj.currentSprint as Record<string, unknown>).number === 'number' &&
    typeof (obj.currentSprint as Record<string, unknown>).name === 'string' &&
    typeof obj.sprintDeadline === 'string' &&
    typeof obj.nextSprint === 'object' &&
    obj.nextSprint !== null &&
    typeof (obj.nextSprint as Record<string, unknown>).number === 'number' &&
    typeof (obj.nextSprint as Record<string, unknown>).name === 'string' &&
    typeof obj.nextSprintRelease === 'string' &&
    typeof obj.startDate === 'string' &&
    typeof obj.programChampion === 'string' &&
    typeof obj.currentGuru === 'string' &&
    Array.isArray(obj.completedSprints) &&
    (obj.completedSprints as unknown[]).every((sprint: unknown) => typeof sprint === 'number') &&
    typeof obj.rank === 'number' &&
    typeof obj.totalClients === 'number' &&
    typeof obj.countryCode === 'string' &&
    typeof obj.associateId === 'string'
  )
}

/**
 * Type guard to check if a value is a valid Associate
 */
export const isValidAssociate = (data: unknown): data is Associate => {
  if (!data || typeof data !== 'object') return false
  
  const obj = data as Record<string, unknown>
  
  return (
    typeof obj.id === 'string' &&
    typeof obj.name === 'string' &&
    typeof obj.accessCode === 'string' &&
    Array.isArray(obj.clients) &&
    (obj.clients as unknown[]).every((clientId: unknown) => typeof clientId === 'string')
  )
}

/**
 * Type guard to check if a value is a valid ClientStatus
 */
export const isValidClientStatus = (status: unknown): status is ClientStatus => {
  const validStatuses: ClientStatus[] = [
    'ON_TIME',
    'DELAYED',
    'GRADUATED',
    'PROGRESS_MEETING',
    'STARTING_SOON'
  ]
  return typeof status === 'string' && validStatuses.includes(status as ClientStatus)
}

/**
 * Type guard to check if a value is a valid Sprint
 */
export const isValidSprint = (data: unknown): data is Sprint => {
  if (!data || typeof data !== 'object') return false
  
  const obj = data as Record<string, unknown>
  
  return (
    typeof obj.number === 'number' &&
    typeof obj.name === 'string' &&
    typeof obj.deadline === 'string' &&
    typeof obj.submitted === 'boolean' &&
    (obj.submittedDate === undefined || typeof obj.submittedDate === 'string') &&
    (obj.qualityScore === undefined || typeof obj.qualityScore === 'number') &&
    typeof obj.onTime === 'boolean'
  )
}

/**
 * Type guard to check if a value is a valid SSDB insights object
 */
export const isValidSSDBInsights = (data: unknown): data is {
  start_insight: string
  stop_insight: string
  do_better_insight: string
} => {
  if (!data || typeof data !== 'object') return false
  
  const obj = data as Record<string, unknown>
  
  return (
    typeof obj.start_insight === 'string' &&
    typeof obj.stop_insight === 'string' &&
    typeof obj.do_better_insight === 'string'
  )
}

/**
 * Type guard to check if a value is a valid Supabase team data
 */
export const isValidSupabaseTeamData = (data: unknown): boolean => {
  if (!data || typeof data !== 'object') return false
  
  const obj = data as Record<string, unknown>
  
  // Check only the absolutely required fields
  const hasRequiredFields = (
    typeof obj.id === 'string' &&
    typeof obj.name === 'string' &&
    typeof obj.access_code === 'string' &&
    typeof obj.status === 'string'
  )
  
  if (!hasRequiredFields) return false
  
  // Check numeric fields (with defaults)
  const hasNumericFields = (
    (typeof obj.week_number === 'number' || obj.week_number === null) &&
    (typeof obj.on_time_completed === 'number' || obj.on_time_completed === null) &&
    (typeof obj.on_time_total === 'number' || obj.on_time_total === null) &&
    (typeof obj.current_sprint_number === 'number' || obj.current_sprint_number === null) &&
    (typeof obj.rank === 'number' || obj.rank === null)
  )
  
  if (!hasNumericFields) return false
  
  // Check string fields (with defaults)
  const hasStringFields = (
    (typeof obj.current_sprint_name === 'string' || obj.current_sprint_name === null) &&
    (typeof obj.sprint_deadline === 'string' || obj.sprint_deadline === null) &&
    (typeof obj.next_sprint_name === 'string' || obj.next_sprint_name === null) &&
    (typeof obj.next_sprint_release === 'string' || obj.next_sprint_release === null) &&
    (typeof obj.start_date === 'string' || obj.start_date === null) &&
    (typeof obj.program_champion === 'string' || obj.program_champion === null) &&
    (typeof obj.current_guru === 'string' || obj.current_guru === null) &&
    (typeof obj.country_code === 'string' || obj.country_code === null) &&
    (typeof obj.associate_id === 'string' || obj.associate_id === null)
  )
  
  if (!hasStringFields) return false
  
  // Check array fields (with defaults)
  const hasArrayFields = (
    (Array.isArray(obj.quality_scores) || obj.quality_scores === null) &&
    (Array.isArray(obj.completed_sprints) || obj.completed_sprints === null)
  )
  
  return hasArrayFields
}

/**
 * Validate and sanitize string input
 */
export const validateString = (value: unknown, fieldName: string, minLength = 1, maxLength = 1000): string => {
  if (typeof value !== 'string') {
    throw new Error(`${fieldName} must be a string`)
  }
  
  const trimmed = value.trim()
  
  if (trimmed.length < minLength) {
    throw new Error(`${fieldName} must be at least ${minLength} characters long`)
  }
  
  if (trimmed.length > maxLength) {
    throw new Error(`${fieldName} must be no more than ${maxLength} characters long`)
  }
  
  return trimmed
}

/**
 * Validate and sanitize number input
 */
export const validateNumber = (value: unknown, fieldName: string, min = 0, max = 1000000): number => {
  const num = Number(value)
  
  if (isNaN(num)) {
    throw new Error(`${fieldName} must be a valid number`)
  }
  
  if (num < min) {
    throw new Error(`${fieldName} must be at least ${min}`)
  }
  
  if (num > max) {
    throw new Error(`${fieldName} must be no more than ${max}`)
  }
  
  return num
}

/**
 * Validate email format
 */
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

/**
 * Validate country code format (2-letter ISO code)
 */
export const validateCountryCode = (code: string): boolean => {
  const countryCodeRegex = /^[A-Z]{2}$/
  return countryCodeRegex.test(code.toUpperCase())
}

/**
 * Validate access code format
 */
export const validateAccessCode = (code: string): boolean => {
  // Access codes should be alphanumeric and at least 6 characters
  const accessCodeRegex = /^[A-Z0-9]{6,}$/
  return accessCodeRegex.test(code.toUpperCase())
}

/**
 * Safe JSON parsing with error handling
 */
export const safeJsonParse = <T>(jsonString: string, fallback: T): T => {
  try {
    return JSON.parse(jsonString)
  } catch {
    return fallback
  }
}

/**
 * Safe date parsing with error handling
 */
export const safeDateParse = (dateString: string | null | undefined): Date | null => {
  if (!dateString) return null
  
  try {
    const date = new Date(dateString)
    if (isNaN(date.getTime())) return null
    return date
  } catch {
    return null
  }
}

/**
 * Validate date string format
 */
export const validateDateString = (dateString: string): boolean => {
  const date = new Date(dateString)
  return !isNaN(date.getTime())
}

/**
 * Type guard for checking if a value is not null or undefined
 */
export const isNotNullish = <T>(value: T | null | undefined): value is T => {
  return value !== null && value !== undefined
}

/**
 * Type guard for checking if a value is a non-empty string
 */
export const isNonEmptyString = (value: unknown): value is string => {
  return typeof value === 'string' && value.trim().length > 0
}

/**
 * Type guard for checking if a value is a positive number
 */
export const isPositiveNumber = (value: unknown): value is number => {
  return typeof value === 'number' && value > 0 && !isNaN(value)
}
