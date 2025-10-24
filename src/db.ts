import type { 
  User, 
  Specialty, 
  Track, 
  Season, 
  Lesson, 
  UserTrackProgress,
  TrackWithProgress,
  SeasonWithLessons,
  LessonWithProgress
} from './types';

// User queries
export async function getUserByEmail(db: D1Database, email: string): Promise<User | null> {
  const result = await db.prepare('SELECT * FROM users WHERE email = ?').bind(email).first<User>();
  return result;
}

export async function getUserById(db: D1Database, id: number): Promise<User | null> {
  const result = await db.prepare('SELECT * FROM users WHERE id = ?').bind(id).first<User>();
  return result;
}

export async function createUser(db: D1Database, name: string, email: string, passwordHash: string): Promise<User> {
  const result = await db.prepare(
    'INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?) RETURNING *'
  ).bind(name, email, passwordHash, 'student').first<User>();
  
  if (!result) {
    throw new Error('Failed to create user');
  }
  
  return result;
}

export async function updateUserLastAccess(db: D1Database, userId: number): Promise<void> {
  await db.prepare(
    'UPDATE users SET last_access = CURRENT_TIMESTAMP WHERE id = ?'
  ).bind(userId).run();
}

// Specialty queries
export async function getAllSpecialties(db: D1Database): Promise<Specialty[]> {
  const result = await db.prepare(
    'SELECT * FROM specialties WHERE is_active = 1 ORDER BY order_index ASC'
  ).all<Specialty>();
  
  return result.results || [];
}

export async function getSpecialtyBySlug(db: D1Database, slug: string): Promise<Specialty | null> {
  const result = await db.prepare(
    'SELECT * FROM specialties WHERE slug = ? AND is_active = 1'
  ).bind(slug).first<Specialty>();
  
  return result;
}

// Track queries
export async function getAllTracks(db: D1Database): Promise<Track[]> {
  const result = await db.prepare(
    'SELECT * FROM tracks WHERE is_active = 1 ORDER BY order_index ASC'
  ).all<Track>();
  
  return result.results || [];
}

export async function getTracksBySpecialty(db: D1Database, specialtyId: number): Promise<Track[]> {
  const result = await db.prepare(
    'SELECT * FROM tracks WHERE specialty_id = ? AND is_active = 1 ORDER BY order_index ASC'
  ).bind(specialtyId).all<Track>();
  
  return result.results || [];
}

export async function getTrackBySlug(db: D1Database, slug: string): Promise<Track | null> {
  const result = await db.prepare(
    'SELECT * FROM tracks WHERE slug = ? AND is_active = 1'
  ).bind(slug).first<Track>();
  
  return result;
}

export async function getTrackWithProgress(
  db: D1Database, 
  trackId: number, 
  userId?: number
): Promise<TrackWithProgress | null> {
  const track = await db.prepare(
    'SELECT * FROM tracks WHERE id = ? AND is_active = 1'
  ).bind(trackId).first<Track>();
  
  if (!track) return null;
  
  const trackWithProgress: TrackWithProgress = { ...track };
  
  if (userId) {
    const progress = await db.prepare(
      'SELECT * FROM user_track_progress WHERE user_id = ? AND track_id = ?'
    ).bind(userId, trackId).first<UserTrackProgress>();
    
    if (progress) {
      trackWithProgress.user_progress = progress.progress_percentage;
      trackWithProgress.completed_lessons = progress.completed_lessons;
      trackWithProgress.last_lesson_id = progress.last_lesson_id;
    }
  }
  
  return trackWithProgress;
}

// Season queries
export async function getSeasonsByTrack(db: D1Database, trackId: number): Promise<Season[]> {
  const result = await db.prepare(
    'SELECT * FROM seasons WHERE track_id = ? AND is_active = 1 ORDER BY order_index ASC'
  ).bind(trackId).all<Season>();
  
  return result.results || [];
}

export async function getSeasonsWithLessons(
  db: D1Database, 
  trackId: number,
  userId?: number
): Promise<SeasonWithLessons[]> {
  const seasons = await getSeasonsByTrack(db, trackId);
  
  const seasonsWithLessons: SeasonWithLessons[] = [];
  
  for (const season of seasons) {
    const lessons = await getLessonsBySeason(db, season.id, userId);
    seasonsWithLessons.push({
      ...season,
      lessons
    });
  }
  
  return seasonsWithLessons;
}

// Lesson queries
export async function getLessonsBySeason(
  db: D1Database, 
  seasonId: number,
  userId?: number
): Promise<LessonWithProgress[]> {
  const lessons = await db.prepare(
    'SELECT * FROM lessons WHERE season_id = ? AND is_active = 1 ORDER BY order_index ASC'
  ).bind(seasonId).all<Lesson>();
  
  const lessonsWithProgress: LessonWithProgress[] = [];
  
  for (const lesson of lessons.results || []) {
    const lessonWithProgress: LessonWithProgress = { 
      ...lesson,
      is_completed: false,
      watch_time_seconds: 0,
      last_position_seconds: 0
    };
    
    if (userId) {
      const progress = await db.prepare(
        'SELECT * FROM user_lesson_progress WHERE user_id = ? AND lesson_id = ?'
      ).bind(userId, lesson.id).first();
      
      if (progress) {
        lessonWithProgress.is_completed = Boolean(progress.is_completed);
        lessonWithProgress.watch_time_seconds = progress.watch_time_seconds as number;
        lessonWithProgress.last_position_seconds = progress.last_position_seconds as number;
      }
    }
    
    lessonsWithProgress.push(lessonWithProgress);
  }
  
  return lessonsWithProgress;
}

export async function getLessonBySlug(
  db: D1Database, 
  slug: string,
  userId?: number
): Promise<LessonWithProgress | null> {
  const lesson = await db.prepare(`
    SELECT l.*, s.title as season_title, s.track_id, t.title as track_title
    FROM lessons l
    JOIN seasons s ON l.season_id = s.id
    JOIN tracks t ON s.track_id = t.id
    WHERE l.slug = ? AND l.is_active = 1
  `).bind(slug).first<Lesson>();
  
  if (!lesson) return null;
  
  const lessonWithProgress: LessonWithProgress = { 
    ...lesson,
    is_completed: false,
    watch_time_seconds: 0,
    last_position_seconds: 0
  };
  
  if (userId) {
    const progress = await db.prepare(
      'SELECT * FROM user_lesson_progress WHERE user_id = ? AND lesson_id = ?'
    ).bind(userId, lesson.id).first();
    
    if (progress) {
      lessonWithProgress.is_completed = Boolean(progress.is_completed);
      lessonWithProgress.watch_time_seconds = progress.watch_time_seconds as number;
      lessonWithProgress.last_position_seconds = progress.last_position_seconds as number;
    }
  }
  
  // Increment views
  await db.prepare(
    'UPDATE lessons SET views_count = views_count + 1 WHERE id = ?'
  ).bind(lesson.id).run();
  
  return lessonWithProgress;
}

// Progress queries
export async function getUserTrackProgress(
  db: D1Database, 
  userId: number
): Promise<UserTrackProgress[]> {
  const result = await db.prepare(
    'SELECT * FROM user_track_progress WHERE user_id = ? ORDER BY updated_at DESC'
  ).bind(userId).all<UserTrackProgress>();
  
  return result.results || [];
}

export async function updateLessonProgress(
  db: D1Database,
  userId: number,
  lessonId: number,
  watchTimeSeconds: number,
  lastPositionSeconds: number,
  isCompleted: boolean
): Promise<void> {
  // Update or create lesson progress
  const completedAtValue = isCompleted ? 'CURRENT_TIMESTAMP' : 'NULL';
  
  await db.prepare(`
    INSERT INTO user_lesson_progress (user_id, lesson_id, watch_time_seconds, last_position_seconds, is_completed, completed_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ${completedAtValue}, CURRENT_TIMESTAMP)
    ON CONFLICT(user_id, lesson_id) DO UPDATE SET
      watch_time_seconds = excluded.watch_time_seconds,
      last_position_seconds = excluded.last_position_seconds,
      is_completed = excluded.is_completed,
      completed_at = CASE WHEN excluded.is_completed = 1 AND completed_at IS NULL THEN CURRENT_TIMESTAMP ELSE completed_at END,
      updated_at = CURRENT_TIMESTAMP
  `).bind(userId, lessonId, watchTimeSeconds, lastPositionSeconds, isCompleted ? 1 : 0).run();
  
  // Get lesson info to update track progress
  const lesson = await db.prepare(
    'SELECT season_id FROM lessons WHERE id = ?'
  ).bind(lessonId).first();
  
  if (!lesson) return;
  
  const season = await db.prepare(
    'SELECT track_id FROM seasons WHERE id = ?'
  ).bind(lesson.season_id).first();
  
  if (!season) return;
  
  // Calculate track progress
  const trackStats = await db.prepare(`
    SELECT 
      COUNT(*) as total_lessons,
      SUM(CASE WHEN ulp.is_completed = 1 THEN 1 ELSE 0 END) as completed_lessons
    FROM lessons l
    INNER JOIN seasons s ON l.season_id = s.id
    LEFT JOIN user_lesson_progress ulp ON l.id = ulp.lesson_id AND ulp.user_id = ?
    WHERE s.track_id = ? AND l.is_active = 1
  `).bind(userId, season.track_id).first();
  
  if (!trackStats) return;
  
  const totalLessons = trackStats.total_lessons as number;
  const completedLessons = trackStats.completed_lessons as number || 0;
  const progressPercentage = (completedLessons / totalLessons) * 100;
  
  // Update or create track progress
  await db.prepare(`
    INSERT INTO user_track_progress (user_id, track_id, completed_lessons, total_lessons, progress_percentage, last_lesson_id, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    ON CONFLICT(user_id, track_id) DO UPDATE SET
      completed_lessons = excluded.completed_lessons,
      total_lessons = excluded.total_lessons,
      progress_percentage = excluded.progress_percentage,
      last_lesson_id = excluded.last_lesson_id,
      updated_at = CURRENT_TIMESTAMP
  `).bind(userId, season.track_id, completedLessons, totalLessons, progressPercentage, lessonId).run();
}

// Admin stats
export async function getAdminStats(db: D1Database) {
  const usersCount = await db.prepare('SELECT COUNT(*) as count FROM users').first();
  const tracksCount = await db.prepare('SELECT COUNT(*) as count FROM tracks WHERE is_active = 1').first();
  const lessonsCount = await db.prepare('SELECT COUNT(*) as count FROM lessons WHERE is_active = 1').first();
  const dailyViews = await db.prepare(`
    SELECT SUM(views_count) as count FROM lessons 
    WHERE DATE(updated_at) = DATE('now')
  `).first();
  
  return {
    total_users: usersCount?.count || 0,
    total_tracks: tracksCount?.count || 0,
    total_lessons: lessonsCount?.count || 0,
    daily_views: dailyViews?.count || 0
  };
}

export async function getAllUsers(db: D1Database) {
  const result = await db.prepare(`
    SELECT 
      u.id,
      u.name,
      u.email,
      u.role,
      u.created_at,
      u.last_access,
      COALESCE(AVG(utp.progress_percentage), 0) as avg_progress
    FROM users u
    LEFT JOIN user_track_progress utp ON u.id = utp.user_id
    GROUP BY u.id
    ORDER BY u.created_at DESC
  `).all();
  
  return result.results || [];
}
