// Tracks page - All tracks grouped by specialty

window.addEventListener('DOMContentLoaded', () => {
  loadAllTracks();
});

async function loadAllTracks() {
  console.log('📚 Loading all tracks...');
  
  try {
    // Load specialties and tracks
    console.log('🎯 Fetching specialties...');
    const specialties = await api.get('/specialties');
    console.log('   Specialties loaded:', specialties.length);
    
    console.log('📦 Fetching tracks...');
    const tracks = await api.get('/tracks');
    console.log('   Tracks loaded:', tracks.length);
    
    const content = document.getElementById('specialtiesContent');
    if (!content) {
      console.error('❌ specialtiesContent element not found!');
      return;
    }
    
    if (specialties.length === 0) {
      content.innerHTML = '<div class="text-center py-12 text-theme-tertiary">Nenhuma especialidade encontrada</div>';
      return;
    }
    
    // Group tracks by specialty
    const tracksBySpecialty = {};
    specialties.forEach(specialty => {
      tracksBySpecialty[specialty.id] = {
        specialty: specialty,
        tracks: tracks.filter(track => track.specialty_id === specialty.id)
      };
    });
    
    // Render specialties with their tracks
    content.innerHTML = specialties.map(specialty => {
      const specialtyTracks = tracksBySpecialty[specialty.id].tracks;
      
      if (specialtyTracks.length === 0) {
        return ''; // Skip specialties with no tracks
      }
      
      return `
        <div class="mb-16">
          <div class="flex items-center mb-8 gap-4">
            <div class="w-14 h-14 bg-gradient-to-br from-primary-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-lg text-white">
              <i class="fas ${specialty.icon || 'fa-book-medical'} text-2xl"></i>
            </div>
            <div>
              <h2 class="text-3xl font-bold font-display text-theme-primary mb-1">${specialty.name}</h2>
              <p class="text-theme-secondary">${specialty.description || ''}</p>
            </div>
          </div>
          
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            ${specialtyTracks.map(track => `
              <a href="/trilha/${track.slug}" class="bg-theme-secondary border border-theme rounded-2xl overflow-hidden shadow-lg hover:shadow-xl hover:border-primary-500 transition-all duration-300 group flex flex-col h-full transform hover:-translate-y-1">
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
                  <p class="text-theme-secondary text-sm mb-4 line-clamp-2 flex-1">${track.description || 'Sem descrição'}</p>
                  
                  <div class="mt-auto">
                    <div class="flex items-center justify-between text-sm mb-3 pt-3 border-t border-theme">
                      <span class="text-theme-tertiary flex items-center gap-1.5">
                        <i class="fas fa-video text-xs"></i> ${track.total_lessons || 0} aulas
                      </span>
                      <span class="text-theme-tertiary flex items-center gap-1.5">
                        <i class="fas fa-clock text-xs"></i> ${Math.round((track.duration_minutes || 0) / 60)}h
                      </span>
                    </div>
                    
                    ${track.user_progress !== undefined && track.user_progress !== null ? `
                      <div class="mb-3">
                        <div class="flex items-center justify-between text-xs mb-1.5">
                          <span class="text-theme-tertiary font-medium">Progresso</span>
                          <span class="text-primary-500 font-bold">${Math.round(track.user_progress)}%</span>
                        </div>
                        <div class="w-full bg-theme-tertiary rounded-full h-2 overflow-hidden">
                          <div class="bg-gradient-to-r from-primary-500 to-pink-500 h-full rounded-full transition-all duration-500" style="width: ${track.user_progress}%"></div>
                        </div>
                      </div>
                      <div class="text-center w-full py-2 rounded-lg bg-primary-500/10 text-primary-600 font-semibold text-sm group-hover:bg-primary-500 group-hover:text-white transition-colors">
                        Continuar Trilha
                      </div>
                    ` : `
                      <div class="text-center w-full py-2 rounded-lg bg-theme-tertiary text-theme-secondary font-semibold text-sm group-hover:bg-primary-500 group-hover:text-white transition-colors">
                        Iniciar Trilha
                      </div>
                    `}
                  </div>
                </div>
              </a>
            `).join('')}
          </div>
        </div>
      `;
    }).join('');
    
    console.log('✅ All tracks loaded successfully!');
    
  } catch (error) {
    console.error('❌ Error loading tracks:', error);
    
    const content = document.getElementById('specialtiesContent');
    if (content) {
      content.innerHTML = '<div class="text-center py-12 text-red-500 bg-red-500/10 rounded-xl border border-red-500/20">Erro ao carregar trilhas. Verifique o console.</div>';
    }
  }
}
