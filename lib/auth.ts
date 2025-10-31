import type { Session } from '@supabase/supabase-js';

const APP_ROLE_KEY = 'app_role';
const ADMIN_ROLE = 'admin';

const extractRole = (session: Session | null) => {
  if (!session) return null;
  const metadataCandidates = [
    session.user.app_metadata,
    session.user.user_metadata
  ];

  for (const metadata of metadataCandidates) {
    if (metadata && typeof metadata === 'object') {
      const role = (metadata as Record<string, unknown>)[APP_ROLE_KEY];
      if (typeof role === 'string') {
        return role;
      }
    }
  }

  return null;
};

export const getSessionRole = (session: Session | null) => extractRole(session);

export const isAdminSession = (session: Session | null) => extractRole(session) === ADMIN_ROLE;
