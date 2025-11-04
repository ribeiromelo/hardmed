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
      content.innerHTML = '<div class="text-center py-12 text-gray-400">Nenhuma especialidade encontrada</div>';
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
        <div class="mb-12">
          <div class="flex items-center mb-6">
            <div class="w-12 h-12 bg-gradient-to-br from-purple-600 to-pink-600 rounded-full flex items-center justify-center mr-4">
              <i class="fas ${specialty.icon || 'fa-book-medical'} text-xl"></i>
            </div>
            <div>
              <h2 class="text-2xl font-bold">${specialty.name}</h2>
              <p class="text-gray-400">${specialty.description || ''}</p>
            </div>
          </div>
          
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            ${specialtyTracks.map(track => `
              <a href="/trilha/${track.slug}" class="bg-gray-800 rounded-xl overflow-hidden card-hover group">
                <div class="h-48 bg-gradient-to-br from-purple-600/20 to-pink-600/20 flex items-center justify-center relative overflow-hidden">
                  ${track.cover_image ? `
                    <img src="${track.cover_image}" alt="${track.title}" class="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" />
                    <div class="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/50 to-transparent"></div>
                  ` : `
                    <i class="fas fa-book-medical text-6xl gradient-text"></i>
                  `}
                </div>
                <div class="p-6">
                  <h3 class="font-bold text-xl mb-2">${track.title}</h3>
                  <p class="text-gray-400 text-sm mb-4 line-clamp-2">${track.description || 'Sem descrição'}</p>
                  
                  <div class="flex items-center justify-between text-sm mb-3">
                    <span class="text-gray-400">
                      <i class="fas fa-video mr-1"></i> ${track.total_lessons || 0} aulas
                    </span>
                    <span class="text-gray-400">
                      <i class="fas fa-clock mr-1"></i> ${Math.round((track.duration_minutes || 0) / 60)}h
                    </span>
                  </div>
                  
                  ${track.user_progress !== undefined && track.user_progress !== null ? `
                    <div class="mb-2">
                      <div class="flex items-center justify-between text-xs mb-1">
                        <span class="text-gray-400">Seu progresso</span>
                        <span class="text-purple-400 font-semibold">${Math.round(track.user_progress)}%</span>
                      </div>
                      <div class="w-full bg-gray-700 rounded-full h-2">
                        <div class="bg-gradient-to-r from-purple-600 to-pink-600 h-full rounded-full transition-all" style="width: ${track.user_progress}%"></div>
                      </div>
                    </div>
                    <div class="text-center">
                      <span class="text-purple-400 font-semibold text-sm">
                        <i class="fas fa-play-circle mr-1"></i> Continuar
                      </span>
                    </div>
                  ` : `
                    <div class="text-center">
                      <span class="text-purple-400 font-semibold text-sm">
                        <i class="fas fa-play-circle mr-1"></i> Iniciar Trilha
                      </span>
                    </div>
                  `}
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
      content.innerHTML = '<div class="text-center py-12 text-red-400">Erro ao carregar trilhas. Verifique o console.</div>';
    }
  }
}
