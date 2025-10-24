// SIMPLE AXIOS CONFIG - NO COMPLEXITY
if (typeof window.axiosConfigured === 'undefined') {
  window.axiosConfigured = false;
  
  function configureAxios() {
    if (typeof axios === 'undefined') {
      setTimeout(configureAxios, 50);
      return;
    }
    
    if (window.axiosConfigured) return;
    
    // Get token
    let token = null;
    const cookieMatch = document.cookie.match(/auth_token=([^;]+)/);
    if (cookieMatch) {
      token = cookieMatch[1];
    } else {
      token = localStorage.getItem('auth_token');
    }
    
    console.log('🔧 Configuring axios...');
    console.log('   Token found:', token ? 'YES' : 'NO');
    
    // Configure axios
    axios.defaults.baseURL = '/api';
    
    if (token) {
      axios.defaults.headers.common['Authorization'] = 'Bearer ' + token;
    }
    
    // Simple error handler
    axios.interceptors.response.use(
      response => response,
      error => {
        if (error.response?.status === 401) {
          console.warn('Auth failed - clearing token');
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
    console.log('✅ Axios configured!');
  }
  
  configureAxios();
}
