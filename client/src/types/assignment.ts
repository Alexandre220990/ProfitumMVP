// Types pour les assignations expert

export interface Assignment {
  id: string;
  expert_id: string;
  client_id: string;
  produit_id?: string;
  status: 'pending' | 'accepted' | 'in_progress' | 'completed' | 'cancelled' | 'rejected';
  assignment_date: string;
  accepted_date?: string;
  completed_date?: string;
  compensation_amount?: number;
  compensation_status?: string;
  priority?: 'low' | 'normal' | 'high' | 'urgent';
  progress?: number;
  client_rating?: number;
  client_feedback?: string;
  expert_rating?: number;
  expert_feedback?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  
  // Propriétés pour compatibilité avec l'ancien format
  clientName?: string;
  productType?: string;
  estimatedGain?: number;
  deadline?: string;
  
  // Relations avec les autres tables
  Client?: {
    id: string;
    name?: string;
    email: string;
    company_name?: string;
  };
  ProduitEligible?: {
    id: string;
    nom: string;
    description?: string;
  };
  Expert?: {
    id: string;
    name: string;
    company_name?: string;
    email: string;
  };
}

export interface AssignmentStats {
  total: number;
  pending: number;
  accepted: number;
  in_progress: number;
  completed: number;
  cancelled: number;
  totalEarnings: number;
  averageRating: number;
  completionRate: number;
}

export interface AssignmentFilter {
  status?: string;
  priority?: string;
  productType?: string;
  dateRange?: {
    start: string;
    end: string;
  };
  searchTerm?: string;
}

export interface AssignmentAction {
  id: string;
  type: 'accept' | 'reject' | 'start' | 'complete' | 'cancel';
  reason?: string;
  notes?: string;
} 