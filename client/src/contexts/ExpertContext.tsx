import { createContext, useContext, ReactNode, useState, useEffect } from "react";
import { config } from '@/config/env';
import { getSupabaseToken } from '@/lib/auth-helpers';

// Types pour l'interface expert
interface ExpertAssignment { id: string;
  dossierId: string;
  clientId: string;
  clientName: string;
  productType: string;
  status: 'pending' | 'accepted' | 'in_progress' | 'completed' | 'cancelled' | 'rejected';
  priority: 'low' | 'medium' | 'high' | 'critical';
  assignedAt: string;
  deadline?: string;
  estimatedDuration?: number;
  progress: number;
  notes?: string;
  documents?: string[];
  compensation?: number;
  compensationPercentage?: number }

interface ExpertNotification { id: string;
  type: 'assignment' | 'deadline' | 'client_message' | 'system' | 'payment';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  priority: 'low' | 'medium' | 'high' | 'critical';
  action?: {
    label: string;
    url: string;
    type: 'link' | 'button' | 'modal'; };
}

interface ExpertWorkflow { id: string;
  dossierId: string;
  step: number;
  totalSteps: number;
  currentStep: {
    name: string;
    description: string;
    status: 'pending' | 'in_progress' | 'completed' | 'blocked' | 'skipped' | 'failed';
    deadline?: string;
    requiredDocuments?: string[]; };
  nextStep?: { name: string;
    description: string;
    requirements?: string[]; };
  history: WorkflowStep[]
}

interface WorkflowStep { id: string;
  name: string;
  description: string;
  status: 'completed' | 'skipped' | 'failed';
  completedAt?: string;
  notes?: string;
  documents?: string[] }

interface ExpertAnalytics { totalAssignments: number;
  completedAssignments: number;
  pendingAssignments: number;
  averageCompletionTime: number;
  totalEarnings: number;
  monthlyEarnings: number;
  clientSatisfaction: number;
  performanceScore: number;
  topProducts: Array<{
    name: string;
    count: number;
    revenue: number; }>;
  recentActivity: Array<{ type: string;
    description: string;
    timestamp: string; }>;
}

interface ExpertPreferences { notifications: {
    email: boolean;
    push: boolean;
    sms: boolean;
    inApp: boolean; };
  availability: { workingHours: {
      start: string;
      end: string; };
    maxAssignments: number;
    preferredProducts: string[];
    autoAccept: boolean; };
  compensation: { minimumRate: number;
    preferredRate: number;
    autoNegotiate: boolean; };
}

interface ExpertContextType { // État
  assignments: ExpertAssignment[];
  notifications: ExpertNotification[];
  workflows: ExpertWorkflow[];
  analytics: ExpertAnalytics | null;
  preferences: ExpertPreferences;
  loading: boolean;
  error: string | null;

  // Actions
  loadAssignments: () => Promise<void>;
  loadNotifications: () => Promise<void>;
  loadWorkflows: () => Promise<void>;
  loadAnalytics: () => Promise<void>;
  loadPreferences: () => Promise<void>;
  
  // Gestion des assignations
  acceptAssignment: (assignmentId: string) => Promise<void>;
  rejectAssignment: (assignmentId: string, reason: string) => Promise<void>;
  updateAssignmentProgress: (assignmentId: string, progress: number, notes?: string) => Promise<void>;
  completeAssignment: (assignmentId: string, documents?: string[]) => Promise<void>;
  
  // Gestion des notifications
  markNotificationAsRead: (notificationId: string) => Promise<void>;
  markAllNotificationsAsRead: () => Promise<void>;
  deleteNotification: (notificationId: string) => Promise<void>;
  
  // Gestion du workflow
  updateWorkflowStep: (workflowId: string, stepData: Partial<WorkflowStep>) => Promise<void>;
  completeWorkflowStep: (workflowId: string, documents?: string[]) => Promise<void>;
  skipWorkflowStep: (workflowId: string, reason: string) => Promise<void>;
  
  // Préférences
  updatePreferences: (updates: Partial<ExpertPreferences>) => Promise<void>;
  
  // Export PDF
  generateAssignmentReport: (assignmentId: string) => Promise<string>;
  generateWorkflowReport: (workflowId: string) => Promise<string>;
  generateAnalyticsReport: (period: string) => Promise<string> }

const ExpertContext = createContext<ExpertContextType | undefined>(undefined);

export const useExpert = () => { const context = useContext(ExpertContext);
  if (context === undefined) {
    throw new Error('useExpert must be used within an ExpertProvider'); }
  return context;
};

interface ExpertProviderProps { children: ReactNode }

export const ExpertProvider: React.FC<ExpertProviderProps> = ({ children }) => { const [assignments, setAssignments] = useState<ExpertAssignment[]>([]);
  const [notifications, setNotifications] = useState<ExpertNotification[]>([]);
  const [workflows, setWorkflows] = useState<ExpertWorkflow[]>([]);
  const [analytics, setAnalytics] = useState<ExpertAnalytics | null>(null);
  const [preferences, setPreferences] = useState<ExpertPreferences>({
    notifications: {
      email: true, push: true, sms: false, inApp: true },
    availability: { workingHours: {
        start: '09:00', end: '18:00' },
      maxAssignments: 5,
      preferredProducts: ['TICPE', 'URSSAF', 'DFS'],
      autoAccept: false
    },
    compensation: { minimumRate: 150, preferredRate: 200, autoNegotiate: true }
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Charger les assignations
  const loadAssignments = async () => { setLoading(true);
    try {
      const response = await fetch(`${config.API_URL}/api/expert/assignments`, {
        headers: {
          'Authorization': `Bearer ${await getSupabaseToken()}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setAssignments(data.data);
        } else {
          setError(data.message || 'Erreur lors du chargement des assignations');
        }
      } else {
        setError('Erreur lors du chargement des assignations');
      }
    } catch (error) { setError('Erreur lors du chargement des assignations');
      console.error('Erreur loadAssignments: ', error); } finally { setLoading(false); }
  };

  // Charger les notifications
  const loadNotifications = async () => { setLoading(true);
    try {
      const response = await fetch(`${config.API_URL}/api/expert/notifications`, {
        headers: {
          'Authorization': `Bearer ${await getSupabaseToken()}`
        }
      });

      if (!response.ok) {
        setError('Erreur lors du chargement des notifications');
        return;
      }

      const data = await response.json();

      if (!data.success) {
        setError(data.message || 'Erreur lors du chargement des notifications');
        return;
      }

      const payload = Array.isArray(data.data)
        ? data.data
        : data.data?.notifications || [];

      setNotifications(payload);
    } catch (error) { setError('Erreur lors du chargement des notifications');
      console.error('Erreur loadNotifications: ', error); } finally { setLoading(false); }
  };

  // Charger les workflows
  const loadWorkflows = async () => { setLoading(true);
    try {
      const response = await fetch(`${config.API_URL}/api/expert/assignments`, {
        headers: {
          'Authorization': `Bearer ${await getSupabaseToken()}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          // Convertir les assignations en workflows
          const workflows = data.data.map((assignment: any) => ({
            id: assignment.id,
            type: 'audit',
            title: assignment.audit?.type || 'Audit',
            status: assignment.status,
            client: assignment.client,
            deadline: assignment.deadline,
            priority: assignment.priority || 'normal'
          }));
          setWorkflows(workflows);
        } else {
          setError(data.message || 'Erreur lors du chargement des workflows');
        }
      } else {
        setError('Erreur lors du chargement des workflows');
      }
    } catch (error) { setError('Erreur lors du chargement des workflows');
      console.error('Erreur loadWorkflows: ', error); } finally { setLoading(false); }
  };

  // Charger les analytics
  const loadAnalytics = async () => { setLoading(true);
    try {
      const response = await fetch(`${config.API_URL}/api/expert/analytics`, {
        headers: {
          'Authorization': `Bearer ${await getSupabaseToken()}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setAnalytics(data.data);
        } else {
          setError(data.message || 'Erreur lors du chargement des analytics');
        }
      } else {
        setError('Erreur lors du chargement des analytics');
      }
    } catch (error) { setError('Erreur lors du chargement des analytics');
      console.error('Erreur loadAnalytics: ', error); } finally { setLoading(false); }
  };

  // Charger les préférences
  const loadPreferences = async () => { try {
      // TODO: Charger depuis l'API
      console.log('Préférences chargées'); } catch (error) { setError('Erreur lors du chargement des préférences');
      console.error('Erreur loadPreferences: ', error); }
  };

  // Accepter une assignation
  const acceptAssignment = async (assignmentId: string) => { setLoading(true);
    try {
      const response = await fetch(`${config.API_URL}/api/expert/assignments/${assignmentId}/accept`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${await getSupabaseToken()}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          // Mettre à jour la liste des assignations
          await loadAssignments();
        } else {
          setError(data.message || 'Erreur lors de l\'acceptation');
        }
      } else {
        setError('Erreur lors de l\'acceptation');
      }
    } catch (error) { setError('Erreur lors de l\'acceptation');
      console.error('Erreur acceptAssignment: ', error); } finally { setLoading(false); }
  };

  // Rejeter une assignation
  const rejectAssignment = async (assignmentId: string, reason: string) => { setLoading(true);
    try {
      const response = await fetch(`${config.API_URL}/api/expert/assignments/${assignmentId}/reject`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${await getSupabaseToken()}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ reason })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          // Mettre à jour la liste des assignations
          await loadAssignments();
        } else {
          setError(data.message || 'Erreur lors du rejet');
        }
      } else {
        setError('Erreur lors du rejet');
      }
    } catch (error) { setError('Erreur lors du rejet');
      console.error('Erreur rejectAssignment: ', error); } finally { setLoading(false); }
  };

  // Mettre à jour le progrès
  const updateAssignmentProgress = async (assignmentId: string, progress: number, notes?: string) => { setLoading(true);
    try {
      const response = await fetch(`${config.API_URL}/api/expert/assignments/${assignmentId}/progress`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${await getSupabaseToken()}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ progress, notes })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          // Mettre à jour la liste des assignations
          await loadAssignments();
        } else {
          setError(data.message || 'Erreur lors de la mise à jour');
        }
      } else {
        setError('Erreur lors de la mise à jour');
      }
    } catch (error) { setError('Erreur lors de la mise à jour');
      console.error('Erreur updateAssignmentProgress: ', error); } finally { setLoading(false); }
  };

  // Terminer une assignation
  const completeAssignment = async (assignmentId: string, documents?: string[]) => { setLoading(true);
    try {
      const response = await fetch(`${config.API_URL}/api/expert/assignments/${assignmentId}/complete`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${await getSupabaseToken()}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ documents })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          // Mettre à jour la liste des assignations
          await loadAssignments();
        } else {
          setError(data.message || 'Erreur lors de la finalisation');
        }
      } else {
        setError('Erreur lors de la finalisation');
      }
    } catch (error) { setError('Erreur lors de la finalisation');
      console.error('Erreur completeAssignment: ', error); } finally { setLoading(false); }
  };

  // Marquer une notification comme lue
  const markNotificationAsRead = async (notificationId: string) => { setLoading(true);
    try {
      const response = await fetch(`${config.API_URL}/api/expert/notifications/${notificationId}/read`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${await getSupabaseToken()}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          // Mettre à jour la liste des notifications
          await loadNotifications();
        } else {
          setError(data.message || 'Erreur lors du marquage');
        }
      } else {
        setError('Erreur lors du marquage');
      }
    } catch (error) { setError('Erreur lors du marquage');
      console.error('Erreur markNotificationAsRead: ', error); } finally { setLoading(false); }
  };

  // Marquer toutes les notifications comme lues
  const markAllNotificationsAsRead = async () => { try {
      setNotifications(prev => 
        prev.map(notification => ({ ...notification, read: true }))
      );
      
      // TODO: Appel API
      console.log('Toutes les notifications marquées comme lues'); } catch (error) { setError('Erreur lors du marquage des notifications');
      console.error('Erreur markAllNotificationsAsRead: ', error); }
  };

  // Supprimer une notification
  const deleteNotification = async (notificationId: string) => { try {
      setNotifications(prev => 
        prev.filter(notification => notification.id !== notificationId)
      );
      
      // TODO: Appel API
      console.log('Notification supprimée: ', notificationId); } catch (error) { setError('Erreur lors de la suppression de la notification');
      console.error('Erreur deleteNotification: ', error); }
  };

  // Mettre à jour une étape du workflow
  const updateWorkflowStep = async (workflowId: string, stepData: Partial<WorkflowStep>) => { try {
      setWorkflows(prev => 
        prev.map(workflow => 
          workflow.id === workflowId 
            ? {
                ...workflow, currentStep: {
                  ...workflow.currentStep, ...stepData }
              }
            : workflow
        )
      );
      
      // TODO: Appel API
      console.log('Workflow mis à jour: ', workflowId);
    } catch (error) { setError('Erreur lors de la mise à jour du workflow');
      console.error('Erreur updateWorkflowStep: ', error); }
  };

  // Terminer une étape du workflow
  const completeWorkflowStep = async (workflowId: string, documents?: string[]) => { try {
      setWorkflows(prev => 
        prev.map(workflow => 
          workflow.id === workflowId 
            ? {
                ...workflow, step: workflow.step + 1, history: [
                  ...workflow.history, {
                    id: `step${workflow.step}`,
                    name: workflow.currentStep.name,
                    description: workflow.currentStep.description,
                    status: 'completed',
                    completedAt: new Date().toISOString(),
                    documents
                  }
                ]
              }
            : workflow
        )
      );
      
      // TODO: Appel API
      console.log('Étape du workflow terminée: ', workflowId);
    } catch (error) { setError('Erreur lors de la finalisation de l\'étape');
      console.error('Erreur completeWorkflowStep: ', error); }
  };

  // Passer une étape du workflow
  const skipWorkflowStep = async (workflowId: string, reason: string) => { try {
      setWorkflows(prev => 
        prev.map(workflow => 
          workflow.id === workflowId 
            ? {
                ...workflow, step: workflow.step + 1, history: [
                  ...workflow.history, {
                    id: `step${workflow.step}`,
                    name: workflow.currentStep.name,
                    description: workflow.currentStep.description,
                    status: 'skipped',
                    completedAt: new Date().toISOString(),
                    notes: reason
                  }
                ]
              }
            : workflow
        )
      );
      
      // TODO: Appel API
      console.log('Étape du workflow passée: ', workflowId, reason);
    } catch (error) { setError('Erreur lors du passage de l\'étape');
      console.error('Erreur skipWorkflowStep: ', error); }
  };

  // Mettre à jour les préférences
  const updatePreferences = async (updates: Partial<ExpertPreferences>) => { try {
      setPreferences(prev => ({ ...prev, ...updates }));
      
      // TODO: Appel API
      console.log('Préférences mises à jour: ', updates);
    } catch (error) { setError('Erreur lors de la mise à jour des préférences');
      console.error('Erreur updatePreferences: ', error); }
  };

  // Générer un rapport d'assignation
  const generateAssignmentReport = async (assignmentId: string): Promise<string> => { try {
      // TODO: Appel API pour générer le PDF
      const downloadUrl = `${config.API_URL}/api/expert/assignments/${assignmentId}/report`;
      console.log('Rapport d\'assignation généré:', assignmentId);
      return downloadUrl;
    } catch (error) { setError('Erreur lors de la génération du rapport');
      console.error('Erreur generateAssignmentReport: ', error);
      throw error; }
  };

  // Générer un rapport de workflow
  const generateWorkflowReport = async (workflowId: string): Promise<string> => { try {
      // TODO: Appel API pour générer le PDF
      const downloadUrl = `${config.API_URL}/api/expert/workflows/${workflowId}/report`;
      console.log('Rapport de workflow généré:', workflowId);
      return downloadUrl;
    } catch (error) { setError('Erreur lors de la génération du rapport');
      console.error('Erreur generateWorkflowReport: ', error);
      throw error; }
  };

  // Générer un rapport d'analytics
  const generateAnalyticsReport = async (period: string): Promise<string> => { try {
      // TODO: Appel API pour générer le PDF
      const downloadUrl = `${config.API_URL}/api/expert/analytics/report?period=${period}`;
      console.log('Rapport d\'analytics généré:', period);
      return downloadUrl;
    } catch (error) { setError('Erreur lors de la génération du rapport');
      console.error('Erreur generateAnalyticsReport: ', error);
      throw error; }
  };

  // Charger les données au montage
  useEffect(() => { loadAssignments();
    loadNotifications();
    loadWorkflows();
    loadAnalytics();
    loadPreferences(); }, []);

  const value: ExpertContextType = { // État
    assignments, notifications, workflows, analytics, preferences, loading, error, // Actions
    loadAssignments, loadNotifications, loadWorkflows, loadAnalytics, loadPreferences, // Gestion des assignations
    acceptAssignment, rejectAssignment, updateAssignmentProgress, completeAssignment, // Gestion des notifications
    markNotificationAsRead, markAllNotificationsAsRead, deleteNotification, // Gestion du workflow
    updateWorkflowStep, completeWorkflowStep, skipWorkflowStep, // Préférences
    updatePreferences, // Export PDF
    generateAssignmentReport, generateWorkflowReport, generateAnalyticsReport };

  return (
    <ExpertContext.Provider value={ value }>
      { children }
    </ExpertContext.Provider>
  );
}; 