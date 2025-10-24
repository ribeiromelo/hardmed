// Admin tracks management - Using native Fetch API

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
    
    table.innerHTML = `
      <div class="overflow-x-auto">
        <table class="w-full">
          <thead class="border-b border-gray-700">
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
              <tr class="border-b border-gray-700 hover:bg-gray-750">
                <td class="py-3 px-4">#${track.id}</td>
                <td class="py-3 px-4 font-semibold">${track.title}</td>
                <td class="py-3 px-4">${track.total_lessons || 0} aulas</td>
                <td class="py-3 px-4">${Math.round((track.duration_minutes || 0) / 60)}h</td>
                <td class="py-3 px-4">
                  <button onclick="editTrack(${track.id})" class="text-blue-400 hover:text-blue-300 mr-3">
                    <i class="fas fa-edit"></i>
                  </button>
                  <button onclick="deleteTrack(${track.id})" class="text-red-400 hover:text-red-300">
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
}

function closeModal() {
  document.getElementById('modalOverlay').classList.add('hidden');
}

async function editTrack(id) {
  alert('Função de edição será implementada em breve!');
}

async function deleteTrack(id) {
  if (!confirm('Tem certeza que deseja excluir esta trilha?')) return;
  alert('Função de exclusão será implementada em breve!');
}

// Form submission handler
document.addEventListener('DOMContentLoaded', () => {
  const trackForm = document.getElementById('trackForm');
  if (trackForm) {
    trackForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      alert('Função de salvar será implementada em breve!');
    });
  }
});
