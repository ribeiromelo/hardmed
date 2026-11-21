window.appCards = (() => {
  const escape = value => String(value ?? '').replace(/[&<>"']/g, character => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  })[character]);
  const imageURL = value => {
    if (!value) return '';
    try {
      const url = new URL(value, window.location.origin);
      return ['https:', 'http:'].includes(url.protocol) ? escape(url.href) : '';
    } catch { return ''; }
  };
  const percent = value => Math.max(0, Math.min(100, Math.round(Number(value) || 0)));
  const render = track => {
    const progress = percent(track.user_progress);
    const image = imageURL(track.cover_image);
    const hours = Math.max(0, Math.round((Number(track.duration_minutes) || 0) / 60));
    return `<a href="/trilha/${encodeURIComponent(track.slug)}" class="app-track-card">
      <div class="app-track-cover">
        ${image ? `<img src="${image}" alt="" loading="lazy" onerror="this.remove()" />` : '<i class="fas fa-book-medical" aria-hidden="true"></i>'}
        <span class="app-cover-label">${escape(track.specialty_name || 'Trilha de estudo')}</span>
      </div>
      <div class="app-track-body">
        <h3>${escape(track.title)}</h3>
        <p class="line-clamp-2">${escape(track.description || 'Aprenda com aulas organizadas para a sua prática.')}</p>
        <div class="app-track-meta"><span><i class="fas fa-circle-play" aria-hidden="true"></i> ${Math.max(0, Number(track.total_lessons) || 0)} aulas</span><span><i class="far fa-clock" aria-hidden="true"></i> ${hours}h de conteúdo</span></div>
        <div class="app-track-progress" role="progressbar" aria-label="Progresso da trilha" aria-valuenow="${progress}" aria-valuemin="0" aria-valuemax="100"><span style="width:${progress}%"></span></div>
        <div class="app-track-action"><span>${progress === 100 ? 'Revisar trilha' : progress > 0 ? 'Continuar trilha' : 'Conhecer trilha'}</span><small>${progress}% concluído</small></div>
      </div>
    </a>`;
  };
  return { escape, percent, render };
})();
