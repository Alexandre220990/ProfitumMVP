import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { AlertCircle, CheckCircle, XCircle } from 'lucide-react';
import { ExcelFileData, MappingConfig, WorkflowConfig, PreviewData } from '@/types/import';
import { toast } from 'sonner';
import { config } from '@/config/env';
import { getSupabaseToken } from '@/lib/auth-helpers';

interface PreviewTableProps {
  fileData: ExcelFileData;
  mappingConfig: MappingConfig;
  workflowConfig?: WorkflowConfig;
  onPreviewReady: (previewData: PreviewData) => void;
  previewData?: PreviewData;
}

export default function PreviewTable({
  fileData,
  mappingConfig,
  workflowConfig: _workflowConfig,
  onPreviewReady,
  previewData: initialPreviewData
}: PreviewTableProps) {
  const [previewData, setPreviewData] = useState<PreviewData | undefined>(initialPreviewData);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!initialPreviewData) {
      loadPreview();
    }
  }, []);

  const loadPreview = async () => {
    setIsLoading(true);
    try {
      const token = await getSupabaseToken();
      const response = await fetch(`${config.API_URL}/api/admin/import/preview`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          fileData: {
            columns: fileData.columns,
            rows: fileData.sampleRows || fileData.rows.slice(0, 10)
          },
          mappingConfig
        })
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la prévisualisation');
      }

      const result = await response.json();
      if (result.success) {
        setPreviewData(result.data);
        onPreviewReady(result.data);
      }
    } catch (error: any) {
      console.error('Erreur prévisualisation:', error);
      toast.error(error.message || 'Erreur lors de la prévisualisation');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600" />
      </div>
    );
  }

  if (!previewData) {
    return null;
  }

  const errorCount = previewData.validationErrors.length;
  const validCount = previewData.sampleRows.length - errorCount;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold mb-2">Prévisualisation des données</h2>
        <p className="text-sm text-gray-600">
          Vérifiez les données transformées avant l'import
        </p>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-green-800">Lignes valides</p>
              <p className="text-2xl font-bold text-green-900">{validCount}</p>
            </div>
          </div>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <XCircle className="h-5 w-5 text-red-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-red-800">Erreurs</p>
              <p className="text-2xl font-bold text-red-900">{errorCount}</p>
            </div>
          </div>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center">
            <AlertCircle className="h-5 w-5 text-blue-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-blue-800">Total lignes</p>
              <p className="text-2xl font-bold text-blue-900">{fileData.totalRows}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Erreurs de validation */}
      {errorCount > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h3 className="text-sm font-medium text-red-800 mb-2">Erreurs de validation</h3>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {previewData.validationErrors.map((error, index) => (
              <div key={index} className="text-sm text-red-700">
                <span className="font-medium">Ligne {error.rowIndex + 1}:</span> {error.field} - {error.error}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tableau de prévisualisation */}
      <div className="border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Ligne
                </th>
                {Object.keys(previewData.transformedRows[0] || {}).map((field) => (
                  <th
                    key={field}
                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase"
                  >
                    {field}
                  </th>
                ))}
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Statut
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {previewData.transformedRows.slice(0, 10).map((row, index) => {
                const rowErrors = previewData.validationErrors.filter(e => e.rowIndex === index);
                return (
                  <tr key={index}>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">
                      {index + 1}
                    </td>
                    {Object.values(row).map((value, cellIndex) => (
                      <td key={cellIndex} className="px-4 py-3 text-sm text-gray-500">
                        {value === null || value === undefined ? (
                          <span className="text-gray-400">—</span>
                        ) : (
                          String(value)
                        )}
                      </td>
                    ))}
                    <td className="px-4 py-3">
                      {rowErrors.length > 0 ? (
                        <XCircle className="h-5 w-5 text-red-600" />
                      ) : (
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex justify-end space-x-4">
        <Button variant="outline" onClick={() => window.history.back()}>
          Retour
        </Button>
        <Button
          onClick={() => {
            if (previewData) {
              onPreviewReady(previewData);
            }
          }}
          className="bg-red-600 hover:bg-red-700"
        >
          Continuer vers l'import
        </Button>
      </div>
    </div>
  );
}

