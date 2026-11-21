// Session credentials are kept exclusively in the HttpOnly cookie.
window.api = {
  async request(url, options = {}) {
    const response = await fetch('/api' + url, {
      ...options,
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json', 'X-HardMed-Request': '1', ...(options.headers || {}) }
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      if (response.status === 401 && !window.location.pathname.includes('login')) window.location.href = '/login';
      const error = new Error(data.error || 'Não foi possível concluir a solicitação');
      error.status = response.status;
      throw error;
    }
    return data;
  },
  get(url) { return this.request(url, { method: 'GET' }); },
  post(url, data) { return this.request(url, { method: 'POST', body: JSON.stringify(data || {}) }); },
  put(url, data) { return this.request(url, { method: 'PUT', body: JSON.stringify(data) }); },
  delete(url) { return this.request(url, { method: 'DELETE' }); }
};
