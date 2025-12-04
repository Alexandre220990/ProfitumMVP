import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Eye, EyeOff, Lock, CheckCircle, AlertCircle, ArrowLeft, User, Mail, Loader2, Bell, Smartphone } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { toast } from 'sonner';
import { config } from '@/config/env';
import { getSupabaseToken } from '@/lib/auth-helpers';
import { NotificationPreferencesPanel } from '@/components/notifications/NotificationPreferencesPanel';
import { InstallPWAButton } from '@/components/pwa/InstallPWAButton';
import { InstallPWAAdminButton } from '@/components/pwa/InstallPWAAdminButton';

export default function AdminProfil() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [sendingReport, setSendingReport] = useState(false);
  const [sendingMorningReport, setSendingMorningReport] = useState(false);

  const validatePassword = (password: string): { valid: boolean; message?: string } => {
    if (password.length < 8) {
      return { valid: false, message: 'Le mot de passe doit contenir au moins 8 caractères' };
    }
    if (!/[A-Z]/.test(password)) {
      return { valid: false, message: 'Le mot de passe doit contenir au moins une majuscule' };
    }
    if (!/[a-z]/.test(password)) {
      return { valid: false, message: 'Le mot de passe doit contenir au moins une minuscule' };
    }
    if (!/[0-9]/.test(password)) {
      return { valid: false, message: 'Le mot de passe doit contenir au moins un chiffre' };
    }
    return { valid: true };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    // Validation
    if (!currentPassword || !newPassword || !confirmPassword) {
      setError('Tous les champs sont requis');
      return;
    }

    const passwordValidation = validatePassword(newPassword);
    if (!passwordValidation.valid) {
      setError(passwordValidation.message || 'Le mot de passe ne respecte pas les critères');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Les nouveaux mots de passe ne correspondent pas');
      return;
    }

    if (currentPassword === newPassword) {
      setError('Le nouveau mot de passe doit être différent de l\'ancien');
      return;
    }

    setLoading(true);

    try {
      const token = await getSupabaseToken();
      if (!token) {
        throw new Error('Vous devez être connecté');
      }

      const response = await fetch(`${config.API_URL}/api/admin/profile/password`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          currentPassword,
          newPassword,
          confirmPassword
        })
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || 'Erreur lors du changement de mot de passe');
      }

      setSuccess(true);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      
      toast.success('Mot de passe modifié avec succès', {
        description: 'Votre mot de passe a été mis à jour. Vous restez connecté.'
      });

      // Réinitialiser après 3 secondes
      setTimeout(() => {
        setSuccess(false);
      }, 3000);

    } catch (err: any) {
      console.error('Erreur changement mot de passe:', err);
      setError(err.message || 'Erreur lors du changement de mot de passe');
      toast.error('Erreur', {
        description: err.message || 'Une erreur est survenue'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSendDailyReport = async () => {
    setSendingReport(true);
    setError(null);

    try {
      const token = await getSupabaseToken();
      if (!token) {
        throw new Error('Vous devez être connecté');
      }

      const response = await fetch(`${config.API_URL}/api/admin/reports/daily-activity`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || 'Erreur lors de l\'envoi du rapport');
      }

      toast.success('Rapport envoyé avec succès', {
        description: `Le rapport d'activité quotidien a été envoyé à ${result.sentTo || 'votre adresse email'}`
      });

    } catch (err: any) {
      console.error('Erreur envoi rapport:', err);
      setError(err.message || 'Erreur lors de l\'envoi du rapport');
      toast.error('Erreur', {
        description: err.message || 'Une erreur est survenue lors de l\'envoi du rapport'
      });
    } finally {
      setSendingReport(false);
    }
  };

  const handleSendMorningReport = async () => {
    setSendingMorningReport(true);
    setError(null);

    try {
      const token = await getSupabaseToken();
      if (!token) {
        throw new Error('Vous devez être connecté');
      }

      const response = await fetch(`${config.API_URL}/api/admin/reports/morning`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || 'Erreur lors de l\'envoi du rapport matinal');
      }

      toast.success('Rapport matinal envoyé avec succès', {
        description: `Le rapport matinal a été envoyé à ${result.sentTo || 'votre adresse email'}`
      });

    } catch (err: any) {
      console.error('Erreur envoi rapport matinal:', err);
      setError(err.message || 'Erreur lors de l\'envoi du rapport matinal');
      toast.error('Erreur', {
        description: err.message || 'Une erreur est survenue lors de l\'envoi du rapport matinal'
      });
    } finally {
      setSendingMorningReport(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-red-50">
      <div className="container mx-auto px-6 py-6">
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate('/admin/dashboard-optimized')}
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Retour au dashboard
        </Button>

        <div className="max-w-2xl mx-auto">
          <Card className="bg-white shadow-lg">
            <CardHeader className="border-b bg-gray-50">
              <CardTitle className="text-xl font-semibold text-gray-900 flex items-center">
                <User className="w-6 h-6 mr-3 text-blue-600" />
                Mon profil administrateur
              </CardTitle>
            </CardHeader>

            <CardContent className="p-6">
              {/* Section Application mobile */}
              <div className="mb-6 pb-6 border-b">
                <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center">
                  <Smartphone className="w-4 h-4 mr-2 text-blue-600" />
                  Application mobile
                </h3>
                
                {/* Bouton pour installer l'app ADMIN (redirige vers /connect-admin) */}
                <div className="mb-4">
                  <InstallPWAAdminButton />
                </div>
                
                {/* Séparateur */}
                <div className="relative my-4">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-gray-200"></span>
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-white px-2 text-gray-500">Ou</span>
                  </div>
                </div>
                
                {/* Bouton pour installer l'app standard (pour client/expert/apporteur) */}
                <div>
                  <p className="text-xs text-gray-600 mb-2 text-center">
                    Installer l'app standard pour accéder en tant que client/expert/apporteur
                  </p>
                  <InstallPWAButton />
                </div>
              </div>

              <Tabs defaultValue="info" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="info">
                    <User className="w-4 h-4 mr-2" />
                    Informations
                  </TabsTrigger>
                  <TabsTrigger value="password">
                    <Lock className="w-4 h-4 mr-2" />
                    Mot de passe
                  </TabsTrigger>
                  <TabsTrigger value="notifications">
                    <Bell className="w-4 h-4 mr-2" />
                    Notifications
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="info" className="mt-6">
                  {/* Informations utilisateur */}
                  <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <h3 className="font-semibold text-gray-900 mb-2">Informations du compte</h3>
                    <div className="space-y-1 text-sm">
                      <p><span className="font-medium">Nom :</span> {user?.first_name} {user?.last_name}</p>
                      <p><span className="font-medium">Email :</span> {user?.email}</p>
                      <p><span className="font-medium">Rôle :</span> Administrateur</p>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="password" className="mt-6">

                  {/* Formulaire changement mot de passe */}
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                        <Lock className="w-5 h-5 mr-2 text-blue-600" />
                        Changer mon mot de passe
                      </h3>
                    </div>

                {error && (
                  <Alert variant="destructive">
                    <AlertCircle className="w-4 h-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                {success && (
                  <Alert className="bg-green-50 border-green-200">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <AlertDescription className="text-green-800">
                      Mot de passe modifié avec succès ! Vous restez connecté.
                    </AlertDescription>
                  </Alert>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Ancien mot de passe */}
                  <div className="space-y-2">
                    <Label htmlFor="currentPassword">Ancien mot de passe *</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
                      <Input
                        id="currentPassword"
                        type={showCurrentPassword ? 'text' : 'password'}
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        placeholder="Entrez votre mot de passe actuel"
                        className="pl-10 pr-10"
                        required
                        disabled={loading}
                      />
                      <button
                        type="button"
                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                        className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                      >
                        {showCurrentPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>

                  {/* Nouveau mot de passe */}
                  <div className="space-y-2">
                    <Label htmlFor="newPassword">Nouveau mot de passe *</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
                      <Input
                        id="newPassword"
                        type={showNewPassword ? 'text' : 'password'}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Minimum 8 caractères, majuscule, minuscule, chiffre"
                        className="pl-10 pr-10"
                        required
                        minLength={8}
                        disabled={loading}
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                      >
                        {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                    {newPassword && (
                      <p className="text-xs text-gray-500">
                        {validatePassword(newPassword).valid ? (
                          <span className="text-green-600">✓ Mot de passe valide</span>
                        ) : (
                          <span className="text-red-600">{validatePassword(newPassword).message}</span>
                        )}
                      </p>
                    )}
                  </div>

                  {/* Confirmation mot de passe */}
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirmer le nouveau mot de passe *</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
                      <Input
                        id="confirmPassword"
                        type={showConfirmPassword ? 'text' : 'password'}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Répétez le nouveau mot de passe"
                        className="pl-10 pr-10"
                        required
                        disabled={loading}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                      >
                        {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                    {confirmPassword && (
                      <p className="text-xs text-gray-500">
                        {newPassword === confirmPassword ? (
                          <span className="text-green-600">✓ Les mots de passe correspondent</span>
                        ) : (
                          <span className="text-red-600">✗ Les mots de passe ne correspondent pas</span>
                        )}
                      </p>
                    )}
                  </div>

                  <div className="pt-4 border-t">
                    <Button
                      type="submit"
                      disabled={loading || !currentPassword || !newPassword || !confirmPassword}
                      className="w-full bg-blue-600 hover:bg-blue-700"
                    >
                      {loading ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                          Modification en cours...
                        </>
                      ) : (
                        <>
                          <Lock className="w-4 h-4 mr-2" />
                          Modifier le mot de passe
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </div>
                </TabsContent>

                <TabsContent value="notifications" className="mt-6">
                  <NotificationPreferencesPanel />
                </TabsContent>
              </Tabs>

              {/* Section Rapport Matinal */}
              <div className="mt-8 pt-8 border-t">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <Mail className="w-5 h-5 mr-2 text-amber-600" />
                    🌅 Rapport Matinal
                  </h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Envoyer le rapport matinal par email. Ce rapport inclut :
                  </p>
                  <ul className="text-sm text-gray-600 mb-6 space-y-1 list-disc list-inside">
                    <li>RDV du jour avec détails complets</li>
                    <li>Notifications urgentes non lues (high/urgent, dernières 24h)</li>
                    <li>RDV en retard nécessitant une action</li>
                    <li>Actions en attente (critical et high)</li>
                    <li>Contacts/Leads urgents (48h et 120h)</li>
                    <li>Notifications escaladées</li>
                  </ul>
                  <p className="text-xs text-gray-500 mb-4">
                    Note : L'envoi manuel n'affecte pas l'envoi automatique quotidien à 7h.
                  </p>

                  {error && (
                    <Alert variant="destructive" className="mb-4">
                      <AlertCircle className="w-4 h-4" />
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}

                  <Button
                    onClick={handleSendMorningReport}
                    disabled={sendingMorningReport}
                    className="w-full bg-amber-600 hover:bg-amber-700"
                  >
                    {sendingMorningReport ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Envoi en cours...
                      </>
                    ) : (
                      <>
                        <Mail className="w-4 h-4 mr-2" />
                        Envoyer le rapport matinal
                      </>
                    )}
                  </Button>
                </div>
              </div>

              {/* Section Rapport d'activité quotidien */}
              <div className="mt-8 pt-8 border-t">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <Mail className="w-5 h-5 mr-2 text-blue-600" />
                    Rapport d'activité quotidien
                  </h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Envoyer le rapport d'activité quotidien par email. Ce rapport inclut :
                  </p>
                  <ul className="text-sm text-gray-600 mb-6 space-y-1 list-disc list-inside">
                    <li>Récap des RDV de la journée de tous les experts</li>
                    <li>Récap des notifications marquées comme archivées de la journée</li>
                    <li>Récap des RDV du lendemain</li>
                  </ul>
                  <p className="text-xs text-gray-500 mb-4">
                    Note : L'envoi manuel n'affecte pas l'envoi automatique quotidien à 20h.
                  </p>

                  {error && (
                    <Alert variant="destructive" className="mb-4">
                      <AlertCircle className="w-4 h-4" />
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}

                  <Button
                    onClick={handleSendDailyReport}
                    disabled={sendingReport}
                    className="w-full bg-blue-600 hover:bg-blue-700"
                  >
                    {sendingReport ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Envoi en cours...
                      </>
                    ) : (
                      <>
                        <Mail className="w-4 h-4 mr-2" />
                        Envoyer le rapport quotidien
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

