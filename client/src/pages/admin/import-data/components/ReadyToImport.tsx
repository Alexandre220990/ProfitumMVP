import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Play, AlertCircle, CheckCircle, XCircle, ArrowLeft, Database, Package, Calendar, Users, ChevronDown, ChevronUp } from 'lucide-react';
import { PreviewData, MappingConfig } from '@/types/import';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';

interface ReadyToImportProps {
  previewData: PreviewData;
  mappingConfig: MappingConfig;
  fileData: {
    columns: string[];
    totalRows: number;
  };
  onImportStart: () => void;
  onGoBack: () => void;
}

export default function ReadyToImport({
  previewData,
  mappingConfig,
  fileData,
  onImportStart,
  onGoBack
}: ReadyToImportProps) {
  const [errorsExpanded, setErrorsExpanded] = useState(true);
  const [mappingExpanded, setMappingExpanded] = useState(true);

  const errorCount = previewData.validationErrors.length;
  const totalPreviewRows = previewData.transformedRows?.length || previewData.sampleRows?.length || 0;
  // Compter les lignes uniques avec erreurs
  const rowsWithErrors = new Set(previewData.validationErrors.map(e => e.rowIndex));
  const validCount = totalPreviewRows - rowsWithErrors.size;

  // Grouper les erreurs par ligne
  const errorsByRow = previewData.validationErrors.reduce((acc, error) => {
    if (!acc[error.rowIndex]) {
      acc[error.rowIndex] = [];
    }
    acc[error.rowIndex].push(error);
    return acc;
  }, {} as Record<number, typeof previewData.validationErrors>);

  // Compter les règles de mapping par table
  const clientRulesCount = mappingConfig.rules.filter(r => r.databaseField).length;
  const produitRulesCount = mappingConfig.relatedTables?.produits?.rules.filter(r => r.databaseField).length || 0;
  const rdvRulesCount = mappingConfig.relatedTables?.rdv?.rules.filter(r => r.databaseField).length || 0;
  const expertRulesCount = mappingConfig.relatedTables?.expertAssignments?.rules.filter(r => r.databaseField).length || 0;

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Prêt à importer</h2>
        <p className="mt-2 text-sm text-gray-600">
          Vérifiez les informations ci-dessous avant de démarrer l'import
        </p>
      </div>

      {/* Statistiques globales */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4 bg-green-50 border-green-200">
          <div className="flex items-center">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-green-800">Lignes valides</p>
              <p className="text-2xl font-bold text-green-900">{validCount}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4 bg-red-50 border-red-200">
          <div className="flex items-center">
            <XCircle className="h-5 w-5 text-red-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-red-800">Erreurs détectées</p>
              <p className="text-2xl font-bold text-red-900">{errorCount}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4 bg-blue-50 border-blue-200">
          <div className="flex items-center">
            <AlertCircle className="h-5 w-5 text-blue-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-blue-800">Total lignes</p>
              <p className="text-2xl font-bold text-blue-900">{fileData.totalRows}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Section Erreurs */}
      {errorCount > 0 && (
        <Card className="border-red-200">
          <Collapsible open={errorsExpanded} onOpenChange={setErrorsExpanded}>
            <CollapsibleTrigger className="w-full">
              <div className="flex items-center justify-between p-4 bg-red-50 hover:bg-red-100 transition-colors">
                <div className="flex items-center gap-3">
                  <XCircle className="h-5 w-5 text-red-600" />
                  <div className="text-left">
                    <h3 className="text-sm font-semibold text-red-800">
                      {errorCount} erreur(s) détectée(s)
                    </h3>
                    <p className="text-xs text-red-700 mt-1">
                      Vous pouvez corriger ces erreurs en retournant à l'étape de mapping
                    </p>
                  </div>
                </div>
                {errorsExpanded ? (
                  <ChevronUp className="h-5 w-5 text-red-600" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-red-600" />
                )}
              </div>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="p-4 space-y-4">
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Erreurs de validation</AlertTitle>
                  <AlertDescription>
                    Les lignes suivantes contiennent des erreurs. Vous pouvez continuer l'import malgré ces erreurs, 
                    ou retourner à l'étape de mapping pour les corriger.
                  </AlertDescription>
                </Alert>

                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {Object.entries(errorsByRow).map(([rowIndex, errors]) => (
                    <div key={rowIndex} className="border border-red-200 rounded-lg p-3 bg-red-50">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant="destructive" className="text-xs">
                              Ligne {parseInt(rowIndex) + 1}
                            </Badge>
                            <span className="text-xs text-gray-600">
                              {errors.length} erreur(s)
                            </span>
                          </div>
                          <div className="space-y-1">
                            {errors.map((error, idx) => (
                              <div key={idx} className="text-sm text-red-700">
                                <span className="font-medium">{error.field}:</span> {error.error}
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex justify-end pt-2 border-t">
                  <Button
                    variant="outline"
                    onClick={onGoBack}
                    className="border-red-300 text-red-700 hover:bg-red-50"
                  >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Retourner au mapping pour corriger
                  </Button>
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>
        </Card>
      )}

      {/* Récapitulatif du mapping */}
      <Card>
        <Collapsible open={mappingExpanded} onOpenChange={setMappingExpanded}>
          <CollapsibleTrigger className="w-full">
            <div className="flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 transition-colors">
              <div className="flex items-center gap-3">
                <Database className="h-5 w-5 text-gray-600" />
                <div className="text-left">
                  <h3 className="text-sm font-semibold text-gray-900">
                    Récapitulatif du mapping
                  </h3>
                  <p className="text-xs text-gray-600 mt-1">
                    Aperçu de la configuration de mapping des colonnes
                  </p>
                </div>
              </div>
              {mappingExpanded ? (
                <ChevronUp className="h-5 w-5 text-gray-600" />
              ) : (
                <ChevronDown className="h-5 w-5 text-gray-600" />
              )}
            </div>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="p-4 space-y-4">
              {/* Informations générales */}
              <div className="grid grid-cols-2 gap-4 pb-4 border-b">
                <div>
                  <p className="text-xs text-gray-500 mb-1">Partenaire / Source</p>
                  <p className="text-sm font-medium text-gray-900">{mappingConfig.partnerName}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Type d'entité</p>
                  <Badge variant="outline" className="capitalize">
                    {mappingConfig.entityType}
                  </Badge>
                </div>
              </div>

              {/* Table Client */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Database className="h-4 w-4 text-gray-600" />
                  <h4 className="text-sm font-semibold text-gray-900">Table Client</h4>
                  <Badge variant="secondary" className="text-xs">
                    {clientRulesCount} champ(s) mappé(s)
                  </Badge>
                </div>
                <div className="ml-6 space-y-1">
                  {mappingConfig.rules
                    .filter(r => r.databaseField)
                    .map((rule, idx) => (
                      <div key={idx} className="text-xs text-gray-600 flex items-center gap-2">
                        <span className="font-medium text-gray-500">{rule.excelColumn}</span>
                        <span>→</span>
                        <span className="font-medium">{rule.databaseField}</span>
                        {rule.isRequired && (
                          <Badge variant="outline" className="text-xs">Requis</Badge>
                        )}
                      </div>
                    ))}
                </div>
              </div>

              {/* Table Produits */}
              {mappingConfig.relatedTables?.produits?.enabled && produitRulesCount > 0 && (
                <div className="space-y-2 pt-2 border-t">
                  <div className="flex items-center gap-2">
                    <Package className="h-4 w-4 text-gray-600" />
                    <h4 className="text-sm font-semibold text-gray-900">Table Produits</h4>
                    <Badge variant="secondary" className="text-xs">
                      {produitRulesCount} champ(s) mappé(s)
                    </Badge>
                  </div>
                  <div className="ml-6 space-y-1">
                    {mappingConfig.relatedTables.produits.rules
                      .filter(r => r.databaseField)
                      .map((rule, idx) => (
                        <div key={idx} className="text-xs text-gray-600 flex items-center gap-2">
                          <span className="font-medium text-gray-500">{rule.excelColumn}</span>
                          <span>→</span>
                          <span className="font-medium">{rule.databaseField}</span>
                          {rule.isRequired && (
                            <Badge variant="outline" className="text-xs">Requis</Badge>
                          )}
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {/* Table RDV */}
              {mappingConfig.relatedTables?.rdv?.enabled && rdvRulesCount > 0 && (
                <div className="space-y-2 pt-2 border-t">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-gray-600" />
                    <h4 className="text-sm font-semibold text-gray-900">Table RDV</h4>
                    <Badge variant="secondary" className="text-xs">
                      {rdvRulesCount} champ(s) mappé(s)
                    </Badge>
                  </div>
                  <div className="ml-6 space-y-1">
                    {mappingConfig.relatedTables.rdv.rules
                      .filter(r => r.databaseField)
                      .map((rule, idx) => (
                        <div key={idx} className="text-xs text-gray-600 flex items-center gap-2">
                          <span className="font-medium text-gray-500">{rule.excelColumn}</span>
                          <span>→</span>
                          <span className="font-medium">{rule.databaseField}</span>
                          {rule.isRequired && (
                            <Badge variant="outline" className="text-xs">Requis</Badge>
                          )}
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {/* Table Expert Assignments */}
              {mappingConfig.relatedTables?.expertAssignments?.enabled && expertRulesCount > 0 && (
                <div className="space-y-2 pt-2 border-t">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-gray-600" />
                    <h4 className="text-sm font-semibold text-gray-900">Table Expert Assignments</h4>
                    <Badge variant="secondary" className="text-xs">
                      {expertRulesCount} champ(s) mappé(s)
                    </Badge>
                  </div>
                  <div className="ml-6 space-y-1">
                    {mappingConfig.relatedTables.expertAssignments.rules
                      .filter(r => r.databaseField)
                      .map((rule, idx) => (
                        <div key={idx} className="text-xs text-gray-600 flex items-center gap-2">
                          <span className="font-medium text-gray-500">{rule.excelColumn}</span>
                          <span>→</span>
                          <span className="font-medium">{rule.databaseField}</span>
                          {rule.isRequired && (
                            <Badge variant="outline" className="text-xs">Requis</Badge>
                          )}
                        </div>
                      ))}
                  </div>
                </div>
              )}

              <div className="flex justify-end pt-2 border-t">
                <Button
                  variant="outline"
                  onClick={onGoBack}
                  size="sm"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Modifier le mapping
                </Button>
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>
      </Card>

      {/* Message final et actions */}
      <div className="flex items-center justify-between pt-4 border-t">
        <div className="flex-1">
          {errorCount === 0 ? (
            <p className="text-sm text-green-700 flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              Toutes les données sont valides. Vous pouvez procéder à l'import.
            </p>
          ) : (
            <p className="text-sm text-amber-700 flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              {errorCount} erreur(s) détectée(s). Vous pouvez continuer malgré les erreurs.
            </p>
          )}
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={onGoBack}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Retour
          </Button>
          <Button
            onClick={onImportStart}
            className="bg-red-600 hover:bg-red-700"
            size="lg"
          >
            <Play className="mr-2 h-5 w-5" />
            Démarrer l'import
          </Button>
        </div>
      </div>
    </div>
  );
}

