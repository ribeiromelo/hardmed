// Wait for DOM and axios to be loaded
document.addEventListener('DOMContentLoaded', function() {
  // Check if we're on the register page
  const registerForm = document.getElementById('registerForm');
  if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const form = e.target;
      const formData = new FormData(form);
      const data = {
        name: formData.get('name'),
        email: formData.get('email'),
        password: formData.get('password')
      };
      
      const confirmPassword = formData.get('confirmPassword');
      
      const errorDiv = document.getElementById('error');
      const successDiv = document.getElementById('success');
      errorDiv.classList.add('hidden');
      successDiv.classList.add('hidden');
      
      if (data.password !== confirmPassword) {
        errorDiv.textContent = 'As senhas não coincidem';
        errorDiv.classList.remove('hidden');
        return;
      }
      
      try {
        const response = await fetch('/api/auth/register', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(data)
        });
        
        const result = await response.json();
        
        if (!response.ok) {
          throw new Error(result.error || 'Erro ao criar conta');
        }
        
        successDiv.textContent = 'Conta criada com sucesso! Redirecionando...';
        successDiv.classList.remove('hidden');
        
        setTimeout(() => {
          window.location.href = '/login';
        }, 1500);
      } catch (error) {
        errorDiv.textContent = error.message || 'Erro ao criar conta';
        errorDiv.classList.remove('hidden');
      }
    });
  }
  
  // Check if we're on the login page
  const loginForm = document.getElementById('loginForm');
  if (loginForm) {
    // Remove any existing listeners to avoid duplicates
    const newForm = loginForm.cloneNode(true);
    loginForm.parentNode.replaceChild(newForm, loginForm);
    
    newForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const form = e.target;
      const formData = new FormData(form);
      const email = formData.get('email');
      const password = formData.get('password');
      
      const errorDiv = document.getElementById('error');
      errorDiv.classList.add('hidden');
      
      try {
        const response = await fetch('/api/auth/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ email, password })
        });
        
        const result = await response.json();
        
        if (!response.ok) {
          throw new Error(result.error || 'Erro ao fazer login');
        }
        
        // Save token as cookie (expires in 7 days)
        const expiryDate = new Date();
        expiryDate.setDate(expiryDate.getDate() + 7);
        document.cookie = 'auth_token=' + result.token + '; path=/; expires=' + expiryDate.toUTCString() + '; SameSite=Lax';
        
        // Also save to localStorage as backup
        localStorage.setItem('auth_token', result.token);
        
        // Force redirect
        window.location.href = '/dashboard';
      } catch (error) {
        errorDiv.textContent = error.message || 'Erro ao fazer login';
        errorDiv.classList.remove('hidden');
      }
    });
  }
  
  // Check if we're on the recover password page
  const recoverForm = document.getElementById('recoverForm');
  if (recoverForm) {
    recoverForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const messageDiv = document.getElementById('message');
      messageDiv.textContent = 'Se o e-mail existir, enviaremos instruções para redefinir sua senha.';
      messageDiv.classList.remove('hidden');
    });
  }
});

// Logout function
function logout() {
  // Remove cookie
  document.cookie = 'auth_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC; SameSite=Lax';
  // Remove localStorage
  localStorage.removeItem('auth_token');
  window.location.href = '/login';
}
