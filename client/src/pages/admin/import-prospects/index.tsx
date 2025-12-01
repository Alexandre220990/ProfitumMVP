import { useState } from 'react';
import { Upload, Map, Eye, Play, CheckCircle, Mail, User, Building2, Phone, MapPin, Globe, AlertTriangle } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { config } from '@/config/env';
import { useNavigate } from 'react-router-dom';

const STEPS = [
  { id: 1, name: 'Upload fichier', icon: Upload },
  { id: 2, name: 'Mapping colonnes', icon: Map },
  { id: 3, name: 'Dédoublonnage SIREN', icon: AlertTriangle },
  { id: 4, name: 'Prévisualisation', icon: Eye },
  { id: 5, name: 'Import', icon: Play }
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
  const [isDragging, setIsDragging] = useState(false);
  const [duplicatesData, setDuplicatesData] = useState<any>(null);
  const [isCheckingDuplicates, setIsCheckingDuplicates] = useState(false);
  const [excludedSirens, setExcludedSirens] = useState<string[]>([]);

  const processFile = async (selectedFile: File | undefined) => {
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

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      await processFile(selectedFile);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile) {
      await processFile(droppedFile);
    }
  };

  const handleCheckDuplicates = async () => {
    if (!file || !mapping || !mapping.email?.excelColumn) {
      toast.error('Veuillez mapper au moins la colonne email');
      return;
    }

    setIsCheckingDuplicates(true);

    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('file', file);
      formData.append('mapping', JSON.stringify(mapping));

      const response = await fetch(`${config.API_URL}/api/admin/import-prospects/check-duplicates`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      const result = await response.json();

      if (result.success) {
        setDuplicatesData(result.data);
        // Extraire les SIREN des doublons pour les exclure
        const excluded = result.data.duplicates.map((dup: any) => dup.siren);
        setExcludedSirens(excluded);
        setCurrentStep(3);
        if (result.data.duplicatesCount > 0) {
          toast.warning(`${result.data.duplicatesCount} doublon(s) SIREN détecté(s)`);
        } else {
          toast.success('Aucun doublon SIREN détecté');
        }
      } else {
        throw new Error(result.message || 'Erreur vérification doublons');
      }
    } catch (error: any) {
      console.error('Erreur vérification doublons:', error);
      toast.error(error.message || 'Erreur lors de la vérification des doublons');
    } finally {
      setIsCheckingDuplicates(false);
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
        setCurrentStep(4);
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
      formData.append('excludedSirens', JSON.stringify(excludedSirens));

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
        setCurrentStep(5);
        toast.success(`Import terminé: ${result.data.successCount} succès, ${result.data.errorCount} erreurs, ${result.data.skippedCount} doublons exclus`);
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
    setDuplicatesData(null);
    setExcludedSirens([]);
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
              <div
                className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors ${
                  isDragging
                    ? 'border-red-600 bg-red-50'
                    : 'border-gray-300 bg-white hover:border-gray-400'
                }`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <Upload className={`mx-auto h-12 w-12 ${isDragging ? 'text-red-600' : 'text-gray-400'}`} />
                <div className="mt-4">
                  <label htmlFor="file-upload" className="cursor-pointer">
                    <span className="mt-2 block text-sm font-medium text-gray-900">
                      {isDragging ? 'Déposez le fichier ici' : 'Cliquez pour sélectionner un fichier ou glissez-déposez'}
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
                  onClick={handleCheckDuplicates}
                  disabled={!mapping.email?.excelColumn || isCheckingDuplicates}
                >
                  {isCheckingDuplicates ? 'Vérification...' : 'Vérifier les doublons'}
                </Button>
              </div>
            </div>
          )}

          {currentStep === 3 && previewData.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold">Prévisualisation</h2>
                  <p className="text-sm text-gray-600 mt-1">
                    {previewData.length} prospect{previewData.length > 1 ? 's' : ''} affiché{previewData.length > 1 ? 's' : ''} sur {fileData?.totalRows} au total
                  </p>
                </div>
              </div>
              
              <div className="max-h-[500px] overflow-y-auto pr-2">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {previewData.slice(0, 15).map((row, idx) => {
                    const email = row.email || row.Email || row.EMAIL || '';
                    const firstname = row.firstname || row.firstName || row.FirstName || row.prénom || '';
                    const lastname = row.lastname || row.lastName || row.LastName || row.nom || '';
                    const company = row.company_name || row.companyName || row.CompanyName || row.entreprise || row.société || '';
                    const phone = row.phone_direct || row.phone || row.Phone || row.téléphone || row.telephone || '';
                    const city = row.city || row.City || row.ville || '';
                    const postalCode = row.postal_code || row.postalCode || row.PostalCode || row['code postal'] || row.cp || '';
                    const website = row.company_website || row.website || row.Website || row.site || '';
                    const siren = row.siren || row.SIREN || '';
                    
                    const fullName = [firstname, lastname].filter(Boolean).join(' ') || email.split('@')[0];
                    
                    return (
                      <Card key={idx} className="p-3 hover:shadow-md transition-shadow border border-gray-200">
                        <div className="space-y-2">
                          {/* Nom/Email principal */}
                          <div className="flex items-start gap-2">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1.5 mb-1">
                                <User className="h-3.5 w-3.5 text-gray-400 flex-shrink-0 mt-0.5" />
                                <span className="font-medium text-sm text-gray-900 truncate">
                                  {fullName}
                                </span>
                              </div>
                              {email && (
                                <div className="flex items-center gap-1.5 text-xs text-gray-600 truncate">
                                  <Mail className="h-3 w-3 text-gray-400 flex-shrink-0" />
                                  <span className="truncate">{email}</span>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Entreprise */}
                          {company && (
                            <div className="flex items-center gap-1.5 text-xs text-gray-600">
                              <Building2 className="h-3 w-3 text-gray-400 flex-shrink-0" />
                              <span className="truncate">{company}</span>
                            </div>
                          )}

                          {/* Téléphone */}
                          {phone && (
                            <div className="flex items-center gap-1.5 text-xs text-gray-600">
                              <Phone className="h-3 w-3 text-gray-400 flex-shrink-0" />
                              <span>{phone}</span>
                            </div>
                          )}

                          {/* Localisation */}
                          {(city || postalCode) && (
                            <div className="flex items-center gap-1.5 text-xs text-gray-600">
                              <MapPin className="h-3 w-3 text-gray-400 flex-shrink-0" />
                              <span className="truncate">
                                {[city, postalCode].filter(Boolean).join(' ')}
                              </span>
                            </div>
                          )}

                          {/* Site web */}
                          {website && (
                            <div className="flex items-center gap-1.5 text-xs text-gray-600 truncate">
                              <Globe className="h-3 w-3 text-gray-400 flex-shrink-0" />
                              <span className="truncate">{website}</span>
                            </div>
                          )}

                          {/* SIREN */}
                          {siren && (
                            <div className="text-xs text-gray-500">
                              SIREN: {siren}
                            </div>
                          )}
                        </div>
                      </Card>
                    );
                  })}
                </div>
              </div>

              {previewData.length > 15 && (
                <div className="text-center text-sm text-gray-500 py-2">
                  ... et {previewData.length - 15} autre{previewData.length - 15 > 1 ? 's' : ''} prospect{previewData.length - 15 > 1 ? 's' : ''}
                </div>
              )}

              <div className="flex justify-end gap-2 pt-4 border-t">
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

