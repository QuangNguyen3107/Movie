// src/config/axiosAdminConfig.ts
import axios from 'axios';

const baseURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

// Create axios instance with base configuration for admin routes
const axiosInstance = axios.create({
  baseURL: baseURL,
  timeout: 30000, // 30 seconds timeout
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  },
  withCredentials: true // For CORS with credentials
});

// Add request interceptor for auth token
axiosInstance.interceptors.request.use((config) => {
  // Get token from localStorage
  const token = localStorage.getItem('auth_token') || localStorage.getItem('token');
  
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  
  // Add additional headers for CORS with PATCH requests
  if (config.method === 'patch' || config.method === 'PATCH') {
    config.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, PATCH, OPTIONS';
    config.headers['Access-Control-Allow-Origin'] = '*';
  }
  
  // Log request for debugging
  console.log(`[Admin API Request] ${config.method?.toUpperCase()} ${config.url}`, 
    config.headers.Authorization ? 'Token: Yes' : 'Token: No');
  
  return config;
}, (error) => {
  console.error('[Admin API Request Error]', error);
  return Promise.reject(error);
});

// Add response interceptor for error handling
axiosInstance.interceptors.response.use(
  (response) => {
    // Log response for debugging
    console.log(`[Admin API Response] ${response.status} ${response.config.url}`);
    return response;
  },
  (error) => {
    // Handle unauthorized responses (status 401)
    if (error.response && error.response.status === 401) {
      console.error('[Admin API] Unauthorized access. Redirecting to login...');
      // For client-side operations only
      if (typeof window !== 'undefined') {
        // Clear auth tokens
        localStorage.removeItem('auth_token');
        localStorage.removeItem('token');
        
        // Redirect to login page
        window.location.href = '/login?redirect=' + encodeURIComponent(window.location.pathname);
      }
    }
    
    // Handle forbidden responses (status 403)
    if (error.response && error.response.status === 403) {
      console.error('[Admin API] Forbidden access.');
      // You might want to redirect to an access denied page
    }
    
    return Promise.reject(error);
  }
);

export default axiosInstance;
