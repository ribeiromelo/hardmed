// Configure axios globally with auth token
(function() {
  // Get token from cookie or localStorage
  function getAuthToken() {
    const cookieMatch = document.cookie.match(/auth_token=([^;]+)/);
    if (cookieMatch) {
      return cookieMatch[1];
    }
    return localStorage.getItem('auth_token');
  }

  // Wait for axios to be loaded
  function setupAxios() {
    if (typeof axios === 'undefined') {
      setTimeout(setupAxios, 100);
      return;
    }

    const token = getAuthToken();
    
    if (token) {
      axios.defaults.baseURL = '/api';
      axios.defaults.headers.common['Authorization'] = 'Bearer ' + token;
      axios.defaults.headers.common['Content-Type'] = 'application/json';
    }

    // Add response interceptor for auth errors
    axios.interceptors.response.use(
      response => response,
      error => {
        if (error.response?.status === 401) {
          const currentPath = window.location.pathname;
          const publicPaths = ['/login', '/cadastro', '/recuperar-senha', '/'];
          const isPublicPath = publicPaths.some(path => currentPath === path || currentPath.startsWith(path));
          
          if (!isPublicPath) {
            document.cookie = 'auth_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC; SameSite=Lax';
            localStorage.removeItem('auth_token');
            window.location.href = '/login';
          }
        }
        return Promise.reject(error);
      }
    );

    console.log('✅ Axios configured with token:', token ? token.substring(0, 20) + '...' : 'none');
  }

  // Start setup
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setupAxios);
  } else {
    setupAxios();
  }
})();
