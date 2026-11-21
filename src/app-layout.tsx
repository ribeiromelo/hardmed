import { html } from 'hono/html';

export interface AppUser {
  id: number;
  name: string;
  role: string;
  avatar_url?: string;
}

const adminLinks = [
  ['/admin', 'Visão geral', 'fa-gauge-high'],
  ['/admin/trilhas', 'Trilhas', 'fa-book-medical'],
  ['/admin/temporadas', 'Temporadas', 'fa-layer-group'],
  ['/admin/aulas', 'Aulas', 'fa-circle-play'],
  ['/admin/usuarios', 'Usuários', 'fa-users'],
  ['/admin/relatorios', 'Relatórios', 'fa-chart-column'],
  ['/admin/notificacoes', 'Notificações', 'fa-bell'],
];

export const AppHeader = ({ user }: { user: AppUser }) => html`
<a href="#app-main" class="app-skip">Pular para o conteúdo</a>
<header class="app-header">
  <div class="app-header-inner">
    <a href="/dashboard" class="app-brand" aria-label="HardMedicina — início">
      <span class="app-brand-mark" aria-hidden="true"><i class="fas fa-plus"></i></span>
      <span>hard<span class="app-brand-light">medicina</span><small>TRILHAS DE CONHECIMENTO</small></span>
    </a>
    <nav class="app-desktop-nav" aria-label="Navegação principal">
      <a href="/dashboard" data-app-nav>Meu aprendizado</a>
      <a href="/trilhas" data-app-nav>Explorar trilhas</a>
      ${user.role === 'admin' ? html`<a href="/admin" data-app-nav>Administração</a>` : ''}
    </nav>
    <div class="app-header-actions">
      <button type="button" onclick="toggleTheme()" class="app-icon-button" aria-label="Alternar tema" title="Alternar tema">
        <i id="themeIcon" class="fas fa-moon" aria-hidden="true"></i>
      </button>
      <div class="relative">
        <button type="button" id="notificationsButton" class="app-icon-button" aria-label="Notificações" aria-expanded="false" aria-controls="notificationsDropdown" onclick="toggleNotifications()">
          <i class="far fa-bell" aria-hidden="true"></i><span id="notificationBadge" class="app-badge hidden">0</span>
        </button>
        <section id="notificationsDropdown" class="hidden app-dropdown app-notifications" aria-label="Notificações">
          <div class="app-dropdown-heading"><h2>Notificações</h2><button type="button" onclick="markAllAsRead()">Marcar como lidas</button></div>
          <div id="notificationsList" class="overflow-y-auto max-h-96" aria-live="polite"><p class="p-6 text-theme-secondary">Carregando notificações…</p></div>
        </section>
      </div>
      <div class="relative">
        <button type="button" id="userMenuButton" class="app-user-button" onclick="toggleUserMenu()" aria-label="Abrir menu da conta" aria-expanded="false" aria-controls="userMenuDropdown">
          ${user.avatar_url ? html`<img src="${user.avatar_url}" alt="" class="app-avatar" />` : html`<span class="app-avatar">${user.name.trim().slice(0, 1).toUpperCase()}</span>`}
          <span class="app-user-name">${user.name.replace(/^Dra?\.?\s+/i, '').split(' ')[0]}</span><i class="fas fa-chevron-down" aria-hidden="true"></i>
        </button>
        <div id="userMenuDropdown" class="hidden app-dropdown app-user-dropdown">
          <div class="app-account-info"><strong>${user.name}</strong><small>${user.role === 'admin' ? 'Administrador' : 'Estudante'}</small></div>
          <a href="/perfil"><i class="far fa-user" aria-hidden="true"></i> Meu perfil</a>
          ${user.role === 'admin' ? html`<a href="/admin"><i class="fas fa-gauge-high" aria-hidden="true"></i> Administração</a>` : ''}
          <button type="button" onclick="logout()"><i class="fas fa-sign-out-alt" aria-hidden="true"></i> Sair da conta</button>
        </div>
      </div>
      <button type="button" id="appMenuButton" class="app-icon-button app-menu-button" onclick="toggleMobileMenu()" aria-label="Abrir navegação" aria-expanded="false" aria-controls="mobileMenu"><i class="fas fa-bars" aria-hidden="true"></i></button>
    </div>
  </div>
  <nav id="mobileMenu" class="hidden app-mobile-nav" aria-label="Navegação no celular">
    <a href="/dashboard" data-app-nav>Meu aprendizado</a><a href="/trilhas" data-app-nav>Explorar trilhas</a><a href="/perfil" data-app-nav>Meu perfil</a>
    ${user.role === 'admin' ? html`<a href="/admin" data-app-nav>Administração</a>` : ''}
  </nav>
</header>
${user.role === 'admin' ? html`
<nav id="appAdminNav" class="app-admin-nav" aria-label="Administração" hidden>
  <div>${adminLinks.map(([href, label, icon]) => html`<a href="${href}" data-app-admin-nav><i class="fas ${icon}" aria-hidden="true"></i>${label}</a>`)}</div>
</nav>` : ''}
`;

export const AppFooter = () => html`
<footer class="app-footer">
  <div><a href="/dashboard" class="app-footer-brand">hardmedicina<span>Aprender faz parte da prática.</span></a>
  <nav aria-label="Links do rodapé"><a href="/trilhas">Trilhas</a><a href="/perfil">Meu perfil</a><a href="/termos">Termos</a><a href="/privacidade">Privacidade</a><a href="https://8b.com/" target="_blank" rel="noopener noreferrer">Design: 8B</a></nav></div>
</footer>
`;
