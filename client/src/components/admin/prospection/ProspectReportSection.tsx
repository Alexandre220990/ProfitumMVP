/**
 * Section Rapport Prospect - Composant principal
 * Permet de créer, modifier et enrichir les rapports prospects
 */

import { useState, useEffect, useRef } from 'react';
import { useProspectReport, useCreateOrUpdateReport, useEnrichReport, useUploadAttachment, useRemoveAttachment } from '@/hooks/useProspectReport';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Sparkles, Loader2, Save, FileText, Upload, X, Paperclip } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

interface ProspectReportSectionProps {
  prospectId: string;
}

const TAG_PRESETS = [
  { label: '📞 Appel', value: 'call', color: 'blue' },
  { label: '🤝 RDV', value: 'meeting', color: 'green' },
  { label: '❌ Objection', value: 'objection', color: 'red' },
  { label: '💰 Budget', value: 'budget', color: 'yellow' },
  { label: '⏰ Urgent', value: 'urgent', color: 'orange' },
  { label: '🔥 Hot Lead', value: 'hot', color: 'red' },
];

export default function ProspectReportSection({ prospectId }: ProspectReportSectionProps) {
  const { data: report, isLoading } = useProspectReport(prospectId);
  const { mutate: saveReport, isPending: isSaving } = useCreateOrUpdateReport();
  const { mutate: enrichReport, isPending: isEnriching } = useEnrichReport();
  const { mutate: uploadFile, isPending: isUploading } = useUploadAttachment();
  const { mutate: removeFile } = useRemoveAttachment();

  const [content, setContent] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<'original' | 'enriched'>('original');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Charger le rapport initial
  useEffect(() => {
    if (report) {
      setContent(report.report_content || '');
      setSelectedTags(report.tags || []);
      setHasUnsavedChanges(false);
    }
  }, [report]);

  // Sauvegarder
  const handleSave = () => {
    saveReport({
      prospectId,
      data: {
        report_content: content,
        tags: selectedTags
      }
    });
    setHasUnsavedChanges(false);
  };

  // Auto-save après 2 secondes d'inactivité
  useEffect(() => {
    if (!hasUnsavedChanges) return;

    const timer = setTimeout(() => {
      handleSave();
    }, 2000);

    return () => clearTimeout(timer);
  }, [content, selectedTags, hasUnsavedChanges]);

  // Enrichir avec IA
  const handleEnrich = () => {
    if (!report || !content) {
      alert('Veuillez d\'abord créer un rapport');
      return;
    }
    enrichReport(prospectId);
  };

  // Toggle tag
  const toggleTag = (tag: string) => {
    setSelectedTags(prev =>
      prev.includes(tag)
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
    setHasUnsavedChanges(true);
  };

  // Upload fichier
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Vérifier la taille (10MB max)
      if (file.size > 10 * 1024 * 1024) {
        alert('Le fichier est trop volumineux (10MB maximum)');
        return;
      }
      uploadFile({ prospectId, file });
    }
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Supprimer fichier
  const handleRemoveFile = (url: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce fichier ?')) {
      removeFile({ prospectId, url });
    }
  };

  // Formatter la taille du fichier
  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  if (isLoading) {
    return (
      <Card className="mt-6">
        <CardContent className="py-8">
          <div className="text-center">Chargement...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mt-6">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              📝 Rapport Prospect
            </CardTitle>
            <CardDescription>
              Notez toutes les informations importantes sur ce prospect
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleSave}
              disabled={isSaving || !hasUnsavedChanges}
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Sauvegarde...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  {hasUnsavedChanges ? 'Sauvegarder' : 'Sauvegardé'}
                </>
              )}
            </Button>
            <Button
              variant="default"
              size="sm"
              onClick={handleEnrich}
              disabled={isEnriching || !content}
            >
              {isEnriching ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Enrichissement...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Enrichir avec l'IA
                </>
              )}
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Tabs Original / Enrichi */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
          <TabsList>
            <TabsTrigger value="original">
              Rapport Original
            </TabsTrigger>
            <TabsTrigger value="enriched" disabled={!report?.enriched_content}>
              Version Enrichie IA
              {report?.enriched_content && (
                <Badge className="ml-2 bg-purple-100 text-purple-800 border-purple-200">
                  IA
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="original" className="space-y-4">
            <Textarea
              placeholder="Écrivez vos notes sur le prospect...&#10;&#10;Exemples :&#10;- Appel du 12/12 : Intéressé par TICPE, société 50 employés&#10;- Budget annoncé : 50-100k€&#10;- Objection : timing Q1 2025&#10;- Prochaine action : Rappel mi-janvier"
              value={content}
              onChange={(e) => {
                setContent(e.target.value);
                setHasUnsavedChanges(true);
              }}
              rows={12}
              className="font-mono text-sm"
            />

            {/* Tags */}
            <div>
              <label className="text-sm font-medium mb-2 block">🏷️ Tags</label>
              <div className="flex flex-wrap gap-2">
                {TAG_PRESETS.map(preset => (
                  <Badge
                    key={preset.value}
                    variant={selectedTags.includes(preset.value) ? 'default' : 'outline'}
                    className="cursor-pointer"
                    onClick={() => toggleTag(preset.value)}
                  >
                    {preset.label}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Pièces jointes */}
            <div className="mt-4 space-y-2">
              <label className="text-sm font-medium">📎 Pièces jointes</label>
              
              <div className="flex flex-wrap gap-2">
                {/* Bouton upload */}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Upload...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4 mr-2" />
                      Ajouter un fichier
                    </>
                  )}
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  onChange={handleFileUpload}
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg"
                />
              </div>

              {/* Liste des fichiers */}
              {report?.attachments && report.attachments.length > 0 && (
                <div className="space-y-2">
                  {report.attachments.map((att, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-2 bg-muted rounded-md"
                    >
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <Paperclip className="w-4 h-4 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium truncate">
                            {att.name}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {formatFileSize(att.size)} • {new Date(att.uploaded_at).toLocaleDateString('fr-FR')}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => window.open(att.url, '_blank')}
                        >
                          Voir
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveFile(att.url)}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Metadata */}
            {report && (
              <div className="text-xs text-muted-foreground mt-4">
                Créé il y a {formatDistanceToNow(new Date(report.created_at), { locale: fr })}
                {report.updated_at !== report.created_at && (
                  <> • Modifié il y a {formatDistanceToNow(new Date(report.updated_at), { locale: fr })}</>
                )}
                {report.enriched_at && (
                  <> • Enrichi il y a {formatDistanceToNow(new Date(report.enriched_at), { locale: fr })}</>
                )}
              </div>
            )}
          </TabsContent>

          <TabsContent value="enriched" className="space-y-4">
            {report?.enriched_content && (
              <>
                {/* Banner */}
                <Alert className="bg-purple-50 border-purple-200">
                  <Sparkles className="h-4 w-4 text-purple-600" />
                  <AlertTitle>Rapport enrichi par l'IA</AlertTitle>
                  <AlertDescription>
                    Enrichi il y a {formatDistanceToNow(new Date(report.enriched_at!), { locale: fr })}
                    . Ce rapport combine vos notes avec l'analyse IA du prospect.
                  </AlertDescription>
                </Alert>

                {/* Synthèse Enrichie */}
                <Card>
                  <CardHeader>
                    <CardTitle>📊 Synthèse Enrichie</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="prose max-w-none whitespace-pre-wrap">
                      {report.enriched_content}
                    </div>
                  </CardContent>
                </Card>

                {/* Plan d'Action */}
                {report.action_plan && (
                  <Card>
                    <CardHeader>
                      <CardTitle>🎯 Plan d'Action Recommandé</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="prose max-w-none whitespace-pre-wrap">
                        {report.action_plan}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

