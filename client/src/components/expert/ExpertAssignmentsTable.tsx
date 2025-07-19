import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  Search, 
  Eye, 
  MessageCircle, 
  Calendar, 
  Euro,
  CheckCircle,
  AlertCircle,
  Loader2
} from "lucide-react";
import type { Assignment } from "@/types/assignment";

interface ExpertAssignmentsTableProps {
  assignments: Assignment[];
  className?: string;
}

export const ExpertAssignmentsTable = ({ 
  assignments, 
  className = "" 
}: ExpertAssignmentsTableProps) => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [activeTab, setActiveTab] = useState("opportunities");

  // Filtrer les assignations
  const filteredAssignments = useMemo(() => {
    let filtered = assignments;

    // Filtre par statut
    if (statusFilter !== "all") {
      filtered = filtered.filter(assignment => assignment.status === statusFilter);
    }

    // Filtre par recherche
    if (searchTerm) {
      filtered = filtered.filter(assignment =>
        (assignment.Client?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (assignment.ProduitEligible?.nom || '').toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    return filtered;
  }, [assignments, statusFilter, searchTerm]);

  // Grouper par statut
  const opportunities = filteredAssignments.filter(a => a.status === 'pending');
  const inProgress = filteredAssignments.filter(a => 
    a.status === 'accepted' || a.status === 'in_progress'
  );
  const completed = filteredAssignments.filter(a => a.status === 'completed');

  const getStatusBadge = (status: string | undefined) => {
    switch (status) {
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800">En attente</Badge>;
      case 'accepted':
        return <Badge className="bg-blue-100 text-blue-800">Acceptée</Badge>;
      case 'in_progress':
        return <Badge className="bg-orange-100 text-orange-800">En cours</Badge>;
      case 'completed':
        return <Badge className="bg-green-100 text-green-800">Terminée</Badge>;
      case 'cancelled':
        return <Badge className="bg-red-100 text-red-800">Annulée</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">{status || 'Inconnu'}</Badge>;
    }
  };

  const getPriorityBadge = (priority: string | undefined) => {
    switch (priority) {
      case 'urgent':
        return <Badge className="bg-red-100 text-red-800">Urgent</Badge>;
      case 'high':
        return <Badge className="bg-orange-100 text-orange-800">Élevée</Badge>;
      case 'normal':
        return <Badge className="bg-blue-100 text-blue-800">Normale</Badge>;
      case 'low':
        return <Badge className="bg-gray-100 text-gray-800">Faible</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">{priority || 'Non définie'}</Badge>;
    }
  };

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return 'Date non disponible';
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const formatCurrency = (amount: number | undefined) => {
    if (amount === undefined || amount === null) return '0,00 €';
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  const handleViewAssignment = (assignmentId: string) => {
    navigate(`/expert/assignment/${assignmentId}`);
  };

  const handleContactClient = (clientId: string) => {
    navigate(`/expert/messagerie?client=${clientId}`);
  };

  const renderAssignmentsTable = (assignmentsList: Assignment[], emptyMessage: string) => (
    <div className="space-y-4">
      {assignmentsList.length === 0 ? (
        <div className="text-center py-8">
          <div className="text-gray-400 mb-4">
            {activeTab === "opportunities" && <AlertCircle className="h-12 w-12 mx-auto" />}
            {activeTab === "in-progress" && <Loader2 className="h-12 w-12 mx-auto" />}
            {activeTab === "completed" && <CheckCircle className="h-12 w-12 mx-auto" />}
          </div>
          <p className="text-gray-500">{emptyMessage}</p>
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Client</TableHead>
              <TableHead>Produit</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead>Priorité</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Compensation</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {assignmentsList.map((assignment) => (
              <TableRow key={assignment.id}>
                <TableCell>
                  <div>
                    <p className="font-medium">{assignment.Client?.name || 'Client inconnu'}</p>
                    <p className="text-sm text-gray-500">{assignment.Client?.email || 'Email non disponible'}</p>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline">{assignment.ProduitEligible?.nom || 'Produit inconnu'}</Badge>
                </TableCell>
                <TableCell>{getStatusBadge(assignment.status)}</TableCell>
                <TableCell>{getPriorityBadge(assignment.priority)}</TableCell>
                <TableCell>
                  <div className="flex items-center space-x-1">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    <span>{formatDate(assignment.assignment_date)}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center space-x-1">
                    <Euro className="h-4 w-4 text-green-600" />
                    <span className="font-medium">
                      {formatCurrency(assignment.compensation_amount)}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleViewAssignment(assignment.id)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleContactClient(assignment.client_id)}
                    >
                      <MessageCircle className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl">Mes Assignations</CardTitle>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Search className="h-4 w-4 text-gray-400" />
              <Input
                placeholder="Rechercher..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-64"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filtrer par statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                <SelectItem value="pending">En attente</SelectItem>
                <SelectItem value="accepted">Acceptées</SelectItem>
                <SelectItem value="in_progress">En cours</SelectItem>
                <SelectItem value="completed">Terminées</SelectItem>
                <SelectItem value="cancelled">Annulées</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="opportunities">
              <AlertCircle className="h-4 w-4 mr-2" />
              Opportunités ({opportunities.length})
            </TabsTrigger>
            <TabsTrigger value="in-progress">
              <Loader2 className="h-4 w-4 mr-2" />
              En cours ({inProgress.length})
            </TabsTrigger>
            <TabsTrigger value="completed">
              <CheckCircle className="h-4 w-4 mr-2" />
              Terminées ({completed.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="opportunities" className="mt-6">
            {renderAssignmentsTable(
              opportunities,
              "Aucune opportunité en attente"
            )}
          </TabsContent>

          <TabsContent value="in-progress" className="mt-6">
            {renderAssignmentsTable(
              inProgress,
              "Aucune mission en cours"
            )}
          </TabsContent>

          <TabsContent value="completed" className="mt-6">
            {renderAssignmentsTable(
              completed,
              "Aucune mission terminée"
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}; 