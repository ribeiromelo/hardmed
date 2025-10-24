// Admin Seasons Management
let allTracks = [];
let allSeasons = [];

document.addEventListener('DOMContentLoaded', () => {
  loadInitialData();
});

async function loadInitialData() {
  try {
    // Load tracks for the dropdown
    allTracks = await api.get('/tracks');
    
    // Populate track filter dropdown
    const filterSelect = document.getElementById('filterTrack');
    filterSelect.innerHTML = '<option value="">Todas as trilhas</option>' +
      allTracks.map(track => `<option value="${track.id}">${track.title}</option>`).join('');
    
    // Populate modal track dropdown
    const modalTrackSelect = document.getElementById('seasonTrack');
    modalTrackSelect.innerHTML = '<option value="">Selecione uma trilha</option>' +
      allTracks.map(track => `<option value="${track.id}">${track.title}</option>`).join('');
    
    // Load all seasons
    await loadSeasons();
    
  } catch (error) {
    console.error('Error loading initial data:', error);
    showAlert('Erro ao carregar dados iniciais', 'Erro', 'error');
  }
}

async function loadSeasons() {
  try {
    const trackId = document.getElementById('filterTrack')?.value;
    const url = trackId ? `/seasons?track_id=${trackId}` : '/seasons';
    
    allSeasons = await api.get(url);
    
    const tbody = document.getElementById('seasonsTableBody');
    
    if (allSeasons.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="5" class="text-center py-12 text-gray-400">
            <i class="fas fa-inbox text-5xl mb-4"></i>
            <p>Nenhuma temporada cadastrada</p>
          </td>
        </tr>
      `;
      return;
    }
    
    tbody.innerHTML = allSeasons.map(season => {
      const track = allTracks.find(t => t.id === season.track_id);
      return `
        <tr class="border-b border-gray-700 hover:bg-gray-750">
          <td class="py-4 px-4">${season.order_index}</td>
          <td class="py-4 px-4">
            <div class="font-semibold">${season.title}</div>
            <div class="text-sm text-gray-400">${season.description || ''}</div>
          </td>
          <td class="py-4 px-4">
            <span class="text-purple-400">${track ? track.title : 'N/A'}</span>
          </td>
          <td class="py-4 px-4">
            <span class="px-3 py-1 rounded-full text-xs ${season.is_active ? 'bg-green-600' : 'bg-gray-600'}">
              ${season.is_active ? 'Ativa' : 'Inativa'}
            </span>
          </td>
          <td class="py-4 px-4">
            <div class="flex gap-2">
              <button onclick="editSeason(${season.id})" class="text-blue-400 hover:text-blue-300">
                <i class="fas fa-edit"></i> Editar
              </button>
              <button onclick="deleteSeason(${season.id}, '${season.title.replace(/'/g, "\\'")}' )" class="text-red-400 hover:text-red-300">
                <i class="fas fa-trash"></i> Excluir
              </button>
            </div>
          </td>
        </tr>
      `;
    }).join('');
    
  } catch (error) {
    console.error('Error loading seasons:', error);
    showAlert('Erro ao carregar temporadas', 'Erro', 'error');
  }
}

function filterSeasons() {
  loadSeasons();
}

window.openCreateModal = function() {
  document.getElementById('modalTitle').textContent = 'Nova Temporada';
  document.getElementById('seasonForm').reset();
  document.getElementById('seasonId').value = '';
  document.getElementById('modalOverlay').classList.remove('hidden');
}

window.closeModal = function() {
  document.getElementById('modalOverlay').classList.add('hidden');
  document.getElementById('formMessage').classList.add('hidden');
}

async function editSeason(id) {
  const season = allSeasons.find(s => s.id === id);
  if (!season) return;
  
  document.getElementById('modalTitle').textContent = 'Editar Temporada';
  document.getElementById('seasonId').value = season.id;
  document.getElementById('seasonTrack').value = season.track_id;
  document.getElementById('seasonTitle').value = season.title;
  document.getElementById('seasonDescription').value = season.description || '';
  document.getElementById('seasonOrder').value = season.order_index;
  document.getElementById('seasonActive').checked = season.is_active === 1;
  
  document.getElementById('modalOverlay').classList.remove('hidden');
}

async function deleteSeason(id, title) {
  const confirmed = await showConfirm(
    `Tem certeza que deseja excluir a temporada "${title}"?\n\nATENÇÃO: Todas as aulas associadas a esta temporada também serão excluídas!`,
    'Confirmar Exclusão',
    { confirmText: 'Excluir', cancelText: 'Cancelar', dangerous: true }
  );
  
  if (!confirmed) return;
  
  try {
    await api.delete('/seasons/' + id);
    showAlert('Temporada excluída com sucesso!', 'Sucesso', 'success');
    loadSeasons();
  } catch (error) {
    console.error('Error deleting season:', error);
    showAlert('Erro ao excluir temporada', 'Erro', 'error');
  }
}

// Handle form submission
document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('seasonForm');
  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const id = document.getElementById('seasonId').value;
      const track_id = parseInt(document.getElementById('seasonTrack').value);
      const title = document.getElementById('seasonTitle').value;
      const description = document.getElementById('seasonDescription').value;
      const order_index = parseInt(document.getElementById('seasonOrder').value);
      const is_active = document.getElementById('seasonActive').checked ? 1 : 0;
      
      if (!track_id) {
        showAlert('Por favor, selecione uma trilha', 'Aviso', 'warning');
        return;
      }
      
      const messageDiv = document.getElementById('formMessage');
      
      try {
        const data = { track_id, title, description, order_index, is_active };
        
        if (id) {
          // Update
          await api.put('/seasons/' + id, data);
          messageDiv.textContent = 'Temporada atualizada com sucesso!';
        } else {
          // Create
          await api.post('/seasons', data);
          messageDiv.textContent = 'Temporada criada com sucesso!';
        }
        
        messageDiv.className = 'p-4 rounded-lg bg-green-600';
        messageDiv.classList.remove('hidden');
        
        setTimeout(() => {
          closeModal();
          loadSeasons();
        }, 1500);
        
      } catch (error) {
        console.error('Error saving season:', error);
        messageDiv.textContent = 'Erro ao salvar temporada';
        messageDiv.className = 'p-4 rounded-lg bg-red-600';
        messageDiv.classList.remove('hidden');
      }
    });
  }
});
