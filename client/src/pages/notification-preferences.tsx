/**
 * ============================================================================
 * PAGE PRÉFÉRENCES NOTIFICATIONS
 * ============================================================================
 * 
 * Permet aux utilisateurs de configurer leurs préférences de notifications :
 * - Activer/Désactiver par canal (push, email, SMS)
 * - Activer/Désactiver par type de notification
 * - Heures silencieuses
 * - Fréquence des emails (immédiat, quotidien, hebdomadaire)
 * 
 * Date: 27 Octobre 2025
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { 
  Bell, 
  Mail, 
  Smartphone, 
  MessageSquare,
  Clock,
  Save,
  ArrowLeft,
  Moon,
  Calendar,
  FileText,
  Users,
  DollarSign,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { config } from '@/config/env';
import { getSupabaseToken } from '@/lib/auth-helpers';

interface NotificationPreferences {
  // Canaux
  push_enabled: boolean;
  email_enabled: boolean;
  sms_enabled: boolean;
  in_app_enabled: boolean;
  
  // Heures silencieuses
  quiet_hours_enabled: boolean;
  quiet_hours_start: string;
  quiet_hours_end: string;
  
  // Fréquence emails
  email_frequency: 'immediate' | 'daily' | 'weekly' | 'never';
  
  // Types de notifications (par canal)
  notification_types: {
    dossier_status: { push: boolean; email: boolean; sms: boolean };
    expert_message: { push: boolean; email: boolean; sms: boolean };
    document_request: { push: boolean; email: boolean; sms: boolean };
    rdv_reminder: { push: boolean; email: boolean; sms: boolean };
    payment: { push: boolean; email: boolean; sms: boolean };
    validation: { push: boolean; email: boolean; sms: boolean };
    commission: { push: boolean; email: boolean; sms: boolean };
    system: { push: boolean; email: boolean; sms: boolean };
  };
  
  // Métadonnées
  timezone: string;
  language: string;
}

const defaultPreferences: NotificationPreferences = {
  push_enabled: true,
  email_enabled: true,
  sms_enabled: false,
  in_app_enabled: true,
  quiet_hours_enabled: false,
  quiet_hours_start: '22:00',
  quiet_hours_end: '08:00',
  email_frequency: 'immediate',
  notification_types: {
    dossier_status: { push: true, email: true, sms: false },
    expert_message: { push: true, email: true, sms: false },
    document_request: { push: true, email: true, sms: false },
    rdv_reminder: { push: true, email: true, sms: true },
    payment: { push: true, email: true, sms: true },
    validation: { push: true, email: false, sms: false },
    commission: { push: true, email: true, sms: false },
    system: { push: false, email: false, sms: false }
  },
  timezone: 'Europe/Paris',
  language: 'fr'
};

export default function NotificationPreferencesPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [preferences, setPreferences] = useState<NotificationPreferences>(defaultPreferences);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Chargement des préférences
  useEffect(() => {
    loadPreferences();
  }, [user?.id]);

  const loadPreferences = async () => {
    try {
      const token = await getSupabaseToken();
      const response = await fetch(`${config.API_URL}/api/notifications/preferences`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data?.preferences) {
          setPreferences({ ...defaultPreferences, ...data.data.preferences });
        }
      }
    } catch (error) {
      console.error('Erreur chargement préférences:', error);
      toast.error('Erreur lors du chargement des préférences');
    } finally {
      setLoading(false);
    }
  };

  const savePreferences = async () => {
    try {
      setSaving(true);
      const token = await getSupabaseToken();
      
      const response = await fetch(`${config.API_URL}/api/notifications/preferences`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(preferences)
      });

      if (response.ok) {
        toast.success('Préférences enregistrées avec succès');
      } else {
        throw new Error('Erreur serveur');
      }
    } catch (error) {
      console.error('Erreur sauvegarde préférences:', error);
      toast.error('Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  const updateNotificationType = (type: keyof NotificationPreferences['notification_types'], channel: 'push' | 'email' | 'sms', value: boolean) => {
    setPreferences(prev => ({
      ...prev,
      notification_types: {
        ...prev.notification_types,
        [type]: {
          ...prev.notification_types[type],
          [channel]: value
        }
      }
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour
          </Button>
          <div className="flex items-center space-x-3">
            <Bell className="h-8 w-8 text-blue-600" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Préférences de Notifications</h1>
              <p className="text-gray-500">Personnalisez vos notifications selon vos besoins</p>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {/* Canaux de communication */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Smartphone className="h-5 w-5" />
                <span>Canaux de communication</span>
              </CardTitle>
              <CardDescription>
                Choisissez comment vous souhaitez recevoir vos notifications
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Bell className="h-5 w-5 text-gray-600" />
                  <div>
                    <Label htmlFor="push">Notifications Push</Label>
                    <p className="text-sm text-gray-500">Notifications dans le navigateur</p>
                  </div>
                </div>
                <Switch
                  id="push"
                  checked={preferences.push_enabled}
                  onCheckedChange={(checked) => setPreferences({ ...preferences, push_enabled: checked })}
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Mail className="h-5 w-5 text-gray-600" />
                  <div>
                    <Label htmlFor="email">Notifications Email</Label>
                    <p className="text-sm text-gray-500">Recevoir des emails</p>
                  </div>
                </div>
                <Switch
                  id="email"
                  checked={preferences.email_enabled}
                  onCheckedChange={(checked) => setPreferences({ ...preferences, email_enabled: checked })}
                />
              </div>

              {preferences.email_enabled && (
                <div className="ml-8 mt-2">
                  <Label htmlFor="email-frequency" className="text-sm">Fréquence des emails</Label>
                  <Select
                    value={preferences.email_frequency}
                    onValueChange={(value: any) => setPreferences({ ...preferences, email_frequency: value })}
                  >
                    <SelectTrigger id="email-frequency" className="w-full mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="immediate">Immédiat (chaque notification)</SelectItem>
                      <SelectItem value="daily">Quotidien (résumé journalier)</SelectItem>
                      <SelectItem value="weekly">Hebdomadaire (résumé le lundi)</SelectItem>
                      <SelectItem value="never">Jamais</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              <Separator />

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <MessageSquare className="h-5 w-5 text-gray-600" />
                  <div>
                    <Label htmlFor="sms">Notifications SMS</Label>
                    <p className="text-sm text-gray-500">Recevoir des SMS (événements urgents)</p>
                  </div>
                </div>
                <Switch
                  id="sms"
                  checked={preferences.sms_enabled}
                  onCheckedChange={(checked) => setPreferences({ ...preferences, sms_enabled: checked })}
                />
              </div>
            </CardContent>
          </Card>

          {/* Heures silencieuses */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Moon className="h-5 w-5" />
                <span>Heures silencieuses</span>
              </CardTitle>
              <CardDescription>
                Désactiver les notifications pendant certaines heures
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="quiet-hours">Activer les heures silencieuses</Label>
                <Switch
                  id="quiet-hours"
                  checked={preferences.quiet_hours_enabled}
                  onCheckedChange={(checked) => setPreferences({ ...preferences, quiet_hours_enabled: checked })}
                />
              </div>

              {preferences.quiet_hours_enabled && (
                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div>
                    <Label htmlFor="quiet-start">Début</Label>
                    <input
                      id="quiet-start"
                      type="time"
                      value={preferences.quiet_hours_start}
                      onChange={(e) => setPreferences({ ...preferences, quiet_hours_start: e.target.value })}
                      className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md"
                    />
                  </div>
                  <div>
                    <Label htmlFor="quiet-end">Fin</Label>
                    <input
                      id="quiet-end"
                      type="time"
                      value={preferences.quiet_hours_end}
                      onChange={(e) => setPreferences({ ...preferences, quiet_hours_end: e.target.value })}
                      className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md"
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Types de notifications */}
          <Card>
            <CardHeader>
              <CardTitle>Types de notifications</CardTitle>
              <CardDescription>
                Personnalisez les notifications que vous souhaitez recevoir
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Statut dossier */}
                <div>
                  <div className="flex items-center space-x-2 mb-3">
                    <FileText className="h-5 w-5 text-blue-600" />
                    <h4 className="font-medium">Changements de statut dossier</h4>
                  </div>
                  <div className="ml-7 grid grid-cols-3 gap-4">
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={preferences.notification_types.dossier_status.push}
                        onCheckedChange={(v) => updateNotificationType('dossier_status', 'push', v)}
                        disabled={!preferences.push_enabled}
                      />
                      <Label className="text-sm">Push</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={preferences.notification_types.dossier_status.email}
                        onCheckedChange={(v) => updateNotificationType('dossier_status', 'email', v)}
                        disabled={!preferences.email_enabled}
                      />
                      <Label className="text-sm">Email</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={preferences.notification_types.dossier_status.sms}
                        onCheckedChange={(v) => updateNotificationType('dossier_status', 'sms', v)}
                        disabled={!preferences.sms_enabled}
                      />
                      <Label className="text-sm">SMS</Label>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Messages expert */}
                <div>
                  <div className="flex items-center space-x-2 mb-3">
                    <MessageSquare className="h-5 w-5 text-green-600" />
                    <h4 className="font-medium">Messages de votre expert</h4>
                  </div>
                  <div className="ml-7 grid grid-cols-3 gap-4">
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={preferences.notification_types.expert_message.push}
                        onCheckedChange={(v) => updateNotificationType('expert_message', 'push', v)}
                        disabled={!preferences.push_enabled}
                      />
                      <Label className="text-sm">Push</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={preferences.notification_types.expert_message.email}
                        onCheckedChange={(v) => updateNotificationType('expert_message', 'email', v)}
                        disabled={!preferences.email_enabled}
                      />
                      <Label className="text-sm">Email</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={preferences.notification_types.expert_message.sms}
                        onCheckedChange={(v) => updateNotificationType('expert_message', 'sms', v)}
                        disabled={!preferences.sms_enabled}
                      />
                      <Label className="text-sm">SMS</Label>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Demandes de documents */}
                <div>
                  <div className="flex items-center space-x-2 mb-3">
                    <FileText className="h-5 w-5 text-orange-600" />
                    <h4 className="font-medium">Demandes de documents</h4>
                  </div>
                  <div className="ml-7 grid grid-cols-3 gap-4">
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={preferences.notification_types.document_request.push}
                        onCheckedChange={(v) => updateNotificationType('document_request', 'push', v)}
                        disabled={!preferences.push_enabled}
                      />
                      <Label className="text-sm">Push</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={preferences.notification_types.document_request.email}
                        onCheckedChange={(v) => updateNotificationType('document_request', 'email', v)}
                        disabled={!preferences.email_enabled}
                      />
                      <Label className="text-sm">Email</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={preferences.notification_types.document_request.sms}
                        onCheckedChange={(v) => updateNotificationType('document_request', 'sms', v)}
                        disabled={!preferences.sms_enabled}
                      />
                      <Label className="text-sm">SMS</Label>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Rappels RDV */}
                <div>
                  <div className="flex items-center space-x-2 mb-3">
                    <Calendar className="h-5 w-5 text-purple-600" />
                    <h4 className="font-medium">Rappels de rendez-vous</h4>
                    <Badge variant="destructive" className="text-xs">Important</Badge>
                  </div>
                  <div className="ml-7 grid grid-cols-3 gap-4">
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={preferences.notification_types.rdv_reminder.push}
                        onCheckedChange={(v) => updateNotificationType('rdv_reminder', 'push', v)}
                        disabled={!preferences.push_enabled}
                      />
                      <Label className="text-sm">Push</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={preferences.notification_types.rdv_reminder.email}
                        onCheckedChange={(v) => updateNotificationType('rdv_reminder', 'email', v)}
                        disabled={!preferences.email_enabled}
                      />
                      <Label className="text-sm">Email</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={preferences.notification_types.rdv_reminder.sms}
                        onCheckedChange={(v) => updateNotificationType('rdv_reminder', 'sms', v)}
                        disabled={!preferences.sms_enabled}
                      />
                      <Label className="text-sm">SMS</Label>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Paiements */}
                {user?.type !== 'client' && (
                  <>
                    <div>
                      <div className="flex items-center space-x-2 mb-3">
                        <DollarSign className="h-5 w-5 text-green-600" />
                        <h4 className="font-medium">Paiements et commissions</h4>
                      </div>
                      <div className="ml-7 grid grid-cols-3 gap-4">
                        <div className="flex items-center space-x-2">
                          <Switch
                            checked={preferences.notification_types.payment.push}
                            onCheckedChange={(v) => updateNotificationType('payment', 'push', v)}
                            disabled={!preferences.push_enabled}
                          />
                          <Label className="text-sm">Push</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Switch
                            checked={preferences.notification_types.payment.email}
                            onCheckedChange={(v) => updateNotificationType('payment', 'email', v)}
                            disabled={!preferences.email_enabled}
                          />
                          <Label className="text-sm">Email</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Switch
                            checked={preferences.notification_types.payment.sms}
                            onCheckedChange={(v) => updateNotificationType('payment', 'sms', v)}
                            disabled={!preferences.sms_enabled}
                          />
                          <Label className="text-sm">SMS</Label>
                        </div>
                      </div>
                    </div>
                    <Separator />
                  </>
                )}

                {/* Validations admin */}
                <div>
                  <div className="flex items-center space-x-2 mb-3">
                    <Users className="h-5 w-5 text-indigo-600" />
                    <h4 className="font-medium">Validations administratives</h4>
                  </div>
                  <div className="ml-7 grid grid-cols-3 gap-4">
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={preferences.notification_types.validation.push}
                        onCheckedChange={(v) => updateNotificationType('validation', 'push', v)}
                        disabled={!preferences.push_enabled}
                      />
                      <Label className="text-sm">Push</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={preferences.notification_types.validation.email}
                        onCheckedChange={(v) => updateNotificationType('validation', 'email', v)}
                        disabled={!preferences.email_enabled}
                      />
                      <Label className="text-sm">Email</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={preferences.notification_types.validation.sms}
                        onCheckedChange={(v) => updateNotificationType('validation', 'sms', v)}
                        disabled={!preferences.sms_enabled}
                      />
                      <Label className="text-sm">SMS</Label>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Notifications système */}
                <div>
                  <div className="flex items-center space-x-2 mb-3">
                    <AlertCircle className="h-5 w-5 text-gray-600" />
                    <h4 className="font-medium">Notifications système</h4>
                    <Badge variant="outline" className="text-xs">Facultatif</Badge>
                  </div>
                  <div className="ml-7 grid grid-cols-3 gap-4">
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={preferences.notification_types.system.push}
                        onCheckedChange={(v) => updateNotificationType('system', 'push', v)}
                        disabled={!preferences.push_enabled}
                      />
                      <Label className="text-sm">Push</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={preferences.notification_types.system.email}
                        onCheckedChange={(v) => updateNotificationType('system', 'email', v)}
                        disabled={!preferences.email_enabled}
                      />
                      <Label className="text-sm">Email</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={preferences.notification_types.system.sms}
                        onCheckedChange={(v) => updateNotificationType('system', 'sms', v)}
                        disabled={!preferences.sms_enabled}
                      />
                      <Label className="text-sm">SMS</Label>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex justify-end space-x-3">
            <Button
              variant="outline"
              onClick={() => setPreferences(defaultPreferences)}
            >
              Réinitialiser
            </Button>
            <Button
              onClick={savePreferences}
              disabled={saving}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Enregistrement...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Enregistrer les préférences
                </>
              )}
            </Button>
          </div>

          {/* Informations */}
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="p-4">
              <div className="flex items-start space-x-3">
                <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                <div className="flex-1">
                  <h4 className="font-medium text-blue-900 mb-1">Informations</h4>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• Les notifications critiques (fraude, sécurité) ne peuvent pas être désactivées</li>
                    <li>• Les heures silencieuses ne s'appliquent pas aux notifications urgentes</li>
                    <li>• Les SMS sont réservés aux événements importants (RDV, paiements)</li>
                    <li>• Les préférences sont sauvegardées automatiquement</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

