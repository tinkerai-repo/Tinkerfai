// Configuration for API endpoints
// In development, uses localhost:8080
// In production, uses the actual domain

const getApiBaseUrl = (): string => {
  // Check if we're in development mode
  if (import.meta.env.DEV) {
    return 'http://localhost:8080/api';
  }
  
  // In production, use the current domain
  const protocol = window.location.protocol;
  const host = window.location.host;
  const apiUrl = import.meta.env.REACT_APP_API_URL || `${protocol}//${host}`;
  return `${apiUrl}/api`;
};

export const API_BASE_URL = getApiBaseUrl();

// Environment-specific configuration
export const config = {
  apiBaseUrl: API_BASE_URL,
  isDevelopment: import.meta.env.DEV,
  isProduction: import.meta.env.PROD,
}; 