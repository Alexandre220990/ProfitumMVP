import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Settings, AlertCircle } from 'lucide-react';
import { SLAPreferences } from '@/hooks/useNotificationPreferences';
import { NOTIFICATION_SLA_CONFIG } from '@/utils/notification-sla';
import { useState } from 'react';

interface SLASettingsProps {
  slaPreferences: SLAPreferences;
  onUpdateSLADurations: (
    type: string,
    durations: { targetHours?: number; acceptableHours?: number; criticalHours?: number }
  ) => void;
}

export function SLASettings({ slaPreferences, onUpdateSLADurations }: SLASettingsProps) {
  const [errors, setErrors] = useState<Record<string, string>>({});

  const notificationTypes = Object.keys(NOTIFICATION_SLA_CONFIG).filter(
    (type) => type !== 'default'
  );

  const getTypeLabel = (type: string): string => {
    const labels: Record<string, string> = {
      contact_message: 'Message de contact',
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
    };
    return labels[type] || type.replace(/_/g, ' ');
  };

  const validateHours = (
    _type: string,
    targetHours: number,
    acceptableHours: number,
    criticalHours: number
  ): string | null => {
    if (targetHours <= 0 || acceptableHours <= 0 || criticalHours <= 0) {
      return 'Les durées doivent être supérieures à 0';
    }
    if (targetHours >= acceptableHours) {
      return 'La durée cible doit être inférieure à la durée acceptable';
    }
    if (acceptableHours >= criticalHours) {
      return 'La durée acceptable doit être inférieure à la durée critique';
    }
    return null;
  };

  const handleHoursChange = (
    type: string,
    field: 'targetHours' | 'acceptableHours' | 'criticalHours',
    value: string
  ) => {
    const numValue = parseInt(value, 10);
    if (isNaN(numValue) || numValue < 0) {
      setErrors((prev) => ({
        ...prev,
        [type]: 'Valeur invalide',
      }));
      return;
    }

    const current = slaPreferences[type] || NOTIFICATION_SLA_CONFIG[type];
    const updates: any = { [field]: numValue };

    // Valider les contraintes
    const targetHours = field === 'targetHours' ? numValue : current.targetHours;
    const acceptableHours = field === 'acceptableHours' ? numValue : current.acceptableHours;
    const criticalHours = field === 'criticalHours' ? numValue : current.criticalHours;

    const error = validateHours(type, targetHours, acceptableHours, criticalHours);
    if (error) {
      setErrors((prev) => ({
        ...prev,
        [type]: error,
      }));
      return;
    }

    setErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors[type];
      return newErrors;
    });

    onUpdateSLADurations(type, updates);
  };

  return (
    <div className="space-y-4">
      <Alert>
        <AlertCircle className="w-4 h-4" />
        <AlertDescription>
          En tant qu'administrateur, vous pouvez modifier les durées des SLA pour chaque type de notification.
          Les durées doivent respecter l'ordre : Cible &lt; Acceptable &lt; Critique.
        </AlertDescription>
      </Alert>

      {notificationTypes.map((type) => {
        const sla = slaPreferences[type] || NOTIFICATION_SLA_CONFIG[type];
        const error = errors[type];

        return (
          <Card key={type} className="border-l-4 border-l-purple-500">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Settings className="w-5 h-5 text-purple-600" />
                <CardTitle className="text-base font-semibold">
                  {getTypeLabel(type)}
                </CardTitle>
              </div>
              {NOTIFICATION_SLA_CONFIG[type] && (
                <p className="text-xs text-gray-500 mt-1">
                  {NOTIFICATION_SLA_CONFIG[type].description}
                </p>
              )}
            </CardHeader>

            <CardContent className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="w-4 h-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor={`target-${type}`} className="text-sm font-medium">
                    Durée cible (heures)
                  </Label>
                  <Input
                    id={`target-${type}`}
                    type="number"
                    min="1"
                    value={sla.targetHours}
                    onChange={(e) =>
                      handleHoursChange(type, 'targetHours', e.target.value)
                    }
                    className={error ? 'border-red-500' : ''}
                  />
                  <p className="text-xs text-gray-500">
                    Délai optimal (vert)
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`acceptable-${type}`} className="text-sm font-medium">
                    Durée acceptable (heures)
                  </Label>
                  <Input
                    id={`acceptable-${type}`}
                    type="number"
                    min="1"
                    value={sla.acceptableHours}
                    onChange={(e) =>
                      handleHoursChange(type, 'acceptableHours', e.target.value)
                    }
                    className={error ? 'border-red-500' : ''}
                  />
                  <p className="text-xs text-gray-500">
                    Délai acceptable (orange)
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`critical-${type}`} className="text-sm font-medium">
                    Durée critique (heures)
                  </Label>
                  <Input
                    id={`critical-${type}`}
                    type="number"
                    min="1"
                    value={sla.criticalHours}
                    onChange={(e) =>
                      handleHoursChange(type, 'criticalHours', e.target.value)
                    }
                    className={error ? 'border-red-500' : ''}
                  />
                  <p className="text-xs text-gray-500">
                    Délai critique (rouge)
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

