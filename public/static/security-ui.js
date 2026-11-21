// Shared output encoding. Input validation does not replace context-safe rendering.
window.uiSecurity = {
  escape(value) { return String(value ?? '').replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' })[c]); },
  url(value) {
    try { const url = new URL(value, location.origin); return ['http:', 'https:'].includes(url.protocol) ? url.href : ''; } catch { return ''; }
  },
  icon(value, fallback = 'fa-info-circle') { return /^fa-[a-z0-9-]+$/.test(value || '') ? value : fallback; },
  number(value) { return Number.isFinite(Number(value)) ? Number(value) : 0; }
};
