import { useState, useEffect } from 'react';
import { Progress } from '@/components/ui/progress';
import { ExcelFileData, MappingConfig, WorkflowConfig, ImportResult } from '@/types/import';
import { toast } from 'sonner';
import { config } from '@/config/env';
import { getSupabaseToken } from '@/lib/auth-helpers';

interface ImportProgressProps {
  fileData: ExcelFileData;
  mappingConfig: MappingConfig;
  workflowConfig?: WorkflowConfig;
  onCompleted: (result: ImportResult) => void;
}

export default function ImportProgress({
  fileData,
  mappingConfig,
  workflowConfig,
  onCompleted
}: ImportProgressProps) {
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState<'uploading' | 'processing' | 'completed'>('uploading');
  const [result, setResult] = useState<ImportResult | null>(null);

  useEffect(() => {
    executeImport();
  }, []);

  const executeImport = async () => {
    try {
      setStatus('uploading');
      
      // Recréer le fichier depuis les données (simulation)
      // En production, on devrait garder le fichier original
      const token = await getSupabaseToken();
      
      // Pour l'instant, on simule l'import
      // Dans une vraie implémentation, on devrait re-uploader le fichier
      const formData = new FormData();
      // Note: En production, il faudrait garder le fichier original ou le re-télécharger
      
      setStatus('processing');
      setProgress(50);

      const response = await fetch(`${config.API_URL}/api/admin/import/execute`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (!response.ok) {
        throw new Error('Erreur lors de l\'import');
      }

      const responseData = await response.json();
      
      if (responseData.success) {
        setResult(responseData.data);
        setProgress(100);
        setStatus('completed');
        onCompleted(responseData.data);
        toast.success(`Import terminé: ${responseData.data.successCount} succès, ${responseData.data.errorCount} erreurs`);
      } else {
        throw new Error(responseData.message || 'Erreur lors de l\'import');
      }
    } catch (error: any) {
      console.error('Erreur import:', error);
      toast.error(error.message || 'Erreur lors de l\'import');
      setStatus('completed');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold mb-2">Import en cours</h2>
        <p className="text-sm text-gray-600">
          Veuillez patienter pendant le traitement des données...
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <div className="flex justify-between text-sm mb-2">
            <span className="text-gray-600">Progression</span>
            <span className="font-medium">{progress}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {status === 'processing' && (
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600" />
            <span>Traitement des données...</span>
          </div>
        )}

        {result && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-sm font-medium text-green-800">Succès</p>
              <p className="text-2xl font-bold text-green-900">{result.successCount}</p>
            </div>
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-sm font-medium text-red-800">Erreurs</p>
              <p className="text-2xl font-bold text-red-900">{result.errorCount}</p>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm font-medium text-blue-800">Ignorés</p>
              <p className="text-2xl font-bold text-blue-900">{result.skippedCount}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

