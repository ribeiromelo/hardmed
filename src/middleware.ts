import { Context } from 'hono';
import * as auth from './auth';
import * as db from './db';
import type { Bindings } from './types';

export async function getUserFromToken(c: Context<{ Bindings: Bindings }>) {
  try {
    // Try to get token from cookie or header
    const authHeader = c.req.header('Authorization');
    const cookieToken = await c.req.header('Cookie')?.match(/auth_token=([^;]+)/)?.[1];
    
    let token = cookieToken;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    }
    
    if (!token) {
      return null;
    }
    
    const payload = await auth.verifyToken(token);
    if (!payload) {
      return null;
    }
    
    const { DB } = c.env;
    const user = await db.getUserById(DB, payload.id);
    
    if (!user) {
      return null;
    }
    
    return auth.sanitizeUser(user);
  } catch (error) {
    console.error('Error getting user from token:', error);
    return null;
  }
}
