// Get token from cookie or localStorage
function getAuthToken() {
  // Try to get from cookie first
  const cookieMatch = document.cookie.match(/auth_token=([^;]+)/);
  if (cookieMatch) {
    return cookieMatch[1];
  }
  // Fallback to localStorage
  return localStorage.getItem('auth_token');
}

// Setup axios with auth token (only check on protected pages)
const token = getAuthToken();

// Only redirect if we're on a protected page (not login/cadastro/recuperar-senha)
const currentPath = window.location.pathname;
const publicPaths = ['/login', '/cadastro', '/recuperar-senha', '/'];
const isPublicPath = publicPaths.some(path => currentPath === path || currentPath.startsWith(path));

if (!token && !isPublicPath) {
  window.location.href = '/login';
}

if (typeof axios !== 'undefined' && token) {
  axios.defaults.baseURL = '/api';
  axios.defaults.headers.common['Authorization'] = 'Bearer ' + token;
}

// Handle auth errors
if (typeof axios !== 'undefined') {
  axios.interceptors.response.use(
    response => response,
    error => {
      const currentPath = window.location.pathname;
      const publicPaths = ['/login', '/cadastro', '/recuperar-senha', '/'];
      const isPublicPath = publicPaths.some(path => currentPath === path || currentPath.startsWith(path));
      
      if (error.response?.status === 401 && !isPublicPath) {
        // Clear both cookie and localStorage
        document.cookie = 'auth_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC; SameSite=Lax';
        localStorage.removeItem('auth_token');
        window.location.href = '/login';
      }
      return Promise.reject(error);
    }
  );
}

// Dashboard functions
async function loadDashboard() {
  try {
    const userResponse = await axios.get('/user/me');
    const userNameEl = document.getElementById('userName');
    if (userNameEl) {
      userNameEl.textContent = userResponse.data.name;
    }
    
    const progressResponse = await axios.get('/user/progress');
    const progress = progressResponse.data;
    
    if (progress.length > 0) {
      const totalProgress = progress.reduce((sum, p) => sum + p.progress_percentage, 0) / progress.length;
      const totalCompleted = progress.reduce((sum, p) => sum + p.completed_lessons, 0);
      const totalLessons = progress.reduce((sum, p) => sum + p.total_lessons, 0);
      
      const totalProgressEl = document.getElementById('totalProgress');
      const progressBarEl = document.getElementById('progressBar');
      const completedLessonsEl = document.getElementById('completedLessons');
      const totalLessonsEl = document.getElementById('totalLessons');
      
      if (totalProgressEl) totalProgressEl.textContent = Math.round(totalProgress) + '%';
      if (progressBarEl) progressBarEl.style.width = totalProgress + '%';
      if (completedLessonsEl) completedLessonsEl.textContent = totalCompleted;
      if (totalLessonsEl) totalLessonsEl.textContent = totalLessons;
    }
    
    const tracksResponse = await axios.get('/tracks');
    const tracks = tracksResponse.data;
    
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
  } catch (error) {
    console.error('Error:', error);
    if (error.response?.status === 401) {
      window.location.href = '/login';
    }
  }
}

// Track page functions
async function loadTrack(slug) {
  try {
    const response = await axios.get('/tracks/' + slug);
    const { track, seasons } = response.data;
    
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
    console.error('Error:', error);
    const trackContent = document.getElementById('trackContent');
    if (trackContent) {
      trackContent.innerHTML = '<div class="text-center py-12 text-red-400">Erro ao carregar trilha</div>';
    }
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
    const response = await axios.get('/lessons/' + slug);
    const lesson = response.data;
    
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
    console.error('Error:', error);
  }
}
