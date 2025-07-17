import React, { useState, useCallback, useMemo } from 'react';
import { 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  FileText, 
  Shield, 
  Send, 
  CreditCard, 
  MessageSquare,
  Bell,
  Users,
  ChevronRight,
  ExternalLink,
  ArrowRight,
  Play,
  Target,
  Calendar,
  FileCheck,
  UserCheck,
  Award,
  Rocket,
  Upload
} from 'lucide-react';

interface ProcessStep {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'active' | 'completed' | 'error';
  icon: React.ComponentType<{ className?: string }>;
  estimatedDuration?: string;
  progress?: number; // Pourcentage de progression de l'étape (0-100)
  actions?: {
    label: string;
    action: () => void;
    variant: 'primary' | 'secondary' | 'outline';
    icon?: React.ComponentType<{ className?: string }>;
  }[];
  notifications?: {
    type: 'info' | 'warning' | 'success' | 'error';
    message: string;
    timestamp: string;
  }[];
  messages?: {
    from: string;
    content: string;
    timestamp: string;
    unread: boolean;
  }[];
  expertInfo?: {
    name: string;
    specialty: string;
    rating: number;
    avatar: string;
  };
  requirements?: string[]; // Liste des prérequis ou documents nécessaires
  nextSteps?: string[]; // Prochaines actions à effectuer
}

interface ProductProcessWorkflowProps {
  dossierId: string;
  productType: string;
  currentStep: string;
  onStepAction?: (stepId: string, action: string) => void;
  onMessageSend?: (message: string) => void;
  className?: string;
}

const ProductProcessWorkflow: React.FC<ProductProcessWorkflowProps> = React.memo(({
  dossierId,
  productType,
  currentStep,
  onStepAction,
  onMessageSend,
  className = ''
}) => {
  const [activeNotifications] = useState<string[]>([]);
  const [showMessages, setShowMessages] = useState(false);
  const [expandedStep, setExpandedStep] = useState<string | null>(null);

  const processSteps: ProcessStep[] = useMemo(() => [
    {
      id: 'simulation',
      title: 'Simulation de votre éligibilité',
      description: 'Calcul préliminaire de votre potentiel d\'économies et d\'éligibilité',
      status: 'completed',
      progress: 100,
      icon: Target,
      estimatedDuration: '5 minutes',
      actions: [
        {
          label: 'Relancer la simulation',
          action: () => {
            // Redirection vers le simulateur
            window.open('/simulateur', '_blank');
            onStepAction?.('simulation', 'restart');
          },
          variant: 'outline' as const,
          icon: Play
        },
        {
          label: 'Voir les détails',
          action: () => {
            // Ouvrir une modale avec les détails de la simulation
            const details = {
              montantFinal: 25000,
              tauxFinal: 15,
              dureeFinale: 12,
              dateSimulation: '2024-01-15'
            };
            alert(`Détails de la simulation:\nMontant: ${details.montantFinal}€\nTaux: ${details.tauxFinal}%\nDurée: ${details.dureeFinale} mois`);
            onStepAction?.('simulation', 'view');
          },
          variant: 'secondary' as const,
          icon: ExternalLink
        }
      ],
      notifications: [
        {
          type: 'success',
          message: 'Simulation terminée - Éligibilité confirmée',
          timestamp: '2024-01-15 09:15'
        }
      ],
      nextSteps: ['Signature de la charte pour continuer']
    },
    {
      id: 'charte-signature',
      title: 'Signature de la charte',
      description: 'Validation des conditions et engagement mutuel',
      status: 'completed',
      progress: 100,
      icon: Shield,
      estimatedDuration: '2 minutes',
      actions: [
        {
          label: 'Voir la charte',
          action: () => {
            // Ouvrir la charte dans une nouvelle fenêtre
            const charteContent = `
              CHARTE D'ENGAGEMENT - ${productType.toUpperCase()}
              
              En signant cette charte, vous vous engagez à :
              • Fournir les informations et documents nécessaires
              • Collaborer activement avec l'expert assigné
              • Respecter les procédures et réglementations
              • Informer immédiatement de tout changement
              • Accepter les conditions de commission
              
              Gain potentiel estimé : 25 000€
              Commission expert : 15%
            `;
            const newWindow = window.open('', '_blank');
            if (newWindow) {
              newWindow.document.write(`
                <html>
                  <head><title>Charte d'engagement</title></head>
                  <body style="font-family: Arial, sans-serif; padding: 20px;">
                    <pre style="white-space: pre-wrap;">${charteContent}</pre>
                  </body>
                </html>
              `);
            }
            onStepAction?.('charte-signature', 'view');
          },
          variant: 'outline' as const,
          icon: FileText
        }
      ],
      notifications: [
        {
          type: 'success',
          message: 'Charte signée et validée',
          timestamp: '2024-01-15 09:20'
        }
      ],
      nextSteps: ['Sélection automatique de l\'expert']
    },
    {
      id: 'expert-preselection',
      title: 'Pré-sélection de l\'expert',
      description: 'Sélection préliminaire de l\'expert le plus adapté à votre projet',
      status: 'completed',
      progress: 100,
      icon: UserCheck,
      estimatedDuration: '1 jour',
      actions: [
        {
          label: 'Voir la sélection',
          action: () => onStepAction?.('expert-preselection', 'view'),
          variant: 'outline' as const,
          icon: Users
        }
      ],
      expertInfo: {
        name: 'Marie Dubois',
        specialty: 'Expert CEE - Bâtiment',
        rating: 4.8,
        avatar: '/images/expert-avatar.jpg'
      },
      notifications: [
        {
          type: 'success',
          message: 'Expert pré-sélectionné: Marie Dubois',
          timestamp: '2024-01-15 10:00'
        }
      ],
      nextSteps: ['Préparation des documents requis']
    },
    {
      id: 'eligibility-process',
      title: 'Vérification et validation de l\'éligibilité',
      description: 'Envoi de documents spécifiques et analyse approfondie par nos experts',
      status: 'active',
      progress: 65,
      icon: FileCheck,
      estimatedDuration: '3-5 jours',
      actions: [
        {
          label: 'Télécharger les documents',
          action: () => onStepAction?.('eligibility-process', 'upload'),
          variant: 'primary' as const,
          icon: Upload
        },
        {
          label: 'Voir la liste',
          action: () => onStepAction?.('eligibility-process', 'view'),
          variant: 'outline' as const,
          icon: FileText
        }
      ],
      requirements: [
        'Bulletins de salaire (3 dernières années)',
        'Contrats de travail',
        'Conventions collectives',
        'Justificatifs de frais',
        'Déclarations sociales nominatives (DSN)'
      ],
      notifications: [
        {
          type: 'info',
          message: 'Documents requis pour votre dossier CEE',
          timestamp: '2024-01-15 10:30'
        },
        {
          type: 'warning',
          message: 'En attente de validation des documents par nos experts',
          timestamp: '2024-01-15 14:20'
        }
      ],
      nextSteps: ['Finaliser l\'upload des documents', 'Attendre la validation expert']
    },
    {
      id: 'dossier-completion',
      title: 'Complétion et validation du dossier',
      description: 'Finalisation de tous les éléments et contrôle qualité',
      status: 'pending',
      progress: 0,
      icon: FileText,
      estimatedDuration: '2-3 jours',
      actions: [
        {
          label: 'Compléter le dossier',
          action: () => onStepAction?.('dossier-completion', 'complete'),
          variant: 'primary' as const,
          icon: FileCheck
        },
        {
          label: 'Voir les éléments manquants',
          action: () => onStepAction?.('dossier-completion', 'missing'),
          variant: 'outline' as const,
          icon: AlertCircle
        }
      ],
      requirements: [
        'Validation de tous les documents',
        'Vérification des calculs',
        'Contrôle qualité du dossier'
      ],
      nextSteps: ['Mise en relation avec l\'expert']
    },
    {
      id: 'expert-matching',
      title: 'Mise en relation avec l\'expert',
      description: 'Contact direct et planification de l\'intervention avec l\'expert sélectionné',
      status: 'pending',
      progress: 0,
      icon: Users,
      estimatedDuration: '1-2 jours',
      actions: [
        {
          label: 'Contacter l\'expert',
          action: () => onStepAction?.('expert-matching', 'contact'),
          variant: 'primary' as const,
          icon: MessageSquare
        },
        {
          label: 'Planifier l\'intervention',
          action: () => onStepAction?.('expert-matching', 'schedule'),
          variant: 'secondary' as const,
          icon: Calendar
        }
      ],
      expertInfo: {
        name: 'Marie Dubois',
        specialty: 'Expert CEE - Bâtiment',
        rating: 4.8,
        avatar: '/images/expert-avatar.jpg'
      },
      messages: [
        {
          from: 'Marie Dubois',
          content: 'Bonjour, je suis votre expert assigné. Pouvez-vous me confirmer votre disponibilité pour l\'intervention ?',
          timestamp: '2024-01-15 16:45',
          unread: true
        },
        {
          from: 'Marie Dubois',
          content: 'Je propose une visite le 20 janvier à 14h. Cela vous convient-il ?',
          timestamp: '2024-01-15 17:30',
          unread: false
        }
      ],
      nextSteps: ['Confirmer le rendez-vous', 'Préparer l\'intervention']
    },
    {
      id: 'expert-report',
      title: 'Remise du rapport d\'expert',
      description: 'Rapport détaillé et recommandations de l\'expert',
      status: 'pending',
      progress: 0,
      icon: FileText,
      estimatedDuration: '3-5 jours',
      notifications: [
        {
          type: 'success',
          message: 'Rapport d\'expert en cours de rédaction',
          timestamp: '2024-01-15 18:30'
        }
      ],
      nextSteps: ['Réception du rapport', 'Validation du contenu']
    },
    {
      id: 'administration-submission',
      title: 'Envoi du dossier à l\'administration',
      description: 'Transmission officielle aux autorités compétentes',
      status: 'pending',
      progress: 0,
      icon: Send,
      estimatedDuration: '1-2 semaines',
      nextSteps: ['Suivi du traitement', 'Attente de la réponse']
    },
    {
      id: 'reimbursement',
      title: 'Remboursement obtenu',
      description: 'Réception et traitement du remboursement',
      status: 'pending',
      progress: 0,
      icon: CreditCard,
      estimatedDuration: '2-4 semaines',
      nextSteps: ['Réception des fonds', 'Facturation']
    },
    {
      id: 'dossier-closure',
      title: 'Dossier clôturé et archivé',
      description: 'Finalisation et archivage sécurisé',
      status: 'pending',
      progress: 0,
      icon: Award,
      estimatedDuration: '1 jour',
      nextSteps: ['Archivage sécurisé', 'Documentation finale']
    }
  ], [onStepAction]);

  const currentStepIndex = useMemo(() => 
    processSteps.findIndex(step => step.id === currentStep), 
    [processSteps, currentStep]
  );

  const progressPercentage = useMemo(() => {
    const completedSteps = processSteps.filter(step => step.status === 'completed').length;
    const activeStep = processSteps.find(step => step.status === 'active');
    const activeProgress = activeStep?.progress || 0;
    
    return Math.round(((completedSteps + (activeProgress / 100)) / processSteps.length) * 100);
  }, [processSteps]);

  const getStepStatus = useCallback((step: ProcessStep, index: number) => {
    if (step.status === 'completed') return 'completed';
    if (step.status === 'error') return 'error';
    if (step.id === currentStep) return 'active';
    if (index < currentStepIndex) return 'completed';
    return 'pending';
  }, [currentStep, currentStepIndex]);

  const getStatusIcon = useCallback((status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-6 h-6 text-emerald-500" />;
      case 'active':
        return <Clock className="w-6 h-6 text-blue-500 animate-pulse" />;
      case 'error':
        return <AlertCircle className="w-6 h-6 text-red-500" />;
      default:
        return <div className="w-6 h-6 rounded-full border-2 border-slate-300 bg-slate-50" />;
    }
  }, []);

  const getStepClasses = useCallback((status: string, isActive: boolean) => {
    const baseClasses = "relative p-6 rounded-2xl border transition-all duration-500 ease-out transform";
    
    switch (status) {
      case 'completed':
        return `${baseClasses} bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-200 shadow-sm hover:shadow-md`;
      case 'active':
        return `${baseClasses} bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-300 shadow-lg scale-105 ring-2 ring-blue-200`;
      case 'error':
        return `${baseClasses} bg-gradient-to-br from-red-50 to-red-100 border-red-200 shadow-sm`;
      default:
        return `${baseClasses} bg-white border-slate-200 hover:border-slate-300 hover:shadow-md ${isActive ? 'ring-1 ring-blue-100' : ''}`;
    }
  }, []);

  const getProgressColor = useCallback((progress: number) => {
    if (progress >= 80) return 'from-emerald-500 to-emerald-600';
    if (progress >= 60) return 'from-blue-500 to-blue-600';
    if (progress >= 40) return 'from-yellow-500 to-orange-500';
    return 'from-slate-300 to-slate-400';
  }, []);

  return (
    <div className={`w-full max-w-7xl mx-auto ${className}`}>
      {/* Header avec progression globale */}
      <div className="mb-8 bg-gradient-to-r from-slate-50 to-blue-50 rounded-3xl p-8 border border-slate-200">
        <div className="flex items-center justify-between mb-6">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center">
                <Rocket className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-800 to-blue-800 bg-clip-text text-transparent">
                  Suivi de votre dossier {productType}
                </h1>
                <p className="text-slate-600 text-sm mt-1">
                  Dossier #{dossierId} • {progressPercentage}% complété
                </p>
              </div>
            </div>
            
            {/* Barre de progression globale */}
            <div className="relative h-3 bg-slate-200 rounded-full overflow-hidden mb-4">
              <div 
                className="absolute top-0 left-0 h-full bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-600 rounded-full transition-all duration-1000 ease-out shadow-sm"
                style={{ width: `${progressPercentage}%` }}
              />
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse" />
            </div>
            
            {/* Indicateurs de progression */}
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-600">
                {processSteps.filter(s => s.status === 'completed').length} étapes terminées
              </span>
              <span className="text-slate-600">
                {processSteps.filter(s => s.status === 'active').length} en cours
              </span>
              <span className="text-slate-600">
                {processSteps.filter(s => s.status === 'pending').length} à venir
              </span>
            </div>
          </div>
          
          <div className="flex items-center space-x-3 ml-8">
            <button
              onClick={() => setShowMessages(!showMessages)}
              className="relative p-3 rounded-xl bg-white hover:bg-slate-50 transition-colors shadow-sm border border-slate-200"
            >
              <MessageSquare className="w-5 h-5 text-slate-600" />
              {processSteps.some(step => step.messages?.some(m => m.unread)) && (
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse" />
              )}
            </button>
            <button className="relative p-3 rounded-xl bg-white hover:bg-slate-50 transition-colors shadow-sm border border-slate-200">
              <Bell className="w-5 h-5 text-slate-600" />
              {activeNotifications.length > 0 && (
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full animate-pulse" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Timeline des étapes */}
      <div className="relative">
        {/* Ligne de connexion */}
        <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gradient-to-b from-blue-200 via-indigo-200 to-purple-200" />
        
        <div className="space-y-8">
          {processSteps.map((step, index) => {
            const status = getStepStatus(step, index);
            const isActive = step.id === currentStep;
            const isExpanded = expandedStep === step.id;
            
            return (
              <div key={step.id} className="relative">
                {/* Connecteur */}
                {index < processSteps.length - 1 && (
                  <div className="absolute left-8 top-16 w-0.5 h-8 bg-gradient-to-b from-slate-200 to-slate-300" />
                )}
                
                <div className={getStepClasses(status, isActive)}>
                  {/* Indicateur de position */}
                  <div className="absolute -left-4 top-6 w-8 h-8 bg-white border-2 border-slate-200 rounded-full flex items-center justify-center shadow-sm">
                    {getStatusIcon(status)}
                  </div>
                  
                  {/* En-tête de l'étape */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1 ml-4">
                      <div className="flex items-center gap-3 mb-2">
                        <step.icon className={`w-6 h-6 ${
                          status === 'completed' ? 'text-emerald-500' :
                          status === 'active' ? 'text-blue-500' :
                          'text-slate-400'
                        }`} />
                        <h3 className={`text-lg font-semibold ${
                          status === 'completed' ? 'text-emerald-800' :
                          status === 'active' ? 'text-blue-800' :
                          'text-slate-700'
                        }`}>
                          {step.title}
                        </h3>
                        {step.progress !== undefined && step.status === 'active' && (
                          <div className="flex items-center gap-2">
                            <div className="w-16 h-2 bg-slate-200 rounded-full overflow-hidden">
                              <div 
                                className={`h-full bg-gradient-to-r ${getProgressColor(step.progress)} rounded-full transition-all duration-500`}
                                style={{ width: `${step.progress}%` }}
                              />
                            </div>
                            <span className="text-xs font-medium text-slate-600">
                              {step.progress}%
                            </span>
                          </div>
                        )}
                      </div>
                      
                      <p className="text-slate-600 mb-2 leading-relaxed">
                        {step.description}
                      </p>
                      
                      {step.estimatedDuration && (
                        <div className="flex items-center gap-2 text-sm text-slate-500">
                          <Clock className="w-4 h-4" />
                          <span>Durée estimée: {step.estimatedDuration}</span>
                        </div>
                      )}
                    </div>
                    
                    {/* Bouton d'expansion */}
                    {(step.requirements || step.nextSteps || step.messages) && (
                      <button
                        onClick={() => setExpandedStep(isExpanded ? null : step.id)}
                        className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
                      >
                        <ChevronRight className={`w-5 h-5 text-slate-400 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                      </button>
                    )}
                  </div>

                  {/* Actions */}
                  {step.actions && step.actions.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-4">
                      {step.actions.map((action, actionIndex) => (
                        <button
                          key={actionIndex}
                          onClick={action.action}
                          className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                            action.variant === 'primary'
                              ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 shadow-sm hover:shadow-md'
                              : action.variant === 'secondary'
                              ? 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                              : 'border border-slate-300 text-slate-600 hover:border-slate-400 hover:bg-slate-50'
                          }`}
                        >
                          {action.icon && <action.icon className="w-4 h-4" />}
                          {action.label}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Contenu expandable */}
                  {isExpanded && (
                    <div className="mt-4 space-y-4 animate-in slide-in-from-top-2 duration-300">
                      {/* Prérequis */}
                      {step.requirements && (
                        <div className="bg-slate-50 rounded-xl p-4">
                          <h4 className="font-medium text-slate-800 mb-3 flex items-center gap-2">
                            <FileCheck className="w-4 h-4 text-blue-500" />
                            Prérequis et documents nécessaires
                          </h4>
                          <ul className="space-y-2">
                            {step.requirements.map((req, reqIndex) => (
                              <li key={reqIndex} className="flex items-start gap-2 text-sm text-slate-600">
                                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 flex-shrink-0" />
                                {req}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Prochaines étapes */}
                      {step.nextSteps && (
                        <div className="bg-blue-50 rounded-xl p-4">
                          <h4 className="font-medium text-blue-800 mb-3 flex items-center gap-2">
                            <ArrowRight className="w-4 h-4" />
                            Prochaines actions
                          </h4>
                          <ul className="space-y-2">
                            {step.nextSteps.map((next, nextIndex) => (
                              <li key={nextIndex} className="flex items-start gap-2 text-sm text-blue-700">
                                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 flex-shrink-0" />
                                {next}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Messages */}
                      {step.messages && step.messages.length > 0 && showMessages && (
                        <div className="bg-white border border-slate-200 rounded-xl p-4">
                          <h4 className="font-medium text-slate-800 mb-3 flex items-center gap-2">
                            <MessageSquare className="w-4 h-4 text-blue-500" />
                            Messages récents
                          </h4>
                          <div className="space-y-3">
                            {step.messages.map((message, msgIndex) => (
                              <div
                                key={msgIndex}
                                className={`p-3 rounded-lg border ${
                                  message.unread
                                    ? 'bg-blue-50 border-blue-200'
                                    : 'bg-slate-50 border-slate-200'
                                }`}
                              >
                                <div className="flex items-start justify-between mb-2">
                                  <span className="font-medium text-slate-700 text-sm">
                                    {message.from}
                                  </span>
                                  <span className="text-xs text-slate-500">
                                    {message.timestamp}
                                  </span>
                                </div>
                                <p className="text-slate-600 text-sm leading-relaxed">
                                  {message.content}
                                </p>
                                {message.unread && (
                                  <div className="flex justify-end mt-2">
                                    <button
                                      onClick={() => onMessageSend?.('Réponse automatique')}
                                      className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                                    >
                                      Répondre
                                    </button>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Informations expert */}
                  {step.expertInfo && (
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 mt-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center">
                          <span className="text-white text-sm font-medium">
                            {step.expertInfo.name.split(' ').map(n => n[0]).join('')}
                          </span>
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-slate-800">
                            {step.expertInfo.name}
                          </p>
                          <p className="text-xs text-slate-600">
                            {step.expertInfo.specialty}
                          </p>
                          <div className="flex items-center mt-1">
                            <div className="flex text-yellow-400">
                              {[...Array(5)].map((_, i) => (
                                <span key={i} className="text-xs">
                                  {i < Math.floor(step.expertInfo!.rating) ? '★' : '☆'}
                                </span>
                              ))}
                            </div>
                            <span className="text-xs text-slate-500 ml-1">
                              {step.expertInfo.rating}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Notifications */}
                  {step.notifications && step.notifications.length > 0 && (
                    <div className="space-y-2 mt-4">
                      {step.notifications.map((notification, notifIndex) => (
                        <div
                          key={notifIndex}
                          className={`p-3 rounded-lg text-sm border ${
                            notification.type === 'success'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : notification.type === 'warning'
                              ? 'bg-amber-50 text-amber-700 border-amber-200'
                              : notification.type === 'error'
                              ? 'bg-red-50 text-red-700 border-red-200'
                              : 'bg-blue-50 text-blue-700 border-blue-200'
                          }`}
                        >
                          <div className="flex items-start justify-between">
                            <span>{notification.message}</span>
                            <span className="text-xs opacity-75 ml-2">
                              {notification.timestamp}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer avec actions globales */}
      <div className="mt-12 p-8 bg-gradient-to-r from-slate-50 to-blue-50 rounded-3xl border border-slate-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button className="flex items-center space-x-2 px-6 py-3 bg-white border border-slate-300 rounded-xl hover:border-slate-400 transition-colors shadow-sm">
              <ExternalLink className="w-4 h-4 text-slate-600" />
              <span className="text-sm font-medium text-slate-700">Voir le détail complet</span>
            </button>
            <button className="flex items-center space-x-2 px-6 py-3 bg-white border border-slate-300 rounded-xl hover:border-slate-400 transition-colors shadow-sm">
              <MessageSquare className="w-4 h-4 text-slate-600" />
              <span className="text-sm font-medium text-slate-700">Contacter le support</span>
            </button>
          </div>
          <div className="text-right">
            <p className="text-sm font-medium text-slate-700">
              Prochaine étape: {processSteps[currentStepIndex + 1]?.title || 'Finalisation'}
            </p>
            <p className="text-xs text-slate-500 mt-1">
              Mise à jour: {new Date().toLocaleString('fr-FR')}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
});

ProductProcessWorkflow.displayName = 'ProductProcessWorkflow';

export default ProductProcessWorkflow; 