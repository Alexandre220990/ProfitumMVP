import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
  ArrowRight,
  Play,
  Target,
  FileCheck,
  Award,
  Rocket,
  Eye,
  Edit,
  Plus,
  Minus,
  Info,
  AlertTriangle,
  TrendingUp,
  BarChart3,
  PieChart,
  Activity,
  Zap
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/design-system/Card';
import Button from '@/components/ui/design-system/Button';
import Badge from '@/components/ui/design-system/Badge';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import type { DossierWorkflowStep, DossierData } from '@/lib/workflow-mapper';

interface ExpertDossierWorkflowProps {
  steps: DossierWorkflowStep[];
  dossier: DossierData;
  onStepAction?: (stepId: number, action: string) => void;
  onDocumentAction?: (documentName: string, action: string) => void;
  onNoteAdd?: (stepId: number, note: string) => void;
  className?: string;
}

const ExpertDossierWorkflow: React.FC<ExpertDossierWorkflowProps> = ({
  steps,
  dossier,
  onStepAction,
  onDocumentAction,
  onNoteAdd,
  className = ''
}) => {
  const [expandedStep, setExpandedStep] = useState<number | null>(null);
  const [showAllNotifications, setShowAllNotifications] = useState(false);

  const getStepIcon = useCallback((step: DossierWorkflowStep) => {
    const iconProps = { className: "w-5 h-5" };
    
    switch (step.id) {
      case 1: return <Rocket {...iconProps} />;
      case 2: return <Shield {...iconProps} />;
      case 3: return <Users {...iconProps} />;
      case 4: return <FileCheck {...iconProps} />;
      case 5: return <FileText {...iconProps} />;
      case 6: return <MessageSquare {...iconProps} />;
      case 7: return <Award {...iconProps} />;
      case 8: return <Send {...iconProps} />;
      case 9: return <CreditCard {...iconProps} />;
      case 10: return <CheckCircle {...iconProps} />;
      default: return <Target {...iconProps} />;
    }
  }, []);

  const getStatusColor = useCallback((status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-success-100 text-success-800 border-success-200';
      case 'active':
        return 'bg-primary-100 text-primary-800 border-primary-200';
      case 'error':
        return 'bg-error-100 text-error-800 border-error-200';
      case 'blocked':
        return 'bg-warning-100 text-warning-800 border-warning-200';
      default:
        return 'bg-neutral-100 text-neutral-600 border-neutral-200';
    }
  }, []);

  const getStatusIcon = useCallback((status: string) => {
    const iconProps = { className: "w-4 h-4" };
    
    switch (status) {
      case 'completed':
        return <CheckCircle {...iconProps} />;
      case 'active':
        return <Play {...iconProps} />;
      case 'error':
        return <AlertTriangle {...iconProps} />;
      case 'blocked':
        return <AlertCircle {...iconProps} />;
      default:
        return <Clock {...iconProps} />;
    }
  }, []);

  const handleStepAction = useCallback((stepId: number, action: string) => {
    onStepAction?.(stepId, action);
  }, [onStepAction]);

  const handleDocumentAction = useCallback((documentName: string, action: string) => {
    onDocumentAction?.(documentName, action);
  }, [onDocumentAction]);

  const toggleStepExpansion = useCallback((stepId: number) => {
    setExpandedStep(expandedStep === stepId ? null : stepId);
  }, [expandedStep]);

  const calculateOverallProgress = useCallback(() => {
    const completedSteps = steps.filter(step => step.status === 'completed').length;
    const activeStep = steps.find(step => step.status === 'active');
    const activeProgress = activeStep?.progress || 0;
    
    return Math.round(((completedSteps + (activeProgress / 100)) / steps.length) * 100);
  }, [steps]);

  const overallProgress = calculateOverallProgress();

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header avec progression globale */}
      <Card variant="glass" className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-primary-500/10 to-secondary-500/10" />
        <CardContent className="relative p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-2xl font-bold text-neutral-900 dark:text-white">
                Progression du dossier
              </h2>
              <p className="text-neutral-600 dark:text-neutral-400">
                {dossier.Client?.company_name} - {dossier.ProduitEligible?.nom}
              </p>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-primary-600">
                {overallProgress}%
              </div>
              <div className="text-sm text-neutral-500">
                {steps.filter(s => s.status === 'completed').length} / {steps.length} étapes
              </div>
            </div>
          </div>
          
          <Progress value={overallProgress} className="h-3" />
          
          <div className="flex items-center justify-between mt-4 text-sm text-neutral-600">
            <span>Étape {dossier.current_step} sur {steps.length}</span>
            <span>Durée estimée: {steps[dossier.current_step - 1]?.estimatedDuration}</span>
          </div>
        </CardContent>
      </Card>

      {/* Étapes du workflow */}
      <div className="space-y-4">
        {steps.map((step, index) => (
          <motion.div
            key={step.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card 
              variant={step.status === 'active' ? 'hover' : 'base'}
              className={cn(
                "transition-all duration-300 hover:shadow-lg",
                step.status === 'active' && "ring-2 ring-primary-200 dark:ring-primary-800"
              )}
            >
              <CardContent className="p-6">
                <div className="flex items-start space-x-4">
                  {/* Icône et statut */}
                  <div className="flex-shrink-0">
                    <div className={cn(
                      "w-12 h-12 rounded-full flex items-center justify-center border-2",
                      getStatusColor(step.status)
                    )}>
                      {getStepIcon(step)}
                    </div>
                  </div>

                  {/* Contenu principal */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-3">
                        <h3 className="text-lg font-semibold text-neutral-900 dark:text-white">
                          {step.name}
                        </h3>
                        <Badge variant={step.status === 'completed' ? 'success' : step.status === 'active' ? 'primary' : 'secondary'}>
                          <div className="flex items-center space-x-1">
                            {getStatusIcon(step.status)}
                            <span className="capitalize">{step.status}</span>
                          </div>
                        </Badge>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        {step.estimatedDuration && (
                          <span className="text-sm text-neutral-500 flex items-center">
                            <Clock className="w-4 h-4 mr-1" />
                            {step.estimatedDuration}
                          </span>
                        )}
                        
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleStepExpansion(step.id)}
                          className="p-1"
                        >
                          {expandedStep === step.id ? <Minus className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                        </Button>
                      </div>
                    </div>

                    <p className="text-neutral-600 dark:text-neutral-400 mb-3">
                      {step.description}
                    </p>

                    {/* Progression de l'étape */}
                    {step.progress !== undefined && (
                      <div className="mb-3">
                        <div className="flex justify-between text-sm text-neutral-500 mb-1">
                          <span>Progression</span>
                          <span>{Math.round(step.progress)}%</span>
                        </div>
                        <Progress value={step.progress} className="h-2" />
                      </div>
                    )}

                    {/* Actions */}
                    {step.actions && step.actions.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-3">
                        {step.actions.map((action, actionIndex) => (
                          <Button
                            key={actionIndex}
                            variant={action.variant}
                            size="sm"
                            onClick={() => handleStepAction(step.id, action.action)}
                            disabled={action.disabled}
                            className="flex items-center space-x-2"
                          >
                            <span>{action.label}</span>
                            <ArrowRight className="w-3 h-3" />
                          </Button>
                        ))}
                      </div>
                    )}

                    {/* Contenu expandable */}
                    <AnimatePresence>
                      {expandedStep === step.id && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.3 }}
                          className="space-y-4 pt-4 border-t border-neutral-200 dark:border-neutral-700"
                        >
                          {/* Prérequis */}
                          {step.requirements && step.requirements.length > 0 && (
                            <div>
                              <h4 className="text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-2 flex items-center">
                                <Info className="w-4 h-4 mr-2" />
                                Prérequis
                              </h4>
                              <ul className="space-y-1">
                                {step.requirements.map((requirement, reqIndex) => (
                                  <li key={reqIndex} className="text-sm text-neutral-600 dark:text-neutral-400 flex items-center">
                                    <CheckCircle className="w-3 h-3 mr-2 text-success-500" />
                                    {requirement}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {/* Documents */}
                          {step.documents && step.documents.length > 0 && (
                            <div>
                              <h4 className="text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-2 flex items-center">
                                <FileText className="w-4 h-4 mr-2" />
                                Documents
                              </h4>
                              <div className="space-y-2">
                                {step.documents.map((doc, docIndex) => (
                                  <div key={docIndex} className="flex items-center justify-between p-2 bg-neutral-50 dark:bg-neutral-800 rounded-lg">
                                    <div className="flex items-center space-x-2">
                                      <span className="text-sm">{doc.name}</span>
                                      {doc.required && (
                                        <Badge variant="warning" size="sm">Requis</Badge>
                                      )}
                                    </div>
                                    <div className="flex items-center space-x-2">
                                      <Badge 
                                        variant={
                                          doc.status === 'validated' ? 'success' : 
                                          doc.status === 'uploaded' ? 'primary' : 
                                          doc.status === 'rejected' ? 'error' : 'secondary'
                                        }
                                        size="sm"
                                      >
                                        {doc.status}
                                      </Badge>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleDocumentAction(doc.name, 'view')}
                                      >
                                        <Eye className="w-3 h-3" />
                                      </Button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Notifications */}
                          {step.notifications && step.notifications.length > 0 && (
                            <div>
                              <h4 className="text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-2 flex items-center">
                                <Bell className="w-4 h-4 mr-2" />
                                Notifications
                              </h4>
                              <div className="space-y-2">
                                {step.notifications.slice(0, showAllNotifications ? undefined : 2).map((notification, notifIndex) => (
                                  <div key={notifIndex} className={cn(
                                    "p-3 rounded-lg border-l-4",
                                    notification.type === 'success' && "bg-success-50 border-success-400 dark:bg-success-900/20 dark:border-success-600",
                                    notification.type === 'warning' && "bg-warning-50 border-warning-400 dark:bg-warning-900/20 dark:border-warning-600",
                                    notification.type === 'error' && "bg-error-50 border-error-400 dark:bg-error-900/20 dark:border-error-600",
                                    notification.type === 'info' && "bg-primary-50 border-primary-400 dark:bg-primary-900/20 dark:border-primary-600"
                                  )}>
                                    <div className="flex items-start space-x-2">
                                      {notification.type === 'success' && <CheckCircle className="w-4 h-4 text-success-600 mt-0.5" />}
                                      {notification.type === 'warning' && <Warning className="w-4 h-4 text-warning-600 mt-0.5" />}
                                      {notification.type === 'error' && <AlertTriangle className="w-4 h-4 text-error-600 mt-0.5" />}
                                      {notification.type === 'info' && <Info className="w-4 h-4 text-primary-600 mt-0.5" />}
                                      <div className="flex-1">
                                        <p className="text-sm font-medium">{notification.message}</p>
                                        <p className="text-xs text-neutral-500 mt-1">
                                          {new Date(notification.timestamp).toLocaleString('fr-FR')}
                                        </p>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                                {step.notifications.length > 2 && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setShowAllNotifications(!showAllNotifications)}
                                    className="w-full"
                                  >
                                    {showAllNotifications ? 'Voir moins' : `Voir ${step.notifications.length - 2} notifications supplémentaires`}
                                  </Button>
                                )}
                              </div>
                            </div>
                          )}

                          {/* Notes */}
                          {step.notes && step.notes.length > 0 && (
                            <div>
                              <h4 className="text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-2 flex items-center">
                                <Edit className="w-4 h-4 mr-2" />
                                Notes
                              </h4>
                              <div className="space-y-2">
                                {step.notes.map((note, noteIndex) => (
                                  <div key={noteIndex} className="p-3 bg-neutral-50 dark:bg-neutral-800 rounded-lg">
                                    <p className="text-sm text-neutral-600 dark:text-neutral-400">{note}</p>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default ExpertDossierWorkflow; 