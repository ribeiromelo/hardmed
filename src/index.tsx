import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { serveStatic } from 'hono/cloudflare-workers';
import type { Bindings } from './types';
import * as auth from './auth';
import * as db from './db';
import { BaseLayout, Header, Footer } from './layouts';
import { html } from 'hono/html';

const app = new Hono<{ Bindings: Bindings }>();

// Serve static files
app.use('/static/*', serveStatic({ root: './public' }));

// Enable CORS for API routes
app.use('/api/*', cors());

// ========================================
// LANDING PAGE (Home Pública)
// ========================================
app.get('/', async (c) => {
  const { DB } = c.env;
  const specialties = await db.getAllSpecialties(DB);
  
  return c.html(
    <BaseLayout title="Início">
      {Header({ user: undefined })}
      
      <main>
        {/* Hero Section */}
        <section class="hero-animated py-24 text-center">
          <div class="container mx-auto px-4">
            <h1 class="text-6xl font-bold mb-6">
              Trilhas <span class="gradient-text">HardMedicina</span>
            </h1>
            <p class="text-xl text-gray-300 mb-8 max-w-3xl mx-auto">
              Aprenda com trilhas completas, divididas por especialidade.<br/>
              Cada módulo com vídeos, fluxos e casos clínicos reais.
            </p>
            <div class="flex gap-4 justify-center">
              <a href="/cadastro" class="bg-gradient-to-r from-purple-600 to-pink-600 px-8 py-4 rounded-lg text-lg font-semibold hover:from-purple-700 hover:to-pink-700 transition neon-glow">
                Começar Agora
              </a>
              <a href="/login" class="bg-gray-700 px-8 py-4 rounded-lg text-lg font-semibold hover:bg-gray-600 transition">
                Já tenho conta
              </a>
            </div>
          </div>
        </section>
        
        {/* Specialties Carousel */}
        <section class="py-16 bg-gray-800">
          <div class="container mx-auto px-4">
            <h2 class="text-3xl font-bold mb-8">Explore por Especialidade</h2>
            
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {specialties.map(specialty => html`
                <a href="/trilhas/${specialty.slug}" class="card-hover bg-gray-700 rounded-xl overflow-hidden group">
                  <div class="p-6">
                    <div class="flex items-center mb-4">
                      <i class="fas ${specialty.icon || 'fa-book-medical'} text-4xl gradient-text mr-4"></i>
                      <h3 class="text-2xl font-bold">${specialty.name}</h3>
                    </div>
                    <p class="text-gray-300 mb-4">${specialty.description || ''}</p>
                    <div class="flex items-center text-purple-400 group-hover:text-purple-300">
                      <span>Ver trilhas</span>
                      <i class="fas fa-arrow-right ml-2 transition-transform group-hover:translate-x-2"></i>
                    </div>
                  </div>
                </a>
              `)}
            </div>
          </div>
        </section>
        
        {/* Stats Section */}
        <section class="py-16">
          <div class="container mx-auto px-4">
            <div class="grid grid-cols-1 md:grid-cols-4 gap-8 text-center">
              <div class="bg-gray-800 p-8 rounded-xl">
                <i class="fas fa-video text-4xl gradient-text mb-4"></i>
                <h3 class="text-4xl font-bold mb-2">500+</h3>
                <p class="text-gray-400">Aulas em Vídeo</p>
              </div>
              <div class="bg-gray-800 p-8 rounded-xl">
                <i class="fas fa-book text-4xl gradient-text mb-4"></i>
                <h3 class="text-4xl font-bold mb-2">50+</h3>
                <p class="text-gray-400">Trilhas Completas</p>
              </div>
              <div class="bg-gray-800 p-8 rounded-xl">
                <i class="fas fa-users text-4xl gradient-text mb-4"></i>
                <h3 class="text-4xl font-bold mb-2">10k+</h3>
                <p class="text-gray-400">Alunos Ativos</p>
              </div>
              <div class="bg-gray-800 p-8 rounded-xl">
                <i class="fas fa-certificate text-4xl gradient-text mb-4"></i>
                <h3 class="text-4xl font-bold mb-2">100%</h3>
                <p class="text-gray-400">Grátis</p>
              </div>
            </div>
          </div>
        </section>
      </main>
      
      {Footer()}
    </BaseLayout>
  );
});

// ========================================
// AUTHENTICATION PAGES
// ========================================
app.get('/cadastro', (c) => {
  return c.html(
    <BaseLayout title="Criar Conta">
      <div class="min-h-screen flex items-center justify-center hero-animated">
        <div class="bg-gray-800 p-8 rounded-2xl shadow-2xl w-full max-w-md border border-gray-700">
          <div class="text-center mb-8">
            <div class="flex items-center justify-center space-x-2 mb-4">
              <i class="fas fa-graduation-cap text-3xl gradient-text"></i>
              <span class="text-2xl font-bold">HardMedicina</span>
            </div>
            <h1 class="text-2xl font-bold">Criar Conta</h1>
            <p class="text-gray-400 mt-2">Comece sua jornada médica agora</p>
          </div>
          
          <form id="registerForm" class="space-y-4">
            <div>
              <label class="block text-sm font-medium mb-2">Nome Completo</label>
              <input 
                type="text" 
                name="name" 
                required
                class="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="Dr. João Silva"
              />
            </div>
            
            <div>
              <label class="block text-sm font-medium mb-2">E-mail</label>
              <input 
                type="email" 
                name="email" 
                required
                class="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="seu@email.com"
              />
            </div>
            
            <div>
              <label class="block text-sm font-medium mb-2">Senha</label>
              <input 
                type="password" 
                name="password" 
                required
                minlength="8"
                class="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="Mínimo 8 caracteres"
              />
            </div>
            
            <div>
              <label class="block text-sm font-medium mb-2">Confirmar Senha</label>
              <input 
                type="password" 
                name="confirmPassword" 
                required
                minlength="8"
                class="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="Digite a senha novamente"
              />
            </div>
            
            <div class="flex items-start">
              <input type="checkbox" id="terms" required class="mt-1 mr-2" />
              <label for="terms" class="text-sm text-gray-400">
                Aceito os <a href="/termos" class="text-purple-400 hover:underline">Termos de Uso</a> e 
                <a href="/privacidade" class="text-purple-400 hover:underline">Política de Privacidade</a>
              </label>
            </div>
            
            <div id="error" class="hidden bg-red-500/20 border border-red-500 text-red-300 px-4 py-3 rounded-lg text-sm"></div>
            <div id="success" class="hidden bg-green-500/20 border border-green-500 text-green-300 px-4 py-3 rounded-lg text-sm"></div>
            
            <button 
              type="submit" 
              class="w-full bg-gradient-to-r from-purple-600 to-pink-600 py-3 rounded-lg font-semibold hover:from-purple-700 hover:to-pink-700 transition"
            >
              Criar Conta
            </button>
          </form>
          
          <p class="text-center text-gray-400 mt-6">
            Já tem conta? <a href="/login" class="text-purple-400 hover:underline font-semibold">Entrar</a>
          </p>
        </div>
      </div>
      
      <script>{`
        document.getElementById('registerForm').addEventListener('submit', async (e) => {
          e.preventDefault();
          
          const form = e.target;
          const formData = new FormData(form);
          const data = {
            name: formData.get('name'),
            email: formData.get('email'),
            password: formData.get('password')
          };
          
          const confirmPassword = formData.get('confirmPassword');
          
          const errorDiv = document.getElementById('error');
          const successDiv = document.getElementById('success');
          errorDiv.classList.add('hidden');
          successDiv.classList.add('hidden');
          
          if (data.password !== confirmPassword) {
            errorDiv.textContent = 'As senhas não coincidem';
            errorDiv.classList.remove('hidden');
            return;
          }
          
          try {
            const response = await axios.post('/api/auth/register', data);
            successDiv.textContent = 'Conta criada com sucesso! Redirecionando...';
            successDiv.classList.remove('hidden');
            
            setTimeout(() => {
              window.location.href = '/login';
            }, 1500);
          } catch (error) {
            errorDiv.textContent = error.response?.data?.error || 'Erro ao criar conta';
            errorDiv.classList.remove('hidden');
          }
        });
      `}</script>
    </BaseLayout>
  );
});

app.get('/login', (c) => {
  return c.html(
    <BaseLayout title="Login">
      <div class="min-h-screen flex items-center justify-center hero-animated">
        <div class="bg-gray-800 p-8 rounded-2xl shadow-2xl w-full max-w-md border border-gray-700">
          <div class="text-center mb-8">
            <div class="flex items-center justify-center space-x-2 mb-4">
              <i class="fas fa-graduation-cap text-3xl gradient-text"></i>
              <span class="text-2xl font-bold">HardMedicina</span>
            </div>
            <h1 class="text-2xl font-bold">Entrar</h1>
            <p class="text-gray-400 mt-2">Bem-vindo de volta!</p>
          </div>
          
          <form id="loginForm" class="space-y-4">
            <div>
              <label class="block text-sm font-medium mb-2">E-mail</label>
              <input 
                type="email" 
                name="email" 
                required
                class="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="seu@email.com"
              />
            </div>
            
            <div>
              <label class="block text-sm font-medium mb-2">Senha</label>
              <input 
                type="password" 
                name="password" 
                required
                class="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="Sua senha"
              />
            </div>
            
            <div class="flex items-center justify-between">
              <div class="flex items-center">
                <input type="checkbox" id="remember" class="mr-2" />
                <label for="remember" class="text-sm text-gray-400">Lembrar-me</label>
              </div>
              <a href="/recuperar-senha" class="text-sm text-purple-400 hover:underline">Esqueci minha senha</a>
            </div>
            
            <div id="error" class="hidden bg-red-500/20 border border-red-500 text-red-300 px-4 py-3 rounded-lg text-sm"></div>
            
            <button 
              type="submit" 
              class="w-full bg-gradient-to-r from-purple-600 to-pink-600 py-3 rounded-lg font-semibold hover:from-purple-700 hover:to-pink-700 transition"
            >
              Entrar
            </button>
          </form>
          
          <p class="text-center text-gray-400 mt-6">
            Não tem conta? <a href="/cadastro" class="text-purple-400 hover:underline font-semibold">Criar conta</a>
          </p>
        </div>
      </div>
      
      <script>{`
        document.getElementById('loginForm').addEventListener('submit', async (e) => {
          e.preventDefault();
          
          const form = e.target;
          const formData = new FormData(form);
          const data = {
            email: formData.get('email'),
            password: formData.get('password')
          };
          
          const errorDiv = document.getElementById('error');
          errorDiv.classList.add('hidden');
          
          try {
            const response = await axios.post('/api/auth/login', data);
            localStorage.setItem('auth_token', response.data.token);
            axios.defaults.headers.common['Authorization'] = 'Bearer ' + response.data.token;
            
            window.location.href = '/dashboard';
          } catch (error) {
            errorDiv.textContent = error.response?.data?.error || 'Erro ao fazer login';
            errorDiv.classList.remove('hidden');
          }
        });
      `}</script>
    </BaseLayout>
  );
});

// Password recovery page
app.get('/recuperar-senha', (c) => {
  return c.html(
    <BaseLayout title="Recuperar Senha">
      <div class="min-h-screen flex items-center justify-center hero-animated">
        <div class="bg-gray-800 p-8 rounded-2xl shadow-2xl w-full max-w-md border border-gray-700">
          <div class="text-center mb-8">
            <div class="flex items-center justify-center space-x-2 mb-4">
              <i class="fas fa-graduation-cap text-3xl gradient-text"></i>
              <span class="text-2xl font-bold">HardMedicina</span>
            </div>
            <h1 class="text-2xl font-bold">Recuperar Senha</h1>
            <p class="text-gray-400 mt-2">Informe seu e-mail cadastrado</p>
          </div>
          
          <form id="recoverForm" class="space-y-4">
            <div>
              <label class="block text-sm font-medium mb-2">E-mail</label>
              <input 
                type="email" 
                name="email" 
                required
                class="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="seu@email.com"
              />
            </div>
            
            <div id="message" class="hidden bg-blue-500/20 border border-blue-500 text-blue-300 px-4 py-3 rounded-lg text-sm"></div>
            
            <button 
              type="submit" 
              class="w-full bg-gradient-to-r from-purple-600 to-pink-600 py-3 rounded-lg font-semibold hover:from-purple-700 hover:to-pink-700 transition"
            >
              Enviar Instruções
            </button>
          </form>
          
          <p class="text-center text-gray-400 mt-6">
            <a href="/login" class="text-purple-400 hover:underline font-semibold">Voltar ao login</a>
          </p>
        </div>
      </div>
      
      <script>{`
        document.getElementById('recoverForm').addEventListener('submit', async (e) => {
          e.preventDefault();
          
          const messageDiv = document.getElementById('message');
          messageDiv.textContent = 'Se o e-mail existir, enviaremos instruções para redefinir sua senha.';
          messageDiv.classList.remove('hidden');
        });
      `}</script>
    </BaseLayout>
  );
});

// ========================================
// USER AREA ROUTES
// ========================================
app.get('/dashboard', async (c) => {
  return c.html(
    <BaseLayout title="Dashboard">
      {Header({ user: { id: 1, name: 'Dr. Erique', role: 'student' }, showSearch: true })}
      
      <main class="container mx-auto px-4 py-8">
        <div class="bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl p-8 mb-8">
          <h1 class="text-3xl font-bold mb-2">Olá, <span id="userName">Dr. Erique</span> 👋</h1>
          <p class="text-lg opacity-90">Continue de onde parou</p>
        </div>
        
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
        
        <div class="mb-12">
          <div class="flex items-center justify-between mb-6">
            <h2 class="text-2xl font-bold">Minhas Trilhas</h2>
            <a href="/trilhas" class="text-purple-400 hover:text-purple-300 transition">
              Ver todas <i class="fas fa-arrow-right ml-1"></i>
            </a>
          </div>
          
          <div id="myTracks" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div class="text-center py-12 col-span-full text-gray-400">
              <i class="fas fa-spinner fa-spin text-3xl mb-4"></i>
              <p>Carregando trilhas...</p>
            </div>
          </div>
        </div>
      </main>
      
      {Footer()}
      
      <script src="/static/dashboard.js"></script>
      <script>{`
        async function loadDashboard() {
          try {
            const userResponse = await axios.get('/api/user/me');
            document.getElementById('userName').textContent = userResponse.data.name;
            
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
            }
            
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
              myTracksDiv.innerHTML = '<div class="col-span-full text-center py-12 text-gray-400">Nenhuma trilha encontrada</div>';
            }
          } catch (error) {
            console.error('Error:', error);
            if (error.response?.status === 401) window.location.href = '/login';
          }
        }
        loadDashboard();
      `}</script>
    </BaseLayout>
  );
});

app.get('/trilha/:slug', async (c) => {
  const slug = c.req.param('slug');
  
  return c.html(
    <BaseLayout title="Trilha">
      {Header({ user: { id: 1, name: 'Dr. Erique', role: 'student' }, showSearch: true })}
      
      <main class="container mx-auto px-4 py-8">
        <nav class="text-sm text-gray-400 mb-6">
          <a href="/dashboard" class="hover:text-purple-400">Início</a>
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
      
      <script src="/static/dashboard.js"></script>
      <script>{`
        async function loadTrack() {
          try {
            const response = await axios.get('/api/tracks/${slug}');
            const { track, seasons } = response.data;
            
            document.getElementById('trackBreadcrumb').textContent = track.title;
            
            document.getElementById('trackContent').innerHTML = \`
              <div class="bg-gray-800 rounded-2xl p-8 mb-8">
                <h1 class="text-4xl font-bold mb-4">\${track.title}</h1>
                <p class="text-gray-300 text-lg mb-6">\${track.description || ''}</p>
                <div class="flex items-center space-x-6 text-sm text-gray-400">
                  <span><i class="fas fa-video mr-2"></i>\${track.total_lessons} aulas</span>
                  <span><i class="fas fa-clock mr-2"></i>\${Math.round(track.duration_minutes / 60)}h</span>
                </div>
              </div>
              
              <div class="space-y-4">
                \${seasons.map((season, index) => \`
                  <div class="bg-gray-800 rounded-xl overflow-hidden">
                    <button onclick="toggleSeason(\${index})" class="w-full flex items-center justify-between p-6 hover:bg-gray-750 transition">
                      <div class="flex items-center space-x-4">
                        <div class="w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center font-bold">\${index + 1}</div>
                        <div class="text-left">
                          <h3 class="text-xl font-bold">\${season.title}</h3>
                          <p class="text-sm text-gray-400">\${season.lessons.length} aulas</p>
                        </div>
                      </div>
                      <i class="fas fa-chevron-down" id="chevron-\${index}"></i>
                    </button>
                    <div id="season-\${index}" class="hidden border-t border-gray-700">
                      \${season.lessons.map(lesson => \`
                        <a href="/aula/\${lesson.slug}" class="flex items-center justify-between p-4 hover:bg-gray-750 transition border-b border-gray-700 last:border-0">
                          <div class="flex items-center space-x-4">
                            <i class="fas fa-\${lesson.is_completed ? 'check-circle text-green-500' : 'play-circle text-purple-500'} text-xl"></i>
                            <div>
                              <h4 class="font-semibold">\${lesson.title}</h4>
                              <p class="text-sm text-gray-400">\${lesson.duration_minutes} min</p>
                            </div>
                          </div>
                          <i class="fas fa-chevron-right text-gray-600"></i>
                        </a>
                      \`).join('')}
                    </div>
                  </div>
                \`).join('')}
              </div>
            \`;
          } catch (error) {
            console.error('Error:', error);
          }
        }
        
        function toggleSeason(index) {
          const seasonDiv = document.getElementById('season-' + index);
          const chevron = document.getElementById('chevron-' + index);
          seasonDiv.classList.toggle('hidden');
          chevron.classList.toggle('rotate-180');
        }
        
        loadTrack();
      `}</script>
    </BaseLayout>
  );
});

app.get('/aula/:slug', async (c) => {
  const slug = c.req.param('slug');
  
  return c.html(
    <BaseLayout title="Aula">
      {Header({ user: { id: 1, name: 'Dr. Erique', role: 'student' } })}
      
      <main class="container mx-auto px-4 py-8">
        <div id="lessonContent" class="flex gap-8">
          <div class="flex-1">
            <div class="bg-black rounded-xl overflow-hidden mb-6" style="aspect-ratio: 16/9;">
              <iframe id="videoPlayer" width="100%" height="100%" frameborder="0" allowfullscreen></iframe>
            </div>
            
            <h1 id="lessonTitle" class="text-3xl font-bold mb-4">Carregando...</h1>
            <p id="lessonDescription" class="text-gray-400 mb-6"></p>
            
            <div id="keyPoints" class="bg-gray-800 rounded-xl p-6 mb-6"></div>
            
            <div id="downloads" class="flex gap-4"></div>
          </div>
          
          <div class="w-96 bg-gray-800 rounded-xl p-6">
            <h2 class="font-bold text-xl mb-4">Próximas Aulas</h2>
            <div id="nextLessons" class="space-y-3"></div>
          </div>
        </div>
      </main>
      
      {Footer()}
      
      <script src="/static/dashboard.js"></script>
      <script>{`
        async function loadLesson() {
          try {
            const response = await axios.get('/api/lessons/${slug}');
            const lesson = response.data;
            
            document.title = lesson.title + ' | HardMedicina';
            document.getElementById('lessonTitle').textContent = lesson.title;
            document.getElementById('lessonDescription').textContent = lesson.description || '';
            document.getElementById('videoPlayer').src = lesson.video_url;
            
            if (lesson.key_points) {
              const points = JSON.parse(lesson.key_points);
              document.getElementById('keyPoints').innerHTML = '<h3 class="font-bold mb-3">Pontos-chave</h3><ul class="space-y-2">' + 
                points.map(p => '<li class="flex items-start"><i class="fas fa-check text-green-500 mr-2 mt-1"></i><span>' + p + '</span></li>').join('') + 
                '</ul>';
            }
            
            if (lesson.pdf_url) {
              document.getElementById('downloads').innerHTML = '<a href="' + lesson.pdf_url + '" download class="bg-red-600 px-6 py-3 rounded-lg hover:bg-red-700 transition"><i class="fas fa-file-pdf mr-2"></i>Download PDF</a>';
            }
          } catch (error) {
            console.error('Error:', error);
          }
        }
        loadLesson();
      `}</script>
    </BaseLayout>
  );
});

// ========================================
// API ROUTES
// ========================================
import apiRoutes from './api-routes';
app.route('/api', apiRoutes);

export default app;
