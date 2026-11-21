// ========================================
// PROFILE PAGE - ULTRAPOWER EDITION 💜🚀
// ========================================

let currentUser = null;

// ========================================
// LOAD PROFILE DATA
// ========================================

async function loadProfile() {
  console.log('📊 Loading profile...');
  
  try {
    // Load user data
    currentUser = await api.get('/user/me');
    console.log('   User loaded:', currentUser.name);
    
    // Fill form fields
    document.getElementById('name').value = currentUser.name;
    document.getElementById('email').value = currentUser.email;
    
    // Format member since date
    const memberDate = new Date(currentUser.created_at);
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    document.getElementById('memberSince').textContent = memberDate.toLocaleDateString('pt-BR', options);
    
    // Load statistics
    await loadStats();
    
    console.log('✅ Profile loaded successfully!');
  } catch (error) {
    console.error('❌ Error loading profile:', error);
    showToast('Erro ao carregar perfil', 'error');
  }
}

// ========================================
// LOAD STATISTICS
// ========================================

async function loadStats() {
  try {
    const stats = await api.get('/user/stats');
    
    // Update UI with animations
    animateNumber('totalCompleted', stats.completedLessons);
    animateNumber('totalTracks', stats.startedTracks);
    animateNumber('avgProgress', stats.avgProgress, '%');
    
    console.log('📈 Stats loaded:', stats);
  } catch (error) {
    console.error('❌ Error loading stats:', error);
  }
}

// ========================================
// ANIMATE NUMBER
// ========================================

function animateNumber(elementId, targetValue, suffix = '') {
  const element = document.getElementById(elementId);
  if (!element) return;
  
  const duration = 1000; // 1 second
  const steps = 30;
  const increment = targetValue / steps;
  let current = 0;
  let step = 0;
  
  const timer = setInterval(() => {
    step++;
    current += increment;
    
    if (step >= steps) {
      current = targetValue;
      clearInterval(timer);
    }
    
    element.textContent = Math.round(current) + suffix;
  }, duration / steps);
}

// ========================================
// HANDLE FORM SUBMISSION
// ========================================

document.getElementById('profileForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const name = document.getElementById('name').value.trim();
  const currentPassword = document.querySelector('[name="currentPassword"]').value;
  const newPassword = document.querySelector('[name="newPassword"]').value;
  const confirmPassword = document.querySelector('[name="confirmPassword"]').value;
  
  let hasChanges = false;
  let errors = [];
  
  // Check if name changed
  if (name !== currentUser.name) {
    hasChanges = true;
    if (name.length < 3) {
      errors.push('Nome deve ter pelo menos 3 caracteres');
    }
  }
  
  // Check if password change is requested
  const isChangingPassword = currentPassword || newPassword || confirmPassword;
  
  if (isChangingPassword) {
    hasChanges = true;
    
    if (!currentPassword) {
      errors.push('Senha atual é obrigatória para trocar senha');
    }
    
    if (!newPassword) {
      errors.push('Nova senha é obrigatória');
    } else if (newPassword.length < 8) {
      errors.push('Nova senha deve ter pelo menos 8 caracteres');
    }
    
    if (newPassword !== confirmPassword) {
      errors.push('As senhas não coincidem');
    }
  }
  
  // Show errors if any
  if (errors.length > 0) {
    showToast(errors.join('<br>'), 'error');
    return;
  }
  
  // No changes
  if (!hasChanges) {
    showToast('Nenhuma alteração detectada', 'warning');
    return;
  }
  
  // Show loading
  const submitButton = e.target.querySelector('button[type="submit"]');
  const originalText = submitButton.textContent;
  submitButton.disabled = true;
  submitButton.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Salvando...';
  
  try {
    // Update name if changed
    if (name !== currentUser.name) {
      await api.put('/user/profile', { name });
      currentUser.name = name;
      
      // Update header name
      const userNameInHeader = document.querySelector('.app-user-name');
      if (userNameInHeader) {
        userNameInHeader.textContent = name.replace(/^Dra?\.?\s+/i, '').split(' ')[0];
        document.querySelector('.app-account-info strong').textContent = name;
      }
    }
    
    // Update password if requested
    if (isChangingPassword) {
      await api.put('/user/password', {
        currentPassword,
        newPassword
      });
      
      // Clear password fields
      document.querySelector('[name="currentPassword"]').value = '';
      document.querySelector('[name="newPassword"]').value = '';
      document.querySelector('[name="confirmPassword"]').value = '';
    }
    
    showToast('✅ Perfil atualizado com sucesso!', 'success');
    
  } catch (error) {
    console.error('❌ Error updating profile:', error);
    
    // Check for specific error messages
    if (error.message && error.message.includes('401')) {
      showToast('❌ Senha atual incorreta', 'error');
    } else {
      showToast('❌ Erro ao atualizar perfil. Tente novamente.', 'error');
    }
  } finally {
    // Restore button
    submitButton.disabled = false;
    submitButton.innerHTML = originalText;
  }
});

// ========================================
// PASSWORD STRENGTH INDICATOR
// ========================================

const newPasswordInput = document.querySelector('[name="newPassword"]');
if (newPasswordInput) {
  // Create strength indicator
  const strengthIndicator = document.createElement('div');
  strengthIndicator.id = 'passwordStrength';
  strengthIndicator.className = 'mt-2 hidden';
  newPasswordInput.parentElement.appendChild(strengthIndicator);
  
  newPasswordInput.addEventListener('input', (e) => {
    const password = e.target.value;
    
    if (!password) {
      strengthIndicator.classList.add('hidden');
      return;
    }
    
    const strength = checkPasswordStrength(password);
    
    strengthIndicator.classList.remove('hidden');
    strengthIndicator.innerHTML = `
      <div class="flex items-center justify-between mb-1">
        <span class="text-xs ${strength.color}">Força: ${strength.label}</span>
        <span class="text-xs text-theme-secondary">${strength.width}%</span>
      </div>
      <div class="w-full bg-theme-tertiary rounded-full h-2 overflow-hidden">
        <div class="${strength.color.replace('text-', 'bg-')} h-full transition-all duration-300" style="width: ${strength.width}%"></div>
      </div>
      ${strength.feedback ? `<p class="text-xs text-theme-secondary mt-1">${strength.feedback}</p>` : ''}
    `;
  });
}

// ========================================
// INIT
// ========================================

document.addEventListener('DOMContentLoaded', () => {
  loadProfile();
});
