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
  
  // TEMPORARY: Hardcode the backend URL
  const hardcodedBackendUrl = 'https://d843pnjrij.us-east-2.awsapprunner.com';
  
  console.log('Using hardcoded backend URL:', hardcodedBackendUrl);
  console.log('Final API_BASE_URL:', `${hardcodedBackendUrl}/api`);
  console.log('=== End Debug ===');
  
  return `${hardcodedBackendUrl}/api`;
};

export const API_BASE_URL = getApiBaseUrl();

// Environment-specific configuration
export const config = {
  apiBaseUrl: API_BASE_URL,
  isDevelopment: import.meta.env.DEV,
  isProduction: import.meta.env.PROD,
}; 