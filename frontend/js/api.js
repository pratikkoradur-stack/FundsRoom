// Centralized API Wrapper & Environment Configuration
const DEFAULT_LOCAL_API = 'http://localhost:5000/api';

const getApiBaseUrl = () => {
  const customUrl = localStorage.getItem('CUSTOM_API_BASE_URL');
  if (customUrl) return customUrl.replace(/\/$/, '');

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
    const currentPath = window.location.pathname;
    const isPublicPage = currentPath.endsWith('index.html') || currentPath === '/' || currentPath === '' || currentPath.endsWith('login.html');

    if (response.status === 401 && !isPublicPage) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = 'login.html';
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
