/**
 * 📁 WorkflowDocumentUpload - Upload de documents dans le workflow produit
 * Intégré aux pages de workflow client
 * Utilise l'API unifiée /api/documents
 * 
 * Usage dans dossier-client/[produit]/[id].tsx
 */

import { useState, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Upload, FileText, Loader2 } from 'lucide-react';
import { getSupabaseToken } from '@/lib/auth-helpers';
import { toast } from 'sonner';
import { config } from '@/config';

interface WorkflowDocumentUploadProps {
  clientProduitId: string;
  produitId?: string;
  clientId?: string;
  onUploadSuccess?: () => void;
  className?: string;
}

export function WorkflowDocumentUpload({
  clientProduitId,
  produitId,
  clientId,
  onUploadSuccess,
  className
}: WorkflowDocumentUploadProps) {
  const [open, setOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [documentType, setDocumentType] = useState('autre');

  /**
   * Gérer la sélection de fichier
   */
  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Vérifier la taille (max 50MB)
      if (file.size > 50 * 1024 * 1024) {
        toast.error('Fichier trop volumineux (max 50MB)');
        return;
      }
      
      setSelectedFile(file);
    }
  }, []);

  /**
   * Upload du document via l'API unifiée
   */
  const handleUpload = useCallback(async () => {
    if (!selectedFile) {
      toast.error('Veuillez sélectionner un fichier');
      return;
    }

    try {
      setUploading(true);

      // Construire FormData
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('document_type', documentType);
      
      if (produitId) {
        formData.append('produit_id', produitId);
      }
      
      if (clientId) {
        formData.append('client_id', clientId);
      }

      // Ajouter metadata du workflow
      formData.append('metadata', JSON.stringify({
        source: 'workflow',
        client_produit_id: clientProduitId,
        uploaded_from: 'client_workflow'
      }));

      // Requête vers API unifiée
      const token = await getSupabaseToken();
      const response = await fetch(`${config.API_URL}/documents/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Erreur lors de l\'upload');
      }

      toast.success('Document uploadé avec succès');
      
      // Reset form
      setSelectedFile(null);
      setDocumentType('autre');
      setOpen(false);

      // Callback
      if (onUploadSuccess) {
        onUploadSuccess();
      }

    } catch (error: any) {
      console.error('Erreur upload:', error);
      toast.error(error.message || 'Erreur lors de l\'upload');
    } finally {
      setUploading(false);
    }
  }, [selectedFile, documentType, produitId, clientId, clientProduitId, onUploadSuccess]);

  /**
   * Format file size
   */
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className={className}>
          <Plus className="w-4 h-4 mr-2" />
          Ajouter un document
        </Button>
      </DialogTrigger>
      
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>📤 Uploader un document</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Sélection fichier */}
          <div>
            <Label>Fichier</Label>
            <Input
              type="file"
              onChange={handleFileChange}
              accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.xls,.xlsx"
              disabled={uploading}
            />
            {selectedFile && (
              <p className="text-sm text-slate-500 mt-1 flex items-center">
                <FileText className="w-4 h-4 mr-1" />
                {selectedFile.name} ({formatFileSize(selectedFile.size)})
              </p>
            )}
          </div>

          {/* Type de document */}
          <div>
            <Label>Type de document</Label>
            <Select value={documentType} onValueChange={setDocumentType} disabled={uploading}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="kbis">KBIS</SelectItem>
                <SelectItem value="facture">Facture</SelectItem>
                <SelectItem value="carte_grise">Carte grise</SelectItem>
                <SelectItem value="fiche_paie">Fiche de paie</SelectItem>
                <SelectItem value="taxe_fonciere">Taxe foncière</SelectItem>
                <SelectItem value="bulletin_salaire">Bulletin de salaire</SelectItem>
                <SelectItem value="contrat_travail">Contrat de travail</SelectItem>
                <SelectItem value="convention_collective">Convention collective</SelectItem>
                <SelectItem value="justificatif_frais">Justificatif de frais</SelectItem>
                <SelectItem value="dsn">DSN (Déclaration Sociale Nominative)</SelectItem>
                <SelectItem value="rapport_analyse">Rapport d'analyse</SelectItem>
                <SelectItem value="calcul_eligibilite">Calcul d'éligibilité</SelectItem>
                <SelectItem value="recommandations">Recommandations</SelectItem>
                <SelectItem value="rapport_expert">Rapport d'expert</SelectItem>
                <SelectItem value="annexes">Annexes techniques</SelectItem>
                <SelectItem value="autre">Autre</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <Button
              onClick={handleUpload}
              disabled={!selectedFile || uploading}
              className="flex-1"
            >
              {uploading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Upload en cours...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Uploader
                </>
              )}
            </Button>
            <Button
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={uploading}
            >
              Annuler
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

