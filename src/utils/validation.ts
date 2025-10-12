/**
 * Input Validation Utilities
 * Provides comprehensive client-side validation for all forms in the Fast Track Leaderboard application
 */

import { useState, useCallback } from 'react'
import { useDebounce } from '@/hooks/usePerformance'

export interface ValidationResult {
  isValid: boolean
  errors: string[]
  warnings: string[]
}

export interface ValidationRule {
  required?: boolean
  minLength?: number
  maxLength?: number
  pattern?: RegExp
  custom?: (value: string) => string | null
  message?: string
}

export interface FormValidationRules {
  [key: string]: ValidationRule
}

/**
 * Validate a single field value
 */
export const validateField = (
  value: string,
  rules: ValidationRule,
  fieldName: string
): ValidationResult => {
  const errors: string[] = []
  const warnings: string[] = []

  // Required validation
  if (rules.required && (!value || value.trim().length === 0)) {
    errors.push(`${fieldName} is required`)
    return { isValid: false, errors, warnings }
  }

  // Skip other validations if value is empty and not required
  if (!value || value.trim().length === 0) {
    return { isValid: true, errors, warnings }
  }

  const trimmedValue = value.trim()

  // Length validations
  if (rules.minLength && trimmedValue.length < rules.minLength) {
    errors.push(`${fieldName} must be at least ${rules.minLength} characters long`)
  }

  if (rules.maxLength && trimmedValue.length > rules.maxLength) {
    errors.push(`${fieldName} must be no more than ${rules.maxLength} characters long`)
  }

  // Pattern validation
  if (rules.pattern && !rules.pattern.test(trimmedValue)) {
    errors.push(rules.message || `${fieldName} format is invalid`)
  }

  // Custom validation
  if (rules.custom) {
    const customError = rules.custom(trimmedValue)
    if (customError) {
      errors.push(customError)
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  }
}

/**
 * Validate an entire form
 */
export const validateForm = (
  formData: Record<string, string>,
  rules: FormValidationRules
): ValidationResult => {
  const allErrors: string[] = []
  const allWarnings: string[] = []

  for (const [fieldName, value] of Object.entries(formData)) {
    const fieldRules = rules[fieldName]
    if (fieldRules) {
      const result = validateField(value, fieldRules, fieldName)
      allErrors.push(...result.errors)
      allWarnings.push(...result.warnings)
    }
  }

  return {
    isValid: allErrors.length === 0,
    errors: allErrors,
    warnings: allWarnings
  }
}

/**
 * Common validation rules
 */
export const commonRules = {
  required: { required: true },
  email: {
    required: true,
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    message: 'Please enter a valid email address'
  },
  accessCode: {
    required: true,
    pattern: /^[A-Z0-9_]+$/,
    minLength: 3,
    maxLength: 20,
    message: 'Access code must contain only uppercase letters, numbers, and underscores (3-20 characters)'
  },
  name: {
    required: true,
    minLength: 2,
    maxLength: 100,
    pattern: /^[a-zA-Z\s\-'\.]+$/,
    message: 'Name can only contain letters, spaces, hyphens, apostrophes, and periods'
  },
  countryCode: {
    required: true,
    pattern: /^[A-Z]{2}$/,
    message: 'Country code must be exactly 2 uppercase letters'
  },
  insight: {
    maxLength: 500,
    custom: (value: string) => {
      if (value.length > 500) {
        return 'Insight must be 500 characters or less'
      }
      return null
    }
  },
  phone: {
    pattern: /^[\+]?[1-9][\d]{0,15}$/,
    message: 'Please enter a valid phone number'
  },
  url: {
    pattern: /^https?:\/\/.+/,
    message: 'Please enter a valid URL starting with http:// or https://'
  }
}

/**
 * Sanitize input to prevent XSS
 */
export const sanitizeInput = (input: string): string => {
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+=/gi, '') // Remove event handlers
}

/**
 * Validate and sanitize form data
 */
export const validateAndSanitizeForm = (
  formData: Record<string, string>,
  rules: FormValidationRules
): { isValid: boolean; data: Record<string, string>; errors: string[] } => {
  const sanitizedData: Record<string, string> = {}
  
  // Sanitize all inputs
  for (const [key, value] of Object.entries(formData)) {
    sanitizedData[key] = sanitizeInput(value)
  }

  // Validate sanitized data
  const validation = validateForm(sanitizedData, rules)

  return {
    isValid: validation.isValid,
    data: sanitizedData,
    errors: validation.errors
  }
}

/**
 * Real-time validation hook
 */
export const useRealTimeValidation = (
  rules: FormValidationRules,
  debounceMs: number = 300
) => {
  const [errors, setErrors] = useState<Record<string, string[]>>({})
  const [isValidating, setIsValidating] = useState(false)

  const validateFieldRealTime = useCallback((fieldName: string, value: string) => {
    setIsValidating(true)
    const fieldRules = rules[fieldName]
    if (fieldRules) {
      const result = validateField(value, fieldRules, fieldName)
      setErrors(prev => ({
        ...prev,
        [fieldName]: result.errors
      }))
    }
    setIsValidating(false)
  }, [rules])

  const debouncedValidate = useDebounce(validateFieldRealTime as (...args: unknown[]) => unknown, debounceMs)

  const clearFieldError = useCallback((fieldName: string) => {
    setErrors(prev => {
      const newErrors = { ...prev }
      delete newErrors[fieldName]
      return newErrors
    })
  }, [])

  const clearAllErrors = useCallback(() => {
    setErrors({})
  }, [])

  return {
    errors,
    isValidating,
    validateFieldRealTime: debouncedValidate,
    clearFieldError,
    clearAllErrors
  }
}

/**
 * Form submission validation
 */
export const validateFormSubmission = (
  formData: Record<string, string>,
  rules: FormValidationRules
): { canSubmit: boolean; errors: string[] } => {
  const validation = validateForm(formData, rules)
  
  return {
    canSubmit: validation.isValid,
    errors: validation.errors
  }
}

/**
 * Validate specific field types
 */
export const validators = {
  email: (value: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(value) ? null : 'Please enter a valid email address'
  },
  
  accessCode: (value: string) => {
    const codeRegex = /^[A-Z0-9_]+$/
    if (!codeRegex.test(value)) {
      return 'Access code must contain only uppercase letters, numbers, and underscores'
    }
    if (value.length < 3 || value.length > 20) {
      return 'Access code must be between 3 and 20 characters'
    }
    return null
  },
  
  name: (value: string) => {
    const nameRegex = /^[a-zA-Z\s\-'\.]+$/
    if (!nameRegex.test(value)) {
      return 'Name can only contain letters, spaces, hyphens, apostrophes, and periods'
    }
    if (value.length < 2) {
      return 'Name must be at least 2 characters long'
    }
    return null
  },
  
  countryCode: (value: string) => {
    const countryRegex = /^[A-Z]{2}$/
    return countryRegex.test(value) ? null : 'Country code must be exactly 2 uppercase letters'
  },
  
  insight: (value: string) => {
    if (value.length > 500) {
      return 'Insight must be 500 characters or less'
    }
    return null
  },
  
  phone: (value: string) => {
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/
    return phoneRegex.test(value) ? null : 'Please enter a valid phone number'
  },
  
  url: (value: string) => {
    const urlRegex = /^https?:\/\/.+/
    return urlRegex.test(value) ? null : 'Please enter a valid URL starting with http:// or https://'
  }
}
