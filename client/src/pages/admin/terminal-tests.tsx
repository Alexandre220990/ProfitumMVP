import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Play, Square, Terminal, Eye, Clock, AlertTriangle, RefreshCw, Shield, Database, Globe, Monitor, Zap, CheckCircle, XCircle, Download } from "lucide-react";
import { post, del, get } from "@/lib/api";
import { useAuth } from "@/hooks/use-auth";
import { useNavigate } from "react-router-dom";

interface TerminalSession {
  id: string;
  category: string;
  command: string;
  status: 'running' | 'completed' | 'failed' | 'killed';
  output: string[];
  error: string[];
  startTime: string;
  endTime?: string;
  exitCode?: number;
  duration?: number;
}

interface TestCommand {
  category: string;
  command: string;
  description: string;
  timeout?: number;
}

interface TestCategory {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  commands: TestCommand[];
}

const TerminalTestsPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [sessions, setSessions] = useState<TerminalSession[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedSession, setSelectedSession] = useState<TerminalSession | null>(null);
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('sessions');

  // État pour le rate limiting
  const [lastApiCall, setLastApiCall] = useState<number>(0);
  const [apiCallCount, setApiCallCount] = useState<number>(0);
  const [isRateLimited, setIsRateLimited] = useState<boolean>(false);

  // Vérification des permissions admin
  useEffect(() => {
    if (user && user.type !== 'admin') {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  // Configuration des catégories
  const testCategories: TestCategory[] = [
    {
      id: 'security',
      name: 'Sécurité',
      description: 'Tests d\'audit ISO 27001, scan de vulnérabilités, authentification',
      icon: <Shield className="h-5 w-5" />,
      color: 'bg-red-500',
      commands: [
        {
          category: 'security',
          command: 'npm run test:security',
          description: 'Audit de sécurité',
          timeout: 300000
        },
        {
          category: 'security',
          command: 'npm run test:vulnerabilities',
          description: 'Scan de vulnérabilités',
          timeout: 600000
        }
      ]
    },
    {
      id: 'performance',
      name: 'Performance',
      description: 'Tests de charge, monitoring des métriques, temps de réponse',
      icon: <Zap className="h-5 w-5" />,
      color: 'bg-yellow-500',
      commands: [
        {
          category: 'performance',
          command: 'npm run test:load',
          description: 'Test de charge',
          timeout: 300000
        },
        {
          category: 'performance',
          command: 'npm run test:metrics',
          description: 'Métriques système',
          timeout: 120000
        }
      ]
    },
    {
      id: 'database',
      name: 'Base de Données',
      description: 'Intégrité des données, performance des requêtes, sauvegardes',
      icon: <Database className="h-5 w-5" />,
      color: 'bg-blue-500',
      commands: [
        {
          category: 'database',
          command: 'npm run test:db',
          description: 'Tests base de données',
          timeout: 180000
        },
        {
          category: 'database',
          command: 'npm run test:backup',
          description: 'Test de sauvegarde',
          timeout: 240000
        }
      ]
    },
    {
      id: 'api',
      name: 'API',
      description: 'Endpoints, authentification, validation des données',
      icon: <Globe className="h-5 w-5" />,
      color: 'bg-green-500',
      commands: [
        {
          category: 'api',
          command: 'npm run test:api',
          description: 'Tests API',
          timeout: 180000
        },
        {
          category: 'api',
          command: 'npm run test:auth',
          description: 'Tests d\'authentification',
          timeout: 120000
        }
      ]
    },
    {
      id: 'system',
      name: 'Système',
      description: 'Monitoring CPU/Mémoire, logs système, services critiques',
      icon: <Monitor className="h-5 w-5" />,
      color: 'bg-purple-500',
      commands: [
        {
          category: 'system',
          command: 'npm run test:system',
          description: 'Tests système',
          timeout: 120000
        },
        {
          category: 'system',
          command: 'npm run test:monitoring',
          description: 'Monitoring',
          timeout: 60000
        }
      ]
    }
  ];

  // Charger les données initiales
  useEffect(() => {
    loadSessions();
    
    // Polling intelligent avec rate limiting
    const interval = setInterval(() => {
      const now = Date.now();
      const timeSinceLastCall = now - lastApiCall;
      
      // Si on a fait trop d'appels récemment, on attend
      if (apiCallCount >= 10 && timeSinceLastCall < 10000) {
        setIsRateLimited(true);
        return;
      }
      
      // Si on était rate limited et qu'on peut maintenant faire un appel
      if (isRateLimited && timeSinceLastCall >= 10000) {
        setIsRateLimited(false);
        setApiCallCount(0);
      }
      
      loadSessions();
    }, 3000); // Mise à jour toutes les 3 secondes au lieu de 2

    return () => clearInterval(interval);
  }, [lastApiCall, apiCallCount, isRateLimited]);

  // Charger les sessions avec gestion du rate limiting
  const loadSessions = async () => {
    try {
      const response = await get('/terminal-tests/sessions');
      if (response.success) {
        setSessions((response.data as any).sessions || []);
        setLastApiCall(Date.now());
        setApiCallCount(prev => prev + 1);
      }
    } catch (error: any) {
      console.error('Erreur lors du chargement des sessions: ', error);
      
      // Si on reçoit une erreur 429, on active le rate limiting
      if (error.response?.status === 429) {
        setIsRateLimited(true);
        setApiCallCount(0);
        console.log('⚠️ Rate limiting activé - pause de 10 secondes');
      }
    }
  };

  // Lancer un test
  const executeTest = async (category: string, commandIndex: number = 0) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await post(`/terminal-tests/execute/${category}`, { commandIndex });

      if (response.success) {
        console.log(`✅ Test ${category} lancé avec succès: `, response.data);
        // Recharger les sessions pour voir la nouvelle session
        setTimeout(loadSessions, 500);
      } else {
        throw new Error(response.message);
      }
    } catch (error: any) {
      console.error(`❌ Erreur lors du lancement du test ${category}:`, error);
      setError(error.message || `Erreur lors du lancement du test ${category}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Lancer tous les tests
  const executeAllTests = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await post('/terminal-tests/execute-all', {
        commandIndex: 0
      });

      if (response.success) {
        console.log('✅ Tous les tests lancés avec succès: ', response.data);
        setTimeout(loadSessions, 500);
      } else {
        throw new Error(response.message);
      }
    } catch (error: any) {
      console.error('❌ Erreur lors du lancement de tous les tests: ', error);
      setError(error.message || 'Erreur lors du lancement de tous les tests');
    } finally {
      setIsLoading(false);
    }
  };

  // Arrêter une session
  const killSession = async (sessionId: string) => {
    try {
      const response = await del(`/terminal-tests/kill/${sessionId}`);
      if (response.success) {
        console.log(`🛑 Session ${sessionId} arrêtée`);
        loadSessions();
      }
    } catch (error) {
      console.error(`❌ Erreur lors de l'arrêt de la session ${sessionId}:`, error);
    }
  };

  // Arrêter toutes les sessions
  const killAllSessions = async () => {
    try {
      const response = await del('/terminal-tests/kill-all');
      if (response.success) {
        console.log('🛑 Toutes les sessions arrêtées');
        loadSessions();
      }
    } catch (error) {
      console.error('❌ Erreur lors de l\'arrêt de toutes les sessions: ', error);
    }
  };

  // Ouvrir les logs d'une session
  const openSessionLogs = (session: TerminalSession) => {
    setSelectedSession(session);
    setIsLogModalOpen(true);
  };

  // Obtenir l'icône de statut
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'running':
        return <RefreshCw className="h-4 w-4 text-blue-500 animate-spin" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'killed':
        return <Square className="h-4 w-4 text-orange-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  // Obtenir le badge de statut
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'running':
        return <Badge variant="default" className="bg-blue-100 text-blue-800">En cours</Badge>;
      case 'completed':
        return <Badge variant="default" className="bg-green-100 text-green-800">Terminé</Badge>;
      case 'failed':
        return <Badge variant="default" className="bg-red-100 text-red-800">Échec</Badge>;
      case 'killed':
        return <Badge variant="default" className="bg-orange-100 text-orange-800">Arrêté</Badge>;
      default:
        return <Badge variant="secondary">Inconnu</Badge>;
    }
  };

  // Formater la durée
  const formatDuration = (duration: number | null | undefined) => {
    if (!duration) return 'N/A';
    const seconds = Math.floor(duration / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  // Exporter les résultats
  const exportResults = () => {
    const dataStr = JSON.stringify(sessions, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `terminal-tests-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Calculer les statistiques
  const stats = {
    total: sessions.length,
    running: sessions.filter(s => s.status === 'running').length,
    completed: sessions.filter(s => s.status === 'completed').length,
    failed: sessions.filter(s => s.status === 'failed').length,
    killed: sessions.filter(s => s.status === 'killed').length
  };

  // Si l'utilisateur n'est pas admin, afficher un message
  if (user && user.type !== 'admin') {
    return (
      <div className="container mx-auto p-6">
        <Alert className="border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4 text-red-500" />
          <AlertDescription className="text-red-700">
            Accès refusé. Cette page est réservée aux administrateurs.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Tests Terminaux</h1>
          <p className="text-muted-foreground">
            Exécution de tests en temps réel dans des terminaux
            {isRateLimited && (
              <span className="ml-2 text-orange-600 text-sm">
                ⚠️ Rate limiting actif (pause de 10s)
              </span>
            )}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={executeAllTests}
            disabled={isLoading}
            className="bg-green-600 hover:bg-green-700"
          >
            <Play className="h-4 w-4 mr-2" />
            {isLoading ? 'Lancement...' : 'Lancer tous les tests'}
          </Button>
          {stats.running > 0 && (
            <Button onClick={killAllSessions} variant="destructive">
              <Square className="h-4 w-4 mr-2" />
              Arrêter tout
            </Button>
          )}
          {sessions.length > 0 && (
            <Button onClick={exportResults} variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Exporter
            </Button>
          )}
        </div>
      </div>

      {/* Message d'erreur */}
      {error && (
        <Alert className="border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4 text-red-500" />
          <AlertDescription className="text-red-700">{error}</AlertDescription>
        </Alert>
      )}

      {/* Statistiques */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-600">{stats.total}</div>
              <div className="text-sm text-muted-foreground">Total</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{stats.running}</div>
              <div className="text-sm text-muted-foreground">En cours</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
              <div className="text-sm text-muted-foreground">Terminés</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{stats.failed}</div>
              <div className="text-sm text-muted-foreground">Échecs</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{stats.killed}</div>
              <div className="text-sm text-muted-foreground">Arrêtés</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Onglets */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="sessions">Sessions Actives</TabsTrigger>
          <TabsTrigger value="categories">Catégories</TabsTrigger>
        </TabsList>

        {/* Sessions actives */}
        <TabsContent value="sessions" className="space-y-4">
          {sessions.length > 0 ? (
            <div className="space-y-4">
              {sessions.map((session) => (
                <Card key={session.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(session.status)}
                        <CardTitle className="text-lg">
                          {session.category} - {session.command}
                        </CardTitle>
                      </div>
                      <div className="flex items-center space-x-2">
                        {getStatusBadge(session.status)}
                        {session.status === 'running' && (
                          <Button
                            onClick={() => killSession(session.id)}
                            variant="destructive"
                            size="sm"
                          >
                            <Square className="h-3 w-3 mr-1" />
                            Arrêter
                          </Button>
                        )}
                        <Button
                          onClick={() => openSessionLogs(session)}
                          variant="outline"
                          size="sm"
                        >
                          <Eye className="h-3 w-3 mr-1" />
                          Logs
                        </Button>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                      <span>Démarré: {new Date(session.startTime).toLocaleString()}</span>
                      {session.endTime && (
                        <span>Terminé: {new Date(session.endTime).toLocaleString()}</span>
                      )}
                      <span>Durée: {formatDuration(session.duration ?? null)}</span>
                      {session.exitCode !== undefined && (
                        <span>Code: {session.exitCode}</span>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Sortie: {session.output.length} lignes</span>
                        <span>Erreurs: {session.error.length} lignes</span>
                      </div>
                      {session.output.length > 0 && (
                        <ScrollArea className="h-32 w-full border rounded-lg p-2 bg-black text-green-400 font-mono text-xs">
                          <pre>{session.output.slice(-10).join('\n')}</pre>
                        </ScrollArea>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="pt-6">
                <p className="text-center text-muted-foreground">
                  Aucune session de test disponible. Lancez des tests pour voir les sessions.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Catégories */}
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
                  <div className="flex gap-2">
                    {category.commands.map((command, index) => (
                      <Button
                        key={index}
                        onClick={() => executeTest(category.id, index)}
                        disabled={isLoading}
                        size="sm"
                      >
                        <Play className="h-3 w-3 mr-1" />
                        {command.description}
                      </Button>
                    ))}
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">
                  {category.description}
                </p>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {category.commands.map((command, index) => (
                    <div key={index} className="flex items-center justify-between p-2 border rounded">
                      <div>
                        <div className="font-medium">{command.command}</div>
                        <div className="text-sm text-muted-foreground">{command.description}</div>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Timeout: {command.timeout ? Math.round(command.timeout / 1000 / 60) : 5}min
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>

      {/* Modal pour les logs détaillés */}
      <Dialog open={isLogModalOpen} onOpenChange={setIsLogModalOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Terminal className="h-5 w-5" />
              <span>Logs - {selectedSession?.category} - {selectedSession?.command}</span>
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {/* Informations de la session */}
            {selectedSession && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
                <div>
                  <div className="text-sm font-medium text-gray-600">Statut</div>
                  <div className="flex items-center space-x-2">
                    {getStatusIcon(selectedSession.status)}
                    {getStatusBadge(selectedSession.status)}
                  </div>
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-600">Durée</div>
                  <div className="text-sm">{formatDuration(selectedSession.duration ?? null)}</div>
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-600">Code de sortie</div>
                  <div className="text-sm">{selectedSession.exitCode ?? 'N/A'}</div>
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-600">ID Session</div>
                  <div className="text-sm font-mono">{selectedSession.id}</div>
                </div>
              </div>
            )}

            {/* Sortie standard */}
            {selectedSession?.output && selectedSession.output.length > 0 && (
              <div>
                <h4 className="font-medium mb-2 flex items-center space-x-2">
                  <Terminal className="h-4 w-4" />
                  <span>Sortie standard ({selectedSession.output.length} lignes)</span>
                </h4>
                <ScrollArea className="h-64 w-full border rounded-lg p-4 bg-black text-green-400 font-mono text-sm">
                  <pre>{selectedSession.output.join('\n')}</pre>
                </ScrollArea>
              </div>
            )}

            {/* Sortie d'erreur */}
            {selectedSession?.error && selectedSession.error.length > 0 && (
              <div>
                <h4 className="font-medium mb-2 flex items-center space-x-2">
                  <AlertTriangle className="h-4 w-4 text-red-500" />
                  <span>Sortie d'erreur ({selectedSession.error.length} lignes)</span>
                </h4>
                <ScrollArea className="h-64 w-full border rounded-lg p-4 bg-black text-red-400 font-mono text-sm">
                  <pre>{selectedSession.error.join('\n')}</pre>
                </ScrollArea>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TerminalTestsPage; 