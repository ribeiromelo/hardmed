// Track page functionality
let currentTrack = null;
let seasons = [];

// Load track with all seasons and lessons
async function loadTrack(slug) {
  try {
    console.log('🔍 Loading track:', slug);
    const data = await api.get('/tracks/' + slug);
    console.log('✅ Track data received:', data);
    currentTrack = data.track;
    seasons = data.seasons;
    
    // Update breadcrumb
    document.getElementById('trackBreadcrumb').textContent = currentTrack.title;
    
    // Calculate progress
    let completedLessons = 0;
    let totalLessons = 0;
    seasons.forEach(season => {
      season.lessons.forEach(lesson => {
        totalLessons++;
        if (lesson.is_completed) completedLessons++;
      });
    });
    const progressPercent = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;
    
    // Render track info and seasons
    document.getElementById('trackContent').innerHTML = `
      <div class="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-8 mb-8 border border-gray-700">
        <div class="flex items-start justify-between mb-6">
          <div class="flex-1">
            <h1 class="text-4xl font-bold mb-4">${currentTrack.title}</h1>
            <p class="text-gray-300 text-lg mb-6">${currentTrack.description || ''}</p>
            <div class="flex items-center space-x-6 text-sm text-gray-400">
              <span><i class="fas fa-video mr-2"></i>${currentTrack.total_lessons} aulas</span>
              <span><i class="fas fa-clock mr-2"></i>${Math.round(currentTrack.duration_minutes / 60)}h</span>
              <span><i class="fas fa-chart-line mr-2"></i>${completedLessons}/${totalLessons} completas</span>
            </div>
          </div>
        </div>
        
        ${progressPercent > 0 ? `
          <div class="mt-6">
            <div class="flex items-center justify-between text-sm mb-2">
              <span class="text-gray-400">Seu progresso</span>
              <span class="text-purple-400 font-semibold">${progressPercent}%</span>
            </div>
            <div class="w-full bg-gray-700 rounded-full h-3">
              <div class="bg-gradient-to-r from-purple-500 to-pink-500 h-full rounded-full transition-all duration-500" style="width: ${progressPercent}%"></div>
            </div>
          </div>
        ` : ''}
      </div>
      
      <div class="space-y-4">
        ${seasons.map((season, seasonIndex) => `
          <div class="bg-gray-800 rounded-xl overflow-hidden border border-gray-700">
            <button onclick="toggleSeason(${seasonIndex})" class="w-full flex items-center justify-between p-6 hover:bg-gray-750 transition">
              <div class="flex items-center space-x-4">
                <div class="w-12 h-12 bg-gradient-to-br from-purple-600 to-pink-600 rounded-full flex items-center justify-center font-bold text-lg">
                  ${seasonIndex + 1}
                </div>
                <div class="text-left">
                  <h3 class="text-xl font-bold">${season.title}</h3>
                  <p class="text-sm text-gray-400">${season.lessons.length} aula${season.lessons.length !== 1 ? 's' : ''}</p>
                </div>
              </div>
              <i class="fas fa-chevron-down transition-transform duration-300" id="chevron-${seasonIndex}"></i>
            </button>
            <div id="season-${seasonIndex}" class="hidden border-t border-gray-700">
              ${season.lessons.map((lesson, lessonIndex) => `
                <a href="/aula/${lesson.slug}" class="flex items-center justify-between p-5 hover:bg-gray-750 transition border-b border-gray-700 last:border-0 group">
                  <div class="flex items-center space-x-4 flex-1">
                    <div class="w-8 text-center">
                      ${lesson.is_completed 
                        ? '<i class="fas fa-check-circle text-green-500 text-xl"></i>'
                        : '<i class="fas fa-play-circle text-purple-500 text-xl group-hover:text-purple-400"></i>'
                      }
                    </div>
                    <div class="flex-1">
                      <h4 class="font-semibold text-white group-hover:text-purple-400 transition">${lesson.title}</h4>
                      <div class="flex items-center space-x-3 text-sm text-gray-400 mt-1">
                        <span><i class="fas fa-clock mr-1"></i>${lesson.duration_minutes} min</span>
                        ${lesson.is_completed ? '<span class="text-green-500"><i class="fas fa-check mr-1"></i>Concluída</span>' : ''}
                      </div>
                    </div>
                  </div>
                  <i class="fas fa-chevron-right text-gray-600 group-hover:text-purple-400 transition"></i>
                </a>
              `).join('')}
            </div>
          </div>
        `).join('')}
      </div>
      
      ${totalLessons === 0 ? `
        <div class="text-center py-12 bg-gray-800 rounded-xl border border-gray-700">
          <i class="fas fa-inbox text-5xl text-gray-600 mb-4"></i>
          <p class="text-gray-400">Esta trilha ainda não possui aulas cadastradas.</p>
        </div>
      ` : ''}
    `;
  } catch (error) {
    console.error('❌ Error loading track:', error);
    console.error('Error details:', error.message, error.stack);
    document.getElementById('trackContent').innerHTML = `
      <div class="text-center py-12 bg-gray-800 rounded-xl border border-gray-700">
        <i class="fas fa-exclamation-triangle text-5xl text-red-500 mb-4"></i>
        <p class="text-gray-400 mb-4">Erro ao carregar trilha</p>
        <a href="/dashboard" class="text-purple-400 hover:text-purple-300">
          <i class="fas fa-arrow-left mr-2"></i>Voltar para o dashboard
        </a>
      </div>
    `;
  }
}

// Toggle season visibility
window.toggleSeason = function(index) {
  const seasonDiv = document.getElementById('season-' + index);
  const chevron = document.getElementById('chevron-' + index);
  
  if (seasonDiv.classList.contains('hidden')) {
    seasonDiv.classList.remove('hidden');
    chevron.classList.add('rotate-180');
  } else {
    seasonDiv.classList.add('hidden');
    chevron.classList.remove('rotate-180');
  }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
  console.log('🚀 Track page loaded, slug:', window.trackSlug);
  console.log('🔧 API available?', typeof window.api !== 'undefined');
  
  const slug = window.trackSlug;
  if (!slug) {
    console.error('❌ No trackSlug found!');
    return;
  }
  
  // Wait for API to be available
  if (typeof window.api === 'undefined') {
    console.log('⏳ Waiting for API to load...');
    setTimeout(() => {
      if (typeof window.api !== 'undefined') {
        console.log('✅ API loaded, starting track load');
        loadTrack(slug);
      } else {
        console.error('❌ API still not available after 100ms');
      }
    }, 100);
  } else {
    loadTrack(slug);
  }
});
