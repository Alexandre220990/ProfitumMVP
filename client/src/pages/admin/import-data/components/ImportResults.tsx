import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, AlertCircle, Download } from 'lucide-react';
import { ImportResult } from '@/types/import';

interface ImportResultsProps {
  result: ImportResult;
  onReset: () => void;
}

export default function ImportResults({ result, onReset }: ImportResultsProps) {
  const successRate = result.totalRows > 0
    ? ((result.successCount / result.totalRows) * 100).toFixed(1)
    : '0';

  const handleDownloadReport = () => {
    // Générer un rapport CSV
    const csvRows = [
      ['Ligne', 'Statut', 'ID Entité', 'Erreurs'].join(','),
      ...result.results.map(r => [
        r.rowIndex + 1,
        r.success ? 'Succès' : 'Erreur',
        r.entityId || '',
        r.errors?.join('; ') || ''
      ].join(','))
    ];

    const csvContent = csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `import-report-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold mb-2">Résultats de l'import</h2>
        <p className="text-sm text-gray-600">
          Import terminé avec {successRate}% de succès
        </p>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm font-medium text-blue-800">Total</p>
          <p className="text-2xl font-bold text-blue-900">{result.totalRows}</p>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-green-800">Succès</p>
              <p className="text-2xl font-bold text-green-900">{result.successCount}</p>
            </div>
          </div>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <XCircle className="h-5 w-5 text-red-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-red-800">Erreurs</p>
              <p className="text-2xl font-bold text-red-900">{result.errorCount}</p>
            </div>
          </div>
        </div>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center">
            <AlertCircle className="h-5 w-5 text-yellow-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-yellow-800">Ignorés</p>
              <p className="text-2xl font-bold text-yellow-900">{result.skippedCount}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Liste des erreurs */}
      {result.errorCount > 0 && (
        <div className="border rounded-lg overflow-hidden">
          <div className="bg-red-50 px-4 py-3 border-b">
            <h3 className="text-sm font-medium text-red-800">
              Erreurs détaillées ({result.errorCount})
            </h3>
          </div>
          <div className="max-h-96 overflow-y-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Ligne
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Erreurs
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {result.results
                  .filter(r => !r.success && r.errors && r.errors.length > 0)
                  .map((row, index) => (
                    <tr key={index}>
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">
                        {row.rowIndex + 1}
                      </td>
                      <td className="px-4 py-3 text-sm text-red-600">
                        {row.errors?.join(', ')}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex justify-end space-x-4">
        <Button variant="outline" onClick={handleDownloadReport}>
          <Download className="mr-2 h-4 w-4" />
          Télécharger le rapport
        </Button>
        <Button onClick={onReset} className="bg-red-600 hover:bg-red-700">
          Nouvel import
        </Button>
      </div>
    </div>
  );
}

