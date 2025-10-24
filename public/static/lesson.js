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
    
    console.log('✅ Lesson loaded successfully!');
    
  } catch (error) {
    console.error('❌ Error loading lesson:', error);
    alert('Erro ao carregar aula. Verifique o console.');
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

async function toggleComplete() {
  if (!currentLesson) return;
  
  const btn = document.getElementById('completeBtn');
  const originalHtml = btn.innerHTML;
  
  try {
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Salvando...';
    
    console.log('💾 Toggling completion status...');
    
    if (currentLesson.is_completed) {
      // Mark as incomplete
      await api.post('/progress/incomplete', { lesson_id: currentLesson.id });
      currentLesson.is_completed = false;
      console.log('   Marked as incomplete');
    } else {
      // Mark as complete
      await api.post('/progress/complete', { lesson_id: currentLesson.id });
      currentLesson.is_completed = true;
      console.log('   Marked as complete');
    }
    
    updateCompleteButton(currentLesson.is_completed);
    
  } catch (error) {
    console.error('❌ Error toggling completion:', error);
    alert('Erro ao atualizar progresso. Tente novamente.');
    btn.innerHTML = originalHtml;
  } finally {
    btn.disabled = false;
  }
}
