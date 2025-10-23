import type { User, UserPublic } from './types';

// Simple password hashing (in production, use bcrypt or similar)
export async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password + 'hardmedicina-salt');
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  const passwordHash = await hashPassword(password);
  return passwordHash === hash;
}

// Simple JWT-like token generation
export async function generateToken(user: User): Promise<string> {
  const payload = {
    id: user.id,
    email: user.email,
    role: user.role,
    exp: Date.now() + (7 * 24 * 60 * 60 * 1000) // 7 days
  };
  const encoder = new TextEncoder();
  const data = encoder.encode(JSON.stringify(payload));
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const token = btoa(JSON.stringify(payload)) + '.' + hashArray.slice(0, 16).map(b => b.toString(16).padStart(2, '0')).join('');
  return token;
}

export async function verifyToken(token: string): Promise<{ id: number; email: string; role: string } | null> {
  try {
    const [payloadB64] = token.split('.');
    const payload = JSON.parse(atob(payloadB64));
    
    if (payload.exp < Date.now()) {
      return null;
    }
    
    return {
      id: payload.id,
      email: payload.email,
      role: payload.role
    };
  } catch (e) {
    return null;
  }
}

export function sanitizeUser(user: User): UserPublic {
  const { password_hash, ...userPublic } = user;
  return userPublic as UserPublic;
}

// Email validation
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Password validation
export function isValidPassword(password: string): boolean {
  return password.length >= 8;
}
