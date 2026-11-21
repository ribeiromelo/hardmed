// Password strength checker
function checkPasswordStrength(password) {
  let strength = 0;
  let feedback = [];
  
  if (password.length === 0) {
    return { strength: 0, label: '', color: '', width: '0%' };
  }
  
  // Length check
  if (password.length >= 8) {
    strength += 25;
  } else {
    feedback.push('Mínimo 8 caracteres');
  }
  
  // Has lowercase
  if (/[a-z]/.test(password)) {
    strength += 15;
  } else {
    feedback.push('Adicione letras minúsculas');
  }
  
  // Has uppercase
  if (/[A-Z]/.test(password)) {
    strength += 20;
  } else {
    feedback.push('Adicione letras maiúsculas');
  }
  
  // Has numbers
  if (/\d/.test(password)) {
    strength += 20;
  } else {
    feedback.push('Adicione números');
  }
  
  // Has special characters
  if (/[^A-Za-z0-9]/.test(password)) {
    strength += 20;
  } else {
    feedback.push('Adicione caracteres especiais');
  }
  
  // Determine label and color
  let label = '';
  let color = '';
  let width = '0%';
  
  if (strength <= 25) {
    label = 'Muito Fraca';
    color = '#ef4444'; // red
    width = '25%';
  } else if (strength <= 50) {
    label = 'Fraca';
    color = '#f97316'; // orange
    width = '50%';
  } else if (strength <= 75) {
    label = 'Moderada';
    color = '#eab308'; // yellow
    width = '75%';
  } else {
    label = 'Forte';
    color = '#22c55e'; // green
    width = '100%';
  }
  
  return { strength, label, color, width, feedback };
}

// Update password strength indicator
function updatePasswordStrength() {
  const passwordInput = document.getElementById('password');
  const strengthBar = document.getElementById('strengthBar');
  const strengthLabel = document.getElementById('strengthLabel');
  const strengthFeedback = document.getElementById('strengthFeedback');
  
  if (!passwordInput || !strengthBar || !strengthLabel) return;
  
  const password = passwordInput.value;
  const result = checkPasswordStrength(password);
  
  // Update bar
  strengthBar.style.width = result.width;
  strengthBar.style.backgroundColor = result.color;
  
  // Update label
  strengthLabel.textContent = result.label;
  strengthLabel.style.color = result.color;
  
  // Update feedback
  if (strengthFeedback && result.feedback.length > 0) {
    strengthFeedback.innerHTML = result.feedback.map(f => 
      `<li class="text-xs text-gray-400"><i class="fas fa-circle text-[6px] mr-2"></i>${f}</li>`
    ).join('');
    strengthFeedback.classList.remove('hidden');
  } else if (strengthFeedback) {
    strengthFeedback.classList.add('hidden');
  }
}

// Wait for DOM and axios to be loaded
document.addEventListener('DOMContentLoaded', function() {
  // Setup password strength indicator on register page
  const passwordInput = document.getElementById('password');
  if (passwordInput) {
    passwordInput.addEventListener('input', updatePasswordStrength);
    passwordInput.addEventListener('keyup', updatePasswordStrength);
  }
  
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
            'Content-Type': 'application/json',
            'X-HardMed-Request': '1'
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
            'Content-Type': 'application/json',
            'X-HardMed-Request': '1'
          },
          body: JSON.stringify({ email, password })
        });
        
        const result = await response.json();
        
        if (!response.ok) {
          throw new Error(result.error || 'Erro ao fazer login');
        }
        
        // The server sets the HttpOnly session cookie. Remove legacy credentials.
        document.cookie = 'auth_token=; path=/; Max-Age=0; SameSite=Lax';
        try { localStorage.removeItem('auth_token'); } catch {}

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

// Logout revokes the current session on the server before leaving the page.
async function logout() {
  try {
    await api.post('/auth/logout', {});
    try { localStorage.removeItem('auth_token'); } catch {}
    window.location.href = '/login';
  } catch (error) {
    if (window.showAlert) showAlert('Não foi possível sair. Tente novamente.', 'Erro', 'error');
  }
}
