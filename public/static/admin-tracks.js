// Admin tracks management - Using native Fetch API

// Auto-load on page ready
window.addEventListener('DOMContentLoaded', () => {
  loadTracks();
});

async function loadTracks() {
  console.log('📊 Loading admin tracks...');
  
  try {
    console.log('🎯 Fetching tracks...');
    const tracks = await api.get('/tracks');
    console.log('   Tracks received:', tracks.length, 'tracks');
    
    const table = document.getElementById('tracksTable');
    if (!table) {
      console.error('❌ tracksTable element not found!');
      return;
    }
    
    if (tracks.length === 0) {
      table.innerHTML = '<p class="text-center text-theme-secondary py-12">Nenhuma trilha cadastrada. Clique em "Nova Trilha" para começar.</p>';
      return;
    }
    
    table.innerHTML = `
      <div class="overflow-x-auto">
        <table class="w-full">
          <thead class="border-b border-theme">
            <tr>
              <th class="text-left py-3 px-4">ID</th>
              <th class="text-left py-3 px-4">Título</th>
              <th class="text-left py-3 px-4">Aulas</th>
              <th class="text-left py-3 px-4">Duração</th>
              <th class="text-left py-3 px-4">Ações</th>
            </tr>
          </thead>
          <tbody>
            ${tracks.map(track => `
              <tr class="border-b border-theme hover:bg-gray-750">
                <td class="py-3 px-4">#${track.id}</td>
                <td class="py-3 px-4 font-semibold">${uiSecurity.escape(track.title)}</td>
                <td class="py-3 px-4">${uiSecurity.number(track.total_lessons)} aulas</td>
                <td class="py-3 px-4">${Math.round((track.duration_minutes || 0) / 60)}h</td>
                <td class="py-3 px-4">
                  <button onclick="editTrack(${track.id})" class="text-blue-400 hover:text-blue-300 mr-3" title="Editar">
                    <i class="fas fa-edit"></i>
                  </button>
                  <button onclick="deleteTrack(${track.id})" class="text-red-400 hover:text-red-300" title="Deletar">
                    <i class="fas fa-trash"></i>
                  </button>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
    
    console.log('✅ Admin tracks loaded successfully!');
  } catch (error) {
    console.error('❌ Error loading tracks:', error);
    
    const table = document.getElementById('tracksTable');
    if (table) {
      table.innerHTML = '<p class="text-center text-red-400 py-12">Erro ao carregar trilhas. Verifique o console.</p>';
    }
  }
}

function openCreateModal() {
  document.getElementById('modalTitle').textContent = 'Nova Trilha';
  document.getElementById('trackForm').reset();
  document.getElementById('trackId').value = '';
  document.getElementById('modalOverlay').classList.remove('hidden');
  
  // Clear any previous messages
  const messageEl = document.getElementById('formMessage');
  messageEl.className = 'hidden';
}

function closeModal() {
  document.getElementById('modalOverlay').classList.add('hidden');
}

async function editTrack(id) {
  try {
    console.log('✏️ Loading track for edit:', id);
    
    // Get all tracks and find the one we want
    const tracks = await api.get('/tracks');
    const track = tracks.find(t => t.id === id);
    
    if (!track) {
      showAlert('Trilha não encontrada', 'Erro', 'error');
      return;
    }
    
    // Fill form with track data
    document.getElementById('modalTitle').textContent = 'Editar Trilha';
    document.getElementById('trackId').value = track.id;
    document.getElementById('trackSpecialty').value = track.specialty_id || '';
    document.getElementById('trackTitle').value = track.title;
    document.getElementById('trackDescription').value = track.description || '';
    document.getElementById('trackCoverImage').value = track.cover_image || '';
    document.getElementById('trackLessons').value = track.total_lessons || 0;
    document.getElementById('trackDuration').value = track.duration_minutes || 0;
    
    // Clear any previous messages
    const messageEl = document.getElementById('formMessage');
    messageEl.className = 'hidden';
    
    // Open modal
    document.getElementById('modalOverlay').classList.remove('hidden');
    
  } catch (error) {
    console.error('Error loading track for edit:', error);
    showAlert('Erro ao carregar dados da trilha', 'Erro', 'error');
  }
}

async function deleteTrack(id, title) {
  const confirmed = await showConfirm(
    `Tem certeza que deseja excluir a trilha selecionada?\n\nEsta ação não pode ser desfeita e todas as aulas associadas também serão excluídas.`,
    'Confirmar Exclusão',
    { confirmText: 'Excluir', cancelText: 'Cancelar', dangerous: true }
  );
  
  if (!confirmed) return;
  
  try {
    console.log('🗑️ Deleting track:', id);
    
    await api.delete('/tracks/' + id);
    
    console.log('✅ Track deleted successfully');
    showAlert('Trilha deletada com sucesso!', 'Sucesso', 'success');
    
    // Reload tracks list
    loadTracks();
    
  } catch (error) {
    console.error('Error deleting track:', error);
    showAlert('Erro ao deletar trilha. Verifique o console.', 'Erro', 'error');
  }
}

// Form submission handler
document.addEventListener('DOMContentLoaded', () => {
  const trackForm = document.getElementById('trackForm');
  if (trackForm) {
    trackForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const messageEl = document.getElementById('formMessage');
      messageEl.className = 'hidden';
      
      try {
        const id = document.getElementById('trackId').value;
        const specialty_id = parseInt(document.getElementById('trackSpecialty').value);
        const title = document.getElementById('trackTitle').value;
        const description = document.getElementById('trackDescription').value;
        const cover_image = document.getElementById('trackCoverImage').value.trim() || null;
        const total_lessons = parseInt(document.getElementById('trackLessons').value) || 0;
        const duration_minutes = parseInt(document.getElementById('trackDuration').value) || 0;
        
        if (!specialty_id) {
          messageEl.textContent = 'Por favor, selecione uma especialidade';
          messageEl.className = 'p-4 rounded-lg bg-red-500/20 border border-red-500 text-red-300';
          return;
        }
        
        const data = { specialty_id, title, description, cover_image, total_lessons, duration_minutes };
        
        console.log('💾 Saving track:', data);
        
        if (id) {
          // Update existing track
          await api.put('/tracks/' + id, data);
          messageEl.textContent = 'Trilha atualizada com sucesso!';
        } else {
          // Create new track
          await api.post('/tracks', data);
          messageEl.textContent = 'Trilha criada com sucesso!';
        }
        
        messageEl.className = 'p-4 rounded-lg bg-green-500/20 border border-green-500 text-green-300';
        
        // Reload tracks list
        setTimeout(() => {
          closeModal();
          loadTracks();
        }, 1500);
        
      } catch (error) {
        console.error('Error saving track:', error);
        messageEl.textContent = 'Erro ao salvar trilha. Verifique o console.';
        messageEl.className = 'p-4 rounded-lg bg-red-500/20 border border-red-500 text-red-300';
      }
    });
  }
});
