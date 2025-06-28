import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { useNavigate } from "react-router-dom";
import { Clock, CheckCircle, XCircle } from "lucide-react";

const DemandesEnAttente = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Rediriger si l'utilisateur n'est pas connecté
  React.useEffect(() => {
    if (!user) {
      navigate('/auth');
    }
  }, [user, navigate]);

  // Exemple de données de demandes en attente
  const demandesEnAttente = [
    {
      id: 1,
      type: 'Inscription Expert',
      date: '2024-04-07',
      statut: 'En attente',
      details: 'Nouvelle demande d\'inscription d\'expert'
    },
    {
      id: 2,
      type: 'Modification Profil',
      date: '2024-04-06',
      statut: 'En attente',
      details: 'Demande de modification de profil client'
    }
  ];

  const handleApprouver = (id: number) => {
    // TODO: Implémenter l'approbation
    console.log('Approuver la demande:', id);
  };

  const handleRefuser = (id: number) => {
    // TODO: Implémenter le refus
    console.log('Refuser la demande:', id);
  };

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Demandes en attente</h1>
      
      <div className="grid gap-6">
        {demandesEnAttente.map((demande) => (
          <Card key={demande.id}>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>{demande.type}</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Date: {demande.date}
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleApprouver(demande.id)}
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Approuver
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleRefuser(demande.id)}
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Refuser
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <p>{demande.details}</p>
              <div className="flex items-center mt-2 text-sm text-muted-foreground">
                <Clock className="h-4 w-4 mr-2" />
                {demande.statut}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default DemandesEnAttente; 