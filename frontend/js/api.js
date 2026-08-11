// Centralized API Wrapper & Environment Configuration
const DEFAULT_LOCAL_API = 'http://localhost:5000/api';

// Check if custom Railway/Production API URL is set in localStorage or environment
const getApiBaseUrl = () => {
  const customUrl = localStorage.getItem('CUSTOM_API_BASE_URL');
  if (customUrl) return customUrl.replace(/\/$/, '');

  // If running hosted on Railway / same-origin server
  if (window.location.origin.includes('railway.app') || window.location.origin.includes('onrender.com')) {
    return `${window.location.origin}/api`;
  }

  return DEFAULT_LOCAL_API;
};

const API_BASE_URL = getApiBaseUrl();

async function apiRequest(endpoint, method = 'GET', data = null) {
  const token = localStorage.getItem('token');
  
  const headers = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const config = {
    method,
    headers,
  };

  if (data) {
    config.body = JSON.stringify(data);
  }

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
    
    // Handle unauthorized access (expired or invalid token)
    if (response.status === 401 && !window.location.pathname.endsWith('index.html') && window.location.pathname !== '/' && window.location.pathname !== '') {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = 'index.html';
      return;
    }

    const result = await response.json();

    if (!response.ok) {
      const errorMsg = result.error || (result.details ? result.details.join(', ') : 'API request failed');
      throw new Error(errorMsg);
    }

    return result;
  } catch (error) {
    console.error(`[API Error] ${method} ${endpoint}:`, error.message);
    throw error;
  }
}
