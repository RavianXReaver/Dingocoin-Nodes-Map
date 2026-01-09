/**
 * Authentication Error Handling Utilities
 *
 * Provides consistent error extraction and user-friendly messaging across all auth flows.
 */

import { AuthError, AuthRetryableFetchError } from '@supabase/supabase-js';

export type AuthErrorType =
  | 'network'
  | 'invalid_credentials'
  | 'email_not_confirmed'
  | 'user_already_registered'
  | 'weak_password'
  | 'invalid_email'
  | 'rate_limit'
  | 'invalid_otp'
  | 'expired_otp'
  | 'unknown';

export interface ParsedAuthError {
  type: AuthErrorType;
  message: string;
  originalError?: any;
}

/**
 * Extract error message from various error formats
 */
export function extractErrorMessage(error: any): string {
  if (typeof error === 'string') return error;
  if (error?.message) return String(error.message);
  if (error?.error_description) return String(error.error_description);
  if (error?.msg) return String(error.msg);
  if (error?.error) return String(error.error);
  return 'An unexpected error occurred';
}

/**
 * Parse auth error and return structured error info
 */
export function parseAuthError(error: any): ParsedAuthError {
  // Handle AuthRetryableFetchError (network/timeout errors)
  if (error instanceof AuthRetryableFetchError || error?.name === 'AuthRetryableFetchError') {
    return {
      type: 'network',
      message: 'Connection failed. Please check your internet connection and try again.',
      originalError: error,
    };
  }

  // Handle AuthError
  if (error instanceof AuthError || error?.name === 'AuthError') {
    const message = extractErrorMessage(error);
    const lowerMessage = message.toLowerCase();

    // Invalid credentials
    if (lowerMessage.includes('invalid login credentials') || lowerMessage.includes('invalid email or password')) {
      return {
        type: 'invalid_credentials',
        message: 'Invalid email or password. Please try again.',
        originalError: error,
      };
    }

    // Email not confirmed
    if (lowerMessage.includes('email not confirmed')) {
      return {
        type: 'email_not_confirmed',
        message: 'Please check your email and confirm your account before logging in.',
        originalError: error,
      };
    }

    // User already registered
    if (lowerMessage.includes('user already registered')) {
      return {
        type: 'user_already_registered',
        message: 'An account with this email already exists. Please login instead.',
        originalError: error,
      };
    }

    // Weak password
    if (lowerMessage.includes('password') && (lowerMessage.includes('weak') || lowerMessage.includes('short') || lowerMessage.includes('at least'))) {
      return {
        type: 'weak_password',
        message: 'Password must be at least 8 characters long.',
        originalError: error,
      };
    }

    // Invalid email
    if (lowerMessage.includes('invalid email')) {
      return {
        type: 'invalid_email',
        message: 'Please enter a valid email address.',
        originalError: error,
      };
    }

    // Rate limiting
    if (lowerMessage.includes('rate limit') || lowerMessage.includes('too many') || error.status === 429) {
      return {
        type: 'rate_limit',
        message: 'Too many attempts. Please wait a moment and try again.',
        originalError: error,
      };
    }

    // Invalid OTP
    if (lowerMessage.includes('invalid') && lowerMessage.includes('otp')) {
      return {
        type: 'invalid_otp',
        message: 'Invalid verification code. Please check and try again.',
        originalError: error,
      };
    }

    // Expired OTP
    if (lowerMessage.includes('expired') && lowerMessage.includes('otp')) {
      return {
        type: 'expired_otp',
        message: 'Verification code has expired. Please request a new one.',
        originalError: error,
      };
    }

    // Return the actual message if we couldn't categorize it
    return {
      type: 'unknown',
      message,
      originalError: error,
    };
  }

  // Handle fetch errors
  if (error?.name === 'TypeError' && error?.message?.includes('fetch')) {
    return {
      type: 'network',
      message: 'Unable to connect to authentication service. Please check your connection and try again.',
      originalError: error,
    };
  }

  // Handle HTTP errors
  if (error?.status === 429) {
    return {
      type: 'rate_limit',
      message: 'Too many attempts. Please wait a moment and try again.',
      originalError: error,
    };
  }

  // Generic error
  const message = extractErrorMessage(error);
  return {
    type: 'unknown',
    message: message || 'An unexpected error occurred. Please try again.',
    originalError: error,
  };
}

/**
 * Get user-friendly error message from any error type
 */
export function getUserFriendlyAuthError(error: any): string {
  const parsed = parseAuthError(error);
  return parsed.message;
}

/**
 * Check if error is retryable (user should try again)
 */
export function isRetryableAuthError(error: any): boolean {
  const parsed = parseAuthError(error);
  return parsed.type === 'network' || parsed.type === 'rate_limit';
}

/**
 * Check if error requires support contact
 */
export function shouldShowSupportContact(error: any): boolean {
  const parsed = parseAuthError(error);
  // Show support for unknown errors and network issues that persist
  return parsed.type === 'unknown' || parsed.type === 'network';
}
