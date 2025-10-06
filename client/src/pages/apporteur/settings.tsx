import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Input } from '../../components/ui/input';
import { Settings, User, Bell, Shield, Save, Edit, Eye, EyeOff, Download, Upload, Trash2 } from 'lucide-react';

/**
 * Page Paramètres
 * Configuration du compte et préférences
 */
export default function SettingsPage() {
  const router = useRouter();
  const { apporteurId } = router.query;
  const [settings, setSettings] = useState<any>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const defaultSettings = {
    profile: {
      fullName: '',
      email: '',
      phone: '',
      company: ''
    },
    notifications: {
      newProspects: false,
      confirmedMeetings: false,
      paidCommissions: false,
      followUpReminders: false,
      availableTrainings: false,
      reminderFrequency: 'daily'
    },
    account: {
      status: 'inactive',
      registrationDate: '',
      lastLogin: '',
      accessLevel: 'Apporteur d\'Affaires'
    }
  };

  useEffect(() => {
    const loadSettings = async () => {
      if (!apporteurId || typeof apporteurId !== 'string') return;
      
      try {
        // Ici on pourrait charger les paramètres depuis l'API
        setSettings(defaultSettings);
      } catch (err) {
        console.error('Erreur lors du chargement des paramètres:', err);
        setSettings(defaultSettings);
      }
    };

    loadSettings();
  }, [apporteurId]);

  if (!apporteurId || typeof apporteurId !== 'string') {
    return (
      <div className="container mx-auto py-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">ID Apporteur Requis</h2>
            <p className="text-gray-600">Veuillez vous connecter pour accéder aux paramètres.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-slate-100">
      <div className="container mx-auto py-6">
        {/* Header Optimisé */}
        <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center mb-8">
          <div className="mb-6 lg:mb-0">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Paramètres</h1>
            <p className="text-gray-600 text-lg">Configurez votre compte et vos préférences</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button variant="outline" className="bg-white hover:bg-gray-50">
              <Download className="h-4 w-4 mr-2" />
              Exporter
            </Button>
            <Button variant="outline" className="bg-white hover:bg-gray-50">
              <Upload className="h-4 w-4 mr-2" />
              Importer
            </Button>
            <Button className="bg-blue-600 hover:bg-blue-700 text-white">
              <Save className="h-4 w-4 mr-2" />
              Sauvegarder
            </Button>
          </div>
        </div>

        {/* Sections Paramètres Optimisées */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Paramètres Profil */}
          <Card className="bg-white shadow-lg border-0">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-3 text-xl">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <User className="h-6 w-6 text-blue-600" />
                </div>
                Informations Personnelles
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nom complet
                </label>
                <Input
                  type="text"
                  defaultValue={settings?.profile?.fullName || "Béranger Keita"}
                  className="w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <Input
                  type="email"
                  defaultValue={settings?.profile?.email || "conseilprofitum@gmail.com"}
                  className="w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Téléphone
                </label>
                <Input
                  type="tel"
                  defaultValue={settings?.profile?.phone || "+33 1 23 45 67 89"}
                  className="w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Entreprise
                </label>
                <Input
                  type="text"
                  defaultValue={settings?.profile?.company || "Profitum Conseil"}
                  className="w-full"
                />
              </div>
              <Button variant="outline" className="w-full hover:bg-blue-50">
                <Edit className="h-4 w-4 mr-2" />
                Modifier les informations
              </Button>
            </CardContent>
          </Card>

          {/* Paramètres Sécurité */}
          <Card className="bg-white shadow-lg border-0">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-3 text-xl">
                <div className="p-2 bg-red-100 rounded-lg">
                  <Shield className="h-6 w-6 text-red-600" />
                </div>
                Sécurité
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Mot de passe actuel
                </label>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    className="w-full pr-10"
                  />
                  <button 
                    className="absolute right-3 top-2.5"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4 text-gray-400" /> : <Eye className="h-4 w-4 text-gray-400" />}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nouveau mot de passe
                </label>
                <div className="relative">
                  <Input
                    type={showNewPassword ? "text" : "password"}
                    className="w-full pr-10"
                  />
                  <button 
                    className="absolute right-3 top-2.5"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                  >
                    {showNewPassword ? <EyeOff className="h-4 w-4 text-gray-400" /> : <Eye className="h-4 w-4 text-gray-400" />}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Confirmer le mot de passe
                </label>
                <div className="relative">
                  <Input
                    type={showConfirmPassword ? "text" : "password"}
                    className="w-full pr-10"
                  />
                  <button 
                    className="absolute right-3 top-2.5"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4 text-gray-400" /> : <Eye className="h-4 w-4 text-gray-400" />}
                  </button>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <input type="checkbox" id="2fa" className="rounded" />
                <label htmlFor="2fa" className="text-sm text-gray-700">
                  Activer l'authentification à deux facteurs
                </label>
              </div>
              <Button variant="outline" className="w-full hover:bg-red-50">
                <Shield className="h-4 w-4 mr-2" />
                Mettre à jour la sécurité
              </Button>
            </CardContent>
          </Card>

          {/* Paramètres Notifications */}
          <Card className="bg-white shadow-lg border-0">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-3 text-xl">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <Bell className="h-6 w-6 text-orange-600" />
                </div>
                Notifications
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                  <span className="text-sm font-medium text-gray-700">Nouveaux prospects</span>
                  <input type="checkbox" defaultChecked className="rounded" />
                </div>
                <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                  <span className="text-sm font-medium text-gray-700">Rendez-vous confirmés</span>
                  <input type="checkbox" defaultChecked className="rounded" />
                </div>
                <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                  <span className="text-sm font-medium text-gray-700">Commissions payées</span>
                  <input type="checkbox" defaultChecked className="rounded" />
                </div>
                <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                  <span className="text-sm font-medium text-gray-700">Rappels de suivi</span>
                  <input type="checkbox" className="rounded" />
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm font-medium text-gray-700">Formations disponibles</span>
                  <input type="checkbox" className="rounded" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fréquence des rappels
                </label>
                <select className="w-full border border-gray-300 rounded-lg px-3 py-2">
                  <option>Quotidien</option>
                  <option>Hebdomadaire</option>
                  <option>Mensuel</option>
                </select>
              </div>
              <Button variant="outline" className="w-full hover:bg-orange-50">
                <Bell className="h-4 w-4 mr-2" />
                Sauvegarder les préférences
              </Button>
            </CardContent>
          </Card>

          {/* Statut du Compte */}
          <Card className="bg-white shadow-lg border-0">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-3 text-xl">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Settings className="h-6 w-6 text-green-600" />
                </div>
                Statut du Compte
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                <span className="text-sm font-medium text-gray-700">Statut du compte</span>
                <Badge className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-semibold">Actif</Badge>
              </div>
              <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                <span className="text-sm font-medium text-gray-700">Date d'inscription</span>
                <span className="text-sm text-gray-600">{settings?.account?.registrationDate || "15 Janvier 2024"}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                <span className="text-sm font-medium text-gray-700">Dernière connexion</span>
                <span className="text-sm text-gray-600">{settings?.account?.lastLogin || "Aujourd'hui 14:30"}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                <span className="text-sm font-medium text-gray-700">Niveau d'accès</span>
                <Badge className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-semibold">
                  {settings?.account?.accessLevel || "Apporteur d'Affaires"}
                </Badge>
              </div>
              <div className="pt-4 border-t">
                <Button variant="outline" className="w-full text-red-600 border-red-300 hover:bg-red-50">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Désactiver le compte
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
