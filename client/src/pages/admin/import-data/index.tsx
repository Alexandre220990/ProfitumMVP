import { useState } from 'react';
import { Upload, FileText, Map, Settings, Eye, Play, CheckCircle } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { ImportState, EntityType } from '@/types/import';
import FileUploader from './components/FileUploader';
import ColumnMapper from './components/ColumnMapper';
import AdvancedConfigStep from './components/AdvancedConfigStep';
import PreviewTable from './components/PreviewTable';
import ImportProgress from './components/ImportProgress';
import ImportResults from './components/ImportResults';
import ReadyToImport from './components/ReadyToImport';

const STEPS = [
  { id: 1, name: 'Upload fichier', icon: Upload },
  { id: 2, name: 'Type d\'import', icon: FileText },
  { id: 3, name: 'Mapping colonnes', icon: Map },
  { id: 4, name: 'Configuration', icon: Settings },
  { id: 5, name: 'Prévisualisation', icon: Eye },
  { id: 6, name: 'Import', icon: Play }
];

export default function AdminImportData() {
  const [state, setState] = useState<ImportState>({
    currentStep: 1,
    isImporting: false
  });

  const handleFileUploaded = (fileData: any) => {
    setState(prev => ({
      ...prev,
      fileData,
      currentStep: 2
    }));
  };

  const handleEntityTypeSelected = (entityType: EntityType) => {
    setState(prev => ({
      ...prev,
      entityType,
      currentStep: 3
    }));
  };

  const handleMappingConfigured = (mappingConfig: any) => {
    setState(prev => ({
      ...prev,
      mappingConfig,
      currentStep: prev.entityType === 'client' ? 4 : 5
    }));
  };

  const handleWorkflowConfigured = (workflowConfig: any) => {
    setState(prev => ({
      ...prev,
      workflowConfig,
      currentStep: 5
    }));
  };

  const handlePreviewReady = (previewData: any) => {
    setState(prev => ({
      ...prev,
      previewData,
      currentStep: 6
    }));
  };

  const handleImportStarted = () => {
    setState(prev => ({
      ...prev,
      isImporting: true
    }));
  };

  const handleImportCompleted = (importResult: any) => {
    setState(prev => ({
      ...prev,
      importResult,
      isImporting: false
    }));
  };

  const handleReset = () => {
    setState({
      currentStep: 1,
      isImporting: false
    });
  };

  const handleGoBackToMapping = () => {
    setState(prev => ({
      ...prev,
      currentStep: 3 // Retour à l'étape de mapping
    }));
  };

  const canGoToStep = (step: number): boolean => {
    switch (step) {
      case 1:
        return true;
      case 2:
        return !!state.fileData;
      case 3:
        return !!state.fileData && !!state.entityType;
      case 4:
        return !!state.fileData && !!state.entityType && !!state.mappingConfig;
      case 5:
        return !!state.fileData && !!state.entityType && !!state.mappingConfig && 
               (state.entityType !== 'client' || !!state.workflowConfig);
      case 6:
        return !!state.fileData && !!state.entityType && !!state.mappingConfig && !!state.previewData;
      default:
        return false;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Import de données</h1>
          <p className="mt-2 text-sm text-gray-600">
            Importez des Clients, Experts ou Apporteurs depuis des fichiers Excel avec mapping flexible
          </p>
        </div>

        {/* Stepper */}
        <div className="mb-8">
          <nav aria-label="Progress">
            <ol className="flex items-center">
              {STEPS.map((step, stepIdx) => {
                const Icon = step.icon;
                const isActive = state.currentStep === step.id;
                const isCompleted = state.currentStep > step.id;
                const isAccessible = canGoToStep(step.id);

                return (
                  <li key={step.id} className={`${stepIdx !== STEPS.length - 1 ? 'pr-8 sm:pr-20' : ''} relative`}>
                    <div className="flex items-center">
                      <div
                        className={`flex h-10 w-10 items-center justify-center rounded-full border-2 ${
                          isCompleted
                            ? 'border-red-600 bg-red-600'
                            : isActive
                            ? 'border-red-600 bg-white'
                            : isAccessible
                            ? 'border-gray-300 bg-white'
                            : 'border-gray-300 bg-gray-100'
                        }`}
                      >
                        {isCompleted ? (
                          <CheckCircle className="h-6 w-6 text-white" />
                        ) : (
                          <Icon
                            className={`h-6 w-6 ${
                              isActive ? 'text-red-600' : isAccessible ? 'text-gray-500' : 'text-gray-400'
                            }`}
                          />
                        )}
                      </div>
                      <div className="ml-4 min-w-0">
                        <p
                          className={`text-sm font-medium ${
                            isActive ? 'text-red-600' : isAccessible ? 'text-gray-900' : 'text-gray-500'
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
          {state.currentStep === 1 && (
            <FileUploader onFileUploaded={handleFileUploaded} />
          )}

          {state.currentStep === 2 && state.fileData && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">Sélectionnez le type d'import</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {(['client', 'expert', 'apporteur'] as EntityType[]).map((type) => (
                  <button
                    key={type}
                    onClick={() => handleEntityTypeSelected(type)}
                    className="p-6 border-2 border-gray-200 rounded-lg hover:border-red-600 hover:bg-red-50 transition-colors text-left"
                  >
                    <h3 className="font-semibold text-lg capitalize mb-2">{type}</h3>
                    <p className="text-sm text-gray-600">
                      {type === 'client' && 'Import de clients avec produits éligibles'}
                      {type === 'expert' && 'Import d\'experts avec spécialisations'}
                      {type === 'apporteur' && 'Import d\'apporteurs d\'affaires'}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {state.currentStep === 3 && state.fileData && state.entityType && (
            <ColumnMapper
              fileData={state.fileData}
              entityType={state.entityType}
              onMappingConfigured={handleMappingConfigured}
              initialMapping={state.mappingConfig}
            />
          )}

          {state.currentStep === 4 && state.entityType === 'client' && state.mappingConfig && (
            <AdvancedConfigStep
              onConfigured={handleWorkflowConfigured}
              initialConfig={state.workflowConfig}
            />
          )}

          {state.currentStep === 5 && state.fileData && state.mappingConfig && (
            <PreviewTable
              fileData={state.fileData}
              mappingConfig={state.mappingConfig}
              workflowConfig={state.workflowConfig}
              onPreviewReady={handlePreviewReady}
              previewData={state.previewData}
            />
          )}

          {state.currentStep === 6 && state.previewData && (
            <>
              {state.isImporting ? (
                <ImportProgress
                  fileData={state.fileData!}
                  mappingConfig={state.mappingConfig!}
                  workflowConfig={state.workflowConfig}
                  onCompleted={handleImportCompleted}
                />
              ) : state.importResult ? (
                <ImportResults
                  result={state.importResult}
                  onReset={handleReset}
                />
              ) : (
                <ReadyToImport
                  previewData={state.previewData}
                  mappingConfig={state.mappingConfig!}
                  fileData={{
                    columns: state.fileData!.columns,
                    totalRows: state.fileData!.totalRows
                  }}
                  onImportStart={handleImportStarted}
                  onGoBack={handleGoBackToMapping}
                />
              )}
            </>
          )}
        </Card>
      </div>
    </div>
  );
}

