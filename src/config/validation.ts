/**
 * Input Validation Utilities for eNaTIS Transaction 57
 * Implements field validation and formatting as per eNaTIS specifications
 */

// Regular expressions for validation
export const VALIDATION_PATTERNS = {
  // V00017: RSA ID must be numeric only (13 digits)
  RSA_ID: /^[0-9]{13}$/,
  
  // Foreign ID validation (basic alphanumeric)
  FOREIGN_ID: /^[A-Za-z0-9\-]{6,20}$/,
  
  // V00043, V00056: Names - letters, spaces, hyphens, apostrophes only
  NAME: /^[A-Za-z\s\-'\.]+$/,
  
  // V00051: Initials - uppercase letters only, no spaces
  INITIALS: /^[A-Z]+$/,
  
  // Phone numbers - digits only (area code and number)
  PHONE_CODE: /^[0-9]{2,4}$/,
  PHONE_NUMBER: /^[0-9]{6,10}$/,
  CELL_PHONE: /^[0-9]{10}$/,
  
  // Email validation
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  
  // Postal code - 4 digits only
  POSTAL_CODE: /^[0-9]{4}$/,
  
  // Address lines - standard characters
  ADDRESS: /^[A-Za-z0-9\s\-'.,/()]+$/,
} as const;

// Maximum field lengths as per eNaTIS specifications
export const FIELD_LENGTHS = {
  SURNAME: 32,
  INITIALS: 10,
  FULL_NAME: 32,
  ID_NUMBER: 13,
  FOREIGN_ID: 20,
  ADDRESS_LINE: 35,
  POSTAL_CODE: 4,
  PHONE_CODE: 4,
  PHONE_NUMBER: 10,
  CELL_PHONE: 15,
  EMAIL: 100,
} as const;

/**
 * Input formatters that restrict and format input as user types
 */
export const formatters = {
  /**
   * V00017: RSA ID - only numeric input, max 13 digits
   */
  rsaId: (value: string): string => {
    return value.replace(/[^0-9]/g, '').substring(0, 13);
  },

  /**
   * Foreign ID - alphanumeric and hyphens only
   */
  foreignId: (value: string): string => {
    return value.replace(/[^A-Za-z0-9\-]/g, '').substring(0, 20);
  },

  /**
   * V00051: Initials - uppercase letters only
   */
  initials: (value: string): string => {
    return value.replace(/[^A-Za-z]/g, '').toUpperCase().substring(0, 10);
  },

  /**
   * V00043: Names - letters, spaces, hyphens, apostrophes, dots
   */
  name: (value: string): string => {
    return value.replace(/[^A-Za-z\s\-'\.]/g, '').substring(0, 32);
  },

  /**
   * Phone code - numeric only
   */
  phoneCode: (value: string): string => {
    return value.replace(/[^0-9]/g, '').substring(0, 4);
  },

  /**
   * Phone number - numeric only
   */
  phoneNumber: (value: string): string => {
    return value.replace(/[^0-9]/g, '').substring(0, 10);
  },

  /**
   * Cell phone - numeric only, 10 digits
   */
  cellPhone: (value: string): string => {
    return value.replace(/[^0-9]/g, '').substring(0, 10);
  },

  /**
   * Postal code - 4 digits only
   */
  postalCode: (value: string): string => {
    return value.replace(/[^0-9]/g, '').substring(0, 4);
  },

  /**
   * Address lines - standard characters only
   */
  address: (value: string): string => {
    return value.replace(/[^A-Za-z0-9\s\-'.,/()\u00C0-\u017F]/g, '').substring(0, 35);
  },
};

/**
 * Validation functions that return error messages
 */
export const validators = {
  /**
   * V00013: ID Number Mandatory
   * V00018: RSA ID must be 13 digits
   * V00017: RSA ID must be numeric
   * V00019: RSA ID check digit validation
   */
  rsaId: (value: string): string | null => {
    if (!value || value.trim() === '') {
      return 'V00013: Identification number is mandatory';
    }

    if (value.length !== 13) {
      return 'V00018: RSA ID must be exactly 13 digits';
    }

    if (!VALIDATION_PATTERNS.RSA_ID.test(value)) {
      return 'V00017: RSA ID must contain only numeric characters';
    }

    // V00019: Check digit validation (Luhn algorithm)
    if (!validateRSAIdChecksum(value)) {
      return 'V00019: Invalid RSA ID check digit';
    }

    return null;
  },

  /**
   * Foreign ID validation
   */
  foreignId: (value: string): string | null => {
    if (!value || value.trim() === '') {
      return 'V00013: Identification number is mandatory';
    }

    if (value.length < 6 || value.length > 20) {
      return 'Foreign ID must be between 6 and 20 characters';
    }

    if (!VALIDATION_PATTERNS.FOREIGN_ID.test(value)) {
      return 'Foreign ID can only contain letters, numbers, and hyphens';
    }

    return null;
  },

  /**
   * V00051: Initials mandatory for natural persons
   */
  initials: (value: string): string | null => {
    if (!value || value.trim() === '') {
      return 'V00051: Initials are mandatory for natural persons';
    }

    if (!VALIDATION_PATTERNS.INITIALS.test(value)) {
      return 'Initials must contain only uppercase letters';
    }

    return null;
  },

  /**
   * V00043: Surname mandatory
   * V00056: Full name mandatory
   */
  name: (value: string, fieldName: string = 'Name'): string | null => {
    if (!value || value.trim() === '') {
      return `${fieldName} is mandatory`;
    }

    if (!VALIDATION_PATTERNS.NAME.test(value)) {
      return `${fieldName} can only contain letters, spaces, hyphens, apostrophes, and dots`;
    }

    return null;
  },

  /**
   * Email validation (optional field)
   */
  email: (value: string): string | null => {
    if (!value) return null; // Optional field

    if (!VALIDATION_PATTERNS.EMAIL.test(value)) {
      return 'Please enter a valid email address';
    }

    return null;
  },

  /**
   * Phone validation (optional but if provided must be valid)
   */
  phone: (code: string, number: string, fieldName: string = 'Phone'): string | null => {
    // If both empty, it's okay (optional)
    if ((!code || code.trim() === '') && (!number || number.trim() === '')) {
      return null;
    }

    // If one is provided, both must be provided
    if ((!code || code.trim() === '') || (!number || number.trim() === '')) {
      return `${fieldName} area code and number must both be provided`;
    }

    if (!VALIDATION_PATTERNS.PHONE_CODE.test(code)) {
      return `${fieldName} area code must be 2-4 digits`;
    }

    if (!VALIDATION_PATTERNS.PHONE_NUMBER.test(number)) {
      return `${fieldName} number must be 6-10 digits`;
    }

    return null;
  },

  /**
   * Cell phone validation
   */
  cellPhone: (value: string): string | null => {
    if (!value) return null; // Optional field

    if (!VALIDATION_PATTERNS.CELL_PHONE.test(value)) {
      return 'Cell phone must be exactly 10 digits';
    }

    return null;
  },

  /**
   * Postal code validation
   */
  postalCode: (value: string): string | null => {
    if (!value) return null; // Optional field

    if (!VALIDATION_PATTERNS.POSTAL_CODE.test(value)) {
      return 'Postal code must be exactly 4 digits';
    }

    return null;
  },
};

/**
 * V00019: RSA ID check digit validation using Luhn algorithm
 */
export const validateRSAIdChecksum = (id: string): boolean => {
  if (id.length !== 13 || !/^\d{13}$/.test(id)) {
    return false;
  }

  const digits = id.split('').map(Number);
  const checkDigit = digits[12];
  
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    let digit = digits[i];
    if (i % 2 === 1) {
      digit *= 2;
      if (digit > 9) {
        digit = Math.floor(digit / 10) + (digit % 10);
      }
    }
    sum += digit;
  }

  const calculatedCheckDigit = (10 - (sum % 10)) % 10;
  return calculatedCheckDigit === checkDigit;
};

/**
 * V00034: Extract gender from RSA ID (digits 7-10)
 */
export const extractGenderFromRSAId = (rsaId: string): 'Male' | 'Female' | null => {
  if (rsaId.length !== 13 || !/^\d{13}$/.test(rsaId)) {
    return null;
  }

  const genderDigits = parseInt(rsaId.substring(6, 10), 10);
  return genderDigits > 4999 ? 'Male' : 'Female';
};

/**
 * V00065: Extract birth date from RSA ID (first 6 digits)
 */
export const extractBirthDateFromRSAId = (rsaId: string): Date | null => {
  if (rsaId.length !== 13 || !/^\d{13}$/.test(rsaId)) {
    return null;
  }

  const yearDigits = parseInt(rsaId.substring(0, 2), 10);
  const month = parseInt(rsaId.substring(2, 4), 10);
  const day = parseInt(rsaId.substring(4, 6), 10);

  // Determine century (assume birth years < 30 are 2000s, >= 30 are 1900s)
  const currentYear = new Date().getFullYear();
  const currentCentury = Math.floor(currentYear / 100) * 100;
  const year = yearDigits < 30 ? currentCentury + yearDigits : currentCentury - 100 + yearDigits;

  // Validate date components
  if (month < 1 || month > 12 || day < 1 || day > 31) {
    return null;
  }

  const birthDate = new Date(year, month - 1, day);
  
  // Check if date is valid and not in the future
  if (birthDate.getTime() > Date.now()) {
    return null;
  }

  return birthDate;
};

/**
 * Utility to create onChange handler with formatting
 */
export const createFormattedOnChange = (
  formatter: (value: string) => string,
  onChange: (value: string) => void
) => {
  return (event: { target: { value: string } }) => {
    const formatted = formatter(event.target.value);
    onChange(formatted);
  };
}; 