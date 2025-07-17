import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Clock, MessageSquare, User, DollarSign, CheckCircle, XCircle, Star, Calendar } from "lucide-react";
import { put, get } from "@/lib/api";

interface Assignment {
  id: string;
  status: string;
  assignment_date: string;
  accepted_date?: string;
  completed_date?: string;
  client_name: string;
  client_company: string;
  produit_nom?: string;
  produit_description?: string;
  client_rating?: number;
  client_feedback?: string;
  expert_rating?: number;
  expert_feedback?: string;
  compensation_amount?: number;
  notes?: string;
}

interface AssignmentsResponse {
  assignments: Assignment[];
}

const statusConfig = {
  pending: {
    label: 'En attente',
    color: 'bg-yellow-100 text-yellow-800',
    icon: Clock
  },
  accepted: {
    label: 'Acceptée',
    color: 'bg-blue-100 text-blue-800',
    icon: CheckCircle
  },
  completed: {
    label: 'Terminée',
    color: 'bg-green-100 text-green-800',
    icon: CheckCircle
  },
  rejected: {
    label: 'Rejetée',
    color: 'bg-red-100 text-red-800',
    icon: XCircle
  },
  cancelled: {
    label: 'Annulée',
    color: 'bg-gray-100 text-gray-800',
    icon: XCircle
  }
};

export default function ExpertAssignments() {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('pending');
  const [selectedAssignment, setSelectedAssignment] = useState<string | null>(null);
  const [feedback, setFeedback] = useState('');

  useEffect(() => {
    loadAssignments();
  }, []);

  const loadAssignments = async () => {
    try {
      const response = await get<AssignmentsResponse>('/experts/assignments');
      if (response.success && response.data) {
        setAssignments(response.data.assignments);
      }
    } catch (error) {
      console.error('Erreur chargement assignations: ', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredAssignments = assignments.filter(assignment => {
    if (activeTab === 'all') return true;
    return assignment.status === activeTab;
  });

  const getStatusConfig = (status: string) => {
    return statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
  };

  const updateAssignmentStatus = async (assignmentId: string, status: string) => {
    try {
      const response = await put(`/experts/assignments/${assignmentId}/status`, {
        status,
        feedback: feedback || undefined
      });

      if (response.success) {
        loadAssignments();
        setSelectedAssignment(null);
        setFeedback('');
        alert(`Assignation ${status === 'accepted' ? 'acceptée' : 'rejetée'} avec succès !`);
      }
    } catch (error) {
      console.error('Erreur mise à jour statut: ', error);
      alert('Erreur lors de la mise à jour');
    }
  };

  const completeAssignment = async (assignmentId: string) => {
    try {
      const response = await put(`/experts/assignments/${assignmentId}/status`, {
        status: 'completed',
        feedback: feedback || undefined
      });

      if (response.success) {
        loadAssignments();
        setSelectedAssignment(null);
        setFeedback('');
        alert('Mission marquée comme terminée !');
      }
    } catch (error) {
      console.error('Erreur finalisation: ', error);
      alert('Erreur lors de la finalisation');
    }
  };

  const openMessage = (assignmentId: string) => {
    window.open(`/messages/${assignmentId}`, '_blank');
  };

  const getStats = () => {
    const total = assignments.length;
    const pending = assignments.filter(a => a.status === 'pending').length;
    const accepted = assignments.filter(a => a.status === 'accepted').length;
    const completed = assignments.filter(a => a.status === 'completed').length;
    const totalRevenue = assignments
      .filter(a => a.status === 'completed')
      .reduce((sum, a) => sum + (a.compensation_amount || 0), 0);
    const avgRating = assignments
      .filter(a => a.client_rating)
      .reduce((sum, a) => sum + (a.client_rating || 0), 0) / 
      assignments.filter(a => a.client_rating).length || 0;

    return { total, pending, accepted, completed, totalRevenue, avgRating };
  };

  const stats = getStats();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement de vos missions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Mes missions
          </h1>
          <p className="text-gray-600">
            Gérez vos assignations et suivez vos missions avec les clients
          </p>
        </div>

        {/* Statistiques */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Clock className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">En attente</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.pending}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <CheckCircle className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">En cours</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.accepted}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Terminées</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.completed}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <Star className="h-6 w-6 text-yellow-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Note moyenne</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stats.avgRating > 0 ? stats.avgRating.toFixed(1) : 'N/A'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg">
                  <DollarSign className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Revenus</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stats.totalRevenue}€
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Onglets */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="pending">En attente</TabsTrigger>
            <TabsTrigger value="accepted">En cours</TabsTrigger>
            <TabsTrigger value="completed">Terminées</TabsTrigger>
            <TabsTrigger value="cancelled">Annulées</TabsTrigger>
            <TabsTrigger value="all">Toutes</TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="space-y-6">
            {filteredAssignments.length > 0 ? (
              filteredAssignments.map((assignment) => {
                const status = getStatusConfig(assignment.status);
                const StatusIcon = status.icon;

                return (
                  <Card key={assignment.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
                        <div className="flex-1">
                          {/* Header */}
                          <div className="flex items-start justify-between mb-4">
                            <div>
                              <h3 className="text-lg font-semibold text-gray-900 mb-1">
                                {assignment.client_name}
                              </h3>
                              <p className="text-gray-600 mb-2">{assignment.client_company}</p>
                              <div className="flex items-center gap-4 text-sm">
                                <div className="flex items-center gap-1">
                                  <Calendar className="h-4 w-4" />
                                  <span>
                                    {new Date(assignment.assignment_date).toLocaleDateString()}
                                  </span>
                                </div>
                                {assignment.compensation_amount && (
                                  <div className="flex items-center gap-1">
                                    <DollarSign className="h-4 w-4" />
                                    <span>{assignment.compensation_amount}€</span>
                                  </div>
                                )}
                              </div>
                            </div>
                            <Badge className={status.color}>
                              <StatusIcon className="h-3 w-3 mr-1" />
                              {status.label}
                            </Badge>
                          </div>

                          {/* Détails */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            {assignment.produit_nom && (
                              <div>
                                <span className="text-sm font-medium text-gray-600">Produit :</span>
                                <p className="text-sm">{assignment.produit_nom}</p>
                              </div>
                            )}
                            {assignment.notes && (
                              <div>
                                <span className="text-sm font-medium text-gray-600">Demande client :</span>
                                <p className="text-sm">{assignment.notes}</p>
                              </div>
                            )}
                          </div>

                          {/* Feedback client */}
                          {assignment.client_feedback && (
                            <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                              <span className="text-sm font-medium text-gray-600">Avis client :</span>
                              <p className="text-sm text-gray-700 mt-1">{assignment.client_feedback}</p>
                              {assignment.client_rating && (
                                <div className="flex items-center gap-1 mt-2">
                                  {[1, 2, 3, 4, 5].map((rating) => (
                                    <Star
                                      key={rating}
                                      className={`h-4 w-4 ${
                                        rating <= assignment.client_rating!
                                          ? 'text-yellow-400 fill-current'
                                          : 'text-gray-300'
                                      }`}
                                    />
                                  ))}
                                  <span className="text-sm text-gray-600 ml-2">
                                    {assignment.client_rating}/5
                                  </span>
                                </div>
                              )}
                            </div>
                          )}

                          {/* Zone de feedback pour l'expert */}
                          {selectedAssignment === assignment.id && (
                            <div className="mb-4">
                              <Textarea
                                placeholder="Ajouter un commentaire ou feedback..."
                                value={feedback}
                                onChange={(e) => setFeedback(e.target.value)}
                                className="mb-2"
                              />
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  onClick={() => setSelectedAssignment(null)}
                                >
                                  Annuler
                                </Button>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Actions */}
                        <div className="flex flex-col gap-2 mt-4 lg:mt-0 lg:ml-6">
                          {/* Message */}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openMessage(assignment.id)}
                            className="flex items-center gap-2"
                          >
                            <MessageSquare className="h-4 w-4" />
                            Message
                          </Button>

                          {/* Actions selon le statut */}
                          {assignment.status === 'pending' && (
                            <div className="space-y-2">
                              <Button
                                size="sm"
                                onClick={() => updateAssignmentStatus(assignment.id, 'accepted')}
                                className="w-full"
                              >
                                Accepter
                              </Button>
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => updateAssignmentStatus(assignment.id, 'rejected')}
                                className="w-full"
                              >
                                Rejeter
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setSelectedAssignment(assignment.id)}
                                className="w-full"
                              >
                                Ajouter un commentaire
                              </Button>
                            </div>
                          )}

                          {assignment.status === 'accepted' && (
                            <div className="space-y-2">
                              <Button
                                size="sm"
                                onClick={() => completeAssignment(assignment.id)}
                                className="w-full"
                              >
                                Marquer comme terminée
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setSelectedAssignment(assignment.id)}
                                className="w-full"
                              >
                                Ajouter un commentaire
                              </Button>
                            </div>
                          )}

                          {assignment.status === 'completed' && (
                            <div className="text-center">
                              <div className="text-sm text-gray-600 mb-2">
                                Mission terminée
                              </div>
                              {assignment.completed_date && (
                                <div className="text-xs text-gray-500">
                                  {new Date(assignment.completed_date).toLocaleDateString()}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            ) : (
              <Card>
                <CardContent className="p-12 text-center">
                  <div className="text-gray-400 mb-4">
                    <User className="h-16 w-16 mx-auto" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Aucune mission trouvée
                  </h3>
                  <p className="text-gray-600 mb-4">
                    {activeTab === 'all' 
                      ? 'Vous n\'avez pas encore de missions.'
                      : `Aucune mission ${activeTab === 'pending' ? 'en attente' : 
                         activeTab === 'accepted' ? 'en cours' : 
                         activeTab === 'completed' ? 'terminée' : 'annulée'}.`
                    }
                  </p>
                  <Button onClick={() => window.open('/profile/expert', '_blank')}>
                    Optimiser mon profil
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
} 