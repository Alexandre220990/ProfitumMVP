export interface Document { 
  id: string; // UUID au lieu de number
  title: string; // Au lieu de nom
  category: 'business' | 'technical'; // Valeurs autorisées pour GEDDocument
  file_path?: string; // Au lieu de url, optionnel
  description?: string; // Ajouté pour correspondre à GEDDocument
  content?: string; // Ajouté pour correspondre à GEDDocument
  created_by?: string; // Ajouté pour correspondre à GEDDocument
  is_active?: boolean; // Ajouté pour correspondre à GEDDocument
  read_time?: number; // Ajouté pour correspondre à GEDDocument
  version?: number; // Ajouté pour correspondre à GEDDocument
  created_at: string; // Au lieu de createdAt
  updated_at?: string; // Au lieu de updatedAt, optionnel
  // Champs de compatibilité pour l'ancienne interface
  nom?: string; // Alias pour title (déprécié)
  type?: string; // Alias pour category (déprécié)
  url?: string; // Alias pour file_path (déprécié)
  auditId?: string; // Gardé pour compatibilité
  createdAt?: string; // Alias pour created_at (déprécié)
  updatedAt?: string; // Alias pour updated_at (déprécié)
} 