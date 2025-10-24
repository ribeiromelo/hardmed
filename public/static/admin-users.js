// Admin users management functions

async function loadUsers() {
  console.log('👥 Loading users...');
  
  try {
    console.log('📡 Fetching users...');
    const response = await axios.get('/admin/users');
    console.log('   Response:', response);
    const users = response.data;
    console.log('   Users received:', users.length, 'users');
    
    const tbody = document.getElementById('usersTable');
    if (!tbody) {
      console.error('❌ usersTable element not found!');
      return;
    }
    
    tbody.innerHTML = users.map(user => `
      <tr class="border-b border-gray-700 hover:bg-gray-750">
        <td class="py-3 px-4">${user.name}</td>
        <td class="py-3 px-4">${user.email}</td>
        <td class="py-3 px-4">
          <span class="text-xs bg-${user.role === 'admin' ? 'purple' : 'blue'}-600 px-2 py-1 rounded">
            ${user.role}
          </span>
        </td>
        <td class="py-3 px-4">${Math.round(user.avg_progress || 0)}%</td>
        <td class="py-3 px-4 text-sm text-gray-400">
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
    console.error('   Error details:', {
      message: error.message,
      response: error.response,
      status: error.response?.status,
      data: error.response?.data
    });
    
    if (error.response?.status === 403) {
      alert('Acesso negado!');
      window.location.href = '/dashboard';
    }
  }
}
