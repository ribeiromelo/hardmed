// Admin users management - Using native Fetch API

// Auto-load on page ready
window.addEventListener('DOMContentLoaded', () => {
  loadUsers();
});

async function loadUsers() {
  console.log('👥 Loading users...');
  
  try {
    console.log('📡 Fetching users...');
    const users = await api.get('/admin/users');
    console.log('   Users received:', users.length, 'users');
    
    const tbody = document.getElementById('usersTable');
    if (!tbody) {
      console.error('❌ usersTable element not found!');
      return;
    }
    
    tbody.innerHTML = users.map(user => `
      <tr class="border-b border-theme hover:bg-gray-750">
        <td class="py-3 px-4">${uiSecurity.escape(user.name)}</td>
        <td class="py-3 px-4">${uiSecurity.escape(user.email)}</td>
        <td class="py-3 px-4">
          <span class="text-xs ${user.role === 'admin' ? 'bg-navy-600 text-white' : 'bg-theme-tertiary text-theme-primary'} px-2 py-1 rounded">
            ${uiSecurity.escape(user.role)}
          </span>
        </td>
        <td class="py-3 px-4">${Math.round(user.avg_progress || 0)}%</td>
        <td class="py-3 px-4 text-sm text-theme-secondary">
          ${user.last_access ? new Date(user.last_access).toLocaleDateString('pt-BR') : 'Nunca'}
        </td>
        <td class="py-3 px-4">
          <button class="text-blue-400 hover:text-blue-300 mr-2" title="Editar">
            <i class="fas fa-edit"></i>
          </button>
          <button class="text-red-400 hover:text-red-300" title="Desativar">
            <i class="fas fa-ban"></i>
          </button>
        </td>
      </tr>
    `).join('');
    
    console.log('✅ Users loaded successfully!');
  } catch (error) {
    console.error('❌ Error loading users:', error);
    
    if (error.status === 403) {
      showAlert('Acesso negado!', 'Erro', 'error');
      window.location.href = '/dashboard';
    }
  }
}
