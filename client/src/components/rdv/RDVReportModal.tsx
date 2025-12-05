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
import { Trash2, Save, X, Brain, Loader2, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';
import { config } from '@/config/env';
import { getSupabaseToken } from '@/lib/auth-helpers';
import { Badge } from '@/components/ui/badge';

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
  enriched_content?: string;
  enriched_html?: string;
  action_plan?: string;
  analysis?: any;
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
  const [isEnriching, setIsEnriching] = useState(false);
  const [enrichedData, setEnrichedData] = useState<{
    enriched_content?: string;
    enriched_html?: string;
    action_plan?: string;
    analysis?: any;
  } | null>(null);

  useEffect(() => {
    if (existingReport) {
      setSummary(existingReport.summary || '');
      setVisibility(existingReport.visibility || 'participants');
      // Charger les données enrichies depuis metadata
      if (existingReport.metadata?.enriched_content) {
        setEnrichedData({
          enriched_content: existingReport.metadata.enriched_content,
          enriched_html: existingReport.metadata.enriched_html,
          action_plan: existingReport.metadata.action_plan,
          analysis: existingReport.metadata.analysis
        });
      } else {
        setEnrichedData(null);
      }
    } else {
      setSummary('');
      setVisibility('participants');
      setEnrichedData(null);
    }
  }, [existingReport, isOpen]);

  const handleSave = async (silent = false) => {
    if (!summary.trim()) {
      toast.error('Le résumé est requis');
      return false;
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

      if (!silent) {
        toast.success(existingReport ? 'Rapport modifié avec succès' : 'Rapport ajouté avec succès');
        onSuccess?.();
        onClose();
      } else {
        onSuccess?.(); // Recharger les données sans fermer
      }
      return true;
    } catch (error: any) {
      console.error('Erreur sauvegarde rapport:', error);
      toast.error(error.message || 'Erreur lors de l\'enregistrement du rapport');
      return false;
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

  const handleEnrichWithAI = async () => {
    if (!existingReport?.id) {
      toast.error('Veuillez d\'abord sauvegarder le rapport');
      return;
    }

    if (!summary.trim()) {
      toast.error('Le résumé est requis pour l\'amélioration IA');
      return;
    }

    setIsEnriching(true);
    try {
      const token = await getSupabaseToken();
      
      // Sauvegarder d'abord le rapport s'il a été modifié (sans fermer le modal)
      if (existingReport.summary !== summary.trim()) {
        const saved = await handleSave(true);
        if (!saved) {
          setIsEnriching(false);
          return;
        }
        // Attendre un peu pour que la sauvegarde soit complète
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      const response = await fetch(`${config.API_URL}/api/rdv/${rdvId}/report/enrich`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Erreur lors de l\'enrichissement du rapport');
      }

      const result = await response.json();
      
      if (result.success && result.data) {
        setEnrichedData({
          enriched_content: result.data.enriched_content || result.data.metadata?.enriched_content,
          enriched_html: result.data.enriched_html || result.data.metadata?.enriched_html,
          action_plan: result.data.action_plan || result.data.metadata?.action_plan,
          analysis: result.data.analysis || result.data.metadata?.analysis
        });
        toast.success('Rapport enrichi avec succès');
        onSuccess?.(); // Recharger les données
      } else {
        throw new Error(result.message || 'Erreur lors de l\'enrichissement');
      }
    } catch (error: any) {
      console.error('Erreur enrichissement rapport:', error);
      toast.error(error.message || 'Erreur lors de l\'enrichissement du rapport');
    } finally {
      setIsEnriching(false);
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

        <div className="space-y-6 mt-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <Label htmlFor="summary">Résumé du RDV *</Label>
              {existingReport && summary.trim() && (
                <Button
                  onClick={handleEnrichWithAI}
                  disabled={isEnriching || loading}
                  variant="outline"
                  size="sm"
                  className="h-8 px-3 text-xs bg-gradient-to-r from-purple-50 to-blue-50 hover:from-purple-100 hover:to-blue-100 border-purple-200"
                >
                  {isEnriching ? (
                    <>
                      <Loader2 className="h-3 w-3 mr-1.5 animate-spin" />
                      Amélioration en cours...
                    </>
                  ) : (
                    <>
                      <Brain className="h-3 w-3 mr-1.5" />
                      Améliorer avec l'IA
                    </>
                  )}
                </Button>
              )}
            </div>
            <Textarea
              id="summary"
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              placeholder="Décrivez les points abordés, les décisions prises, les actions à suivre..."
              rows={8}
              className="mt-1"
            />
          </div>

          {/* Contenu enrichi par l'IA */}
          {enrichedData?.enriched_content && (
            <div className="border-t pt-4 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Brain className="h-4 w-4 text-purple-600" />
                  <h4 className="text-sm font-semibold text-gray-900">Rapport optimisé par l'IA</h4>
                  {existingReport?.metadata?.enriched_at && (
                    <Badge variant="outline" className="text-xs bg-purple-50 text-purple-700 border-purple-200">
                      Mis à jour : {new Date(existingReport.metadata.enriched_at).toLocaleDateString('fr-FR', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </Badge>
                  )}
                </div>
                <Button
                  onClick={handleEnrichWithAI}
                  disabled={isEnriching}
                  variant="outline"
                  size="sm"
                  className="h-7 px-2 text-xs"
                >
                  {isEnriching ? (
                    <>
                      <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                      Mise à jour...
                    </>
                  ) : (
                    <>
                      <Brain className="h-3 w-3 mr-1" />
                      Relancer l'enrichissement
                    </>
                  )}
                </Button>
              </div>
              <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-lg p-4 border border-purple-100">
                <Textarea
                  value={enrichedData.enriched_content}
                  onChange={(e) => setEnrichedData(prev => prev ? { ...prev, enriched_content: e.target.value } : null)}
                  className="min-h-[200px] resize-y text-sm bg-white/80"
                  placeholder="Contenu enrichi par l'IA..."
                />
                <div className="mt-2 text-xs text-gray-500">
                  💡 Vous pouvez modifier ce contenu. Relancez l'enrichissement pour mettre à jour avec les dernières informations.
                </div>
              </div>
            </div>
          )}

          {/* Plan d'action suggéré */}
          {enrichedData?.action_plan && (
            <div className="border-t pt-4 space-y-2">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-green-600" />
                <h4 className="text-sm font-semibold text-gray-900">Plan d'action suggéré</h4>
              </div>
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg p-4 border border-green-100">
                <Textarea
                  value={enrichedData.action_plan}
                  onChange={(e) => setEnrichedData(prev => prev ? { ...prev, action_plan: e.target.value } : null)}
                  className="min-h-[150px] resize-y text-sm bg-white/80"
                  placeholder="Plan d'action suggéré par l'IA..."
                />
              </div>
            </div>
          )}

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

