import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Input } from '../../components/ui/input';
import { Settings, User, Bell, Shield, Save, Edit, Eye, EyeOff, Download, Upload, Trash2 } from 'lucide-react';
import { useAuth } from '../../hooks/use-auth';
import { getSupabaseToken } from '../../lib/auth-helpers';
import { toast } from 'sonner';
import { config } from '../../config';
import { useNavigate } from 'react-router-dom';

/**
 * Page Paramètres
 * Configuration du compte et préférences
 */
export default function SettingsPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const apporteurId = user?.database_id;
  const [settings, setSettings] = useState<any>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // États pour les formulaires
  const [profileData, setProfileData] = useState({
    fullName: '',
    phone: '',
    company: ''
  });
  
  const [securityData, setSecurityData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
    enable2FA: false
  });
  
  const [notificationPrefs, setNotificationPrefs] = useState({
    newProspects: true,
    confirmedMeetings: true,
    paidCommissions: true,
    followUpReminders: false,
    availableTrainings: false,
    reminderFrequency: 'daily'
  });

  useEffect(() => {
    const loadSettings = async () => {
      if (!apporteurId || !user) {
        setLoading(false);
        return;
      }
      
      try {
        console.log('🔍 Chargement profil apporteur depuis la base de données...');
        
        // Charger le profil complet depuis l'API
        const response = await fetch(`${config.API_URL}/api/apporteur/profile`, {
          headers: {
            'Authorization': `Bearer ${await getSupabaseToken()}`
          }
        });

        if (!response.ok) {
          throw new Error('Erreur lors du chargement du profil');
        }

        const result = await response.json();
        
        if (result.success && result.data) {
          const apporteurData = result.data;
          
          console.log('✅ Profil chargé:', apporteurData);
          
          // Extraire les préférences de notifications ou utiliser les valeurs par défaut
          const notifPrefs = apporteurData.notification_preferences || {
            newProspects: true,
            confirmedMeetings: true,
            paidCommissions: true,
            followUpReminders: false,
            availableTrainings: false,
            reminderFrequency: 'daily'
          };
          
          const loadedSettings = {
            profile: {
              fullName: `${apporteurData.first_name || ''} ${apporteurData.last_name || ''}`.trim(),
              email: apporteurData.email || '',
              phone: apporteurData.phone || '',
              company: apporteurData.company_name || '',
              companyType: apporteurData.company_type || '',
              siren: apporteurData.siren || '',
              sector: apporteurData.sector || ''
            },
            notifications: notifPrefs,
          account: {
              status: apporteurData.status || 'active',
              isActive: apporteurData.is_active !== undefined ? apporteurData.is_active : true,
              registrationDate: apporteurData.created_at ? new Date(apporteurData.created_at).toLocaleDateString('fr-FR') : '',
              lastLogin: apporteurData.updated_at ? new Date(apporteurData.updated_at).toLocaleString('fr-FR') : 'Maintenant',
              accessLevel: 'Apporteur d\'Affaires',
              commissionRate: apporteurData.commission_rate || 0,
              approvedAt: apporteurData.approved_at ? new Date(apporteurData.approved_at).toLocaleDateString('fr-FR') : null
            }
          };
          
          // Initialiser les états
          setSettings(loadedSettings);
          setProfileData({
            fullName: loadedSettings.profile.fullName,
            phone: loadedSettings.profile.phone,
            company: loadedSettings.profile.company
          });
          setNotificationPrefs(loadedSettings.notifications);
        }
      } catch (err) {
        console.error('❌ Erreur lors du chargement des paramètres:', err);
        toast.error('Erreur lors du chargement de vos paramètres');
      } finally {
        setLoading(false);
      }
    };

    loadSettings();
  }, [apporteurId, user]);

  // ===== HANDLERS =====
  
  // Sauvegarder le profil
  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      // Séparer first_name et last_name du fullName
      const [firstName, ...lastNameParts] = profileData.fullName.split(' ');
      const lastName = lastNameParts.join(' ');
      
      const response = await fetch(`${config.API_URL}/api/apporteur/profile`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          first_name: firstName,
          last_name: lastName,
          phone: profileData.phone,
          company_name: profileData.company
        })
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la mise à jour du profil');
      }

      await response.json();
      
      toast.success('✅ Profil mis à jour avec succès !');
      
      // Mettre à jour les settings localement
      setSettings((prev: any) => ({
        ...prev,
        profile: {
          ...prev.profile,
          ...profileData
        }
      }));
    } catch (error) {
      console.error('Erreur sauvegarde profil:', error);
      toast.error('❌ Erreur lors de la mise à jour du profil');
    } finally {
      setSaving(false);
    }
  };

  // Mettre à jour la sécurité
  const handleUpdateSecurity = async () => {
    if (!securityData.currentPassword || !securityData.newPassword) {
      toast.error('❌ Veuillez remplir tous les champs');
      return;
    }

    if (securityData.newPassword !== securityData.confirmPassword) {
      toast.error('❌ Les mots de passe ne correspondent pas');
      return;
    }

    if (securityData.newPassword.length < 8) {
      toast.error('❌ Le mot de passe doit contenir au moins 8 caractères');
      return;
    }

    setSaving(true);
    try {
      const response = await fetch(`${config.API_URL}/api/auth/change-password`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          currentPassword: securityData.currentPassword,
          newPassword: securityData.newPassword
        })
      });

      if (!response.ok) {
        throw new Error('Erreur lors du changement de mot de passe');
      }

      toast.success('✅ Mot de passe mis à jour avec succès !');
      
      // Réinitialiser les champs
      setSecurityData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
        enable2FA: securityData.enable2FA
      });
    } catch (error) {
      console.error('Erreur changement mot de passe:', error);
      toast.error('❌ Erreur lors du changement de mot de passe');
    } finally {
      setSaving(false);
    }
  };

  // Sauvegarder les préférences de notification
  const handleSaveNotifications = async () => {
    setSaving(true);
    try {
      const response = await fetch(`${config.API_URL}/api/apporteur/notifications`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(notificationPrefs)
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la sauvegarde des préférences');
      }

      await response.json();
      
      toast.success('✅ Préférences de notification sauvegardées !');
      
      // Mettre à jour les settings localement
      setSettings((prev: any) => ({
        ...prev,
        notifications: notificationPrefs
      }));
    } catch (error) {
      console.error('Erreur sauvegarde notifications:', error);
      toast.error('❌ Erreur lors de la sauvegarde des préférences');
    } finally {
      setSaving(false);
    }
  };

  // Sauvegarder tous les paramètres
  const handleSaveAll = async () => {
    setSaving(true);
    try {
      await Promise.all([
        handleSaveProfile(),
        handleSaveNotifications()
      ]);
      toast.success('✅ Tous les paramètres ont été sauvegardés !');
    } catch (error) {
      console.error('Erreur sauvegarde globale:', error);
      toast.error('❌ Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  // Exporter les données
  const handleExport = () => {
    try {
      const exportData = {
        profile: profileData,
        notifications: notificationPrefs,
        exportDate: new Date().toISOString()
      };

      const dataStr = JSON.stringify(exportData, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `profitum-settings-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success('✅ Paramètres exportés avec succès !');
    } catch (error) {
      console.error('Erreur export:', error);
      toast.error('❌ Erreur lors de l\'export');
    }
  };

  // Importer les données
  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e: any) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const importedData = JSON.parse(event.target?.result as string);
          
          if (importedData.profile) {
            setProfileData(importedData.profile);
          }
          if (importedData.notifications) {
            setNotificationPrefs(importedData.notifications);
          }

          toast.success('✅ Paramètres importés avec succès !');
        } catch (error) {
          console.error('Erreur import:', error);
          toast.error('❌ Fichier invalide');
        }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  // Désactiver le compte
  const handleDeactivateAccount = async () => {
    if (!window.confirm('⚠️ Êtes-vous sûr de vouloir désactiver votre compte ? Cette action est réversible.')) {
      return;
    }

    const confirmation = window.prompt('Tapez "DESACTIVER" pour confirmer');
    if (confirmation !== 'DESACTIVER') {
      toast.error('❌ Confirmation invalide');
      return;
    }

    setSaving(true);
    try {
      const response = await fetch(`${config.API_URL}/api/apporteur/deactivate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          confirmation: 'DESACTIVER'
        })
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la désactivation du compte');
      }

      await response.json();
      
      toast.success('✅ Compte désactivé. Vous allez être déconnecté...');
      
      setTimeout(() => {
        logout();
        navigate('/');
      }, 2000);
    } catch (error) {
      console.error('Erreur désactivation:', error);
      toast.error('❌ Erreur lors de la désactivation du compte');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement des paramètres...</p>
        </div>
      </div>
    );
  }

  if (!user || user.type !== 'apporteur') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Accès Refusé</h2>
          <p className="text-gray-600">Veuillez vous connecter en tant qu'apporteur d'affaires.</p>
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
            <Button 
              variant="outline" 
              className="bg-white hover:bg-gray-50"
              onClick={handleExport}
              disabled={saving}
            >
              <Download className="h-4 w-4 mr-2" />
              Exporter
            </Button>
            <Button 
              variant="outline" 
              className="bg-white hover:bg-gray-50"
              onClick={handleImport}
              disabled={saving}
            >
              <Upload className="h-4 w-4 mr-2" />
              Importer
            </Button>
            <Button 
              className="bg-blue-600 hover:bg-blue-700 text-white"
              onClick={handleSaveAll}
              disabled={saving}
            >
              <Save className="h-4 w-4 mr-2" />
              {saving ? 'Sauvegarde...' : 'Sauvegarder'}
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
                  value={profileData.fullName}
                  onChange={(e) => setProfileData({...profileData, fullName: e.target.value})}
                  placeholder="Votre nom complet"
                  className="w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <Input
                  type="email"
                  defaultValue={settings?.profile?.email || user?.email || ""}
                  placeholder="votre@email.com"
                  className="w-full"
                  disabled
                />
                <p className="text-xs text-gray-500 mt-1">L'email ne peut pas être modifié</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Téléphone
                </label>
                <Input
                  type="tel"
                  value={profileData.phone}
                  onChange={(e) => setProfileData({...profileData, phone: e.target.value})}
                  placeholder="+33 X XX XX XX XX"
                  className="w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Entreprise
                </label>
                <Input
                  type="text"
                  value={profileData.company}
                  onChange={(e) => setProfileData({...profileData, company: e.target.value})}
                  placeholder="Nom de votre entreprise"
                  className="w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  SIREN
                </label>
                <Input
                  type="text"
                  value={settings?.profile?.siren || ''}
                  placeholder="123456789"
                  className="w-full"
                  disabled
                />
                <p className="text-xs text-gray-500 mt-1">Le SIREN ne peut pas être modifié</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Secteur d'activité
                </label>
                <Input
                  type="text"
                  value={settings?.profile?.sector || ''}
                  placeholder="Secteur d'activité"
                  className="w-full"
                  disabled
                />
                <p className="text-xs text-gray-500 mt-1">Le secteur ne peut pas être modifié</p>
              </div>
              <Button 
                variant="outline" 
                className="w-full hover:bg-blue-50"
                onClick={handleSaveProfile}
                disabled={saving}
              >
                <Edit className="h-4 w-4 mr-2" />
                {saving ? 'Sauvegarde...' : 'Modifier les informations'}
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
              <form onSubmit={(e) => { e.preventDefault(); handleUpdateSecurity(); }}>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Mot de passe actuel
                  </label>
                  <div className="relative">
                    <Input
                      type={showPassword ? "text" : "password"}
                      value={securityData.currentPassword}
                      onChange={(e) => setSecurityData({...securityData, currentPassword: e.target.value})}
                      className="w-full pr-10"
                      placeholder="Mot de passe actuel"
                      autoComplete="current-password"
                    />
                    <button 
                      type="button"
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
                      value={securityData.newPassword}
                      onChange={(e) => setSecurityData({...securityData, newPassword: e.target.value})}
                      className="w-full pr-10"
                      placeholder="Nouveau mot de passe (min. 8 caractères)"
                      autoComplete="new-password"
                    />
                    <button 
                      type="button"
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
                      value={securityData.confirmPassword}
                      onChange={(e) => setSecurityData({...securityData, confirmPassword: e.target.value})}
                      className="w-full pr-10"
                      placeholder="Confirmer le nouveau mot de passe"
                      autoComplete="new-password"
                    />
                    <button 
                      type="button"
                      className="absolute right-3 top-2.5"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? <EyeOff className="h-4 w-4 text-gray-400" /> : <Eye className="h-4 w-4 text-gray-400" />}
                    </button>
                  </div>
                </div>
              <div className="flex items-center space-x-3">
                <input 
                  type="checkbox" 
                  id="2fa" 
                  className="rounded"
                  checked={securityData.enable2FA}
                  onChange={(e) => setSecurityData({...securityData, enable2FA: e.target.checked})}
                />
                <label htmlFor="2fa" className="text-sm text-gray-700">
                  Activer l'authentification à deux facteurs
                </label>
              </div>
                <Button 
                  type="submit"
                  variant="outline" 
                  className="w-full hover:bg-red-50"
                  disabled={saving}
                >
                  <Shield className="h-4 w-4 mr-2" />
                  {saving ? 'Mise à jour...' : 'Mettre à jour la sécurité'}
                </Button>
              </form>
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
                  <input 
                    type="checkbox" 
                    className="rounded"
                    checked={notificationPrefs.newProspects}
                    onChange={(e) => setNotificationPrefs({...notificationPrefs, newProspects: e.target.checked})}
                  />
                </div>
                <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                  <span className="text-sm font-medium text-gray-700">Rendez-vous confirmés</span>
                  <input 
                    type="checkbox" 
                    className="rounded"
                    checked={notificationPrefs.confirmedMeetings}
                    onChange={(e) => setNotificationPrefs({...notificationPrefs, confirmedMeetings: e.target.checked})}
                  />
                </div>
                <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                  <span className="text-sm font-medium text-gray-700">Commissions payées</span>
                  <input 
                    type="checkbox" 
                    className="rounded"
                    checked={notificationPrefs.paidCommissions}
                    onChange={(e) => setNotificationPrefs({...notificationPrefs, paidCommissions: e.target.checked})}
                  />
                </div>
                <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                  <span className="text-sm font-medium text-gray-700">Rappels de suivi</span>
                  <input 
                    type="checkbox" 
                    className="rounded"
                    checked={notificationPrefs.followUpReminders}
                    onChange={(e) => setNotificationPrefs({...notificationPrefs, followUpReminders: e.target.checked})}
                  />
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm font-medium text-gray-700">Formations disponibles</span>
                  <input 
                    type="checkbox" 
                    className="rounded"
                    checked={notificationPrefs.availableTrainings}
                    onChange={(e) => setNotificationPrefs({...notificationPrefs, availableTrainings: e.target.checked})}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fréquence des rappels
                </label>
                <select 
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  value={notificationPrefs.reminderFrequency}
                  onChange={(e) => setNotificationPrefs({...notificationPrefs, reminderFrequency: e.target.value})}
                >
                  <option value="daily">Quotidien</option>
                  <option value="weekly">Hebdomadaire</option>
                  <option value="monthly">Mensuel</option>
                </select>
              </div>
              <Button 
                variant="outline" 
                className="w-full hover:bg-orange-50"
                onClick={handleSaveNotifications}
                disabled={saving}
              >
                <Bell className="h-4 w-4 mr-2" />
                {saving ? 'Sauvegarde...' : 'Sauvegarder les préférences'}
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
                <span className="text-sm text-gray-600">
                  {settings?.account?.registrationDate || (user?.created_at ? new Date(user.created_at).toLocaleDateString('fr-FR') : 'N/A')}
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                <span className="text-sm font-medium text-gray-700">Dernière activité</span>
                <span className="text-sm text-gray-600">
                  {settings?.account?.lastLogin || (user?.updated_at ? new Date(user.updated_at).toLocaleDateString('fr-FR') : 'Maintenant')}
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                <span className="text-sm font-medium text-gray-700">Niveau d'accès</span>
                <Badge className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-semibold">
                  {settings?.account?.accessLevel || "Apporteur d'Affaires"}
                </Badge>
              </div>
              <div className="pt-4 border-t">
                <Button 
                  variant="outline" 
                  className="w-full text-red-600 border-red-300 hover:bg-red-50"
                  onClick={handleDeactivateAccount}
                  disabled={saving}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  {saving ? 'Désactivation...' : 'Désactiver le compte'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
