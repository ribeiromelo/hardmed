import { Context } from 'hono';
import { html } from 'hono/html';
import { BaseLayout, Header, Footer } from './layouts';
import type { Bindings } from './types';

// Helper to check auth from cookies/session
export async function requireAuth(c: Context) {
  // In a real app, you'd check session/cookies
  // For now, we rely on client-side token
  return true;
}

// ========================================
// DASHBOARD DO USUÁRIO
// ========================================
export function DashboardPage(c: Context<{ Bindings: Bindings }>) {
  return c.html(
    <BaseLayout title="Dashboard">
      {Header({ user: { id: 1, name: 'Dr. Erique', role: 'student' }, showSearch: true })}
      
      <main class="container mx-auto px-4 py-8">
        {/* Welcome Banner */}
        <div class="bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl p-8 mb-8">
          <h1 class="text-3xl font-bold mb-2">Olá, <span id="userName">Dr. Erique</span> 👋</h1>
          <p class="text-lg opacity-90">Continue de onde parou</p>
        </div>
        
        {/* Progress Overview */}
        <div class="bg-gray-800 rounded-xl p-6 mb-8">
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-2xl font-bold">Seu Progresso Total</h2>
            <span id="totalProgress" class="text-3xl font-bold gradient-text">0%</span>
          </div>
          <div class="w-full bg-gray-700 rounded-full h-4 overflow-hidden">
            <div id="progressBar" class="bg-gradient-to-r from-purple-600 to-pink-600 h-full transition-all duration-500" style="width: 0%"></div>
          </div>
          <p class="text-gray-400 mt-2">
            <span id="completedLessons">0</span> de <span id="totalLessons">0</span> aulas concluídas
          </p>
        </div>
        
        {/* Continue Watching */}
        <div class="mb-12" id="continueSection" style="display: none;">
          <h2 class="text-2xl font-bold mb-6">Continuar Assistindo</h2>
          <div class="bg-gray-800 rounded-xl p-6 flex items-center justify-between card-hover">
            <div class="flex items-center space-x-6">
              <i class="fas fa-play-circle text-5xl gradient-text"></i>
              <div>
                <h3 id="lastLessonTitle" class="text-xl font-bold mb-1">Carregando...</h3>
                <p id="lastTrackTitle" class="text-gray-400">Carregando...</p>
                <div class="flex items-center mt-2">
                  <div class="w-32 bg-gray-700 rounded-full h-2 mr-2">
                    <div id="lastLessonProgress" class="bg-purple-500 h-full rounded-full" style="width: 45%"></div>
                  </div>
                  <span class="text-sm text-gray-400">45% assistido</span>
                </div>
              </div>
            </div>
            <a href="#" id="continueButton" class="bg-gradient-to-r from-purple-600 to-pink-600 px-6 py-3 rounded-lg font-semibold hover:from-purple-700 hover:to-pink-700 transition">
              Continuar
            </a>
          </div>
        </div>
        
        {/* My Tracks */}
        <div class="mb-12">
          <div class="flex items-center justify-between mb-6">
            <h2 class="text-2xl font-bold">Minhas Trilhas</h2>
            <a href="/trilhas" class="text-purple-400 hover:text-purple-300 transition">
              Ver todas <i class="fas fa-arrow-right ml-1"></i>
            </a>
          </div>
          
          <div id="myTracks" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Dynamically loaded */}
            <div class="text-center py-12 col-span-full text-gray-400">
              <i class="fas fa-spinner fa-spin text-3xl mb-4"></i>
              <p>Carregando trilhas...</p>
            </div>
          </div>
        </div>
        
        {/* Recommendations */}
        <div>
          <h2 class="text-2xl font-bold mb-6">Recomendado para Você</h2>
          <div id="recommendations" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Dynamically loaded */}
          </div>
        </div>
      </main>
      
      {Footer()}
      
      <script>{`
        async function loadDashboard() {
          try {
            // Load user info
            const userResponse = await axios.get('/api/user/me');
            document.getElementById('userName').textContent = userResponse.data.name;
            
            // Load progress
            const progressResponse = await axios.get('/api/user/progress');
            const progress = progressResponse.data;
            
            if (progress.length > 0) {
              const totalProgress = progress.reduce((sum, p) => sum + p.progress_percentage, 0) / progress.length;
              const totalCompleted = progress.reduce((sum, p) => sum + p.completed_lessons, 0);
              const totalLessons = progress.reduce((sum, p) => sum + p.total_lessons, 0);
              
              document.getElementById('totalProgress').textContent = Math.round(totalProgress) + '%';
              document.getElementById('progressBar').style.width = totalProgress + '%';
              document.getElementById('completedLessons').textContent = totalCompleted;
              document.getElementById('totalLessons').textContent = totalLessons;
              
              // Show continue section if there's progress
              document.getElementById('continueSection').style.display = 'block';
            }
            
            // Load tracks
            const tracksResponse = await axios.get('/api/tracks');
            const tracks = tracksResponse.data;
            
            const myTracksDiv = document.getElementById('myTracks');
            if (tracks.length > 0) {
              myTracksDiv.innerHTML = tracks.slice(0, 6).map(track => \`
                <a href="/trilha/\${track.slug}" class="bg-gray-800 rounded-xl overflow-hidden card-hover">
                  <div class="h-40 bg-gradient-to-br from-purple-600/20 to-pink-600/20 flex items-center justify-center">
                    <i class="fas fa-book-medical text-5xl gradient-text"></i>
                  </div>
                  <div class="p-4">
                    <h3 class="font-bold text-lg mb-2">\${track.title}</h3>
                    <p class="text-gray-400 text-sm mb-3 line-clamp-2">\${track.description || ''}</p>
                    <div class="flex items-center justify-between text-sm">
                      <span class="text-gray-400">
                        <i class="fas fa-video mr-1"></i> \${track.total_lessons} aulas
                      </span>
                      <span class="text-purple-400 font-semibold">
                        \${track.user_progress ? Math.round(track.user_progress) + '%' : 'Iniciar'}
                      </span>
                    </div>
                    \${track.user_progress ? \`
                      <div class="w-full bg-gray-700 rounded-full h-1.5 mt-2">
                        <div class="bg-purple-500 h-full rounded-full" style="width: \${track.user_progress}%"></div>
                      </div>
                    \` : ''}
                  </div>
                </a>
              \`).join('');
            } else {
              myTracksDiv.innerHTML = \`
                <div class="col-span-full text-center py-12">
                  <i class="fas fa-book-open text-5xl text-gray-600 mb-4"></i>
                  <p class="text-gray-400">Você ainda não iniciou nenhuma trilha</p>
                  <a href="/trilhas" class="inline-block mt-4 bg-purple-600 px-6 py-2 rounded-lg hover:bg-purple-700 transition">
                    Explorar Trilhas
                  </a>
                </div>
              \`;
            }
          } catch (error) {
            console.error('Error loading dashboard:', error);
            if (error.response?.status === 401) {
              window.location.href = '/login';
            }
          }
        }
        
        loadDashboard();
      `}</script>
    </BaseLayout>
  );
}

// ========================================
// PÁGINA DE TRILHA
// ========================================
export function TrackPage(c: Context<{ Bindings: Bindings }>) {
  const slug = c.req.param('slug');
  
  return c.html(
    <BaseLayout title="Trilha">
      {Header({ user: { id: 1, name: 'Dr. Erique', role: 'student' }, showSearch: true })}
      
      <main class="container mx-auto px-4 py-8">
        <nav class="text-sm text-gray-400 mb-6">
          <a href="/dashboard" class="hover:text-purple-400">Início</a>
          <i class="fas fa-chevron-right mx-2"></i>
          <a href="/trilhas" class="hover:text-purple-400">Trilhas</a>
          <i class="fas fa-chevron-right mx-2"></i>
          <span class="text-white" id="trackBreadcrumb">Carregando...</span>
        </nav>
        
        <div id="trackContent">
          <div class="text-center py-12">
            <i class="fas fa-spinner fa-spin text-3xl text-purple-500 mb-4"></i>
            <p class="text-gray-400">Carregando trilha...</p>
          </div>
        </div>
      </main>
      
      {Footer()}
      
      <script>{`
        const slug = '${slug}';
        
        async function loadTrack() {
          try {
            const response = await axios.get('/api/tracks/' + slug);
            const { track, seasons } = response.data;
            
            document.getElementById('trackBreadcrumb').textContent = track.title;
            document.title = track.title + ' | HardMedicina';
            
            const content = \`
              <div class="bg-gray-800 rounded-2xl p-8 mb-8">
                <div class="flex items-start justify-between">
                  <div class="flex-1">
                    <h1 class="text-4xl font-bold mb-4">\${track.title}</h1>
                    <p class="text-gray-300 text-lg mb-6">\${track.description || ''}</p>
                    
                    <div class="flex items-center space-x-6 text-sm text-gray-400">
                      <span><i class="fas fa-video mr-2"></i>\${track.total_lessons} aulas</span>
                      <span><i class="fas fa-clock mr-2"></i>\${Math.round(track.duration_minutes / 60)}h de conteúdo</span>
                      <span><i class="fas fa-signal mr-2"></i>\${track.difficulty === 'beginner' ? 'Iniciante' : track.difficulty === 'intermediate' ? 'Intermediário' : 'Avançado'}</span>
                    </div>
                    
                    \${track.user_progress ? \`
                      <div class="mt-6">
                        <div class="flex items-center justify-between mb-2">
                          <span class="text-sm text-gray-400">Seu progresso</span>
                          <span class="text-sm font-bold gradient-text">\${Math.round(track.user_progress)}%</span>
                        </div>
                        <div class="w-full bg-gray-700 rounded-full h-3">
                          <div class="bg-gradient-to-r from-purple-600 to-pink-600 h-full rounded-full" style="width: \${track.user_progress}%"></div>
                        </div>
                      </div>
                    \` : ''}
                  </div>
                  
                  <div class="ml-8 hidden lg:block">
                    <div class="w-64 h-64 bg-gradient-to-br from-purple-600/20 to-pink-600/20 rounded-xl flex items-center justify-center">
                      <i class="fas fa-book-medical text-6xl gradient-text"></i>
                    </div>
                  </div>
                </div>
              </div>
              
              <div class="space-y-4">
                \${seasons.map((season, index) => \`
                  <div class="bg-gray-800 rounded-xl overflow-hidden">
                    <button 
                      onclick="toggleSeason(\${index})" 
                      class="w-full flex items-center justify-between p-6 hover:bg-gray-750 transition"
                    >
                      <div class="flex items-center space-x-4">
                        <div class="w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center font-bold">
                          \${index + 1}
                        </div>
                        <div class="text-left">
                          <h3 class="text-xl font-bold">\${season.title}</h3>
                          <p class="text-sm text-gray-400">\${season.description || ''}</p>
                          <p class="text-sm text-gray-500 mt-1">\${season.lessons.length} aulas</p>
                        </div>
                      </div>
                      <i class="fas fa-chevron-down text-xl transition-transform" id="chevron-\${index}"></i>
                    </button>
                    
                    <div id="season-\${index}" class="hidden border-t border-gray-700">
                      \${season.lessons.map(lesson => \`
                        <a 
                          href="/aula/\${lesson.slug}" 
                          class="flex items-center justify-between p-4 hover:bg-gray-750 transition border-b border-gray-700 last:border-0"
                        >
                          <div class="flex items-center space-x-4 flex-1">
                            <div class="w-12 h-12 bg-gray-700 rounded flex items-center justify-center">
                              \${lesson.is_completed ? 
                                '<i class="fas fa-check-circle text-green-500 text-xl"></i>' : 
                                '<i class="fas fa-play-circle text-purple-500 text-xl"></i>'
                              }
                            </div>
                            <div class="flex-1">
                              <h4 class="font-semibold">\${lesson.title}</h4>
                              <p class="text-sm text-gray-400">\${lesson.duration_minutes} min</p>
                            </div>
                          </div>
                          <div class="flex items-center space-x-4">
                            \${lesson.pdf_url ? '<i class="fas fa-file-pdf text-red-400"></i>' : ''}
                            <i class="fas fa-chevron-right text-gray-600"></i>
                          </div>
                        </a>
                      \`).join('')}
                    </div>
                  </div>
                \`).join('')}
              </div>
            \`;
            
            document.getElementById('trackContent').innerHTML = content;
          } catch (error) {
            console.error('Error loading track:', error);
            document.getElementById('trackContent').innerHTML = \`
              <div class="text-center py-12">
                <i class="fas fa-exclamation-circle text-5xl text-red-500 mb-4"></i>
                <p class="text-gray-400">Erro ao carregar trilha</p>
              </div>
            \`;
          }
        }
        
        function toggleSeason(index) {
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
        
        loadTrack();
      `}</script>
    </BaseLayout>
  );
}

export { requireAuth };
