document.addEventListener('DOMContentLoaded', loadDashboard);

async function loadDashboard() {
  const myTracks = document.getElementById('myTracks');
  const discover = document.getElementById('discoverTracks');
  try {
    const [tracks, progress] = await Promise.all([api.get('/tracks'), api.get('/user/progress')]);
    const completed = tracks.reduce((sum, track) => sum + (Number(track.completed_lessons) || 0), 0);
    const total = tracks.reduce((sum, track) => sum + (Number(track.total_lessons) || 0), 0);
    const percentage = total ? appCards.percent(completed / total * 100) : 0;
    document.getElementById('totalProgress').textContent = `${percentage}%`;
    const progressBar = document.getElementById('progressBar');
    progressBar.style.width = `${percentage}%`;
    for (const [attribute, value] of Object.entries({role: 'progressbar', 'aria-label': 'Progresso geral', 'aria-valuenow': percentage, 'aria-valuemin': 0, 'aria-valuemax': 100})) progressBar.parentElement.setAttribute(attribute, String(value));
    document.getElementById('completedLessons').textContent = completed;
    document.getElementById('totalLessons').textContent = total;
    const startedIds = new Set(progress.map(item => item.track_id));
    document.getElementById('startedTracks').textContent = startedIds.size;
    const started = tracks.filter(track => startedIds.has(track.id));
    myTracks.innerHTML = started.length ? started.map(appCards.render).join('') : `
      <div class="app-empty"><h3>Todo aprendizado tem um começo.</h3><p>Escolha uma trilha no catálogo. Seu progresso aparecerá aqui.</p><a href="/trilhas" class="btn btn-primary mt-5">Encontrar uma trilha</a></div>`;
    const remaining = tracks.filter(track => !startedIds.has(track.id));
    discover.innerHTML = remaining.length ? remaining.slice(0, 3).map(appCards.render).join('') : `
      <div class="app-empty"><p>${tracks.length ? 'Você já começou todas as trilhas disponíveis. Continue no seu ritmo.' : 'Novas trilhas aparecerão aqui quando forem publicadas.'}</p></div>`;
    const lastTrack = progress.length && tracks.find(track => track.id === progress[0].track_id);
    if (lastTrack) {
      const resume = document.getElementById('resumeStudy');
      resume.href = `/trilha/${encodeURIComponent(lastTrack.slug)}`;
      resume.innerHTML = '<i class="fas fa-play mr-2" aria-hidden="true"></i>Continuar meus estudos';
    }
  } catch (error) {
    console.error('Erro ao carregar dashboard:', error);
    myTracks.innerHTML = '<div class="app-empty" role="alert"><h3>Não foi possível carregar suas trilhas.</h3><p>Tente novamente em instantes.</p><button type="button" class="btn btn-secondary mt-5" onclick="loadDashboard()">Tentar novamente</button></div>';
    discover.innerHTML = '';
  }
}
