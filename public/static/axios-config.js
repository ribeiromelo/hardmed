// AXIOS CONFIG - Token injection in EVERY request
if (typeof window.axiosConfigured === 'undefined') {
  window.axiosConfigured = false;
  
  // Helper function to get token
  window.getAuthToken = function() {
    const cookieMatch = document.cookie.match(/auth_token=([^;]+)/);
    if (cookieMatch) {
      return cookieMatch[1];
    }
    return localStorage.getItem('auth_token');
  };
  
  function configureAxios() {
    if (typeof axios === 'undefined') {
      setTimeout(configureAxios, 50);
      return;
    }
    
    if (window.axiosConfigured) return;
    
    const token = window.getAuthToken();
    console.log('🔧 Configuring axios...');
    console.log('   Token found:', token ? 'YES (' + token.substring(0, 20) + '...)' : 'NO');
    
    // Base URL
    axios.defaults.baseURL = '/api';
    
    // REQUEST interceptor - inject token in EVERY request
    axios.interceptors.request.use(
      config => {
        const currentToken = window.getAuthToken();
        if (currentToken) {
          config.headers.Authorization = 'Bearer ' + currentToken;
          console.log('🔑 Token injected in request to:', config.url);
        } else {
          console.warn('⚠️ No token found for request to:', config.url);
        }
        return config;
      },
      error => {
        return Promise.reject(error);
      }
    );
    
    // RESPONSE interceptor - handle auth errors
    axios.interceptors.response.use(
      response => {
        console.log('✅ Request successful:', response.config.url);
        return response;
      },
      error => {
        console.error('❌ Request failed:', error.config?.url, error.response?.status);
        if (error.response?.status === 401) {
          console.warn('🚪 Auth failed - redirecting to login');
          document.cookie = 'auth_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC';
          localStorage.removeItem('auth_token');
          if (!window.location.pathname.includes('login')) {
            window.location.href = '/login';
          }
        }
        return Promise.reject(error);
      }
    );
    
    window.axiosConfigured = true;
    console.log('✅ Axios configured with interceptors!');
  }
  
  configureAxios();
}
