import { AuthUser } from '../types/auth';

export const redirectToDashboard = (user: AuthUser | null | undefined) => {
  if (!user?.id || !user?.type) {
    return '/';
  }

  const simId = localStorage.getItem("simulationId");
  if (simId) {
    localStorage.removeItem("simulationId");
    return `/simulateur?simulationId=${simId}`;
  }

  return `/dashboard/${user.type}/${user.id}`;
}; 