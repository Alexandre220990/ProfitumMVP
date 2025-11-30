import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Bell, Mail, Smartphone } from 'lucide-react';
import { NotificationTypePreference } from '@/hooks/useNotificationPreferences';
import { NOTIFICATION_SLA_CONFIG } from '@/utils/notification-sla';
import { cn } from '@/lib/utils';

interface NotificationTypeSettingsProps {
  preferences: Record<string, NotificationTypePreference>;
  onUpdateChannel: (type: string, channel: 'push' | 'email', enabled: boolean) => void;
  onUpdateSLAChannel: (
    type: string,
    slaLevel: 'target' | 'acceptable' | 'critical',
    channel: 'push' | 'email',
    enabled: boolean
  ) => void;
  onToggleType: (type: string, enabled: boolean) => void;
}

const SLA_LABELS = {
  target: { label: 'Cible (24h)', color: 'bg-green-100 text-green-800' },
  acceptable: { label: 'Acceptable (48h)', color: 'bg-orange-100 text-orange-800' },
  critical: { label: 'Critique (120h)', color: 'bg-red-100 text-red-800' },
};

export function NotificationTypeSettings({
  preferences,
  onUpdateChannel,
  onUpdateSLAChannel,
  onToggleType,
}: NotificationTypeSettingsProps) {
  const notificationTypes = Object.keys(NOTIFICATION_SLA_CONFIG).filter(
    (type) => type !== 'default'
  );

  const getTypeLabel = (type: string): string => {
    const labels: Record<string, string> = {
      contact_message: 'Message de contact',
      lead_to_treat: 'Lead à traiter',
      rdv_sla_reminder: 'RDV non traité',
      daily_activity_report: 'Rapport quotidien',
      admin_action_required: 'Action admin requise',
      documents_complementary_uploaded: 'Documents complémentaires uploadés',
      expert_refused_dossier: 'Expert a refusé le dossier',
      dossier_urgent: 'Dossier urgent',
      validation_final_pending: 'Validation finale en attente',
      client_no_response_critical: 'Client sans réponse critique',
      audit_to_complete: 'Audit à compléter',
      documents_requested: 'Documents demandés',
      relance_needed: 'Relance nécessaire',
      complementary_docs_received: 'Documents complémentaires reçus',
      first_review_needed: 'Première revue nécessaire',
      expert_pending_acceptance: 'Expert en attente d\'acceptation',
      documents_pending_validation: 'Documents en attente de validation',
      // Types avec niveaux
      expert_pending_acceptance_reminder: 'Expert en attente - Rappel',
      expert_pending_acceptance_escalated: 'Expert en attente - Escalade',
      expert_pending_acceptance_critical: 'Expert en attente - Critique',
      documents_pending_validation_reminder: 'Documents en attente - Rappel',
      documents_pending_validation_escalated: 'Documents en attente - Escalade',
      documents_pending_validation_critical: 'Documents en attente - Critique',
      client_no_response_critical_reminder: 'Client sans réponse - Rappel',
      client_no_response_critical_escalated: 'Client sans réponse - Escalade',
      client_no_response_critical_critical: 'Client sans réponse - Critique',
      audit_to_complete_reminder: 'Audit à compléter - Rappel',
      audit_to_complete_escalated: 'Audit à compléter - Escalade',
      audit_to_complete_critical: 'Audit à compléter - Critique',
      documents_requested_reminder: 'Documents demandés - Rappel',
      documents_requested_escalated: 'Documents demandés - Escalade',
      documents_requested_critical: 'Documents demandés - Critique',
      relance_needed_reminder: 'Relance nécessaire - Rappel',
      relance_needed_escalated: 'Relance nécessaire - Escalade',
      relance_needed_critical: 'Relance nécessaire - Critique',
      complementary_docs_received_reminder: 'Documents complémentaires - Rappel',
      complementary_docs_received_escalated: 'Documents complémentaires - Escalade',
      complementary_docs_received_critical: 'Documents complémentaires - Critique',
      first_review_needed_reminder: 'Première revue - Rappel',
      first_review_needed_escalated: 'Première revue - Escalade',
      first_review_needed_critical: 'Première revue - Critique',
      validation_final_pending_reminder: 'Validation finale - Rappel',
      validation_final_pending_escalated: 'Validation finale - Escalade',
      validation_final_pending_critical: 'Validation finale - Critique',
    };
    return labels[type] || type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  return (
    <div className="space-y-4">
      {notificationTypes.map((type) => {
        const pref = preferences[type];
        if (!pref) return null;

        const sla = NOTIFICATION_SLA_CONFIG[type];
        const hasSLA = sla && (sla.targetHours || sla.acceptableHours || sla.criticalHours);

        return (
          <Card key={type} className="border-l-4 border-l-blue-500 shadow-sm">
            <CardHeader className="pb-3 p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                  <Bell className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 flex-shrink-0" />
                  <CardTitle className="text-sm sm:text-base font-semibold break-words">
                    {getTypeLabel(type)}
                  </CardTitle>
                  {hasSLA && (
                    <Badge variant="outline" className="text-xs flex-shrink-0">
                      SLA configuré
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-2 self-start sm:self-auto">
                  <Label htmlFor={`toggle-${type}`} className="text-xs sm:text-sm text-gray-600">
                    Activer
                  </Label>
                  <Switch
                    id={`toggle-${type}`}
                    checked={pref.enabled}
                    onCheckedChange={(checked) => onToggleType(type, checked)}
                  />
                </div>
              </div>
              {sla && (
                <p className="text-xs text-gray-500 mt-2 leading-relaxed">{sla.description}</p>
              )}
            </CardHeader>

            {pref.enabled && (
              <CardContent className="space-y-4">
                {/* Canaux généraux */}
                <div className="space-y-3">
                  <Label className="text-sm font-medium text-gray-700">
                    Canaux de notification généraux
                  </Label>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-2">
                        <Smartphone className="w-4 h-4 text-blue-600" />
                        <Label htmlFor={`push-${type}`} className="text-sm">
                          Notifications push
                        </Label>
                      </div>
                      <Switch
                        id={`push-${type}`}
                        checked={pref.channels.push}
                        onCheckedChange={(checked) =>
                          onUpdateChannel(type, 'push', checked)
                        }
                      />
                    </div>
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-green-600" />
                        <Label htmlFor={`email-${type}`} className="text-sm">
                          Email
                        </Label>
                      </div>
                      <Switch
                        id={`email-${type}`}
                        checked={pref.channels.email}
                        onCheckedChange={(checked) =>
                          onUpdateChannel(type, 'email', checked)
                        }
                      />
                    </div>
                  </div>
                </div>

                {/* Canaux par SLA */}
                {hasSLA && (
                  <div className="space-y-3 pt-3 border-t">
                    <Label className="text-sm font-medium text-gray-700">
                      Canaux par seuil SLA
                    </Label>
                    <div className="space-y-3">
                      {(['target', 'acceptable', 'critical'] as const).map((slaLevel) => {
                        const slaConfig = slaLevel === 'target' 
                          ? { hours: sla.targetHours, label: SLA_LABELS.target }
                          : slaLevel === 'acceptable'
                          ? { hours: sla.acceptableHours, label: SLA_LABELS.acceptable }
                          : { hours: sla.criticalHours, label: SLA_LABELS.critical };

                        return (
                          <div
                            key={slaLevel}
                            className={cn(
                              'p-3 border rounded-lg',
                              slaConfig.label.color
                            )}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <Label className="text-sm font-medium">
                                {slaConfig.label.label} ({slaConfig.hours}h)
                              </Label>
                            </div>
                            <div className="grid grid-cols-2 gap-3 mt-2">
                              <div className="flex items-center justify-between bg-white/50 p-2 rounded">
                                <Label
                                  htmlFor={`sla-${type}-${slaLevel}-push`}
                                  className="text-xs"
                                >
                                  Push
                                </Label>
                                <Switch
                                  id={`sla-${type}-${slaLevel}-push`}
                                  checked={pref.slaChannels[slaLevel].push}
                                  onCheckedChange={(checked) =>
                                    onUpdateSLAChannel(type, slaLevel, 'push', checked)
                                  }
                                />
                              </div>
                              <div className="flex items-center justify-between bg-white/50 p-2 rounded">
                                <Label
                                  htmlFor={`sla-${type}-${slaLevel}-email`}
                                  className="text-xs"
                                >
                                  Email
                                </Label>
                                <Switch
                                  id={`sla-${type}-${slaLevel}-email`}
                                  checked={pref.slaChannels[slaLevel].email}
                                  onCheckedChange={(checked) =>
                                    onUpdateSLAChannel(type, slaLevel, 'email', checked)
                                  }
                                />
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </CardContent>
            )}
          </Card>
        );
      })}
    </div>
  );
}

