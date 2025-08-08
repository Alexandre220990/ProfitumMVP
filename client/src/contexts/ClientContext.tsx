import { createContext, useContext, ReactNode, useState } from "react";

// Types pour l'interface client
interface ClientDossier { id: string;
  productType: string;
  status: 'draft' | 'submitted' | 'in_progress' | 'review' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'critical';
  createdAt: string;
  updatedAt: string;
  deadline?: string;
  estimatedCompletion?: string;
  progress: number;
  expertId?: string;
  expertName?: string;
  documents: ClientDocument[];
  notes?: string;
  estimatedSavings?: number;
  actualSavings?: number;
  fees?: number }

interface ClientDocument { id: string;
  name: string;
  type: 'contract' | 'invoice' | 'certificate' | 'report' | 'form' | 'other';
  status: 'pending' | 'uploaded' | 'validated' | 'rejected';
  uploadedAt?: string;
  validatedAt?: string;
  fileSize?: number;
  url?: string;
  required: boolean;
  description?: string }

interface ClientWorkflow { id: string;
  dossierId: string;
  step: number;
  totalSteps: number;
  currentStep: {
    name: string;
    description: string;
    status: 'pending' | 'in_progress' | 'completed' | 'blocked';
    deadline?: string;
    requiredDocuments?: string[];
    instructions?: string; };
  nextStep?: { name: string;
    description: string;
    requirements?: string[]; };
  history: ClientWorkflowStep[]
}

interface ClientWorkflowStep { id: string;
  name: string;
  description: string;
  status: 'completed' | 'skipped' | 'failed' | 'pending';
  completedAt?: string;
  notes?: string;
  documents?: string[];
  expertNotes?: string }

interface ClientNotification { id: string;
  type: 'dossier_update' | 'expert_message' | 'document_required' | 'deadline' | 'payment' | 'system';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  priority: 'low' | 'medium' | 'high' | 'critical';
  action?: {
    label: string;
    url: string;
    type: 'link' | 'button' | 'modal'; };
  dossierId?: string;
  expertId?: string;
}

interface ClientMessage { id: string;
  dossierId: string;
  senderId: string;
  senderType: 'client' | 'expert' | 'system';
  senderName: string;
  content: string;
  timestamp: string;
  read: boolean;
  attachments?: MessageAttachment[];
  messageType: 'text' | 'document' | 'image' | 'system';
  replyTo?: string }

interface MessageAttachment { id: string;
  name: string;
  type: string;
  size: number;
  url: string;
  uploadedAt: string }

interface ClientConversation { id: string;
  dossierId: string;
  expertId: string;
  expertName: string;
  expertAvatar?: string;
  lastMessage?: ClientMessage;
  unreadCount: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string }

interface ClientAnalytics { totalDossiers: number;
  activeDossiers: number;
  completedDossiers: number;
  totalSavings: number;
  averageSavings: number;
  totalFees: number;
  satisfactionScore: number;
  responseTime: number;
  topProducts: Array<{
    name: string;
    count: number;
    savings: number; }>;
  recentActivity: Array<{ type: string;
    description: string;
    timestamp: string; }>;
}

interface ClientPreferences { notifications: {
    email: boolean;
    push: boolean;
    sms: boolean;
    inApp: boolean; };
  messaging: { autoRead: boolean;
    soundEnabled: boolean;
    desktopNotifications: boolean;
    typingIndicators: boolean; };
  theme: { mode: 'light' | 'dark' | 'auto';
    primaryColor: string;
    fontSize: 'small' | 'medium' | 'large'; };
  privacy: { showOnlineStatus: boolean;
    allowDirectMessages: boolean;
    shareAnalytics: boolean; };
}

interface ClientContextType { // État
  dossiers: ClientDossier[];
  workflows: ClientWorkflow[];
  notifications: ClientNotification[];
  conversations: ClientConversation[];
  messages: ClientMessage[];
  analytics: ClientAnalytics | null;
  preferences: ClientPreferences;
  loading: boolean;
  error: string | null;

  // Actions
  loadDossiers: () => Promise<void>;
  loadWorkflows: () => Promise<void>;
  loadNotifications: () => Promise<void>;
  loadConversations: () => Promise<void>;
  loadMessages: (dossierId: string) => Promise<void>;
  loadAnalytics: () => Promise<void>;
  loadPreferences: () => Promise<void>;
  
  // Gestion des dossiers
  createDossier: (dossierData: Partial<ClientDossier>) => Promise<string>;
  updateDossier: (dossierId: string, updates: Partial<ClientDossier>) => Promise<void>;
  cancelDossier: (dossierId: string, reason: string) => Promise<void>;
  uploadDocument: (dossierId: string, document: File) => Promise<void>;
  
  // Gestion du workflow
  completeWorkflowStep: (workflowId: string, documents?: string[]) => Promise<void>;
  skipWorkflowStep: (workflowId: string, reason: string) => Promise<void>;
  
  // Gestion des notifications
  markNotificationAsRead: (notificationId: string) => Promise<void>;
  markAllNotificationsAsRead: () => Promise<void>;
  deleteNotification: (notificationId: string) => Promise<void>;
  
  // Messagerie instantanée
  sendMessage: (dossierId: string, content: string, attachments?: File[]) => Promise<void>;
  markMessageAsRead: (messageId: string) => Promise<void>;
  markConversationAsRead: (conversationId: string) => Promise<void>;
  startConversation: (dossierId: string, expertId: string) => Promise<string>;
  endConversation: (conversationId: string) => Promise<void>;
  
  // Préférences
  updatePreferences: (updates: Partial<ClientPreferences>) => Promise<void>;
  
  // Export PDF
  generateDossierReport: (dossierId: string) => Promise<string>;
  generateWorkflowReport: (workflowId: string) => Promise<string>;
  generateAnalyticsReport: (period: string) => Promise<string> }

const ClientContext = createContext<ClientContextType | undefined>(undefined);

export const useClient = () => { const context = useContext(ClientContext);
  if (context === undefined) {
    throw new Error('useClient must be used within a ClientProvider'); }
  return context;
};

interface ClientProviderProps { children: ReactNode }

export const ClientProvider: React.FC<ClientProviderProps> = ({ children }) => { const [dossiers, setDossiers] = useState<ClientDossier[]>([]);
  const [workflows, setWorkflows] = useState<ClientWorkflow[]>([]);
  const [notifications, setNotifications] = useState<ClientNotification[]>([]);
  const [conversations, setConversations] = useState<ClientConversation[]>([]);
  const [messages, setMessages] = useState<ClientMessage[]>([]);
  const [analytics, setAnalytics] = useState<ClientAnalytics | null>(null);
  const [preferences, setPreferences] = useState<ClientPreferences>({
    notifications: {
      email: true, push: true, sms: false, inApp: true },
    messaging: { autoRead: true, soundEnabled: true, desktopNotifications: true, typingIndicators: true },
    theme: { mode: 'auto', primaryColor: '#2563eb', fontSize: 'medium' },
    privacy: { showOnlineStatus: true, allowDirectMessages: true, shareAnalytics: true }
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Charger les dossiers
  const loadDossiers = async () => { 
    setLoading(true);
    try {
      // TODO: Remplacer par l'API réelle
      setDossiers([]);
    } catch (error) { 
      setError('Erreur lors du chargement des dossiers');
      console.error('Erreur loadDossiers: ', error); 
    } finally { 
      setLoading(false); 
    }
  };

  // Charger les workflows
  const loadWorkflows = async () => { try {
      const mockWorkflows: ClientWorkflow[] = [
        {
          id: '1', dossierId: '1', step: 3, totalSteps: 5, currentStep: {
            name: 'Analyse des documents, ', description: 'L\'expert analyse les documents fournis, ', status: 'in_progress', deadline: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(), instructions: 'Veuillez fournir les documents manquants pour accélérer le traitement' },
          nextStep: { name: 'Validation finale, ', description: 'Validation et finalisation du dossier, ', requirements: ['documents_complets, ', 'validation_client'] },
          history: [
            { id: 'step1', name: 'Soumission du dossier', description: 'Dossier soumis avec succès', status: 'completed', completedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString() },
            { id: 'step2', name: 'Assignation expert', description: 'Expert Marie Martin assigné', status: 'completed', completedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString() }
          ]
        }
      ];

      setWorkflows(mockWorkflows);
    } catch (error) { setError('Erreur lors du chargement des workflows');
      console.error('Erreur loadWorkflows: ', error); }
  };

  // Charger les notifications
  const loadNotifications = async () => { try {
      const mockNotifications: ClientNotification[] = [
        {
          id: '1', type: 'expert_message', title: 'Nouveau message de Marie Martin', message: 'J\'ai besoin de documents supplémentaires pour finaliser votre dossier TICPE', timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(), read: false, priority: 'high', action: {
            label: 'Voir le message', url: '/messagerie/dossier/1', type: 'link' },
          dossierId: '1',
          expertId: 'expert1'
       
},
        { id: '2', type: 'dossier_update', title: 'Dossier URSSAF en cours', message: 'Votre dossier URSSAF a été pris en charge par un expert', timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), read: false, priority: 'medium', dossierId: '2' },
        { id: '3', type: 'document_required', title: 'Documents requis', message: 'Veuillez télécharger les justificatifs fiscaux pour votre dossier TICPE', timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(), read: true, priority: 'high', action: {
            label: 'Télécharger', url: '/dossier/1/documents', type: 'button' },
          dossierId: '1'
       
}
      ];

      setNotifications(mockNotifications);
    } catch (error) { setError('Erreur lors du chargement des notifications');
      console.error('Erreur loadNotifications: ', error); }
  };

  // Charger les conversations
  const loadConversations = async () => { try {
      const mockConversations: ClientConversation[] = [
        {
          id: '1', dossierId: '1', expertId: 'expert1', expertName: 'Marie Martin', expertAvatar: '/avatars/expert1.jpg', lastMessage: {
            id: 'msg1', dossierId: '1', senderId: 'expert1', senderType: 'expert', senderName: 'Marie Martin', content: 'J\'ai besoin de documents supplémentaires pour finaliser votre dossier, ', timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(), read: false, messageType: 'text' },
          unreadCount: 1,
          isActive: true,
          createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
          updatedAt: new Date(Date.now() - 30 * 60 * 1000).toISOString()
       
}
      ];

      setConversations(mockConversations);
    } catch (error) { setError('Erreur lors du chargement des conversations');
      console.error('Erreur loadConversations: ', error); }
  };

  // Charger les messages
  const loadMessages = async (dossierId: string) => { try {
      const mockMessages: ClientMessage[] = [
        {
          id: 'msg1', dossierId, senderId: 'expert1', senderType: 'expert', senderName: 'Marie Martin', content: 'Bonjour ! Je suis votre expert pour le dossier TICPE. Comment puis-je vous aider ?, ', timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), read: true, messageType: 'text' },
        { id: 'msg2', dossierId, senderId: 'client1', senderType: 'client', senderName: 'Jean Dupont', content: 'Bonjour Mari, merci de prendre en charge mon dossier. J\'ai quelques questions sur le processus.', timestamp: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(), read: true, messageType: 'text' },
        { id: 'msg3', dossierId, senderId: 'expert1', senderType: 'expert', senderName: 'Marie Martin', content: 'Bien sûr ! Je vais vous expliquer chaque étape. Voici d\'abord les documents dont j\'ai besoin., ', timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), read: true, messageType: 'text', attachments: [
            {
              id: 'att1', name: 'liste_documents_requis.pdf', type: 'application/pdf', size: 15678, url: '/documents/liste_requis.pdf', uploadedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString() }
          ]
        },
        { id: 'msg4', dossierId, senderId: 'expert1', senderType: 'expert', senderName: 'Marie Martin', content: 'J\'ai besoin de documents supplémentaires pour finaliser votre dossier. Pouvez-vous les télécharger ?, ', timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(), read: false, messageType: 'text' }
      ];

      setMessages(mockMessages);
    } catch (error) { setError('Erreur lors du chargement des messages');
      console.error('Erreur loadMessages: ', error); }
  };

  // Charger les analytics
  const loadAnalytics = async () => { 
    try {
      // TODO: Remplacer par l'API réelle
      setAnalytics(null);
    } catch (error) { 
      setError('Erreur lors du chargement des analytics');
      console.error('Erreur loadAnalytics: ', error); 
    }
  };

  // Charger les préférences
  const loadPreferences = async () => { try {
      // TODO: Charger depuis l'API
      console.log('Préférences client chargées'); } catch (error) { setError('Erreur lors du chargement des préférences');
      console.error('Erreur loadPreferences: ', error); }
  };

  // Créer un dossier
  const createDossier = async (dossierData: Partial<ClientDossier>): Promise<string> => { try {
      const newDossier: ClientDossier = {
        id: Date.now().toString(), productType: dossierData.productType || 'TICPE', status: 'draft', priority: 'medium', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), progress: 0, documents: [], ...dossierData };

      setDossiers(prev => [...prev, newDossier]);
      
      // TODO: Appel API
      console.log('Dossier créé:,', newDossier);
      return newDossier.id;
    } catch (error) { setError('Erreur lors de la création du dossier');
      console.error('Erreur createDossier: ', error);
      throw error; }
  };

  // Mettre à jour un dossier
  const updateDossier = async (dossierId: string, updates: Partial<ClientDossier>) => { try {
      setDossiers(prev => 
        prev.map(dossier => 
          dossier.id === dossierId 
            ? { ...dossier, ...updates, updatedAt: new Date().toISOString() }
            : dossier
        )
      );
      
      // TODO: Appel API
      console.log('Dossier mis à jour: ', dossierId, updates);
    } catch (error) { setError('Erreur lors de la mise à jour du dossier');
      console.error('Erreur updateDossier: ', error); }
  };

  // Annuler un dossier
  const cancelDossier = async (dossierId: string, reason: string) => { try {
      setDossiers(prev => 
        prev.map(dossier => 
          dossier.id === dossierId 
            ? { ...dossier, status: 'cancelled', notes: reason, updatedAt: new Date().toISOString() }
            : dossier
        )
      );
      
      // TODO: Appel API
      console.log('Dossier annulé:,', dossierId, reason);
    } catch (error) { setError('Erreur lors de l\'annulation du dossier');
      console.error('Erreur cancelDossier: ', error); }
  };

  // Télécharger un document
  const uploadDocument = async (dossierId: string, file: File) => { try {
      const newDocument: ClientDocument = {
        id: Date.now().toString(), name: file.name, type: 'other', status: 'uploaded', uploadedAt: new Date().toISOString(), fileSize: file.size, required: false };

      setDossiers(prev => 
        prev.map(dossier => 
          dossier.id === dossierId 
            ? { ...dossier, documents: [...dossier.documents, newDocument], updatedAt: new Date().toISOString() }
            : dossier
        )
      );
      
      // TODO: Upload vers l'API
      console.log('Document téléchargé:,', dossierId, file.name);
    } catch (error) { setError('Erreur lors du téléchargement du document');
      console.error('Erreur uploadDocument: ', error); }
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

  // Marquer une notification comme lue
  const markNotificationAsRead = async (notificationId: string) => { try {
      setNotifications(prev => 
        prev.map(notification => 
          notification.id === notificationId 
            ? { ...notification, read: true }
            : notification
        )
      );
      
      // TODO: Appel API
      console.log('Notification marquée comme lue: ', notificationId);
    } catch (error) { setError('Erreur lors du marquage de la notification');
      console.error('Erreur markNotificationAsRead: ', error); }
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

  // Envoyer un message
  const sendMessage = async (dossierId: string, content: string, attachments?: File[]) => { try {
      const newMessage: ClientMessage = {
        id: Date.now().toString(), dossierId, senderId: 'client1', // TODO: Récupérer l'ID client réel
        senderType: 'client', senderName: 'Jean Dupont', // TODO: Récupérer le nom client réel
        content, timestamp: new Date().toISOString(), read: false, messageType: 'text', attachments: attachments?.map((file, index) => ({
          id: `att${Date.now() + index}`,
          name: file.name,
          type: file.type,
          size: file.size,
          url: URL.createObjectURL(file),
          uploadedAt: new Date().toISOString()
       
}))
      };

      setMessages(prev => [...prev, newMessage]);
      
      // Mettre à jour la conversation
      setConversations(prev => 
        prev.map(conv => 
          conv.dossierId === dossierId 
            ? { ...conv, lastMessage: newMessage, updatedAt: new Date().toISOString() }
            : conv
        )
      );
      
      // TODO: Appel API pour envoyer le message
      console.log('Message envoyé:,', newMessage);
    } catch (error) { setError('Erreur lors de l\'envoi du message');
      console.error('Erreur sendMessage: ', error); }
  };

  // Marquer un message comme lu
  const markMessageAsRead = async (messageId: string) => { try {
      setMessages(prev => 
        prev.map(message => 
          message.id === messageId 
            ? { ...message, read: true }
            : message
        )
      );
      
      // TODO: Appel API
      console.log('Message marqué comme lu: ', messageId);
    } catch (error) { setError('Erreur lors du marquage du message');
      console.error('Erreur markMessageAsRead: ', error); }
  };

  // Marquer une conversation comme lue
  const markConversationAsRead = async (conversationId: string) => { try {
      setConversations(prev => 
        prev.map(conv => 
          conv.id === conversationId 
            ? { ...conv, unreadCount: 0 }
            : conv
        )
      );
      
      // TODO: Appel API
      console.log('Conversation marquée comme lue: ', conversationId);
    } catch (error) { setError('Erreur lors du marquage de la conversation');
      console.error('Erreur markConversationAsRead: ', error); }
  };

  // Démarrer une conversation
  const startConversation = async (dossierId: string, expertId: string): Promise<string> => { try {
      const newConversation: ClientConversation = {
        id: Date.now().toString(), dossierId, expertId, expertName: 'Marie Martin', // TODO: Récupérer le nom réel
        unreadCount: 0, isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };

      setConversations(prev => [...prev, newConversation]);
      
      // TODO: Appel API
      console.log('Conversation démarrée: ', newConversation);
      return newConversation.id;
    } catch (error) { setError('Erreur lors du démarrage de la conversation');
      console.error('Erreur startConversation: ', error);
      throw error; }
  };

  // Terminer une conversation
  const endConversation = async (conversationId: string) => { try {
      setConversations(prev => 
        prev.map(conv => 
          conv.id === conversationId 
            ? { ...conv, isActive: false }
            : conv
        )
      );
      
      // TODO: Appel API
      console.log('Conversation terminée: ', conversationId);
    } catch (error) { setError('Erreur lors de la fin de la conversation');
      console.error('Erreur endConversation: ', error); }
  };

  // Mettre à jour les préférences
  const updatePreferences = async (updates: Partial<ClientPreferences>) => { try {
      setPreferences(prev => ({ ...prev, ...updates }));
      
      // TODO: Appel API
      console.log('Préférences mises à jour: ', updates);
    } catch (error) { setError('Erreur lors de la mise à jour des préférences');
      console.error('Erreur updatePreferences: ', error); }
  };

  // Générer un rapport de dossier
  const generateDossierReport = async (dossierId: string): Promise<string> => { try {
      // TODO: Appel API pour générer le PDF
      const downloadUrl = `/api/client/dossiers/${dossierId}/report`;
      console.log('Rapport de dossier généré:', dossierId);
      return downloadUrl;
    } catch (error) { setError('Erreur lors de la génération du rapport');
      console.error('Erreur generateDossierReport: ', error);
      throw error; }
  };

  // Générer un rapport de workflow
  const generateWorkflowReport = async (workflowId: string): Promise<string> => { try {
      // TODO: Appel API pour générer le PDF
      const downloadUrl = `/api/client/workflows/${workflowId}/report`;
      console.log('Rapport de workflow généré:', workflowId);
      return downloadUrl;
    } catch (error) { setError('Erreur lors de la génération du rapport');
      console.error('Erreur generateWorkflowReport: ', error);
      throw error; }
  };

  // Générer un rapport d'analytics
  const generateAnalyticsReport = async (period: string): Promise<string> => { try {
      // TODO: Appel API pour générer le PDF
      const downloadUrl = `/api/client/analytics/report?period=${period}`;
      console.log('Rapport d\'analytics généré:', period);
      return downloadUrl;
    } catch (error) { setError('Erreur lors de la génération du rapport');
      console.error('Erreur generateAnalyticsReport: ', error);
      throw error; }
  };

  // Charger les données au montage
  // useEffect(() => { loadDossiers();
  //   loadWorkflows();
  //   loadNotifications();
  //   loadConversations();
  //   loadAnalytics();
  //   loadPreferences(); }, []);

  const value: ClientContextType = { // État
    dossiers, workflows, notifications, conversations, messages, analytics, preferences, loading, error, // Actions
    loadDossiers, loadWorkflows, loadNotifications, loadConversations, loadMessages, loadAnalytics, loadPreferences, // Gestion des dossiers
    createDossier, updateDossier, cancelDossier, uploadDocument, // Gestion du workflow
    completeWorkflowStep, skipWorkflowStep, // Gestion des notifications
    markNotificationAsRead, markAllNotificationsAsRead, deleteNotification, // Messagerie instantanée
    sendMessage, markMessageAsRead, markConversationAsRead, startConversation, endConversation, // Préférences
    updatePreferences, // Export PDF
    generateDossierReport, generateWorkflowReport, generateAnalyticsReport };

  return (
    <ClientContext.Provider value={ value }>
      { children }
    </ClientContext.Provider>
  );
}; 