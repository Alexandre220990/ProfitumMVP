import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Play, RefreshCw, Clock, AlertTriangle, Eye, Shield, Database, Globe, Monitor, Terminal, Zap, CheckCircle, XCircle, Download, FileText } from "lucide-react";
import { post } from '@/lib/api';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";

interface TestResult {
  test_name: string;
  category: string;
  status: 'success' | 'warning' | 'error' | 'running';
  duration_ms: number;
  output?: string;
  error_output?: string;
  exit_code: number;
  summary?: any;
  metadata?: any;
}

interface TestCategory {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  tests: TestResult[];
}

interface TestSuite {
  success: boolean;
  duration: number;
  results: Record<string, any>;
  summary: {
    total_tests: number;
    successful: number;
    warnings: number;
    errors: number;
    success_rate: number;
    overall_status: 'success' | 'warning' | 'error';
    category_statuses: Record<string, string>;
  };
}

const TestsPage: React.FC = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [currentTest, setCurrentTest] = useState<string>('');
  const [progress, setProgress] = useState(0);
  const [testResults, setTestResults] = useState<TestSuite | null>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedTestLogs, setSelectedTestLogs] = useState<TestResult | null>(null);
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const testCategories: TestCategory[] = [
    {
      id: 'security',
      name: 'Sécurité',
      description: 'Tests d\'audit ISO 27001, scan de vulnérabilités, authentification',
      icon: <Shield className="h-5 w-5" />,
      color: 'bg-red-500',
      tests: []
    },
    {
      id: 'performance',
      name: 'Performance',
      description: 'Tests de charge, monitoring des métriques, temps de réponse',
      icon: <Zap className="h-5 w-5" />,
      color: 'bg-yellow-500',
      tests: []
    },
    {
      id: 'database',
      name: 'Base de Données',
      description: 'Intégrité des données, performance des requêtes, sauvegardes',
      icon: <Database className="h-5 w-5" />,
      color: 'bg-blue-500',
      tests: []
    },
    {
      id: 'api',
      name: 'API',
      description: 'Endpoints, authentification, validation des données',
      icon: <Globe className="h-5 w-5" />,
      color: 'bg-green-500',
      tests: []
    },
    {
      id: 'system',
      name: 'Système',
      description: 'Monitoring CPU/Mémoire, logs système, services critiques',
      icon: <Monitor className="h-5 w-5" />,
      color: 'bg-purple-500',
      tests: []
    }
  ];

  const runAllTests = async () => {
    setIsRunning(true);
    setProgress(0);
    setLogs([]);
    setTestResults(null);
    setError(null);
    setCurrentTest('Initialisation...');

    try {
      // Simuler le lancement des tests
      const testSteps = [
        'Lancement des tests de sécurité...',
        'Lancement des tests de performance...',
        'Lancement des tests de base de données...',
        'Lancement des tests d\'API...',
        'Lancement des tests système...',
        'Génération du rapport final...'
      ];

      for (let i = 0; i < testSteps.length; i++) {
        setCurrentTest(testSteps[i]);
        setProgress((i + 1) * (100 / testSteps.length));
        setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${testSteps[i]}`]);
        
        // Simuler le temps d'exécution
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      // Appeler l'API pour lancer les tests
      const response = await post('/tests/run-all');
      
      if (response.success) {
        setTestResults(response.data as TestSuite);
        setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] Tests terminés avec succès!`]);
        toast.success("Tous les tests ont été exécutés avec succès");
      } else {
        throw new Error(response.message || 'Échec de l\'exécution des tests');
      }

    } catch (error) {
      console.error('Erreur lors de l\'exécution des tests:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      setError(errorMessage);
      setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ❌ Erreur: ${errorMessage}`]);
      toast.error(errorMessage);
    } finally {
      setIsRunning(false);
      setCurrentTest('');
      setProgress(100);
    }
  };

  const runCategoryTests = async (categoryId: string) => {
    setIsRunning(true);
    setProgress(0);
    setLogs([]);
    setError(null);
    setCurrentTest(`Lancement des tests ${categoryId}...`);

    try {
      const response = await post(`/tests/run-category/${categoryId}`);
      
      if (response.success) {
        setTestResults(response.data as TestSuite);
        setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] Tests ${categoryId} terminés!`]);
        toast.success(`Tests de la catégorie ${categoryId} exécutés avec succès`);
      } else {
        throw new Error(response.message || `Échec des tests ${categoryId}`);
      }

    } catch (error) {
      console.error(`Erreur lors des tests ${categoryId}:`, error);
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      setError(errorMessage);
      setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ❌ Erreur: ${errorMessage}`]);
      toast.error(errorMessage);
    } finally {
      setIsRunning(false);
      setCurrentTest('');
      setProgress(100);
    }
  };

  const exportResults = () => {
    if (!testResults) return;

    const dataStr = JSON.stringify(testResults, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `test-results-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
    
    toast.success("Les résultats ont été exportés avec succès");
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'running':
        return <RefreshCw className="h-4 w-4 text-blue-500 animate-spin" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'success':
        return <Badge variant="default" className="bg-green-100 text-green-800">Succès</Badge>;
      case 'warning':
        return <Badge variant="default" className="bg-yellow-100 text-yellow-800">Avertissement</Badge>;
      case 'error':
        return <Badge variant="default" className="bg-red-100 text-red-800">Erreur</Badge>;
      case 'running':
        return <Badge variant="default" className="bg-blue-100 text-blue-800">En cours</Badge>;
      default:
        return <Badge variant="secondary">Inconnu</Badge>;
    }
  };

  const openTestLogs = (test: TestResult) => {
    setSelectedTestLogs(test);
    setIsLogModalOpen(true);
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Pilotage des Tests</h1>
          <p className="text-muted-foreground">
            Système de tests automatisés pour la maintenance de l'application
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={runAllTests}
            disabled={isRunning}
            className="bg-green-600 hover:bg-green-700"
          >
            <Play className="h-4 w-4 mr-2" />
            {isRunning ? 'Tests en cours...' : 'Lancer tous les tests'}
          </Button>
          {testResults && (
            <Button onClick={exportResults} variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Exporter
            </Button>
          )}
        </div>
      </div>

      {/* Affichage des erreurs */}
      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Progress Bar */}
      {isRunning && (
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>{currentTest}</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} className="w-full" />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
          <TabsTrigger value="categories">Catégories</TabsTrigger>
          <TabsTrigger value="results">Résultats</TabsTrigger>
          <TabsTrigger value="logs">Logs</TabsTrigger>
        </TabsList>

        {/* Vue d'ensemble */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {testCategories.map((category) => (
              <Card key={category.id} className="cursor-pointer hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-center space-x-2">
                    <div className={`p-2 rounded-lg ${category.color} text-white`}>
                      {category.icon}
                    </div>
                    <CardTitle className="text-lg">{category.name}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-3">
                    {category.description}
                  </p>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full"
                    disabled={isRunning}
                    onClick={() => runCategoryTests(category.id)}
                  >
                    <Play className="h-3 w-3 mr-1" />
                    Lancer
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Résumé global */}
          {testResults?.summary && (
            <Card>
              <CardHeader>
                <CardTitle>Résumé Global</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {testResults?.summary?.successful || 0}
                    </div>
                    <div className="text-sm text-muted-foreground">Succès</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-yellow-600">
                      {testResults?.summary?.warnings || 0}
                    </div>
                    <div className="text-sm text-muted-foreground">Avertissements</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-600">
                      {testResults?.summary?.errors || 0}
                    </div>
                    <div className="text-sm text-muted-foreground">Erreurs</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {testResults?.summary?.success_rate || 0}%
                    </div>
                    <div className="text-sm text-muted-foreground">Taux de succès</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Catégories détaillées */}
        <TabsContent value="categories" className="space-y-4">
          {testCategories.map((category) => (
            <Card key={category.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className={`p-2 rounded-lg ${category.color} text-white`}>
                      {category.icon}
                    </div>
                    <CardTitle>{category.name}</CardTitle>
                  </div>
                  <Button
                    onClick={() => runCategoryTests(category.id)}
                    disabled={isRunning}
                    size="sm"
                  >
                    <Play className="h-3 w-3 mr-1" />
                    Lancer
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground">
                  {category.description}
                </p>
              </CardHeader>
              <CardContent>
                {testResults?.results[category.id] ? (
                  <div className="space-y-2">
                    {testResults.results[category.id].results?.map((test: TestResult, index: number) => (
                      <div key={index} className="flex items-center justify-between p-2 border rounded">
                        <div className="flex items-center space-x-2">
                          {getStatusIcon(test.status)}
                          <span className="text-sm font-medium">{test.test_name}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="text-xs text-muted-foreground">
                            {test.duration_ms}ms
                          </span>
                          {getStatusBadge(test.status)}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openTestLogs(test)}
                            className="h-6 w-6 p-0"
                          >
                            <Eye className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Aucun test exécuté pour cette catégorie
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        {/* Résultats détaillés */}
        <TabsContent value="results" className="space-y-4">
          {testResults ? (
            <div className="space-y-4">
              {Object.entries(testResults.results).map(([categoryId, categoryResult]) => (
                <Card key={categoryId}>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      {getStatusIcon(categoryResult.success ? 'success' : 'error')}
                      <span>{testCategories.find(c => c.id === categoryId)?.name || categoryId}</span>
                      {getStatusBadge(categoryResult.success ? 'success' : 'error')}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {categoryResult.results?.map((test: TestResult, index: number) => (
                        <div key={index} className="border rounded-lg p-4">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center space-x-2">
                              {getStatusIcon(test.status)}
                              <span className="font-medium">{test.test_name}</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <span className="text-sm text-muted-foreground">
                                {test.duration_ms}ms
                              </span>
                              {getStatusBadge(test.status)}
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => openTestLogs(test)}
                                className="h-6 w-6 p-0"
                              >
                                <Eye className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                          
                          {test.output && (
                            <div className="text-sm text-muted-foreground mb-2">
                              {test.output}
                            </div>
                          )}
                          
                          {test.error_output && (
                            <Alert className="mt-2">
                              <AlertTriangle className="h-4 w-4" />
                              <AlertDescription>{test.error_output}</AlertDescription>
                            </Alert>
                          )}
                          
                          {test.summary && (
                            <div className="mt-2 text-xs text-muted-foreground">
                              <pre className="bg-gray-50 p-2 rounded">
                                {JSON.stringify(test.summary, null, 2)}
                              </pre>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="pt-6">
                <p className="text-center text-muted-foreground">
                  Aucun résultat de test disponible. Lancez les tests pour voir les résultats.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Logs */}
        <TabsContent value="logs" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Terminal className="h-5 w-5" />
                <span>Logs d'exécution</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-96 w-full border rounded-lg p-4">
                <div className="space-y-1">
                  {logs.length > 0 ? (
                    logs.map((log, index) => (
                      <div key={index} className="text-sm font-mono">
                        {log}
                      </div>
                    ))
                  ) : (
                    <p className="text-muted-foreground">
                      Aucun log disponible. Lancez les tests pour voir les logs.
                    </p>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Modal pour les logs détaillés */}
      <Dialog open={isLogModalOpen} onOpenChange={setIsLogModalOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <FileText className="h-5 w-5" />
              <span>Logs détaillés - {selectedTestLogs?.test_name}</span>
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {/* Informations du test */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
              <div>
                <div className="text-sm font-medium text-gray-600">Statut</div>
                <div className="flex items-center space-x-2">
                  {getStatusIcon(selectedTestLogs?.status || 'unknown')}
                  {getStatusBadge(selectedTestLogs?.status || 'unknown')}
                </div>
              </div>
              <div>
                <div className="text-sm font-medium text-gray-600">Durée</div>
                <div className="text-sm">{selectedTestLogs?.duration_ms || 0}ms</div>
              </div>
              <div>
                <div className="text-sm font-medium text-gray-600">Code de sortie</div>
                <div className="text-sm">{selectedTestLogs?.exit_code || 0}</div>
              </div>
              <div>
                <div className="text-sm font-medium text-gray-600">Catégorie</div>
                <div className="text-sm">{selectedTestLogs?.category || 'N/A'}</div>
              </div>
            </div>

            {/* Sortie standard */}
            {selectedTestLogs?.output && (
              <div>
                <h4 className="font-medium mb-2 flex items-center space-x-2">
                  <Terminal className="h-4 w-4" />
                  <span>Sortie standard</span>
                </h4>
                <ScrollArea className="h-48 w-full border rounded-lg p-4 bg-black text-green-400 font-mono text-sm">
                  <pre>{selectedTestLogs.output}</pre>
                </ScrollArea>
              </div>
            )}

            {/* Sortie d'erreur */}
            {selectedTestLogs?.error_output && (
              <div>
                <h4 className="font-medium mb-2 flex items-center space-x-2">
                  <AlertTriangle className="h-4 w-4 text-red-500" />
                  <span>Sortie d'erreur</span>
                </h4>
                <ScrollArea className="h-48 w-full border rounded-lg p-4 bg-black text-red-400 font-mono text-sm">
                  <pre>{selectedTestLogs.error_output}</pre>
                </ScrollArea>
              </div>
            )}

            {/* Métadonnées */}
            {selectedTestLogs?.metadata && (
              <div>
                <h4 className="font-medium mb-2">Métadonnées</h4>
                <ScrollArea className="h-32 w-full border rounded-lg p-4 bg-gray-50 font-mono text-sm">
                  <pre>{JSON.stringify(selectedTestLogs.metadata, null, 2)}</pre>
                </ScrollArea>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TestsPage; 