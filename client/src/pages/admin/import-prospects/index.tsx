import { useState } from 'react';
import { Upload, Map, Eye, Play, CheckCircle } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
import { config } from '@/config/env';
import { useNavigate } from 'react-router-dom';

const STEPS = [
  { id: 1, name: 'Upload fichier', icon: Upload },
  { id: 2, name: 'Mapping colonnes', icon: Map },
  { id: 3, name: 'Prévisualisation', icon: Eye },
  { id: 4, name: 'Import', icon: Play }
];

interface FileData {
  columns: string[];
  totalRows: number;
  sampleRows: any[][];
}

interface Mapping {
  [key: string]: {
    excelColumn: string;
    defaultValue?: string;
  };
}

const PROSPECT_FIELDS = [
  { value: 'email', label: 'Email', required: true },
  { value: 'firstname', label: 'Prénom', required: false },
  { value: 'lastname', label: 'Nom', required: false },
  { value: 'company_name', label: 'Nom entreprise', required: false },
  { value: 'siren', label: 'SIREN', required: false },
  { value: 'phone_direct', label: 'Téléphone direct', required: false },
  { value: 'company_website', label: 'Site web', required: false },
  { value: 'adresse', label: 'Adresse', required: false },
  { value: 'city', label: 'Ville', required: false },
  { value: 'postal_code', label: 'Code postal', required: false },
  { value: 'source', label: 'Source', required: false }
];

export default function ImportProspects() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [file, setFile] = useState<File | null>(null);
  const [fileData, setFileData] = useState<FileData | null>(null);
  const [mapping, setMapping] = useState<Mapping>({});
  const [previewData, setPreviewData] = useState<any[]>([]);
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState<any>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    // Vérifier le type
    const allowedTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
      'text/csv'
    ];

    if (!allowedTypes.includes(selectedFile.type) && !selectedFile.name.match(/\.(xlsx|xls|csv)$/i)) {
      toast.error('Format de fichier non supporté');
      return;
    }

    if (selectedFile.size > 10 * 1024 * 1024) {
      toast.error('Fichier trop volumineux (max 10MB)');
      return;
    }

    setFile(selectedFile);

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);

      const token = localStorage.getItem('token');
      const response = await fetch(`${config.API_URL}/api/admin/import-prospects/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      const result = await response.json();

      if (result.success) {
        setFileData(result.data);
        // Auto-mapping basique
        const autoMapping: Mapping = {};
        result.data.columns.forEach((col: string) => {
          const colLower = col.toLowerCase();
          if (colLower.includes('email') || colLower.includes('mail')) {
            autoMapping.email = { excelColumn: col };
          } else if (colLower.includes('prenom') || colLower.includes('firstname') || colLower.includes('prénom')) {
            autoMapping.firstname = { excelColumn: col };
          } else if (colLower.includes('nom') || colLower.includes('lastname') || colLower === 'name') {
            autoMapping.lastname = { excelColumn: col };
          } else if (colLower.includes('entreprise') || colLower.includes('company') || colLower.includes('société')) {
            autoMapping.company_name = { excelColumn: col };
          } else if (colLower.includes('siren')) {
            autoMapping.siren = { excelColumn: col };
          } else if (colLower.includes('telephone') || colLower.includes('phone') || colLower.includes('tél')) {
            autoMapping.phone_direct = { excelColumn: col };
          } else if (colLower.includes('site') || colLower.includes('website') || colLower.includes('web')) {
            autoMapping.company_website = { excelColumn: col };
          } else if (colLower.includes('adresse') || colLower.includes('address')) {
            autoMapping.adresse = { excelColumn: col };
          } else if (colLower.includes('ville') || colLower.includes('city')) {
            autoMapping.city = { excelColumn: col };
          } else if (colLower.includes('code postal') || colLower.includes('postal') || colLower.includes('cp')) {
            autoMapping.postal_code = { excelColumn: col };
          }
        });
        autoMapping.source = { excelColumn: '', defaultValue: 'import_csv' };
        setMapping(autoMapping);
        setCurrentStep(2);
        toast.success(`Fichier uploadé (${result.data.totalRows} lignes)`);
      } else {
        throw new Error(result.message || 'Erreur upload');
      }
    } catch (error: any) {
      console.error('Erreur upload:', error);
      toast.error(error.message || 'Erreur lors de l\'upload');
      setFile(null);
    }
  };

  const handlePreview = async () => {
    if (!fileData || !mapping || !mapping.email?.excelColumn) {
      toast.error('Veuillez mapper au moins la colonne email');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${config.API_URL}/api/admin/import-prospects/preview`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          fileData: {
            columns: fileData.columns,
            rows: fileData.sampleRows
          },
          mapping
        })
      });

      const result = await response.json();

      if (result.success) {
        setPreviewData(result.data.transformedRows);
        setCurrentStep(3);
      } else {
        throw new Error(result.message || 'Erreur prévisualisation');
      }
    } catch (error: any) {
      console.error('Erreur prévisualisation:', error);
      toast.error(error.message || 'Erreur lors de la prévisualisation');
    }
  };

  const handleImport = async () => {
    if (!file || !mapping) {
      toast.error('Fichier ou mapping manquant');
      return;
    }

    setIsImporting(true);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('mapping', JSON.stringify(mapping));

      const token = localStorage.getItem('token');
      const response = await fetch(`${config.API_URL}/api/admin/import-prospects/execute`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      const result = await response.json();

      if (result.success) {
        setImportResult(result.data);
        setCurrentStep(4);
        toast.success(`Import terminé: ${result.data.successCount} succès, ${result.data.errorCount} erreurs`);
      } else {
        throw new Error(result.message || 'Erreur import');
      }
    } catch (error: any) {
      console.error('Erreur import:', error);
      toast.error(error.message || 'Erreur lors de l\'import');
    } finally {
      setIsImporting(false);
    }
  };

  const handleReset = () => {
    setCurrentStep(1);
    setFile(null);
    setFileData(null);
    setMapping({});
    setPreviewData([]);
    setImportResult(null);
  };

  return (
    <div className="space-y-6">

        {/* Stepper */}
        <div className="mb-8">
          <nav aria-label="Progress">
            <ol className="flex items-center">
              {STEPS.map((step, stepIdx) => {
                const Icon = step.icon;
                const isActive = currentStep === step.id;
                const isCompleted = currentStep > step.id;

                return (
                  <li key={step.id} className={`${stepIdx !== STEPS.length - 1 ? 'pr-8 sm:pr-20' : ''} relative`}>
                    <div className="flex items-center">
                      <div
                        className={`flex h-10 w-10 items-center justify-center rounded-full border-2 ${
                          isCompleted
                            ? 'border-red-600 bg-red-600'
                            : isActive
                            ? 'border-red-600 bg-white'
                            : 'border-gray-300 bg-white'
                        }`}
                      >
                        {isCompleted ? (
                          <CheckCircle className="h-6 w-6 text-white" />
                        ) : (
                          <Icon
                            className={`h-6 w-6 ${
                              isActive ? 'text-red-600' : 'text-gray-400'
                            }`}
                          />
                        )}
                      </div>
                      <div className="ml-4 min-w-0">
                        <p
                          className={`text-sm font-medium ${
                            isActive ? 'text-red-600' : 'text-gray-500'
                          }`}
                        >
                          {step.name}
                        </p>
                      </div>
                    </div>
                    {stepIdx !== STEPS.length - 1 && (
                      <div
                        className={`absolute top-5 left-5 -ml-px h-0.5 w-full ${
                          isCompleted ? 'bg-red-600' : 'bg-gray-300'
                        }`}
                        aria-hidden="true"
                      />
                    )}
                  </li>
                );
              })}
            </ol>
          </nav>
        </div>

        {/* Step Content */}
        <Card className="p-6">
          {currentStep === 1 && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">Upload du fichier Excel</h2>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center">
                <Upload className="mx-auto h-12 w-12 text-gray-400" />
                <div className="mt-4">
                  <label htmlFor="file-upload" className="cursor-pointer">
                    <span className="mt-2 block text-sm font-medium text-gray-900">
                      Cliquez pour sélectionner un fichier
                    </span>
                  </label>
                  <input
                    id="file-upload"
                    name="file-upload"
                    type="file"
                    className="sr-only"
                    accept=".xlsx,.xls,.csv"
                    onChange={handleFileSelect}
                  />
                </div>
                <p className="mt-2 text-xs text-gray-500">
                  Formats acceptés: .xlsx, .xls, .csv (max 10MB)
                </p>
              </div>
            </div>
          )}

          {currentStep === 2 && fileData && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">Mapping des colonnes</h2>
              <p className="text-sm text-gray-600">
                Associez les colonnes de votre fichier Excel aux champs de la base de données
              </p>
              
              <div className="space-y-4">
                {PROSPECT_FIELDS.map((field) => (
                  <div key={field.value} className="flex items-center gap-4">
                    <Label className="w-48 font-medium">
                      {field.label}
                      {field.required && <span className="text-red-600 ml-1">*</span>}
                    </Label>
                    <Select
                      value={mapping[field.value]?.excelColumn || '__none__'}
                      onValueChange={(value) => {
                        setMapping({
                          ...mapping,
                          [field.value]: {
                            excelColumn: value === '__none__' ? '' : value,
                            defaultValue: field.value === 'source' ? 'import_csv' : undefined
                          }
                        });
                      }}
                    >
                      <SelectTrigger className="flex-1">
                        <SelectValue placeholder="Sélectionner une colonne" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__none__">Aucune colonne</SelectItem>
                        {fileData.columns.map((col) => (
                          <SelectItem key={col} value={col}>
                            {col}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ))}
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setCurrentStep(1)}>
                  Retour
                </Button>
                <Button
                  onClick={handlePreview}
                  disabled={!mapping.email?.excelColumn}
                >
                  Prévisualiser
                </Button>
              </div>
            </div>
          )}

          {currentStep === 3 && previewData.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">Prévisualisation</h2>
              <p className="text-sm text-gray-600">
                Vérifiez les données transformées avant l'import ({fileData?.totalRows} lignes au total)
              </p>
              
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      {Object.keys(previewData[0] || {}).map((key) => (
                        <TableHead key={key}>{key}</TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {previewData.slice(0, 10).map((row, idx) => (
                      <TableRow key={idx}>
                        {Object.values(row).map((value, cellIdx) => {
                          const displayValue = value !== null && value !== undefined && value !== '' 
                            ? String(value) 
                            : null;
                          return (
                            <TableCell key={cellIdx}>
                              {displayValue || <span className="text-gray-400">-</span>}
                            </TableCell>
                          );
                        })}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setCurrentStep(2)}>
                  Retour
                </Button>
                <Button onClick={handleImport} disabled={isImporting}>
                  {isImporting ? 'Import en cours...' : 'Importer'}
                </Button>
              </div>
            </div>
          )}

          {currentStep === 4 && importResult && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">Résultats de l'import</h2>
              
              <div className="grid grid-cols-3 gap-4">
                <Card className="p-4">
                  <div className="text-sm text-gray-600">Total</div>
                  <div className="text-2xl font-bold">{importResult.totalRows}</div>
                </Card>
                <Card className="p-4 bg-green-50">
                  <div className="text-sm text-green-600">Succès</div>
                  <div className="text-2xl font-bold text-green-700">{importResult.successCount}</div>
                </Card>
                <Card className="p-4 bg-red-50">
                  <div className="text-sm text-red-600">Erreurs</div>
                  <div className="text-2xl font-bold text-red-700">{importResult.errorCount}</div>
                </Card>
              </div>

              {importResult.errors && importResult.errors.length > 0 && (
                <Card className="p-4">
                  <h3 className="font-semibold mb-2">Erreurs détectées</h3>
                  <div className="max-h-60 overflow-y-auto">
                    {importResult.errors.slice(0, 20).map((error: any, idx: number) => (
                      <div key={idx} className="text-sm text-red-600 mb-1">
                        Ligne {error.row}: {error.error}
                      </div>
                    ))}
                  </div>
                </Card>
              )}

              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={handleReset}>
                  Nouvel import
                </Button>
                <Button onClick={() => {
                  navigate('/admin/prospection?tab=list');
                  window.location.reload();
                }}>
                  Voir les prospects
                </Button>
              </div>
            </div>
          )}
        </Card>
    </div>
  );
}

