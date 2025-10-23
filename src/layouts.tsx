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
    </style>
</head>
<body class="bg-gray-900 text-white">
    ${children}
    
    <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
    <script>
        // Global axios config
        axios.defaults.baseURL = '/api';
        
        // Add auth token to all requests
        const token = localStorage.getItem('auth_token');
        if (token) {
            axios.defaults.headers.common['Authorization'] = 'Bearer ' + token;
        }
        
        // Handle auth errors globally
        axios.interceptors.response.use(
            response => response,
            error => {
                if (error.response?.status === 401) {
                    localStorage.removeItem('auth_token');
                    window.location.href = '/login';
                }
                return Promise.reject(error);
            }
        );
    </script>
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
                    <button class="relative hover:text-purple-400 transition">
                        <i class="fas fa-bell text-xl"></i>
                        <span class="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">3</span>
                    </button>
                    
                    <div class="relative group">
                        <button class="flex items-center space-x-2 hover:text-purple-400 transition">
                            <img src="${user.avatar_url || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(user.name)}" 
                                 alt="${user.name}" 
                                 class="w-8 h-8 rounded-full"
                            />
                            <span class="hidden md:inline">${user.name}</span>
                            <i class="fas fa-chevron-down text-sm"></i>
                        </button>
                        
                        <div class="hidden group-hover:block absolute right-0 mt-2 w-48 bg-gray-800 rounded-lg shadow-xl py-2 border border-gray-700">
                            <a href="/perfil" class="block px-4 py-2 hover:bg-gray-700 transition">
                                <i class="fas fa-user mr-2"></i> Meu Perfil
                            </a>
                            <a href="/favoritos" class="block px-4 py-2 hover:bg-gray-700 transition">
                                <i class="fas fa-heart mr-2"></i> Favoritos
                            </a>
                            <hr class="my-2 border-gray-700" />
                            <button onclick="logout()" class="block w-full text-left px-4 py-2 hover:bg-gray-700 transition text-red-400">
                                <i class="fas fa-sign-out-alt mr-2"></i> Sair
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
    function logout() {
        localStorage.removeItem('auth_token');
        window.location.href = '/login';
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
