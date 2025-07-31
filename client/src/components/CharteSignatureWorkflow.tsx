import React, { useState, useEffect, useCallback } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { FileSignature, CheckCircle, Clock, Users, FileText, Shield } from "lucide-react";
import { signCharte, checkCharteSignature } from "@/lib/charte-signature-api";

interface CharteSignatureWorkflowProps {
  clientProduitId: string;
  productName: string;
  companyName?: string;
  estimatedAmount?: number;
  onSignatureComplete?: (success: boolean) => void;
  className?: string;
}

export default function CharteSignatureWorkflow({
  clientProduitId,
  productName,
  companyName,
  estimatedAmount,
  onSignatureComplete,
  className = ""
}: CharteSignatureWorkflowProps) {
  const { toast } = useToast();
  
  // États simplifiés
  const [isSigned, setIsSigned] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSigning, setIsSigning] = useState(false);
  const [showCharteDialog, setShowCharteDialog] = useState(false);
  const [charteAccepted, setCharteAccepted] = useState(false);

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

  // Étapes simplifiées
  const steps = [
    {
      id: 0,
      title: "Signature de la charte",
      description: "Accepter les conditions d'engagement",
      status: isSigned ? 'completed' : 'active',
      icon: <FileSignature className="w-5 h-5" />,
      action: !isSigned ? () => setShowCharteDialog(true) : undefined,
      actionLabel: "Signer la charte"
    },
    {
      id: 1,
      title: "Sélection d'expert",
      description: "Choisir un expert qualifié",
      status: isSigned ? 'active' : 'pending',
      icon: <Users className="w-5 h-5" />,
      actionLabel: "Sélectionner un expert"
    },
    {
      id: 2,
      title: "Complétion du dossier",
      description: "Remplir les informations nécessaires",
      status: 'pending',
      icon: <FileText className="w-5 h-5" />,
      actionLabel: "Compléter le dossier"
    },
    {
      id: 3,
      title: "Validation administrative",
      description: "Vérification et approbation",
      status: 'pending',
      icon: <Shield className="w-5 h-5" />,
      actionLabel: "En attente"
    }
  ];

  const progressPercentage = Math.round((isSigned ? 25 : 0));

  if (isLoading) {
    return (
      <div className={`flex items-center justify-center p-8 ${className}`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Vérification du statut...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* En-tête simplifié */}
      <div className="text-center">
        <h3 className="text-lg font-semibold text-gray-800 mb-2">
          Progression de votre dossier {productName}
        </h3>
        {companyName && (
          <p className="text-sm text-gray-600 mb-4">Entreprise : {companyName}</p>
        )}
        
        {/* Barre de progression */}
        <div className="mb-6">
          <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
            <span>Progression globale</span>
            <span>{progressPercentage}%</span>
          </div>
          <Progress value={progressPercentage} className="h-2" />
        </div>
      </div>

      {/* Étapes du workflow */}
      <div className="space-y-4">
        {steps.map((step) => (
          <Card 
            key={step.id}
            className={`transition-all duration-200 ${
              step.status === 'active' 
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
                    {step.status === 'completed' ? (
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    ) : step.status === 'active' ? (
                      <div className="w-5 h-5 rounded-full bg-blue-500 animate-pulse" />
                    ) : (
                      <Clock className="w-5 h-5 text-gray-400" />
                    )}
                    <span className="text-sm font-medium text-gray-600">
                      {step.id + 1}
                    </span>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center space-x-2">
                      {step.icon}
                      <div>
                        <h4 className="font-medium text-gray-800">{step.title}</h4>
                        <p className="text-sm text-gray-600">{step.description}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <Badge 
                    variant={
                      step.status === 'completed' ? 'default' :
                      step.status === 'active' ? 'secondary' :
                      'outline'
                    }
                    className={
                      step.status === 'completed' ? 'bg-green-100 text-green-800' :
                      step.status === 'active' ? 'bg-blue-100 text-blue-800' :
                      ''
                    }
                  >
                    {step.status === 'completed' ? 'Terminé' :
                     step.status === 'active' ? 'En cours' :
                     'En attente'}
                  </Badge>
                  
                  {step.action && step.status === 'active' && (
                    <Button 
                      size="sm" 
                      onClick={step.action}
                      className="flex items-center space-x-1"
                    >
                      <span>{step.actionLabel}</span>
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Modal de signature de charte simplifié */}
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