import React, { useState, useEffect } from 'react';
import { 
  Shield, 
  ShieldCheck, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Info, 
  UserCheck, 
  Key, 
  Database, 
  Network, 
  FileText, 
  Activity, 
  RefreshCw 
} from 'lucide-react';
import { Button } from './button';
import { Card, CardContent, CardHeader, CardTitle } from './card';
import { Badge } from './badge';
import { Progress } from './progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './select';
import { cn } from '@/lib/utils';

interface SecurityCheck {
  id: string;
  name: string;
  description: string;
  category: 'authentication' | 'authorization' | 'data_protection' | 'network' | 'compliance' | 'monitoring';
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
  status: 'passed' | 'failed' | 'warning' | 'pending' | 'not_applicable';
  lastChecked: string;
  nextCheck: string;
  details: string;
  recommendations: string[];
  compliance: ComplianceRequirement[];
  score: number; // 0-100
}

interface ComplianceRequirement {
  id: string;
  name: string;
  standard: 'GDPR' | 'ISO27001' | 'SOC2' | 'PCI-DSS' | 'HIPAA' | 'custom';
  status: 'compliant' | 'non_compliant' | 'partial' | 'not_assessed';
  description: string;
  requirements: string[];
}

interface SecurityIncident {
  id: string;
  title: string;
  description: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  status: 'open' | 'investigating' | 'resolved' | 'closed';
  detectedAt: string;
  resolvedAt?: string;
  affectedUsers: number;
  affectedData: string[];
  actions: SecurityAction[];
}

interface SecurityAction {
  id: string;
  type: 'block' | 'alert' | 'isolate' | 'patch' | 'rollback' | 'investigate';
  description: string;
  timestamp: string;
  user: string;
  status: 'pending' | 'completed' | 'failed';
}

interface SecurityMetrics {
  overallScore: number;
  checksPassed: number;
  checksFailed: number;
  checksTotal: number;
  incidentsThisMonth: number;
  incidentsLastMonth: number;
  avgResponseTime: number;
  complianceScore: number;
  lastAudit: string;
  nextAudit: string;
}

interface SecurityAudit {
  id: string;
  name: string;
  description: string;
  status: 'scheduled' | 'running' | 'completed' | 'failed';
  startDate: string;
  endDate?: string;
  checks: SecurityCheck[];
  incidents: SecurityIncident[];
  metrics: SecurityMetrics;
  compliance: ComplianceRequirement[];
  recommendations: string[];
  generatedAt: string;
}

export const SecurityAudit: React.FC = () => {
  const [audit, setAudit] = useState<SecurityAudit | null>(null);
  const [loading, setLoading] = useState(true);
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterSeverity, setFilterSeverity] = useState<string>('all');
  const [isRunningAudit, setIsRunningAudit] = useState(false);

  useEffect(() => {
    loadSecurityAudit();
  }, []);

  const loadSecurityAudit = async () => {
    try {
      setLoading(true);
      
      // TODO: Remplacer par l'API réelle
      const mockAudit: SecurityAudit = {
        id: 'audit-2024-01',
        name: 'Audit de sécurité complet',
        description: 'Audit de sécurité automatisé de la plateforme Profitum',
        status: 'completed',
        startDate: '2024-01-15T00:00:00Z',
        endDate: '2024-01-15T02:30:00Z',
        checks: [
          {
            id: 'auth-001',
            name: 'Authentification multi-facteurs',
            description: 'Vérification de l\'activation de l\'authentification multi-facteurs',
            category: 'authentication',
            severity: 'critical',
            status: 'passed',
            lastChecked: '2024-01-15T02:30:00Z',
            nextCheck: '2024-02-15T00:00:00Z',
            details: 'L\'authentification multi-facteurs est activée pour tous les utilisateurs administrateurs',
            recommendations: ['Étendre l\'authentification multi-facteurs aux utilisateurs experts'],
            compliance: [
              {
                id: 'gdpr-auth',
                name: 'Protection des données d\'authentification',
                standard: 'GDPR',
                status: 'compliant',
                description: 'Conformité aux exigences de protection des données d\'authentification',
                requirements: ['Chiffrement des mots de passe', 'Stockage sécurisé', 'Expiration des sessions']
              }
            ],
            score: 95
          },
          {
            id: 'auth-002',
            name: 'Gestion des sessions',
            description: 'Vérification de la gestion sécurisée des sessions utilisateur',
            category: 'authentication',
            severity: 'high',
            status: 'passed',
            lastChecked: '2024-01-15T02:30:00Z',
            nextCheck: '2024-02-15T00:00:00Z',
            details: 'Les sessions expirent automatiquement après 24h d\'inactivité',
            recommendations: ['Réduire la durée de session à 12h pour les utilisateurs sensibles'],
            compliance: [],
            score: 85
          },
          {
            id: 'data-001',
            name: 'Chiffrement des données',
            description: 'Vérification du chiffrement des données sensibles',
            category: 'data_protection',
            severity: 'critical',
            status: 'passed',
            lastChecked: '2024-01-15T02:30:00Z',
            nextCheck: '2024-02-15T00:00:00Z',
            details: 'Toutes les données sensibles sont chiffrées en transit et au repos',
            recommendations: ['Implémenter le chiffrement homomorphique pour les calculs'],
            compliance: [
              {
                id: 'iso-data',
                name: 'Protection des informations',
                standard: 'ISO27001',
                status: 'compliant',
                description: 'Conformité aux exigences de protection des informations',
                requirements: ['Chiffrement des données', 'Contrôle d\'accès', 'Sauvegarde sécurisée']
              }
            ],
            score: 100
          },
          {
            id: 'network-001',
            name: 'Pare-feu et sécurité réseau',
            description: 'Vérification de la configuration du pare-feu',
            category: 'network',
            severity: 'high',
            status: 'warning',
            lastChecked: '2024-01-15T02:30:00Z',
            nextCheck: '2024-02-15T00:00:00Z',
            details: 'Le pare-feu est configuré mais certaines règles peuvent être optimisées',
            recommendations: ['Mettre à jour les règles de pare-feu', 'Implémenter une segmentation réseau'],
            compliance: [],
            score: 75
          },
          {
            id: 'comp-001',
            name: 'Conformité RGPD',
            description: 'Vérification de la conformité au RGPD',
            category: 'compliance',
            severity: 'critical',
            status: 'passed',
            lastChecked: '2024-01-15T02:30:00Z',
            nextCheck: '2024-02-15T00:00:00Z',
            details: 'La plateforme respecte les exigences du RGPD',
            recommendations: ['Mettre en place un registre des traitements automatisé'],
            compliance: [
              {
                id: 'gdpr-general',
                name: 'Conformité générale RGPD',
                standard: 'GDPR',
                status: 'compliant',
                description: 'Conformité aux exigences générales du RGPD',
                requirements: ['Consentement explicite', 'Droit à l\'oubli', 'Portabilité des données']
              }
            ],
            score: 90
          }
        ],
        incidents: [
          {
            id: 'inc-001',
            title: 'Tentative d\'accès non autorisé',
            description: 'Détection de tentatives d\'accès multiples depuis une IP suspecte',
            severity: 'medium',
            status: 'resolved',
            detectedAt: '2024-01-10T14:30:00Z',
            resolvedAt: '2024-01-10T15:00:00Z',
            affectedUsers: 0,
            affectedData: [],
            actions: [
              {
                id: 'act-001',
                type: 'block',
                description: 'Blocage de l\'IP suspecte',
                timestamp: '2024-01-10T14:35:00Z',
                user: 'Système automatique',
                status: 'completed'
              }
            ]
          }
        ],
        metrics: {
          overallScore: 89,
          checksPassed: 4,
          checksFailed: 0,
          checksTotal: 5,
          incidentsThisMonth: 1,
          incidentsLastMonth: 2,
          avgResponseTime: 1.5,
          complianceScore: 92,
          lastAudit: '2024-01-15T02:30:00Z',
          nextAudit: '2024-02-15T00:00:00Z'
        },
        compliance: [],
        recommendations: [
          'Étendre l\'authentification multi-facteurs aux utilisateurs experts',
          'Optimiser les règles de pare-feu',
          'Mettre en place un registre des traitements automatisé'
        ],
        generatedAt: '2024-01-15T02:30:00Z'
      };

      setAudit(mockAudit);
    } catch (error) {
      console.error('Erreur lors du chargement de l\'audit:', error);
    } finally {
      setLoading(false);
    }
  };

  const runSecurityAudit = async () => {
    setIsRunningAudit(true);
    
    try {
      // Simulation d'un audit en cours
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      // TODO: Appel API pour lancer l'audit
      await loadSecurityAudit();
    } catch (error) {
      console.error('Erreur lors de l\'audit:', error);
    } finally {
      setIsRunningAudit(false);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      case 'high':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
      case 'low':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'passed':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case 'failed':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      case 'warning':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
      case 'pending':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'passed':
        return <CheckCircle className="w-4 h-4" />;
      case 'failed':
        return <XCircle className="w-4 h-4" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4" />;
      case 'pending':
        return <Clock className="w-4 h-4" />;
      default:
        return <Info className="w-4 h-4" />;
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'authentication':
        return <UserCheck className="w-4 h-4" />;
      case 'authorization':
        return <Key className="w-4 h-4" />;
      case 'data_protection':
        return <Database className="w-4 h-4" />;
      case 'network':
        return <Network className="w-4 h-4" />;
      case 'compliance':
        return <FileText className="w-4 h-4" />;
      case 'monitoring':
        return <Activity className="w-4 h-4" />;
      default:
        return <Shield className="w-4 h-4" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (!audit) {
    return (
      <div className="text-center py-8">
        <AlertTriangle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600">Impossible de charger l'audit de sécurité</p>
      </div>
    );
  }

  const filteredChecks = audit.checks.filter(check => {
    const matchesCategory = filterCategory === 'all' || check.category === filterCategory;
    const matchesSeverity = filterSeverity === 'all' || check.severity === filterSeverity;
    return matchesCategory && matchesSeverity;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            Audit de Sécurité
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Surveillance et conformité de la sécurité de la plateforme
          </p>
        </div>
        <div className="flex space-x-2">
          <Button
            variant="outline"
            onClick={loadSecurityAudit}
            className="flex items-center space-x-2"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Actualiser</span>
          </Button>
          <Button
            onClick={runSecurityAudit}
            disabled={isRunningAudit}
            className="flex items-center space-x-2"
          >
            {isRunningAudit ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Audit en cours...</span>
              </>
            ) : (
              <>
                <Shield className="w-4 h-4" />
                <span>Lancer l'audit</span>
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Métriques principales */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
                <ShieldCheck className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Score global
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {audit.metrics.overallScore}/100
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                <CheckCircle className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Tests réussis
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {audit.metrics.checksPassed}/{audit.metrics.checksTotal}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="p-2 bg-orange-100 dark:bg-orange-900/20 rounded-lg">
                <AlertTriangle className="w-6 h-6 text-orange-600 dark:text-orange-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Incidents ce mois
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {audit.metrics.incidentsThisMonth}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="p-2 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
                <Activity className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Temps de réponse
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {audit.metrics.avgResponseTime}s
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Onglets principaux */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
          <TabsTrigger value="checks">Vérifications</TabsTrigger>
          <TabsTrigger value="incidents">Incidents</TabsTrigger>
          <TabsTrigger value="compliance">Conformité</TabsTrigger>
        </TabsList>

        {/* Vue d'ensemble */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Score de sécurité */}
            <Card>
              <CardHeader>
                <CardTitle>Score de sécurité</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-center">
                    <div className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                      {audit.metrics.overallScore}/100
                    </div>
                    <Progress value={audit.metrics.overallScore} className="w-full" />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded">
                      <div className="font-bold text-green-600 dark:text-green-400">
                        {audit.metrics.checksPassed}
                      </div>
                      <div className="text-gray-600 dark:text-gray-400">Réussis</div>
                    </div>
                    <div className="text-center p-3 bg-red-50 dark:bg-red-900/20 rounded">
                      <div className="font-bold text-red-600 dark:text-red-400">
                        {audit.metrics.checksFailed}
                      </div>
                      <div className="text-gray-600 dark:text-gray-400">Échoués</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Répartition par catégorie */}
            <Card>
              <CardHeader>
                <CardTitle>Répartition par catégorie</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {['authentication', 'data_protection', 'network', 'compliance'].map(category => {
                    const categoryChecks = audit.checks.filter(c => c.category === category);
                    const passedCount = categoryChecks.filter(c => c.status === 'passed').length;
                    const totalCount = categoryChecks.length;
                    const percentage = totalCount > 0 ? (passedCount / totalCount) * 100 : 0;
                    
                    return (
                      <div key={category} className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          {getCategoryIcon(category)}
                          <span className="capitalize">{category.replace('_', ' ')}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            {passedCount}/{totalCount}
                          </span>
                          <div className="w-20 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                            <div
                              className="bg-green-500 h-2 rounded-full"
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Derniers incidents */}
          <Card>
            <CardHeader>
              <CardTitle>Derniers incidents de sécurité</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {audit.incidents.slice(0, 5).map((incident) => (
                  <div key={incident.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className={cn('p-2 rounded-full', getSeverityColor(incident.severity))}>
                        <AlertTriangle className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900 dark:text-gray-100">
                          {incident.title}
                        </h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {new Date(incident.detectedAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <Badge className={getStatusColor(incident.status)}>
                      {incident.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Vérifications */}
        <TabsContent value="checks" className="space-y-4">
          {/* Filtres */}
          <div className="flex space-x-4">
            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes les catégories</SelectItem>
                <SelectItem value="authentication">Authentification</SelectItem>
                <SelectItem value="data_protection">Protection des données</SelectItem>
                <SelectItem value="network">Réseau</SelectItem>
                <SelectItem value="compliance">Conformité</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={filterSeverity} onValueChange={setFilterSeverity}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes les sévérités</SelectItem>
                <SelectItem value="critical">Critique</SelectItem>
                <SelectItem value="high">Élevée</SelectItem>
                <SelectItem value="medium">Moyenne</SelectItem>
                <SelectItem value="low">Faible</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Liste des vérifications */}
          <div className="space-y-4">
            {filteredChecks.map((check) => (
              <Card key={check.id}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <div className={cn('p-2 rounded-full', getSeverityColor(check.severity))}>
                          {getCategoryIcon(check.category)}
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                          {check.name}
                        </h3>
                        <Badge className={getSeverityColor(check.severity)}>
                          {check.severity}
                        </Badge>
                        <Badge className={getStatusColor(check.status)}>
                          <div className="flex items-center space-x-1">
                            {getStatusIcon(check.status)}
                            <span>{check.status}</span>
                          </div>
                        </Badge>
                      </div>
                      
                      <p className="text-gray-600 dark:text-gray-400 mb-3">
                        {check.description}
                      </p>
                      
                      <div className="space-y-2">
                        <div className="text-sm">
                          <span className="font-medium">Détails: </span>
                          {check.details}
                        </div>
                        
                        {check.recommendations.length > 0 && (
                          <div>
                            <span className="text-sm font-medium">Recommandations: </span>
                            <ul className="text-sm text-gray-600 dark:text-gray-400 mt-1 space-y-1">
                              {check.recommendations.map((rec, index) => (
                                <li key={index} className="flex items-start space-x-2">
                                  <span>•</span>
                                  <span>{rec}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                        {check.score}/100
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        Score
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Incidents */}
        <TabsContent value="incidents" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Incidents de sécurité</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {audit.incidents.map((incident) => (
                  <div key={incident.id} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <div className={cn('p-2 rounded-full', getSeverityColor(incident.severity))}>
                          <AlertTriangle className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900 dark:text-gray-100">
                            {incident.title}
                          </h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            Détecté le {new Date(incident.detectedAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <Badge className={getStatusColor(incident.status)}>
                        {incident.status}
                      </Badge>
                    </div>
                    
                    <p className="text-gray-600 dark:text-gray-400 mb-3">
                      {incident.description}
                    </p>
                    
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-medium">Utilisateurs affectés: </span>
                        {incident.affectedUsers}
                      </div>
                      <div>
                        <span className="font-medium">Données affectées: </span>
                        {incident.affectedData.length > 0 ? incident.affectedData.join(', ') : 'Aucune'}
                      </div>
                    </div>
                    
                    {incident.actions.length > 0 && (
                      <div className="mt-4">
                        <h5 className="font-medium mb-2">Actions prises:</h5>
                        <div className="space-y-2">
                          {incident.actions.map((action) => (
                            <div key={action.id} className="flex items-center space-x-2 text-sm">
                              <span className="font-medium">{action.type}:</span>
                              <span>{action.description}</span>
                              <Badge variant="outline" className="text-xs">
                                {action.status}
                              </Badge>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Conformité */}
        <TabsContent value="compliance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Conformité réglementaire</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {audit.compliance.map((req) => (
                  <div key={req.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold text-gray-900 dark:text-gray-100">
                        {req.name}
                      </h4>
                      <Badge className={getStatusColor(req.status)}>
                        {req.status}
                      </Badge>
                    </div>
                    
                    <p className="text-gray-600 dark:text-gray-400 mb-3">
                      {req.description}
                    </p>
                    
                    <div className="space-y-2">
                      <div className="text-sm">
                        <span className="font-medium">Standard: </span>
                        {req.standard}
                      </div>
                      
                      {req.requirements.length > 0 && (
                        <div>
                          <span className="text-sm font-medium">Exigences: </span>
                          <ul className="text-sm text-gray-600 dark:text-gray-400 mt-1 space-y-1">
                            {req.requirements.map((requirement, index) => (
                              <li key={index} className="flex items-start space-x-2">
                                <span>•</span>
                                <span>{requirement}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}; 