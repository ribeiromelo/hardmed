import { html } from 'hono/html';

interface BaseLayoutProps {
  title: string;
  children: any;
  user?: { id: number; name: string; role: string; avatar_url?: string };
}

export const BaseLayout = ({ title, children, user }: BaseLayoutProps) => html`
<!DOCTYPE html>
<html lang="pt-BR" data-theme="dark">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title} | HardMedicina</title>
    
    <!-- Fonts & Icons -->
    <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" rel="stylesheet">
    
    <!-- Tailwind (Utility only) -->
    <script src="https://cdn.tailwindcss.com"></script>
    
    <!-- Custom Design System -->
    <link href="/static/styles.css" rel="stylesheet">
    
    <script>
        // Prevent FOUC (Flash of Unstyled Content)
        const savedTheme = localStorage.getItem('theme') || 'dark';
        document.documentElement.setAttribute('data-theme', savedTheme);
    </script>
</head>
<body class="bg-theme-primary text-theme-primary flex flex-col min-h-screen">
    ${children}
    
    <!-- Scripts -->
    <script src="/static/api.js"></script>
    <script src="/static/auth.js"></script>
    <script src="/static/modal-utils.js"></script>
    ${user ? html`<script src="/static/notifications.js"></script>` : ''}
    
    <script>
        // Global Theme Toggle Logic
        function toggleTheme() {
            const html = document.documentElement;
            const current = html.getAttribute('data-theme');
            const next = current === 'dark' ? 'light' : 'dark';
            
            html.setAttribute('data-theme', next);
            localStorage.setItem('theme', next);
            
            updateThemeIcon(next);
        }
        
        function updateThemeIcon(theme) {
            const icon = document.getElementById('themeIcon');
            if (icon) {
                icon.className = theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
            }
        }
        
        // Initialize Icon
        document.addEventListener('DOMContentLoaded', () => {
            updateThemeIcon(localStorage.getItem('theme') || 'dark');
        });

        // Mobile Menu Logic
        function toggleMobileMenu() {
            const menu = document.getElementById('mobileMenu');
            menu.classList.toggle('hidden');
        }
    </script>
</body>
</html>
`;

interface HeaderProps {
  user?: { id: number; name: string; role: string; avatar_url?: string };
  showSearch?: boolean;
}

export const Header = ({ user, showSearch = false }: HeaderProps) => html`
<header class="bg-theme-secondary border-b border-theme sticky top-0 z-50 backdrop-blur-md bg-opacity-90">
    <div class="container mx-auto px-4 py-3">
        <div class="flex items-center justify-between">
            
            <!-- Logo area -->
            <div class="flex items-center space-x-6">
                <a href="${user ? '/dashboard' : '/'}" class="flex items-center space-x-2 group">
                    <div class="w-9 h-9 bg-indigo-600 rounded flex items-center justify-center text-white shadow-sm transition-transform group-hover:scale-105">
                        <i class="fas fa-graduation-cap text-lg"></i>
                    </div>
                    <span class="text-xl font-bold tracking-tight hidden sm:block">
                        Hard<span class="text-indigo-500">Medicina</span>
                    </span>
                </a>
                
                <!-- Desktop Nav -->
                ${user ? html`
                <nav class="hidden md:flex space-x-1">
                    <a href="/dashboard" class="px-4 py-2 rounded-lg hover:bg-theme-tertiary transition text-sm font-medium">Dashboard</a>
                    <a href="/trilhas" class="px-4 py-2 rounded-lg hover:bg-theme-tertiary transition text-sm font-medium">Trilhas</a>
                    ${user.role === 'admin' ? html`
                        <a href="/admin" class="px-3 py-2 rounded-md hover:bg-theme-tertiary transition text-sm font-medium text-indigo-500">Admin</a>
                    ` : ''}
                </nav>
                ` : html`
                <nav class="hidden md:flex space-x-1">
                    <a href="/#cardiologia" class="px-3 py-2 rounded-lg hover:bg-theme-tertiary transition text-sm">Cardiologia</a>
                    <a href="/#nefrologia" class="px-3 py-2 rounded-lg hover:bg-theme-tertiary transition text-sm">Nefrologia</a>
                    <a href="/#clinica" class="px-3 py-2 rounded-lg hover:bg-theme-tertiary transition text-sm">Clínica</a>
                </nav>
                `}
            </div>
            
            <!-- Actions Area -->
            <div class="flex items-center space-x-3 md:space-x-4">
                
                <!-- Search (Desktop) -->
                ${showSearch ? html`
                <div class="hidden md:block relative w-64">
                    <input 
                        type="text" 
                        placeholder="Buscar..."
                        class="input-field py-2 pl-9 text-sm rounded-full"
                    />
                    <i class="fas fa-search absolute left-3 top-2.5 text-text-tertiary text-xs"></i>
                </div>
                ` : ''}

                <!-- Theme Toggle -->
                <button onclick="toggleTheme()" class="w-9 h-9 rounded-full bg-theme-tertiary flex items-center justify-center hover:bg-gray-200 dark:hover:bg-gray-700 transition text-text-secondary">
                    <i id="themeIcon" class="fas fa-sun"></i>
                </button>
                
                ${user ? html`
                    <!-- Notifications -->
                    <div class="relative">
                        <button id="notificationsButton" onclick="toggleNotifications()" class="w-9 h-9 rounded-full bg-theme-tertiary flex items-center justify-center hover:bg-gray-200 dark:hover:bg-gray-700 transition relative">
                            <i class="fas fa-bell"></i>
                            <span id="notificationBadge" class="hidden absolute top-0 right-0 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full shadow-sm border-2 border-theme">0</span>
                        </button>
                        
                        <!-- Dropdown -->
                        <div id="notificationsDropdown" class="hidden absolute right-0 mt-3 w-80 md:w-96 card z-50 max-h-[500px] flex flex-col shadow-xl animate-in slide-in-from-top-2">
                            <div class="p-4 border-b border-theme flex items-center justify-between bg-theme-secondary rounded-t-xl">
                                <h3 class="font-bold text-sm">Notificações</h3>
                                <button onclick="markAllAsRead()" class="text-xs text-purple-500 hover:text-purple-600 font-medium">
                                    Marcar todas como lidas
                                </button>
                            </div>
                            <div id="notificationsList" class="overflow-y-auto flex-1 custom-scrollbar max-h-96">
                                <div class="text-center py-12 text-text-tertiary">
                                    <i class="fas fa-spinner fa-spin text-2xl mb-2"></i>
                                    <p class="text-sm">Carregando...</p>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- User Menu -->
                    <div class="relative">
                        <button id="userMenuButton" onclick="toggleUserMenu()" class="flex items-center space-x-2 pl-2 hover:opacity-80 transition">
                            <img src="${user.avatar_url || 'https://ui-avatars.com/api/?background=7c3aed&color=fff&name=' + encodeURIComponent(user.name)}" 
                                 alt="${user.name}" 
                                 class="w-9 h-9 rounded-full border-2 border-theme shadow-sm"
                            />
                        </button>
                        
                        <div id="userMenuDropdown" class="hidden absolute right-0 mt-3 w-56 card shadow-xl py-2 z-50 animate-in slide-in-from-top-2">
                            <div class="px-4 py-3 border-b border-theme bg-theme-tertiary/30">
                                <p class="text-sm font-semibold truncate">${user.name}</p>
                                <p class="text-xs text-text-tertiary truncate">${user.role === 'admin' ? 'Administrador' : 'Estudante'}</p>
                            </div>
                            
                            <div class="p-1">
                                <a href="/perfil" class="flex items-center px-3 py-2 rounded-md hover:bg-theme-tertiary transition text-sm">
                                    <i class="fas fa-user w-6 text-center text-text-secondary"></i> 
                                    <span>Meu Perfil</span>
                                </a>
                                
                                ${user.role === 'admin' ? html`
                                <a href="/admin" class="flex items-center px-3 py-2 rounded-md hover:bg-theme-tertiary transition text-sm">
                                    <i class="fas fa-gauge-high w-6 text-center text-text-secondary"></i> 
                                    <span>Painel Admin</span>
                                </a>
                                ` : ''}
                            </div>
                            
                            <div class="border-t border-theme my-1"></div>
                            
                            <div class="p-1">
                                <button onclick="logout()" class="flex w-full items-center px-3 py-2 rounded-md hover:bg-red-500/10 hover:text-red-500 transition text-sm text-text-secondary">
                                    <i class="fas fa-sign-out-alt w-6 text-center"></i> 
                                    <span>Sair</span>
                                </button>
                            </div>
                        </div>
                    </div>
                ` : html`
                    <div class="hidden md:flex items-center space-x-3">
                        <a href="/login" class="px-4 py-2 text-sm font-medium hover:text-purple-500 transition">Entrar</a>
                        <a href="/cadastro" class="btn btn-primary text-sm py-2 px-5">
                            Começar
                        </a>
                    </div>
                `}

                <!-- Mobile Menu Button -->
                <button onclick="toggleMobileMenu()" class="md:hidden w-9 h-9 flex items-center justify-center rounded-lg hover:bg-theme-tertiary transition">
                    <i class="fas fa-bars text-lg"></i>
                </button>
            </div>
        </div>
    </div>

    <!-- Mobile Menu Overlay -->
    <div id="mobileMenu" class="hidden md:hidden absolute top-full left-0 w-full bg-theme-secondary border-b border-theme shadow-xl animate-in slide-in-from-top-5">
        <div class="p-4 space-y-3">
            ${showSearch ? html`
            <div class="relative w-full mb-4">
                <input type="text" placeholder="Buscar..." class="input-field py-2" />
                <i class="fas fa-search absolute right-3 top-3 text-text-tertiary"></i>
            </div>
            ` : ''}

            ${user ? html`
                <a href="/dashboard" class="block px-4 py-3 rounded-lg hover:bg-theme-tertiary font-medium">
                    <i class="fas fa-home w-6 text-center mr-2 text-purple-500"></i> Dashboard
                </a>
                <a href="/trilhas" class="block px-4 py-3 rounded-lg hover:bg-theme-tertiary font-medium">
                    <i class="fas fa-layer-group w-6 text-center mr-2 text-blue-500"></i> Trilhas
                </a>
                <a href="/perfil" class="block px-4 py-3 rounded-lg hover:bg-theme-tertiary font-medium">
                    <i class="fas fa-user w-6 text-center mr-2 text-pink-500"></i> Meu Perfil
                </a>
                <button onclick="logout()" class="w-full text-left block px-4 py-3 rounded-lg hover:bg-red-500/10 text-red-500 font-medium">
                    <i class="fas fa-sign-out-alt w-6 text-center mr-2"></i> Sair da conta
                </button>
            ` : html`
                <a href="/login" class="block px-4 py-3 rounded-lg hover:bg-theme-tertiary font-medium">Entrar</a>
                <a href="/cadastro" class="block px-4 py-3 rounded-lg bg-indigo-600 text-white font-medium text-center">Criar Conta Grátis</a>
            `}
        </div>
    </div>
</header>

${user ? html`
<script>
    function logout() {
        document.cookie = 'auth_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC';
        localStorage.removeItem('auth_token');
        window.location.href = '/login';
    }
    
    // Dropdown Toggles (Generic)
    window.toggleUserMenu = function() {
        const dropdown = document.getElementById('userMenuDropdown');
        dropdown.classList.toggle('hidden');
        
        // Close others
        document.getElementById('notificationsDropdown')?.classList.add('hidden');
    }
    
    // Close on click outside
    document.addEventListener('click', (e) => {
        const menuBtn = document.getElementById('userMenuButton');
        const menuDrop = document.getElementById('userMenuDropdown');
        const notifBtn = document.getElementById('notificationsButton');
        const notifDrop = document.getElementById('notificationsDropdown');
        
        if (menuDrop && !menuDrop.classList.contains('hidden') && !menuBtn.contains(e.target) && !menuDrop.contains(e.target)) {
            menuDrop.classList.add('hidden');
        }
        
        if (notifDrop && !notifDrop.classList.contains('hidden') && !notifBtn.contains(e.target) && !notifDrop.contains(e.target)) {
            notifDrop.classList.add('hidden');
        }
    });
</script>
` : ''}
`;

export const Footer = () => html`
<footer class="bg-theme-secondary border-t border-theme mt-auto">
    <div class="container mx-auto px-4 py-12">
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
            <!-- Brand -->
            <div class="space-y-4">
                <div class="flex items-center space-x-2">
                    <div class="w-8 h-8 bg-indigo-600 rounded flex items-center justify-center text-white">
                        <i class="fas fa-graduation-cap text-sm"></i>
                    </div>
                    <span class="text-xl font-bold tracking-tight">HardMedicina</span>
                </div>
                <p class="text-text-secondary text-sm leading-relaxed">
                    A plataforma definitiva para estudantes de medicina. Aprenda com casos clínicos reais e trilhas estruturadas.
                </p>
                <div class="flex space-x-4 pt-2">
                    <a href="#" class="w-8 h-8 rounded-full bg-theme-tertiary flex items-center justify-center text-text-secondary hover:bg-purple-500 hover:text-white transition">
                        <i class="fab fa-instagram"></i>
                    </a>
                    <a href="#" class="w-8 h-8 rounded-full bg-theme-tertiary flex items-center justify-center text-text-secondary hover:bg-red-500 hover:text-white transition">
                        <i class="fab fa-youtube"></i>
                    </a>
                    <a href="#" class="w-8 h-8 rounded-full bg-theme-tertiary flex items-center justify-center text-text-secondary hover:bg-blue-500 hover:text-white transition">
                        <i class="fab fa-linkedin-in"></i>
                    </a>
                </div>
            </div>
            
            <!-- Links -->
            <div>
                <h4 class="font-bold mb-6 text-text-primary">Plataforma</h4>
                <ul class="space-y-3 text-sm text-text-secondary">
                    <li><a href="/trilhas" class="hover:text-purple-500 transition flex items-center"><i class="fas fa-chevron-right text-xs mr-2 opacity-50"></i> Trilhas</a></li>
                    <li><a href="/aulas" class="hover:text-purple-500 transition flex items-center"><i class="fas fa-chevron-right text-xs mr-2 opacity-50"></i> Aulas</a></li>
                    <li><a href="/precos" class="hover:text-purple-500 transition flex items-center"><i class="fas fa-chevron-right text-xs mr-2 opacity-50"></i> Planos</a></li>
                </ul>
            </div>
            
            <div>
                <h4 class="font-bold mb-6 text-text-primary">Legal</h4>
                <ul class="space-y-3 text-sm text-text-secondary">
                    <li><a href="/termos" class="hover:text-purple-500 transition">Termos de Uso</a></li>
                    <li><a href="/privacidade" class="hover:text-purple-500 transition">Política de Privacidade</a></li>
                    <li><a href="/cookies" class="hover:text-purple-500 transition">Cookies</a></li>
                </ul>
            </div>
            
            <!-- Newsletter -->
            <div>
                <h4 class="font-bold mb-6 text-text-primary">Novidades</h4>
                <p class="text-sm text-text-secondary mb-4">Receba casos clínicos semanais no seu e-mail.</p>
                <form class="space-y-2">
                    <input type="email" placeholder="seu@email.com" class="input-field py-2 text-sm" />
                    <button class="btn btn-primary w-full py-2 text-sm">Inscrever-se</button>
                </form>
            </div>
        </div>
        
        <div class="border-t border-theme mt-12 pt-8 flex flex-col md:flex-row justify-between items-center text-sm text-text-tertiary">
            <p>&copy; 2025 HardMedicina Ltda.</p>
            <p class="mt-2 md:mt-0 flex items-center">
                Feito com <i class="fas fa-heart text-red-500 mx-1"></i> para médicos.
            </p>
        </div>
    </div>
</footer>
`;
