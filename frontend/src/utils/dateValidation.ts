/**
 * Date validation utilities for DOB and other date inputs
 */

export interface DateValidationResult {
  isValid: boolean;
  error?: string;
}

/**
 * Validates a date of birth string in DD/MM/YYYY format
 * @param dateString - Date string in DD/MM/YYYY format
 * @returns Validation result with error message if invalid
 */
export function validateDOB(dateString: string): DateValidationResult {
  // Check format
  if (!dateString || !dateString.match(/^\d{2}\/\d{2}\/\d{4}$/)) {
    return {
      isValid: false,
      error: 'Date must be in DD/MM/YYYY format',
    };
  }

  const [dayStr, monthStr, yearStr] = dateString.split('/');
  const day = parseInt(dayStr, 10);
  const month = parseInt(monthStr, 10);
  const year = parseInt(yearStr, 10);

  // Validate ranges
  if (month < 1 || month > 12) {
    return {
      isValid: false,
      error: 'Month must be between 1 and 12',
    };
  }

  if (day < 1 || day > 31) {
    return {
      isValid: false,
      error: 'Day must be between 1 and 31',
    };
  }

  const currentYear = new Date().getFullYear();
  if (year < 1900 || year > currentYear) {
    return {
      isValid: false,
      error: `Year must be between 1900 and ${currentYear}`,
    };
  }

  // Check if date is valid (handles Feb 30, Apr 31, etc.)
  const date = new Date(year, month - 1, day);
  if (
    date.getDate() !== day ||
    date.getMonth() !== month - 1 ||
    date.getFullYear() !== year
  ) {
    return {
      isValid: false,
      error: 'Invalid date (e.g., Feb 30 does not exist)',
    };
  }

  // Check if date is in the future
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (date > today) {
    return {
      isValid: false,
      error: 'Date of birth cannot be in the future',
    };
  }

  // Check minimum age (5 years old)
  const minDate = new Date();
  minDate.setFullYear(minDate.getFullYear() - 5);
  if (date > minDate) {
    return {
      isValid: false,
      error: 'You must be at least 5 years old to register',
    };
  }

  // Check maximum age (120 years old)
  const maxDate = new Date();
  maxDate.setFullYear(maxDate.getFullYear() - 120);
  if (date < maxDate) {
    return {
      isValid: false,
      error: 'Please enter a valid date of birth',
    };
  }

  return { isValid: true };
}

/**
 * Formats a date string from DD/MM/YYYY to YYYY-MM-DD for backend
 * @param dateString - Date string in DD/MM/YYYY format
 * @returns Date string in YYYY-MM-DD format or null if invalid
 */
export function formatDOBForBackend(dateString: string): string | null {
  if (!dateString) return null;
  
  const validation = validateDOB(dateString);
  if (!validation.isValid) return null;
  
  const [day, month, year] = dateString.split('/');
  return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
}

/**
 * Calculates age from a date of birth
 * @param dateString - Date string in DD/MM/YYYY format
 * @returns Age in years or null if invalid
 */
export function calculateAge(dateString: string): number | null {
  const validation = validateDOB(dateString);
  if (!validation.isValid) return null;
  
  const [day, month, year] = dateString.split('/');
  const birthDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
  const today = new Date();
  
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  
  return age;
}
