/**
 * Modal pour gérer les rapports de RDV
 * Permet d'ajouter, modifier ou supprimer un rapport de RDV
 */

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Trash2, Save, X } from 'lucide-react';
import { toast } from 'sonner';
import { config } from '@/config/env';
import { getSupabaseToken } from '@/lib/auth-helpers';

interface RDVReport {
  id?: string;
  rdv_id: string;
  author_id?: string;
  author_type?: string;
  summary: string;
  action_items?: any[];
  visibility?: 'participants' | 'cabinet' | 'internal';
  metadata?: any;
  created_at?: string;
  updated_at?: string;
}

interface RDVReportModalProps {
  rdvId: string;
  rdvTitle?: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  existingReport?: RDVReport | null;
}

export function RDVReportModal({
  rdvId,
  rdvTitle,
  isOpen,
  onClose,
  onSuccess,
  existingReport
}: RDVReportModalProps) {
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState('');
  const [visibility, setVisibility] = useState<'participants' | 'cabinet' | 'internal'>('participants');

  useEffect(() => {
    if (existingReport) {
      setSummary(existingReport.summary || '');
      setVisibility(existingReport.visibility || 'participants');
    } else {
      setSummary('');
      setVisibility('participants');
    }
  }, [existingReport, isOpen]);

  const handleSave = async () => {
    if (!summary.trim()) {
      toast.error('Le résumé est requis');
      return;
    }

    setLoading(true);
    try {
      const token = await getSupabaseToken();
      const url = `${config.API_URL}/api/rdv/${rdvId}/report`;
      const method = existingReport ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          summary: summary.trim(),
          action_items: [],
          visibility
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Erreur lors de l\'enregistrement');
      }

      toast.success(existingReport ? 'Rapport modifié avec succès' : 'Rapport ajouté avec succès');
      onSuccess?.();
      onClose();
    } catch (error: any) {
      console.error('Erreur sauvegarde rapport:', error);
      toast.error(error.message || 'Erreur lors de l\'enregistrement du rapport');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!existingReport?.id) return;

    if (!confirm('Êtes-vous sûr de vouloir supprimer ce rapport ?')) {
      return;
    }

    setLoading(true);
    try {
      const token = await getSupabaseToken();
      const response = await fetch(`${config.API_URL}/api/rdv/${rdvId}/report`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Erreur lors de la suppression');
      }

      toast.success('Rapport supprimé avec succès');
      onSuccess?.();
      onClose();
    } catch (error: any) {
      console.error('Erreur suppression rapport:', error);
      toast.error(error.message || 'Erreur lors de la suppression du rapport');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {existingReport ? 'Modifier le rapport de RDV' : 'Ajouter un rapport de RDV'}
          </DialogTitle>
          <DialogDescription>
            {rdvTitle && <div className="mt-2 font-medium text-gray-700">{rdvTitle}</div>}
            Consignez les points importants abordés lors de ce rendez-vous.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          <div>
            <Label htmlFor="summary">Résumé du RDV *</Label>
            <Textarea
              id="summary"
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              placeholder="Décrivez les points abordés, les décisions prises, les actions à suivre..."
              rows={8}
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="visibility">Visibilité</Label>
            <Select value={visibility} onValueChange={(value: any) => setVisibility(value)}>
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="participants">Participants uniquement</SelectItem>
                <SelectItem value="cabinet">Cabinet</SelectItem>
                <SelectItem value="internal">Interne (admins)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between pt-4 border-t">
            <div className="flex items-center gap-2">
              {existingReport && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleDelete}
                  disabled={loading}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Supprimer
                </Button>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={onClose}
                disabled={loading}
              >
                <X className="w-4 h-4 mr-2" />
                Annuler
              </Button>
              <Button
                onClick={handleSave}
                disabled={loading || !summary.trim()}
              >
                <Save className="w-4 h-4 mr-2" />
                {loading ? 'Enregistrement...' : existingReport ? 'Modifier' : 'Ajouter'}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

