import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { 
  Bell, 
  CheckCircle, 
  XCircle, 
  Eye, 
  Download,
  Clock,
  AlertTriangle,
  FileText,
  Building2,
  User
} from 'lucide-react';
import { config } from '@/config/env';

interface AdminNotification {
  id: string;
  type: string;
  title: string;
  message: string;
  status: 'pending' | 'validated' | 'rejected' | 'archived';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  metadata: {
    client_produit_id?: string;
    client_id?: string;
    client_name?: string;
    client_email?: string;
    client_company?: string;
    product_type?: string;
    product_name?: string;
    step?: string;
    documents?: Array<{
      id: string;
      type: string;
      filename: string;
    }>;
    submitted_at?: string;
    submitted_by?: string;
  };
  admin_notes?: string;
  created_at: string;
  updated_at: string;
}

export default function AdminNotificationsPanel() {
  const { toast } = useToast();
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedNotification, setSelectedNotification] = useState<AdminNotification | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [processing, setProcessing] = useState<string | null>(null);

  // Charger les notifications
  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${config.API_URL}/api/notifications/admin`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setNotifications(data.data || []);
        } else {
          throw new Error(data.message);
        }
      } else {
        throw new Error('Erreur lors du chargement des notifications');
      }
    } catch (error) {
      console.error('Erreur chargement notifications:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les notifications",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Mettre à jour le statut d'une notification
  const updateNotificationStatus = async (notificationId: string, status: string, notes?: string) => {
    try {
      setProcessing(notificationId);
      
      const response = await fetch(`${config.API_URL}/api/notifications/admin/${notificationId}/status`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status, admin_notes: notes })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          toast({
            title: "Succès",
            description: `Notification ${status === 'validated' ? 'validée' : 'rejetée'} avec succès`
          });
          
          // Recharger les notifications
          await loadNotifications();
        } else {
          throw new Error(data.message);
        }
      } else {
        throw new Error('Erreur lors de la mise à jour');
      }
    } catch (error) {
      console.error('Erreur mise à jour notification:', error);
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour la notification",
        variant: "destructive"
      });
    } finally {
      setProcessing(null);
    }
  };

  // Obtenir l'icône de priorité
  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return <AlertTriangle className="w-4 h-4 text-red-600" />;
      case 'high':
        return <AlertTriangle className="w-4 h-4 text-orange-600" />;
      case 'medium':
        return <Clock className="w-4 h-4 text-yellow-600" />;
      case 'low':
        return <Clock className="w-4 h-4 text-blue-600" />;
      default:
        return <Clock className="w-4 h-4 text-gray-600" />;
    }
  };

  // Obtenir la couleur du badge de statut
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'validated':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'archived':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Obtenir la couleur du badge de priorité
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-100 text-red-800';
      case 'high':
        return 'bg-orange-100 text-orange-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Formater la date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2">Chargement des notifications...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Bell className="w-6 h-6 text-blue-600" />
          <h2 className="text-2xl font-bold text-gray-900">Notifications Admin</h2>
          <Badge variant="secondary">{notifications.length}</Badge>
        </div>
        <Button onClick={loadNotifications} variant="outline">
          Actualiser
        </Button>
      </div>

      {/* Liste des notifications */}
      <div className="grid gap-4">
        {notifications.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Bell className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Aucune notification</h3>
              <p className="text-gray-600">Aucune notification en attente de traitement.</p>
            </CardContent>
          </Card>
        ) : (
          notifications.map((notification) => (
            <Card key={notification.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="flex items-center gap-2">
                        {getPriorityIcon(notification.priority)}
                        <h3 className="font-semibold text-lg">{notification.title}</h3>
                      </div>
                      <Badge className={getStatusColor(notification.status)}>
                        {notification.status === 'pending' ? 'En attente' :
                         notification.status === 'validated' ? 'Validée' :
                         notification.status === 'rejected' ? 'Rejetée' : 'Archivée'}
                      </Badge>
                      <Badge className={getPriorityColor(notification.priority)}>
                        {notification.priority === 'urgent' ? 'Urgent' :
                         notification.priority === 'high' ? 'Élevée' :
                         notification.priority === 'medium' ? 'Moyenne' : 'Faible'}
                      </Badge>
                    </div>
                    <p className="text-gray-600 mb-3">{notification.message}</p>
                    
                    {/* Informations client */}
                    {notification.metadata.client_company && (
                      <div className="flex items-center gap-4 text-sm text-gray-500 mb-3">
                        <div className="flex items-center gap-1">
                          <Building2 className="w-4 h-4" />
                          <span>{notification.metadata.client_company}</span>
                        </div>
                        {notification.metadata.client_email && (
                          <div className="flex items-center gap-1">
                            <User className="w-4 h-4" />
                            <span>{notification.metadata.client_email}</span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Documents */}
                    {notification.metadata.documents && notification.metadata.documents.length > 0 && (
                      <div className="mb-3">
                        <h4 className="text-sm font-medium text-gray-700 mb-2">Documents soumis :</h4>
                        <div className="flex flex-wrap gap-2">
                          {notification.metadata.documents.map((doc, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              <FileText className="w-3 h-3 mr-1" />
                              {doc.filename}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="flex items-center justify-between text-sm text-gray-500">
                      <span>Soumis le {formatDate(notification.created_at)}</span>
                      {notification.status === 'pending' && (
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            onClick={() => setSelectedNotification(notification)}
                            variant="outline"
                          >
                            <Eye className="w-4 h-4 mr-1" />
                            Voir détails
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </CardHeader>

              {/* Actions pour les notifications en attente */}
              {notification.status === 'pending' && (
                <CardContent className="pt-0">
                  <div className="flex items-center gap-3">
                    <Button
                      size="sm"
                      onClick={() => updateNotificationStatus(notification.id, 'validated')}
                      disabled={processing === notification.id}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      {processing === notification.id ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      ) : (
                        <>
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Valider
                        </>
                      )}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => updateNotificationStatus(notification.id, 'rejected')}
                      disabled={processing === notification.id}
                    >
                      {processing === notification.id ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div>
                      ) : (
                        <>
                          <XCircle className="w-4 h-4 mr-1" />
                          Rejeter
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              )}
            </Card>
          ))
        )}
      </div>

      {/* Modal de détails */}
      {showDetails && selectedNotification && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Détails de la notification</h3>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowDetails(false)}
              >
                <XCircle className="w-4 h-4" />
              </Button>
            </div>
            
            <div className="space-y-4">
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Informations client</h4>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p><strong>Entreprise :</strong> {selectedNotification.metadata.client_company}</p>
                  <p><strong>Email :</strong> {selectedNotification.metadata.client_email}</p>
                  <p><strong>Produit :</strong> {selectedNotification.metadata.product_name}</p>
                  <p><strong>Étape :</strong> {selectedNotification.metadata.step}</p>
                </div>
              </div>

              {selectedNotification.metadata.documents && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Documents</h4>
                  <div className="space-y-2">
                    {selectedNotification.metadata.documents.map((doc, index) => (
                      <div key={index} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-blue-600" />
                          <span className="text-sm">{doc.filename}</span>
                          <Badge variant="outline" className="text-xs">
                            {doc.type}
                          </Badge>
                        </div>
                        <Button size="sm" variant="outline">
                          <Download className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={() => setShowDetails(false)}
                >
                  Fermer
                </Button>
                <Button
                  onClick={() => {
                    updateNotificationStatus(selectedNotification.id, 'validated');
                    setShowDetails(false);
                  }}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <CheckCircle className="w-4 h-4 mr-1" />
                  Valider
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
