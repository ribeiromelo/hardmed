// ========================================
// ADMIN - GERENCIAMENTO DE NOTIFICAÇÕES
// ========================================

let notifications = [];
let editingId = null;

// ========================================
// LOAD & RENDER
// ========================================

async function loadNotifications() {
  try {
    const data = await api.get('/admin/notifications');
    notifications = data;
    renderNotifications();
  } catch (error) {
    console.error('❌ Erro ao carregar notificações:', error);
    showToast('Erro ao carregar notificações', 'error');
  }
}

function renderNotifications() {
  const container = document.getElementById('notificationsTable');
  
  if (notifications.length === 0) {
    container.innerHTML = `
      <div class="text-center py-12">
        <i class="fas fa-bell-slash text-5xl text-gray-600 mb-4"></i>
        <p class="text-theme-secondary text-lg">Nenhuma notificação criada ainda</p>
        <button onclick="openCreateModal()" class="btn btn-primary mt-4">
          <i class="fas fa-plus mr-2"></i>Criar primeira notificação
        </button>
      </div>
    `;
    return;
  }
  
  container.innerHTML = `
    <div class="overflow-x-auto">
      <table class="w-full">
        <thead>
          <tr class="border-b border-theme">
            <th class="text-left py-3 px-4">Status</th>
            <th class="text-left py-3 px-4">Tipo</th>
            <th class="text-left py-3 px-4">Título</th>
            <th class="text-left py-3 px-4">Mensagem</th>
            <th class="text-left py-3 px-4">Criada em</th>
            <th class="text-left py-3 px-4">Expira em</th>
            <th class="text-right py-3 px-4">Ações</th>
          </tr>
        </thead>
        <tbody>
          ${notifications.map(notification => `
            <tr class="border-b border-theme hover:bg-gray-750">
              <td class="py-3 px-4">
                ${notification.is_active ? 
                  '<span class="px-2 py-1 bg-green-700 text-white text-xs rounded">Ativa</span>' :
                  '<span class="px-2 py-1 bg-theme-tertiary text-xs rounded">Inativa</span>'
                }
              </td>
              <td class="py-3 px-4">
                ${getTypeLabel(notification.type)}
              </td>
              <td class="py-3 px-4 font-medium">${escapeHtml(notification.title)}</td>
              <td class="py-3 px-4 text-sm text-theme-secondary max-w-md truncate">${escapeHtml(notification.message)}</td>
              <td class="py-3 px-4 text-sm text-theme-secondary">${formatDate(notification.created_at)}</td>
              <td class="py-3 px-4 text-sm text-theme-secondary">
                ${notification.expires_at ? formatDate(notification.expires_at) : 'Nunca'}
              </td>
              <td class="py-3 px-4 text-right">
                <button onclick="toggleActive(${notification.id}, ${Number(notification.is_active) === 1 ? 1 : 0})" class="text-blue-400 hover:text-blue-300 mr-3" title="Ativar/Desativar">
                  <i class="fas ${notification.is_active ? 'fa-eye-slash' : 'fa-eye'}"></i>
                </button>
                <button onclick="editNotification(${notification.id})" class="text-yellow-400 hover:text-yellow-300 mr-3" title="Editar">
                  <i class="fas fa-edit"></i>
                </button>
                <button onclick="deleteNotification(${notification.id})" class="text-red-400 hover:text-red-300" title="Deletar">
                  <i class="fas fa-trash"></i>
                </button>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;
}

// ========================================
// MODAL CONTROLS
// ========================================

window.openCreateModal = function() {
  editingId = null;
  document.getElementById('modalTitle').textContent = 'Nova Notificação';
  document.getElementById('notificationForm').reset();
  document.getElementById('notificationId').value = '';
  document.getElementById('is_active').checked = true;
  document.getElementById('notificationModal').classList.remove('hidden');
  document.getElementById('notificationModal').classList.add('flex');
}

window.closeModal = function() {
  document.getElementById('notificationModal').classList.add('hidden');
  document.getElementById('notificationModal').classList.remove('flex');
  editingId = null;
}

window.editNotification = async function(id) {
  editingId = id;
  const notification = notifications.find(n => n.id === id);
  
  if (!notification) {
    showToast('Notificação não encontrada', 'error');
    return;
  }
  
  document.getElementById('modalTitle').textContent = 'Editar Notificação';
  document.getElementById('notificationId').value = notification.id;
  document.getElementById('title').value = notification.title;
  document.getElementById('message').value = notification.message;
  document.getElementById('type').value = notification.type;
  document.getElementById('icon').value = notification.icon || '';
  document.getElementById('link_url').value = notification.link_url || '';
  document.getElementById('is_active').checked = notification.is_active === 1;
  
  // Format expires_at for datetime-local input
  if (notification.expires_at) {
    const date = new Date(notification.expires_at);
    const localDateTime = new Date(date.getTime() - date.getTimezoneOffset() * 60000)
      .toISOString()
      .slice(0, 16);
    document.getElementById('expires_at').value = localDateTime;
  } else {
    document.getElementById('expires_at').value = '';
  }
  
  document.getElementById('notificationModal').classList.remove('hidden');
  document.getElementById('notificationModal').classList.add('flex');
}

// ========================================
// CRUD OPERATIONS
// ========================================

document.getElementById('notificationForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const formData = {
    title: document.getElementById('title').value.trim(),
    message: document.getElementById('message').value.trim(),
    type: document.getElementById('type').value,
    icon: document.getElementById('icon').value.trim() || null,
    link_url: document.getElementById('link_url').value.trim() || null,
    is_active: document.getElementById('is_active').checked ? 1 : 0,
    expires_at: document.getElementById('expires_at').value || null
  };
  
  try {
    if (editingId) {
      // UPDATE
      await api.put(`/admin/notifications/${editingId}`, formData);
      showToast('Notificação atualizada com sucesso!', 'success');
    } else {
      // CREATE
      await api.post('/admin/notifications', formData);
      showToast('Notificação criada com sucesso!', 'success');
    }
    
    closeModal();
    await loadNotifications();
  } catch (error) {
    console.error('❌ Erro ao salvar notificação:', error);
    showToast(error.message || 'Erro ao salvar notificação', 'error');
  }
});

window.deleteNotification = async function(id) {
  const confirmed = await showConfirm(
    'Tem certeza que deseja deletar esta notificação?',
    'Esta ação não pode ser desfeita. A notificação será removida permanentemente.'
  );
  
  if (!confirmed) return;
  
  try {
    await api.delete(`/admin/notifications/${id}`);
    showToast('Notificação deletada com sucesso!', 'success');
    await loadNotifications();
  } catch (error) {
    console.error('❌ Erro ao deletar notificação:', error);
    showToast('Erro ao deletar notificação', 'error');
  }
}

window.toggleActive = async function(id, currentStatus) {
  const newStatus = currentStatus ? 0 : 1;
  
  try {
    await api.put(`/admin/notifications/${id}`, { is_active: newStatus });
    showToast(
      newStatus ? 'Notificação ativada!' : 'Notificação desativada!',
      'success'
    );
    await loadNotifications();
  } catch (error) {
    console.error('❌ Erro ao atualizar status:', error);
    showToast('Erro ao atualizar status', 'error');
  }
}

// ========================================
// HELPERS
// ========================================

function getTypeLabel(type) {
  const types = {
    info: '<span class="px-2 py-1 bg-blue-700 text-white text-xs rounded"><i class="fas fa-info-circle mr-1"></i>Info</span>',
    success: '<span class="px-2 py-1 bg-green-700 text-white text-xs rounded"><i class="fas fa-check-circle mr-1"></i>Sucesso</span>',
    warning: '<span class="px-2 py-1 bg-yellow-700 text-white text-xs rounded"><i class="fas fa-exclamation-triangle mr-1"></i>Aviso</span>',
    error: '<span class="px-2 py-1 bg-red-700 text-white text-xs rounded"><i class="fas fa-times-circle mr-1"></i>Erro</span>'
  };
  return types[type] || types.info;
}

function formatDate(dateString) {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${day}/${month}/${year} ${hours}:${minutes}`;
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// ========================================
// INIT
// ========================================

document.addEventListener('DOMContentLoaded', () => {
  loadNotifications();
});
