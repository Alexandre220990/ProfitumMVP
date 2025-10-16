/**
 * ============================================================================
 * HELPERS AFFICHAGE UTILISATEURS - PROFITUM
 * ============================================================================
 * Gestion uniformisée des noms d'utilisateurs
 * Utilise first_name/last_name partout (pas de name legacy)
 */

export interface UserWithName {
  first_name?: string | null;
  last_name?: string | null;
  company_name?: string | null;
  email?: string;
  name?: string | null; // Pour rétrocompatibilité avec les anciens objets
}

/**
 * Affiche le nom complet d'un utilisateur
 * 
 * @param user - Objet utilisateur avec first_name/last_name
 * @returns Nom d'affichage approprié
 * 
 * @example
 * getUserDisplayName({ first_name: 'Jean', last_name: 'Dupont', email: 'j@d.fr' })
 * // → "Jean Dupont"
 * 
 * getUserDisplayName({ company_name: 'ACME Corp', email: 'contact@acme.fr' })
 * // → "ACME Corp"
 */
export const getUserDisplayName = (user: UserWithName): string => {
  // Priorité 1 : first_name + last_name
  if (user.first_name || user.last_name) {
    const fullName = `${user.first_name || ''} ${user.last_name || ''}`.trim();
    if (fullName) return fullName;
  }
  
  // Priorité 2 : company_name
  if (user.company_name?.trim()) {
    return user.company_name.trim();
  }
  
  // Priorité 3 : name (rétrocompatibilité)
  if (user.name?.trim()) {
    return user.name.trim();
  }
  
  // Priorité 4 : email (fallback ultime)
  return user.email || 'Utilisateur';
};

/**
 * Obtient les initiales d'un utilisateur pour avatars
 * 
 * @param user - Objet utilisateur
 * @returns Initiales (ex: "JD" pour Jean Dupont)
 */
export const getUserInitials = (user: UserWithName): string => {
  if (user.first_name && user.last_name) {
    return `${user.first_name.charAt(0)}${user.last_name.charAt(0)}`.toUpperCase();
  }
  
  if (user.first_name) {
    return user.first_name.substring(0, 2).toUpperCase();
  }
  
  if (user.company_name) {
    return user.company_name.substring(0, 2).toUpperCase();
  }
  
  if (user.name) {
    const parts = user.name.split(' ');
    if (parts.length >= 2) {
      return `${parts[0].charAt(0)}${parts[1].charAt(0)}`.toUpperCase();
    }
    return user.name.substring(0, 2).toUpperCase();
  }
  
  if (user.email) {
    return user.email.substring(0, 2).toUpperCase();
  }
  
  return 'U?';
};

