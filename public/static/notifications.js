(() => {
// Notifications system

let notifications = [];
let unreadCount = 0;

// Load notifications on page load
window.addEventListener('DOMContentLoaded', () => {
  loadNotifications();
  
  // Refresh every 5 minutes
  setInterval(loadNotifications, 5 * 60 * 1000);
});

async function loadNotifications() {
  try {
    const data = await api.get('/notifications');
    notifications = data;
    unreadCount = notifications.filter(n => !n.is_read).length;
    
    updateNotificationBadge();
    
    console.log('✅ Notifications loaded:', notifications.length, 'total,', unreadCount, 'unread');
  } catch (error) {
    console.error('❌ Error loading notifications:', error);
  }
}

function updateNotificationBadge() {
  const badge = document.getElementById('notificationBadge');
  if (badge) {
    if (unreadCount > 0) {
      badge.textContent = unreadCount > 99 ? '99+' : unreadCount;
      badge.classList.remove('hidden');
    } else {
      badge.classList.add('hidden');
    }
  }
}

window.toggleNotifications = function() {
  const dropdown = document.getElementById('notificationsDropdown');
  if (!dropdown) return;
  
  const isHidden = dropdown.classList.contains('hidden');
  
  if (isHidden) {
    // Show dropdown
    dropdown.classList.remove('hidden');
    renderNotifications();
  } else {
    // Hide dropdown
    dropdown.classList.add('hidden');
  }
}

function renderNotifications() {
  const container = document.getElementById('notificationsList');
  if (!container) return;
  
  if (notifications.length === 0) {
    container.innerHTML = `
      <div class="text-center py-8 text-theme-secondary">
        <i class="fas fa-bell-slash text-3xl mb-2"></i>
        <p>Nenhuma notificação</p>
      </div>
    `;
    return;
  }
  
  container.onclick = event => {
    const element = event.target.closest('[data-notification-id]');
    if (!element) return;
    const notification = notifications.find(item => item.id === Number(element.dataset.notificationId));
    if (notification) window.handleNotificationClick(notification.id, notification.link_url || '');
  };
  container.innerHTML = notifications.map(notif => `
    <div class="p-4 hover:bg-theme-tertiary border-b border-theme last:border-0 cursor-pointer ${!notif.is_read ? 'bg-primary-500/10' : ''}"
         data-notification-id="${notif.id}">
      <div class="flex items-start gap-3">
        <div class="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${getNotificationColor(notif.type)}">
          <i class="fas ${uiSecurity.icon(notif.icon, getNotificationIcon(notif.type))}"></i>
        </div>
        <div class="flex-1 min-w-0">
          <div class="flex items-start justify-between gap-2">
            <h4 class="font-semibold text-sm ${!notif.is_read ? 'text-theme-primary' : 'text-theme-secondary'}">${uiSecurity.escape(notif.title)}</h4>
            ${!notif.is_read ? '<div class="w-2 h-2 bg-purple-500 rounded-full flex-shrink-0 mt-1"></div>' : ''}
          </div>
          <p class="text-xs text-theme-secondary mt-1">${uiSecurity.escape(notif.message)}</p>
          <p class="text-xs text-gray-500 mt-1">${formatNotificationTime(notif.created_at)}</p>
        </div>
      </div>
    </div>
  `).join('');
}

function getNotificationIcon(type) {
  switch(type) {
    case 'success': return 'fa-check-circle';
    case 'error': return 'fa-times-circle';
    case 'warning': return 'fa-exclamation-triangle';
    default: return 'fa-info-circle';
  }
}

function getNotificationColor(type) {
  switch(type) {
    case 'success': return 'bg-green-700 text-white';
    case 'error': return 'bg-red-700 text-white';
    case 'warning': return 'bg-yellow-700 text-white';
    default: return 'bg-blue-700 text-white';
  }
}

function formatNotificationTime(timestamp) {
  const date = new Date(timestamp);
  const now = new Date();
  const diff = now - date;
  
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  
  if (minutes < 1) return 'Agora';
  if (minutes < 60) return `${minutes}min atrás`;
  if (hours < 24) return `${hours}h atrás`;
  if (days < 7) return `${days}d atrás`;
  
  return date.toLocaleDateString('pt-BR');
}

window.handleNotificationClick = async function(notificationId, linkUrl) {
  try {
    // Mark as read
    await api.post(`/notifications/${notificationId}/read`);
    
    // Update local state
    const notif = notifications.find(n => n.id === notificationId);
    if (notif && !notif.is_read) {
      notif.is_read = true;
      unreadCount--;
      updateNotificationBadge();
      renderNotifications();
    }
    
    // Navigate if has link
    if (linkUrl) {
      const safeURL = uiSecurity.url(linkUrl);
      if (safeURL) window.location.href = safeURL;
    }
  } catch (error) {
    console.error('Error marking notification as read:', error);
  }
}

window.markAllAsRead = async function() {
  try {
    await api.post('/notifications/read-all');
    
    // Update local state
    notifications.forEach(n => n.is_read = true);
    unreadCount = 0;
    
    updateNotificationBadge();
    renderNotifications();
    
    showAlert('Todas as notificações foram marcadas como lidas', 'Sucesso', 'success');
  } catch (error) {
    console.error('Error marking all as read:', error);
    showAlert('Erro ao marcar notificações como lidas', 'Erro', 'error');
  }
}

// Close dropdown when clicking outside
document.addEventListener('click', (e) => {
  const dropdown = document.getElementById('notificationsDropdown');
  const button = document.getElementById('notificationsButton');
  
  if (dropdown && button && !dropdown.contains(e.target) && !button.contains(e.target)) {
    dropdown.classList.add('hidden');
  }
});

})();
