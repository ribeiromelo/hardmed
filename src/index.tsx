import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { serveStatic } from 'hono/cloudflare-workers';
import type { Bindings } from './types';
import * as auth from './auth';
import * as db from './db';
import { BaseLayout, Header, Footer } from './layouts';
import { html } from 'hono/html';
import { getUserFromToken } from './middleware';

const app = new Hono<{ Bindings: Bindings }>();

// Security Headers
app.use('*', async (c, next) => {
  // Content Security Policy
  c.header('Content-Security-Policy', 
    "default-src 'self'; " +
    "script-src 'self' 'unsafe-inline' https://cdn.tailwindcss.com https://cdn.jsdelivr.net; " +
    "style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net https://fonts.googleapis.com; " +
    "font-src 'self' https://cdn.jsdelivr.net https://fonts.gstatic.com; " +
    "img-src 'self' data: https: http:; " +
    "connect-src 'self';"
  );
  
  // Other security headers
  c.header('X-Content-Type-Options', 'nosniff');
  c.header('X-Frame-Options', 'DENY');
  c.header('X-XSS-Protection', '1; mode=block');
  c.header('Referrer-Policy', 'strict-origin-when-cross-origin');
  c.header('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
  
  await next();
});

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
      <div class="min-h-screen flex bg-gray-900">
        {/* Left Side - Form */}
        <div class="w-full lg:w-1/2 flex flex-col justify-center items-center p-8 relative overflow-y-auto">
          <div class="w-full max-w-md">
            {/* Logo */}
            <div class="flex items-center space-x-2 mb-8">
              <i class="fas fa-graduation-cap text-3xl gradient-text"></i>
              <span class="text-2xl font-bold">HardMedicina</span>
            </div>
            
            {/* Form Container */}
            <div class="bg-gray-800 p-8 rounded-2xl shadow-2xl border border-gray-700">
              <h2 class="text-2xl font-bold mb-2">Criar sua conta</h2>
              <p class="text-gray-400 mb-6">Comece sua jornada médica agora</p>
              
              <form id="registerForm" class="space-y-4">
                <div>
                  <label class="block text-sm font-medium mb-2">Nome Completo</label>
                  <input 
                    type="text" 
                    name="name" 
                    required
                    class="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500 transition"
                    placeholder="Dr. João Silva"
                  />
                </div>
                
                <div>
                  <label class="block text-sm font-medium mb-2">E-mail</label>
                  <input 
                    type="email" 
                    name="email" 
                    required
                    class="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500 transition"
                    placeholder="seu@email.com"
                  />
                </div>
                
                <div>
                  <label class="block text-sm font-medium mb-2">Senha</label>
                  <input 
                    type="password" 
                    id="password"
                    name="password" 
                    required
                    minlength="8"
                    class="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500 transition"
                    placeholder="Mínimo 8 caracteres"
                  />
                  
                  {/* Password Strength Indicator */}
                  <div class="mt-3">
                    <div class="flex items-center justify-between mb-1">
                      <span class="text-xs text-gray-400">Força da senha:</span>
                      <span id="strengthLabel" class="text-xs font-semibold"></span>
                    </div>
                    <div class="w-full bg-gray-700 rounded-full h-2 overflow-hidden">
                      <div 
                        id="strengthBar" 
                        class="h-full rounded-full transition-all duration-300 ease-out"
                        style="width: 0%; background-color: #6b7280;"
                      ></div>
                    </div>
                    <ul id="strengthFeedback" class="mt-2 space-y-1 hidden"></ul>
                  </div>
                </div>
                
                <div>
                  <label class="block text-sm font-medium mb-2">Confirmar Senha</label>
                  <input 
                    type="password" 
                    name="confirmPassword" 
                    required
                    minlength="8"
                    class="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500 transition"
                    placeholder="Digite a senha novamente"
                  />
                </div>
                
                <div class="flex items-start">
                  <input type="checkbox" id="terms" required class="w-4 h-4 mt-1 text-purple-600 bg-gray-700 border-gray-600 rounded focus:ring-purple-500" />
                  <label for="terms" class="ml-2 text-sm text-gray-400">
                    Aceito os <a href="/termos" class="text-purple-400 hover:text-purple-300 transition">Termos de Uso</a> e 
                    <a href="/privacidade" class="text-purple-400 hover:text-purple-300 transition"> Política de Privacidade</a>
                  </label>
                </div>
                
                <div id="error" class="hidden bg-red-500/20 border border-red-500 text-red-300 px-4 py-3 rounded-lg text-sm"></div>
                <div id="success" class="hidden bg-green-500/20 border border-green-500 text-green-300 px-4 py-3 rounded-lg text-sm"></div>
                
                <button 
                  type="submit" 
                  class="w-full bg-gradient-to-r from-purple-600 to-pink-600 py-3 rounded-lg font-semibold hover:from-purple-700 hover:to-pink-700 transition transform hover:scale-[1.02]"
                >
                  Criar Conta
                </button>
              </form>
              
              <p class="text-center text-gray-400 mt-6">
                Já tem conta? <a href="/login" class="text-purple-400 hover:text-purple-300 font-semibold transition">Entrar</a>
              </p>
            </div>
          </div>
        </div>
        
        {/* Right Side - Visual/Branding */}
        <div class="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-pink-600 via-purple-600 to-indigo-700 flex-col justify-center items-center p-12 relative overflow-hidden">
          {/* Decorative circles */}
          <div class="absolute top-20 left-20 w-72 h-72 bg-white/10 rounded-full blur-3xl"></div>
          <div class="absolute bottom-20 right-20 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl"></div>
          
          <div class="max-w-lg text-white relative z-10">
            <div class="mb-8">
              <i class="fas fa-user-md text-6xl opacity-90 mb-6"></i>
            </div>
            
            <h2 class="text-4xl font-bold mb-4 leading-tight">
              Transforme seu futuro médico
            </h2>
            <p class="text-lg opacity-90 mb-8">
              Junte-se a milhares de estudantes e profissionais de medicina que confiam no HardMedicina.
            </p>
            
            {/* Stats */}
            <div class="grid grid-cols-2 gap-6 mb-8">
              <div class="bg-white/10 backdrop-blur-sm p-6 rounded-lg text-center">
                <p class="text-4xl font-bold mb-1">50+</p>
                <p class="text-sm opacity-80">Trilhas Disponíveis</p>
              </div>
              <div class="bg-white/10 backdrop-blur-sm p-6 rounded-lg text-center">
                <p class="text-4xl font-bold mb-1">500+</p>
                <p class="text-sm opacity-80">Aulas em Vídeo</p>
              </div>
            </div>
            
            {/* Benefits */}
            <div class="space-y-3">
              <div class="flex items-center space-x-3">
                <i class="fas fa-check-circle text-2xl"></i>
                <p class="text-lg">Conteúdo atualizado constantemente</p>
              </div>
              <div class="flex items-center space-x-3">
                <i class="fas fa-check-circle text-2xl"></i>
                <p class="text-lg">Certificados de conclusão</p>
              </div>
              <div class="flex items-center space-x-3">
                <i class="fas fa-check-circle text-2xl"></i>
                <p class="text-lg">Suporte especializado</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </BaseLayout>
  );
});

app.get('/login', (c) => {
  return c.html(
    <BaseLayout title="Login">
      <div class="min-h-screen flex bg-gray-900">
        {/* Left Side - Form */}
        <div class="w-full lg:w-1/2 flex flex-col justify-center items-center p-8 relative">
          <div class="w-full max-w-md">
            {/* Logo */}
            <div class="flex items-center space-x-2 mb-8">
              <i class="fas fa-graduation-cap text-3xl gradient-text"></i>
              <span class="text-2xl font-bold">HardMedicina</span>
            </div>
            
            {/* Form Container */}
            <div class="bg-gray-800 p-8 rounded-2xl shadow-2xl border border-gray-700">
              <h2 class="text-2xl font-bold mb-2">Bem-vindo de volta!</h2>
              <p class="text-gray-400 mb-6">Entre com suas credenciais</p>
              
              <form id="loginForm" class="space-y-4">
                <div>
                  <label class="block text-sm font-medium mb-2">E-mail</label>
                  <input 
                    type="email" 
                    name="email" 
                    required
                    class="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500 transition"
                    placeholder="seu@email.com"
                  />
                </div>
                
                <div>
                  <label class="block text-sm font-medium mb-2">Senha</label>
                  <input 
                    type="password" 
                    name="password" 
                    required
                    class="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500 transition"
                    placeholder="Sua senha"
                  />
                </div>
                
                <div class="flex items-center justify-between">
                  <div class="flex items-center">
                    <input type="checkbox" id="remember" class="w-4 h-4 text-purple-600 bg-gray-700 border-gray-600 rounded focus:ring-purple-500" />
                    <label for="remember" class="ml-2 text-sm text-gray-400">Lembrar-me</label>
                  </div>
                  <a href="/recuperar-senha" class="text-sm text-purple-400 hover:text-purple-300 transition">Esqueci minha senha</a>
                </div>
                
                <div id="error" class="hidden bg-red-500/20 border border-red-500 text-red-300 px-4 py-3 rounded-lg text-sm"></div>
                
                <button 
                  type="submit" 
                  class="w-full bg-gradient-to-r from-purple-600 to-pink-600 py-3 rounded-lg font-semibold hover:from-purple-700 hover:to-pink-700 transition transform hover:scale-[1.02]"
                >
                  Entrar
                </button>
              </form>
              
              <p class="text-center text-gray-400 mt-6">
                Não tem conta? <a href="/cadastro" class="text-purple-400 hover:text-purple-300 font-semibold transition">Criar conta</a>
              </p>
            </div>
          </div>
        </div>
        
        {/* Right Side - Visual/Branding */}
        <div class="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-purple-600 via-purple-700 to-pink-600 flex-col justify-center items-center p-12 relative overflow-hidden">
          {/* Decorative circles */}
          <div class="absolute top-20 right-20 w-72 h-72 bg-white/10 rounded-full blur-3xl"></div>
          <div class="absolute bottom-20 left-20 w-96 h-96 bg-pink-500/20 rounded-full blur-3xl"></div>
          
          <div class="max-w-lg text-white relative z-10">
            <div class="mb-8">
              <i class="fas fa-stethoscope text-6xl opacity-90 mb-6"></i>
            </div>
            
            <h2 class="text-4xl font-bold mb-4 leading-tight">
              Sua jornada médica começa aqui
            </h2>
            <p class="text-lg opacity-90 mb-8">
              Acesse trilhas completas, aulas práticas e conteúdo de alta qualidade para sua formação médica.
            </p>
            
            {/* Features */}
            <div class="grid grid-cols-2 gap-4">
              <div class="flex items-start space-x-3 bg-white/10 backdrop-blur-sm p-4 rounded-lg">
                <i class="fas fa-check-circle text-2xl mt-1"></i>
                <div>
                  <p class="font-semibold">Trilhas Organizadas</p>
                  <p class="text-sm opacity-80">Por especialidade</p>
                </div>
              </div>
              <div class="flex items-start space-x-3 bg-white/10 backdrop-blur-sm p-4 rounded-lg">
                <i class="fas fa-video text-2xl mt-1"></i>
                <div>
                  <p class="font-semibold">Aulas em Vídeo</p>
                  <p class="text-sm opacity-80">Alta qualidade</p>
                </div>
              </div>
              <div class="flex items-start space-x-3 bg-white/10 backdrop-blur-sm p-4 rounded-lg">
                <i class="fas fa-chart-line text-2xl mt-1"></i>
                <div>
                  <p class="font-semibold">Progresso Detalhado</p>
                  <p class="text-sm opacity-80">Acompanhe sua evolução</p>
                </div>
              </div>
              <div class="flex items-start space-x-3 bg-white/10 backdrop-blur-sm p-4 rounded-lg">
                <i class="fas fa-book-open text-2xl mt-1"></i>
                <div>
                  <p class="font-semibold">Casos Clínicos</p>
                  <p class="text-sm opacity-80">Aplicação prática</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </BaseLayout>
  );
});

// Password recovery page
app.get('/recuperar-senha', (c) => {
  return c.html(
    <BaseLayout title="Recuperar Senha">
      <div class="min-h-screen flex bg-gray-900">
        {/* Left Side - Form */}
        <div class="w-full lg:w-1/2 flex flex-col justify-center items-center p-8 relative">
          <div class="w-full max-w-md">
            {/* Logo */}
            <div class="flex items-center space-x-2 mb-8">
              <i class="fas fa-graduation-cap text-3xl gradient-text"></i>
              <span class="text-2xl font-bold">HardMedicina</span>
            </div>
            
            {/* Form Container */}
            <div class="bg-gray-800 p-8 rounded-2xl shadow-2xl border border-gray-700">
              <div class="text-center mb-6">
                <div class="w-16 h-16 bg-purple-600/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <i class="fas fa-key text-3xl text-purple-400"></i>
                </div>
                <h2 class="text-2xl font-bold mb-2">Recuperar Senha</h2>
                <p class="text-gray-400">Enviaremos instruções para seu e-mail</p>
              </div>
              
              <form id="recoverForm" class="space-y-4">
                <div>
                  <label class="block text-sm font-medium mb-2">E-mail</label>
                  <input 
                    type="email" 
                    name="email" 
                    required
                    class="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500 transition"
                    placeholder="seu@email.com"
                  />
                </div>
                
                <div id="message" class="hidden bg-blue-500/20 border border-blue-500 text-blue-300 px-4 py-3 rounded-lg text-sm"></div>
                
                <button 
                  type="submit" 
                  class="w-full bg-gradient-to-r from-purple-600 to-pink-600 py-3 rounded-lg font-semibold hover:from-purple-700 hover:to-pink-700 transition transform hover:scale-[1.02]"
                >
                  Enviar Instruções
                </button>
              </form>
              
              <p class="text-center text-gray-400 mt-6">
                <a href="/login" class="text-purple-400 hover:text-purple-300 font-semibold transition">
                  <i class="fas fa-arrow-left mr-2"></i>Voltar ao login
                </a>
              </p>
            </div>
          </div>
        </div>
        
        {/* Right Side - Visual/Branding */}
        <div class="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 flex-col justify-center items-center p-12 relative overflow-hidden">
          {/* Decorative circles */}
          <div class="absolute top-20 right-20 w-72 h-72 bg-white/10 rounded-full blur-3xl"></div>
          <div class="absolute bottom-20 left-20 w-96 h-96 bg-pink-500/20 rounded-full blur-3xl"></div>
          
          <div class="max-w-lg text-white relative z-10 text-center">
            <div class="mb-8">
              <i class="fas fa-shield-alt text-6xl opacity-90 mb-6"></i>
            </div>
            
            <h2 class="text-4xl font-bold mb-4 leading-tight">
              Recupere sua conta com segurança
            </h2>
            <p class="text-lg opacity-90 mb-8">
              Não se preocupe! Acontece com todos. Vamos ajudar você a recuperar o acesso à sua conta.
            </p>
            
            {/* Steps */}
            <div class="space-y-4 text-left">
              <div class="flex items-start space-x-4 bg-white/10 backdrop-blur-sm p-4 rounded-lg">
                <div class="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                  <span class="font-bold">1</span>
                </div>
                <div>
                  <p class="font-semibold mb-1">Informe seu e-mail</p>
                  <p class="text-sm opacity-80">Digite o e-mail cadastrado</p>
                </div>
              </div>
              <div class="flex items-start space-x-4 bg-white/10 backdrop-blur-sm p-4 rounded-lg">
                <div class="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                  <span class="font-bold">2</span>
                </div>
                <div>
                  <p class="font-semibold mb-1">Verifique seu e-mail</p>
                  <p class="text-sm opacity-80">Enviaremos um link de recuperação</p>
                </div>
              </div>
              <div class="flex items-start space-x-4 bg-white/10 backdrop-blur-sm p-4 rounded-lg">
                <div class="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                  <span class="font-bold">3</span>
                </div>
                <div>
                  <p class="font-semibold mb-1">Crie uma nova senha</p>
                  <p class="text-sm opacity-80">Defina uma senha segura</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </BaseLayout>
  );
});

// ========================================
// USER AREA ROUTES
// ========================================
app.get('/dashboard', async (c) => {
  const user = await getUserFromToken(c);
  if (!user) {
    return c.redirect('/login');
  }
  
  return c.html(
    <BaseLayout title="Dashboard" user={user}>
      {Header({ user, showSearch: true })}
      
      <main class="container mx-auto px-4 py-8">
        <div class="bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl p-8 mb-8">
          <h1 class="text-3xl font-bold mb-2">Olá, <span id="userName">{user.name}</span> 👋</h1>
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
    </BaseLayout>
  );
});

// ========================================
// PAGE: ALL TRACKS (STUDENT VIEW)
// ========================================
app.get('/trilhas', async (c) => {
  const user = await getUserFromToken(c);
  if (!user) {
    return c.redirect('/login');
  }
  
  return c.html(
    <BaseLayout title="Todas as Trilhas" user={user}>
      {Header({ user, showSearch: true })}
      
      <main class="container mx-auto px-4 py-8">
        <div class="mb-8">
          <h1 class="text-4xl font-bold mb-2">Todas as Trilhas</h1>
          <p class="text-gray-400">Explore nosso catálogo completo de trilhas organizadas por especialidade</p>
        </div>
        
        <div id="specialtiesContent">
          <div class="text-center py-12">
            <i class="fas fa-spinner fa-spin text-3xl text-purple-500 mb-4"></i>
            <p class="text-gray-400">Carregando trilhas...</p>
          </div>
        </div>
      </main>
      
      {Footer()}
      
      <script src="/static/tracks.js"></script>
    </BaseLayout>
  );
});

app.get('/trilha/:slug', async (c) => {
  const slug = c.req.param('slug');
  const user = await getUserFromToken(c);
  if (!user) {
    return c.redirect('/login');
  }
  
  return c.html(
    <BaseLayout title="Trilha" user={user}>
      {Header({ user, showSearch: true })}
      
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
      
      {html`<script>window.trackSlug = '${slug}';</script>`}
      <script src="/static/track.js"></script>
    </BaseLayout>
  );
});

app.get('/aula/:slug', async (c) => {
  const slug = c.req.param('slug');
  const user = await getUserFromToken(c);
  if (!user) {
    return c.redirect('/login');
  }
  
  return c.html(
    <BaseLayout title="Aula" user={user}>
      {Header({ user })}
      
      <main class="container mx-auto px-4 py-8">
        <div class="flex gap-6 max-w-7xl mx-auto">
          {/* Main Content */}
          <div class="flex-1">
            <div id="lessonContent">
              <div class="bg-black rounded-xl overflow-hidden mb-6" style="aspect-ratio: 16/9;">
                <iframe id="videoPlayer" width="100%" height="100%" frameborder="0" allowfullscreen></iframe>
              </div>
              
              <div class="flex items-start justify-between mb-6">
                <div class="flex-1">
                  <h1 id="lessonTitle" class="text-3xl font-bold mb-2">Carregando...</h1>
                  <p id="lessonMeta" class="text-gray-400 text-sm"></p>
                </div>
                <button id="completeBtn" onclick="toggleComplete()" class="bg-gradient-to-r from-purple-600 to-pink-600 px-6 py-3 rounded-lg hover:from-purple-700 hover:to-pink-700 transition font-semibold">
                  <i class="fas fa-check mr-2"></i>
                  <span id="completeBtnText">Marcar como concluída</span>
                </button>
              </div>
              
              <p id="lessonDescription" class="text-gray-300 mb-6"></p>
              
              <div id="keyPoints" class="bg-gray-800 rounded-xl p-6 mb-6"></div>
              
              <div id="downloads" class="flex gap-4"></div>
            </div>
          </div>
          
          {/* Sidebar - Track Lessons */}
          <div class="w-80 hidden lg:block">
            <div class="bg-gray-800 rounded-xl p-4 sticky top-4 max-h-[calc(100vh-2rem)] overflow-y-auto custom-scrollbar">
              <div class="mb-4">
                <h3 id="trackTitle" class="font-bold text-lg mb-1">Carregando trilha...</h3>
                <p id="trackProgress" class="text-xs text-gray-400"></p>
              </div>
              
              <div id="trackSeasons" class="space-y-3">
                <div class="flex items-center justify-center py-8 text-gray-400">
                  <i class="fas fa-spinner fa-spin mr-2"></i>
                  Carregando...
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      
      {Footer()}
      
      {html`<script>window.lessonSlug = '${slug}';</script>`}
      <script src="/static/lesson.js"></script>
    </BaseLayout>
  );
});

// ========================================
// TRILHAS PAGE BY SPECIALTY
// ========================================
app.get('/trilhas/:specialtySlug', async (c) => {
  const specialtySlug = c.req.param('specialtySlug');
  const { DB } = c.env;
  const user = await getUserFromToken(c);
  
  const specialty = await db.getSpecialtyBySlug(DB, specialtySlug);
  if (!specialty) {
    return c.redirect('/trilhas');
  }
  
  return c.html(
    <BaseLayout title={`Trilhas de ${specialty.name}`} user={user}>
      {Header({ user, showSearch: true })}
      
      <main class="container mx-auto px-4 py-8">
        <nav class="text-sm text-gray-400 mb-6">
          <a href="/" class="hover:text-purple-400">Início</a>
          <i class="fas fa-chevron-right mx-2"></i>
          <a href="/trilhas" class="hover:text-purple-400">Trilhas</a>
          <i class="fas fa-chevron-right mx-2"></i>
          <span class="text-white">{specialty.name}</span>
        </nav>
        
        <div class="flex items-center mb-8">
          <i class={`fas ${specialty.icon || 'fa-book-medical'} text-5xl gradient-text mr-4`}></i>
          <div>
            <h1 class="text-4xl font-bold">{specialty.name}</h1>
            <p class="text-gray-400 mt-2">{specialty.description || ''}</p>
          </div>
        </div>
        
        <div id="tracksGrid" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div class="col-span-full text-center py-12 text-gray-400">
            <i class="fas fa-spinner fa-spin text-3xl mb-4"></i>
            <p>Carregando trilhas...</p>
          </div>
        </div>
      </main>
      
      {Footer()}
      
      <script src="/static/dashboard.js"></script>
      <script>{`
        const specialtyId = ${specialty.id};
        
        async function loadSpecialtyTracks() {
          try {
            const response = await axios.get('/tracks');
            const allTracks = response.data;
            const tracks = allTracks.filter(t => t.specialty_id === specialtyId);
            
            const grid = document.getElementById('tracksGrid');
            if (tracks.length === 0) {
              grid.innerHTML = '<div class="col-span-full text-center py-12 text-gray-400">Nenhuma trilha disponível nesta especialidade ainda.</div>';
              return;
            }
            
            grid.innerHTML = tracks.map(track => \`
              <a href="/trilha/\${track.slug}" class="bg-gray-800 rounded-xl overflow-hidden card-hover">
                <div class="h-48 bg-gradient-to-br from-purple-600/20 to-pink-600/20 flex items-center justify-center">
                  <i class="fas fa-book-medical text-6xl gradient-text"></i>
                </div>
                <div class="p-6">
                  <h3 class="font-bold text-xl mb-2">\${track.title}</h3>
                  <p class="text-gray-400 text-sm mb-4">\${track.description || ''}</p>
                  <div class="flex items-center justify-between text-sm">
                    <span class="text-gray-400">
                      <i class="fas fa-video mr-1"></i> \${track.total_lessons} aulas
                    </span>
                    <span class="text-gray-400">
                      <i class="fas fa-clock mr-1"></i> \${Math.round(track.duration_minutes / 60)}h
                    </span>
                  </div>
                </div>
              </a>
            \`).join('');
          } catch (error) {
            console.error('Error:', error);
          }
        }
        
        loadSpecialtyTracks();
      `}</script>
    </BaseLayout>
  );
});

// ========================================
// TRILHAS PAGE (LISTAGEM)
// ========================================
app.get('/trilhas', async (c) => {
  const user = await getUserFromToken(c);
  
  return c.html(
    <BaseLayout title="Todas as Trilhas" user={user}>
      {Header({ user, showSearch: true })}
      
      <main class="container mx-auto px-4 py-8">
        <h1 class="text-4xl font-bold mb-8">Todas as Trilhas</h1>
        
        <div class="flex gap-4 mb-8">
          <button onclick="filterBySpecialty('all')" class="filter-btn active px-6 py-2 rounded-lg bg-purple-600 hover:bg-purple-700 transition">
            Todas
          </button>
          <button onclick="filterBySpecialty('cardiologia')" class="filter-btn px-6 py-2 rounded-lg bg-gray-700 hover:bg-gray-600 transition">
            Cardiologia
          </button>
          <button onclick="filterBySpecialty('nefrologia')" class="filter-btn px-6 py-2 rounded-lg bg-gray-700 hover:bg-gray-600 transition">
            Nefrologia
          </button>
          <button onclick="filterBySpecialty('clinica')" class="filter-btn px-6 py-2 rounded-lg bg-gray-700 hover:bg-gray-600 transition">
            Clínica
          </button>
          <button onclick="filterBySpecialty('cirurgia')" class="filter-btn px-6 py-2 rounded-lg bg-gray-700 hover:bg-gray-600 transition">
            Cirurgia
          </button>
        </div>
        
        <div id="tracksGrid" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div class="col-span-full text-center py-12 text-gray-400">
            <i class="fas fa-spinner fa-spin text-3xl mb-4"></i>
            <p>Carregando trilhas...</p>
          </div>
        </div>
      </main>
      
      {Footer()}
      
      <script src="/static/dashboard.js"></script>
      <script>{`
        let allTracks = [];
        let currentFilter = 'all';
        
        async function loadAllTracks() {
          try {
            const response = await axios.get('/tracks');
            allTracks = response.data;
            displayTracks(allTracks);
          } catch (error) {
            console.error('Error:', error);
            document.getElementById('tracksGrid').innerHTML = '<div class="col-span-full text-center py-12 text-red-400">Erro ao carregar trilhas</div>';
          }
        }
        
        function displayTracks(tracks) {
          const grid = document.getElementById('tracksGrid');
          if (tracks.length === 0) {
            grid.innerHTML = '<div class="col-span-full text-center py-12 text-gray-400">Nenhuma trilha encontrada</div>';
            return;
          }
          
          grid.innerHTML = tracks.map(track => \`
            <a href="/trilha/\${track.slug}" class="bg-gray-800 rounded-xl overflow-hidden card-hover">
              <div class="h-48 bg-gradient-to-br from-purple-600/20 to-pink-600/20 flex items-center justify-center">
                <i class="fas fa-book-medical text-6xl gradient-text"></i>
              </div>
              <div class="p-6">
                <h3 class="font-bold text-xl mb-2">\${track.title}</h3>
                <p class="text-gray-400 text-sm mb-4 line-clamp-3">\${track.description || ''}</p>
                <div class="flex items-center justify-between text-sm">
                  <span class="text-gray-400">
                    <i class="fas fa-video mr-1"></i> \${track.total_lessons} aulas
                  </span>
                  <span class="text-gray-400">
                    <i class="fas fa-clock mr-1"></i> \${Math.round(track.duration_minutes / 60)}h
                  </span>
                </div>
                \${track.user_progress ? \`
                  <div class="mt-4">
                    <div class="w-full bg-gray-700 rounded-full h-2">
                      <div class="bg-purple-500 h-full rounded-full" style="width: \${track.user_progress}%"></div>
                    </div>
                    <p class="text-xs text-gray-400 mt-1">\${Math.round(track.user_progress)}% concluído</p>
                  </div>
                \` : ''}
              </div>
            </a>
          \`).join('');
        }
        
        function filterBySpecialty(specialty) {
          currentFilter = specialty;
          
          // Update button styles
          document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.classList.remove('active', 'bg-purple-600');
            btn.classList.add('bg-gray-700');
          });
          event.target.classList.remove('bg-gray-700');
          event.target.classList.add('active', 'bg-purple-600');
          
          // Filter tracks
          if (specialty === 'all') {
            displayTracks(allTracks);
          } else {
            const filtered = allTracks.filter(track => {
              // This is a simple filter - in production you'd match against specialty_id
              return track.slug.includes(specialty);
            });
            displayTracks(filtered);
          }
        }
        
        loadAllTracks();
      `}</script>
    </BaseLayout>
  );
});

// ========================================
// PERFIL PAGE
// ========================================
app.get('/perfil', async (c) => {
  const user = await getUserFromToken(c);
  if (!user) {
    return c.redirect('/login');
  }
  
  return c.html(
    <BaseLayout title="Meu Perfil" user={user}>
      {Header({ user, showSearch: true })}
      
      <main class="container mx-auto px-4 py-8">
        <h1 class="text-4xl font-bold mb-8">Meu Perfil</h1>
        
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div class="lg:col-span-2">
            <div class="bg-gray-800 rounded-xl p-6">
              <h2 class="text-2xl font-bold mb-6">Informações Pessoais</h2>
              
              <form id="profileForm" class="space-y-4">
                <div>
                  <label class="block text-sm font-medium mb-2">Nome Completo</label>
                  <input 
                    type="text" 
                    id="name"
                    name="name" 
                    class="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="Carregando..."
                  />
                </div>
                
                <div>
                  <label class="block text-sm font-medium mb-2">E-mail</label>
                  <input 
                    type="email" 
                    id="email"
                    name="email" 
                    readonly
                    class="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 opacity-50 cursor-not-allowed"
                    placeholder="Carregando..."
                  />
                </div>
                
                <div class="border-t border-gray-700 pt-4 mt-6">
                  <h3 class="text-lg font-bold mb-4">Alterar Senha</h3>
                  
                  <div class="space-y-4">
                    <div>
                      <label class="block text-sm font-medium mb-2">Senha Atual</label>
                      <input 
                        type="password" 
                        name="currentPassword" 
                        class="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                    
                    <div>
                      <label class="block text-sm font-medium mb-2">Nova Senha</label>
                      <input 
                        type="password" 
                        name="newPassword" 
                        minlength="8"
                        class="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                    
                    <div>
                      <label class="block text-sm font-medium mb-2">Confirmar Nova Senha</label>
                      <input 
                        type="password" 
                        name="confirmPassword" 
                        minlength="8"
                        class="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                  </div>
                </div>
                
                <button 
                  type="submit" 
                  class="w-full bg-gradient-to-r from-purple-600 to-pink-600 py-3 rounded-lg font-semibold hover:from-purple-700 hover:to-pink-700 transition"
                >
                  Salvar Alterações
                </button>
              </form>
            </div>
          </div>
          
          <div>
            <div class="bg-gray-800 rounded-xl p-6">
              <h2 class="text-2xl font-bold mb-6">Estatísticas</h2>
              
              <div class="space-y-4">
                <div class="flex items-center justify-between p-4 bg-gray-700 rounded-lg">
                  <div>
                    <p class="text-sm text-gray-400">Aulas Concluídas</p>
                    <p id="totalCompleted" class="text-2xl font-bold">0</p>
                  </div>
                  <i class="fas fa-check-circle text-3xl text-green-500"></i>
                </div>
                
                <div class="flex items-center justify-between p-4 bg-gray-700 rounded-lg">
                  <div>
                    <p class="text-sm text-gray-400">Trilhas Iniciadas</p>
                    <p id="totalTracks" class="text-2xl font-bold">0</p>
                  </div>
                  <i class="fas fa-book text-3xl text-purple-500"></i>
                </div>
                
                <div class="flex items-center justify-between p-4 bg-gray-700 rounded-lg">
                  <div>
                    <p class="text-sm text-gray-400">Progresso Médio</p>
                    <p id="avgProgress" class="text-2xl font-bold">0%</p>
                  </div>
                  <i class="fas fa-chart-line text-3xl text-pink-500"></i>
                </div>
                
                <div class="flex items-center justify-between p-4 bg-gray-700 rounded-lg">
                  <div>
                    <p class="text-sm text-gray-400">Membro desde</p>
                    <p id="memberSince" class="text-sm font-bold">-</p>
                  </div>
                  <i class="fas fa-calendar text-3xl text-blue-500"></i>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      
      {Footer()}
      
      <script src="/static/profile.js"></script>
    </BaseLayout>
  );
});

// ========================================
// ADMIN DASHBOARD
// ========================================
app.get('/admin', async (c) => {
  const user = await getUserFromToken(c);
  if (!user || user.role !== 'admin') {
    return c.redirect('/dashboard');
  }
  
  return c.html(
    <BaseLayout title="Painel Admin" user={user}>
      {Header({ user, showSearch: false })}
      
      <main class="container mx-auto px-4 py-8">
        <div class="flex items-center justify-between mb-8">
          <h1 class="text-4xl font-bold">Painel Administrativo</h1>
          <a href="/dashboard" class="text-purple-400 hover:text-purple-300">
            <i class="fas fa-arrow-left mr-2"></i>Voltar ao Dashboard
          </a>
        </div>
        
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div class="bg-gradient-to-br from-purple-600 to-purple-800 rounded-xl p-6">
            <div class="flex items-center justify-between mb-4">
              <i class="fas fa-users text-4xl"></i>
              <span id="totalUsers" class="text-3xl font-bold">0</span>
            </div>
            <p class="text-lg opacity-90">Usuários Totais</p>
          </div>
          
          <div class="bg-gradient-to-br from-pink-600 to-pink-800 rounded-xl p-6">
            <div class="flex items-center justify-between mb-4">
              <i class="fas fa-book text-4xl"></i>
              <span id="totalTracks" class="text-3xl font-bold">0</span>
            </div>
            <p class="text-lg opacity-90">Trilhas Ativas</p>
          </div>
          
          <div class="bg-gradient-to-br from-blue-600 to-blue-800 rounded-xl p-6">
            <div class="flex items-center justify-between mb-4">
              <i class="fas fa-video text-4xl"></i>
              <span id="totalLessons" class="text-3xl font-bold">0</span>
            </div>
            <p class="text-lg opacity-90">Aulas Disponíveis</p>
          </div>
          
          <div class="bg-gradient-to-br from-green-600 to-green-800 rounded-xl p-6">
            <div class="flex items-center justify-between mb-4">
              <i class="fas fa-eye text-4xl"></i>
              <span id="dailyViews" class="text-3xl font-bold">0</span>
            </div>
            <p class="text-lg opacity-90">Visualizações Hoje</p>
          </div>
        </div>
        
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <div class="bg-gray-800 rounded-xl p-6">
            <h2 class="text-2xl font-bold mb-4">Ações Rápidas</h2>
            <div class="grid grid-cols-2 gap-4">
              <a href="/admin/trilhas" class="bg-purple-600 hover:bg-purple-700 p-4 rounded-lg text-center transition">
                <i class="fas fa-book-medical text-3xl mb-2"></i>
                <p class="font-semibold">Gerenciar Trilhas</p>
              </a>
              <a href="/admin/temporadas" class="bg-indigo-600 hover:bg-indigo-700 p-4 rounded-lg text-center transition">
                <i class="fas fa-layer-group text-3xl mb-2"></i>
                <p class="font-semibold">Gerenciar Temporadas</p>
              </a>
              <a href="/admin/aulas" class="bg-pink-600 hover:bg-pink-700 p-4 rounded-lg text-center transition">
                <i class="fas fa-video text-3xl mb-2"></i>
                <p class="font-semibold">Gerenciar Aulas</p>
              </a>
              <a href="/admin/usuarios" class="bg-blue-600 hover:bg-blue-700 p-4 rounded-lg text-center transition">
                <i class="fas fa-users text-3xl mb-2"></i>
                <p class="font-semibold">Gerenciar Usuários</p>
              </a>
              <a href="/admin/relatorios" class="bg-green-600 hover:bg-green-700 p-4 rounded-lg text-center transition">
                <i class="fas fa-chart-bar text-3xl mb-2"></i>
                <p class="font-semibold">Relatórios</p>
              </a>
              <a href="/admin/notificacoes" class="bg-yellow-600 hover:bg-yellow-700 p-4 rounded-lg text-center transition">
                <i class="fas fa-bell text-3xl mb-2"></i>
                <p class="font-semibold">Notificações</p>
              </a>
            </div>
          </div>
          
          <div class="bg-gray-800 rounded-xl p-6">
            <h2 class="text-2xl font-bold mb-4">Usuários Recentes</h2>
            <div id="recentUsers" class="space-y-3">
              <p class="text-gray-400 text-center py-4">Carregando...</p>
            </div>
          </div>
        </div>
      </main>
      
      {Footer()}
      
      <script src="/static/admin.js"></script>
    </BaseLayout>
  );
});

// ========================================
// ADMIN - GERENCIAR USUÁRIOS
// ========================================
app.get('/admin/usuarios', async (c) => {
  const user = await getUserFromToken(c);
  if (!user || user.role !== 'admin') {
    return c.redirect('/dashboard');
  }
  
  return c.html(
    <BaseLayout title="Gerenciar Usuários" user={user}>
      {Header({ user })}
      
      <main class="container mx-auto px-4 py-8">
        <div class="flex items-center justify-between mb-8">
          <h1 class="text-4xl font-bold">Gerenciar Usuários</h1>
          <a href="/admin" class="text-purple-400 hover:text-purple-300">
            <i class="fas fa-arrow-left mr-2"></i>Voltar
          </a>
        </div>
        
        <div class="bg-gray-800 rounded-xl p-6">
          <div class="overflow-x-auto">
            <table class="w-full">
              <thead>
                <tr class="border-b border-gray-700">
                  <th class="text-left py-3 px-4">Nome</th>
                  <th class="text-left py-3 px-4">E-mail</th>
                  <th class="text-left py-3 px-4">Role</th>
                  <th class="text-left py-3 px-4">Progresso</th>
                  <th class="text-left py-3 px-4">Último Acesso</th>
                  <th class="text-left py-3 px-4">Ações</th>
                </tr>
              </thead>
              <tbody id="usersTable">
                <tr>
                  <td colspan="6" class="text-center py-8 text-gray-400">
                    <i class="fas fa-spinner fa-spin text-2xl mb-2"></i>
                    <p>Carregando usuários...</p>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </main>
      
      {Footer()}
      
      <script src="/static/admin-users.js"></script>
    </BaseLayout>
  );
});

// ========================================
// ADMIN - GERENCIAR TRILHAS
// ========================================
app.get('/admin/trilhas', async (c) => {
  const user = await getUserFromToken(c);
  if (!user || user.role !== 'admin') {
    return c.redirect('/dashboard');
  }
  
  return c.html(
    <BaseLayout title="Gerenciar Trilhas" user={user}>
      {Header({ user })}
      
      <main class="container mx-auto px-4 py-8">
        <div class="flex items-center justify-between mb-8">
          <h1 class="text-4xl font-bold">Gerenciar Trilhas</h1>
          <div class="flex gap-4">
            <a href="/admin" class="text-purple-400 hover:text-purple-300">
              <i class="fas fa-arrow-left mr-2"></i>Voltar
            </a>
            <button onclick="openCreateModal()" class="bg-gradient-to-r from-purple-600 to-pink-600 px-6 py-2 rounded-lg hover:from-purple-700 hover:to-pink-700 transition">
              <i class="fas fa-plus mr-2"></i>Nova Trilha
            </button>
          </div>
        </div>
        
        <div id="tracksTable" class="bg-gray-800 rounded-xl p-6">
          <div class="text-center py-12">
            <i class="fas fa-spinner fa-spin text-3xl text-purple-500 mb-4"></i>
            <p class="text-gray-400">Carregando trilhas...</p>
          </div>
        </div>
      </main>
      
      {Footer()}
      
      <div id="modalOverlay" class="hidden fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
        <div class="bg-gray-800 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-8 border border-gray-700">
          <h2 id="modalTitle" class="text-2xl font-bold mb-6">Nova Trilha</h2>
          <form id="trackForm" class="space-y-4">
            <input type="hidden" id="trackId" />
            
            <div>
              <label class="block text-sm font-medium mb-2">Especialidade</label>
              <select id="trackSpecialty" required class="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500">
                <option value="">Selecione uma especialidade</option>
                <option value="1">Cardiologia</option>
                <option value="2">Nefrologia</option>
                <option value="3">Clínica Médica</option>
                <option value="4">Cirurgia</option>
                <option value="5">Ginecologia</option>
                <option value="6">Pediatria</option>
              </select>
            </div>
            
            <div>
              <label class="block text-sm font-medium mb-2">Título</label>
              <input type="text" id="trackTitle" required class="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500" />
            </div>
            
            <div>
              <label class="block text-sm font-medium mb-2">Descrição</label>
              <textarea id="trackDescription" rows="3" class="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500"></textarea>
            </div>
            
            <div>
              <label class="block text-sm font-medium mb-2">URL da Imagem de Capa</label>
              <input type="url" id="trackCoverImage" placeholder="https://exemplo.com/imagem.jpg" class="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500" />
              <p class="text-xs text-gray-400 mt-1">Cole a URL de uma imagem (opcional)</p>
            </div>
            
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium mb-2">Total de Aulas</label>
                <input type="number" id="trackLessons" required min="0" class="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500" />
              </div>
              <div>
                <label class="block text-sm font-medium mb-2">Duração (minutos)</label>
                <input type="number" id="trackDuration" required min="0" class="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500" />
              </div>
            </div>
            
            <div id="formMessage" class="hidden p-4 rounded-lg"></div>
            
            <div class="flex gap-4">
              <button type="button" onclick="closeModal()" class="flex-1 bg-gray-700 py-3 rounded-lg hover:bg-gray-600 transition">
                Cancelar
              </button>
              <button type="submit" class="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 py-3 rounded-lg hover:from-purple-700 hover:to-pink-700 transition">
                Salvar
              </button>
            </div>
          </form>
        </div>
      </div>
      
      <script src="/static/admin-tracks.js"></script>
    </BaseLayout>
  );
});

// ========================================
// ADMIN - GERENCIAR TEMPORADAS
// ========================================
app.get('/admin/temporadas', async (c) => {
  const user = await getUserFromToken(c);
  if (!user || user.role !== 'admin') {
    return c.redirect('/dashboard');
  }
  
  return c.html(
    <BaseLayout title="Gerenciar Temporadas" user={user}>
      {Header({ user })}
      
      <main class="container mx-auto px-4 py-8">
        <div class="flex items-center justify-between mb-8">
          <h1 class="text-4xl font-bold">Gerenciar Temporadas</h1>
          <div class="flex gap-4">
            <a href="/admin" class="text-purple-400 hover:text-purple-300">
              <i class="fas fa-arrow-left mr-2"></i>Voltar
            </a>
            <button onclick="openCreateModal()" class="bg-gradient-to-r from-purple-600 to-pink-600 px-6 py-2 rounded-lg hover:from-purple-700 hover:to-pink-700 transition">
              <i class="fas fa-plus mr-2"></i>Nova Temporada
            </button>
          </div>
        </div>
        
        <div class="mb-6 flex items-center gap-4">
          <label class="text-gray-400">Filtrar por trilha:</label>
          <select id="filterTrack" onchange="filterSeasons()" class="bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500">
            <option value="">Todas as trilhas</option>
          </select>
        </div>
        
        <div class="bg-gray-800 rounded-xl overflow-hidden">
          <table class="w-full">
            <thead class="bg-gray-900">
              <tr>
                <th class="text-left py-4 px-4 font-semibold">Ordem</th>
                <th class="text-left py-4 px-4 font-semibold">Título</th>
                <th class="text-left py-4 px-4 font-semibold">Trilha</th>
                <th class="text-left py-4 px-4 font-semibold">Status</th>
                <th class="text-left py-4 px-4 font-semibold">Ações</th>
              </tr>
            </thead>
            <tbody id="seasonsTableBody">
              <tr>
                <td colspan="5" class="text-center py-12">
                  <i class="fas fa-spinner fa-spin text-3xl text-purple-500 mb-4"></i>
                  <p class="text-gray-400">Carregando temporadas...</p>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </main>
      
      {Footer()}
      
      <div id="modalOverlay" class="hidden fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
        <div class="bg-gray-800 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-8 border border-gray-700">
          <h2 id="modalTitle" class="text-2xl font-bold mb-6">Nova Temporada</h2>
          <form id="seasonForm" class="space-y-4">
            <input type="hidden" id="seasonId" />
            
            <div>
              <label class="block text-sm font-medium mb-2">Trilha *</label>
              <select id="seasonTrack" required class="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500">
                <option value="">Selecione uma trilha</option>
              </select>
            </div>
            
            <div>
              <label class="block text-sm font-medium mb-2">Título *</label>
              <input type="text" id="seasonTitle" required placeholder="Ex: Temporada 1: Fundamentos" class="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500" />
            </div>
            
            <div>
              <label class="block text-sm font-medium mb-2">Descrição</label>
              <textarea id="seasonDescription" rows="3" placeholder="Breve descrição da temporada" class="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500"></textarea>
            </div>
            
            <div>
              <label class="block text-sm font-medium mb-2">Ordem de Exibição *</label>
              <input type="number" id="seasonOrder" required min="1" value="1" class="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500" />
            </div>
            
            <div class="flex items-center">
              <input type="checkbox" id="seasonActive" checked class="w-5 h-5 text-purple-600 bg-gray-700 border-gray-600 rounded focus:ring-purple-500" />
              <label for="seasonActive" class="ml-2 text-sm font-medium">Temporada ativa (visível para os alunos)</label>
            </div>
            
            <div id="formMessage" class="hidden p-4 rounded-lg"></div>
            
            <div class="flex gap-4">
              <button type="button" onclick="closeModal()" class="flex-1 bg-gray-700 py-3 rounded-lg hover:bg-gray-600 transition">
                Cancelar
              </button>
              <button type="submit" class="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 py-3 rounded-lg hover:from-purple-700 hover:to-pink-700 transition">
                Salvar
              </button>
            </div>
          </form>
        </div>
      </div>
      
      <script src="/static/admin-seasons.js"></script>
    </BaseLayout>
  );
});

// ========================================
// ADMIN - GERENCIAR AULAS
// ========================================
app.get('/admin/aulas', async (c) => {
  const user = await getUserFromToken(c);
  if (!user || user.role !== 'admin') {
    return c.redirect('/dashboard');
  }
  
  return c.html(
    <BaseLayout title="Gerenciar Aulas" user={user}>
      {Header({ user })}
      
      <main class="container mx-auto px-4 py-8">
        <div class="flex items-center justify-between mb-8">
          <h1 class="text-4xl font-bold">Gerenciar Aulas</h1>
          <div class="flex gap-4">
            <a href="/admin" class="text-purple-400 hover:text-purple-300">
              <i class="fas fa-arrow-left mr-2"></i>Voltar
            </a>
            <button onclick="openCreateModal()" class="bg-gradient-to-r from-purple-600 to-pink-600 px-6 py-2 rounded-lg hover:from-purple-700 hover:to-pink-700 transition">
              <i class="fas fa-plus mr-2"></i>Nova Aula
            </button>
          </div>
        </div>
        
        <div class="bg-gray-800 rounded-xl p-6 mb-6">
          <label class="block text-sm font-medium mb-2">Filtrar por Trilha</label>
          <select id="filterTrack" class="w-full md:w-96 bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500">
            <option value="">Todas as trilhas</option>
          </select>
        </div>
        
        <div id="lessonsTable" class="bg-gray-800 rounded-xl p-6">
          <div class="text-center py-12">
            <i class="fas fa-spinner fa-spin text-3xl text-purple-500 mb-4"></i>
            <p class="text-gray-400">Carregando aulas...</p>
          </div>
        </div>
      </main>
      
      {Footer()}
      
      <div id="modalOverlay" class="hidden fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
        <div class="bg-gray-800 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-8 border border-gray-700">
          <h2 id="modalTitle" class="text-2xl font-bold mb-6">Nova Aula</h2>
          <form id="lessonForm" class="space-y-4">
            <input type="hidden" id="lessonId" />
            
            <div>
              <label class="block text-sm font-medium mb-2">Trilha *</label>
              <select id="lessonTrack" required class="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500">
                <option value="">Selecione uma trilha</option>
              </select>
            </div>
            
            <div>
              <label class="block text-sm font-medium mb-2">Temporada *</label>
              <select id="lessonSeason" required class="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500">
                <option value="">Selecione uma temporada</option>
              </select>
            </div>
            
            <div>
              <label class="block text-sm font-medium mb-2">Título *</label>
              <input type="text" id="lessonTitle" required class="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500" />
            </div>
            
            <div>
              <label class="block text-sm font-medium mb-2">Descrição</label>
              <textarea id="lessonDescription" rows="3" class="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500"></textarea>
            </div>
            
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium mb-2">URL do Vídeo *</label>
                <input type="url" id="lessonVideoUrl" required class="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500" placeholder="https://..." />
              </div>
              <div>
                <label class="block text-sm font-medium mb-2">Duração (minutos)</label>
                <input type="number" id="lessonDuration" min="0" class="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500" />
              </div>
            </div>
            
            <div>
              <label class="block text-sm font-medium mb-2">URL do PDF (opcional)</label>
              <input type="url" id="lessonPdfUrl" class="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500" placeholder="https://..." />
            </div>
            
            <div>
              <label class="block text-sm font-medium mb-2">Pontos-chave (opcional)</label>
              <textarea id="lessonKeyPoints" rows="4" class="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500" placeholder="Digite cada ponto-chave em uma linha separada"></textarea>
              <p class="text-xs text-gray-400 mt-1">Um ponto por linha. Exemplo:<br/>Diagnóstico diferencial de dor torácica<br/>Critérios de estratificação de risco</p>
            </div>
            
            <div id="formMessage" class="hidden p-4 rounded-lg"></div>
            
            <div class="flex gap-4">
              <button type="button" onclick="closeModal()" class="flex-1 bg-gray-700 py-3 rounded-lg hover:bg-gray-600 transition">
                Cancelar
              </button>
              <button type="submit" class="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 py-3 rounded-lg hover:from-purple-700 hover:to-pink-700 transition">
                Salvar
              </button>
            </div>
          </form>
        </div>
      </div>
      
      <script src="/static/admin-lessons.js"></script>
    </BaseLayout>
  );
});

// ========================================
// ADMIN - GERENCIAR NOTIFICAÇÕES
// ========================================
app.get('/admin/notificacoes', async (c) => {
  const user = await getUserFromToken(c);
  if (!user || user.role !== 'admin') {
    return c.redirect('/dashboard');
  }
  
  return c.html(
    <BaseLayout title="Gerenciar Notificações" user={user}>
      {Header({ user })}
      
      <main class="container mx-auto px-4 py-8">
        <div class="flex items-center justify-between mb-8">
          <h1 class="text-4xl font-bold">Gerenciar Notificações</h1>
          <div class="flex gap-4">
            <a href="/admin" class="text-purple-400 hover:text-purple-300">
              <i class="fas fa-arrow-left mr-2"></i>Voltar
            </a>
            <button onclick="openCreateModal()" class="bg-gradient-to-r from-purple-600 to-pink-600 px-6 py-2 rounded-lg hover:from-purple-700 hover:to-pink-700 transition">
              <i class="fas fa-plus mr-2"></i>Nova Notificação
            </button>
          </div>
        </div>
        
        <div id="notificationsTable" class="bg-gray-800 rounded-xl p-6">
          <div class="text-center py-12">
            <i class="fas fa-spinner fa-spin text-3xl text-purple-500 mb-4"></i>
            <p class="text-gray-400">Carregando notificações...</p>
          </div>
        </div>
      </main>
      
      {/* Modal de Criar/Editar */}
      <div id="notificationModal" class="fixed inset-0 bg-black bg-opacity-50 hidden items-center justify-center z-50 p-4">
        <div class="bg-gray-800 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          <div class="p-6 border-b border-gray-700 flex items-center justify-between sticky top-0 bg-gray-800 z-10">
            <h2 id="modalTitle" class="text-2xl font-bold">Nova Notificação</h2>
            <button onclick="closeModal()" class="text-gray-400 hover:text-white">
              <i class="fas fa-times text-xl"></i>
            </button>
          </div>
          
          <form id="notificationForm" class="p-6">
            <input type="hidden" id="notificationId" />
            
            <div class="space-y-4">
              <div>
                <label class="block text-sm font-medium mb-2">Título *</label>
                <input type="text" id="title" required class="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500" placeholder="Ex: Nova trilha disponível" />
              </div>
              
              <div>
                <label class="block text-sm font-medium mb-2">Mensagem *</label>
                <textarea id="message" required rows="4" class="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500" placeholder="Descreva a notificação..."></textarea>
              </div>
              
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="block text-sm font-medium mb-2">Tipo *</label>
                  <select id="type" required class="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500">
                    <option value="info">Info (Azul)</option>
                    <option value="success">Sucesso (Verde)</option>
                    <option value="warning">Aviso (Amarelo)</option>
                    <option value="error">Erro (Vermelho)</option>
                  </select>
                </div>
                
                <div>
                  <label class="block text-sm font-medium mb-2">Ícone (Font Awesome)</label>
                  <input type="text" id="icon" class="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500" placeholder="Ex: fa-rocket" />
                  <p class="text-xs text-gray-400 mt-1">Opcional. Ex: fa-bell, fa-rocket</p>
                </div>
              </div>
              
              <div>
                <label class="block text-sm font-medium mb-2">Link (URL)</label>
                <input type="text" id="link_url" class="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500" placeholder="Ex: /trilhas/cardiologia" />
                <p class="text-xs text-gray-400 mt-1">Opcional. Para onde a notificação deve redirecionar</p>
              </div>
              
              <div>
                <label class="block text-sm font-medium mb-2">Data de Expiração</label>
                <input type="datetime-local" id="expires_at" class="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500" />
                <p class="text-xs text-gray-400 mt-1">Opcional. Deixe vazio para nunca expirar</p>
              </div>
              
              <div class="flex items-center gap-3 p-4 bg-gray-700 rounded-lg">
                <input type="checkbox" id="is_active" checked class="w-5 h-5 text-purple-600 bg-gray-600 border-gray-500 rounded focus:ring-purple-500" />
                <label for="is_active" class="text-sm font-medium">Notificação ativa (visível para usuários)</label>
              </div>
            </div>
            
            <div class="flex gap-4 mt-6">
              <button type="button" onclick="closeModal()" class="flex-1 bg-gray-700 py-3 rounded-lg hover:bg-gray-600 transition">
                Cancelar
              </button>
              <button type="submit" class="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 py-3 rounded-lg hover:from-purple-700 hover:to-pink-700 transition">
                Salvar
              </button>
            </div>
          </form>
        </div>
      </div>
      
      {Footer()}
      
      <script src="/static/admin-notifications.js"></script>
    </BaseLayout>
  );
});

// ========================================
// ADMIN - RELATÓRIOS
// ========================================
app.get('/admin/relatorios', async (c) => {
  const user = await getUserFromToken(c);
  if (!user || user.role !== 'admin') {
    return c.redirect('/dashboard');
  }
  
  return c.html(
    <BaseLayout title="Relatórios" user={user}>
      {Header({ user })}
      
      <main class="container mx-auto px-4 py-8">
        <div class="flex items-center justify-between mb-8">
          <div>
            <h1 class="text-4xl font-bold mb-2">Relatórios e Estatísticas</h1>
            <p class="text-gray-400">Análise completa de uso e desempenho da plataforma</p>
          </div>
          <a href="/admin" class="text-purple-400 hover:text-purple-300">
            <i class="fas fa-arrow-left mr-2"></i>Voltar ao Admin
          </a>
        </div>
        
        {/* Estatísticas Gerais */}
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div class="bg-gradient-to-br from-purple-600 to-purple-800 rounded-xl p-6">
            <div class="flex items-center justify-between mb-4">
              <i class="fas fa-users text-4xl"></i>
              <div class="text-right">
                <p class="text-3xl font-bold" id="reportTotalUsers">0</p>
                <p class="text-sm opacity-80" id="reportNewUsers">+0 hoje</p>
              </div>
            </div>
            <p class="text-lg opacity-90">Total de Usuários</p>
          </div>
          
          <div class="bg-gradient-to-br from-pink-600 to-pink-800 rounded-xl p-6">
            <div class="flex items-center justify-between mb-4">
              <i class="fas fa-video text-4xl"></i>
              <div class="text-right">
                <p class="text-3xl font-bold" id="reportTotalViews">0</p>
                <p class="text-sm opacity-80" id="reportViewsToday">+0 hoje</p>
              </div>
            </div>
            <p class="text-lg opacity-90">Visualizações</p>
          </div>
          
          <div class="bg-gradient-to-br from-blue-600 to-blue-800 rounded-xl p-6">
            <div class="flex items-center justify-between mb-4">
              <i class="fas fa-chart-line text-4xl"></i>
              <div class="text-right">
                <p class="text-3xl font-bold" id="reportCompletionRate">0%</p>
                <p class="text-sm opacity-80">média geral</p>
              </div>
            </div>
            <p class="text-lg opacity-90">Taxa de Conclusão</p>
          </div>
          
          <div class="bg-gradient-to-br from-green-600 to-green-800 rounded-xl p-6">
            <div class="flex items-center justify-between mb-4">
              <i class="fas fa-clock text-4xl"></i>
              <div class="text-right">
                <p class="text-3xl font-bold" id="reportAvgTime">0h</p>
                <p class="text-sm opacity-80">por usuário</p>
              </div>
            </div>
            <p class="text-lg opacity-90">Tempo Médio</p>
          </div>
        </div>
        
        {/* Filtros de Período */}
        <div class="bg-gray-800 rounded-xl p-6 mb-8">
          <div class="flex flex-wrap gap-4 items-center">
            <label class="text-sm font-medium">Período:</label>
            <select id="periodFilter" class="bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500">
              <option value="7">Últimos 7 dias</option>
              <option value="30" selected>Últimos 30 dias</option>
              <option value="90">Últimos 90 dias</option>
              <option value="365">Último ano</option>
              <option value="all">Todo o período</option>
            </select>
            
            <button onclick="refreshReports()" class="bg-purple-600 hover:bg-purple-700 px-6 py-2 rounded-lg transition">
              <i class="fas fa-sync-alt mr-2"></i>Atualizar
            </button>
            
            <button onclick="exportReport()" class="bg-green-600 hover:bg-green-700 px-6 py-2 rounded-lg transition ml-auto">
              <i class="fas fa-download mr-2"></i>Exportar Relatório
            </button>
          </div>
        </div>
        
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Trilhas Mais Populares */}
          <div class="bg-gray-800 rounded-xl p-6">
            <h2 class="text-2xl font-bold mb-4 flex items-center">
              <i class="fas fa-fire text-orange-500 mr-3"></i>
              Trilhas Mais Populares
            </h2>
            <div id="popularTracks" class="space-y-3">
              <p class="text-gray-400 text-center py-8">Carregando...</p>
            </div>
          </div>
          
          {/* Aulas Mais Assistidas */}
          <div class="bg-gray-800 rounded-xl p-6">
            <h2 class="text-2xl font-bold mb-4 flex items-center">
              <i class="fas fa-star text-yellow-500 mr-3"></i>
              Aulas Mais Assistidas
            </h2>
            <div id="popularLessons" class="space-y-3">
              <p class="text-gray-400 text-center py-8">Carregando...</p>
            </div>
          </div>
        </div>
        
        {/* Usuários Mais Ativos */}
        <div class="bg-gray-800 rounded-xl p-6 mb-8">
          <h2 class="text-2xl font-bold mb-4 flex items-center">
            <i class="fas fa-medal text-purple-500 mr-3"></i>
            Usuários Mais Ativos
          </h2>
          <div class="overflow-x-auto">
            <table class="w-full" id="activeUsersTable">
              <thead class="border-b border-gray-700">
                <tr>
                  <th class="text-left py-3 px-4">Posição</th>
                  <th class="text-left py-3 px-4">Usuário</th>
                  <th class="text-left py-3 px-4">Aulas Concluídas</th>
                  <th class="text-left py-3 px-4">Trilhas Iniciadas</th>
                  <th class="text-left py-3 px-4">Tempo Total</th>
                  <th class="text-left py-3 px-4">Último Acesso</th>
                </tr>
              </thead>
              <tbody id="activeUsersBody">
                <tr><td colspan="6" class="text-center text-gray-400 py-8">Carregando...</td></tr>
              </tbody>
            </table>
          </div>
        </div>
        
        {/* Progresso por Especialidade */}
        <div class="bg-gray-800 rounded-xl p-6 mb-8">
          <h2 class="text-2xl font-bold mb-4 flex items-center">
            <i class="fas fa-graduation-cap text-blue-500 mr-3"></i>
            Progresso por Especialidade
          </h2>
          <div id="specialtyProgress" class="space-y-4">
            <p class="text-gray-400 text-center py-8">Carregando...</p>
          </div>
        </div>
        
        {/* Taxas de Conclusão por Trilha */}
        <div class="bg-gray-800 rounded-xl p-6">
          <h2 class="text-2xl font-bold mb-4 flex items-center">
            <i class="fas fa-chart-pie text-green-500 mr-3"></i>
            Taxas de Conclusão por Trilha
          </h2>
          <div class="overflow-x-auto">
            <table class="w-full" id="completionRatesTable">
              <thead class="border-b border-gray-700">
                <tr>
                  <th class="text-left py-3 px-4">Trilha</th>
                  <th class="text-left py-3 px-4">Inscritos</th>
                  <th class="text-left py-3 px-4">Em Progresso</th>
                  <th class="text-left py-3 px-4">Concluídos</th>
                  <th class="text-left py-3 px-4">Taxa de Conclusão</th>
                </tr>
              </thead>
              <tbody id="completionRatesBody">
                <tr><td colspan="5" class="text-center text-gray-400 py-8">Carregando...</td></tr>
              </tbody>
            </table>
          </div>
        </div>
      </main>
      
      {Footer()}
      
      <script src="/static/admin-reports.js"></script>
    </BaseLayout>
  );
});

// ========================================
// TERMOS E CONDIÇÕES
// ========================================
app.get('/termos', (c) => {
  return c.html(
    <BaseLayout title="Termos e Condições">
      {Header({})}
      
      <main class="container mx-auto px-4 py-8 max-w-4xl">
        <h1 class="text-4xl font-bold mb-2 gradient-text">Termos e Condições de Uso</h1>
        <p class="text-gray-400 mb-8">Última atualização: {new Date().toLocaleDateString('pt-BR')}</p>
        
        <div class="space-y-8 text-gray-300">
          <section>
            <h2 class="text-2xl font-bold mb-4 text-white">1. Aceitação dos Termos</h2>
            <p class="mb-4">
              Ao acessar e usar a plataforma HardMedicina, você concorda em cumprir e estar vinculado aos seguintes termos e condições de uso. 
              Se você não concordar com qualquer parte destes termos, não deverá usar nossos serviços.
            </p>
          </section>
          
          <section>
            <h2 class="text-2xl font-bold mb-4 text-white">2. Descrição do Serviço</h2>
            <p class="mb-4">
              A HardMedicina é uma plataforma educacional online que oferece trilhas de aprendizado médico, incluindo vídeo-aulas, 
              materiais de apoio e casos clínicos. Nosso conteúdo é destinado a estudantes de medicina, médicos residentes e 
              profissionais da área de saúde.
            </p>
            <p class="mb-4">
              <strong>Importante:</strong> O conteúdo fornecido não substitui aconselhamento médico profissional, diagnóstico ou tratamento. 
              Sempre busque orientação de profissionais qualificados para questões médicas específicas.
            </p>
          </section>
          
          <section>
            <h2 class="text-2xl font-bold mb-4 text-white">3. Cadastro e Conta de Usuário</h2>
            <ul class="list-disc list-inside space-y-2 mb-4">
              <li>Você deve fornecer informações verdadeiras, precisas e completas durante o registro</li>
              <li>É sua responsabilidade manter a confidencialidade de sua senha</li>
              <li>Você é responsável por todas as atividades que ocorrem sob sua conta</li>
              <li>Notifique-nos imediatamente sobre qualquer uso não autorizado de sua conta</li>
              <li>Reservamo-nos o direito de suspender ou encerrar contas que violem estes termos</li>
            </ul>
          </section>
          
          <section>
            <h2 class="text-2xl font-bold mb-4 text-white">4. Uso Aceitável</h2>
            <p class="mb-4">Você concorda em NÃO:</p>
            <ul class="list-disc list-inside space-y-2 mb-4">
              <li>Usar a plataforma para qualquer propósito ilegal ou não autorizado</li>
              <li>Compartilhar sua conta com terceiros</li>
              <li>Copiar, distribuir ou modificar qualquer conteúdo da plataforma sem autorização</li>
              <li>Fazer engenharia reversa ou tentar acessar o código-fonte da plataforma</li>
              <li>Interferir ou interromper o funcionamento da plataforma</li>
              <li>Usar bots, scrapers ou outras ferramentas automatizadas</li>
            </ul>
          </section>
          
          <section>
            <h2 class="text-2xl font-bold mb-4 text-white">5. Propriedade Intelectual</h2>
            <p class="mb-4">
              Todo o conteúdo disponível na HardMedicina, incluindo textos, vídeos, imagens, logos e materiais de apoio, 
              é protegido por direitos autorais e outras leis de propriedade intelectual. O conteúdo é de propriedade da 
              HardMedicina ou de seus licenciadores.
            </p>
            <p class="mb-4">
              É concedida a você uma licença limitada, não exclusiva e intransferível para acessar e usar o conteúdo 
              exclusivamente para fins de aprendizado pessoal e não comercial.
            </p>
          </section>
          
          <section>
            <h2 class="text-2xl font-bold mb-4 text-white">6. Conteúdo do Usuário</h2>
            <p class="mb-4">
              Se você enviar comentários, perguntas ou qualquer outro conteúdo para a plataforma, você concede à HardMedicina 
              uma licença mundial, não exclusiva, livre de royalties para usar, reproduzir e distribuir esse conteúdo.
            </p>
          </section>
          
          <section>
            <h2 class="text-2xl font-bold mb-4 text-white">7. Limitação de Responsabilidade</h2>
            <p class="mb-4">
              A HardMedicina e seus afiliados não serão responsáveis por quaisquer danos diretos, indiretos, incidentais, 
              especiais ou consequenciais resultantes do uso ou incapacidade de usar nossos serviços.
            </p>
            <p class="mb-4">
              Não garantimos que o serviço estará disponível ininterruptamente ou livre de erros. 
              Você usa a plataforma por sua conta e risco.
            </p>
          </section>
          
          <section>
            <h2 class="text-2xl font-bold mb-4 text-white">8. Modificações dos Termos</h2>
            <p class="mb-4">
              Reservamo-nos o direito de modificar estes termos a qualquer momento. Notificaremos os usuários sobre 
              mudanças significativas através da plataforma ou por e-mail. O uso continuado da plataforma após as 
              modificações constitui aceitação dos novos termos.
            </p>
          </section>
          
          <section>
            <h2 class="text-2xl font-bold mb-4 text-white">9. Rescisão</h2>
            <p class="mb-4">
              Podemos suspender ou encerrar seu acesso à plataforma imediatamente, sem aviso prévio, por qualquer motivo, 
              incluindo violação destes termos. Você pode encerrar sua conta a qualquer momento entrando em contato conosco.
            </p>
          </section>
          
          <section>
            <h2 class="text-2xl font-bold mb-4 text-white">10. Lei Aplicável</h2>
            <p class="mb-4">
              Estes termos serão regidos e interpretados de acordo com as leis do Brasil. Qualquer disputa será 
              resolvida nos tribunais competentes do Brasil.
            </p>
          </section>
          
          <section>
            <h2 class="text-2xl font-bold mb-4 text-white">11. Contato</h2>
            <p class="mb-4">
              Se você tiver dúvidas sobre estes Termos e Condições, entre em contato conosco através da página de contato 
              ou pelo e-mail: contato@hardmedicina.com
            </p>
          </section>
        </div>
        
        <div class="mt-12 p-6 bg-gray-800 rounded-lg border border-gray-700">
          <p class="text-center text-gray-300">
            Ao usar a HardMedicina, você reconhece que leu, compreendeu e concordou em estar vinculado a estes Termos e Condições.
          </p>
        </div>
      </main>
      
      {Footer()}
    </BaseLayout>
  );
});

// ========================================
// POLÍTICA DE PRIVACIDADE
// ========================================
app.get('/privacidade', (c) => {
  return c.html(
    <BaseLayout title="Política de Privacidade">
      {Header({})}
      
      <main class="container mx-auto px-4 py-8 max-w-4xl">
        <h1 class="text-4xl font-bold mb-2 gradient-text">Política de Privacidade</h1>
        <p class="text-gray-400 mb-8">Última atualização: {new Date().toLocaleDateString('pt-BR')}</p>
        
        <div class="space-y-8 text-gray-300">
          <section>
            <h2 class="text-2xl font-bold mb-4 text-white">1. Introdução</h2>
            <p class="mb-4">
              A HardMedicina ("nós", "nosso" ou "plataforma") está comprometida em proteger sua privacidade. 
              Esta Política de Privacidade explica como coletamos, usamos, divulgamos e protegemos suas informações 
              quando você usa nossos serviços.
            </p>
            <p class="mb-4">
              Esta política está em conformidade com a Lei Geral de Proteção de Dados (LGPD - Lei nº 13.709/2018) 
              e outras legislações aplicáveis de proteção de dados.
            </p>
          </section>
          
          <section>
            <h2 class="text-2xl font-bold mb-4 text-white">2. Informações que Coletamos</h2>
            
            <h3 class="text-xl font-semibold mb-3 text-purple-400">2.1 Informações Fornecidas por Você</h3>
            <ul class="list-disc list-inside space-y-2 mb-4">
              <li><strong>Dados de Cadastro:</strong> Nome, e-mail, senha (criptografada)</li>
              <li><strong>Dados de Perfil:</strong> Foto de perfil (opcional), informações acadêmicas</li>
              <li><strong>Comunicações:</strong> Mensagens enviadas através de formulários de contato ou suporte</li>
            </ul>
            
            <h3 class="text-xl font-semibold mb-3 text-purple-400">2.2 Informações Coletadas Automaticamente</h3>
            <ul class="list-disc list-inside space-y-2 mb-4">
              <li><strong>Dados de Uso:</strong> Aulas assistidas, progresso em trilhas, tempo de visualização</li>
              <li><strong>Dados Técnicos:</strong> Endereço IP, tipo de navegador, sistema operacional</li>
              <li><strong>Cookies:</strong> Utilizamos cookies para manter sua sessão ativa e melhorar a experiência</li>
            </ul>
          </section>
          
          <section>
            <h2 class="text-2xl font-bold mb-4 text-white">3. Como Usamos Suas Informações</h2>
            <p class="mb-4">Utilizamos suas informações para:</p>
            <ul class="list-disc list-inside space-y-2 mb-4">
              <li>Fornecer, operar e manter nossa plataforma educacional</li>
              <li>Gerenciar sua conta e autenticar seu acesso</li>
              <li>Personalizar sua experiência de aprendizado</li>
              <li>Acompanhar seu progresso nas trilhas e aulas</li>
              <li>Enviar notificações importantes sobre o serviço</li>
              <li>Responder a suas dúvidas e solicitações de suporte</li>
              <li>Analisar o uso da plataforma para melhorias</li>
              <li>Detectar e prevenir fraudes e abusos</li>
              <li>Cumprir obrigações legais</li>
            </ul>
          </section>
          
          <section>
            <h2 class="text-2xl font-bold mb-4 text-white">4. Compartilhamento de Informações</h2>
            <p class="mb-4">
              Não vendemos suas informações pessoais. Podemos compartilhar suas informações apenas nas seguintes situações:
            </p>
            <ul class="list-disc list-inside space-y-2 mb-4">
              <li><strong>Provedores de Serviço:</strong> Com empresas que nos ajudam a operar a plataforma (ex: hospedagem)</li>
              <li><strong>Exigências Legais:</strong> Quando exigido por lei ou para proteger nossos direitos legais</li>
              <li><strong>Transferência de Negócios:</strong> Em caso de fusão, venda ou transferência de ativos</li>
              <li><strong>Com Seu Consentimento:</strong> Quando você autorizar explicitamente</li>
            </ul>
          </section>
          
          <section>
            <h2 class="text-2xl font-bold mb-4 text-white">5. Segurança dos Dados</h2>
            <p class="mb-4">
              Implementamos medidas de segurança técnicas e organizacionais para proteger suas informações:
            </p>
            <ul class="list-disc list-inside space-y-2 mb-4">
              <li>Criptografia de senhas usando algoritmos seguros (bcrypt)</li>
              <li>Comunicação segura via HTTPS/TLS</li>
              <li>Controles de acesso rigorosos aos dados</li>
              <li>Monitoramento regular de vulnerabilidades</li>
              <li>Backups regulares dos dados</li>
            </ul>
            <p class="mb-4">
              No entanto, nenhum método de transmissão pela internet é 100% seguro. 
              Não podemos garantir a segurança absoluta de suas informações.
            </p>
          </section>
          
          <section>
            <h2 class="text-2xl font-bold mb-4 text-white">6. Retenção de Dados</h2>
            <p class="mb-4">
              Manteremos suas informações pessoais apenas pelo tempo necessário para cumprir os propósitos descritos 
              nesta política, a menos que um período de retenção mais longo seja exigido ou permitido por lei.
            </p>
            <p class="mb-4">
              Quando você solicitar a exclusão de sua conta, removeremos suas informações pessoais de nossos 
              sistemas ativos, mas algumas informações podem ser retidas para fins legais ou de auditoria.
            </p>
          </section>
          
          <section>
            <h2 class="text-2xl font-bold mb-4 text-white">7. Seus Direitos (LGPD)</h2>
            <p class="mb-4">De acordo com a LGPD, você tem os seguintes direitos:</p>
            <ul class="list-disc list-inside space-y-2 mb-4">
              <li><strong>Acesso:</strong> Solicitar uma cópia de seus dados pessoais</li>
              <li><strong>Correção:</strong> Corrigir dados incompletos, inexatos ou desatualizados</li>
              <li><strong>Exclusão:</strong> Solicitar a exclusão de seus dados pessoais</li>
              <li><strong>Portabilidade:</strong> Solicitar a transferência de seus dados para outro provedor</li>
              <li><strong>Revogação:</strong> Revogar o consentimento para o tratamento de dados</li>
              <li><strong>Oposição:</strong> Opor-se ao tratamento de seus dados em certas circunstâncias</li>
              <li><strong>Informação:</strong> Obter informações sobre o uso compartilhado de dados</li>
            </ul>
            <p class="mb-4">
              Para exercer qualquer destes direitos, entre em contato conosco através de: privacidade@hardmedicina.com
            </p>
          </section>
          
          <section>
            <h2 class="text-2xl font-bold mb-4 text-white">8. Cookies e Tecnologias Similares</h2>
            <p class="mb-4">
              Utilizamos cookies e tecnologias similares para melhorar sua experiência na plataforma:
            </p>
            <ul class="list-disc list-inside space-y-2 mb-4">
              <li><strong>Cookies Essenciais:</strong> Necessários para o funcionamento básico (ex: autenticação)</li>
              <li><strong>Cookies de Preferência:</strong> Armazenam suas configurações e preferências</li>
              <li><strong>Cookies Analíticos:</strong> Nos ajudam a entender como você usa a plataforma</li>
            </ul>
            <p class="mb-4">
              Você pode configurar seu navegador para recusar cookies, mas isso pode afetar algumas funcionalidades da plataforma.
            </p>
          </section>
          
          <section>
            <h2 class="text-2xl font-bold mb-4 text-white">9. Privacidade de Menores</h2>
            <p class="mb-4">
              Nossa plataforma é destinada a estudantes de medicina e profissionais de saúde. 
              Não coletamos intencionalmente informações de menores de 16 anos sem o consentimento dos pais ou responsáveis. 
              Se você acredita que coletamos inadvertidamente informações de um menor, entre em contato conosco imediatamente.
            </p>
          </section>
          
          <section>
            <h2 class="text-2xl font-bold mb-4 text-white">10. Alterações nesta Política</h2>
            <p class="mb-4">
              Podemos atualizar esta Política de Privacidade periodicamente. Notificaremos você sobre mudanças significativas 
              através da plataforma ou por e-mail. A data da "Última atualização" no topo desta página indica quando a 
              política foi revisada pela última vez.
            </p>
          </section>
          
          <section>
            <h2 class="text-2xl font-bold mb-4 text-white">11. Contato</h2>
            <p class="mb-4">
              Se você tiver dúvidas sobre esta Política de Privacidade ou sobre como tratamos seus dados, entre em contato:
            </p>
            <ul class="list-none space-y-2 mb-4">
              <li><strong>E-mail:</strong> privacidade@hardmedicina.com</li>
              <li><strong>Encarregado de Dados (DPO):</strong> dpo@hardmedicina.com</li>
            </ul>
          </section>
        </div>
        
        <div class="mt-12 p-6 bg-gray-800 rounded-lg border border-gray-700">
          <p class="text-center text-gray-300">
            Ao usar a HardMedicina, você reconhece que leu e compreendeu esta Política de Privacidade e concorda com o tratamento de seus dados conforme descrito.
          </p>
        </div>
      </main>
      
      {Footer()}
    </BaseLayout>
  );
});
app.get('/ajuda', (c) => c.html(<BaseLayout title="Central de Ajuda">{Header({})}<main class="container mx-auto px-4 py-8"><h1 class="text-4xl font-bold mb-4">Central de Ajuda</h1><p class="text-gray-400">Página em desenvolvimento.</p></main>{Footer()}</BaseLayout>));
app.get('/contato', (c) => c.html(<BaseLayout title="Contato">{Header({})}<main class="container mx-auto px-4 py-8"><h1 class="text-4xl font-bold mb-4">Contato</h1><p class="text-gray-400">Página em desenvolvimento.</p></main>{Footer()}</BaseLayout>));

// ========================================
// API ROUTES
// ========================================
import apiRoutes from './api-routes';
app.route('/api', apiRoutes);

export default app;
