export interface ClientDocument {
  id: string;
  type: 'charte' | 'audit' | 'simulation' | 'guide';
  title: string;
  date: string;
  status: string;
  url?: string;
  metadata: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface CharteDocument {
  id: string;
  produit: string;
  dateSignature: string;
  statut: 'signée' | 'en_attente' | 'en_cours';
  status?: 'signée' | 'en_attente' | 'en_cours'; // Alias pour compatibilité
  expert?: string;
  gainsPotentiels: number;
  clientProduitEligibleId: string;
  ipAddress?: string;
  userAgent?: string;
}

export interface AuditDocument {
  id: string;
  auditId: string;
  name: string;
  type: string;
  url: string;
  createdAt: string;
  updatedAt: string;
  status?: string; // Ajout pour compatibilité
  audit?: {
    audit_type: string;
    status: string;
    potential_gain: number;
    obtained_gain: number;
    expert?: {
      name: string;
      company: string;
    };
  };
}

export interface SimulationDocument {
  id: string;
  clientId: string;
  dateSimulation: string;
  produitEligible: string;
  scoreEligibilite: number;
  gainsEstimés: number;
  statut: 'complétée' | 'en_cours';
  status?: 'complétée' | 'en_cours'; // Alias pour compatibilité
  commentaires?: string;
  tauxInteret?: number;
  montantMaximal?: number;
  dureeMaximale?: number;
}

export interface GuideDocument {
  id: string;
  title: string;
  category: 'business' | 'technical';
  description: string;
  content: string;
  tags: string[];
  readTime: number;
  filePath: string;
  lastModified: string;
  status?: string; // Ajout pour compatibilité
}

export interface DocumentFilters {
  type?: 'charte' | 'audit' | 'simulation' | 'guide' | 'all';
  status?: string;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
}

export interface DocumentStats {
  // Propriétés principales
  totalDocuments: number;
  totalChartes: number;
  chartesSignees: number;
  totalAudits: number;
  auditsEnCours: number;
  totalSimulations: number;
  simulationsCompletees: number;
  totalGuides: number;
  gainsPotentiels: number;
  
  // Propriétés pour les fichiers
  total_files: number;
  total_size: number;
  files_by_category: { [key: string]: number };
  files_by_status: { [key: string]: number };
  recent_uploads: number;
  
  // Propriétés de compatibilité
  total?: number;
  chartes?: number;
  audits?: number;
  simulations?: number;
  guides?: number;
  recentDocuments?: number;
} 