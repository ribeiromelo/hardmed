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
    const lessonTitle = document.getElementById('lessonTitle');
    const lessonDescription = document.getElementById('lessonDescription');
    const lessonMeta = document.getElementById('lessonMeta');
    
    if(lessonTitle) lessonTitle.textContent = lesson.title;
    if(lessonDescription) lessonDescription.textContent = lesson.description || '';
    
    // Meta info
    if(lessonMeta) {
        const metaInfo = [];
        metaInfo.push(uiSecurity.escape(lesson.track_title));
        if (lesson.season_title) metaInfo.push(uiSecurity.escape(lesson.season_title));
        if (lesson.duration_minutes) metaInfo.push(`<i class="fas fa-clock text-xs"></i> ${uiSecurity.number(lesson.duration_minutes)} min`);
        lessonMeta.innerHTML = metaInfo.join('<span class="mx-2 text-theme-tertiary">•</span>');
    }
    
    // Video player
    const videoPlayer = document.getElementById('videoPlayer');
    if (lesson.video_url && videoPlayer) {
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
      const safeEmbed = uiSecurity.url(embedUrl);
      if (safeEmbed && ['www.youtube.com','www.youtube-nocookie.com','player.vimeo.com'].includes(new URL(safeEmbed).hostname)) videoPlayer.src = safeEmbed;
    }
    
    // Key points
    if (lesson.key_points) {
      try {
        const points = JSON.parse(lesson.key_points);
        const keyPointsEl = document.querySelector('#keyPoints .space-y-2');
        if(keyPointsEl) {
            keyPointsEl.innerHTML = points.map(p => `
              <div class="flex items-start gap-3 p-3 rounded-lg bg-theme-secondary border border-theme">
                <div class="w-6 h-6 rounded-full bg-green-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <i class="fas fa-check text-green-500 text-xs"></i>
                </div>
                <span class="text-theme-secondary text-sm leading-relaxed">${uiSecurity.escape(p)}</span>
              </div>
            `).join('');
        }
      } catch (e) {
        console.error('Error parsing key points:', e);
      }
    } else {
        const keyPointsContainer = document.getElementById('keyPoints');
        if(keyPointsContainer) keyPointsContainer.classList.add('hidden');
    }
    
    // Downloads
    if (lesson.pdf_url) {
      const downloadsEl = document.getElementById('downloads');
      if(downloadsEl) {
          downloadsEl.innerHTML = `
            <a href="${uiSecurity.escape(uiSecurity.url(lesson.pdf_url))}" target="_blank" rel="noopener noreferrer" class="btn bg-theme-secondary text-theme-secondary border border-theme hover:border-red-500 hover:text-red-500 transition-all flex items-center gap-2 group">
              <div class="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center group-hover:bg-red-500 group-hover:text-white transition-colors">
                <i class="fas fa-file-pdf"></i>
              </div>
              <span class="font-medium">Material de Apoio</span>
            </a>
          `;
      }
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
    const trackTitleEl = document.getElementById('trackTitle');
    const trackProgressEl = document.getElementById('trackProgressText');
    const trackProgressBar = document.getElementById('trackProgressBar');
    
    if(trackTitleEl) trackTitleEl.textContent = trackData.track.title;
    
    const totalLessons = trackData.track.total_lessons || 0;
    const completedLessons = trackData.track.completed_lessons || 0;
    const progressPercent = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;
    
    if(trackProgressEl) trackProgressEl.textContent = `${completedLessons}/${totalLessons} aulas • ${progressPercent}%`;
    if(trackProgressBar) trackProgressBar.style.width = `${progressPercent}%`;
    
    // Render seasons and lessons
    const seasonsDiv = document.getElementById('trackSeasons');
    if(seasonsDiv) {
        seasonsDiv.innerHTML = trackData.seasons.map((season, index) => `
          <div class="border border-theme rounded-xl overflow-hidden bg-theme-primary/30">
            <button id="sidebar-toggle-${index}" aria-expanded="false" aria-controls="sidebar-season-${index}" onclick="toggleSidebarSeason(${index})" class="w-full text-left flex items-center justify-between p-3 hover:bg-theme-tertiary transition-colors">
              <div class="flex items-center gap-3">
                <span class="w-6 h-6 rounded-md bg-theme-tertiary flex items-center justify-center text-xs font-bold text-theme-secondary">${index + 1}</span>
                <div>
                    <div class="font-bold text-sm text-theme-primary">${uiSecurity.escape(season.title)}</div>
                    <div class="text-xs text-theme-tertiary">${season.lessons.length} aulas</div>
                </div>
              </div>
              <i id="sidebar-chevron-${index}" class="fas fa-chevron-down text-xs text-theme-tertiary transition-transform"></i>
            </button>
            <div id="sidebar-season-${index}" class="hidden border-t border-theme">
              ${season.lessons.map(lessonItem => `
                <a href="/aula/${encodeURIComponent(lessonItem.slug)}" class="flex items-center gap-3 p-3 text-sm hover:bg-theme-tertiary transition-colors ${lessonItem.id === currentLesson.id ? 'bg-primary-500/10 border-l-2 border-primary-500' : 'border-l-2 border-transparent'}">
                  <div class="flex-shrink-0">
                      ${lessonItem.is_completed 
                        ? '<i class="fas fa-check-circle text-green-500"></i>' 
                        : lessonItem.id === currentLesson.id 
                            ? '<i class="fas fa-play-circle text-primary-500"></i>'
                            : '<i class="far fa-circle text-theme-tertiary"></i>'
                      }
                  </div>
                  <span class="flex-1 truncate ${lessonItem.id === currentLesson.id ? 'text-primary-500 font-medium' : 'text-theme-secondary'}">${uiSecurity.escape(lessonItem.title)}</span>
                  <span class="text-xs text-theme-tertiary">${uiSecurity.number(lessonItem.duration_minutes)}m</span>
                </a>
              `).join('')}
            </div>
          </div>
        `).join('');
    }
    
    // Auto-expand current season
    trackData.seasons.forEach((season, index) => {
      const hasCurrentLesson = season.lessons.some(l => l.id === currentLesson.id);
      if (hasCurrentLesson) {
        const seasonDiv = document.getElementById('sidebar-season-' + index);
        const chevron = document.getElementById('sidebar-chevron-' + index);
        if (seasonDiv) seasonDiv.classList.remove('hidden');
        document.getElementById('sidebar-toggle-' + index)?.setAttribute('aria-expanded', 'true');
        if (chevron) chevron.classList.add('rotate-180');
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
    const expanded = !seasonDiv.classList.toggle('hidden');
    document.getElementById('sidebar-toggle-' + index)?.setAttribute('aria-expanded', String(expanded));
    chevron.classList.toggle('rotate-180');
  }
}

function updateCompleteButton(isCompleted) {
  const btn = document.getElementById('completeBtn');
  const btnText = document.getElementById('completeBtnText');
  const icon = btn.querySelector('i');
  
  if (isCompleted) {
    btn.className = 'btn btn-primary w-full md:w-auto flex items-center justify-center gap-2';
    if(btnText) btnText.textContent = 'Concluída';
    if(icon) icon.className = 'fas fa-check-circle';
  } else {
    btn.className = 'btn w-full md:w-auto bg-theme-tertiary text-theme-secondary hover:bg-primary-500 hover:text-white transition-all flex items-center justify-center gap-2';
    if(btnText) btnText.textContent = 'Marcar concluída';
    if(icon) icon.className = 'fas fa-check';
  }
}

window.toggleComplete = async function() {
  if (!currentLesson) {
    console.error('No lesson loaded yet!');
    return;
  }
  
  const btn = document.getElementById('completeBtn');
  const originalHtml = btn.innerHTML;
  const originalClass = btn.className;
  
  try {
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin animate-spin"></i> Salvando...';
    
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
    
    // Reload page to refresh state properly
    window.location.reload();
    
  } catch (error) {
    console.error('❌ Error toggling completion:', error);
    showAlert('Erro ao atualizar progresso. Tente novamente.', 'Erro', 'error');
    btn.innerHTML = originalHtml;
    btn.className = originalClass;
    btn.disabled = false;
  }
}
