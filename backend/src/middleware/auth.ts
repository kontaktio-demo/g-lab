import { type Request, type Response, type NextFunction } from 'express';
import { supabaseAdmin } from '../supabase.js';
import { UnauthorizedError } from '../utils/errors.js';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email?: string;
        role?: string;
      };
      accessToken?: string;
    }
  }
}

/**
 * Wymaga ważnego JWT od Supabase Auth w nagłówku `Authorization: Bearer <token>`.
 * Po pozytywnej weryfikacji uzupełnia `req.user` i `req.accessToken`.
 */
export async function requireAuth(req: Request, _res: Response, next: NextFunction): Promise<void> {
  try {
    const header = req.header('authorization') ?? req.header('Authorization');
    if (!header || !header.toLowerCase().startsWith('bearer ')) {
      throw new UnauthorizedError('Brak nagłówka Authorization: Bearer <token>.');
    }
    const token = header.slice(7).trim();
    if (!token) throw new UnauthorizedError('Pusty token.');

    // supabaseAdmin.auth.getUser(token) waliduje sygnaturę JWT lokalnie + sprawdza usera.
    const { data, error } = await supabaseAdmin.auth.getUser(token);
    if (error || !data?.user) throw new UnauthorizedError('Token jest niepoprawny lub wygasł.');

    req.user = {
      id: data.user.id,
      email: data.user.email ?? undefined,
      role: (data.user.role as string | undefined) ?? undefined,
    };
    req.accessToken = token;
    next();
  } catch (err) {
    next(err);
  }
}
