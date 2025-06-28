import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Euro, FileText, Users, Clock, MessageSquare } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import HeaderClient from "@/components/HeaderClient";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface DemoAudit {
  id: string;
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
  dureeFinale: number;
}

const ClientDemoDashboard = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Données de démonstration
  const demoAudits: DemoAudit[] = [
    {
      id: "1",
      client_id: "demo-client",
      expert_id: "demo-expert",
      audit_type: "TICPE",
      status: "en_cours",
      current_step: 2,
      potential_gain: 25000,
      obtained_gain: 0,
      reliability: 85,
      progress: 45,
      description: "Optimisation de la Taxe Intérieure de Consommation sur les Produits Énergétiques",
      is_eligible_product: true,
      charter_signed: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      tauxFinal: 85,
      dureeFinale: 45
    },
    {
      id: "2",
      client_id: "demo-client",
      expert_id: "demo-expert",
      audit_type: "CIR",
      status: "en_attente",
      current_step: 1,
      potential_gain: 15000,
      obtained_gain: 0,
      reliability: 90,
      progress: 20,
      description: "Crédit d'Impôt Recherche",
      is_eligible_product: true,
      charter_signed: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      tauxFinal: 90,
      dureeFinale: 60
    },
    {
      id: "3",
      client_id: "demo-client",
      expert_id: "demo-expert",
      audit_type: "URSSAF",
      status: "termine",
      current_step: 3,
      potential_gain: 18000,
      obtained_gain: 18000,
      reliability: 95,
      progress: 100,
      description: "Optimisation des cotisations sociales",
      is_eligible_product: true,
      charter_signed: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      tauxFinal: 95,
      dureeFinale: 30
    }
  ];

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const handleStatusFilter = (value: string) => {
    setStatusFilter(value);
  };

  const filteredAudits = demoAudits.filter((audit) => {
    const matchesSearch = audit.audit_type.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || audit.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "en_cours":
        return "bg-blue-100 text-blue-800";
      case "en_attente":
        return "bg-yellow-100 text-yellow-800";
      case "termine":
        return "bg-green-100 text-green-800";
      case "annule":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  return (
    <>
      <HeaderClient />
      <div className="min-h-screen bg-gray-50 p-6 pt-28">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Audits en cours</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{demoAudits.filter(a => a.status === "en_cours").length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Gains potentiels</CardTitle>
              <Euro className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {demoAudits.reduce((sum, audit) => sum + audit.potential_gain, 0).toLocaleString()}€
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Gains obtenus</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {demoAudits.reduce((sum, audit) => sum + audit.obtained_gain, 0).toLocaleString()}€
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Taux de réussite</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {Math.round(demoAudits.reduce((sum, audit) => sum + audit.reliability, 0) / demoAudits.length)}%
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-end mb-6">
          <Button
            onClick={() => navigate("/chatbot-test")}
            className="flex items-center gap-2"
          >
            <MessageSquare className="h-4 w-4" />
            Accéder au Chatbot
          </Button>
        </div>

        <Tabs defaultValue="audits" className="space-y-4">
          <TabsList>
            <TabsTrigger value="audits">Audits</TabsTrigger>
            <TabsTrigger value="profile">Profil</TabsTrigger>
          </TabsList>
          <TabsContent value="audits" className="space-y-4">
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Tableau de bord Client</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col md:flex-row gap-4 mb-6">
                  <div className="flex-1">
                    <Label htmlFor="search">Rechercher un audit</Label>
                    <Input
                      id="search"
                      placeholder="Type d'audit..."
                      value={searchTerm}
                      onChange={handleSearch}
                    />
                  </div>
                  <div className="w-full md:w-48">
                    <Label htmlFor="status">Filtrer par statut</Label>
                    <Select value={statusFilter} onValueChange={handleStatusFilter}>
                      <SelectTrigger>
                        <SelectValue placeholder="Statut" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Tous</SelectItem>
                        <SelectItem value="en_cours">En cours</SelectItem>
                        <SelectItem value="en_attente">En attente</SelectItem>
                        <SelectItem value="termine">Terminé</SelectItem>
                        <SelectItem value="annule">Annulé</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {filteredAudits.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500">Aucun audit trouvé</p>
                  </div>
                ) : (
                  <div className="grid gap-4">
                    {filteredAudits.map((audit) => (
                      <Card key={audit.id}>
                        <CardContent className="p-4">
                          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div>
                              <h3 className="font-semibold">{audit.audit_type}</h3>
                              <p className="text-sm text-gray-500">
                                Créé le {formatDate(audit.created_at)}
                              </p>
                              <p className="text-sm mt-2">{audit.description}</p>
                            </div>
                            <div className="flex items-center gap-4">
                              <div className="text-right">
                                <p className="text-sm font-medium">Gain potentiel</p>
                                <p className="text-lg font-bold text-green-600">{audit.potential_gain.toLocaleString()}€</p>
                              </div>
                              <span
                                className={`px-3 py-1 rounded-full text-sm ${getStatusColor(
                                  audit.status
                                )}`}
                              >
                                {audit.status}
                              </span>
                              <Button
                                onClick={() => navigate(`/dashboard/client/demo/audit/${audit.id}`)}
                              >
                                Voir l'audit
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="profile" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Profil</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold">Entreprise de démonstration</h3>
                    <p className="text-sm text-gray-500">SIREN: 123456789</p>
                  </div>
                  <div>
                    <h4 className="font-medium">Audits en cours</h4>
                    <p className="text-sm">{demoAudits.filter(a => a.status === "en_cours").length} audits</p>
                  </div>
                  <div>
                    <h4 className="font-medium">Gains totaux</h4>
                    <p className="text-sm">
                      {demoAudits.reduce((sum, audit) => sum + audit.obtained_gain, 0).toLocaleString()}€
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
};

export default ClientDemoDashboard; 