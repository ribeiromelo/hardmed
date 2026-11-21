// Only measured values are shown. Missing analytics stay explicitly unavailable.
let reportData;
document.addEventListener('DOMContentLoaded', loadReports);

async function loadReports() {
  try {
    const [users, tracks, lessons] = await Promise.all([api.get('/admin/users'), api.get('/tracks'), api.get('/lessons')]);
    reportData = { users, tracks, lessons };
    const today = new Date().toLocaleDateString('pt-BR');
    const totalViews = lessons.reduce((sum, lesson) => sum + (Number(lesson.views_count) || 0), 0);
    const average = users.length ? Math.round(users.reduce((sum, user) => sum + (Number(user.avg_progress) || 0), 0) / users.length) : 0;
    document.getElementById('reportTotalUsers').textContent = users.length;
    document.getElementById('reportNewUsers').textContent = `+${users.filter(user => new Date(user.created_at).toLocaleDateString('pt-BR') === today).length} hoje`;
    document.getElementById('reportTotalViews').textContent = totalViews.toLocaleString('pt-BR');
    document.getElementById('reportCompletionRate').textContent = `${average}%`;
    document.getElementById('reportAvgTime').textContent = '—';
    const rankedTracks = tracks.map(track => ({ ...track, views: lessons.filter(lesson => lesson.track_id === track.id).reduce((sum, lesson) => sum + (Number(lesson.views_count) || 0), 0) })).sort((a,b) => b.views - a.views).slice(0,5);
    const row = (item, index, subtitle, views) => `<div class="flex items-center justify-between gap-4 p-4 bg-theme-tertiary/50 rounded-xl"><div class="flex items-center gap-3 min-w-0"><span class="text-theme-secondary">${index+1}</span><div class="min-w-0"><p class="font-semibold">${appCards.escape(item.title)}</p><p class="text-sm text-theme-secondary">${appCards.escape(subtitle)}</p></div></div><div class="text-right shrink-0"><p class="font-semibold">${Number(views)||0}</p><p class="text-xs text-theme-secondary">visualizações</p></div></div>`;
    document.getElementById('popularTracks').innerHTML = rankedTracks.map((track,index) => row(track,index,`${track.total_lessons || 0} aulas`,track.views)).join('') || '<p class="text-theme-secondary py-4">Nenhuma trilha disponível.</p>';
    document.getElementById('popularLessons').innerHTML = [...lessons].sort((a,b) => (Number(b.views_count)||0)-(Number(a.views_count)||0)).slice(0,5).map((lesson,index) => row(lesson,index,lesson.track_title || '',lesson.views_count)).join('') || '<p class="text-theme-secondary py-4">Nenhuma aula disponível.</p>';
    document.getElementById('activeUsersBody').innerHTML = [...users].filter(user => user.last_access).sort((a,b) => new Date(b.last_access)-new Date(a.last_access)).slice(0,10).map((user,index) => `<tr><td class="py-4 px-6">${index+1}</td><td class="py-4 px-6"><p class="font-semibold">${appCards.escape(user.name)}</p><p class="text-sm text-theme-secondary">${appCards.escape(user.email)}</p></td><td class="py-4 px-6">${user.role === 'admin' ? 'Administrador' : 'Estudante'}</td><td class="py-4 px-6">${appCards.percent(user.avg_progress)}%</td><td class="py-4 px-6 whitespace-nowrap">${new Date(user.last_access).toLocaleString('pt-BR')}</td></tr>`).join('') || '<tr><td colspan="5" class="p-6 text-theme-secondary">Nenhum acesso registrado.</td></tr>';
    document.getElementById('completionRatesBody').innerHTML = '<tr><td colspan="5" class="p-6 text-theme-secondary">Dados de inscrição e conclusão por trilha ainda não estão disponíveis neste relatório.</td></tr>';
  } catch (error) {
    console.error('Erro ao carregar relatórios:',error);
    for (const id of ['popularTracks','popularLessons']) document.getElementById(id).innerHTML = '<p class="text-red-500 p-4" role="alert">Não foi possível carregar os dados. Tente atualizar.</p>';
    for (const id of ['activeUsersBody','completionRatesBody']) document.getElementById(id).innerHTML = '<tr><td colspan="5" class="p-6 text-red-500">Não foi possível carregar os dados.</td></tr>';
  }
}
window.refreshReports = loadReports;
window.exportReport = () => {
  if (!reportData) return;
  // Prevent spreadsheet formula execution when exporting administrator-provided text.
  const cell = value => '"' + String(value ?? '').replace(/^[=+@\-\t\r]/, "'$&").replace(/"/g,'""') + '"';
  const lines = [['Tipo','Nome','Aulas','Visualizações'],...reportData.lessons.map(lesson => ['Aula',lesson.title,1,lesson.views_count || 0]),...reportData.tracks.map(track => ['Trilha',track.title,track.total_lessons || 0,''])];
  const blob = new Blob(['\ufeff'+lines.map(line => line.map(cell).join(';')).join('\r\n')],{type:'text/csv;charset=utf-8'});
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a'); link.href=url; link.download='hardmedicina-conteudos.csv'; link.click();
  setTimeout(() => URL.revokeObjectURL(url),1000);
};
