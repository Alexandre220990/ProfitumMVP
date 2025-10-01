import React, { useState } from 'react';
import { useDossierSteps } from '@/hooks/use-dossier-steps';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  Play, 
  FileText, 
  Shield, 
  DollarSign,
  RefreshCw,
  Zap
} from 'lucide-react';
import { toast } from 'sonner';

interface DossierStepsDisplayProps {
  dossierId: string;
  dossierName?: string;
  showGenerateButton?: boolean;
  compact?: boolean;
  onStepUpdate?: (stepId: string, updates: any) => void;
}

export const DossierStepsDisplay: React.FC<DossierStepsDisplayProps> = ({
  dossierId,
  dossierName,
  showGenerateButton = true,
  compact = false,
  onStepUpdate
}) => {
  const {
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
  } = useDossierSteps(dossierId);

  const [updatingStep, setUpdatingStep] = useState<string | null>(null);

  // Fonction pour obtenir l'icône selon le type d'étape
  const getStepTypeIcon = (stepType: string) => {
    switch (stepType) {
      case 'validation':
        return <Shield className="w-4 h-4" />;
      case 'documentation':
        return <FileText className="w-4 h-4" />;
      case 'expertise':
        return <Play className="w-4 h-4" />;
      case 'approval':
        return <CheckCircle className="w-4 h-4" />;
      case 'payment':
        return <DollarSign className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  // Fonction pour obtenir l'icône selon le statut
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'in_progress':
        return <Play className="w-4 h-4 text-blue-600" />;
      case 'overdue':
        return <AlertCircle className="w-4 h-4 text-red-600" />;
      case 'pending':
      default:
        return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  // Fonction pour obtenir la couleur du badge selon le statut
  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'completed':
        return 'default';
      case 'in_progress':
        return 'secondary';
      case 'overdue':
        return 'destructive';
      case 'pending':
      default:
        return 'outline';
    }
  };

  // Fonction pour obtenir la couleur du badge selon la priorité
  const getPriorityBadgeVariant = (priority: string) => {
    switch (priority) {
      case 'critical':
        return 'destructive';
      case 'high':
        return 'default';
      case 'medium':
        return 'secondary';
      case 'low':
      default:
        return 'outline';
    }
  };

  // Fonction pour formater la date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  // Fonction pour formater la durée
  const formatDuration = (minutes: number) => {
    if (minutes < 60) {
      return `${minutes} min`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0 ? `${hours}h${remainingMinutes}` : `${hours}h`;
  };

  // Fonction pour gérer la mise à jour d'une étape
  const handleStepUpdate = async (stepId: string, updates: any) => {
    setUpdatingStep(stepId);
    try {
      const success = await updateStep(stepId, updates);
      if (success) {
        toast.success("L'étape a été mise à jour avec succès");
        onStepUpdate?.(stepId, updates);
      } else {
        toast.error("Impossible de mettre à jour l'étape");
      }
    } finally {
      setUpdatingStep(null);
    }
  };

  // Fonction pour générer les étapes
  const handleGenerateSteps = async () => {
    try {
      const success = await generateSteps(dossierId);
      if (success) {
        toast.success("Les étapes ont été générées avec succès");
      } else {
        toast.error("Impossible de générer les étapes");
      }
    } catch (error) {
      toast.error("Erreur lors de la génération des étapes");
    }
  };

  // Affichage compact pour les dashboards
  if (compact) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">
              {dossierName || 'Progression du dossier'}
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={refreshSteps}
              disabled={loading}
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-4">
              <RefreshCw className="w-6 h-6 animate-spin" />
            </div>
          ) : error ? (
            <div className="text-center py-4">
              <AlertCircle className="w-6 h-6 text-red-500 mx-auto mb-2" />
              <p className="text-sm text-gray-600">{error}</p>
              {showGenerateButton && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleGenerateSteps}
                  className="mt-2"
                >
                  <Zap className="w-4 h-4 mr-2" />
                  Générer les étapes
                </Button>
              )}
            </div>
          ) : totalSteps === 0 ? (
            <div className="text-center py-4">
              <Clock className="w-6 h-6 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-600">Aucune étape définie</p>
              {showGenerateButton && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleGenerateSteps}
                  className="mt-2"
                >
                  <Zap className="w-4 h-4 mr-2" />
                  Générer les étapes
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">
                  Étape {completedSteps + inProgressSteps} sur {totalSteps}
                </span>
                <span className="text-sm text-gray-500">{overallProgress}%</span>
              </div>
              <Progress value={overallProgress} className="w-full" />
              <div className="flex justify-between text-xs text-gray-500">
                <span>{completedSteps} terminées</span>
                <span>{inProgressSteps} en cours</span>
                <span>{pendingSteps} en attente</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  // Affichage complet
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>
            {dossierName || 'Étapes du dossier'}
          </CardTitle>
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={refreshSteps}
              disabled={loading}
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
            {showGenerateButton && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleGenerateSteps}
                disabled={loading}
              >
                <Zap className="w-4 h-4 mr-2" />
                Générer
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="w-8 h-8 animate-spin" />
          </div>
        ) : error ? (
          <div className="text-center py-8">
            <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-4" />
            <p className="text-gray-600 mb-4">{error}</p>
            {showGenerateButton && (
              <Button onClick={handleGenerateSteps}>
                <Zap className="w-4 h-4 mr-2" />
                Générer les étapes
              </Button>
            )}
          </div>
        ) : totalSteps === 0 ? (
          <div className="text-center py-8">
            <Clock className="w-8 h-8 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 mb-4">Aucune étape définie pour ce dossier</p>
            {showGenerateButton && (
              <Button onClick={handleGenerateSteps}>
                <Zap className="w-4 h-4 mr-2" />
                Générer les étapes
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            {/* Résumé global */}
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex justify-between items-center mb-3">
                <span className="text-sm font-medium">Progression globale</span>
                <span className="text-sm text-gray-500">{overallProgress}%</span>
              </div>
              <Progress value={overallProgress} className="w-full mb-3" />
              <div className="flex justify-between text-xs text-gray-500">
                <span>{completedSteps} terminées</span>
                <span>{inProgressSteps} en cours</span>
                <span>{pendingSteps} en attente</span>
              </div>
            </div>

            {/* Liste des étapes */}
            <div className="space-y-3">
              {steps.map((step) => (
                <div
                  key={step.id}
                  className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3 flex-1">
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(step.status)}
                        {getStepTypeIcon(step.step_type)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <h4 className="font-medium">{step.step_name}</h4>
                          <Badge variant={getStatusBadgeVariant(step.status)}>
                            {step.status === 'completed' ? 'Terminée' :
                             step.status === 'in_progress' ? 'En cours' :
                             step.status === 'overdue' ? 'En retard' : 'En attente'}
                          </Badge>
                          <Badge variant={getPriorityBadgeVariant(step.priority)}>
                            {step.priority === 'critical' ? 'Critique' :
                             step.priority === 'high' ? 'Élevée' :
                             step.priority === 'medium' ? 'Moyenne' : 'Faible'}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">
                          Échéance: {formatDate(step.due_date)} • Durée estimée: {formatDuration(step.estimated_duration_minutes)}
                        </p>
                        {step.progress > 0 && (
                          <div className="flex items-center space-x-2">
                            <Progress value={step.progress} className="flex-1" />
                            <span className="text-xs text-gray-500">{step.progress}%</span>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* Actions rapides */}
                    <div className="flex items-center space-x-2">
                      {step.status === 'pending' && (
                        <Button
                          size="sm"
                          onClick={() => handleStepUpdate(step.id, { status: 'in_progress' })}
                          disabled={updatingStep === step.id}
                        >
                          <Play className="w-3 h-3 mr-1" />
                          Démarrer
                        </Button>
                      )}
                      {step.status === 'in_progress' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleStepUpdate(step.id, { status: 'completed', progress: 100 })}
                          disabled={updatingStep === step.id}
                        >
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Terminer
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default DossierStepsDisplay; 