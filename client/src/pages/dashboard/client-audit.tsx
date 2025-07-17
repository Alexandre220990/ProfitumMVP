import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, CheckCircle2, Clock, FileText, MessageSquare, User } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import HeaderClient from "@/components/HeaderClient";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useState } from "react";

interface DemoAudit { id: string;
  client_id: string;
  expert_id: string;
  audit_type: string;
  status: string;
  current_step: number;
  potential_gain: number;
  obtained_gain: number;
  reliability: number;
  progress: number;
  description: string;
  is_eligible_product: boolean;
  charter_signed: boolean;
  created_at: string;
  updated_at: string;
  tauxFinal: number;
  dureeFinale: number; }

interface DemoExpert { id: string;
  name: string;
  title: string;
  rating: number;
  experience: string;
  specializations: string[]; }

const ClientAudit = () => { const navigate = useNavigate();
  const { id } = useParams();
  const [selectedExpert, setSelectedExpert] = useState<DemoExpert>({ id: "1", name: "Jean Dupont", title: "Expert Senior", rating: 4.8, experience: "15 ans", specializations: ["TICPE", "CIR"] });

  // Données de démonstration pour les experts
  const demoExperts: DemoExpert[] = [
    { id: "1", name: "Jean Dupont", title: "Expert Senior", rating: 4.8, experience: "15 ans", specializations: ["TICPE", "CIR"] },
    { id: "2", name: "Marie Laurent", title: "Expert Principal", rating: 4.9, experience: "12 ans", specializations: ["TICPE", "URSSAF"] },
    { id: "3", name: "Pierre Martin", title: "Expert Senior", rating: 4.7, experience: "10 ans", specializations: ["TICPE", "CICE"] },
    { id: "4", name: "Sophie Dubois", title: "Expert Principal", rating: 4.9, experience: "18 ans", specializations: ["TICPE", "CIR", "CICE"] },
    { id: "5", name: "Thomas Bernard", title: "Expert Senior", rating: 4.6, experience: "8 ans", specializations: ["TICPE", "URSSAF"] }
  ];

  // Données de démonstration
  const demoAudits: DemoAudit[] = [
    { id: "1", client_id: "demo-client", expert_id: "demo-expert", audit_type: "TICPE", status: "en_cours", current_step: 2, potential_gain: 25000, obtained_gain: 0, reliability: 85, progress: 45, description: "Optimisation de la Taxe Intérieure de Consommation sur les Produits Énergétiques", is_eligible_product: true, charter_signed: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString(), tauxFinal: 85, dureeFinale: 45 },
    { id: "2", client_id: "demo-client", expert_id: "demo-expert", audit_type: "CIR", status: "en_attente", current_step: 1, potential_gain: 15000, obtained_gain: 0, reliability: 90, progress: 20, description: "Crédit d'Impôt Recherche", is_eligible_product: true, charter_signed: false, created_at: new Date().toISOString(), updated_at: new Date().toISOString(), tauxFinal: 90, dureeFinale: 60 },
    { id: "3", client_id: "demo-client", expert_id: "demo-expert", audit_type: "URSSAF", status: "termine", current_step: 3, potential_gain: 18000, obtained_gain: 18000, reliability: 95, progress: 100, description: "Optimisation des cotisations sociales", is_eligible_product: true, charter_signed: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString(), tauxFinal: 95, dureeFinale: 30 }
  ];

  const audit = demoAudits.find(a => a.id === id);

  if (!audit) { return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md w-full">
          <CardContent className="p-6">
            <h2 className="text-2xl font-bold text-center mb-4">Audit non trouvé</h2>
            <p className="text-center text-gray-600 mb-6">
              L'audit que vous recherchez n'existe pas.
            </p>
            <Button
              onClick={() => navigate("/dashboard/client/demo") }
              className="w-full"
            >
              Retour au tableau de bord
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getStatusColor = (status: string) => { switch (status) {
      case "en_cours":
        return "bg-blue-100 text-blue-800";
      case "en_attente":
        return "bg-yellow-100 text-yellow-800";
      case "termine":
        return "bg-green-100 text-green-800";
      case "annule":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800"; }
  };

  const formatDate = (date: string) => { return new Date(date).toLocaleDateString("fr-FR", {
      day: "numeric", month: "long", year: "numeric" });
  };

  const handleExpertChange = (expert: DemoExpert) => { setSelectedExpert(expert); };

  return (
    <>
      <HeaderClient />
      <div className="min-h-screen bg-gray-50 p-6 pt-28">
        <div className="max-w-4xl mx-auto">
          <Button
            variant="ghost"
            className="mb-6"
            onClick={ () => navigate("/dashboard/client/demo") }
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Retour au tableau de bord
          </Button>

          <div className="grid gap-6">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>{ audit.audit_type }</CardTitle>
                  <Badge className={ getStatusColor(audit.status) }>
                    { audit.status }
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Description</h3>
                    <p className="text-gray-600">{ audit.description }</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <FileText className="h-4 w-4 text-blue-500" />
                          <h4 className="font-medium">Gain potentiel</h4>
                        </div>
                        <p className="text-2xl font-bold text-green-600">
                          { audit.potential_gain.toLocaleString() }€
                        </p>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <CheckCircle2 className="h-4 w-4 text-green-500" />
                          <h4 className="font-medium">Gain obtenu</h4>
                        </div>
                        <p className="text-2xl font-bold text-green-600">
                          { audit.obtained_gain.toLocaleString() }€
                        </p>
                      </CardContent>
                    </Card>

                    <Card className="cursor-pointer" onClick={ () => navigate("/produits/ticpe") }>
                      <CardContent className="p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <Clock className="h-4 w-4 text-blue-500" />
                          <h4 className="font-medium">Progression</h4>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2.5">
                          <div
                            className="bg-blue-600 h-2.5 rounded-full"
                            style={ { width: `${audit.progress }%` }}
                          ></div>
                        </div>
                        <p className="text-sm text-gray-600 mt-2">
                          { audit.progress }% complété
                        </p>
                      </CardContent>
                    </Card>

                    <Dialog>
                      <DialogTrigger asChild>
                        <Card className="cursor-pointer">
                          <CardContent className="p-4">
                            <div className="flex items-center gap-2 mb-2">
                              <MessageSquare className="h-4 w-4 text-purple-500" />
                              <h4 className="font-medium">Expert assigné</h4>
                            </div>
                            <p className="text-lg font-medium">{ selectedExpert.name }</p>
                            <p className="text-sm text-gray-600">{ selectedExpert.title }</p>
                          </CardContent>
                        </Card>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader>
                          <DialogTitle>Changer d'expert</DialogTitle>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                          { demoExperts.map((expert) => (
                            <div
                              key={expert.id }
                              className={ `flex items-center justify-between p-4 rounded-lg cursor-pointer ${
                                selectedExpert.id === expert.id
                                  ? "bg-blue-50 border-2 border-blue-500"
                                  : "hover:bg-gray-50" }`}
                              onClick={ () => handleExpertChange(expert) }
                            >
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                                  <User className="h-5 w-5 text-blue-600" />
                                </div>
                                <div>
                                  <p className="font-medium">{ expert.name }</p>
                                  <p className="text-sm text-gray-600">{ expert.title }</p>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="text-sm font-medium">⭐ { expert.rating }</p>
                                <p className="text-xs text-gray-600">{ expert.experience }</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-medium mb-2">Date de création</h4>
                      <p className="text-gray-600">{ formatDate(audit.created_at) }</p>
                    </div>
                    <div>
                      <h4 className="font-medium mb-2">Dernière mise à jour</h4>
                      <p className="text-gray-600">{ formatDate(audit.updated_at) }</p>
                    </div>
                  </div>

                  <div className="flex justify-end gap-4">
                    <Button
                      variant="outline"
                      onClick={ () => navigate("/simulateur") }
                    >
                      <MessageSquare className="mr-2 h-4 w-4" />
                      Contacter l'expert
                    </Button>
                    <Button>
                      Voir les documents
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
};

export default ClientAudit; 