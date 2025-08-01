import React, { useState, useEffect, useCallback } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { FileSignature, CheckCircle, Clock, Users, FileText, Shield, Play, AlertCircle, DollarSign } from "lucide-react";
import { signCharte, checkCharteSignature } from "@/lib/charte-signature-api";
import { useDossierSteps } from '@/hooks/use-dossier-steps';

interface ProductWorkflowCompleteProps {
  clientProduitId: string;
  productName: string;
  companyName?: string;
  estimatedAmount?: number;
  onSignatureComplete?: (success: boolean) => void;
  onStepUpdate?: (stepId: string, updates: any) => void;
  className?: string;
}

export default function ProductWorkflowComplete({
  clientProduitId,
  productName,
  companyName,
  estimatedAmount,
  onSignatureComplete,
  onStepUpdate,
  className = ""
}: ProductWorkflowCompleteProps) {
  const { toast } = useToast();
  
  // États pour la signature de charte
  const [isSigned, setIsSigned] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSigning, setIsSigning] = useState(false);
  const [showCharteDialog, setShowCharteDialog] = useState(false);
  const [charteAccepted, setCharteAccepted] = useState(false);

  // Hook pour les étapes du dossier
  const {
    steps,
    loading: stepsLoading,
    error: stepsError,
    generateSteps,
    updateStep,
    refreshSteps,
    totalSteps,
    completedSteps,
    inProgressSteps,
    pendingSteps,
    overallProgress
  } = useDossierSteps(clientProduitId);

  // Vérifier le statut de signature au chargement
  useEffect(() => {
    checkSignatureStatus();
  }, [clientProduitId]);

  const checkSignatureStatus = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await checkCharteSignature(clientProduitId);
      
      if (response.success && response.data) {
        setIsSigned(response.data.signed);
      }
    } catch (error) {
      console.error('Erreur lors de la vérification de la signature:', error);
      toast({
        title: "Erreur",
        description: "Impossible de vérifier le statut de la signature",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  }, [clientProduitId, toast]);

  const handleSignCharte = useCallback(async () => {
    if (!charteAccepted) {
      toast({
        title: "Action requise",
        description: "Veuillez accepter les conditions de la charte",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsSigning(true);
      
      const signatureData = {
        clientProduitEligibleId: clientProduitId,
        ipAddress: undefined,
        userAgent: navigator.userAgent
      };

      const response = await signCharte(signatureData);

      if (response.success && response.data) {
        setIsSigned(true);
        setShowCharteDialog(false);
        
        toast({
          title: "Succès",
          description: "Charte signée avec succès !",
        });

        onSignatureComplete?.(true);
      } else {
        throw new Error(response.message || "Erreur lors de la signature");
      }
    } catch (error) {
      console.error('Erreur lors de la signature:', error);
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Impossible de signer la charte",
        variant: "destructive"
      });
    } finally {
      setIsSigning(false);
    }
  }, [charteAccepted, clientProduitId, toast, onSignatureComplete]);

  // Gestion des étapes du dossier
  const handleStepUpdate = useCallback(async (stepId: string, updates: any) => {
    try {
      const success = await updateStep(stepId, updates);
      if (success) {
        onStepUpdate?.(stepId, updates);
        toast({
          title: "Succès",
          description: "Étape mise à jour avec succès",
        });
      }
    } catch (error) {
      console.error('Erreur lors de la mise à jour de l\'étape:', error);
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour l'étape",
        variant: "destructive"
      });
    }
  }, [updateStep, onStepUpdate, toast]);

  const handleGenerateSteps = useCallback(async () => {
    try {
      const success = await generateSteps(clientProduitId);
      if (success) {
        toast({
          title: "Succès",
          description: "Étapes générées avec succès",
        });
      }
    } catch (error) {
      console.error('Erreur lors de la génération des étapes:', error);
      toast({
        title: "Erreur",
        description: "Impossible de générer les étapes",
        variant: "destructive"
      });
    }
  }, [generateSteps, clientProduitId, toast]);

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

  if (isLoading || stepsLoading) {
    return (
      <div className={`flex items-center justify-center p-8 ${className}`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement...</p>
        </div>
      </div>
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

      {/* Section Signature de Charte */}
      <Card className="border-2 border-blue-200 bg-blue-50">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                {isSigned ? (
                  <CheckCircle className="w-5 h-5 text-green-500" />
                ) : (
                  <div className="w-5 h-5 rounded-full bg-blue-500 animate-pulse" />
                )}
                <span className="text-sm font-medium text-gray-600">1</span>
              </div>
              
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-2">
                  <FileSignature className="w-5 h-5" />
                  <div>
                    <h4 className="font-medium text-gray-800">Signature de la charte</h4>
                    <p className="text-sm text-gray-600">Accepter les conditions d'engagement</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <Badge 
                variant={isSigned ? 'default' : 'secondary'}
                className={isSigned ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}
              >
                {isSigned ? 'Terminé' : 'En cours'}
              </Badge>
              
              {!isSigned && (
                <Button 
                  size="sm" 
                  onClick={() => setShowCharteDialog(true)}
                  className="flex items-center space-x-1"
                >
                  <span>Signer la charte</span>
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

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

      {/* Modal de signature de charte */}
      <Dialog open={showCharteDialog} onOpenChange={setShowCharteDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileSignature className="w-5 h-5" />
              Signature de la charte - {productName}
            </DialogTitle>
            <DialogDescription>
              Veuillez lire et accepter les conditions de la charte pour continuer.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Contenu de la charte */}
            <div className="bg-gray-50 p-4 rounded-lg max-h-60 overflow-y-auto">
              <h4 className="font-semibold mb-2">Charte d'engagement - {productName}</h4>
              <div className="text-sm text-gray-700 space-y-2">
                <p>En signant cette charte, vous vous engagez à :</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Fournir les informations et documents nécessaires dans les délais impartis</li>
                  <li>Collaborer activement avec l'expert assigné pour optimiser vos gains</li>
                  <li>Respecter les procédures et réglementations en vigueur</li>
                  <li>Informer immédiatement de tout changement de situation</li>
                  <li>Accepter les conditions de commission de l'expert</li>
                </ul>
                {estimatedAmount && (
                  <p className="mt-4">
                    <strong>Gain potentiel estimé :</strong> {estimatedAmount.toLocaleString()}€
                  </p>
                )}
              </div>
            </div>
            
            {/* Checkbox d'acceptation */}
            <div className="flex items-start space-x-2">
              <Checkbox
                id="charte-accept"
                checked={charteAccepted}
                onCheckedChange={(checked: boolean) => setCharteAccepted(checked)}
              />
              <label 
                htmlFor="charte-accept" 
                className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                J'accepte les termes de la charte et autorise l'équipe à procéder à l'optimisation de mes obligations {productName}.
              </label>
            </div>
          </div>
          
          {/* Boutons d'action */}
          <div className="flex space-x-3 pt-4">
            <Button 
              variant="outline" 
              onClick={() => setShowCharteDialog(false)}
              className="flex-1"
            >
              Annuler
            </Button>
            <Button 
              onClick={handleSignCharte}
              disabled={!charteAccepted || isSigning}
              className="flex-1 bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700"
            >
              {isSigning ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Signature en cours...
                </>
              ) : (
                <>
                  <FileSignature className="w-4 h-4 mr-2" />
                  Signer la charte
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
} 