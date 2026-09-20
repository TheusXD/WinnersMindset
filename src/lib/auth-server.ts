import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { query } from '@/lib/db';

const JWT_SECRET = process.env.JWT_SECRET || 'legionarios_jwt_secret_key_default_production_2026';
const TOKEN_EXPIRY = '7d';

export interface TokenPayload {
  id: string;
  email: string;
  cargo: 'treinador' | 'auxiliar' | 'atleta';
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function signToken(payload: TokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: TOKEN_EXPIRY });
}

export function verifyToken(token: string): TokenPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as TokenPayload;
  } catch {
    return null;
  }
}

/**
 * Extracts session user from either Authorization header (Bearer) or auth_token Cookie
 */
export async function getSessionUser(request: Request): Promise<TokenPayload | null> {
  let token: string | null = null;

  // 1. Check Authorization header
  const authHeader = request.headers.get('authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7).trim();
  }

  // 2. Check Cookie header
  if (!token) {
    const cookieHeader = request.headers.get('cookie') || '';
    const match = cookieHeader.match(/auth_token=([^;]+)/);
    if (match) {
      token = decodeURIComponent(match[1]);
    }
  }

  if (!token) {
    return null;
  }

  const payload = verifyToken(token);
  if (!payload || !payload.id) {
    return null;
  }

  // Verify the user still exists in database and has current cargo
  try {
    const users = await query<any>(
      `SELECT u.id, u.email, COALESCE(p.cargo, 'atleta') as cargo 
       FROM usuarios u 
       LEFT JOIN perfis_usuarios p ON p.id = u.id 
       WHERE u.id = ? LIMIT 1`,
      [payload.id]
    );

    if (!users || users.length === 0) {
      return null;
    }

    return {
      id: users[0].id,
      email: users[0].email,
      cargo: users[0].cargo,
    };
  } catch (error) {
    console.error('Error verifying session user:', error);
    // If DB is temporarily unreachable, fallback to verified token payload
    return payload;
  }
}
