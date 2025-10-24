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
    const tracks = await api.get('/tracks');
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
        <a href="/trilha/${track.slug}" class="bg-gray-800 rounded-xl overflow-hidden card-hover">
          <div class="h-40 bg-gradient-to-br from-purple-600/20 to-pink-600/20 flex items-center justify-center">
            <i class="fas fa-book-medical text-5xl gradient-text"></i>
          </div>
          <div class="p-4">
            <h3 class="font-bold text-lg mb-2">${track.title}</h3>
            <p class="text-gray-400 text-sm mb-3 line-clamp-2">${track.description || ''}</p>
            <div class="flex items-center justify-between text-sm">
              <span class="text-gray-400">
                <i class="fas fa-video mr-1"></i> ${track.total_lessons} aulas
              </span>
              <span class="text-purple-400 font-semibold">
                ${track.user_progress ? Math.round(track.user_progress) + '%' : 'Iniciar'}
              </span>
            </div>
            ${track.user_progress ? `
              <div class="w-full bg-gray-700 rounded-full h-1.5 mt-2">
                <div class="bg-purple-500 h-full rounded-full" style="width: ${track.user_progress}%"></div>
              </div>
            ` : ''}
          </div>
        </a>
      `).join('');
    } else if (myTracksDiv) {
      myTracksDiv.innerHTML = '<div class="col-span-full text-center py-12 text-gray-400">Nenhuma trilha encontrada</div>';
    }
    
    console.log('✅ Dashboard loaded successfully!');
  } catch (error) {
    console.error('❌ Dashboard error:', error);
    
    // Show error message to user
    const myTracksDiv = document.getElementById('myTracks');
    if (myTracksDiv) {
      myTracksDiv.innerHTML = '<div class="col-span-full text-center py-12 text-red-400">Erro ao carregar trilhas. Verifique o console.</div>';
    }
  }
}

// Track page functions
async function loadTrack(slug) {
  try {
    const data = await api.get('/tracks/' + slug);
    const { track, seasons } = data;
    
    const trackBreadcrumb = document.getElementById('trackBreadcrumb');
    if (trackBreadcrumb) {
      trackBreadcrumb.textContent = track.title;
    }
    
    const trackContent = document.getElementById('trackContent');
    if (trackContent) {
      trackContent.innerHTML = `
        <div class="bg-gray-800 rounded-2xl p-8 mb-8">
          <h1 class="text-4xl font-bold mb-4">${track.title}</h1>
          <p class="text-gray-300 text-lg mb-6">${track.description || ''}</p>
          <div class="flex items-center space-x-6 text-sm text-gray-400">
            <span><i class="fas fa-video mr-2"></i>${track.total_lessons} aulas</span>
            <span><i class="fas fa-clock mr-2"></i>${Math.round(track.duration_minutes / 60)}h</span>
          </div>
        </div>
        
        <div class="space-y-4">
          ${seasons.map((season, index) => `
            <div class="bg-gray-800 rounded-xl overflow-hidden">
              <button onclick="toggleSeason(${index})" class="w-full flex items-center justify-between p-6 hover:bg-gray-750 transition">
                <div class="flex items-center space-x-4">
                  <div class="w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center font-bold">${index + 1}</div>
                  <div class="text-left">
                    <h3 class="text-xl font-bold">${season.title}</h3>
                    <p class="text-sm text-gray-400">${season.lessons.length} aulas</p>
                  </div>
                </div>
                <i class="fas fa-chevron-down transition-transform" id="chevron-${index}"></i>
              </button>
              <div id="season-${index}" class="hidden border-t border-gray-700">
                ${season.lessons.map(lesson => `
                  <a href="/aula/${lesson.slug}" class="flex items-center justify-between p-4 hover:bg-gray-750 transition border-b border-gray-700 last:border-0">
                    <div class="flex items-center space-x-4">
                      <i class="fas fa-${lesson.is_completed ? 'check-circle text-green-500' : 'play-circle text-purple-500'} text-xl"></i>
                      <div>
                        <h4 class="font-semibold">${lesson.title}</h4>
                        <p class="text-sm text-gray-400">${lesson.duration_minutes} min</p>
                      </div>
                    </div>
                    <i class="fas fa-chevron-right text-gray-600"></i>
                  </a>
                `).join('')}
              </div>
            </div>
          `).join('')}
        </div>
      `;
    }
  } catch (error) {
    console.error('Track error:', error);
  }
}

function toggleSeason(index) {
  const seasonDiv = document.getElementById('season-' + index);
  const chevron = document.getElementById('chevron-' + index);
  if (seasonDiv && chevron) {
    seasonDiv.classList.toggle('hidden');
    chevron.classList.toggle('rotate-180');
  }
}

// Lesson page functions
async function loadLesson(slug) {
  try {
    const lesson = await api.get('/lessons/' + slug);
    
    document.title = lesson.title + ' | HardMedicina';
    
    const lessonTitle = document.getElementById('lessonTitle');
    const lessonDescription = document.getElementById('lessonDescription');
    const videoPlayer = document.getElementById('videoPlayer');
    const keyPoints = document.getElementById('keyPoints');
    const downloads = document.getElementById('downloads');
    
    if (lessonTitle) lessonTitle.textContent = lesson.title;
    if (lessonDescription) lessonDescription.textContent = lesson.description || '';
    if (videoPlayer) videoPlayer.src = lesson.video_url;
    
    if (keyPoints && lesson.key_points) {
      const points = JSON.parse(lesson.key_points);
      keyPoints.innerHTML = '<h3 class="font-bold mb-3">Pontos-chave</h3><ul class="space-y-2">' + 
        points.map(p => '<li class="flex items-start"><i class="fas fa-check text-green-500 mr-2 mt-1"></i><span>' + p + '</span></li>').join('') + 
        '</ul>';
    }
    
    if (downloads && lesson.pdf_url) {
      downloads.innerHTML = '<a href="' + lesson.pdf_url + '" download class="bg-red-600 px-6 py-3 rounded-lg hover:bg-red-700 transition"><i class="fas fa-file-pdf mr-2"></i>Download PDF</a>';
    }
  } catch (error) {
    console.error('Lesson error:', error);
  }
}
