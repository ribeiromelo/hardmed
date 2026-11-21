// Admin lessons management - Using native Fetch API

let allTracks = [];
let allSeasons = [];
let allLessons = [];
let currentTrackFilter = '';

// Auto-load on page ready
window.addEventListener('DOMContentLoaded', () => {
  loadInitialData();
});

async function loadInitialData() {
  console.log('📚 Loading lessons data...');
  
  try {
    // Load tracks for filter and form
    console.log('📦 Fetching tracks...');
    allTracks = await api.get('/tracks');
    console.log('   Tracks loaded:', allTracks.length);
    
    // Populate filter dropdown
    const filterSelect = document.getElementById('filterTrack');
    if (filterSelect) {
      filterSelect.innerHTML = '<option value="">Todas as trilhas</option>' +
        allTracks.map(track => `<option value="${track.id}">${uiSecurity.escape(track.title)}</option>`).join('');
      
      filterSelect.addEventListener('change', (e) => {
        currentTrackFilter = e.target.value;
        loadLessons();
      });
    }
    
    // Populate track dropdown in modal
    const trackSelect = document.getElementById('lessonTrack');
    if (trackSelect) {
      trackSelect.innerHTML = '<option value="">Selecione uma trilha</option>' +
        allTracks.map(track => `<option value="${track.id}">${uiSecurity.escape(track.title)}</option>`).join('');
      
      trackSelect.addEventListener('change', async (e) => {
        await loadSeasons(e.target.value);
      });
    }
    
    // Load all lessons
    await loadLessons();
    
  } catch (error) {
    console.error('❌ Error loading initial data:', error);
  }
}

async function loadSeasons(trackId) {
  const seasonSelect = document.getElementById('lessonSeason');
  if (!seasonSelect) return;
  
  if (!trackId) {
    seasonSelect.innerHTML = '<option value="">Selecione uma temporada</option>';
    seasonSelect.disabled = true;
    return;
  }
  
  try {
    console.log('📺 Loading seasons for track:', trackId);
    const seasons = await api.get('/seasons?track_id=' + trackId);
    console.log('   Seasons loaded:', seasons.length);
    
    allSeasons = seasons;
    seasonSelect.innerHTML = '<option value="">Selecione uma temporada</option>' +
      seasons.map(season => `<option value="${season.id}">${uiSecurity.escape(season.title)}</option>`).join('');
    seasonSelect.disabled = false;
    
  } catch (error) {
    console.error('Error loading seasons:', error);
    seasonSelect.innerHTML = '<option value="">Erro ao carregar temporadas</option>';
  }
}

async function loadLessons() {
  console.log('📊 Loading lessons...');
  
  try {
    const url = currentTrackFilter ? `/lessons?track_id=${currentTrackFilter}` : '/lessons';
    console.log('🎯 Fetching lessons from:', url);
    
    allLessons = await api.get(url);
    console.log('   Lessons received:', allLessons.length, 'lessons');
    
    const table = document.getElementById('lessonsTable');
    if (!table) {
      console.error('❌ lessonsTable element not found!');
      return;
    }
    
    if (allLessons.length === 0) {
      table.innerHTML = '<p class="text-center text-theme-secondary py-12">Nenhuma aula cadastrada. Clique em "Nova Aula" para começar.</p>';
      return;
    }
    
    table.innerHTML = `
      <div class="overflow-x-auto">
        <table class="w-full">
          <thead class="border-b border-theme">
            <tr>
              <th class="text-left py-3 px-4">ID</th>
              <th class="text-left py-3 px-4">Título</th>
              <th class="text-left py-3 px-4">Trilha</th>
              <th class="text-left py-3 px-4">Temporada</th>
              <th class="text-left py-3 px-4">Duração</th>
              <th class="text-left py-3 px-4">Ações</th>
            </tr>
          </thead>
          <tbody>
            ${allLessons.map(lesson => `
              <tr class="border-b border-theme hover:bg-gray-750">
                <td class="py-3 px-4">#${lesson.id}</td>
                <td class="py-3 px-4 font-semibold">${uiSecurity.escape(lesson.title)}</td>
                <td class="py-3 px-4 text-sm text-theme-secondary">${uiSecurity.escape(lesson.track_title)}</td>
                <td class="py-3 px-4 text-sm text-theme-secondary">${uiSecurity.escape(lesson.season_title)}</td>
                <td class="py-3 px-4">${lesson.duration_minutes || 0} min</td>
                <td class="py-3 px-4">
                  <button onclick="editLesson(${lesson.id})" class="text-blue-400 hover:text-blue-300 mr-3" title="Editar">
                    <i class="fas fa-edit"></i>
                  </button>
                  <button onclick="deleteLesson(${lesson.id})" class="text-red-400 hover:text-red-300" title="Deletar">
                    <i class="fas fa-trash"></i>
                  </button>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
    
    console.log('✅ Lessons loaded successfully!');
  } catch (error) {
    console.error('❌ Error loading lessons:', error);
    
    const table = document.getElementById('lessonsTable');
    if (table) {
      table.innerHTML = '<p class="text-center text-red-400 py-12">Erro ao carregar aulas. Verifique o console.</p>';
    }
  }
}

function openCreateModal() {
  document.getElementById('modalTitle').textContent = 'Nova Aula';
  document.getElementById('lessonForm').reset();
  document.getElementById('lessonId').value = '';
  document.getElementById('lessonSeason').disabled = true;
  document.getElementById('modalOverlay').classList.remove('hidden');
  
  // Clear any previous messages
  const messageEl = document.getElementById('formMessage');
  messageEl.className = 'hidden';
}

function closeModal() {
  document.getElementById('modalOverlay').classList.add('hidden');
}

async function editLesson(id) {
  try {
    console.log('✏️ Loading lesson for edit:', id);
    
    const lesson = allLessons.find(l => l.id === id);
    if (!lesson) {
      showAlert('Aula não encontrada', 'Erro', 'error');
      return;
    }
    
    // Fill form with lesson data
    document.getElementById('modalTitle').textContent = 'Editar Aula';
    document.getElementById('lessonId').value = lesson.id;
    document.getElementById('lessonTrack').value = lesson.track_id;
    
    // Load seasons for the track
    await loadSeasons(lesson.track_id);
    
    document.getElementById('lessonSeason').value = lesson.season_id;
    document.getElementById('lessonTitle').value = lesson.title;
    document.getElementById('lessonDescription').value = lesson.description || '';
    document.getElementById('lessonVideoUrl').value = lesson.video_url;
    document.getElementById('lessonDuration').value = lesson.duration_minutes || 0;
    document.getElementById('lessonPdfUrl').value = lesson.pdf_url || '';
    
    // Parse key_points from JSON string to textarea (one per line)
    if (lesson.key_points) {
      try {
        const keyPointsArray = JSON.parse(lesson.key_points);
        document.getElementById('lessonKeyPoints').value = keyPointsArray.join('\n');
      } catch (e) {
        document.getElementById('lessonKeyPoints').value = '';
      }
    } else {
      document.getElementById('lessonKeyPoints').value = '';
    }
    
    // Clear any previous messages
    const messageEl = document.getElementById('formMessage');
    messageEl.className = 'hidden';
    
    // Open modal
    document.getElementById('modalOverlay').classList.remove('hidden');
    
  } catch (error) {
    console.error('Error loading lesson for edit:', error);
    showAlert('Erro ao carregar dados da aula', 'Erro', 'error');
  }
}

async function deleteLesson(id, title) {
  const confirmed = await showConfirm(
    `Tem certeza que deseja excluir a aula selecionada?\n\nEsta ação não pode ser desfeita.`,
    'Confirmar Exclusão',
    { confirmText: 'Excluir', cancelText: 'Cancelar', dangerous: true }
  );
  
  if (!confirmed) return;
  
  try {
    console.log('🗑️ Deleting lesson:', id);
    
    await api.delete('/lessons/' + id);
    
    console.log('✅ Lesson deleted successfully');
    showAlert('Aula deletada com sucesso!', 'Sucesso', 'success');
    
    // Reload lessons list
    await loadLessons();
    
  } catch (error) {
    console.error('Error deleting lesson:', error);
    showAlert('Erro ao deletar aula. Verifique o console.', 'Erro', 'error');
  }
}

// Form submission handler
document.addEventListener('DOMContentLoaded', () => {
  const lessonForm = document.getElementById('lessonForm');
  if (lessonForm) {
    lessonForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const messageEl = document.getElementById('formMessage');
      messageEl.className = 'hidden';
      
      try {
        const id = document.getElementById('lessonId').value;
        const season_id = parseInt(document.getElementById('lessonSeason').value);
        const title = document.getElementById('lessonTitle').value;
        const description = document.getElementById('lessonDescription').value;
        const video_url = document.getElementById('lessonVideoUrl').value;
        const duration_minutes = parseInt(document.getElementById('lessonDuration').value) || 0;
        const pdf_url = document.getElementById('lessonPdfUrl').value;
        
        // Parse key_points from textarea (one per line) to JSON string
        const keyPointsText = document.getElementById('lessonKeyPoints').value.trim();
        const key_points = keyPointsText ? JSON.stringify(keyPointsText.split('\n').filter(line => line.trim())) : null;
        
        if (!season_id) {
          messageEl.textContent = 'Por favor, selecione uma trilha e temporada';
          messageEl.className = 'p-4 rounded-lg bg-red-500/20 border border-red-500 text-red-300';
          return;
        }
        
        const data = { season_id, title, description, video_url, duration_minutes, pdf_url, key_points };
        
        console.log('💾 Saving lesson:', data);
        
        if (id) {
          // Update existing lesson
          await api.put('/lessons/' + id, data);
          messageEl.textContent = 'Aula atualizada com sucesso!';
        } else {
          // Create new lesson
          await api.post('/lessons', data);
          messageEl.textContent = 'Aula criada com sucesso!';
        }
        
        messageEl.className = 'p-4 rounded-lg bg-green-500/20 border border-green-500 text-green-300';
        
        // Reload lessons list
        setTimeout(async () => {
          closeModal();
          await loadLessons();
        }, 1500);
        
      } catch (error) {
        console.error('Error saving lesson:', error);
        messageEl.textContent = 'Erro ao salvar aula. Verifique o console.';
        messageEl.className = 'p-4 rounded-lg bg-red-500/20 border border-red-500 text-red-300';
      }
    });
  }
});
