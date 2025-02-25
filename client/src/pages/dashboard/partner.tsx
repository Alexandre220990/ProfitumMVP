import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CheckCircle2, XCircle, Clock, Euro, FileText, Users } from "lucide-react";
import { useLocation } from "wouter";
import { useState } from "react";

type StatusType = "pending" | "accepted" | "rejected" | "in_progress" | "closed" | "success";

const PartnerDashboard = () => {
  const [, setLocation] = useLocation();
  const [auditTypeFilter, setAuditTypeFilter] = useState("all");

  const handleRowClick = (id: number) => {
    // La redirection se fait vers les pages statiques spécifiques
    const validIds = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17];
    if (validIds.includes(id)) {
      setLocation(`/dossier-client/${id}`);
    } else {
      console.warn(`Page statique non disponible pour l'ID ${id}`);
      setLocation('/dashboard/partner');
    }
  };

  // ✅ Données statiques réalistes
  const stats = {
    pendingRequests: 5,
    activeFiles: 5,
    monthlyRevenue: 12850,
    conversionRate: 53,
  };

  const incomingRequests = [
    { id: 1, clientName: "Paul Lambert", auditType: "Audit TICPE", date: "01/03/2025", estimatedAmount: 4200, documentStatus: "2/10", status: "pending" as StatusType },
    { id: 2, clientName: "Isabelle Moreau", auditType: "Audit MSA", date: "28/02/2025", estimatedAmount: 3100, documentStatus: "5/7", status: "pending" as StatusType },
    { id: 3, clientName: "Alexandre Girard", auditType: "Audit DFS", date: "27/02/2025", estimatedAmount: 2900, documentStatus: "2/3", status: "pending" as StatusType },
    { id: 4, clientName: "Sophie Lefevre", auditType: "Audit Social", date: "26/02/2025", estimatedAmount: 3500, documentStatus: "4/4", status: "pending" as StatusType },
    { id: 5, clientName: "Martin Dubois", auditType: "Audit Fiscal", date: "25/02/2025", estimatedAmount: 5000, documentStatus: "2/2", status: "pending" as StatusType },
  ];

  const activeFiles = [
    { id: 6, clientName: "Jean Dupont", auditType: "Audit TICPE", creationDate: "10/01/2025", estimatedAmount : 8500, documentStatus: "7/10", lastUpdate: "20/02/2025", status: "accepted" as StatusType },
    { id: 7, clientName: "Sophie Martin", auditType: "Audit TICPE", creationDate: "15/02/2025", estimatedAmount : 15000, documentStatus: "10/10", lastUpdate: "18/02/2025", status: "accepted" as StatusType },
    { id: 8, clientName: "David Morel", auditType: "Audit URSAFF", creationDate: "20/12/2024", estimatedAmount : 3700, documentStatus: "3/5", lastUpdate: "15/02/2025", status: "accepted" as StatusType },
    { id: 9, clientName: "Émilie Bernard", auditType: "Audit TICPE", creationDate: "05/10/2024", estimatedAmount : 5300, documentStatus: "2/10", lastUpdate: "10/02/2025", status: "accepted" as StatusType },
    { id: 10, clientName: "Antoine Rousseau", auditType: "Audit Social", creationDate: "08/02/2025", estimatedAmount : 12200, documentStatus: "3/4", lastUpdate: "05/02/2025", status: "accepted" as StatusType },
  ];

  const closedFiles = [
    { id: 11, clientName: "Julien Mercier", auditType: "Audit TICPE", closureDate: "01/02/2025", estimatedAmount: 7800, obtainedAmount: 5000, fiability: 64, status: "success" as StatusType, comments: "" },
    { id: 12, clientName: "Céline Leroy", auditType: "Audit TICPE", closureDate: "28/01/2025", estimatedAmount: 3000, obtainedAmount: 4000, fiability: 67, status: "success" as StatusType, comments: "" },
    { id: 13, clientName: "Vincent Morel", auditType: "Audit DFS", closureDate: "25/01/2025", estimatedAmount: 10000, obtainedAmount: 3000, fiability: 30, status: "success" as StatusType, comments: "" },
    { id: 14, clientName: "Lucie Garnier", auditType: "Audit Social", closureDate: "22/01/2025", estimatedAmount: 1500, obtainedAmount: 1350, fiability: 90, status: "success" as StatusType, comments: "" },
    { id: 15, clientName: "Michel Durand", auditType: "Audit MSA", closureDate: "20/01/2025", estimatedAmount: 2500, obtainedAmount: null, fiability: 0, status: "rejected" as StatusType, comments: "Hors périmètre" },
    { id: 16, clientName: "Hugo Fabre", auditType: "Audit Foncier", closureDate: "18/01/2025", estimatedAmount: 500, obtainedAmount: null, fiability: 0, status: "rejected" as StatusType, comments: "Faible potentiel" },
    { id: 17, clientName: "Marion Petit", auditType: "Audit TICPE", closureDate: "15/01/2025", estimatedAmount: 200, obtainedAmount: null, fiability: 0, status: "rejected" as StatusType, comments: "Abandon client" },
  ];

  // ✅ Fonction pour récupérer la couleur du statut
  const getStatusColor = (status: StatusType): string => {
    switch (status) {
      case "pending":
        return "text-yellow-600 bg-yellow-100";
      case "accepted":
        return "text-green-600 bg-green-100";
      case "rejected":
        return "text-red-600 bg-red-100";
      case "in_progress":
        return "text-blue-600 bg-blue-100";
      case "success":
        return "text-green-600 bg-green-100";
      default:
        return "text-gray-600 bg-gray-100";
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <header className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Tableau de bord</h1>
        <Button onClick={() => setLocation("/profile")}>Mon Profil</Button>
      </header>

      {/* ✅ Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="flex items-center justify-between pt-6">
            <div>
              <p className="text-sm font-medium text-gray-500">Demandes en attente</p>
              <p className="text-2xl font-bold">{stats.pendingRequests}</p>
            </div>
            <Clock className="w-8 h-8 text-yellow-600" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center justify-between pt-6">
            <div>
              <p className="text-sm font-medium text-gray-500">Dossiers actifs</p>
              <p className="text-2xl font-bold">{stats.activeFiles}</p>
            </div>
            <FileText className="w-8 h-8 text-blue-600" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center justify-between pt-6">
            <div>
              <p className="text-sm font-medium text-gray-500">CA du mois</p>
              <p className="text-2xl font-bold">{stats.monthlyRevenue} €</p>
            </div>
            <Euro className="w-8 h-8 text-green-600" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center justify-between pt-6">
            <div>
              <p className="text-sm font-medium text-gray-500">Taux de conversion</p>
              <p className="text-2xl font-bold">{stats.conversionRate}%</p>
            </div>
            <Users className="w-8 h-8 text-purple-600" />
          </CardContent>
        </Card>
      </div>

      {/* ✅ Onglets */}
      <Tabs defaultValue="requests" className="space-y-6 mt-6">
        <TabsList>
          <TabsTrigger value="requests">Demandes entrantes</TabsTrigger>
          <TabsTrigger value="active">Dossiers actifs</TabsTrigger>
          <TabsTrigger value="closed">Dossiers clôturés</TabsTrigger>
        </TabsList>

        {/* ✅ Demandes entrantes */}
        <TabsContent value="requests">
          <Card>
            <CardHeader>
              <CardTitle>Demandes en attente</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Client</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Montant Potentiel</TableHead>
                    <TableHead>Documents</TableHead>
                    <TableHead>Statut</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {incomingRequests.map((request) => (
                    <TableRow key={request.id} className="cursor-pointer hover:bg-gray-100" onClick={() => handleRowClick(request.id)}>
                      <TableCell>{request.clientName}</TableCell>
                      <TableCell>{request.auditType}</TableCell>
                      <TableCell>{request.date}</TableCell>
                      <TableCell>{request.estimatedAmount} €</TableCell>
                      <TableCell>{request.documentStatus}</TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(request.status)}>
                          {request.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ✅ Dossiers en cours */}
        <TabsContent value="active">
          <Card>
            <CardHeader>
              <CardTitle>Dossiers en cours</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Client</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Date de création</TableHead>
                    <TableHead>Montant Potentiel</TableHead>
                    <TableHead>Document</TableHead>
                    <TableHead>Dernière mise à jour</TableHead>
                    <TableHead>Statut</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {activeFiles.map((file) => (
                    <TableRow 
                      key={file.id} 
                      className="cursor-pointer hover:bg-gray-100"
                      onClick={() => handleRowClick(file.id)}
                    >
                      <TableCell>{file.clientName}</TableCell>
                      <TableCell>{file.auditType}</TableCell>
                      <TableCell>{file.creationDate}</TableCell>
                      <TableCell>{file.estimatedAmount} €</TableCell>
                      <TableCell>{file.documentStatus}</TableCell>
                      <TableCell>{file.lastUpdate}</TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(file.status)}>
                          {file.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ✅ Dossiers clôturés */}
        <TabsContent value="closed">
          <Card>
            <CardHeader>
              <CardTitle>Dossiers clôturés</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Client</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Date de clôture</TableHead>
                    <TableHead>Montant Estimé</TableHead>
                    <TableHead>Montant Obtenu</TableHead>
                    <TableHead>Fiabilité</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Commentaires</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {closedFiles.map((file) => (
                    <TableRow 
                      key={file.id} 
                      className="cursor-pointer hover:bg-gray-100"
                      onClick={() => handleRowClick(file.id)}
                    >
                      <TableCell>{file.clientName}</TableCell>
                      <TableCell>{file.auditType}</TableCell>
                      <TableCell>{file.closureDate}</TableCell>
                      <TableCell>{file.estimatedAmount} €</TableCell>
                      <TableCell>{file.obtainedAmount ? `${file.obtainedAmount} €` : '-'}</TableCell>
                      <TableCell>{file.fiability}%</TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(file.status)}>
                          {file.status === "success" ? "Réussi" : "Refusé"}
                        </Badge>
                      </TableCell>
                      <TableCell>{file.comments}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PartnerDashboard;