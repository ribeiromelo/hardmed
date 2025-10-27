// Lesson page - View lesson and mark as completed

let currentLesson = null;

window.addEventListener('DOMContentLoaded', () => {
  const slug = window.lessonSlug;
  if (slug) {
    loadLesson(slug);
  } else {
    console.error('No lessonSlug found!');
  }
});

async function loadLesson(slug) {
  console.log('📚 Loading lesson:', slug);
  
  try {
    const lesson = await api.get('/lessons/' + slug);
    console.log('   Lesson loaded:', lesson);
    
    currentLesson = lesson;
    
    // Update page content
    document.title = lesson.title + ' | HardMedicina';
    document.getElementById('lessonTitle').textContent = lesson.title;
    document.getElementById('lessonDescription').textContent = lesson.description || '';
    
    // Meta info
    const metaInfo = [];
    metaInfo.push(lesson.track_title);
    if (lesson.season_title) metaInfo.push(lesson.season_title);
    if (lesson.duration_minutes) metaInfo.push(lesson.duration_minutes + ' minutos');
    document.getElementById('lessonMeta').textContent = metaInfo.join(' • ');
    
    // Video player
    const videoPlayer = document.getElementById('videoPlayer');
    if (lesson.video_url) {
      // Convert YouTube URLs to embed format
      let embedUrl = lesson.video_url;
      if (lesson.video_url.includes('youtube.com/watch')) {
        const videoId = lesson.video_url.split('v=')[1]?.split('&')[0];
        if (videoId) {
          embedUrl = `https://www.youtube.com/embed/${videoId}`;
        }
      } else if (lesson.video_url.includes('youtu.be/')) {
        const videoId = lesson.video_url.split('youtu.be/')[1]?.split('?')[0];
        if (videoId) {
          embedUrl = `https://www.youtube.com/embed/${videoId}`;
        }
      }
      videoPlayer.src = embedUrl;
    }
    
    // Key points
    if (lesson.key_points) {
      try {
        const points = JSON.parse(lesson.key_points);
        const keyPointsEl = document.getElementById('keyPoints');
        keyPointsEl.innerHTML = `
          <h3 class="font-bold text-xl mb-4"><i class="fas fa-lightbulb text-yellow-500 mr-2"></i>Pontos-chave</h3>
          <ul class="space-y-3">
            ${points.map(p => `
              <li class="flex items-start">
                <i class="fas fa-check text-green-500 mr-3 mt-1"></i>
                <span class="text-gray-300">${p}</span>
              </li>
            `).join('')}
          </ul>
        `;
      } catch (e) {
        console.error('Error parsing key points:', e);
      }
    }
    
    // Downloads
    if (lesson.pdf_url) {
      document.getElementById('downloads').innerHTML = `
        <a href="${lesson.pdf_url}" target="_blank" class="bg-red-600 px-6 py-3 rounded-lg hover:bg-red-700 transition font-semibold">
          <i class="fas fa-file-pdf mr-2"></i>Download Material PDF
        </a>
      `;
    }
    
    // Update complete button state
    updateCompleteButton(lesson.is_completed);
    
    // Load track sidebar
    await loadTrackSidebar(lesson.track_id);
    
    console.log('✅ Lesson loaded successfully!');
    
  } catch (error) {
    console.error('❌ Error loading lesson:', error);
    showAlert('Erro ao carregar aula. Verifique o console para mais detalhes.', 'Erro', 'error');
  }
}

async function loadTrackSidebar(trackId) {
  try {
    console.log('📂 Loading track sidebar for track:', trackId);
    
    // Get all tracks to find the current one by ID
    const tracks = await api.get('/tracks');
    const track = tracks.find(t => t.track_id === trackId || t.id === trackId);
    
    if (!track) {
      console.error('Track not found');
      return;
    }
    
    // Get track details with seasons and lessons
    const trackData = await api.get('/tracks/' + track.slug);
    
    // Update track info
    document.getElementById('trackTitle').textContent = trackData.track.title;
    
    const totalLessons = trackData.track.total_lessons || 0;
    const completedLessons = trackData.track.completed_lessons || 0;
    const progressPercent = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;
    
    document.getElementById('trackProgress').textContent = `${completedLessons} de ${totalLessons} aulas • ${progressPercent}% concluído`;
    
    // Render seasons and lessons
    const seasonsDiv = document.getElementById('trackSeasons');
    seasonsDiv.innerHTML = trackData.seasons.map((season, index) => `
      <div class="border-b border-gray-700 pb-3 last:border-0">
        <button onclick="toggleSidebarSeason(${index})" class="w-full text-left flex items-center justify-between py-2 hover:text-purple-400 transition">
          <div>
            <div class="font-semibold text-sm">${season.title}</div>
            <div class="text-xs text-gray-400">${season.lessons.length} aulas</div>
          </div>
          <i id="sidebar-chevron-${index}" class="fas fa-chevron-down text-xs transition-transform"></i>
        </button>
        <div id="sidebar-season-${index}" class="mt-2 space-y-1">
          ${season.lessons.map(lessonItem => `
            <a href="/aula/${lessonItem.slug}" class="flex items-center gap-2 px-3 py-2 rounded-lg text-sm hover:bg-gray-700 transition ${lessonItem.id === currentLesson.id ? 'bg-purple-600/20 border-l-2 border-purple-500' : ''}">
              <i class="fas fa-${lessonItem.is_completed ? 'check-circle text-green-500' : lessonItem.id === currentLesson.id ? 'play-circle text-purple-400' : 'circle text-gray-600'} text-xs flex-shrink-0"></i>
              <span class="flex-1 truncate ${lessonItem.id === currentLesson.id ? 'text-purple-400 font-semibold' : ''}">${lessonItem.title}</span>
              <span class="text-xs text-gray-500">${lessonItem.duration_minutes}min</span>
            </a>
          `).join('')}
        </div>
      </div>
    `).join('');
    
    // Auto-expand current season
    trackData.seasons.forEach((season, index) => {
      const hasCurrentLesson = season.lessons.some(l => l.id === currentLesson.id);
      if (hasCurrentLesson) {
        const seasonDiv = document.getElementById('sidebar-season-' + index);
        const chevron = document.getElementById('sidebar-chevron-' + index);
        if (seasonDiv) seasonDiv.classList.remove('hidden');
        if (chevron) chevron.classList.add('rotate-180');
      } else {
        // Collapse other seasons by default
        const seasonDiv = document.getElementById('sidebar-season-' + index);
        if (seasonDiv) seasonDiv.classList.add('hidden');
      }
    });
    
    console.log('✅ Track sidebar loaded');
    
  } catch (error) {
    console.error('❌ Error loading track sidebar:', error);
  }
}

window.toggleSidebarSeason = function(index) {
  const seasonDiv = document.getElementById('sidebar-season-' + index);
  const chevron = document.getElementById('sidebar-chevron-' + index);
  
  if (seasonDiv && chevron) {
    seasonDiv.classList.toggle('hidden');
    chevron.classList.toggle('rotate-180');
  }
}

function updateCompleteButton(isCompleted) {
  const btn = document.getElementById('completeBtn');
  const btnText = document.getElementById('completeBtnText');
  
  if (isCompleted) {
    btn.className = 'bg-green-600 px-6 py-3 rounded-lg hover:bg-green-700 transition font-semibold';
    btnText.innerHTML = '<i class="fas fa-check-circle mr-2"></i>Concluída';
  } else {
    btn.className = 'bg-gradient-to-r from-purple-600 to-pink-600 px-6 py-3 rounded-lg hover:from-purple-700 hover:to-pink-700 transition font-semibold';
    btnText.innerHTML = '<i class="fas fa-check mr-2"></i>Marcar como concluída';
  }
}

window.toggleComplete = async function() {
  if (!currentLesson) {
    console.error('No lesson loaded yet!');
    return;
  }
  
  const btn = document.getElementById('completeBtn');
  const originalHtml = btn.innerHTML;
  
  try {
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Salvando...';
    
    console.log('💾 Toggling completion status...');
    
    const wasCompleted = currentLesson.is_completed;
    
    if (currentLesson.is_completed) {
      // Mark as incomplete
      await api.post('/progress/incomplete', { lesson_id: currentLesson.id });
      console.log('   Marked as incomplete');
    } else {
      // Mark as complete
      await api.post('/progress/complete', { lesson_id: currentLesson.id });
      console.log('   Marked as complete');
    }
    
    // Show success message and reload page
    const message = !wasCompleted 
      ? 'Aula marcada como concluída! Atualizando...' 
      : 'Aula marcada como não concluída! Atualizando...';
    showAlert(message, 'Sucesso', 'success');
    
    // Auto-refresh after 800ms to show the success message
    setTimeout(() => {
      window.location.reload();
    }, 800);
    
  } catch (error) {
    console.error('❌ Error toggling completion:', error);
    showAlert('Erro ao atualizar progresso. Tente novamente.', 'Erro', 'error');
    btn.innerHTML = originalHtml;
    btn.disabled = false;
  }
}
