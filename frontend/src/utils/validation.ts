// Email validation utilities

// RFC 5322 compliant email regex
export const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

// Common invalid email patterns
export const INVALID_EMAIL_PATTERNS = [
  /\.{2,}/, // Multiple dots in a row
  /@.*@/, // Multiple @ symbols
  /^\./, // Starts with dot
  /\.$/, // Ends with dot
  /@\./, // @ followed by dot
  /\.@/, // Dot followed by @
];

/**
 * Validates an email address with strict rules
 * @param email - The email address to validate
 * @returns true if valid, false otherwise
 */
export const isValidEmail = (email: string): boolean => {
  // Basic format check
  if (!EMAIL_REGEX.test(email)) {
    return false;
  }

  // Check for invalid patterns
  if (INVALID_EMAIL_PATTERNS.some(pattern => pattern.test(email))) {
    return false;
  }

  // Ensure email has a valid domain extension
  const parts = email.split('@');
  if (parts.length !== 2) {
    return false;
  }

  const domain = parts[1];
  if (!domain.includes('.') || domain.split('.').pop()!.length < 2) {
    return false;
  }

  return true;
};

/**
 * Common disposable email domains to block (optional)
 * This is a small sample - you can expand this list
 */
export const DISPOSABLE_EMAIL_DOMAINS = [
  'tempmail.com',
  'throwaway.email',
  'guerrillamail.com',
  'mailinator.com',
  '10minutemail.com',
  'trashmail.com',
];

/**
 * Check if email is from a disposable domain
 * @param email - The email address to check
 * @returns true if disposable, false otherwise
 */
export const isDisposableEmail = (email: string): boolean => {
  const domain = email.split('@')[1]?.toLowerCase();
  if (!domain) return false;
  
  return DISPOSABLE_EMAIL_DOMAINS.some(disposable => 
    domain === disposable || domain.endsWith(`.${disposable}`)
  );
}; 