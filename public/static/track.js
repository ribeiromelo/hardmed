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
    const trackBreadcrumb = document.getElementById('trackBreadcrumb');
    if(trackBreadcrumb) trackBreadcrumb.textContent = currentTrack.title;
    
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
      <div class="bg-gradient-to-br from-theme-secondary to-theme-tertiary rounded-3xl p-8 md:p-10 mb-10 border border-theme shadow-lg relative overflow-hidden group">
        <div class="absolute inset-0 bg-primary-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
        <div class="flex flex-col md:flex-row md:items-start justify-between gap-6 relative z-10">
          <div class="flex-1">
            <h1 class="text-3xl md:text-5xl font-bold mb-4 font-display text-theme-primary leading-tight">${uiSecurity.escape(currentTrack.title)}</h1>
            <p class="text-theme-secondary text-lg mb-8 leading-relaxed max-w-3xl">${uiSecurity.escape(currentTrack.description || '')}</p>
            
            <div class="flex flex-wrap items-center gap-6 text-sm md:text-base text-theme-tertiary font-medium">
              <span class="flex items-center gap-2 px-3 py-1.5 rounded-full bg-theme-primary border border-theme"><i class="fas fa-video text-primary-500"></i> ${uiSecurity.number(currentTrack.total_lessons)} aulas</span>
              <span class="flex items-center gap-2 px-3 py-1.5 rounded-full bg-theme-primary border border-theme"><i class="fas fa-clock text-primary-500"></i> ${Math.round(currentTrack.duration_minutes / 60)}h</span>
              <span class="flex items-center gap-2 px-3 py-1.5 rounded-full bg-theme-primary border border-theme"><i class="fas fa-chart-line text-primary-500"></i> ${completedLessons}/${totalLessons} completas</span>
            </div>
          </div>
          
          ${progressPercent > 0 ? `
            <div class="w-full md:w-64 bg-theme-primary p-5 rounded-2xl border border-theme shadow-sm">
              <div class="flex items-center justify-between text-sm mb-3">
                <span class="text-theme-tertiary font-medium">Seu progresso</span>
                <span class="text-primary-500 font-bold">${progressPercent}%</span>
              </div>
              <div class="w-full bg-theme-tertiary rounded-full h-3 overflow-hidden">
                <div class="bg-accent-500 h-full rounded-full transition-all duration-1000 ease-out relative" style="width: ${progressPercent}%">
                    <div class="absolute inset-0 bg-white/20 animate-pulse"></div>
                </div>
              </div>
              <p class="text-xs text-theme-tertiary mt-3 text-center">Continue assim! 🚀</p>
            </div>
          ` : ''}
        </div>
      </div>
      
      <div class="space-y-6">
        ${seasons.map((season, seasonIndex) => `
          <div class="bg-theme-secondary rounded-2xl overflow-hidden border border-theme shadow-sm hover:shadow-md transition-shadow">
            <button id="season-toggle-${seasonIndex}" aria-expanded="false" aria-controls="season-${seasonIndex}" onclick="toggleSeason(${seasonIndex})" class="w-full flex items-center justify-between p-6 md:p-8 hover:bg-theme-tertiary/50 transition-colors group text-left">
              <div class="flex items-center gap-5 md:gap-6">
                <div class="w-12 h-12 md:w-14 md:h-14 bg-gradient-to-br from-primary-500 to-navy-500 rounded-2xl flex items-center justify-center font-bold text-xl text-white shadow-lg shadow-primary-500/20 group-hover:scale-110 transition-transform">
                  ${seasonIndex + 1}
                </div>
                <div>
                  <h3 class="text-xl md:text-2xl font-bold text-theme-primary font-display mb-1">${uiSecurity.escape(season.title)}</h3>
                  <p class="text-sm text-theme-tertiary font-medium flex items-center gap-2">
                    <span class="w-1.5 h-1.5 rounded-full bg-theme-tertiary"></span>
                    ${season.lessons.length} aula${season.lessons.length !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>
              <div class="w-10 h-10 rounded-full bg-theme-tertiary flex items-center justify-center text-theme-secondary group-hover:bg-primary-500 group-hover:text-white transition-all">
                <i class="fas fa-chevron-down transition-transform duration-300" id="chevron-${seasonIndex}"></i>
              </div>
            </button>
            
            <div id="season-${seasonIndex}" class="hidden border-t border-theme bg-theme-primary/30">
              <div class="divide-y divide-theme">
                ${season.lessons.map((lesson, lessonIndex) => `
                  <a href="/aula/${encodeURIComponent(lesson.slug)}" class="flex items-center justify-between p-5 md:p-6 hover:bg-theme-tertiary/30 transition-colors group">
                    <div class="flex items-center gap-5 flex-1 min-w-0">
                      <div class="w-8 flex-shrink-0 flex justify-center">
                        ${lesson.is_completed 
                          ? '<div class="w-8 h-8 rounded-full bg-green-500/10 flex items-center justify-center"><i class="fas fa-check text-green-500"></i></div>'
                          : '<div class="w-8 h-8 rounded-full bg-primary-500/10 flex items-center justify-center group-hover:bg-primary-500 group-hover:text-white transition-colors"><i class="fas fa-play text-primary-500 text-xs group-hover:text-white"></i></div>'
                        }
                      </div>
                      <div class="flex-1 min-w-0">
                        <h4 class="font-semibold text-theme-primary text-lg mb-1 group-hover:text-primary-500 transition-colors truncate pr-4">${uiSecurity.escape(lesson.title)}</h4>
                        <div class="flex items-center gap-4 text-xs md:text-sm text-theme-tertiary">
                          <span class="flex items-center gap-1.5"><i class="fas fa-clock"></i>${uiSecurity.number(lesson.duration_minutes)} min</span>
                          ${lesson.is_completed ? '<span class="text-green-500 font-medium flex items-center gap-1"><i class="fas fa-check-circle"></i> Concluída</span>' : ''}
                        </div>
                      </div>
                    </div>
                    <i class="fas fa-chevron-right text-theme-tertiary group-hover:text-primary-500 transition-transform group-hover:translate-x-1"></i>
                  </a>
                `).join('')}
              </div>
            </div>
          </div>
        `).join('')}
      </div>
      
      ${totalLessons === 0 ? `
        <div class="text-center py-20 bg-theme-secondary rounded-2xl border border-theme border-dashed">
          <div class="w-20 h-20 rounded-full bg-theme-tertiary flex items-center justify-center mx-auto mb-6">
            <i class="fas fa-inbox text-4xl text-theme-tertiary"></i>
          </div>
          <h3 class="text-xl font-bold text-theme-primary mb-2">Trilha em construção</h3>
          <p class="text-theme-secondary">Esta trilha ainda não possui aulas cadastradas.</p>
        </div>
      ` : ''}
    `;
  } catch (error) {
    console.error('❌ Error loading track:', error);
    document.getElementById('trackContent').innerHTML = `
      <div class="text-center py-16 bg-red-500/5 rounded-2xl border border-red-500/20">
        <i class="fas fa-exclamation-triangle text-5xl text-red-500 mb-6"></i>
        <h3 class="text-xl font-bold text-red-500 mb-2">Erro ao carregar trilha</h3>
        <p class="text-theme-secondary mb-6">Não foi possível carregar o conteúdo. Tente novamente.</p>
        <a href="/dashboard" class="btn btn-secondary text-sm">
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
    document.getElementById('season-toggle-' + index)?.setAttribute('aria-expanded', 'true');
    chevron.classList.add('rotate-180');
  } else {
    seasonDiv.classList.add('hidden');
    document.getElementById('season-toggle-' + index)?.setAttribute('aria-expanded', 'false');
    chevron.classList.remove('rotate-180');
  }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
  const slug = window.trackSlug;
  if (!slug) return;
  
  if (typeof window.api === 'undefined') {
    setTimeout(() => { if (typeof window.api !== 'undefined') loadTrack(slug); }, 100);
  } else {
    loadTrack(slug);
  }
});
