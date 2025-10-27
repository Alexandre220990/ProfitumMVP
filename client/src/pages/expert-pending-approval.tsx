import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Clock, Mail, AlertCircle, Home, RefreshCw, CheckCircle, Phone } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAuth } from "@/hooks/use-auth";
import { get } from "@/lib/api";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

interface UserInfo {
  name: string;
  email: string;
  company: string;
  siren: string;
  specializations: string[];
  type: string;
  experience?: string;
  location?: string;
  phone?: string;
}

interface ApprovalStatus {
  status: 'pending' | 'approved' | 'rejected' | 'under_review';
  submitted_at: string;
  reviewed_at?: string;
  reviewer_notes?: string;
  estimated_completion?: string;
}

const ExpertPendingApproval = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [approvalStatus, setApprovalStatus] = useState<ApprovalStatus | null>(null);
  const [lastCheck, setLastCheck] = useState<Date>(new Date());
  const [isChecking, setIsChecking] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Charger les données initiales
  useEffect(() => {
    loadUserData();
  }, [user]);

  const loadUserData = async () => {
    try {
      setIsLoading(true);
      
      if (user) {
        // Construire les informations utilisateur depuis Supabase
        const userData: UserInfo = {
          name: user.username || user.email?.split('@')[0] || 'Utilisateur',
          email: user.email || '',
          company: user.company_name || 'Non spécifié',
          siren: user.siren || 'Non spécifié',
          specializations: user.specializations || [],
          type: user.type || 'expert',
          experience: user.experience || 'Non spécifié',
          location: user.location || 'Non spécifié',
          phone: user.phone_number || 'Non spécifié'
        };
        setUserInfo(userData);

        // Charger le statut d'approbation depuis l'API
        await loadApprovalStatus();
      } else {
        // Si pas d'utilisateur connecté, rediriger vers la connexion
        navigate("/connexion-expert");
      }
    } catch (error) {
      console.error("Erreur lors du chargement des données:", error);
      toast.error("Impossible de charger vos informations. Veuillez réessayer.");
    } finally {
      setIsLoading(false);
    }
  };

  const loadApprovalStatus = async () => {
    try {
      const response = await get('/experts/approval-status');
      
      if (response.success) {
        const approvalData = response.data as ApprovalStatus;
        setApprovalStatus(approvalData);
        
        // Si approuvé, rediriger vers le dashboard
        if (approvalData.status === 'approved') {
          toast.success("Félicitations ! Votre compte a été approuvé. Redirection vers votre tableau de bord...");
          setTimeout(() => navigate("/expert/dashboard"), 2000);
        }
      } else {
        // Si pas de statut trouvé, créer un statut par défaut
        setApprovalStatus({
          status: 'pending',
          submitted_at: new Date().toISOString(),
          estimated_completion: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString() // 48h
        });
      }
    } catch (error) {
      console.error("Erreur lors du chargement du statut:", error);
      // Statut par défaut en cas d'erreur
      setApprovalStatus({
        status: 'pending',
        submitted_at: new Date().toISOString(),
        estimated_completion: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString()
      });
    }
  };

  const handleCheckStatus = async () => {
    try {
      setIsChecking(true);
      setLastCheck(new Date());
      
      // Appel API pour vérifier le statut
      await loadApprovalStatus();
      
      toast.success("Votre statut d'approbation a été mis à jour.");
    } catch (error) {
      console.error("Erreur lors de la vérification du statut:", error);
      toast.error("Impossible de vérifier le statut. Veuillez réessayer.");
    } finally {
      setIsChecking(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const handleContactSupport = () => {
    // Rediriger vers la page À Propos
    navigate("/a-propos");
  };

  const handleViewProfile = () => {
    navigate("/expert/profile");
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">En attente</Badge>;
      case 'under_review':
        return <Badge variant="default" className="bg-blue-100 text-blue-800">En cours d'examen</Badge>;
      case 'approved':
        return <Badge variant="default" className="bg-green-100 text-green-800">Approuvé</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Rejeté</Badge>;
      default:
        return <Badge variant="secondary">Inconnu</Badge>;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-5 w-5 text-yellow-500" />;
      case 'under_review':
        return <RefreshCw className="h-5 w-5 text-blue-500 animate-spin" />;
      case 'approved':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'rejected':
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Clock className="h-5 w-5 text-gray-500" />;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getEstimatedTime = () => {
    if (!approvalStatus?.estimated_completion) return null;
    
    const now = new Date();
    const estimated = new Date(approvalStatus.estimated_completion);
    const diff = estimated.getTime() - now.getTime();
    
    if (diff <= 0) return "Bientôt";
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);
    
    if (days > 0) return `${days} jour${days > 1 ? 's' : ''}`;
    if (hours > 0) return `${hours} heure${hours > 1 ? 's' : ''}`;
    return "Moins d'une heure";
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Chargement de vos informations...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!userInfo) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Accès refusé</h2>
            <p className="text-gray-600 mb-4">Vous devez être connecté pour accéder à cette page.</p>
            <Button onClick={() => navigate("/connexion-expert")}>
              Se connecter
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <img src="/Logo-Profitum.png" alt="Profitum Logo" className="h-8" />
              <span className="ml-2 text-xl font-semibold text-gray-900">Profitum</span>
            </div>
            <div className="flex items-center gap-4">
              <Button variant="outline" onClick={handleViewProfile}>
                Mon profil
              </Button>
              <Button variant="outline" onClick={handleLogout}>
                Déconnexion
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Contenu principal */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-8">
          {getStatusIcon(approvalStatus?.status || 'pending')}
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            {approvalStatus?.status === 'approved' ? 'Compte approuvé !' : 'Compte en cours d\'approbation'}
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            {approvalStatus?.status === 'approved' 
              ? 'Votre compte expert a été approuvé. Vous pouvez maintenant accéder à votre tableau de bord.'
              : 'Votre compte expert est actuellement en cours d\'examen par nos équipes Profitum. Ce processus prend généralement 24 à 48 heures.'
            }
          </p>
          {approvalStatus && (
            <div className="mt-4">
              {getStatusBadge(approvalStatus.status)}
              {approvalStatus.status === 'pending' && getEstimatedTime() && (
                <p className="text-sm text-gray-500 mt-2">
                  Estimation : {getEstimatedTime()}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Informations de l'expert */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              Vos informations d'inscription
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-gray-500">Nom complet</label>
                  <p className="text-gray-900">{userInfo.name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Email</label>
                  <p className="text-gray-900">{userInfo.email}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Entreprise</label>
                  <p className="text-gray-900">{userInfo.company}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Téléphone</label>
                  <p className="text-gray-900">{userInfo.phone}</p>
                </div>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-gray-500">SIREN</label>
                  <p className="text-gray-900">{userInfo.siren}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Localisation</label>
                  <p className="text-gray-900">{userInfo.location}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Expérience</label>
                  <p className="text-gray-900">{userInfo.experience}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Spécialisations</label>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {userInfo.specializations.map((spec, index) => (
                      <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 text-sm rounded-full">
                        {spec}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Statut d'approbation détaillé */}
        {approvalStatus && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Détails de l'approbation</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-500">Statut actuel</span>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(approvalStatus.status)}
                    {getStatusBadge(approvalStatus.status)}
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-500">Soumis le</span>
                  <span className="text-sm text-gray-900">{formatDate(approvalStatus.submitted_at)}</span>
                </div>
                {approvalStatus.reviewed_at && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-500">Examiné le</span>
                    <span className="text-sm text-gray-900">{formatDate(approvalStatus.reviewed_at)}</span>
                  </div>
                )}
                {approvalStatus.estimated_completion && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-500">Estimation de traitement</span>
                    <span className="text-sm text-gray-900">{formatDate(approvalStatus.estimated_completion)}</span>
                  </div>
                )}
                {approvalStatus.reviewer_notes && (
                  <div>
                    <span className="text-sm font-medium text-gray-500">Notes du réviseur</span>
                    <p className="text-sm text-gray-900 mt-1 p-3 bg-gray-50 rounded-lg">
                      {approvalStatus.reviewer_notes}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Processus d'approbation */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Processus d'approbation</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-blue-600 font-semibold text-sm">1</span>
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">Vérification des informations</h3>
                  <p className="text-gray-600 mt-1">
                    Nos équipes vérifient la validité de vos informations et de votre expertise.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-blue-600 font-semibold text-sm">2</span>
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">Validation des qualifications</h3>
                  <p className="text-gray-600 mt-1">
                    Nous confirmons vos qualifications et votre expérience dans vos domaines de spécialisation.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-blue-600 font-semibold text-sm">3</span>
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">Approbation finale</h3>
                  <p className="text-gray-600 mt-1">
                    Une fois validé, vous recevrez un email de confirmation et pourrez accéder à votre tableau de bord.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button 
            onClick={handleCheckStatus}
            disabled={isChecking}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${isChecking ? 'animate-spin' : ''}`} />
            {isChecking ? 'Vérification...' : 'Vérifier le statut'}
          </Button>
          <Button 
            variant="outline"
            onClick={handleContactSupport}
            className="flex items-center gap-2"
          >
            <Mail className="h-4 w-4" />
            Nous contacter
          </Button>
          <Button 
            variant="outline"
            onClick={() => window.open('tel:+33123456789', '_blank')}
            className="flex items-center gap-2"
          >
            <Phone className="h-4 w-4" />
            Appeler le support
          </Button>
          <Button 
            variant="ghost"
            onClick={() => navigate("/")}
            className="flex items-center gap-2"
          >
            <Home className="h-4 w-4" />
            Retour à l'accueil
          </Button>
        </div>

        {/* Dernière vérification */}
        <div className="text-center mt-8">
          <p className="text-sm text-gray-500">
            Dernière vérification : {lastCheck.toLocaleString('fr-FR')}
          </p>
        </div>

        {/* Alert d'information */}
        <Alert className="mt-8">
          <Mail className="h-4 w-4" />
          <AlertDescription>
            <strong>Important :</strong> Vous recevrez un email de confirmation dès que votre compte sera approuvé. 
            Vous pouvez également vérifier le statut en cliquant sur le bouton ci-dessus.
            {approvalStatus?.status === 'rejected' && (
              <span className="block mt-2">
                <strong>Votre demande a été rejetée.</strong> Veuillez nous contacter pour plus d'informations.
              </span>
            )}
          </AlertDescription>
        </Alert>
      </div>
    </div>
  );
};

export default ExpertPendingApproval; 