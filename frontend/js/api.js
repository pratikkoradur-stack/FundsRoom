// API Wrapper for Mini ERP + CRM Portal
const API_BASE_URL = 'http://localhost:5000/api';

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
    
    // Handle unauthorized access
    if (response.status === 401 && !window.location.pathname.endsWith('index.html') && window.location.pathname !== '/') {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = 'index.html';
      return;
    }

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || 'An error occurred during API request');
    }

    return result;
  } catch (error) {
    console.error(`[API Error] ${method} ${endpoint}:`, error.message);
    throw error;
  }
}
