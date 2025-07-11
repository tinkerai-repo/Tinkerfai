// Configuration for API endpoints
// In development, uses localhost:8000
// In production, uses the actual domain

const getApiBaseUrl = (): string => {
  // Check if we're in development mode
  if (import.meta.env.DEV) {
    return 'http://localhost:8000/api';
  }
  
  // In production, use the current domain
  const protocol = window.location.protocol;
  const host = window.location.host;
  return `${protocol}//${host}/api`;
};

export const API_BASE_URL = getApiBaseUrl();

// Environment-specific configuration
export const config = {
  apiBaseUrl: API_BASE_URL,
  isDevelopment: import.meta.env.DEV,
  isProduction: import.meta.env.PROD,
}; 