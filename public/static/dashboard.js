// Dashboard functions - Using native Fetch API (NO AXIOS)

// Auto-load on page ready
window.addEventListener('DOMContentLoaded', () => {
  if (typeof loadDashboard !== 'undefined') {
    loadDashboard();
  }
});

async function loadDashboard() {
  console.log('📊 Loading dashboard...');
  
  try {
    console.log('👤 Fetching user data...');
    const user = await api.get('/user/me');
    console.log('   User data received:', user);
    const userNameEl = document.getElementById('userName');
    if (userNameEl) {
      userNameEl.textContent = user.name;
    }
    
    console.log('🎯 Fetching tracks...');
    const tracksResponse = await api.get('/tracks');
    const tracks = Array.isArray(tracksResponse) ? tracksResponse : [];
    console.log('   Tracks received:', tracks.length, 'tracks');
    
    // Calculate total progress considering ALL lessons from ALL tracks
    let totalCompletedLessons = 0;
    let totalLessonsCount = 0;
    
    tracks.forEach(track => {
      totalLessonsCount += track.total_lessons || 0;
      totalCompletedLessons += track.completed_lessons || 0;
    });
    
    console.log('📊 Total progress calculated:', {
      totalCompletedLessons,
      totalLessonsCount,
      percentage: totalLessonsCount > 0 ? Math.round((totalCompletedLessons / totalLessonsCount) * 100) : 0
    });
    
    const totalProgress = totalLessonsCount > 0 ? (totalCompletedLessons / totalLessonsCount) * 100 : 0;
    
    const totalProgressEl = document.getElementById('totalProgress');
    const progressBarEl = document.getElementById('progressBar');
    const completedLessonsEl = document.getElementById('completedLessons');
    const totalLessonsEl = document.getElementById('totalLessons');
    
    if (totalProgressEl) totalProgressEl.textContent = Math.round(totalProgress) + '%';
    if (progressBarEl) progressBarEl.style.width = totalProgress + '%';
    if (completedLessonsEl) completedLessonsEl.textContent = totalCompletedLessons;
    if (totalLessonsEl) totalLessonsEl.textContent = totalLessonsCount;
    
    const myTracksDiv = document.getElementById('myTracks');
    if (myTracksDiv && tracks.length > 0) {
      myTracksDiv.innerHTML = tracks.slice(0, 6).map(track => `
        <a href="/trilha/${track.slug}" class="bg-theme-secondary border border-theme rounded-2xl overflow-hidden shadow-lg hover:shadow-xl hover:border-primary-500 transition-all duration-300 group flex flex-col h-full">
          <div class="h-48 relative overflow-hidden">
            ${track.cover_image ? `
              <img src="${track.cover_image}" alt="${track.title}" class="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
              <div class="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
            ` : `
              <div class="absolute inset-0 bg-gradient-to-br from-primary-500/20 to-pink-500/20 flex items-center justify-center">
                <i class="fas fa-book-medical text-5xl text-primary-500/50"></i>
              </div>
            `}
            
            <div class="absolute bottom-4 left-4 right-4">
                <h3 class="font-bold text-xl text-white font-display leading-tight drop-shadow-md">${track.title}</h3>
            </div>
          </div>
          
          <div class="p-5 flex-1 flex flex-col">
            <p class="text-theme-secondary text-sm mb-4 line-clamp-2 flex-1">${track.description || ''}</p>
            
            <div class="mt-auto">
                <div class="flex items-center justify-between text-sm mb-2">
                  <span class="text-theme-tertiary flex items-center gap-1.5">
                    <i class="fas fa-video"></i> ${track.total_lessons} aulas
                  </span>
                  <span class="font-bold text-primary-500">
                    ${track.user_progress ? Math.round(track.user_progress) + '%' : 'Iniciar'}
                  </span>
                </div>
                
                <div class="w-full bg-theme-tertiary rounded-full h-2 overflow-hidden">
                    <div class="bg-gradient-to-r from-primary-500 to-pink-500 h-full rounded-full transition-all duration-500" style="width: ${track.user_progress || 0}%"></div>
                </div>
            </div>
          </div>
        </a>
      `).join('');
    } else if (myTracksDiv) {
      myTracksDiv.innerHTML = '<div class="col-span-full text-center py-16 bg-theme-secondary rounded-2xl border border-theme border-dashed text-theme-tertiary"><i class="fas fa-search text-4xl mb-4 opacity-50"></i><p>Nenhuma trilha encontrada</p></div>';
    }
    
    console.log('✅ Dashboard loaded successfully!');
  } catch (error) {
    console.error('❌ Dashboard error:', error);
    
    // Show error message to user
    const myTracksDiv = document.getElementById('myTracks');
    if (myTracksDiv) {
      myTracksDiv.innerHTML = '<div class="col-span-full text-center py-12 text-red-500 bg-red-500/10 rounded-xl border border-red-500/20">Erro ao carregar trilhas. Tente recarregar a página.</div>';
    }
  }
}
