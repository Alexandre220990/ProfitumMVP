import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { get } from "@/lib/api";
import { 
  ArrowLeft, User, Mail, Phone, MapPin, Calendar, FileText, TrendingUp, 
  AlertCircle, MessageSquare, Eye, Activity, Send, Star,
  Briefcase, CheckSquare, XSquare, Calendar as CalendarIcon, 
  Mail as MailIcon, MessageCircle, Phone as PhoneIcon
} from "lucide-react";
import HeaderAdmin from "@/components/HeaderAdmin";

// ============================================================================
// TYPES ET INTERFACES
// ============================================================================

interface Expert {
  id: string;
  name: string;
  email: string;
  company_name?: string;
  phone_number?: string;
  location?: string;
  specializations?: string[];
  experience?: number;
  rating?: number;
  compensation?: number;
  status: string;
  approval_status: 'approved' | 'pending' | 'rejected';
  created_at: string;
  approved_at?: string;
  approved_by?: string;
  description?: string;
  documents?: string[];
  availability?: boolean;
}

interface Assignment {
  id: string;
  expert_id: string;
  client_id: string;
  produit_id: string;
  status: string;
  created_at: string;
  Client: {
    company_name: string;
    email: string;
  };
  ProduitEligible: {
    nom: string;
    description: string;
  };
}

interface ExpertStats {
  totalAssignments: number;
  completedAssignments: number;
  activeAssignments: number;
  totalEarnings: number;
  averageRating: number;
  responseTime: number;
}

// ============================================================================
// PAGE DÉTAILS EXPERT
// ============================================================================

const ExpertDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [expert, setExpert] = useState<Expert | null>(null);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [stats, setStats] = useState<ExpertStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [newComment, setNewComment] = useState('');
  const [showValidationDialog, setShowValidationDialog] = useState(false);
  const [showMessageDialog, setShowMessageDialog] = useState(false);
  const [showEmailDialog, setShowEmailDialog] = useState(false);
  const [showMeetingDialog, setShowMeetingDialog] = useState(false);
  const [messageContent, setMessageContent] = useState('');
  const [emailContent, setEmailContent] = useState('');
  const [meetingDate, setMeetingDate] = useState('');
  const [meetingTime, setMeetingTime] = useState('');

  // ========================================
  // CHARGEMENT DES DONNÉES
  // ========================================

  const loadExpertData = async () => {
    if (!id) return;
    
    try {
      setLoading(true);
      
      // Charger les détails de l'expert
      const expertResponse = await get(`/admin/experts/${id}`);
      if (expertResponse.success) {
        setExpert(expertResponse.data as any);
      } else {
        toast({
          variant: 'destructive',
          title: 'Erreur',
          description: 'Impossible de charger les détails de l\'expert'
        });
        return;
      }

      // Charger les assignations
      const assignmentsResponse = await get(`/admin/experts/${id}/assignments`);
      if (assignmentsResponse.success) {
        setAssignments((assignmentsResponse.data as any)?.assignments || []);
      }

      // Calculer les statistiques
      const assignmentsData = assignmentsResponse.success ? (assignmentsResponse.data as any)?.assignments || [] : [];
      const completedAssignments = assignmentsData.filter((a: Assignment) => a.status === 'completed').length;
      const activeAssignments = assignmentsData.filter((a: Assignment) => a.status === 'active').length;
      
      setStats({
        totalAssignments: assignmentsData.length,
        completedAssignments,
        activeAssignments,
        totalEarnings: assignmentsData.reduce((sum: number, a: Assignment) => sum + (a.status === 'completed' ? 100 : 0), 0),
        averageRating: (expertResponse.data as any)?.expert?.rating || 0,
        responseTime: 24 // En heures, à calculer selon les données réelles
      });

    } catch (error) {
      console.error('Erreur chargement expert:', error);
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: 'Erreur lors du chargement des données'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.type === 'admin' && id) {
      loadExpertData();
    }
  }, [user, id]);

  // ========================================
  // ACTIONS SUR L'EXPERT
  // ========================================

  const updateExpertStatus = async (status: 'approved' | 'rejected') => {
    try {
      const response = await fetch(`/api/admin/experts/${id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          status,
          comment: newComment,
          admin_id: user?.id
        })
      });

      if (response.ok) {
        toast({
          title: 'Succès',
          description: `Expert ${status === 'approved' ? 'approuvé' : 'rejeté'} avec succès`
        });
        setShowValidationDialog(false);
        loadExpertData(); // Recharger les données
      } else {
        throw new Error('Erreur lors de la mise à jour');
      }
    } catch (error) {
      console.error('Erreur mise à jour statut:', error);
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: 'Impossible de mettre à jour le statut'
      });
    }
  };

  const sendMessage = async () => {
    try {
      const response = await fetch(`/api/admin/messages/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          recipient_id: id,
          recipient_type: 'expert',
          message: messageContent
        })
      });

      if (response.ok) {
        toast({
          title: 'Message envoyé',
          description: 'Le message a été envoyé à l\'expert'
        });
        setMessageContent('');
        setShowMessageDialog(false);
      } else {
        throw new Error('Erreur lors de l\'envoi');
      }
    } catch (error) {
      console.error('Erreur envoi message:', error);
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: 'Impossible d\'envoyer le message'
      });
    }
  };

  const sendEmail = async () => {
    try {
      const response = await fetch(`/api/admin/email/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          recipient_email: expert?.email,
          subject: 'Message de Profitum',
          content: emailContent
        })
      });

      if (response.ok) {
        toast({
          title: 'Email envoyé',
          description: 'L\'email a été envoyé à l\'expert'
        });
        setEmailContent('');
        setShowEmailDialog(false);
      } else {
        throw new Error('Erreur lors de l\'envoi');
      }
    } catch (error) {
      console.error('Erreur envoi email:', error);
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: 'Impossible d\'envoyer l\'email'
      });
    }
  };

  const scheduleMeeting = async () => {
    try {
      const response = await fetch(`/api/admin/meetings/schedule`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          expert_id: id,
          date: meetingDate,
          time: meetingTime,
          type: 'video_call'
        })
      });

      if (response.ok) {
        toast({
          title: 'Rendez-vous programmé',
          description: 'Le rendez-vous a été programmé avec l\'expert'
        });
        setMeetingDate('');
        setMeetingTime('');
        setShowMeetingDialog(false);
      } else {
        throw new Error('Erreur lors de la programmation');
      }
    } catch (error) {
      console.error('Erreur programmation RDV:', error);
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: 'Impossible de programmer le rendez-vous'
      });
    }
  };

  // ========================================
  // RENDU CONDITIONNEL
  // ========================================

  if (!user || user.type !== 'admin') {
    return <div className="p-6">Accès non autorisé</div>;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <HeaderAdmin />
        <div className="pt-16 p-6">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Chargement des détails de l'expert...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!expert) {
    return (
      <div className="min-h-screen bg-gray-50">
        <HeaderAdmin />
        <div className="pt-16 p-6">
          <div className="text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Expert non trouvé</h2>
            <p className="text-gray-600 mb-4">L'expert demandé n'existe pas ou a été supprimé.</p>
            <Button onClick={() => navigate('/admin/dashboard-optimized')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Retour au dashboard
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // ========================================
  // RENDU PRINCIPAL
  // ========================================

  return (
    <div className="min-h-screen bg-gray-50">
      <HeaderAdmin />
      
      <div className="pt-16 p-6">
        {/* En-tête avec navigation */}
        <div className="mb-6">
          <Button 
            variant="ghost" 
            onClick={() => navigate('/admin/dashboard-optimized')}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour au dashboard
          </Button>
          
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{expert.name}</h1>
              <p className="text-gray-600 mt-1">{expert.company_name}</p>
            </div>
            
            <div className="flex items-center space-x-3">
              <Badge 
                variant={
                  expert.approval_status === 'approved' ? 'default' : 
                  expert.approval_status === 'pending' ? 'secondary' : 'destructive'
                }
                className="text-sm"
              >
                {expert.approval_status === 'approved' ? 'Validé' : 
                 expert.approval_status === 'pending' ? 'En attente' : 'Rejeté'}
              </Badge>
              
              {/* Actions pour les experts en attente */}
              {expert.approval_status === 'pending' && (
                <Dialog open={showValidationDialog} onOpenChange={setShowValidationDialog}>
                  <DialogTrigger asChild>
                    <Button>
                      <CheckSquare className="w-4 h-4 mr-2" />
                      Valider
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Valider l'expert</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <Textarea
                        placeholder="Commentaire (optionnel)"
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                      />
                      <div className="flex space-x-2">
                        <Button onClick={() => updateExpertStatus('approved')}>
                          <CheckSquare className="w-4 h-4 mr-2" />
                          Valider
                        </Button>
                        <Button variant="destructive" onClick={() => updateExpertStatus('rejected')}>
                          <XSquare className="w-4 h-4 mr-2" />
                          Rejeter
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              )}
            </div>
          </div>
        </div>

        {/* Section des actions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Activity className="w-5 h-5 text-blue-600" />
              <span>Actions</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {/* Envoyer un message */}
              <Dialog open={showMessageDialog} onOpenChange={setShowMessageDialog}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="flex flex-col items-center space-y-1 h-auto py-3">
                    <MessageCircle className="w-5 h-5" />
                    <span className="text-xs">Message</span>
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Envoyer un message</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <Textarea
                      placeholder="Votre message..."
                      value={messageContent}
                      onChange={(e) => setMessageContent(e.target.value)}
                      rows={4}
                    />
                    <div className="flex justify-end space-x-2">
                      <Button variant="outline" onClick={() => setShowMessageDialog(false)}>
                        Annuler
                      </Button>
                      <Button onClick={sendMessage}>
                        <Send className="w-4 h-4 mr-2" />
                        Envoyer
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>

              {/* Envoyer un email */}
              <Dialog open={showEmailDialog} onOpenChange={setShowEmailDialog}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="flex flex-col items-center space-y-1 h-auto py-3">
                    <MailIcon className="w-5 h-5" />
                    <span className="text-xs">Email</span>
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Envoyer un email</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <Textarea
                      placeholder="Contenu de l'email..."
                      value={emailContent}
                      onChange={(e) => setEmailContent(e.target.value)}
                      rows={6}
                    />
                    <div className="flex justify-end space-x-2">
                      <Button variant="outline" onClick={() => setShowEmailDialog(false)}>
                        Annuler
                      </Button>
                      <Button onClick={sendEmail}>
                        <MailIcon className="w-4 h-4 mr-2" />
                        Envoyer
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>

              {/* Prendre RDV */}
              <Dialog open={showMeetingDialog} onOpenChange={setShowMeetingDialog}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="flex flex-col items-center space-y-1 h-auto py-3">
                    <CalendarIcon className="w-5 h-5" />
                    <span className="text-xs">RDV</span>
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Programmer un rendez-vous</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium">Date</label>
                        <input
                          type="date"
                          value={meetingDate}
                          onChange={(e) => setMeetingDate(e.target.value)}
                          className="w-full mt-1 px-3 py-2 border rounded-md"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium">Heure</label>
                        <input
                          type="time"
                          value={meetingTime}
                          onChange={(e) => setMeetingTime(e.target.value)}
                          className="w-full mt-1 px-3 py-2 border rounded-md"
                        />
                      </div>
                    </div>
                    <div className="flex justify-end space-x-2">
                      <Button variant="outline" onClick={() => setShowMeetingDialog(false)}>
                        Annuler
                      </Button>
                      <Button onClick={scheduleMeeting}>
                        <CalendarIcon className="w-4 h-4 mr-2" />
                        Programmer
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>

              {/* Appeler */}
              <Button 
                variant="outline" 
                className="flex flex-col items-center space-y-1 h-auto py-3"
                onClick={() => window.open(`tel:${expert?.phone_number}`, '_blank')}
              >
                <PhoneIcon className="w-5 h-5" />
                <span className="text-xs">Appeler</span>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Onglets */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList>
            <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
            <TabsTrigger value="assignments">Assignations</TabsTrigger>
            <TabsTrigger value="documents">Documents</TabsTrigger>
            <TabsTrigger value="messages">Messages</TabsTrigger>
          </TabsList>

          {/* Vue d'ensemble */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Informations principales */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <User className="w-5 h-5 text-blue-600" />
                    <span>Informations personnelles</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center space-x-3">
                      <Mail className="w-4 h-4 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-500">Email</p>
                        <p className="font-medium">{expert.email}</p>
                      </div>
                    </div>
                    
                    {expert.phone_number && (
                      <div className="flex items-center space-x-3">
                        <Phone className="w-4 h-4 text-gray-400" />
                        <div>
                          <p className="text-sm text-gray-500">Téléphone</p>
                          <p className="font-medium">{expert.phone_number}</p>
                        </div>
                      </div>
                    )}
                    
                    {expert.location && (
                      <div className="flex items-center space-x-3">
                        <MapPin className="w-4 h-4 text-gray-400" />
                        <div>
                          <p className="text-sm text-gray-500">Localisation</p>
                          <p className="font-medium">{expert.location}</p>
                        </div>
                      </div>
                    )}
                    
                    <div className="flex items-center space-x-3">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-500">Inscrit le</p>
                        <p className="font-medium">
                          {new Date(expert.created_at).toLocaleDateString('fr-FR')}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  {expert.description && (
                    <div>
                      <p className="text-sm text-gray-500 mb-2">Description</p>
                      <p className="text-gray-700">{expert.description}</p>
                    </div>
                  )}
                  
                  {expert.specializations && expert.specializations.length > 0 && (
                    <div>
                      <p className="text-sm text-gray-500 mb-2">Spécialisations</p>
                      <div className="flex flex-wrap gap-2">
                        {expert.specializations?.slice(0, 2).map((spec: string, index: number) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {spec}
                          </Badge>
                        ))}
                        {expert.specializations?.length > 2 && (
                          <Badge variant="secondary" className="text-xs">
                            +{expert.specializations.length - 2}
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Statistiques */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <TrendingUp className="w-5 h-5 text-green-600" />
                    <span>Statistiques</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {stats && (
                    <>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Assignations totales</span>
                        <span className="font-semibold">{stats.totalAssignments}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Assignations terminées</span>
                        <span className="font-semibold text-green-600">{stats.completedAssignments}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Assignations actives</span>
                        <span className="font-semibold text-blue-600">{stats.activeAssignments}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Gains totaux</span>
                        <span className="font-semibold">{stats.totalEarnings}€</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Note moyenne</span>
                        <div className="flex items-center">
                          <Star className="w-4 h-4 text-yellow-500 mr-1" />
                          <span className="font-semibold">{stats.averageRating}/5</span>
                        </div>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Temps de réponse</span>
                        <span className="font-semibold">{stats.responseTime}h</span>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Assignations */}
          <TabsContent value="assignments" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Briefcase className="w-5 h-5 text-purple-600" />
                  <span>Assignations ({assignments.length})</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {assignments.length === 0 ? (
                  <div className="text-center py-8">
                    <Briefcase className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">Aucune assignation pour cet expert</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Client</TableHead>
                        <TableHead>Produit</TableHead>
                        <TableHead>Statut</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {assignments.map((assignment) => (
                        <TableRow key={assignment.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium">{assignment.Client.company_name}</p>
                              <p className="text-sm text-gray-500">{assignment.Client.email}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>
                              <p className="font-medium">{assignment.ProduitEligible.nom}</p>
                              <p className="text-sm text-gray-500">{assignment.ProduitEligible.description}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge 
                              variant={
                                assignment.status === 'completed' ? 'default' : 
                                assignment.status === 'active' ? 'secondary' : 'destructive'
                              }
                            >
                              {assignment.status === 'completed' ? 'Terminé' : 
                               assignment.status === 'active' ? 'En cours' : 'En attente'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {new Date(assignment.created_at).toLocaleDateString('fr-FR')}
                          </TableCell>
                          <TableCell>
                            <Button size="sm" variant="secondary">
                              <Eye className="w-4 h-4 mr-1" />
                              Voir
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Documents */}
          <TabsContent value="documents" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <FileText className="w-5 h-5 text-orange-600" />
                  <span>Documents</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">Aucun document disponible</p>
                  <p className="text-sm text-gray-500 mt-2">
                    Les documents de l'expert apparaîtront ici
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Messages */}
          <TabsContent value="messages" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <MessageSquare className="w-5 h-5 text-blue-600" />
                  <span>Messages</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex space-x-2">
                    <Textarea
                      placeholder="Tapez votre message..."
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      className="flex-1"
                    />
                    <Button onClick={sendMessage} disabled={!newComment.trim()}>
                      <Send className="w-4 h-4 mr-2" />
                      Envoyer
                    </Button>
                  </div>
                  
                  <div className="text-center py-8">
                    <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">Aucun message</p>
                    <p className="text-sm text-gray-500 mt-2">
                      Les messages échangés avec cet expert apparaîtront ici
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default ExpertDetails;
