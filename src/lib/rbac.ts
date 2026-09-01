import type { UserRole } from '@/lib/supabase/types';

/**
 * Rol hiyerarşisi: admin > moderator > user.
 * requireRole('moderator') çağrısı hem moderator hem admin'i geçirir.
 */
const ROLE_RANK: Record<UserRole, number> = { user: 0, moderator: 1, admin: 2 };

export function hasRole(userRole: UserRole | null | undefined, required: UserRole): boolean {
  if (!userRole) return false;
  return ROLE_RANK[userRole] >= ROLE_RANK[required];
}

export class ForbiddenError extends Error {
  constructor(message = 'Bu işlem için yetkiniz yok.') {
    super(message);
    this.name = 'ForbiddenError';
  }
}

export function assertRole(userRole: UserRole | null | undefined, required: UserRole): void {
  if (!hasRole(userRole, required)) {
    throw new ForbiddenError();
  }
}
