import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Navigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Clock, Eye, Check, X, Building, MapPin, Users, Star, FileText, CheckCircle, XCircle } from "lucide-react";
import { config } from "@/config/env";

interface ExpertValidation { id: string;
  name: string;
  email: string;
  company_name: string;
  specializations: string[];
  experience: string;
  location: string;
  description: string;
  certifications: any[];
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  rejection_reason?: string }

interface ContentValidation { id: string;
  type: 'expert_profile' | 'certification' | 'document';
  title: string;
  description: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  rejection_reason?: string;
  expert_id?: string;
  expert_name?: string }

export default function ValidationDashboard() {
  const { user, isLoading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [expertValidations, setExpertValidations] = useState<ExpertValidation[]>([]);
  const [contentValidations, setContentValidations] = useState<ContentValidation[]>([]);
  const [selectedExpert, setSelectedExpert] = useState<ExpertValidation | null>(null);
  const [selectedContent, setSelectedContent] = useState<ContentValidation | null>(null);
  const [showExpertModal, setShowExpertModal] = useState(false);
  const [showContentModal, setShowContentModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [processing, setProcessing] = useState(false);

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

  // Chargement des données
  useEffect(() => {
    if (user?.id) {
      loadValidationData();
    }
  }, [user]);

  const loadValidationData = async () => { try {
      setLoading(true);
      
      // Charger les validations d'experts
      const expertsResponse = await fetch(`${config.API_URL }/api/admin/validations/experts`, { headers: {
          'Authorization': `Bearer ${localStorage.getItem('token') }`
        }
      });
      
      if (expertsResponse.ok) { const expertsData = await expertsResponse.json();
        setExpertValidations(expertsData.data || []); }

      // Charger les validations de contenu
      const contentResponse = await fetch(`${ config.API_URL }/api/admin/validations/content`, { headers: {
          'Authorization': `Bearer ${localStorage.getItem('token') }`
        }
      });
      
      if (contentResponse.ok) { const contentData = await contentResponse.json();
        setContentValidations(contentData.data || []); }

    } catch (error) { console.error('Erreur chargement validations: ', error); } finally { setLoading(false); }
  };

  const handleExpertValidation = async (expertId: string, action: 'approve' | 'reject') => {
    if (action === 'reject' && !rejectionReason.trim()) {
      alert('Veuillez fournir une raison de rejet');
      return;
    }

    setProcessing(true);
    try {
      const response = await fetch(`${config.API_URL}/api/admin/validations/experts/${expertId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ action, rejection_reason: action === 'reject' ? rejectionReason : undefined })
      });

      if (response.ok) {
        setShowExpertModal(false);
        setRejectionReason('');
        loadValidationData(); // Recharger les données
      } else {
        throw new Error('Erreur lors de la validation');
      }
    } catch (error) {
      console.error('Erreur validation expert:', error);
      alert('Erreur lors de la validation');
    } finally {
      setProcessing(false);
    }
  };

  const handleContentValidation = async (contentId: string, action: 'approve' | 'reject') => {
    if (action === 'reject' && !rejectionReason.trim()) {
      alert('Veuillez fournir une raison de rejet');
      return;
    }

    setProcessing(true);
    try {
      const response = await fetch(`${config.API_URL}/api/admin/validations/content/${contentId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ action, rejection_reason: action === 'reject' ? rejectionReason : undefined })
      });

      if (response.ok) {
        setShowContentModal(false);
        setRejectionReason('');
        loadValidationData(); // Recharger les données
      } else {
        throw new Error('Erreur lors de la validation');
      }
    } catch (error) {
      console.error('Erreur validation contenu:', error);
      alert('Erreur lors de la validation');
    } finally {
      setProcessing(false);
    }
  };

  const openExpertModal = (expert: ExpertValidation) => { setSelectedExpert(expert);
    setShowExpertModal(true); };

  const openContentModal = (content: ContentValidation) => { setSelectedContent(content);
    setShowContentModal(true); };

  const getStatusBadge = (status: string) => { switch (status) {
      case 'pending':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">En attente</Badge>;
      case 'approved':
        return <Badge variant="default" className="bg-green-100 text-green-800">Approuvé</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Rejeté</Badge>;
      default: return <Badge variant="outline">Inconnu</Badge>; }
  };

  const getContentTypeIcon = (type: string) => { switch (type) {
      case 'expert_profile':
        return <Users className="w-4 h-4" />;
      case 'certification':
        return <Star className="w-4 h-4" />;
      case 'document':
        return <FileText className="w-4 h-4" />;
      default: return <FileText className="w-4 h-4" />; }
  };

  if (loading) { return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    ); }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Tableau de Bord de Validation</h1>
          <p className="text-gray-600">Gérez les validations des experts et du contenu</p>
        </div>

        { /* Statistiques */ }
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Clock className="w-8 h-8 text-yellow-600 mr-4" />
                <div>
                  <p className="text-sm font-medium text-gray-600">En attente</p>
                  <p className="text-2xl font-bold text-gray-900">
                    { expertValidations.filter(e => e.status === 'pending').length + 
                     contentValidations.filter(c => c.status === 'pending').length }
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <CheckCircle className="w-8 h-8 text-green-600 mr-4" />
                <div>
                  <p className="text-sm font-medium text-gray-600">Approuvés</p>
                  <p className="text-2xl font-bold text-gray-900">
                    { expertValidations.filter(e => e.status === 'approved').length + 
                     contentValidations.filter(c => c.status === 'approved').length }
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <XCircle className="w-8 h-8 text-red-600 mr-4" />
                <div>
                  <p className="text-sm font-medium text-gray-600">Rejetés</p>
                  <p className="text-2xl font-bold text-gray-900">
                    { expertValidations.filter(e => e.status === 'rejected').length + 
                     contentValidations.filter(c => c.status === 'rejected').length }
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Users className="w-8 h-8 text-blue-600 mr-4" />
                <div>
                  <p className="text-sm font-medium text-gray-600">Total</p>
                  <p className="text-2xl font-bold text-gray-900">
                    { expertValidations.length + contentValidations.length }
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        { /* Onglets */ }
        <Tabs defaultValue="experts" className="space-y-6">
          <TabsList>
            <TabsTrigger value="experts" className="flex items-center">
              <Users className="w-4 h-4 mr-2" />
              Experts ({ expertValidations.length })
            </TabsTrigger>
            <TabsTrigger value="content" className="flex items-center">
              <FileText className="w-4 h-4 mr-2" />
              Contenu ({ contentValidations.length })
            </TabsTrigger>
          </TabsList>

          <TabsContent value="experts" className="space-y-4">
            { expertValidations.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-700 mb-2">Aucune validation d'expert</h3>
                  <p className="text-gray-500">Tous les experts ont été traités</p>
                </CardContent>
              </Card>
            ) : (
              expertValidations.map((expert) => (
                <Card key={expert.id } className="hover: shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="flex-shrink-0">
                          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                            <Users className="w-6 h-6 text-blue-600" />
                          </div>
                        </div>
                        
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-gray-900">{ expert.name }</h3>
                          <p className="text-sm text-gray-600">{ expert.email }</p>
                          <div className="flex items-center space-x-2 mt-1">
                            <Building className="w-4 h-4 text-gray-400" />
                            <span className="text-sm text-gray-600">{ expert.company_name }</span>
                            <MapPin className="w-4 h-4 text-gray-400 ml-2" />
                            <span className="text-sm text-gray-600">{ expert.location }</span>
                          </div>
                          <div className="flex flex-wrap gap-1 mt-2">
                            { expert.specializations.map((spec, index) => (
                              <Badge key={index } variant="outline" className="text-xs">
                                { spec }
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-3">
                        { getStatusBadge(expert.status) }
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={ () => openExpertModal(expert) }
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          Voir
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          <TabsContent value="content" className="space-y-4">
            { contentValidations.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-700 mb-2">Aucune validation de contenu</h3>
                  <p className="text-gray-500">Tout le contenu a été traité</p>
                </CardContent>
              </Card>
            ) : (
              contentValidations.map((content) => (<Card key={content.id } className="hover: shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="flex-shrink-0">
                          <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                            { getContentTypeIcon(content.type) }
                          </div>
                        </div>
                        
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-gray-900">{ content.title }</h3>
                          <p className="text-sm text-gray-600">{ content.description }</p>
                          { content.expert_name && (
                            <p className="text-sm text-gray-500 mt-1">
                              Expert: {content.expert_name }
                            </p>
                          )}
                          <p className="text-xs text-gray-400 mt-1">
                            { new Date(content.created_at).toLocaleDateString('fr-FR') }
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-3">
                        { getStatusBadge(content.status) }
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={ () => openContentModal(content) }
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          Voir
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>
        </Tabs>
      </div>

      { /* Modal Expert */ }
      <Dialog open={ showExpertModal } onOpenChange={ setShowExpertModal }>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Validation Expert</DialogTitle>
          </DialogHeader>
          
          { selectedExpert && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Nom</Label>
                  <p className="text-sm text-gray-600">{selectedExpert.name }</p>
                </div>
                <div>
                  <Label>Email</Label>
                  <p className="text-sm text-gray-600">{ selectedExpert.email }</p>
                </div>
                <div>
                  <Label>Entreprise</Label>
                  <p className="text-sm text-gray-600">{ selectedExpert.company_name }</p>
                </div>
                <div>
                  <Label>Localisation</Label>
                  <p className="text-sm text-gray-600">{ selectedExpert.location }</p>
                </div>
              </div>
              
              <div>
                <Label>Spécialisations</Label>
                <div className="flex flex-wrap gap-1 mt-1">
                  { selectedExpert.specializations.map((spec, index) => (
                    <Badge key={index } variant="outline">{ spec }</Badge>
                  ))}
                </div>
              </div>
              
              <div>
                <Label>Expérience</Label>
                <p className="text-sm text-gray-600 mt-1">{ selectedExpert.experience }</p>
              </div>
              
              <div>
                <Label>Description</Label>
                <p className="text-sm text-gray-600 mt-1">{ selectedExpert.description }</p>
              </div>

              { selectedExpert.status === 'rejected' && selectedExpert.rejection_reason && (
                <div>
                  <Label>Raison du rejet</Label>
                  <p className="text-sm text-red-600 mt-1">{selectedExpert.rejection_reason }</p>
                </div>
              )}

              { selectedExpert.status === 'pending' && (
                <div>
                  <Label>Raison du rejet (optionnel)</Label>
                  <Textarea
                    value={rejectionReason }
                    onChange={ (e) => setRejectionReason(e.target.value) }
                    placeholder="Expliquez pourquoi vous rejetez cet expert..."
                    className="mt-1"
                  />
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            { selectedExpert?.status === 'pending' && (
              <>
                <Button
                  variant="outline"
                  onClick={() => setShowExpertModal(false) }
                  disabled={ processing }
                >
                  Annuler
                </Button>
                <Button
                  variant="destructive"
                  onClick={ () => handleExpertValidation(selectedExpert!.id, 'reject') }
                  disabled={ processing }
                >
                  <X className="w-4 h-4 mr-1" />
                  Rejeter
                </Button>
                <Button
                  onClick={ () => handleExpertValidation(selectedExpert!.id, 'approve') }
                  disabled={ processing }
                >
                  <Check className="w-4 h-4 mr-1" />
                  Approuver
                </Button>
              </>
            )}
            { selectedExpert?.status !== 'pending' && (
              <Button onClick={() => setShowExpertModal(false) }>
                Fermer
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      { /* Modal Contenu */ }
      <Dialog open={ showContentModal } onOpenChange={ setShowContentModal }>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Validation Contenu</DialogTitle>
          </DialogHeader>
          
          { selectedContent && (
            <div className="space-y-4">
              <div>
                <Label>Titre</Label>
                <p className="text-sm text-gray-600 mt-1">{selectedContent.title }</p>
              </div>
              
              <div>
                <Label>Description</Label>
                <p className="text-sm text-gray-600 mt-1">{ selectedContent.description }</p>
              </div>
              
              <div>
                <Label>Type</Label>
                <p className="text-sm text-gray-600 mt-1">{ selectedContent.type }</p>
              </div>

              { selectedContent.expert_name && (
                <div>
                  <Label>Expert</Label>
                  <p className="text-sm text-gray-600 mt-1">{selectedContent.expert_name }</p>
                </div>
              )}

              { selectedContent.status === 'rejected' && selectedContent.rejection_reason && (
                <div>
                  <Label>Raison du rejet</Label>
                  <p className="text-sm text-red-600 mt-1">{selectedContent.rejection_reason }</p>
                </div>
              )}

              { selectedContent.status === 'pending' && (
                <div>
                  <Label>Raison du rejet (optionnel)</Label>
                  <Textarea
                    value={rejectionReason }
                    onChange={ (e) => setRejectionReason(e.target.value) }
                    placeholder="Expliquez pourquoi vous rejetez ce contenu..."
                    className="mt-1"
                  />
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            { selectedContent?.status === 'pending' && (
              <>
                <Button
                  variant="outline"
                  onClick={() => setShowContentModal(false) }
                  disabled={ processing }
                >
                  Annuler
                </Button>
                <Button
                  variant="destructive"
                  onClick={ () => handleContentValidation(selectedContent!.id, 'reject') }
                  disabled={ processing }
                >
                  <X className="w-4 h-4 mr-1" />
                  Rejeter
                </Button>
                <Button
                  onClick={ () => handleContentValidation(selectedContent!.id, 'approve') }
                  disabled={ processing }
                >
                  <Check className="w-4 h-4 mr-1" />
                  Approuver
                </Button>
              </>
            )}
            { selectedContent?.status !== 'pending' && (
              <Button onClick={() => setShowContentModal(false) }>
                Fermer
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 