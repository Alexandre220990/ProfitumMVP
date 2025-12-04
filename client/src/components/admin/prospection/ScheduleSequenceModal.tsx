/**
 * Modal de Planification d'Envoi de Séquence
 * Permet de programmer l'envoi d'une séquence générée
 */

import React, { useState } from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Calendar,
  Clock,
  Send,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Info
} from 'lucide-react';
import axios from 'axios';

interface ScheduleSequenceModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  prospectId: string;
  prospectName: string;
  sequence: {
    steps: Array<{
      stepNumber: number;
      delayDays: number;
      subject: string;
      body: string;
    }>;
  };
  onScheduled?: () => void;
}

export const ScheduleSequenceModal: React.FC<ScheduleSequenceModalProps> = ({
  open,
  onOpenChange,
  prospectId,
  prospectName,
  sequence,
  onScheduled
}) => {
  const [startDate, setStartDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [sequenceName, setSequenceName] = useState<string>(
    `Séquence V4 - ${prospectName} - ${new Date().toISOString().split('T')[0]}`
  );
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const calculateSendDates = () => {
    const start = new Date(startDate);
    return sequence.steps.map(step => {
      const sendDate = new Date(start);
      sendDate.setDate(sendDate.getDate() + step.delayDays);
      
      // Ajuster pour éviter week-end
      const dayOfWeek = sendDate.getDay();
      if (dayOfWeek === 0) sendDate.setDate(sendDate.getDate() + 1);
      if (dayOfWeek === 6) sendDate.setDate(sendDate.getDate() + 2);
      
      sendDate.setHours(9, 0, 0, 0);
      
      return {
        step: step.stepNumber,
        date: sendDate,
        formatted: format(sendDate, 'EEEE dd MMMM yyyy à HH:mm', { locale: fr })
      };
    });
  };

  const handleSchedule = async () => {
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const response = await axios.post('/api/prospects/schedule-sequence', {
        prospectId,
        sequence,
        startDate,
        sequenceName
      });

      if (response.data.success) {
        setSuccess(true);
        if (onScheduled) {
          onScheduled();
        }
        
        // Fermer après 2 secondes
        setTimeout(() => {
          onOpenChange(false);
        }, 2000);
      } else {
        throw new Error(response.data.error);
      }
    } catch (err: any) {
      console.error('Erreur programmation:', err);
      setError(err.response?.data?.error || err.message || 'Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };

  const sendDates = calculateSendDates();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Programmer la Séquence d'Emails
          </DialogTitle>
          <DialogDescription>
            Planifier l'envoi automatique de {sequence.steps.length} emails pour {prospectName}
          </DialogDescription>
        </DialogHeader>

        {success ? (
          <Alert className="border-green-200 bg-green-50">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-700">
              ✅ Séquence programmée avec succès ! Les emails seront envoyés automatiquement aux dates planifiées.
            </AlertDescription>
          </Alert>
        ) : (
          <div className="space-y-6">
            {/* Configuration */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="startDate">
                  Date de début de la séquence
                </Label>
                <div className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-gray-400" />
                  <Input
                    id="startDate"
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    className="flex-1"
                  />
                </div>
                <p className="text-xs text-gray-500">
                  Les week-ends seront automatiquement décalés au lundi suivant
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="sequenceName">
                  Nom de la séquence (optionnel)
                </Label>
                <Input
                  id="sequenceName"
                  value={sequenceName}
                  onChange={(e) => setSequenceName(e.target.value)}
                  placeholder="Séquence V4 - Prospect..."
                />
              </div>
            </div>

            {/* Prévisualisation planning */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Planning d'Envoi</CardTitle>
                <CardDescription>
                  Dates et heures calculées automatiquement
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {sendDates.map((item, idx) => (
                    <div 
                      key={idx}
                      className={`p-4 rounded-lg border ${
                        item.step === 1 
                          ? 'bg-blue-50 border-blue-200' 
                          : 'bg-gray-50 border-gray-200'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Badge variant={item.step === 1 ? 'default' : 'secondary'}>
                            Email {item.step}
                          </Badge>
                          {item.step === 1 && (
                            <Badge variant="outline" className="text-xs">Premier contact</Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Clock className="h-4 w-4" />
                          <span className="capitalize">{item.formatted}</span>
                        </div>
                      </div>
                      <div className="text-sm font-medium text-gray-700 truncate">
                        {sequence.steps[idx]?.subject}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Avertissements */}
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription className="text-sm">
                <ul className="space-y-1 mt-2">
                  <li>• Les emails seront envoyés automatiquement aux dates planifiées</li>
                  <li>• Vous pouvez mettre en pause ou annuler la séquence à tout moment</li>
                  <li>• Les week-ends sont automatiquement décalés au lundi suivant</li>
                  <li>• Heure d'envoi optimale : 9h00 du matin (ajustable)</li>
                </ul>
              </AlertDescription>
            </Alert>

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </div>
        )}

        {!success && (
          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              Annuler
            </Button>
            <Button onClick={handleSchedule} disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Programmation...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Programmer la séquence
                </>
              )}
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ScheduleSequenceModal;

