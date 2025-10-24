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
  
  const authHeader = c.req.header('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({ error: 'Token não fornecido' }, 401);
  }
  
  const token = authHeader.substring(7);
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
    const { specialty_id, title, description, total_lessons, duration_minutes } = body;
    
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
      INSERT INTO tracks (specialty_id, title, slug, description, total_lessons, duration_minutes)
      VALUES (?, ?, ?, ?, ?, ?)
    `).bind(specialty_id, title, slug, description || null, total_lessons || 0, duration_minutes || 0).run();
    
    return c.json({ 
      id: result.meta.last_row_id,
      specialty_id,
      title,
      slug,
      description,
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
    const { specialty_id, title, description, total_lessons, duration_minutes } = body;
    
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
      SET specialty_id = ?, title = ?, slug = ?, description = ?, total_lessons = ?, duration_minutes = ?
      WHERE id = ?
    `).bind(specialty_id, title, slug, description || null, total_lessons || 0, duration_minutes || 0, id).run();
    
    return c.json({ 
      id,
      specialty_id,
      title,
      slug,
      description,
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

export default api;
