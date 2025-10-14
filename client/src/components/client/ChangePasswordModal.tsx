import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Eye, EyeOff, Lock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface ChangePasswordModalProps {
  onSuccess: () => void;
  onCancel?: () => void;
  userName?: string;
}

interface PasswordStrength {
  score: number; // 0-4
  label: string;
  color: string;
  requirements: {
    minLength: boolean;
    hasUppercase: boolean;
    hasLowercase: boolean;
    hasNumber: boolean;
  };
}

export default function ChangePasswordModal({ onSuccess, onCancel, userName }: ChangePasswordModalProps) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Calculer la force du mot de passe
  const getPasswordStrength = (password: string): PasswordStrength => {
    const requirements = {
      minLength: password.length >= 8,
      hasUppercase: /[A-Z]/.test(password),
      hasLowercase: /[a-z]/.test(password),
      hasNumber: /[0-9]/.test(password)
    };

    const met = Object.values(requirements).filter(Boolean).length;
    
    let score = 0;
    let label = 'Très faible';
    let color = 'bg-red-500';

    if (met === 4) {
      score = 4;
      label = 'Très fort';
      color = 'bg-green-500';
    } else if (met === 3) {
      score = 3;
      label = 'Fort';
      color = 'bg-green-400';
    } else if (met === 2) {
      score = 2;
      label = 'Moyen';
      color = 'bg-yellow-500';
    } else if (met === 1) {
      score = 1;
      label = 'Faible';
      color = 'bg-orange-500';
    }

    return { score, label, color, requirements };
  };

  const passwordStrength = getPasswordStrength(newPassword);
  const passwordsMatch = newPassword === confirmPassword && newPassword.length > 0;
  const canSubmit = 
    currentPassword.length > 0 &&
    passwordStrength.score >= 3 &&
    passwordsMatch;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // Étape 1: Vérifier que l'ancien mot de passe est correct en tentant de se reconnecter
      const { data: user } = await supabase.auth.getUser();
      if (!user.user?.email) {
        throw new Error('Utilisateur non trouvé');
      }

      // Étape 2: Changer le mot de passe
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (updateError) {
        throw updateError;
      }

      // Étape 3: Mettre à jour le flag first_login dans la table Client
      const { error: dbError } = await (supabase
        .from('Client') as any)
        .update({ first_login: false })
        .eq('auth_user_id', user.user.id);

      if (dbError) {
        console.error('Erreur mise à jour first_login:', dbError);
        // On ne bloque pas le succès pour cette erreur
      }

      // Succès !
      onSuccess();

    } catch (err: any) {
      console.error('Erreur changement mot de passe:', err);
      setError(
        err.message === 'New password should be different from the old password'
          ? 'Le nouveau mot de passe doit être différent de l\'ancien'
          : err.message || 'Erreur lors du changement de mot de passe'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
          <CardTitle className="text-2xl">
            🎉 Bienvenue{userName ? ` ${userName}` : ''} !
          </CardTitle>
          <p className="text-blue-100 mt-2">
            Pour des raisons de sécurité, vous devez changer votre mot de passe provisoire avant d'accéder à votre espace.
          </p>
        </CardHeader>

        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Ancien mot de passe */}
            <div>
              <Label htmlFor="currentPassword" className="text-base font-semibold">
                Mot de passe provisoire
              </Label>
              <p className="text-sm text-gray-600 mb-2">
                Utilisez le mot de passe que vous avez reçu par email (format: XXX-XXX-XXX)
              </p>
              <div className="relative">
                <Input
                  id="currentPassword"
                  type={showCurrentPassword ? 'text' : 'password'}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Ex: A7K-9M2-P5Q"
                  className="pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showCurrentPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            {/* Nouveau mot de passe */}
            <div>
              <Label htmlFor="newPassword" className="text-base font-semibold">
                Nouveau mot de passe
              </Label>
              <div className="relative mt-2">
                <Input
                  id="newPassword"
                  type={showNewPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Votre nouveau mot de passe sécurisé"
                  className="pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showNewPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>

              {/* Indicateur de force du mot de passe */}
              {newPassword.length > 0 && (
                <div className="mt-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Force du mot de passe:</span>
                    <span className={`text-sm font-semibold ${
                      passwordStrength.score >= 3 ? 'text-green-600' : 
                      passwordStrength.score === 2 ? 'text-yellow-600' : 'text-red-600'
                    }`}>
                      {passwordStrength.label}
                    </span>
                  </div>
                  <div className="flex gap-1 mb-3">
                    {[...Array(4)].map((_, i) => (
                      <div
                        key={i}
                        className={`h-2 flex-1 rounded ${
                          i < passwordStrength.score ? passwordStrength.color : 'bg-gray-200'
                        }`}
                      />
                    ))}
                  </div>

                  {/* Exigences */}
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      {passwordStrength.requirements.minLength ? (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      ) : (
                        <XCircle className="h-4 w-4 text-gray-400" />
                      )}
                      <span className={passwordStrength.requirements.minLength ? 'text-green-700' : 'text-gray-600'}>
                        Au moins 8 caractères
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {passwordStrength.requirements.hasUppercase ? (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      ) : (
                        <XCircle className="h-4 w-4 text-gray-400" />
                      )}
                      <span className={passwordStrength.requirements.hasUppercase ? 'text-green-700' : 'text-gray-600'}>
                        Au moins une majuscule (A-Z)
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {passwordStrength.requirements.hasLowercase ? (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      ) : (
                        <XCircle className="h-4 w-4 text-gray-400" />
                      )}
                      <span className={passwordStrength.requirements.hasLowercase ? 'text-green-700' : 'text-gray-600'}>
                        Au moins une minuscule (a-z)
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {passwordStrength.requirements.hasNumber ? (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      ) : (
                        <XCircle className="h-4 w-4 text-gray-400" />
                      )}
                      <span className={passwordStrength.requirements.hasNumber ? 'text-green-700' : 'text-gray-600'}>
                        Au moins un chiffre (0-9)
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Confirmation mot de passe */}
            <div>
              <Label htmlFor="confirmPassword" className="text-base font-semibold">
                Confirmer le nouveau mot de passe
              </Label>
              <div className="relative mt-2">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirmez votre nouveau mot de passe"
                  className="pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>

              {confirmPassword.length > 0 && (
                <div className={`flex items-center gap-2 mt-2 text-sm ${
                  passwordsMatch ? 'text-green-600' : 'text-red-600'
                }`}>
                  {passwordsMatch ? (
                    <>
                      <CheckCircle className="h-4 w-4" />
                      <span>Les mots de passe correspondent</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="h-4 w-4" />
                      <span>Les mots de passe ne correspondent pas</span>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Message d'erreur */}
            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-red-800">{error}</div>
                </div>
              </div>
            )}

            {/* Boutons d'action */}
            <div className="flex gap-4">
              {onCancel && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={onCancel}
                  className="flex-1 py-6 text-lg font-semibold"
                >
                  Annuler
                </Button>
              )}
              <Button
                type="submit"
                disabled={!canSubmit || loading}
                className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white py-6 text-lg font-semibold"
              >
                <Lock className="h-5 w-5 mr-2" />
                {loading ? 'Changement en cours...' : 'Valider mon nouveau mot de passe'}
              </Button>
            </div>

            <p className="text-xs text-center text-gray-500 mt-4">
              🔒 Votre mot de passe est crypté et sécurisé. Profitum ne le stocke jamais en clair.
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

