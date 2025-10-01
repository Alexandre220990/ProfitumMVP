import { useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Clock, FileText, Shield, Play, AlertCircle, DollarSign } from "lucide-react";
import { useDossierSteps } from '@/hooks/use-dossier-steps';
import TICPEWorkflow from './TICPEWorkflow';
import URSSAFWorkflow from './URSSAFWorkflow';
import FONCIERWorkflow from './FONCIERWorkflow';

interface ProductWorkflowCompleteProps {
  clientProduitId: string;
  productName: string;
  companyName?: string;
  estimatedAmount?: number;
  onStepUpdate?: (stepId: string, updates: any) => void;
  className?: string;
}

export default function ProductWorkflowComplete({
  clientProduitId,
  productName,
  companyName,
  estimatedAmount,
  onStepUpdate,
  className = ""
}: ProductWorkflowCompleteProps) {

  // Hook pour les étapes du dossier
  const {
    steps,
    loading: stepsLoading,
    generateSteps,
    overallProgress
  } = useDossierSteps(clientProduitId);


  const handleGenerateSteps = useCallback(async () => {
    try {
      const success = await generateSteps(clientProduitId);
      if (success) {
        // Étapes générées avec succès
      }
    } catch (error) {
      console.error('Erreur lors de la génération des étapes:', error);
      console.error("Impossible de générer les étapes");
    }
  }, [generateSteps, clientProduitId]);

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

  if (stepsLoading) {
    return (
      <div className={`flex items-center justify-center p-8 ${className}`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  // Wrapper pour les callbacks
  const handleWorkflowComplete = useCallback(() => {
    onStepUpdate?.('workflow-complete', { completed: true });
  }, [onStepUpdate]);

  // Vérifier le type de produit pour utiliser le workflow spécialisé
  const productType = productName.toLowerCase();
  
  if (productType.includes('ticpe')) {
    return (
      <TICPEWorkflow
        clientProduitId={clientProduitId}
        companyName={companyName}
        estimatedAmount={estimatedAmount}
        onWorkflowComplete={handleWorkflowComplete}
        className={className}
      />
    );
  }
  
  if (productType.includes('urssaf')) {
    return (
      <URSSAFWorkflow
        clientProduitId={clientProduitId}
        companyName={companyName}
        estimatedAmount={estimatedAmount}
        onWorkflowComplete={handleWorkflowComplete}
        className={className}
      />
    );
  }
  
  if (productType.includes('foncier')) {
    return (
      <FONCIERWorkflow
        clientProduitId={clientProduitId}
        companyName={companyName}
        estimatedAmount={estimatedAmount}
        onWorkflowComplete={handleWorkflowComplete}
        className={className}
      />
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* En-tête avec progression globale */}
      <div className="text-center">
        <h3 className="text-lg font-semibold text-gray-800 mb-2">
          Progression de votre dossier {productName}
        </h3>
        {companyName && (
          <p className="text-sm text-gray-600 mb-4">Entreprise : {companyName}</p>
        )}
        
        {/* Barre de progression globale */}
        <div className="mb-6">
          <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
            <span>Progression globale</span>
            <span>{overallProgress}%</span>
          </div>
          <Progress value={overallProgress} className="h-2" />
        </div>
      </div>

      {/* Section Étapes du Dossier */}
      {steps.length > 0 ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-md font-semibold text-gray-800">Étapes du dossier</h4>
            <Button 
              size="sm" 
              variant="outline"
              onClick={handleGenerateSteps}
              disabled={stepsLoading}
            >
              Régénérer les étapes
            </Button>
          </div>
          
          {steps.map((step) => (
            <Card 
              key={step.id}
              className={`transition-all duration-200 ${
                step.status === 'in_progress' 
                  ? 'ring-2 ring-blue-500 bg-blue-50' 
                  : step.status === 'completed'
                  ? 'bg-green-50'
                  : 'bg-gray-50'
              }`}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(step.status)}
                      <span className="text-sm font-medium text-gray-600">
                        {step.id}
                      </span>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      <div className="flex items-center space-x-2">
                        {getStepTypeIcon(step.step_type)}
                        <div>
                          <h4 className="font-medium text-gray-800">{step.step_name}</h4>
                          <p className="text-sm text-gray-600">
                            {step.assignee_name ? `Assigné à: ${step.assignee_name}` : 'Non assigné'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <Badge 
                      variant={
                        step.status === 'completed' ? 'default' :
                        step.status === 'in_progress' ? 'secondary' :
                        step.status === 'overdue' ? 'destructive' :
                        'outline'
                      }
                      className={
                        step.status === 'completed' ? 'bg-green-100 text-green-800' :
                        step.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                        step.status === 'overdue' ? 'bg-red-100 text-red-800' :
                        ''
                      }
                    >
                      {step.status === 'completed' ? 'Terminé' :
                       step.status === 'in_progress' ? 'En cours' :
                       step.status === 'overdue' ? 'En retard' :
                       'En attente'}
                    </Badge>
                    
                    <div className="text-sm text-gray-600">
                      {step.progress}%
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="border-2 border-dashed border-gray-300">
          <CardContent className="p-6 text-center">
            <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h4 className="text-lg font-medium text-gray-900 mb-2">Aucune étape générée</h4>
            <p className="text-gray-600 mb-4">
              Les étapes du dossier n'ont pas encore été générées.
            </p>
            <Button onClick={handleGenerateSteps} disabled={stepsLoading}>
              {stepsLoading ? 'Génération...' : 'Générer les étapes'}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
} 