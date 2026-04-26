export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

export const validateGmailEmail = (email: string): ValidationResult => {
  if (!email || email.trim() === '') {
    return { isValid: false, error: 'Email is required' };
  }

  const emailRegex = /^[a-zA-Z0-9._%+-]+@gmail\.com$/;
  
  if (!emailRegex.test(email.trim().toLowerCase())) {
    return { 
      isValid: false, 
      error: 'Only Gmail addresses ending with @gmail.com are allowed' 
    };
  }

  // Check for common invalid patterns
  const localPart = email.split('@')[0];
  if (localPart.startsWith('.') || localPart.endsWith('.')) {
    return { isValid: false, error: 'Invalid Gmail address format' };
  }

  if (localPart.includes('..')) {
    return { isValid: false, error: 'Invalid Gmail address format' };
  }

  return { isValid: true };
};

export const validatePhoneNumber = (phone: string): ValidationResult => {
  if (!phone || phone.trim() === '') {
    return { isValid: false, error: 'Phone number is required' };
  }

  // Remove all non-digit characters
  const cleanPhone = phone.replace(/\D/g, '');

  if (cleanPhone.length !== 11) {
    return { 
      isValid: false, 
      error: 'Phone number must be exactly 11 digits' 
    };
  }

  // Check if it starts with a valid country code (e.g., 01 for Egypt)
  if (!cleanPhone.startsWith('01')) {
    return { 
      isValid: false, 
      error: 'Phone number must start with 01' 
    };
  }

  // Check for invalid patterns
  if (/^(\d)\1{10}$/.test(cleanPhone)) {
    return { isValid: false, error: 'Invalid phone number format' };
  }

  return { isValid: true };
};

export const formatPhoneNumber = (phone: string): string => {
  const cleanPhone = phone.replace(/\D/g, '');
  if (cleanPhone.length <= 3) return cleanPhone;
  if (cleanPhone.length <= 7) return `${cleanPhone.slice(0, 3)}-${cleanPhone.slice(3)}`;
  return `${cleanPhone.slice(0, 3)}-${cleanPhone.slice(3, 7)}-${cleanPhone.slice(7, 11)}`;
};


