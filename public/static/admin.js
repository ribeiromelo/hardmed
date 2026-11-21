// Admin dashboard - Using native Fetch API

// Auto-load on page ready
window.addEventListener('DOMContentLoaded', () => {
  loadAdminStats();
});

async function loadAdminStats() {
  console.log('📊 Loading admin stats...');
  
  try {
    console.log('📈 Fetching stats...');
    const stats = await api.get('/admin/stats');
    console.log('   Stats received:', stats);
    
    document.getElementById('totalUsers').textContent = stats.total_users;
    document.getElementById('totalTracks').textContent = stats.total_tracks;
    document.getElementById('totalLessons').textContent = stats.total_lessons;
    document.getElementById('dailyViews').textContent = stats.daily_views;
    
    console.log('👥 Fetching users...');
    const users = await api.get('/admin/users');
    console.log('   Users received:', users.length, 'users');
    
    const recentUsersDiv = document.getElementById('recentUsers');
    if (users.length > 0) {
      recentUsersDiv.innerHTML = users.slice(0, 5).map(user => `
        <div class="flex items-center justify-between p-3 bg-theme-tertiary rounded-lg">
          <div>
            <p class="font-semibold">${uiSecurity.escape(user.name)}</p>
            <p class="text-sm text-theme-secondary">${uiSecurity.escape(user.email)}</p>
          </div>
          <span class="text-xs ${user.role === 'admin' ? 'bg-navy-600 text-white' : 'bg-theme-secondary text-theme-secondary'} px-2 py-1 rounded">
            ${uiSecurity.escape(user.role)}
          </span>
        </div>
      `).join('');
    }
    
    console.log('✅ Admin stats loaded successfully!');
  } catch (error) {
    console.error('❌ Error loading admin stats:', error);
    
    if (error.status === 403) {
      showAlert('Acesso negado! Apenas administradores podem acessar esta página.', 'Acesso Negado', 'error');
      window.location.href = '/dashboard';
    }
  }
}
