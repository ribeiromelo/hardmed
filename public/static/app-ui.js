// Navigation shared by all authenticated pages.
(() => {
  const pathname = window.location.pathname;
  const admin = pathname === '/admin' || pathname.startsWith('/admin/');
  document.getElementById('appAdminNav')?.toggleAttribute('hidden', !admin);
  document.querySelectorAll('[data-app-nav]').forEach(link => {
    const href = link.getAttribute('href');
    const active = href === '/admin' ? admin : href === '/trilhas'
      ? /^\/(trilhas|trilha|aula)(\/|$)/.test(pathname) : href === pathname;
    if (active) link.setAttribute('aria-current', 'page');
  });
  document.querySelectorAll('[data-app-admin-nav]').forEach(link => {
    if (link.getAttribute('href') === pathname) link.setAttribute('aria-current', 'page');
  });
  const pairs = [['userMenuButton', 'userMenuDropdown'], ['notificationsButton', 'notificationsDropdown'], ['appMenuButton', 'mobileMenu']];
  const close = (buttonId, panelId) => {
    document.getElementById(panelId)?.classList.add('hidden');
    document.getElementById(buttonId)?.setAttribute('aria-expanded', 'false');
  };
  window.toggleUserMenu = () => {
    const panel = document.getElementById('userMenuDropdown');
    const expanded = panel.classList.contains('hidden');
    pairs.filter(([, id]) => id !== panel.id).forEach(pair => close(...pair));
    panel.classList.toggle('hidden', !expanded);
    document.getElementById('userMenuButton').setAttribute('aria-expanded', String(expanded));
  };
  const originalToggleNotifications = window.toggleNotifications;
  window.toggleNotifications = () => {
    pairs.filter(([, id]) => id !== 'notificationsDropdown').forEach(pair => close(...pair));
    originalToggleNotifications();
    document.getElementById('notificationsButton').setAttribute('aria-expanded', String(!document.getElementById('notificationsDropdown').classList.contains('hidden')));
  };
  document.addEventListener('click', event => {
    pairs.forEach(([buttonId, panelId]) => {
      const button = document.getElementById(buttonId);
      const panel = document.getElementById(panelId);
      if (button && panel && !button.contains(event.target) && !panel.contains(event.target)) close(buttonId, panelId);
    });
  });
  document.addEventListener('keydown', event => {
    if (event.key !== 'Escape') return;
    const open = pairs.find(([, panelId]) => !document.getElementById(panelId)?.classList.contains('hidden'));
    pairs.forEach(pair => close(...pair));
    if (open) document.getElementById(open[0])?.focus();
  });
  // Profile and notification forms already call showToast, but the backup did
  // not define it. Reuse the shared, text-only feedback dialog.
  window.showToast = (message, type = 'info') => {
    const titles = { success: 'Concluído', error: 'Não foi possível concluir', warning: 'Atenção', info: 'Aviso' };
    window.showAlert(String(message).replace(/<br\s*\/?>/gi, '\n'), titles[type] || titles.info, type);
  };
  document.querySelectorAll('label:not([for])').forEach((label, index) => {
    const input = label.parentElement.querySelector('input:not([type="hidden"]), textarea, select');
    if (!input) return;
    if (!input.id) input.id = `app-field-${index}`;
    label.htmlFor = input.id;
  });
  document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('#modalOverlay, #notificationModal, #customModalOverlay').forEach(overlay => {
      const panel = overlay.firstElementChild;
      const heading = panel.querySelector('h2, h3');
      panel.setAttribute('role', 'dialog');
      panel.setAttribute('aria-modal', 'true');
      if (heading?.id) panel.setAttribute('aria-labelledby', heading.id);
      const closeButton = panel.querySelector('button[onclick="closeModal()"]');
      if (closeButton && !closeButton.textContent.trim()) closeButton.setAttribute('aria-label', 'Fechar formulário');
      let wasOpen = false;
      let returnFocus;
      new MutationObserver(() => {
        const open = !overlay.classList.contains('hidden');
        if (open && !wasOpen) {
          returnFocus = document.activeElement;
          const first = panel.querySelector('input:not([type="hidden"]), select, textarea, button');
          first?.focus();
        } else if (!open && wasOpen) returnFocus?.focus();
        wasOpen = open;
      }).observe(overlay, { attributes: true, attributeFilter: ['class'] });
      panel.addEventListener('keydown', event => {
        if (event.key === 'Escape') {
          const cancel = panel.querySelector('#modalCancelBtn, button[onclick="closeModal()"], button[onclick="hideCustomModal()"]');
          if (cancel) { event.preventDefault(); cancel.click(); }
        }
        if (event.key !== 'Tab') return;
        const items = [...panel.querySelectorAll('a[href], button, input:not([type="hidden"]), select, textarea, [tabindex="0"]')].filter(item => !item.disabled && item.getClientRects().length);
        const first = items[0], last = items[items.length - 1];
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
      });
    });
  });
})();
