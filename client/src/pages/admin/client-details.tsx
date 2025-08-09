import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Navigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
// import { createClient } from "@supabase/supabase-js";
import { 
  ArrowLeft, Building, Mail, Phone, MapPin, Calendar, FileText, TrendingUp, 
  CheckCircle, AlertCircle, Download, Power, PowerOff, MessageSquare, 
  Edit, Eye, Clock, Activity, Users, Euro, Send, Paperclip, UserPlus,
  Image, FileText as FileTextIcon, Plus
} from "lucide-react";
import { supabase } from "@/lib/supabase";

// Configuration Supabase - Utilise l'instance importée depuis @/lib/supabase

interface Client {
  id: string;
  email: string;
  company_name: string;
  city: string;
  phone: string;
  statut: string;
  created_at: string;
  derniereConnexion?: string;
  siren?: string;
  description?: string;
}

interface ProduitEligible {
  id: string;
  clientId: string;
  produitId: string;
  statut: string;
  created_at: string;
  ProduitEligible: {
    name: string;
    description: string;
    category: string;
  };
}

interface Expert {
  id: string;
  name: string;
  email: string;
  company_name: string;
  specialites: string[];
  statut: string;
}

interface Audit {
  id: string;
  client_id: string;
  expert_id: string;
  status: string;
  potential_gain: number;
  obtained_gain: number;
  created_at: string;
  updated_at: string;
  commentaires_admin?: string;
  date_planifiee?: string;
  Expert: {
    name: string;
    email: string;
    company_name: string;
  };
}

interface CharteSignature {
  id: string;
  client_id: string;
  signed_at: string;
  ip_address: string;
}

interface ClientStats {
  totalProduits: number;
  produitsEligibles: number;
  totalAudits: number;
  auditsEnCours: number;
  auditsTermines: number;
  gainsPotentiels: number;
  gainsObtenus: number;
  charteSignee: boolean;
}

interface ClientAction {
  id: string;
  action: string;
  description: string;
  timestamp: string;
  admin_email: string;
}

interface Message {
  id: string;
  expediteur_id: string;
  expediteur_type: 'admin' | 'client';
  contenu: string;
  timestamp: string;
  lu: boolean;
  pieces_jointes?: string[];
}

interface Document {
  id: string;
  client_id: string;
  nom_fichier: string;
  type_fichier: string;
  taille: number;
  url: string;
  uploaded_at: string;
  statut: 'en_attente' | 'valide' | 'rejete';
  commentaires?: string;
  categorie: string;
}

const ClientDetails = () => {
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { id } = useParams();

  // États des données
  const [client, setClient] = useState<Client | null>(null);
  const [produitsEligibles, setProduitsEligibles] = useState<ProduitEligible[]>([]);
  const [audits, setAudits] = useState<Audit[]>([]);
  const [charteSignature, setCharteSignature] = useState<CharteSignature | null>(null);
  const [stats, setStats] = useState<ClientStats | null>(null);
  const [clientActions, setClientActions] = useState<ClientAction[]>([]);
  const [experts, setExperts] = useState<Expert[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);

  // États de chargement et erreurs
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState('');

  // États pour les modales et formulaires
  const [newMessage, setNewMessage] = useState<string>('');
  const [selectedExpert, setSelectedExpert] = useState<string>('');
  const [auditComment, setAuditComment] = useState<string>('');
  const [documentComment, setDocumentComment] = useState<string>('');

  // Vérification d'authentification
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-red-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Vérification de l'authentification...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/connect-admin" replace />;
  }

  if (user.type !== 'admin') {
    return <Navigate to="/connect-admin" replace />;
  }

  // Charger les données du client
  useEffect(() => {
    if (id) {
      fetchClientData();
    }
  }, [id]);

  const fetchClientData = useCallback(async () => {
    try {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        console.log('Session expirée, redirection vers connect-admin');
        navigate('/connect-admin');
        return;
      }

      const response = await fetch(`/api/admin/clients/${id}`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Client non trouvé');
      }

      const data = await response.json();
      setClient(data.data.client);
      setProduitsEligibles(data.data.produitsEligibles);
      setAudits(data.data.audits);
      setCharteSignature(data.data.charteSignature);
      setStats(data.data.stats);
      setClientActions(data.data.actions || []);
      setExperts(data.data.experts || []);
      setMessages(data.data.messages || []);
      setDocuments(data.data.documents || []);
    } catch (err: any) {
      setError(err.message);
      console.error('Erreur chargement client: ', err);
    } finally {
      setLoading(false);
    }
  }, [id, navigate]);

  // Assigner un expert à un audit
  const assignExpertToAudit = async (auditId: string, expertId: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const response = await fetch(`/api/admin/audits/${auditId}/assign-expert`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ expert_id: expertId })
      });

      if (response.ok) {
        fetchClientData(); // Recharger les données
        toast({
          title: 'Expert assigné',
          description: 'L\'expert a été assigné avec succès',
          variant: 'default'
        });
      }
    } catch (err) {
      console.error('Erreur assignation expert: ', err);
      toast({
        title: 'Erreur',
        description: 'Erreur lors de l\'assignation de l\'expert',
        variant: 'destructive'
      });
    }
  };

  // Mettre à jour le statut d'un audit
  const updateAuditStatus = async (auditId: string, status: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const response = await fetch(`/api/admin/audits/${auditId}/status`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status })
      });

      if (response.ok) {
        fetchClientData(); // Recharger les données
        toast({
          title: 'Statut mis à jour',
          description: 'Le statut de l\'audit a été mis à jour',
          variant: 'default'
        });
      }
    } catch (err) {
      console.error('Erreur mise à jour statut: ', err);
      toast({
        title: 'Erreur',
        description: 'Erreur lors de la mise à jour du statut',
        variant: 'destructive'
      });
    }
  };

  // Ajouter un commentaire à un audit
  const addAuditComment = async (auditId: string, comment: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const response = await fetch(`/api/admin/audits/${auditId}/comment`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ comment })
      });

      if (response.ok) {
        fetchClientData(); // Recharger les données
        toast({
          title: 'Commentaire ajouté',
          description: 'Le commentaire a été ajouté avec succès',
          variant: 'default'
        });
      }
    } catch (err) {
      console.error('Erreur ajout commentaire: ', err);
      toast({
        title: 'Erreur',
        description: 'Erreur lors de l\'ajout du commentaire',
        variant: 'destructive'
      });
    }
  };

  // Charger les messages du client
  const loadMessages = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const response = await fetch(`/api/admin/clients/${client?.id}/messages`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setMessages(data.data || []);
      }
    } catch (err) {
      console.error('Erreur chargement messages: ', err);
    }
  };

  // Envoyer un message au client
  const handleSendMessage = async () => {
    if (!newMessage.trim() || !client?.id) return;

    try {
      setActionLoading('send-message');
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const response = await fetch(`/api/admin/clients/${client.id}/messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          message: newMessage,
          expediteur_type: 'admin'
        })
      });

      if (response.ok) {
        setNewMessage('');
        loadMessages(); // Recharger les messages
        toast({
          title: 'Message envoyé',
          description: 'Le message a été envoyé au client',
          variant: 'default'
        });
      }
    } catch (err) {
      console.error('Erreur envoi message: ', err);
      toast({
        title: 'Erreur',
        description: 'Erreur lors de l\'envoi du message',
        variant: 'destructive'
      });
    } finally {
      setActionLoading("");
    }
  };

  // Valider un document
  const validateDocument = async (documentId: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const response = await fetch(`/api/admin/documents/${documentId}/validate`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        fetchClientData(); // Recharger les données
        toast({
          title: 'Document validé',
          description: 'Le document a été validé avec succès',
          variant: 'default'
        });
      }
    } catch (err) {
      console.error('Erreur validation document: ', err);
      toast({
        title: 'Erreur',
        description: 'Erreur lors de la validation du document',
        variant: 'destructive'
      });
    }
  };

  // Demander un document au client
  const requestDocument = async (documentType: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const response = await fetch(`/api/admin/clients/${client?.id}/request-document`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ document_type: documentType })
      });

      if (response.ok) {
        toast({
          title: 'Demande envoyée',
          description: 'La demande de document a été envoyée au client',
          variant: 'default'
        });
      }
    } catch (err) {
      console.error('Erreur demande document: ', err);
      toast({
        title: 'Erreur',
        description: 'Erreur lors de l\'envoi de la demande',
        variant: 'destructive'
      });
    }
  };

  // Mettre à jour le statut du client
  const updateClientStatus = async (status: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const response = await fetch(`/api/admin/clients/${client?.id}/status`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status })
      });

      if (response.ok) {
        fetchClientData(); // Recharger les données
        toast({
          title: 'Statut mis à jour',
          description: 'Le statut du client a été mis à jour',
          variant: 'default'
        });
      }
    } catch (err) {
      console.error('Erreur mise à jour statut client: ', err);
      toast({
        title: 'Erreur',
        description: 'Erreur lors de la mise à jour du statut',
        variant: 'destructive'
      });
    }
  };

  // Exporter les données du client
  const exportClientData = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const response = await fetch(`/api/admin/clients/${client?.id}/export`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `client-${client?.id}-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);

        toast({
          title: 'Export réussi',
          description: 'Les données du client ont été exportées',
          variant: 'default'
        });
      }
    } catch (err) {
      console.error('Erreur export: ', err);
      toast({
        title: 'Erreur',
        description: 'Erreur lors de l\'export des données',
        variant: 'destructive'
      });
    }
  };

  // Envoyer une notification au client
  const notifyClient = async (message: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const response = await fetch(`/api/admin/clients/${client?.id}/notify`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ message })
      });

      if (response.ok) {
        toast({
          title: 'Notification envoyée',
          description: 'La notification a été envoyée au client',
          variant: 'default'
        });
      }
    } catch (err) {
      console.error('Erreur notification: ', err);
      toast({
        title: 'Erreur',
        description: 'Erreur lors de l\'envoi de la notification',
        variant: 'destructive'
      });
    }
  };

  const getStatusBadge = useCallback((status: string) => {
    switch (status) {
      case 'actif':
        return <Badge className="bg-green-100 text-green-800">Actif</Badge>;
      case 'inactif':
        return <Badge className="bg-red-100 text-red-800">Inactif</Badge>;
      case 'en_attente':
        return <Badge className="bg-yellow-100 text-yellow-800">En attente</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">{status}</Badge>;
    }
  }, []);

  const getAuditStatusBadge = useCallback((status: string) => {
    switch (status) {
      case 'terminé':
        return <Badge className="bg-green-100 text-green-800">Terminé</Badge>;
      case 'en_cours':
        return <Badge className="bg-blue-100 text-blue-800">En cours</Badge>;
      case 'non_démarré':
        return <Badge className="bg-gray-100 text-gray-800">Non démarré</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">{status}</Badge>;
    }
  }, []);

  const getProduitStatusBadge = useCallback((status: string) => {
    switch (status) {
      case 'eligible':
        return <Badge className="bg-green-100 text-green-800">Éligible</Badge>;
      case 'non_eligible':
        return <Badge className="bg-red-100 text-red-800">Non éligible</Badge>;
      case 'en_cours':
        return <Badge className="bg-yellow-100 text-yellow-800">En cours</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">{status}</Badge>;
    }
  }, []);

  const formatDate = useCallback((dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }, []);

  const formatCurrency = useCallback((amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  }, []);

  const formatFileSize = useCallback((bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }, []);

  const getFileIcon = useCallback((type: string) => {
    if (type.includes('pdf')) return <FileTextIcon className="h-4 w-4 text-red-500" />;
    if (type.includes('image')) return <Image className="h-4 w-4 text-green-500" />;
    return <FileTextIcon className="h-4 w-4 text-blue-500" />;
  }, []);

  const getDocumentStatusBadge = useCallback((status: string) => {
    switch (status) {
      case 'valide':
        return <Badge className="bg-green-100 text-green-800">Validé</Badge>;
      case 'rejete':
        return <Badge className="bg-red-100 text-red-800">Rejeté</Badge>;
      case 'en_attente':
        return <Badge className="bg-yellow-100 text-yellow-800">En attente</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">{status}</Badge>;
    }
  }, []);

  // Gestionnaires d'événements optimisés
  const handleBackToList = useCallback(() => {
    navigate('/admin/gestion-clients');
  }, [navigate]);

  const handleEditClient = useCallback(() => {
    navigate(`/admin/client/${client?.id}/edit`);
  }, [navigate, client?.id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-red-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement des données client...</p>
        </div>
      </div>
    );
  }

  if (error || !client) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-red-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Erreur</h2>
          <p className="text-gray-600 mb-4">{error || 'Client non trouvé'}</p>
          <Button onClick={handleBackToList}>
            ← Retour à la liste
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-red-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <Button 
                variant="outline" 
                onClick={handleBackToList}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Retour
              </Button>
              <div className="flex space-x-2">
                <div className="w-6 h-4 bg-blue-600 rounded"></div>
                <div className="w-6 h-4 bg-white border border-gray-300 rounded"></div>
                <div className="w-6 h-4 bg-red-600 rounded"></div>
              </div>
              <h1 className="text-2xl font-bold text-gray-900">Détails du Client</h1>
            </div>
            <div className="flex space-x-3">
              <Button 
                variant="outline"
                onClick={() => notifyClient("Message par défaut")}
                disabled={actionLoading === 'notification'}
              >
                <MessageSquare className="h-4 w-4 mr-2" />
                {actionLoading === 'notification' ? 'Envoi...' : 'Notifier'}
              </Button>
              <Button 
                variant="outline"
                onClick={exportClientData}
                disabled={actionLoading === 'export'}
              >
                <Download className="h-4 w-4 mr-2" />
                {actionLoading === 'export' ? 'Export...' : 'Exporter'}
              </Button>
              <Button 
                variant={client.statut === 'actif' ? 'destructive' : 'default'}
                onClick={() => updateClientStatus("actif")}
                disabled={actionLoading === 'status'}
              >
                {client.statut === 'actif' ? (
                  <>
                    <PowerOff className="h-4 w-4 mr-2" />
                    {actionLoading === 'status' ? 'Désactivation...' : 'Désactiver'}
                  </>
                ) : (
                  <>
                    <Power className="h-4 w-4 mr-2" />
                    {actionLoading === 'status' ? 'Activation...' : 'Activer'}
                  </>
                )}
              </Button>
              <Button 
                variant="outline"
                onClick={handleEditClient}
              >
                <Edit className="h-4 w-4 mr-2" />
                Modifier
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto p-6">
        {/* Actions rapides */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card className="bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-blue-600 font-medium">Gains totaux</p>
                  <p className="text-xl font-bold text-blue-800">
                    {stats ? formatCurrency(stats.gainsObtenus) : '0 €'}
                  </p>
                </div>
                <Euro className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-green-50 to-green-100 border-green-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-green-600 font-medium">Audits terminés</p>
                  <p className="text-xl font-bold text-green-800">
                    {stats ? `${stats.auditsTermines}/${stats.totalAudits}` : '0/0'}
                  </p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-purple-50 to-purple-100 border-purple-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-purple-600 font-medium">Produits éligibles</p>
                  <p className="text-xl font-bold text-purple-800">
                    {stats ? `${stats.produitsEligibles}/${stats.totalProduits}` : '0/0'}
                  </p>
                </div>
                <FileText className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-orange-50 to-orange-100 border-orange-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-orange-600 font-medium">Dernière activité</p>
                  <p className="text-sm font-medium text-orange-800">
                    {client.derniereConnexion ? formatDate(client.derniereConnexion) : 'Jamais'}
                  </p>
                </div>
                <Activity className="h-8 w-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Informations principales */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Informations client */}
          <Card className="lg:col-span-2 bg-white shadow-lg">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-gray-900 flex items-center">
                <Users className="h-5 w-5 mr-2" />
                Informations Client
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center">
                  <Mail className="h-5 w-5 text-gray-400 mr-3" />
                  <div>
                    <p className="text-sm text-gray-500">Email</p>
                    <p className="font-medium">{client.email}</p>
                  </div>
                </div>
                
                <div className="flex items-center">
                  <Building className="h-5 w-5 text-gray-400 mr-3" />
                  <div>
                    <p className="text-sm text-gray-500">Entreprise</p>
                    <p className="font-medium">{client.company_name || 'Non renseigné'}</p>
                  </div>
                </div>

                {client.siren && (
                  <div className="flex items-center">
                    <FileText className="h-5 w-5 text-gray-400 mr-3" />
                    <div>
                      <p className="text-sm text-gray-500">SIREN</p>
                      <p className="font-medium">{client.siren}</p>
                    </div>
                  </div>
                )}

                {client.phone && (
                  <div className="flex items-center">
                    <Phone className="h-5 w-5 text-gray-400 mr-3" />
                    <div>
                      <p className="text-sm text-gray-500">Téléphone</p>
                      <p className="font-medium">{client.phone}</p>
                    </div>
                  </div>
                )}

                {client.city && (
                  <div className="flex items-center">
                    <MapPin className="h-5 w-5 text-gray-400 mr-3" />
                    <div>
                      <p className="text-sm text-gray-500">Ville</p>
                      <p className="font-medium">{client.city}</p>
                    </div>
                  </div>
                )}

                <div className="flex items-center">
                  <Calendar className="h-5 w-5 text-gray-400 mr-3" />
                  <div>
                    <p className="text-sm text-gray-500">Date d'inscription</p>
                    <p className="font-medium">{formatDate(client.created_at)}</p>
                  </div>
                </div>

                <div className="flex items-center">
                  <Clock className="h-5 w-5 text-gray-400 mr-3" />
                  <div>
                    <p className="text-sm text-gray-500">Dernière connexion</p>
                    <p className="font-medium">
                      {client.derniereConnexion ? formatDate(client.derniereConnexion) : 'Jamais'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center">
                  <div className="mr-3">
                    {getStatusBadge(client.statut)}
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Statut</p>
                    <p className="font-medium capitalize">{client.statut}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Statistiques */}
          <Card className="bg-white shadow-lg">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-gray-900 flex items-center">
                <TrendingUp className="h-5 w-5 mr-2" />
                Statistiques
              </CardTitle>
            </CardHeader>
            <CardContent>
              {stats && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Produits éligibles</span>
                    <span className="font-semibold">{stats.produitsEligibles}/{stats.totalProduits}</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Audits terminés</span>
                    <span className="font-semibold">{stats.auditsTermines}/{stats.totalAudits}</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Gains potentiels</span>
                    <span className="font-semibold text-green-600">
                      {formatCurrency(stats.gainsPotentiels)}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Gains obtenus</span>
                    <span className="font-semibold text-blue-600">
                      {formatCurrency(stats.gainsObtenus)}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Charte signée</span>
                    <div className="flex items-center">
                      {stats.charteSignee ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : (
                        <AlertCircle className="h-4 w-4 text-red-500" />
                      )}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Onglets détaillés */}
        <Tabs defaultValue="produits" className="bg-white shadow-lg rounded-lg">
          <CardHeader>
            <TabsList className="grid w-full grid-cols-7">
              <TabsTrigger value="produits">Produits</TabsTrigger>
              <TabsTrigger value="audits">Audits</TabsTrigger>
              <TabsTrigger value="documents">Documents</TabsTrigger>
              <TabsTrigger value="messages">Messages</TabsTrigger>
              <TabsTrigger value="charte">Charte</TabsTrigger>
              <TabsTrigger value="historique">Historique</TabsTrigger>
            </TabsList>
          </CardHeader>

          <TabsContent value="produits" className="p-6">
            <CardTitle className="text-lg font-semibold text-gray-900 mb-4">
              Produits Éligibles ({produitsEligibles.length})
            </CardTitle>
            
            {produitsEligibles.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Produit</TableHead>
                    <TableHead>Catégorie</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Date d'éligibilité</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {produitsEligibles.map((produit) => (
                    <TableRow key={produit.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{produit.ProduitEligible.name}</div>
                          <div className="text-sm text-gray-500">{produit.ProduitEligible.description}</div>
                        </div>
                      </TableCell>
                      <TableCell>{produit.ProduitEligible.category}</TableCell>
                      <TableCell>{getProduitStatusBadge(produit.statut)}</TableCell>
                      <TableCell>{formatDate(produit.created_at)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-8">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">Aucun produit éligible trouvé</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="audits" className="p-6">
            <div className="flex justify-between items-center mb-4">
              <CardTitle className="text-lg font-semibold text-gray-900">
                Audits ({audits.length})
              </CardTitle>
            </div>
            
            {audits.length > 0 ? (
              <div className="space-y-4">
                {audits.map((audit) => (
                  <Card key={audit.id} className="border-l-4 border-l-blue-500">
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center space-x-4 mb-2">
                            <div>
                              <h4 className="font-medium text-gray-900">Expert: {audit.Expert.name}</h4>
                              <p className="text-sm text-gray-500">{audit.Expert.company_name}</p>
                            </div>
                            <div>{getAuditStatusBadge(audit.status)}</div>
                          </div>
                          
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
                            <div>
                              <p className="text-sm text-gray-500">Gain potentiel</p>
                              <p className="font-medium text-green-600">{formatCurrency(audit.potential_gain)}</p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-500">Gain obtenu</p>
                              <p className="font-medium text-blue-600">{formatCurrency(audit.obtained_gain)}</p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-500">Créé le</p>
                              <p className="font-medium">{formatDate(audit.created_at)}</p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-500">Mis à jour</p>
                              <p className="font-medium">{formatDate(audit.updated_at)}</p>
                            </div>
                          </div>

                          {audit.commentaires_admin && (
                            <div className="bg-gray-50 p-3 rounded-lg mb-3">
                              <p className="text-sm text-gray-600">
                                <strong>Commentaire admin:</strong> {audit.commentaires_admin}
                              </p>
                            </div>
                          )}
                        </div>
                        
                        <div className="flex space-x-2">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="outline" size="sm">
                                <UserPlus className="h-4 w-4 mr-1" />
                                Assigner
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Assigner un expert</DialogTitle>
                              </DialogHeader>
                              <div className="space-y-4">
                                <Select onValueChange={setSelectedExpert}>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Sélectionner un expert" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {experts.map((expert) => (
                                      <SelectItem key={expert.id} value={expert.id}>
                                        {expert.name} - {expert.company_name}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <Button 
                                  onClick={() => assignExpertToAudit(audit.id, selectedExpert)}
                                  disabled={!selectedExpert || actionLoading === 'assign-expert'}
                                >
                                  {actionLoading === 'assign-expert' ? 'Assignation...' : 'Assigner'}
                                </Button>
                              </div>
                            </DialogContent>
                          </Dialog>

                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="outline" size="sm">
                                <Edit className="h-4 w-4 mr-1" />
                                Modifier
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Modifier l'audit</DialogTitle>
                              </DialogHeader>
                              <div className="space-y-4">
                                <Select onValueChange={(value: string) => updateAuditStatus(audit.id, value)}>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Nouveau statut" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="non_démarré">Non démarré</SelectItem>
                                    <SelectItem value="en_cours">En cours</SelectItem>
                                    <SelectItem value="terminé">Terminé</SelectItem>
                                  </SelectContent>
                                </Select>
                                <Textarea
                                  placeholder="Commentaire administratif..."
                                  value={auditComment}
                                  onChange={(e) => setAuditComment(e.target.value)}
                                />
                                <Button 
                                  onClick={() => addAuditComment(audit.id, auditComment)}
                                  disabled={actionLoading === 'add-comment'}
                                >
                                  {actionLoading === 'add-comment' ? 'Ajout...' : 'Ajouter commentaire'}
                                </Button>
                              </div>
                            </DialogContent>
                          </Dialog>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <TrendingUp className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">Aucun audit trouvé</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="documents" className="p-6">
            <div className="flex justify-between items-center mb-4">
              <CardTitle className="text-lg font-semibold text-gray-900">
                Documents ({documents.length})
              </CardTitle>
              <div className="flex space-x-2">
                <Select onValueChange={requestDocument}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Demander un document" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="factures">Factures</SelectItem>
                    <SelectItem value="devis">Devis</SelectItem>
                    <SelectItem value="contrats">Contrats</SelectItem>
                    <SelectItem value="certificats">Certificats</SelectItem>
                    <SelectItem value="autres">Autres</SelectItem>
                  </SelectContent>
                </Select>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => requestDocument('general')}
                  disabled={actionLoading === 'request-document'}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  {actionLoading === 'request-document' ? 'Demande...' : 'Demande générale'}
                </Button>
              </div>
            </div>
            
            {documents.length > 0 ? (
              <div className="space-y-4">
                {documents.map((document) => (
                  <Card key={document.id} className="border-l-4 border-l-green-500">
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            {getFileIcon(document.type_fichier)}
                            <div>
                              <h4 className="font-medium text-gray-900">{document.nom_fichier}</h4>
                              <p className="text-sm text-gray-500">{document.categorie}</p>
                            </div>
                            <div>{getDocumentStatusBadge(document.statut)}</div>
                          </div>
                          
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
                            <div>
                              <p className="text-sm text-gray-500">Taille</p>
                              <p className="font-medium">{formatFileSize(document.taille)}</p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-500">Type</p>
                              <p className="font-medium">{document.type_fichier}</p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-500">Uploadé le</p>
                              <p className="font-medium">{formatDate(document.uploaded_at)}</p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-500">Catégorie</p>
                              <p className="font-medium capitalize">{document.categorie}</p>
                            </div>
                          </div>

                          {document.commentaires && (
                            <div className="bg-gray-50 p-3 rounded-lg mb-3">
                              <p className="text-sm text-gray-600">
                                <strong>Commentaire:</strong> {document.commentaires}
                              </p>
                            </div>
                          )}
                        </div>
                        
                        <div className="flex space-x-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => window.open(document.url, '_blank')}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            Voir
                          </Button>
                          
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="outline" size="sm">
                                <Edit className="h-4 w-4 mr-1" />
                                Valider
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Valider le document</DialogTitle>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div className="flex space-x-2">
                                  <Button 
                                    onClick={() => validateDocument(document.id)}
                                    disabled={actionLoading === 'validate-document'}
                                    className="flex-1"
                                  >
                                    {actionLoading === 'validate-document' ? 'Validation...' : 'Valider'}
                                  </Button>
                                  <Button 
                                    variant="destructive"
                                    onClick={() => validateDocument(document.id)}
                                    disabled={actionLoading === 'validate-document'}
                                    className="flex-1"
                                  >
                                    {actionLoading === 'validate-document' ? 'Rejet...' : 'Rejeter'}
                                  </Button>
                                </div>
                                <Textarea
                                  placeholder="Commentaire (optionnel)..."
                                  value={documentComment}
                                  onChange={(e) => setDocumentComment(e.target.value)}
                                />
                              </div>
                            </DialogContent>
                          </Dialog>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <FileTextIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">Aucun document trouvé</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="messages" className="p-6">
            <div className="flex justify-between items-center mb-4">
              <CardTitle className="text-lg font-semibold text-gray-900">
                Messages ({messages.length})
              </CardTitle>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Liste des messages */}
              <div className="lg:col-span-2">
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {messages.length > 0 ? (
                    messages.map((message) => (
                      <Card 
                        key={message.id} 
                        className={`border-l-4 ${
                          message.expediteur_type === 'admin' 
                            ? 'border-l-blue-500 bg-blue-50' 
                            : 'border-l-green-500 bg-green-50'
                        }`}
                      >
                        <CardContent className="p-4">
                          <div className="flex justify-between items-start mb-2">
                            <div className="flex items-center space-x-2">
                              <div className={`w-2 h-2 rounded-full ${
                                message.expediteur_type === 'admin' ? 'bg-blue-500' : 'bg-green-500'
                              }`}></div>
                              <span className="text-sm font-medium">
                                {message.expediteur_type === 'admin' ? 'Admin' : 'Client'}
                              </span>
                              {!message.lu && message.expediteur_type === 'client' && (
                                <Badge className="bg-red-100 text-red-800 text-xs">Non lu</Badge>
                              )}
                            </div>
                            <span className="text-xs text-gray-500">{formatDate(message.timestamp)}</span>
                          </div>
                          <p className="text-gray-700">{message.contenu}</p>
                          {message.pieces_jointes && message.pieces_jointes.length > 0 && (
                            <div className="mt-2 flex items-center space-x-2">
                              <Paperclip className="h-4 w-4 text-gray-400" />
                              <span className="text-sm text-gray-500">
                                {message.pieces_jointes.length} pièce(s) jointe(s)
                              </span>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500">Aucun message</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Formulaire d'envoi */}
              <div className="lg:col-span-1">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Nouveau message</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <Textarea
                        placeholder="Votre message..."
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        rows={4}
                      />
                      <Button 
                        onClick={handleSendMessage}
                        disabled={!newMessage.trim() || actionLoading === 'send-message'}
                        className="w-full"
                      >
                        <Send className="h-4 w-4 mr-2" />
                        {actionLoading === 'send-message' ? 'Envoi...' : 'Envoyer'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="charte" className="p-6">
            <CardTitle className="text-lg font-semibold text-gray-900 mb-4">
              Signature de la Charte
            </CardTitle>
            
            {charteSignature ? (
              <div className="space-y-4">
                <div className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                  <div>
                    <p className="text-sm text-gray-500">Statut</p>
                    <p className="font-medium text-green-600">Charte signée</p>
                  </div>
                </div>
                
                <div className="flex items-center">
                  <Calendar className="h-5 w-5 text-gray-400 mr-3" />
                  <div>
                    <p className="text-sm text-gray-500">Date de signature</p>
                    <p className="font-medium">{formatDate(charteSignature.signed_at)}</p>
                  </div>
                </div>
                
                <div className="flex items-center">
                  <MapPin className="h-5 w-5 text-gray-400 mr-3" />
                  <div>
                    <p className="text-sm text-gray-500">Adresse IP</p>
                    <p className="font-medium">{charteSignature.ip_address}</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
                <p className="text-gray-500">Charte non signée</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="historique" className="p-6">
            <CardTitle className="text-lg font-semibold text-gray-900 mb-4">
              Historique des Actions ({clientActions.length})
            </CardTitle>
            
            {clientActions.length > 0 ? (
              <div className="space-y-4">
                {clientActions.map((action) => (
                  <div key={action.id} className="flex items-start space-x-4 p-4 bg-gray-50 rounded-lg">
                    <div className="flex-shrink-0">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium text-gray-900">{action.action}</h4>
                        <span className="text-sm text-gray-500">{formatDate(action.timestamp)}</span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{action.description}</p>
                      <p className="text-xs text-gray-400 mt-2">Par: {action.admin_email}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Activity className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">Aucune action enregistrée</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

ClientDetails.displayName = 'ClientDetails';

export default ClientDetails; 