document.addEventListener('DOMContentLoaded', loadAllTracks);

async function loadAllTracks() {
  const content = document.getElementById('specialtiesContent');
  const filters = document.getElementById('specialtyFilters');
  const search = document.getElementById('trackSearch');
  const status = document.getElementById('catalogStatus');
  try {
    const [specialties, tracks] = await Promise.all([api.get('/specialties'), api.get('/tracks')]);
    let selected = 'all';
    const normalize = value => String(value ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('pt-BR');
    const available = specialties.filter(specialty => tracks.some(track => track.specialty_id === specialty.id));
    filters.innerHTML = [{ id: 'all', name: 'Todas' }, ...available].map(specialty =>
      `<button type="button" data-specialty="${appCards.escape(specialty.id)}" aria-pressed="${specialty.id === 'all'}">${appCards.escape(specialty.name)}</button>`).join('');
    const render = () => {
      const query = normalize(search.value.trim());
      let count = 0;
      content.innerHTML = specialties.map(specialty => {
        if (selected !== 'all' && String(specialty.id) !== selected) return '';
        const matching = tracks.filter(track => track.specialty_id === specialty.id && normalize(`${track.title} ${track.description || ''} ${specialty.name}`).includes(query));
        count += matching.length;
        return matching.length ? `<section class="mb-12" aria-label="${appCards.escape(specialty.name)}">
          <div class="app-section-heading"><div><h2>${appCards.escape(specialty.name)}</h2><p>${appCards.escape(specialty.description || '')}</p></div><span class="text-theme-secondary text-sm">${matching.length} ${matching.length === 1 ? 'trilha' : 'trilhas'}</span></div>
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">${matching.map(track => appCards.render({ ...track, specialty_name: specialty.name })).join('')}</div>
        </section>` : '';
      }).join('');
      status.textContent = `${count} ${count === 1 ? 'trilha encontrada' : 'trilhas encontradas'}.`;
      if (!count) content.innerHTML = `<div class="app-empty"><h2>${tracks.length ? 'Nenhuma trilha por aqui.' : 'O catálogo está sendo preparado.'}</h2><p class="mt-3">${tracks.length ? 'Experimente outro termo ou outra especialidade.' : 'As trilhas publicadas aparecerão nesta página.'}</p></div>`;
    };
    filters.addEventListener('click', event => {
      const button = event.target.closest('[data-specialty]');
      if (!button) return;
      selected = button.dataset.specialty;
      filters.querySelectorAll('button').forEach(item => item.setAttribute('aria-pressed', String(item === button)));
      render();
    });
    search.addEventListener('input', render);
    render();
  } catch (error) {
    console.error('Erro ao carregar catálogo:', error);
    content.innerHTML = '<div class="app-empty" role="alert"><h2>Não foi possível carregar o catálogo.</h2><p class="mt-3">Recarregue a página para tentar novamente.</p></div>';
  }
}
