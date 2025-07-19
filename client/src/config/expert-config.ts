// Configuration pour l'interface expert

export const EXPERT_CONFIG = {
  // Métriques et KPIs
  metrics: {
    defaultCurrency: 'EUR',
    defaultLocale: 'fr-FR',
    refreshInterval: 30000, // 30 secondes
  },

  // Statuts des assignations
  assignmentStatuses: {
    pending: {
      label: 'En attente',
      color: 'yellow',
      icon: 'AlertCircle'
    },
    accepted: {
      label: 'Acceptée',
      color: 'blue',
      icon: 'CheckCircle'
    },
    in_progress: {
      label: 'En cours',
      color: 'orange',
      icon: 'Loader2'
    },
    completed: {
      label: 'Terminée',
      color: 'green',
      icon: 'CheckCircle'
    },
    cancelled: {
      label: 'Annulée',
      color: 'red',
      icon: 'X'
    }
  },

  // Priorités
  priorities: {
    urgent: {
      label: 'Urgent',
      color: 'red',
      icon: 'AlertTriangle'
    },
    high: {
      label: 'Élevée',
      color: 'orange',
      icon: 'TrendingUp'
    },
    normal: {
      label: 'Normale',
      color: 'blue',
      icon: 'Minus'
    },
    low: {
      label: 'Faible',
      color: 'gray',
      icon: 'TrendingDown'
    }
  },

  // Types d'événements agenda
  eventTypes: {
    meeting: {
      label: 'Rendez-vous',
      icon: 'Users',
      color: 'blue'
    },
    call: {
      label: 'Appel',
      icon: 'Phone',
      color: 'green'
    },
    deadline: {
      label: 'Échéance',
      icon: 'AlertCircle',
      color: 'red'
    },
    task: {
      label: 'Tâche',
      icon: 'CheckCircle',
      color: 'purple'
    }
  },

  // Types de notifications
  notificationTypes: {
    assignment: {
      label: 'Nouvelle assignation',
      icon: 'Briefcase',
      color: 'blue'
    },
    message: {
      label: 'Nouveau message',
      icon: 'MessageCircle',
      color: 'green'
    },
    reminder: {
      label: 'Rappel',
      icon: 'Clock',
      color: 'orange'
    },
    payment: {
      label: 'Paiement reçu',
      icon: 'Euro',
      color: 'green'
    },
    system: {
      label: 'Système',
      icon: 'Settings',
      color: 'gray'
    }
  },

  // Limites et seuils
  limits: {
    maxAssignmentsPerMonth: 50,
    maxEventsPerDay: 10,
    maxNotifications: 100,
    autoRefreshInterval: 60000, // 1 minute
  },

  // URLs et routes
  routes: {
    dashboard: '/expert/dashboard',
    agenda: '/expert/agenda',
    messagerie: '/expert/messagerie',
    mesAffaires: '/expert/mes-affaires',
    profile: '/expert/profile',
    assignments: '/expert/assignments',
  },

  // Messages et textes
  messages: {
    welcome: 'Bienvenue sur votre tableau de bord expert',
    noAssignments: 'Aucune assignation en cours',
    noEvents: 'Aucun événement planifié',
    loading: 'Chargement de vos données...',
    error: 'Erreur lors du chargement des données',
    success: 'Opération réussie',
  },

  // Couleurs et thème
  theme: {
    primary: '#3B82F6',
    secondary: '#6B7280',
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',
    info: '#3B82F6',
  }
};

// Fonctions utilitaires
export const formatCurrency = (amount: number, currency = EXPERT_CONFIG.metrics.defaultCurrency) => {
  return new Intl.NumberFormat(EXPERT_CONFIG.metrics.defaultLocale, {
    style: 'currency',
    currency
  }).format(amount);
};

export const formatDate = (dateString: string, options?: Intl.DateTimeFormatOptions) => {
  const defaultOptions: Intl.DateTimeFormatOptions = {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  };
  
  return new Date(dateString).toLocaleDateString(
    EXPERT_CONFIG.metrics.defaultLocale, 
    options || defaultOptions
  );
};

export const formatDateTime = (dateString: string) => {
  return new Date(dateString).toLocaleString(EXPERT_CONFIG.metrics.defaultLocale, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

export const getStatusConfig = (status: string) => {
  return EXPERT_CONFIG.assignmentStatuses[status as keyof typeof EXPERT_CONFIG.assignmentStatuses] || 
         EXPERT_CONFIG.assignmentStatuses.pending;
};

export const getPriorityConfig = (priority: string) => {
  return EXPERT_CONFIG.priorities[priority as keyof typeof EXPERT_CONFIG.priorities] || 
         EXPERT_CONFIG.priorities.normal;
};

export const getEventTypeConfig = (type: string) => {
  return EXPERT_CONFIG.eventTypes[type as keyof typeof EXPERT_CONFIG.eventTypes] || 
         EXPERT_CONFIG.eventTypes.task;
};

export const getNotificationTypeConfig = (type: string) => {
  return EXPERT_CONFIG.notificationTypes[type as keyof typeof EXPERT_CONFIG.notificationTypes] || 
         EXPERT_CONFIG.notificationTypes.system;
}; 