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
    
    // Delete related data first (cascade)
    await DB.prepare('DELETE FROM user_progress WHERE lesson_id IN (SELECT id FROM lessons WHERE track_id = ?)').bind(id).run();
    await DB.prepare('DELETE FROM lessons WHERE track_id = ?').bind(id).run();
    await DB.prepare('DELETE FROM tracks WHERE id = ?').bind(id).run();
    
    return c.json({ message: 'Trilha deletada com sucesso' });
  } catch (error) {
    console.error('Delete track error:', error);
    return c.json({ error: 'Erro ao deletar trilha' }, 500);
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
