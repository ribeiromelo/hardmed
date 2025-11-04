import { html } from 'hono/html';

interface BaseLayoutProps {
  title: string;
  children: any;
  user?: { id: number; name: string; role: string };
}

export const BaseLayout = ({ title, children, user }: BaseLayoutProps) => html`
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title} | HardMedicina</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');
        
        * {
            font-family: 'Inter', sans-serif;
        }
        
        .gradient-bg {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        }
        
        .gradient-text {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
        }
        
        .card-hover {
            transition: all 0.3s ease;
        }
        
        .card-hover:hover {
            transform: translateY(-8px);
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
        }
        
        .neon-glow {
            box-shadow: 0 0 20px rgba(102, 126, 234, 0.5);
        }
        
        .hero-animated {
            background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
            animation: gradient 15s ease infinite;
            background-size: 400% 400%;
        }
        
        @keyframes gradient {
            0% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
            100% { background-position: 0% 50%; }
        }
        
        .scrollbar-hidden::-webkit-scrollbar {
            display: none;
        }
        
        .scrollbar-hidden {
            -ms-overflow-style: none;
            scrollbar-width: none;
        }
        
        /* Custom scrollbar for sidebar */
        .custom-scrollbar::-webkit-scrollbar {
            width: 6px;
        }
        
        .custom-scrollbar::-webkit-scrollbar-track {
            background: #1f2937;
            border-radius: 10px;
        }
        
        .custom-scrollbar::-webkit-scrollbar-thumb {
            background: #4b5563;
            border-radius: 10px;
        }
        
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
            background: #6b7280;
        }
    </style>
</head>
<body class="bg-gray-900 text-white">
    ${children}
    
    <!-- Native Fetch API helper (NO AXIOS DEPENDENCY) -->
    <script src="/static/api.js"></script>
    <script src="/static/auth.js"></script>
    <script src="/static/modal-utils.js"></script>
    ${user ? html`<script src="/static/notifications.js"></script>` : ''}
</body>
</html>
`;

interface HeaderProps {
  user?: { id: number; name: string; role: string };
  showSearch?: boolean;
}

export const Header = ({ user, showSearch = false }: HeaderProps) => html`
<header class="bg-gray-800 border-b border-gray-700 sticky top-0 z-50">
    <div class="container mx-auto px-4 py-4">
        <div class="flex items-center justify-between">
            <div class="flex items-center space-x-8">
                <a href="${user ? '/dashboard' : '/'}" class="flex items-center space-x-2">
                    <i class="fas fa-graduation-cap text-2xl gradient-text"></i>
                    <span class="text-xl font-bold">HardMedicina</span>
                </a>
                
                ${user ? html`
                <nav class="hidden md:flex space-x-6">
                    <a href="/dashboard" class="hover:text-purple-400 transition">Dashboard</a>
                    <a href="/trilhas" class="hover:text-purple-400 transition">Trilhas</a>
                    ${user.role === 'admin' ? html`
                        <a href="/admin" class="hover:text-purple-400 transition">Admin</a>
                    ` : ''}
                </nav>
                ` : html`
                <nav class="hidden md:flex space-x-6">
                    <a href="/#cardiologia" class="hover:text-purple-400 transition">Cardiologia</a>
                    <a href="/#nefrologia" class="hover:text-purple-400 transition">Nefrologia</a>
                    <a href="/#clinica" class="hover:text-purple-400 transition">Clínica</a>
                    <a href="/#cirurgia" class="hover:text-purple-400 transition">Cirurgia</a>
                </nav>
                `}
            </div>
            
            ${showSearch ? html`
            <div class="flex-1 max-w-2xl mx-8">
                <div class="relative">
                    <input 
                        type="text" 
                        placeholder="Buscar aulas, trilhas..."
                        class="w-full bg-gray-700 text-white px-4 py-2 pl-10 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                    <i class="fas fa-search absolute left-3 top-3 text-gray-400"></i>
                </div>
            </div>
            ` : ''}
            
            <div class="flex items-center space-x-4">
                ${user ? html`
                    <div class="relative">
                        <button id="notificationsButton" onclick="toggleNotifications()" class="relative hover:text-purple-400 transition">
                            <i class="fas fa-bell text-xl"></i>
                            <span id="notificationBadge" class="hidden absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">0</span>
                        </button>
                        
                        <div id="notificationsDropdown" class="hidden absolute right-0 mt-2 w-96 bg-gray-800 rounded-lg shadow-xl border border-gray-700 z-50 max-h-[500px] flex flex-col">
                            <div class="p-4 border-b border-gray-700 flex items-center justify-between">
                                <h3 class="font-bold">Notificações</h3>
                                <button onclick="markAllAsRead()" class="text-xs text-purple-400 hover:text-purple-300">
                                    Marcar todas como lidas
                                </button>
                            </div>
                            <div id="notificationsList" class="overflow-y-auto flex-1 custom-scrollbar">
                                <div class="text-center py-8 text-gray-400">
                                    <i class="fas fa-spinner fa-spin text-2xl mb-2"></i>
                                    <p>Carregando...</p>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="relative">
                        <button id="userMenuButton" onclick="toggleUserMenu()" class="flex items-center space-x-2 hover:text-purple-400 transition p-2 rounded-lg hover:bg-gray-700/50">
                            <img src="${user.avatar_url || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(user.name)}" 
                                 alt="${user.name}" 
                                 class="w-8 h-8 rounded-full"
                            />
                            <span class="hidden md:inline">${user.name}</span>
                            <i id="userMenuChevron" class="fas fa-chevron-down text-sm transition-transform"></i>
                        </button>
                        
                        <div id="userMenuDropdown" class="hidden absolute right-0 mt-2 w-56 bg-gray-800 rounded-lg shadow-xl py-2 border border-gray-700 z-50">
                            <div class="px-4 py-3 border-b border-gray-700">
                                <p class="text-sm font-semibold">${user.name}</p>
                                <p class="text-xs text-gray-400 truncate">${user.email}</p>
                            </div>
                            <a href="/perfil" class="flex items-center px-4 py-3 hover:bg-gray-700 transition">
                                <i class="fas fa-user w-5 mr-3 text-purple-400"></i> 
                                <span>Meu Perfil</span>
                            </a>
                            <a href="/favoritos" class="flex items-center px-4 py-3 hover:bg-gray-700 transition">
                                <i class="fas fa-heart w-5 mr-3 text-pink-400"></i> 
                                <span>Favoritos</span>
                            </a>
                            ${user.role === 'admin' ? html`
                            <a href="/admin" class="flex items-center px-4 py-3 hover:bg-gray-700 transition">
                                <i class="fas fa-cog w-5 mr-3 text-yellow-400"></i> 
                                <span>Painel de Controle</span>
                            </a>
                            ` : ''}
                            <hr class="my-2 border-gray-700" />
                            <button onclick="logout()" class="flex items-center w-full text-left px-4 py-3 hover:bg-gray-700 transition text-red-400">
                                <i class="fas fa-sign-out-alt w-5 mr-3"></i> 
                                <span>Sair</span>
                            </button>
                        </div>
                    </div>
                ` : html`
                    <a href="/login" class="hover:text-purple-400 transition">Entrar</a>
                    <a href="/cadastro" class="bg-gradient-to-r from-purple-600 to-pink-600 px-6 py-2 rounded-lg hover:from-purple-700 hover:to-pink-700 transition font-semibold">
                        Começar
                    </a>
                `}
            </div>
        </div>
    </div>
</header>

${user ? html`
<script>
    // Logout function
    function logout() {
        document.cookie = 'auth_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC';
        localStorage.removeItem('auth_token');
        window.location.href = '/login';
    }
    
    // User menu dropdown
    window.toggleUserMenu = function() {
        const dropdown = document.getElementById('userMenuDropdown');
        const chevron = document.getElementById('userMenuChevron');
        const isHidden = dropdown.classList.contains('hidden');
        
        if (isHidden) {
            dropdown.classList.remove('hidden');
            chevron.classList.add('rotate-180');
            
            // Add backdrop click listener
            setTimeout(() => {
                document.addEventListener('click', closeUserMenuOnClickOutside);
            }, 100);
        } else {
            dropdown.classList.add('hidden');
            chevron.classList.remove('rotate-180');
            document.removeEventListener('click', closeUserMenuOnClickOutside);
        }
    }
    
    function closeUserMenuOnClickOutside(event) {
        const dropdown = document.getElementById('userMenuDropdown');
        const button = document.getElementById('userMenuButton');
        
        if (!dropdown.contains(event.target) && !button.contains(event.target)) {
            dropdown.classList.add('hidden');
            document.getElementById('userMenuChevron').classList.remove('rotate-180');
            document.removeEventListener('click', closeUserMenuOnClickOutside);
        }
    }
</script>
` : ''}
`;

export const Footer = () => html`
<footer class="bg-gray-800 border-t border-gray-700 mt-20">
    <div class="container mx-auto px-4 py-8">
        <div class="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
                <div class="flex items-center space-x-2 mb-4">
                    <i class="fas fa-graduation-cap text-2xl gradient-text"></i>
                    <span class="text-xl font-bold">HardMedicina</span>
                </div>
                <p class="text-gray-400 text-sm">
                    Plataforma educacional médica com trilhas organizadas por especialidade.
                </p>
            </div>
            
            <div>
                <h3 class="font-bold mb-4">Especialidades</h3>
                <ul class="space-y-2 text-sm text-gray-400">
                    <li><a href="/#cardiologia" class="hover:text-purple-400 transition">Cardiologia</a></li>
                    <li><a href="/#nefrologia" class="hover:text-purple-400 transition">Nefrologia</a></li>
                    <li><a href="/#clinica" class="hover:text-purple-400 transition">Clínica Médica</a></li>
                    <li><a href="/#cirurgia" class="hover:text-purple-400 transition">Cirurgia</a></li>
                </ul>
            </div>
            
            <div>
                <h3 class="font-bold mb-4">Suporte</h3>
                <ul class="space-y-2 text-sm text-gray-400">
                    <li><a href="/ajuda" class="hover:text-purple-400 transition">Central de Ajuda</a></li>
                    <li><a href="/contato" class="hover:text-purple-400 transition">Contato</a></li>
                    <li><a href="/termos" class="hover:text-purple-400 transition">Termos de Uso</a></li>
                    <li><a href="/privacidade" class="hover:text-purple-400 transition">Privacidade</a></li>
                </ul>
            </div>
            
            <div>
                <h3 class="font-bold mb-4">Redes Sociais</h3>
                <div class="flex space-x-4">
                    <a href="#" class="text-2xl hover:text-purple-400 transition"><i class="fab fa-instagram"></i></a>
                    <a href="#" class="text-2xl hover:text-purple-400 transition"><i class="fab fa-youtube"></i></a>
                    <a href="#" class="text-2xl hover:text-purple-400 transition"><i class="fab fa-telegram"></i></a>
                </div>
            </div>
        </div>
        
        <div class="border-t border-gray-700 mt-8 pt-8 text-center text-gray-400 text-sm">
            <p>&copy; 2025 HardMedicina. Todos os direitos reservados.</p>
        </div>
    </div>
</footer>
`;
