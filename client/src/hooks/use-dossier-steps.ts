import { useState, useCallback, useEffect } from 'react';
import api from '../lib/api';

export interface DossierStep {
  id: string;
  dossier_id: string;
  dossier_name: string;
  step_name: string;
  step_type: 'validation' | 'documentation' | 'expertise' | 'approval' | 'payment';
  due_date: string;
  status: 'pending' | 'in_progress' | 'completed' | 'overdue';
  priority: 'low' | 'medium' | 'high' | 'critical';
  progress: number;
  assignee_id?: string;
  assignee_name?: string;
  assignee_type?: 'client' | 'expert' | 'admin';
  estimated_duration_minutes: number;
  dependencies?: string[];
  metadata?: any;
  created_at: string;
  updated_at: string;
}

interface UseDossierStepsReturn {
  steps: DossierStep[];
  loading: boolean;
  error: string | null;
  generateSteps: (dossierId: string) => Promise<boolean>;
  updateStep: (stepId: string, updates: Partial<DossierStep>) => Promise<boolean>;
  refreshSteps: () => void;
  totalSteps: number;
  completedSteps: number;
  inProgressSteps: number;
  pendingSteps: number;
  overallProgress: number;
}

export const useDossierSteps = (dossierId?: string): UseDossierStepsReturn => {
  const [steps, setSteps] = useState<DossierStep[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSteps = useCallback(async () => {
    if (!dossierId) {
      setSteps([]);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await api.get(`/api/dossier-steps/${dossierId}`);
      
      if (response.data.success) {
        setSteps(response.data.data || []);
      } else {
        setError(response.data.message || 'Erreur lors de la récupération des étapes');
      }
    } catch (err: any) {
      console.error('❌ Erreur récupération des étapes:', err);
      setError('Erreur de connexion');
    } finally {
      setLoading(false);
    }
  }, [dossierId]);

  const generateSteps = useCallback(async (dossierId: string): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);

      const response = await api.post('/api/dossier-steps/generate', { dossier_id: dossierId });
      
      if (response.data.success) {
        // Recharger les étapes après génération
        await fetchSteps();
        return true;
      } else {
        setError(response.data.message || 'Erreur lors de la génération des étapes');
        return false;
      }
    } catch (err: any) {
      console.error('❌ Erreur génération des étapes:', err);
      setError('Erreur de connexion');
      return false;
    } finally {
      setLoading(false);
    }
  }, [fetchSteps]);

  const updateStep = useCallback(async (stepId: string, updates: Partial<DossierStep>): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);

      const response = await api.put(`/api/dossier-steps/${stepId}`, updates);
      
      if (response.data.success) {
        // Mettre à jour l'étape dans le state
        setSteps(prev => prev.map(step => 
          step.id === stepId ? { ...step, ...response.data.data } : step
        ));
        return true;
      } else {
        setError(response.data.message || 'Erreur lors de la mise à jour de l\'étape');
        return false;
      }
    } catch (err: any) {
      console.error('❌ Erreur mise à jour étape:', err);
      setError('Erreur de connexion');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshSteps = useCallback(() => {
    fetchSteps();
  }, [fetchSteps]);

  // Calculs dérivés
  const totalSteps = steps.length;
  const completedSteps = steps.filter(step => step.status === 'completed').length;
  const inProgressSteps = steps.filter(step => step.status === 'in_progress').length;
  const pendingSteps = steps.filter(step => step.status === 'pending').length;
  const overallProgress = totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0;

  // Charger les étapes au montage et quand dossierId change
  useEffect(() => {
    fetchSteps();
  }, [fetchSteps]);

  return {
    steps,
    loading,
    error,
    generateSteps,
    updateStep,
    refreshSteps,
    totalSteps,
    completedSteps,
    inProgressSteps,
    pendingSteps,
    overallProgress
  };
};

// Hook pour générer automatiquement les étapes pour tous les dossiers éligibles
export const useGenerateAllSteps = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateAllSteps = useCallback(async (): Promise<{ success: number; failed: number } | null> => {
    try {
      setLoading(true);
      setError(null);

      const response = await api.post('/api/dossier-steps/generate-all');
      
      if (response.data.success) {
        return response.data.data;
      } else {
        setError(response.data.message || 'Erreur lors de la génération des étapes');
        return null;
      }
    } catch (err: any) {
      console.error('❌ Erreur génération globale:', err);
      setError('Erreur de connexion');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    generateAllSteps,
    loading,
    error
  };
}; 