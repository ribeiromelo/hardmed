// API Helper - Uses native Fetch (NO AXIOS DEPENDENCY)
// This ALWAYS works because it's pure JavaScript

window.api = {
  // Get auth token from cookie or localStorage
  getToken() {
    const cookieMatch = document.cookie.match(/auth_token=([^;]+)/);
    if (cookieMatch) {
      return cookieMatch[1];
    }
    return localStorage.getItem('auth_token');
  },

  // Make authenticated request
  async request(url, options = {}) {
    const token = this.getToken();
    
    console.log('🌐 API Request:', url);
    console.log('   Token:', token ? 'YES (' + token.substring(0, 20) + '...)' : 'NO');
    
    const headers = {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    };
    
    if (token) {
      headers['Authorization'] = 'Bearer ' + token;
    }
    
    const response = await fetch('/api' + url, {
      ...options,
      headers
    });
    
    console.log('   Status:', response.status, response.statusText);
    
    if (!response.ok) {
      if (response.status === 401) {
        console.warn('🚪 Auth failed - redirecting to login');
        document.cookie = 'auth_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC';
        localStorage.removeItem('auth_token');
        if (!window.location.pathname.includes('login')) {
          window.location.href = '/login';
        }
      }
      const error = new Error('API request failed');
      error.status = response.status;
      throw error;
    }
    
    return response.json();
  },

  // GET request
  async get(url) {
    return this.request(url, { method: 'GET' });
  },

  // POST request
  async post(url, data) {
    return this.request(url, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  // PUT request
  async put(url, data) {
    return this.request(url, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  },

  // DELETE request
  async delete(url) {
    return this.request(url, { method: 'DELETE' });
  }
};

console.log('✅ API helper loaded (using native Fetch)');
