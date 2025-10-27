import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/use-auth";
import { Navigate } from "react-router-dom";
import { toast } from "sonner";
import { config } from "@/config/env";
import ChangePasswordModal from "@/components/client/ChangePasswordModal";
import { 
  User, 
  Building, 
  Phone, 
  Mail, 
  MapPin, 
  Calendar,
  DollarSign,
  Users,
  Lock,
  Bell,
  Save,
  AlertCircle
} from "lucide-react";

interface ClientData {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  username: string;
  company_name: string | null;
  siren: string | null;
  phone_number: string | null;
  address: string;
  city: string;
  postal_code: string;
  website: string | null;
  secteurActivite: string | null;
  nombreEmployes: number | null;
  ancienneteEntreprise: number | null;
  chiffreAffaires: number | null;
  dateCreation: string | null;
  typeProjet: string | null;
  budget_range: string | null;
  timeline: string | null;
  revenuAnnuel: number | null;
  metadata: any;
  statut: string | null;
  derniereConnexion: string | null;
  apporteur_id: string | null;
  created_at: string;
}

const Settings = () => { 
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [clientData, setClientData] = useState<ClientData | null>(null);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  
  // Notifications
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(true);

  // Redirection si non connecté ou pas client
  if (!user) {
    return <Navigate to="/connexion-client" replace />;
  }

  if (user.type !== 'client') {
    return <Navigate to="/" replace />;
  }

  // Charger les données du client
  useEffect(() => {
    loadClientData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const loadClientData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      const response = await fetch(`${config.API_URL}/api/client/profile`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data) {
          setClientData(result.data);
          
          // Charger les préférences de notifications depuis metadata
          if (result.data.metadata?.notifications) {
            setEmailNotifications(result.data.metadata.notifications.email ?? true);
            setPushNotifications(result.data.metadata.notifications.push ?? true);
          }
        }
      }
    } catch (error) {
      console.error('❌ Erreur chargement profil:', error);
      toast.error('Erreur lors du chargement de vos informations');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!clientData) return;
    
    try {
      setSaving(true);
      const token = localStorage.getItem('token');
      
      const response = await fetch(`${config.API_URL}/api/client/profile`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...clientData,
          metadata: {
            ...clientData.metadata,
            notifications: {
              email: emailNotifications,
              push: pushNotifications
            }
          }
        })
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          toast.success('✅ Modifications enregistrées avec succès !');
          loadClientData(); // Recharger les données
        }
      } else {
        throw new Error('Erreur lors de la sauvegarde');
      }
    } catch (error) {
      console.error('❌ Erreur sauvegarde:', error);
      toast.error('Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  const updateField = (field: keyof ClientData, value: any) => {
    if (!clientData) return;
    setClientData({ ...clientData, [field]: value });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement de vos paramètres...</p>
        </div>
      </div>
    );
  }

  if (!clientData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="p-6 text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Erreur de chargement</h3>
            <p className="text-gray-500">Impossible de charger vos informations</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Paramètres du compte</h1>
          <p className="text-gray-600">Gérez vos informations personnelles et préférences</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Colonne principale */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Informations personnelles */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Informations personnelles
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="first_name">Prénom</Label>
                    <Input
                      id="first_name"
                      value={clientData.first_name || ''}
                      onChange={(e) => updateField('first_name', e.target.value)}
                      placeholder="Votre prénom"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="last_name">Nom</Label>
                    <Input
                      id="last_name"
                      value={clientData.last_name || ''}
                      onChange={(e) => updateField('last_name', e.target.value)}
                      placeholder="Votre nom"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="username">Nom d'utilisateur</Label>
                  <Input
                    id="username"
                    value={clientData.username || ''}
                    onChange={(e) => updateField('username', e.target.value)}
                    placeholder="Nom d'utilisateur"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={clientData.email}
                    onChange={(e) => updateField('email', e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone_number" className="flex items-center gap-2">
                    <Phone className="w-4 h-4" />
                    Téléphone
                  </Label>
                  <Input
                    id="phone_number"
                    type="tel"
                    value={clientData.phone_number || ''}
                    onChange={(e) => updateField('phone_number', e.target.value)}
                    placeholder="+33 6 12 34 56 78"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Informations entreprise */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building className="w-5 h-5" />
                  Informations entreprise
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="company_name">Nom de l'entreprise</Label>
                  <Input
                    id="company_name"
                    value={clientData.company_name || ''}
                    onChange={(e) => updateField('company_name', e.target.value)}
                    placeholder="Nom de votre entreprise"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="siren">SIREN</Label>
                    <Input
                      id="siren"
                      value={clientData.siren || ''}
                      onChange={(e) => updateField('siren', e.target.value)}
                      placeholder="123 456 789"
                      maxLength={9}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="website">Site web</Label>
                    <Input
                      id="website"
                      value={clientData.website || ''}
                      onChange={(e) => updateField('website', e.target.value)}
                      placeholder="https://www.exemple.fr"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="secteurActivite">Secteur d'activité</Label>
                    <Input
                      id="secteurActivite"
                      value={clientData.secteurActivite || ''}
                      onChange={(e) => updateField('secteurActivite', e.target.value)}
                      placeholder="Ex: Commerce, Services, BTP..."
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="nombreEmployes">Nombre d'employés</Label>
                    <Input
                      id="nombreEmployes"
                      type="number"
                      value={clientData.nombreEmployes || ''}
                      onChange={(e) => updateField('nombreEmployes', parseInt(e.target.value) || null)}
                      placeholder="Ex: 10"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="chiffreAffaires" className="flex items-center gap-2">
                      <DollarSign className="w-4 h-4" />
                      Chiffre d'affaires annuel (€)
                    </Label>
                    <Input
                      id="chiffreAffaires"
                      type="number"
                      value={clientData.chiffreAffaires || ''}
                      onChange={(e) => updateField('chiffreAffaires', parseFloat(e.target.value) || null)}
                      placeholder="Ex: 500000"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="ancienneteEntreprise">Ancienneté (années)</Label>
                    <Input
                      id="ancienneteEntreprise"
                      type="number"
                      value={clientData.ancienneteEntreprise || ''}
                      onChange={(e) => updateField('ancienneteEntreprise', parseInt(e.target.value) || null)}
                      placeholder="Ex: 5"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Adresse */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="w-5 h-5" />
                  Adresse
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="address">Adresse</Label>
                  <Input
                    id="address"
                    value={clientData.address}
                    onChange={(e) => updateField('address', e.target.value)}
                    placeholder="Numéro et nom de rue"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="postal_code">Code postal</Label>
                    <Input
                      id="postal_code"
                      value={clientData.postal_code}
                      onChange={(e) => updateField('postal_code', e.target.value)}
                      placeholder="75001"
                      maxLength={5}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="city">Ville</Label>
                    <Input
                      id="city"
                      value={clientData.city}
                      onChange={(e) => updateField('city', e.target.value)}
                      placeholder="Paris"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Projet et budget */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="w-5 h-5" />
                  Projet et budget
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="typeProjet">Type de projet</Label>
                  <Input
                    id="typeProjet"
                    value={clientData.typeProjet || ''}
                    onChange={(e) => updateField('typeProjet', e.target.value)}
                    placeholder="Ex: Récupération TICPE, Crédit impôt..."
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="budget_range">Fourchette de budget</Label>
                    <Select 
                      value={clientData.budget_range || ''} 
                      onValueChange={(value) => updateField('budget_range', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionnez une fourchette" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="0-10k">0 - 10 000 €</SelectItem>
                        <SelectItem value="10k-50k">10 000 - 50 000 €</SelectItem>
                        <SelectItem value="50k-150k">50 000 - 150 000 €</SelectItem>
                        <SelectItem value="150k+">150 000 € et plus</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="timeline">Délai souhaité</Label>
                    <Select 
                      value={clientData.timeline || ''} 
                      onValueChange={(value) => updateField('timeline', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionnez un délai" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="urgent">Urgent (moins d'1 mois)</SelectItem>
                        <SelectItem value="normal">Normal (1-3 mois)</SelectItem>
                        <SelectItem value="flexible">Flexible (3-6 mois)</SelectItem>
                        <SelectItem value="long_term">Long terme (6+ mois)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="revenuAnnuel">Revenu annuel (€)</Label>
                  <Input
                    id="revenuAnnuel"
                    type="number"
                    value={clientData.revenuAnnuel || ''}
                    onChange={(e) => updateField('revenuAnnuel', parseFloat(e.target.value) || null)}
                    placeholder="Ex: 250000"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Notifications */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="w-5 h-5" />
                  Notifications
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="email-notifications" className="text-base">Notifications par email</Label>
                    <p className="text-sm text-gray-500">Recevoir les notifications importantes par email</p>
                  </div>
                  <Switch
                    id="email-notifications"
                    checked={emailNotifications}
                    onCheckedChange={setEmailNotifications}
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="push-notifications" className="text-base">Notifications push</Label>
                    <p className="text-sm text-gray-500">Recevoir les notifications sur votre navigateur</p>
                  </div>
                  <Switch
                    id="push-notifications"
                    checked={pushNotifications}
                    onCheckedChange={setPushNotifications}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Sécurité */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lock className="w-5 h-5" />
                  Sécurité
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => setShowPasswordModal(true)}
                >
                  <Lock className="w-4 h-4 mr-2" />
                  Changer le mot de passe
                </Button>
              </CardContent>
            </Card>

            {/* Bouton de sauvegarde principal */}
            <div className="flex justify-end gap-3">
              <Button 
                variant="outline"
                onClick={loadClientData}
                disabled={saving}
              >
                Annuler
              </Button>
              <Button 
                onClick={handleSave}
                disabled={saving}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    Enregistrement...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Enregistrer les modifications
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Colonne latérale - Informations du compte */}
          <div className="space-y-6">
            
            {/* Statut du compte */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Statut du compte</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Type</span>
                  <Badge className="bg-blue-100 text-blue-800">Client</Badge>
                </div>
                
                <Separator />
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Statut</span>
                  <Badge className={
                    clientData.statut === 'actif' ? 'bg-green-100 text-green-800' :
                    clientData.statut === 'inactif' ? 'bg-gray-100 text-gray-800' :
                    'bg-yellow-100 text-yellow-800'
                  }>
                    {clientData.statut || 'Actif'}
                  </Badge>
                </div>

                <Separator />

                <div className="space-y-1">
                  <span className="text-sm text-gray-600 flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    Membre depuis
                  </span>
                  <p className="text-sm font-medium">
                    {clientData.created_at ? new Date(clientData.created_at).toLocaleDateString('fr-FR', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric'
                    }) : 'N/A'}
                  </p>
                </div>

                {clientData.derniereConnexion && (
                  <>
                    <Separator />
                    <div className="space-y-1">
                      <span className="text-sm text-gray-600">Dernière connexion</span>
                      <p className="text-sm font-medium">
                        {new Date(clientData.derniereConnexion).toLocaleDateString('fr-FR', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Informations de compte */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Informations</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">ID Client</span>
                  <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                    {clientData.id.substring(0, 8)}...
                  </code>
                </div>

                {clientData.dateCreation && (
                  <>
                    <Separator />
                    <div className="space-y-1">
                      <span className="text-gray-600">Date de création entreprise</span>
                      <p className="font-medium">
                        {new Date(clientData.dateCreation).toLocaleDateString('fr-FR')}
                      </p>
                    </div>
                  </>
                )}

                {clientData.apporteur_id && (
                  <>
                    <Separator />
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-blue-600" />
                      <span className="text-gray-600">Recommandé par un apporteur</span>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Zone de danger */}
            <Card className="border-red-200 bg-red-50/50">
              <CardHeader>
                <CardTitle className="text-lg text-red-700">Zone de danger</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-4">
                  La suppression de votre compte est irréversible. Toutes vos données seront définitivement supprimées.
                </p>
                <Button 
                  variant="destructive"
                  className="w-full"
                  onClick={() => {
                    if (window.confirm('Êtes-vous sûr de vouloir supprimer votre compte ? Cette action est irréversible.')) {
                      toast.error('Fonctionnalité en développement - Contactez le support');
                    }
                  }}
                >
                  Supprimer mon compte
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Modal changement de mot de passe */}
      {showPasswordModal && (
        <ChangePasswordModal 
          onSuccess={() => {
            setShowPasswordModal(false);
            toast.success('Mot de passe changé avec succès !');
          }}
          onCancel={() => setShowPasswordModal(false)}
          userName={clientData.username}
        />
      )}
    </div>
  );
};

export default Settings;
