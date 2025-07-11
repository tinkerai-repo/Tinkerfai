// Configuration for API endpoints
// In development, uses localhost:8080
// In production, uses the actual domain

const getApiBaseUrl = (): string => {
  // Check if we're in development mode
  if (import.meta.env.DEV) {
    return 'http://localhost:8080/api';
  }
  
  // Debug logging
  console.log('=== API Configuration Debug ===');
  console.log('import.meta.env.DEV:', import.meta.env.DEV);
  console.log('import.meta.env.PROD:', import.meta.env.PROD);
  console.log('import.meta.env.VITE_API_URL:', import.meta.env.VITE_API_URL);
  console.log('window.location.protocol:', window.location.protocol);
  console.log('window.location.host:', window.location.host);
  
  // In production, use the environment variable or fallback
  const protocol = window.location.protocol;
  const host = window.location.host;
  const apiUrl = import.meta.env.VITE_API_URL || `${protocol}//${host}`;
  
  console.log('Final apiUrl:', apiUrl);
  console.log('Final API_BASE_URL:', `${apiUrl}/api`);
  console.log('=== End Debug ===');
  
  return `${apiUrl}/api`;
};

export const API_BASE_URL = getApiBaseUrl();

// Environment-specific configuration
export const config = {
  apiBaseUrl: API_BASE_URL,
  isDevelopment: import.meta.env.DEV,
  isProduction: import.meta.env.PROD,
}; 