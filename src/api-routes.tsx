import { Hono } from 'hono';
import type { Bindings, RegisterRequest, LoginRequest, UpdateProgressRequest } from './types';
import * as auth from './auth';
import * as db from './db';

const api = new Hono<{ Bindings: Bindings }>();

// ========================================
// AUTH API ROUTES
// ========================================
api.post('/auth/register', async (c) => {
  try {
    const { name, email, password } = await c.req.json<RegisterRequest>();
    
    if (!name || !email || !password) {
      return c.json({ error: 'Todos os campos são obrigatórios' }, 400);
    }
    
    if (!auth.isValidEmail(email)) {
      return c.json({ error: 'E-mail inválido' }, 400);
    }
    
    if (!auth.isValidPassword(password)) {
      return c.json({ error: 'Senha deve ter pelo menos 8 caracteres' }, 400);
    }
    
    const { DB } = c.env;
    
    // Check if user exists
    const existingUser = await db.getUserByEmail(DB, email);
    if (existingUser) {
      return c.json({ error: 'E-mail já cadastrado' }, 400);
    }
    
    // Create user
    const passwordHash = await auth.hashPassword(password);
    const user = await db.createUser(DB, name, email, passwordHash);
    
    return c.json({ 
      message: 'Usuário criado com sucesso',
      user: auth.sanitizeUser(user)
    }, 201);
  } catch (error) {
    console.error('Register error:', error);
    return c.json({ error: 'Erro ao criar usuário' }, 500);
  }
});

api.post('/auth/login', async (c) => {
  try {
    const { email, password } = await c.req.json<LoginRequest>();
    
    if (!email || !password) {
      return c.json({ error: 'E-mail e senha são obrigatórios' }, 400);
    }
    
    const { DB } = c.env;
    
    const user = await db.getUserByEmail(DB, email);
    if (!user) {
      return c.json({ error: 'E-mail ou senha incorretos' }, 401);
    }
    
    const isValid = await auth.verifyPassword(password, user.password_hash);
    if (!isValid) {
      return c.json({ error: 'E-mail ou senha incorretos' }, 401);
    }
    
    if (!user.is_active) {
      return c.json({ error: 'Conta desativada' }, 401);
    }
    
    // Update last access
    await db.updateUserLastAccess(DB, user.id);
    
    const token = await auth.generateToken(user);
    
    return c.json({
      user: auth.sanitizeUser(user),
      token
    });
  } catch (error) {
    console.error('Login error:', error);
    return c.json({ error: 'Erro ao fazer login' }, 500);
  }
});

// ========================================
// PROTECTED API MIDDLEWARE
// ========================================
api.use('/*', async (c, next) => {
  // Skip auth for login/register
  if (c.req.path.includes('/auth/')) {
    return next();
  }
  
  // Try to get token from Authorization header or cookie
  let token = null;
  
  const authHeader = c.req.header('Authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7);
  } else {
    // Try to get from cookie
    const cookieHeader = c.req.header('Cookie');
    if (cookieHeader) {
      const match = cookieHeader.match(/auth_token=([^;]+)/);
      if (match) {
        token = match[1];
      }
    }
  }
  
  if (!token) {
    return c.json({ error: 'Token não fornecido' }, 401);
  }
  
  const payload = await auth.verifyToken(token);
  
  if (!payload) {
    return c.json({ error: 'Token inválido ou expirado' }, 401);
  }
  
  // Store user info in context
  c.set('userId', payload.id);
  c.set('userRole', payload.role);
  
  return next();
});

// ========================================
// USER API ROUTES
// ========================================
api.get('/user/me', async (c) => {
  try {
    const userId = c.get('userId');
    const { DB } = c.env;
    
    const user = await db.getUserById(DB, userId);
    if (!user) {
      return c.json({ error: 'Usuário não encontrado' }, 404);
    }
    
    return c.json(auth.sanitizeUser(user));
  } catch (error) {
    console.error('Get user error:', error);
    return c.json({ error: 'Erro ao buscar usuário' }, 500);
  }
});

api.get('/user/progress', async (c) => {
  try {
    const userId = c.get('userId');
    const { DB } = c.env;
    
    const progress = await db.getUserTrackProgress(DB, userId);
    
    return c.json(progress);
  } catch (error) {
    console.error('Get progress error:', error);
    return c.json({ error: 'Erro ao buscar progresso' }, 500);
  }
});

// Update user profile (name only, email is read-only)
api.put('/user/profile', async (c) => {
  try {
    const userId = c.get('userId');
    const { DB } = c.env;
    const { name } = await c.req.json();
    
    if (!name || name.trim().length < 3) {
      return c.json({ error: 'Nome deve ter pelo menos 3 caracteres' }, 400);
    }
    
    await DB.prepare('UPDATE users SET name = ? WHERE id = ?')
      .bind(name.trim(), userId)
      .run();
    
    return c.json({ success: true, message: 'Perfil atualizado com sucesso!' });
  } catch (error) {
    console.error('Update profile error:', error);
    return c.json({ error: 'Erro ao atualizar perfil' }, 500);
  }
});

// Change password
api.put('/user/password', async (c) => {
  try {
    const userId = c.get('userId');
    const { DB } = c.env;
    const { currentPassword, newPassword } = await c.req.json();
    
    if (!currentPassword || !newPassword) {
      return c.json({ error: 'Senhas são obrigatórias' }, 400);
    }
    
    if (newPassword.length < 8) {
      return c.json({ error: 'Nova senha deve ter pelo menos 8 caracteres' }, 400);
    }
    
    // Get current user
    const user = await db.getUserById(DB, userId);
    if (!user) {
      return c.json({ error: 'Usuário não encontrado' }, 404);
    }
    
    // Verify current password
    const isValid = await auth.verifyPassword(currentPassword, user.password_hash);
    if (!isValid) {
      return c.json({ error: 'Senha atual incorreta' }, 401);
    }
    
    // Hash new password
    const newPasswordHash = await auth.hashPassword(newPassword);
    
    // Update password
    await DB.prepare('UPDATE users SET password_hash = ? WHERE id = ?')
      .bind(newPasswordHash, userId)
      .run();
    
    return c.json({ success: true, message: 'Senha alterada com sucesso!' });
  } catch (error) {
    console.error('Change password error:', error);
    return c.json({ error: 'Erro ao alterar senha' }, 500);
  }
});

// Get user statistics
api.get('/user/stats', async (c) => {
  try {
    const userId = c.get('userId');
    const { DB } = c.env;
    
    // Get total completed lessons
    const completedResult = await DB.prepare(`
      SELECT COUNT(*) as total
      FROM user_lesson_progress
      WHERE user_id = ? AND is_completed = 1
    `).bind(userId).first();
    
    // Get tracks with progress
    const tracksResult = await DB.prepare(`
      SELECT COUNT(DISTINCT track_id) as total
      FROM user_track_progress
      WHERE user_id = ?
    `).bind(userId).first();
    
    // Get average progress
    const avgResult = await DB.prepare(`
      SELECT AVG(progress_percentage) as avg_progress
      FROM user_track_progress
      WHERE user_id = ?
    `).bind(userId).first();
    
    return c.json({
      completedLessons: completedResult?.total || 0,
      startedTracks: tracksResult?.total || 0,
      avgProgress: Math.round(avgResult?.avg_progress || 0)
    });
  } catch (error) {
    console.error('Get stats error:', error);
    return c.json({ error: 'Erro ao buscar estatísticas' }, 500);
  }
});

// ========================================
// CONTENT API ROUTES
// ========================================
api.get('/specialties', async (c) => {
  try {
    const { DB } = c.env;
    const specialties = await db.getAllSpecialties(DB);
    return c.json(specialties);
  } catch (error) {
    console.error('Get specialties error:', error);
    return c.json({ error: 'Erro ao buscar especialidades' }, 500);
  }
});

api.get('/tracks', async (c) => {
  try {
    const userId = c.get('userId');
    const { DB } = c.env;
    
    const tracks = await db.getAllTracks(DB);
    
    // Add progress for each track
    const tracksWithProgress = await Promise.all(
      tracks.map(async (track) => {
        const trackWithProgress = await db.getTrackWithProgress(DB, track.id, userId);
        return trackWithProgress;
      })
    );
    
    return c.json(tracksWithProgress);
  } catch (error) {
    console.error('Get tracks error:', error);
    return c.json({ error: 'Erro ao buscar trilhas' }, 500);
  }
});

// Create new track (Admin only)
api.post('/tracks', async (c) => {
  try {
    const userRole = c.get('userRole');
    if (userRole !== 'admin') {
      return c.json({ error: 'Acesso negado' }, 403);
    }
    
    const { DB } = c.env;
    const body = await c.req.json();
    const { specialty_id, title, description, cover_image, total_lessons, duration_minutes } = body;
    
    if (!title) {
      return c.json({ error: 'Título é obrigatório' }, 400);
    }
    if (!specialty_id) {
      return c.json({ error: 'Especialidade é obrigatória' }, 400);
    }
    
    // Generate slug from title
    const slug = title
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
    
    const result = await DB.prepare(`
      INSERT INTO tracks (specialty_id, title, slug, description, cover_image, total_lessons, duration_minutes)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).bind(specialty_id, title, slug, description || null, cover_image || null, total_lessons || 0, duration_minutes || 0).run();
    
    return c.json({ 
      id: result.meta.last_row_id,
      specialty_id,
      title,
      slug,
      description,
      cover_image,
      total_lessons,
      duration_minutes
    }, 201);
  } catch (error) {
    console.error('Create track error:', error);
    return c.json({ error: 'Erro ao criar trilha' }, 500);
  }
});

// Update track (Admin only)
api.put('/tracks/:id', async (c) => {
  try {
    const userRole = c.get('userRole');
    if (userRole !== 'admin') {
      return c.json({ error: 'Acesso negado' }, 403);
    }
    
    const { DB } = c.env;
    const id = c.req.param('id');
    const body = await c.req.json();
    const { specialty_id, title, description, cover_image, total_lessons, duration_minutes } = body;
    
    if (!title) {
      return c.json({ error: 'Título é obrigatório' }, 400);
    }
    if (!specialty_id) {
      return c.json({ error: 'Especialidade é obrigatória' }, 400);
    }
    
    // Generate new slug from title
    const slug = title
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
    
    await DB.prepare(`
      UPDATE tracks 
      SET specialty_id = ?, title = ?, slug = ?, description = ?, cover_image = ?, total_lessons = ?, duration_minutes = ?
      WHERE id = ?
    `).bind(specialty_id, title, slug, description || null, cover_image || null, total_lessons || 0, duration_minutes || 0, id).run();
    
    return c.json({ 
      id,
      specialty_id,
      title,
      slug,
      description,
      cover_image,
      total_lessons,
      duration_minutes
    });
  } catch (error) {
    console.error('Update track error:', error);
    return c.json({ error: 'Erro ao atualizar trilha' }, 500);
  }
});

// Delete track (Admin only)
api.delete('/tracks/:id', async (c) => {
  try {
    const userRole = c.get('userRole');
    if (userRole !== 'admin') {
      return c.json({ error: 'Acesso negado' }, 403);
    }
    
    const { DB } = c.env;
    const id = c.req.param('id');
    
    // Check if track exists
    const track = await DB.prepare('SELECT id FROM tracks WHERE id = ?').bind(id).first();
    if (!track) {
      return c.json({ error: 'Trilha não encontrada' }, 404);
    }
    
    // Delete track (cascade delete should handle related records if configured)
    await DB.prepare('DELETE FROM tracks WHERE id = ?').bind(id).run();
    
    return c.json({ message: 'Trilha deletada com sucesso' });
  } catch (error) {
    console.error('Delete track error:', error);
    return c.json({ error: 'Erro ao deletar trilha' }, 500);
  }
});

// ========================================
// SEASONS API ROUTES
// ========================================

// Get all seasons or filter by track_id
api.get('/seasons', async (c) => {
  try {
    const { DB } = c.env;
    const trackId = c.req.query('track_id');
    
    let query = 'SELECT * FROM seasons';
    let bindings: any[] = [];
    
    if (trackId) {
      query += ' WHERE track_id = ?';
      bindings.push(trackId);
    }
    
    query += ' ORDER BY track_id, order_index ASC';
    
    const result = await DB.prepare(query).bind(...bindings).all();
    return c.json(result.results || []);
  } catch (error) {
    console.error('Get seasons error:', error);
    return c.json({ error: 'Erro ao buscar temporadas' }, 500);
  }
});

// Create new season (Admin only)
api.post('/seasons', async (c) => {
  try {
    const userRole = c.get('userRole');
    if (userRole !== 'admin') {
      return c.json({ error: 'Acesso negado' }, 403);
    }
    
    const { DB } = c.env;
    const body = await c.req.json();
    const { track_id, title, description, order_index, is_active } = body;
    
    if (!title) {
      return c.json({ error: 'Título é obrigatório' }, 400);
    }
    if (!track_id) {
      return c.json({ error: 'Trilha é obrigatória' }, 400);
    }
    
    const result = await DB.prepare(`
      INSERT INTO seasons (track_id, title, description, order_index, is_active)
      VALUES (?, ?, ?, ?, ?)
    `).bind(track_id, title, description || null, order_index || 1, is_active !== undefined ? is_active : 1).run();
    
    return c.json({
      id: result.meta.last_row_id,
      track_id,
      title,
      description,
      order_index: order_index || 1,
      is_active: is_active !== undefined ? is_active : 1
    }, 201);
  } catch (error) {
    console.error('Create season error:', error);
    return c.json({ error: 'Erro ao criar temporada' }, 500);
  }
});

// Update season (Admin only)
api.put('/seasons/:id', async (c) => {
  try {
    const userRole = c.get('userRole');
    if (userRole !== 'admin') {
      return c.json({ error: 'Acesso negado' }, 403);
    }
    
    const { DB } = c.env;
    const id = c.req.param('id');
    const body = await c.req.json();
    const { track_id, title, description, order_index, is_active } = body;
    
    // Check if season exists
    const season = await DB.prepare('SELECT id FROM seasons WHERE id = ?').bind(id).first();
    if (!season) {
      return c.json({ error: 'Temporada não encontrada' }, 404);
    }
    
    await DB.prepare(`
      UPDATE seasons 
      SET track_id = ?, title = ?, description = ?, order_index = ?, is_active = ?
      WHERE id = ?
    `).bind(track_id, title, description || null, order_index, is_active, id).run();
    
    return c.json({ message: 'Temporada atualizada com sucesso' });
  } catch (error) {
    console.error('Update season error:', error);
    return c.json({ error: 'Erro ao atualizar temporada' }, 500);
  }
});

// Delete season (Admin only)
api.delete('/seasons/:id', async (c) => {
  try {
    const userRole = c.get('userRole');
    if (userRole !== 'admin') {
      return c.json({ error: 'Acesso negado' }, 403);
    }
    
    const { DB } = c.env;
    const id = c.req.param('id');
    
    // Check if season exists
    const season = await DB.prepare('SELECT id FROM seasons WHERE id = ?').bind(id).first();
    if (!season) {
      return c.json({ error: 'Temporada não encontrada' }, 404);
    }
    
    // Delete season (cascade delete should handle related lessons)
    await DB.prepare('DELETE FROM seasons WHERE id = ?').bind(id).run();
    
    return c.json({ message: 'Temporada deletada com sucesso' });
  } catch (error) {
    console.error('Delete season error:', error);
    return c.json({ error: 'Erro ao deletar temporada' }, 500);
  }
});

// ========================================
// LESSONS API ROUTES
// ========================================

// Get all lessons (optionally filtered by track)
api.get('/lessons', async (c) => {
  try {
    const { DB } = c.env;
    const trackId = c.req.query('track_id');
    
    let query = `
      SELECT l.*, s.title as season_title, s.track_id, t.title as track_title
      FROM lessons l
      JOIN seasons s ON l.season_id = s.id
      JOIN tracks t ON s.track_id = t.id
    `;
    
    if (trackId) {
      query += ` WHERE s.track_id = ${trackId}`;
    }
    
    query += ` ORDER BY s.track_id, l.season_id, l.order_index`;
    
    const result = await DB.prepare(query).all();
    return c.json(result.results || []);
  } catch (error) {
    console.error('Get lessons error:', error);
    return c.json({ error: 'Erro ao buscar aulas' }, 500);
  }
});

// Get seasons by track_id
api.get('/seasons', async (c) => {
  try {
    const { DB } = c.env;
    const trackId = c.req.query('track_id');
    
    if (!trackId) {
      return c.json({ error: 'track_id é obrigatório' }, 400);
    }
    
    const result = await DB.prepare(`
      SELECT * FROM seasons WHERE track_id = ? ORDER BY order_index
    `).bind(trackId).all();
    
    return c.json(result.results || []);
  } catch (error) {
    console.error('Get seasons error:', error);
    return c.json({ error: 'Erro ao buscar temporadas' }, 500);
  }
});

// Create new lesson (Admin only)
api.post('/lessons', async (c) => {
  try {
    const userRole = c.get('userRole');
    if (userRole !== 'admin') {
      return c.json({ error: 'Acesso negado' }, 403);
    }
    
    const { DB } = c.env;
    const body = await c.req.json();
    const { season_id, title, description, video_url, duration_minutes, pdf_url } = body;
    
    if (!season_id || !title || !video_url) {
      return c.json({ error: 'Temporada, título e URL do vídeo são obrigatórios' }, 400);
    }
    
    // Generate slug from title
    const slug = title
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
    
    const result = await DB.prepare(`
      INSERT INTO lessons (season_id, title, slug, description, video_url, duration_minutes, pdf_url)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).bind(season_id, title, slug, description || null, video_url, duration_minutes || 0, pdf_url || null).run();
    
    return c.json({ 
      id: result.meta.last_row_id,
      season_id,
      title,
      slug,
      description,
      video_url,
      duration_minutes,
      pdf_url
    }, 201);
  } catch (error) {
    console.error('Create lesson error:', error);
    return c.json({ error: 'Erro ao criar aula' }, 500);
  }
});

// Update lesson (Admin only)
api.put('/lessons/:id', async (c) => {
  try {
    const userRole = c.get('userRole');
    if (userRole !== 'admin') {
      return c.json({ error: 'Acesso negado' }, 403);
    }
    
    const { DB } = c.env;
    const id = c.req.param('id');
    const body = await c.req.json();
    const { season_id, title, description, video_url, duration_minutes, pdf_url } = body;
    
    if (!season_id || !title || !video_url) {
      return c.json({ error: 'Temporada, título e URL do vídeo são obrigatórios' }, 400);
    }
    
    // Generate new slug from title
    const slug = title
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
    
    await DB.prepare(`
      UPDATE lessons 
      SET season_id = ?, title = ?, slug = ?, description = ?, video_url = ?, duration_minutes = ?, pdf_url = ?
      WHERE id = ?
    `).bind(season_id, title, slug, description || null, video_url, duration_minutes || 0, pdf_url || null, id).run();
    
    return c.json({ 
      id,
      season_id,
      title,
      slug,
      description,
      video_url,
      duration_minutes,
      pdf_url
    });
  } catch (error) {
    console.error('Update lesson error:', error);
    return c.json({ error: 'Erro ao atualizar aula' }, 500);
  }
});

// Delete lesson (Admin only)
api.delete('/lessons/:id', async (c) => {
  try {
    const userRole = c.get('userRole');
    if (userRole !== 'admin') {
      return c.json({ error: 'Acesso negado' }, 403);
    }
    
    const { DB } = c.env;
    const id = c.req.param('id');
    
    // Check if lesson exists
    const lesson = await DB.prepare('SELECT id FROM lessons WHERE id = ?').bind(id).first();
    if (!lesson) {
      return c.json({ error: 'Aula não encontrada' }, 404);
    }
    
    // Delete lesson
    await DB.prepare('DELETE FROM lessons WHERE id = ?').bind(id).run();
    
    return c.json({ message: 'Aula deletada com sucesso' });
  } catch (error) {
    console.error('Delete lesson error:', error);
    return c.json({ error: 'Erro ao deletar aula' }, 500);
  }
});

// Mark lesson as completed
api.post('/progress/complete', async (c) => {
  try {
    const userId = c.get('userId');
    const { DB } = c.env;
    const body = await c.req.json();
    const { lesson_id } = body;
    
    if (!lesson_id) {
      return c.json({ error: 'lesson_id é obrigatório' }, 400);
    }
    
    // Check if already completed
    const existing = await DB.prepare(`
      SELECT id FROM user_lesson_progress WHERE user_id = ? AND lesson_id = ?
    `).bind(userId, lesson_id).first();
    
    if (existing) {
      // Update is_completed
      await DB.prepare(`
        UPDATE user_lesson_progress SET is_completed = 1, updated_at = CURRENT_TIMESTAMP WHERE id = ?
      `).bind(existing.id).run();
    } else {
      // Insert new progress
      await DB.prepare(`
        INSERT INTO user_lesson_progress (user_id, lesson_id, is_completed, updated_at)
        VALUES (?, ?, 1, CURRENT_TIMESTAMP)
      `).bind(userId, lesson_id).run();
    }
    
    // Update track progress
    await db.updateLessonProgress(DB, userId, lesson_id, 0, 0, true);
    
    return c.json({ message: 'Aula marcada como concluída', completed: true });
  } catch (error) {
    console.error('Complete lesson error:', error);
    return c.json({ error: 'Erro ao marcar aula como concluída' }, 500);
  }
});

// Mark lesson as incomplete
api.post('/progress/incomplete', async (c) => {
  try {
    const userId = c.get('userId');
    const { DB } = c.env;
    const body = await c.req.json();
    const { lesson_id } = body;
    
    if (!lesson_id) {
      return c.json({ error: 'lesson_id é obrigatório' }, 400);
    }
    
    // Mark as incomplete (update is_completed to 0)
    await DB.prepare(`
      UPDATE user_lesson_progress SET is_completed = 0, updated_at = CURRENT_TIMESTAMP 
      WHERE user_id = ? AND lesson_id = ?
    `).bind(userId, lesson_id).run();
    
    // Update track progress
    await db.updateLessonProgress(DB, userId, lesson_id, 0, 0, false);
    
    return c.json({ message: 'Aula marcada como não concluída', completed: false });
  } catch (error) {
    console.error('Incomplete lesson error:', error);
    return c.json({ error: 'Erro ao marcar aula como não concluída' }, 500);
  }
});

api.get('/tracks/:slug', async (c) => {
  try {
    const slug = c.req.param('slug');
    const userId = c.get('userId');
    const { DB } = c.env;
    
    const track = await db.getTrackBySlug(DB, slug);
    if (!track) {
      return c.json({ error: 'Trilha não encontrada' }, 404);
    }
    
    const trackWithProgress = await db.getTrackWithProgress(DB, track.id, userId);
    const seasons = await db.getSeasonsWithLessons(DB, track.id, userId);
    
    return c.json({
      track: trackWithProgress,
      seasons
    });
  } catch (error) {
    console.error('Get track error:', error);
    return c.json({ error: 'Erro ao buscar trilha' }, 500);
  }
});

api.get('/lessons/:slug', async (c) => {
  try {
    const slug = c.req.param('slug');
    const userId = c.get('userId');
    const { DB } = c.env;
    
    const lesson = await db.getLessonBySlug(DB, slug, userId);
    if (!lesson) {
      return c.json({ error: 'Aula não encontrada' }, 404);
    }
    
    return c.json(lesson);
  } catch (error) {
    console.error('Get lesson error:', error);
    return c.json({ error: 'Erro ao buscar aula' }, 500);
  }
});

api.post('/progress/update', async (c) => {
  try {
    const userId = c.get('userId');
    const { lesson_id, watch_time_seconds, last_position_seconds, is_completed } = 
      await c.req.json<UpdateProgressRequest>();
    
    const { DB } = c.env;
    
    await db.updateLessonProgress(
      DB,
      userId,
      lesson_id,
      watch_time_seconds,
      last_position_seconds,
      is_completed
    );
    
    return c.json({ success: true });
  } catch (error) {
    console.error('Update progress error:', error);
    return c.json({ error: 'Erro ao atualizar progresso' }, 500);
  }
});

// ========================================
// ADMIN API ROUTES
// ========================================
api.use('/admin/*', async (c, next) => {
  const userRole = c.get('userRole');
  
  if (userRole !== 'admin') {
    return c.json({ error: 'Acesso negado - apenas administradores' }, 403);
  }
  
  return next();
});

api.get('/admin/stats', async (c) => {
  try {
    const { DB } = c.env;
    const stats = await db.getAdminStats(DB);
    return c.json(stats);
  } catch (error) {
    console.error('Get admin stats error:', error);
    return c.json({ error: 'Erro ao buscar estatísticas' }, 500);
  }
});

api.get('/admin/users', async (c) => {
  try {
    const { DB } = c.env;
    const users = await db.getAllUsers(DB);
    return c.json(users);
  } catch (error) {
    console.error('Get admin users error:', error);
    return c.json({ error: 'Erro ao buscar usuários' }, 500);
  }
});

// ========================================
// NOTIFICATIONS API ROUTES
// ========================================

// Get user notifications (with read status)
api.get('/notifications', async (c) => {
  try {
    const userId = c.get('userId');
    const { DB } = c.env;
    
    const notifications = await DB.prepare(`
      SELECT 
        n.*,
        CASE WHEN unr.id IS NOT NULL THEN 1 ELSE 0 END as is_read
      FROM notifications n
      LEFT JOIN user_notification_reads unr ON n.id = unr.notification_id AND unr.user_id = ?
      WHERE n.is_active = 1 
        AND (n.expires_at IS NULL OR n.expires_at > datetime('now'))
      ORDER BY n.created_at DESC
      LIMIT 50
    `).bind(userId).all();
    
    return c.json(notifications.results || []);
  } catch (error) {
    console.error('Get notifications error:', error);
    return c.json({ error: 'Erro ao buscar notificações' }, 500);
  }
});

// Mark notification as read
api.post('/notifications/:id/read', async (c) => {
  try {
    const userId = c.get('userId');
    const { DB } = c.env;
    const notificationId = c.req.param('id');
    
    await DB.prepare(`
      INSERT OR IGNORE INTO user_notification_reads (user_id, notification_id)
      VALUES (?, ?)
    `).bind(userId, notificationId).run();
    
    return c.json({ success: true });
  } catch (error) {
    console.error('Mark notification read error:', error);
    return c.json({ error: 'Erro ao marcar notificação como lida' }, 500);
  }
});

// Mark all notifications as read
api.post('/notifications/read-all', async (c) => {
  try {
    const userId = c.get('userId');
    const { DB } = c.env;
    
    // Get all active notification IDs
    const notifications = await DB.prepare(`
      SELECT id FROM notifications 
      WHERE is_active = 1 
        AND (expires_at IS NULL OR expires_at > datetime('now'))
    `).all();
    
    // Insert read records for all
    for (const notif of notifications.results || []) {
      await DB.prepare(`
        INSERT OR IGNORE INTO user_notification_reads (user_id, notification_id)
        VALUES (?, ?)
      `).bind(userId, notif.id).run();
    }
    
    return c.json({ success: true });
  } catch (error) {
    console.error('Mark all notifications read error:', error);
    return c.json({ error: 'Erro ao marcar todas notificações como lidas' }, 500);
  }
});

// ========================================
// ADMIN NOTIFICATIONS ROUTES
// ========================================

// Get all notifications (admin)
api.get('/admin/notifications', async (c) => {
  try {
    const { DB } = c.env;
    
    const notifications = await DB.prepare(`
      SELECT * FROM notifications ORDER BY created_at DESC
    `).all();
    
    return c.json(notifications.results || []);
  } catch (error) {
    console.error('Get admin notifications error:', error);
    return c.json({ error: 'Erro ao buscar notificações' }, 500);
  }
});

// Create notification (admin)
api.post('/admin/notifications', async (c) => {
  try {
    const { DB } = c.env;
    const body = await c.req.json();
    const { title, message, type, icon, link_url, is_active, expires_at } = body;
    
    if (!title || !message) {
      return c.json({ error: 'Título e mensagem são obrigatórios' }, 400);
    }
    
    const result = await DB.prepare(`
      INSERT INTO notifications (title, message, type, icon, link_url, is_active, expires_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).bind(
      title, 
      message, 
      type || 'info', 
      icon || null, 
      link_url || null, 
      is_active !== undefined ? is_active : 1,
      expires_at || null
    ).run();
    
    return c.json({ 
      id: result.meta.last_row_id,
      title,
      message,
      type: type || 'info',
      icon: icon || null,
      link_url: link_url || null,
      is_active: is_active !== undefined ? is_active : 1,
      expires_at: expires_at || null
    }, 201);
  } catch (error) {
    console.error('Create notification error:', error);
    return c.json({ error: 'Erro ao criar notificação' }, 500);
  }
});

// Update notification (admin)
api.put('/admin/notifications/:id', async (c) => {
  try {
    const { DB } = c.env;
    const id = c.req.param('id');
    const body = await c.req.json();
    const { title, message, type, icon, link_url, is_active, expires_at } = body;
    
    if (!title || !message) {
      return c.json({ error: 'Título e mensagem são obrigatórios' }, 400);
    }
    
    await DB.prepare(`
      UPDATE notifications 
      SET title = ?, message = ?, type = ?, icon = ?, link_url = ?, is_active = ?, expires_at = ?
      WHERE id = ?
    `).bind(
      title, 
      message, 
      type || 'info', 
      icon || null, 
      link_url || null, 
      is_active !== undefined ? is_active : 1, 
      expires_at || null, 
      id
    ).run();
    
    return c.json({ success: true });
  } catch (error) {
    console.error('Update notification error:', error);
    return c.json({ error: 'Erro ao atualizar notificação' }, 500);
  }
});

// Delete notification (admin)
api.delete('/admin/notifications/:id', async (c) => {
  try {
    const { DB } = c.env;
    const id = c.req.param('id');
    
    await DB.prepare('DELETE FROM notifications WHERE id = ?').bind(id).run();
    
    return c.json({ success: true });
  } catch (error) {
    console.error('Delete notification error:', error);
    return c.json({ error: 'Erro ao deletar notificação' }, 500);
  }
});

export default api;
