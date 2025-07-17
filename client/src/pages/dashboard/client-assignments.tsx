import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Clock, MessageSquare, User, CheckCircle, XCircle, Star, Calendar } from "lucide-react";
import { post, put, get } from "@/lib/api";

interface Assignment {
  id: string;
  status: string;
  assignment_date: string;
  accepted_date?: string;
  completed_date?: string;
  expert_name: string;
  expert_company: string;
  expert_rating: number;
  produit_nom?: string;
  produit_description?: string;
  client_rating?: number;
  client_feedback?: string;
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

export default function ClientAssignments() {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');

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

  const rateAssignment = async (assignmentId: string, rating: number, feedback?: string) => {
    try {
      const response = await post(`/experts/assignments/${assignmentId}/rate`, {
        rating,
        feedback
      });

      if (response.success) {
        loadAssignments(); // Recharger les données
        alert('Note enregistrée avec succès !');
      }
    } catch (error) {
      console.error('Erreur notation: ', error);
      alert('Erreur lors de la notation');
    }
  };

  const cancelAssignment = async (assignmentId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir annuler cette assignation ?')) {
      return;
    }

    try {
      const response = await put(`/experts/assignments/${assignmentId}/status`, {
        status: 'cancelled'
      });

      if (response.success) {
        loadAssignments();
        alert('Assignation annulée avec succès');
      }
    } catch (error) {
      console.error('Erreur annulation: ', error);
      alert('Erreur lors de l\'annulation');
    }
  };

  const openMessage = (assignmentId: string) => {
    // Ouvrir la messagerie pour cette assignation
    window.open(`/messages/${assignmentId}`, '_blank');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement de vos assignations...</p>
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
            Mes assignations d'experts
          </h1>
          <p className="text-gray-600">
            Gérez vos demandes et suivez vos missions avec nos experts
          </p>
        </div>

        {/* Statistiques */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Clock className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">En attente</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {assignments.filter(a => a.status === 'pending').length}
                  </p>
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
                  <p className="text-2xl font-bold text-gray-900">
                    {assignments.filter(a => a.status === 'accepted').length}
                  </p>
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
                  <p className="text-2xl font-bold text-gray-900">
                    {assignments.filter(a => a.status === 'completed').length}
                  </p>
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
                    {assignments.filter(a => a.client_rating).length > 0
                      ? (assignments
                          .filter(a => a.client_rating)
                          .reduce((sum, a) => sum + (a.client_rating || 0), 0) /
                          assignments.filter(a => a.client_rating).length).toFixed(1)
                      : 'N/A'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Onglets */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="all">Toutes</TabsTrigger>
            <TabsTrigger value="pending">En attente</TabsTrigger>
            <TabsTrigger value="accepted">En cours</TabsTrigger>
            <TabsTrigger value="completed">Terminées</TabsTrigger>
            <TabsTrigger value="cancelled">Annulées</TabsTrigger>
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
                                {assignment.expert_name}
                              </h3>
                              <p className="text-gray-600 mb-2">{assignment.expert_company}</p>
                              <div className="flex items-center gap-4 text-sm">
                                <div className="flex items-center gap-1">
                                  <Star className="h-4 w-4 text-yellow-400 fill-current" />
                                  <span>{assignment.expert_rating}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <Calendar className="h-4 w-4" />
                                  <span>
                                    {new Date(assignment.assignment_date).toLocaleDateString()}
                                  </span>
                                </div>
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
                            {assignment.compensation_amount && (
                              <div>
                                <span className="text-sm font-medium text-gray-600">Budget :</span>
                                <p className="text-sm">{assignment.compensation_amount}€</p>
                              </div>
                            )}
                          </div>

                          {/* Notes */}
                          {assignment.notes && (
                            <div className="mb-4">
                              <span className="text-sm font-medium text-gray-600">Notes :</span>
                              <p className="text-sm text-gray-700 mt-1">{assignment.notes}</p>
                            </div>
                          )}

                          {/* Feedback */}
                          {assignment.expert_feedback && (
                            <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                              <span className="text-sm font-medium text-gray-600">Message de l'expert :</span>
                              <p className="text-sm text-gray-700 mt-1">{assignment.expert_feedback}</p>
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
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => cancelAssignment(assignment.id)}
                            >
                              Annuler
                            </Button>
                          )}

                          {assignment.status === 'completed' && !assignment.client_rating && (
                            <div className="space-y-2">
                              <p className="text-sm font-medium text-gray-600">Noter cette mission :</p>
                              <div className="flex gap-1">
                                {[1, 2, 3, 4, 5].map((rating) => (
                                  <button
                                    key={rating}
                                    onClick={() => rateAssignment(assignment.id, rating)}
                                    className="text-2xl text-yellow-400 hover:text-yellow-600"
                                  >
                                    ★
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}

                          {assignment.status === 'completed' && assignment.client_rating && (
                            <div className="text-center">
                              <div className="flex items-center justify-center gap-1 mb-1">
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
                              </div>
                              <p className="text-xs text-gray-600">Votre note</p>
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
                    Aucune assignation trouvée
                  </h3>
                  <p className="text-gray-600 mb-4">
                    {activeTab === 'all' 
                      ? 'Vous n\'avez pas encore d\'assignations d\'experts.'
                      : `Aucune assignation ${activeTab === 'pending' ? 'en attente' : 
                         activeTab === 'accepted' ? 'en cours' : 
                         activeTab === 'completed' ? 'terminée' : 'annulée'}.`
                    }
                  </p>
                  <Button onClick={() => window.open('/marketplace/experts', '_blank')}>
                    Trouver un expert
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