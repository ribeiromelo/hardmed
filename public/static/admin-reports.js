// Admin reports page - Using native Fetch API

window.addEventListener('DOMContentLoaded', () => {
  loadReports();
});

async function loadReports() {
  console.log('📊 Loading admin reports...');
  
  try {
    // Load all data in parallel
    await Promise.all([
      loadGeneralStats(),
      loadPopularTracks(),
      loadPopularLessons(),
      loadActiveUsers(),
      loadSpecialtyProgress(),
      loadCompletionRates()
    ]);
    
    console.log('✅ Reports loaded successfully');
  } catch (error) {
    console.error('❌ Error loading reports:', error);
  }
}

async function loadGeneralStats() {
  try {
    // Get users count
    const users = await api.get('/users');
    document.getElementById('reportTotalUsers').textContent = users.length;
    
    // Count new users today
    const today = new Date().toDateString();
    const newUsersToday = users.filter(u => {
      const createdDate = new Date(u.created_at).toDateString();
      return createdDate === today;
    }).length;
    document.getElementById('reportNewUsers').textContent = `+${newUsersToday} hoje`;
    
    // Get lessons for views count (mock data for now)
    const lessons = await api.get('/lessons');
    const totalViews = lessons.reduce((sum, l) => sum + (l.views_count || 0), 0);
    document.getElementById('reportTotalViews').textContent = totalViews.toLocaleString('pt-BR');
    document.getElementById('reportViewsToday').textContent = '+0 hoje'; // Would need daily tracking
    
    // Calculate completion rate (mock calculation)
    const completionRate = users.length > 0 ? Math.round((users.length * 0.35)) : 0; // 35% mock rate
    document.getElementById('reportCompletionRate').textContent = completionRate + '%';
    
    // Calculate average time (mock data)
    const avgTime = Math.round(totalViews / users.length * 0.5) || 0;
    document.getElementById('reportAvgTime').textContent = avgTime + 'h';
    
  } catch (error) {
    console.error('Error loading general stats:', error);
  }
}

async function loadPopularTracks() {
  try {
    const tracks = await api.get('/tracks');
    
    // Sort by total_lessons (mock popularity metric)
    const popularTracks = tracks
      .sort((a, b) => (b.total_lessons || 0) - (a.total_lessons || 0))
      .slice(0, 5);
    
    const container = document.getElementById('popularTracks');
    
    if (popularTracks.length === 0) {
      container.innerHTML = '<p class="text-gray-400 text-center py-4">Nenhuma trilha encontrada</p>';
      return;
    }
    
    container.innerHTML = popularTracks.map((track, index) => `
      <div class="flex items-center justify-between p-4 bg-gray-700/50 rounded-lg hover:bg-gray-700 transition">
        <div class="flex items-center space-x-4">
          <div class="w-8 h-8 rounded-full bg-orange-600 flex items-center justify-center font-bold">
            ${index + 1}
          </div>
          <div>
            <p class="font-semibold">${track.title}</p>
            <p class="text-sm text-gray-400">${track.total_lessons || 0} aulas</p>
          </div>
        </div>
        <div class="text-right">
          <p class="font-bold text-orange-400">${Math.round(Math.random() * 500 + 100)}</p>
          <p class="text-xs text-gray-400">visualizações</p>
        </div>
      </div>
    `).join('');
    
  } catch (error) {
    console.error('Error loading popular tracks:', error);
    document.getElementById('popularTracks').innerHTML = 
      '<p class="text-red-400 text-center py-4">Erro ao carregar dados</p>';
  }
}

async function loadPopularLessons() {
  try {
    const lessons = await api.get('/lessons');
    
    // Sort by views_count
    const popularLessons = lessons
      .sort((a, b) => (b.views_count || 0) - (a.views_count || 0))
      .slice(0, 5);
    
    const container = document.getElementById('popularLessons');
    
    if (popularLessons.length === 0) {
      container.innerHTML = '<p class="text-gray-400 text-center py-4">Nenhuma aula encontrada</p>';
      return;
    }
    
    container.innerHTML = popularLessons.map((lesson, index) => `
      <div class="flex items-center justify-between p-4 bg-gray-700/50 rounded-lg hover:bg-gray-700 transition">
        <div class="flex items-center space-x-4">
          <div class="w-8 h-8 rounded-full bg-yellow-600 flex items-center justify-center font-bold">
            ${index + 1}
          </div>
          <div>
            <p class="font-semibold">${lesson.title}</p>
            <p class="text-sm text-gray-400">${lesson.track_title || 'Trilha desconhecida'}</p>
          </div>
        </div>
        <div class="text-right">
          <p class="font-bold text-yellow-400">${lesson.views_count || 0}</p>
          <p class="text-xs text-gray-400">visualizações</p>
        </div>
      </div>
    `).join('');
    
  } catch (error) {
    console.error('Error loading popular lessons:', error);
    document.getElementById('popularLessons').innerHTML = 
      '<p class="text-red-400 text-center py-4">Erro ao carregar dados</p>';
  }
}

async function loadActiveUsers() {
  try {
    const users = await api.get('/users');
    
    // Sort by last_access (most recent first)
    const activeUsers = users
      .filter(u => u.last_access)
      .sort((a, b) => new Date(b.last_access) - new Date(a.last_access))
      .slice(0, 10);
    
    const tbody = document.getElementById('activeUsersBody');
    
    if (activeUsers.length === 0) {
      tbody.innerHTML = '<tr><td colspan="6" class="text-center text-gray-400 py-8">Nenhum usuário ativo</td></tr>';
      return;
    }
    
    tbody.innerHTML = activeUsers.map((user, index) => {
      const lastAccess = user.last_access ? 
        new Date(user.last_access).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) :
        'Nunca';
      
      // Mock data for completed lessons and tracks
      const completedLessons = Math.round(Math.random() * 50 + 10);
      const tracksStarted = Math.round(Math.random() * 8 + 1);
      const totalTime = Math.round(completedLessons * 0.8) + 'h';
      
      return `
        <tr class="border-b border-gray-700 hover:bg-gray-750">
          <td class="py-3 px-4">
            <div class="w-8 h-8 rounded-full ${index < 3 ? 'bg-yellow-600' : 'bg-gray-600'} flex items-center justify-center font-bold">
              ${index + 1}
            </div>
          </td>
          <td class="py-3 px-4">
            <p class="font-semibold">${user.name}</p>
            <p class="text-sm text-gray-400">${user.email}</p>
          </td>
          <td class="py-3 px-4 text-center font-bold text-green-400">${completedLessons}</td>
          <td class="py-3 px-4 text-center">${tracksStarted}</td>
          <td class="py-3 px-4 text-center">${totalTime}</td>
          <td class="py-3 px-4 text-sm text-gray-400">${lastAccess}</td>
        </tr>
      `;
    }).join('');
    
  } catch (error) {
    console.error('Error loading active users:', error);
    document.getElementById('activeUsersBody').innerHTML = 
      '<tr><td colspan="6" class="text-center text-red-400 py-8">Erro ao carregar dados</td></tr>';
  }
}

async function loadSpecialtyProgress() {
  try {
    const specialties = await api.get('/specialties');
    const tracks = await api.get('/tracks');
    
    const container = document.getElementById('specialtyProgress');
    
    if (specialties.length === 0) {
      container.innerHTML = '<p class="text-gray-400 text-center py-4">Nenhuma especialidade encontrada</p>';
      return;
    }
    
    container.innerHTML = specialties.map(specialty => {
      const specialtyTracks = tracks.filter(t => t.specialty_id === specialty.id);
      const totalLessons = specialtyTracks.reduce((sum, t) => sum + (t.total_lessons || 0), 0);
      
      // Mock completion percentage
      const completionPercent = Math.round(Math.random() * 40 + 20);
      
      return `
        <div>
          <div class="flex items-center justify-between mb-2">
            <div class="flex items-center space-x-3">
              <i class="fas ${specialty.icon || 'fa-book-medical'} text-xl text-purple-400"></i>
              <span class="font-semibold">${specialty.name}</span>
            </div>
            <div class="text-sm text-gray-400">
              <span class="font-bold text-white">${specialtyTracks.length}</span> trilhas • 
              <span class="font-bold text-white">${totalLessons}</span> aulas
            </div>
          </div>
          <div class="w-full bg-gray-700 rounded-full h-3 overflow-hidden">
            <div class="h-full bg-gradient-to-r from-purple-600 to-pink-600 transition-all duration-500" 
                 style="width: ${completionPercent}%"></div>
          </div>
          <p class="text-xs text-gray-400 mt-1 text-right">${completionPercent}% de conclusão média</p>
        </div>
      `;
    }).join('');
    
  } catch (error) {
    console.error('Error loading specialty progress:', error);
    document.getElementById('specialtyProgress').innerHTML = 
      '<p class="text-red-400 text-center py-4">Erro ao carregar dados</p>';
  }
}

async function loadCompletionRates() {
  try {
    const tracks = await api.get('/tracks');
    const tbody = document.getElementById('completionRatesBody');
    
    if (tracks.length === 0) {
      tbody.innerHTML = '<tr><td colspan="5" class="text-center text-gray-400 py-8">Nenhuma trilha encontrada</td></tr>';
      return;
    }
    
    tbody.innerHTML = tracks.map(track => {
      // Mock data for enrolled, in progress, and completed
      const enrolled = Math.round(Math.random() * 200 + 50);
      const inProgress = Math.round(enrolled * (Math.random() * 0.4 + 0.3)); // 30-70%
      const completed = Math.round(enrolled * (Math.random() * 0.3 + 0.1)); // 10-40%
      const completionRate = Math.round((completed / enrolled) * 100);
      
      return `
        <tr class="border-b border-gray-700 hover:bg-gray-750">
          <td class="py-3 px-4">
            <p class="font-semibold">${track.title}</p>
            <p class="text-sm text-gray-400">${track.total_lessons || 0} aulas</p>
          </td>
          <td class="py-3 px-4 text-center font-bold">${enrolled}</td>
          <td class="py-3 px-4 text-center text-yellow-400">${inProgress}</td>
          <td class="py-3 px-4 text-center text-green-400">${completed}</td>
          <td class="py-3 px-4">
            <div class="flex items-center space-x-2">
              <div class="flex-1 bg-gray-700 rounded-full h-2 overflow-hidden">
                <div class="h-full bg-green-600" style="width: ${completionRate}%"></div>
              </div>
              <span class="text-sm font-bold w-12 text-right">${completionRate}%</span>
            </div>
          </td>
        </tr>
      `;
    }).join('');
    
  } catch (error) {
    console.error('Error loading completion rates:', error);
    document.getElementById('completionRatesBody').innerHTML = 
      '<tr><td colspan="5" class="text-center text-red-400 py-8">Erro ao carregar dados</td></tr>';
  }
}

window.refreshReports = function() {
  showAlert('Atualizando relatórios...', 'Info', 'info');
  loadReports();
};

window.exportReport = function() {
  showAlert('Funcionalidade de exportação em desenvolvimento', 'Info', 'info');
  
  // Future implementation:
  // - Generate PDF report
  // - Export to CSV/Excel
  // - Send report by email
};
