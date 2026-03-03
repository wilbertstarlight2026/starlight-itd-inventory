import { FastifyRequest, FastifyReply } from 'fastify';
import { UserRole } from '@starlight/shared';

export interface JwtPayload {
  sub: string; // user id
  email: string;
  role: UserRole;
  iat: number;
  exp: number;
}

// Augment @fastify/jwt so request.user is typed as JwtPayload
declare module '@fastify/jwt' {
  interface FastifyJWT {
    user: JwtPayload;
  }
}

export async function requireAuth(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  try {
    await request.jwtVerify();
    request.user = request.user as JwtPayload;
  } catch {
    return reply.status(401).send({
      success: false,
      data: null,
      error: 'Unauthorized — invalid or expired token',
    });
  }
}

export function requireRole(...roles: UserRole[]) {
  return async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    await requireAuth(request, reply);
    if (reply.sent) return;

    if (!roles.includes(request.user.role)) {
      return reply.status(403).send({
        success: false,
        data: null,
        error: 'Forbidden — insufficient permissions',
      });
    }
  };
}

export const requireAdmin = requireRole('admin');
export const requireManagerOrAdmin = requireRole('admin', 'manager');
