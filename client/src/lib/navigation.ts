import { AuthUser } from '../types/auth';

export function redirectToDashboard(user: AuthUser): string {
  if (user.type === 'expert') {
    return `/dashboard-expert/${user.id}`;
  } else {
    return `/dashboard/client/${user.id}`;
  }
} 