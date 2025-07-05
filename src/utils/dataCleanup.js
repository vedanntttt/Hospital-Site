// Utility functions for data cleanup and validation

export const clearAllPatientData = () => {
  // Clear general patients data
  localStorage.removeItem('patients');
  
  // Clear all doctor schedule data
  const keysToRemove = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith('doctorScheduleNewPatients_')) {
      keysToRemove.push(key);
    }
  }
  
  keysToRemove.forEach(key => {
    localStorage.removeItem(key);
  });
  
  console.log('All patient data cleared from localStorage');
  return keysToRemove.length + 1; // +1 for 'patients' key
};

export const validatePatientData = (name, phone) => {
  const errors = [];
  
  // Name validation
  if (!name || name.trim().length < 2) {
    errors.push('Name must be at least 2 characters long');
  }
  
  // Check if name contains only valid characters (letters, spaces, dots, hyphens)
  const nameRegex = /^[a-zA-Z\s.-]+$/;
  if (name && !nameRegex.test(name.trim())) {
    errors.push('Name can only contain letters, spaces, dots, and hyphens');
  }
  
  // Phone validation
  if (!phone || phone.trim().length < 10) {
    errors.push('Phone number must be at least 10 digits');
  }
  
  // Check if phone contains only numbers and common separators
  const phoneRegex = /^[0-9\s\-\+\(\)]+$/;
  if (phone && !phoneRegex.test(phone.trim())) {
    errors.push('Phone number can only contain numbers, spaces, hyphens, plus signs, and parentheses');
  }
  
  // Check if phone has at least 10 digits
  const digitCount = (phone || '').replace(/\D/g, '').length;
  if (digitCount < 10) {
    errors.push('Phone number must contain at least 10 digits');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

export const sanitizePatientData = (name, phone) => {
  return {
    name: name ? name.trim().replace(/\s+/g, ' ') : '',
    phone: phone ? phone.trim().replace(/\s+/g, '') : ''
  };
};

export const isTestData = (name, phone) => {
  const testPatterns = [
    /^test/i,
    /^dummy/i,
    /^sample/i,
    /^example/i,
    /^[a-z]{3,}$/i, // Only lowercase letters like "dfdlk"
    /^[0-9]+$/, // Only numbers as name
    /^[^a-zA-Z]*$/, // No letters at all
    /^.{1,2}$/, // Too short (1-2 characters)
  ];
  
  return testPatterns.some(pattern => pattern.test(name || ''));
};

export const getStorageUsage = () => {
  let totalSize = 0;
  const usage = {};
  
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    const value = localStorage.getItem(key);
    const size = new Blob([value]).size;
    totalSize += size;
    usage[key] = {
      size: size,
      sizeFormatted: formatBytes(size)
    };
  }
  
  return {
    total: totalSize,
    totalFormatted: formatBytes(totalSize),
    breakdown: usage
  };
};

const formatBytes = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};
