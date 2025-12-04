import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { config } from "@/config/env";
import { getSupabaseToken } from "@/lib/auth-helpers";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertTriangle, Shield, AlertCircle, Settings, Workflow, RefreshCw, CheckCircle, Users } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

interface ComplianceControl {
  id: string;
  standard: string;
  control_id: string;
  title: string;
  description: string;
  category: string;
  risk_level: 'low' | 'medium' | 'high' | 'critical';
  status: 'compliant' | 'non_compliant' | 'in_progress' | 'not_applicable';
  next_review_date: string;
  responsible_person: string;
}

interface WorkflowTemplate {
  id: string;
  name: string;
  description: string;
  document_category: string;
  document_type: string;
  version: string;
  is_active: boolean;
  estimated_total_duration: number;
  sla_hours: number;
  requires_expert: boolean;
  requires_signature: boolean;
}

interface SecurityIncident {
  id: string;
  title: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'open' | 'investigating' | 'resolved' | 'closed';
  detected_at: string;
  affected_users: number;
}

interface ComplianceStats {
  total_controls: number;
  by_standard: {
    [key: string]: { total: number; compliant: number };
  };
  by_status: { [key: string]: number; };
  by_risk: { [key: string]: number; };
}

const ComplianceDashboard: React.FC = () => {
  const { user, isLoading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [complianceStats, setComplianceStats] = useState<ComplianceStats | null>(null);
  const [controls, setControls] = useState<ComplianceControl[]>([]);
  const [workflows, setWorkflows] = useState<WorkflowTemplate[]>([]);
  const [incidents, setIncidents] = useState<SecurityIncident[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Charger les statistiques de conformité
      const statsResponse = await fetch(`${config.API_URL}/api/compliance/stats`, {
        headers: { 'Authorization': `Bearer ${await getSupabaseToken()}` }
      });
      const stats = await statsResponse.json();
      if (stats.success) {
        setComplianceStats(stats.data);
      }

      // Charger les contrôles de conformité
              const controlsResponse = await fetch(`${config.API_URL}/api/compliance/controls`, {
        headers: { 'Authorization': `Bearer ${await getSupabaseToken()}` }
      });
      const controlsData = await controlsResponse.json();
      if (controlsData.success) {
        setControls(controlsData.data);
      }

      // Charger les workflows
              const workflowsResponse = await fetch(`${config.API_URL}/api/workflow/templates`, {
        headers: { 'Authorization': `Bearer ${await getSupabaseToken()}` }
      });
      const workflowsData = await workflowsResponse.json();
      if (workflowsData.success) {
        setWorkflows(workflowsData.data);
      }

      // Charger les incidents récents
              const incidentsResponse = await fetch(`${config.API_URL}/api/compliance/incidents?limit=10`, {
        headers: { 'Authorization': `Bearer ${await getSupabaseToken()}` }
      });
      const incidentsData = await incidentsResponse.json();
      if (incidentsData.success) {
        setIncidents(incidentsData.data);
      }

    } catch (error) {
      console.error('Erreur chargement données dashboard: ', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'compliant': return 'bg-green-100 text-green-800';
      case 'non_compliant': return 'bg-red-100 text-red-800';
      case 'in_progress': return 'bg-yellow-100 text-yellow-800';
      case 'not_applicable': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'critical': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-red-600';
      case 'high': return 'text-orange-600';
      case 'medium': return 'text-yellow-600';
      case 'low': return 'text-green-600';
      default: return 'text-gray-600';
    }
  };

  const calculateComplianceScore = (standard: string) => {
    if (!complianceStats?.by_standard[standard]) return 0;
    const { total, compliant } = complianceStats.by_standard[standard];
    return total > 0 ? Math.round((compliant / total) * 100) : 0;
  };

  const getOverdueControls = () => {
    return controls.filter(control => 
      new Date(control.next_review_date) < new Date()
    );
  };

  const getHighRiskNonCompliant = () => {
    return controls.filter(control => 
      control.risk_level === 'high' || control.risk_level === 'critical'
    ).filter(control => 
      control.status === 'non_compliant'
    );
  };

  // Vérification de l'authentification et des autorisations
  if (authLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Accès non autorisé</h2>
          <p className="text-gray-600">Vous devez être connecté pour accéder à ce dashboard.</p>
        </div>
      </div>
    );
  }

  if (user.type !== 'admin') {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Shield className="h-12 w-12 text-orange-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Accès restreint</h2>
          <p className="text-gray-600">Ce dashboard est réservé aux administrateurs.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Tableau de Bord Conformité</h1>
          <p className="text-sm text-gray-600 mt-1">
            Connecté en tant que {user.name || user.email} ({user.type})
          </p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={loadDashboardData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualiser
          </Button>
          <Button>
            <Settings className="h-4 w-4 mr-2" />
            Configuration
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
          <TabsTrigger value="compliance">Conformité</TabsTrigger>
          <TabsTrigger value="workflows">Workflows</TabsTrigger>
          <TabsTrigger value="incidents">Incidents</TabsTrigger>
          <TabsTrigger value="audit">Audit</TabsTrigger>
        </TabsList>

        {/* Vue d'ensemble */}
        <TabsContent value="overview" className="space-y-6">
          {/* KPIs principaux */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Score Global</CardTitle>
                <Shield className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {complianceStats ? 
                    Math.round((complianceStats.by_status.compliant || 0) / complianceStats.total_controls * 100) : 0}%
                </div>
                <Progress 
                  value={complianceStats ? 
                    (complianceStats.by_status.compliant || 0) / complianceStats.total_controls * 100 : 0} 
                  className="mt-2" 
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Contrôles Actifs</CardTitle>
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{complianceStats?.total_controls || 0}</div>
                <p className="text-xs text-muted-foreground">
                  {complianceStats?.by_status.compliant || 0} conformes
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Workflows Actifs</CardTitle>
                <Workflow className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {workflows.filter(w => w.is_active).length}
                </div>
                <p className="text-xs text-muted-foreground">
                  {workflows.length} au total
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Incidents Ouverts</CardTitle>
                <AlertTriangle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {incidents.filter(i => i.status === 'open' || i.status === 'investigating').length}
                </div>
                <p className="text-xs text-muted-foreground">
                  {incidents.filter(i => i.severity === 'high' || i.severity === 'critical').length} critiques
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Scores par standard */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Shield className="h-5 w-5 mr-2" />
                  ISO 27001
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold mb-2">
                  {calculateComplianceScore('iso_27001')}%
                </div>
                <Progress value={calculateComplianceScore('iso_27001')} className="mb-4" />
                <div className="text-sm text-muted-foreground">
                  {complianceStats?.by_standard.iso_27001?.compliant || 0} / {complianceStats?.by_standard.iso_27001?.total || 0} contrôles
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <CheckCircle className="h-5 w-5 mr-2" />
                  SOC 2
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold mb-2">
                  {calculateComplianceScore('soc_2')}%
                </div>
                <Progress value={calculateComplianceScore('soc_2')} className="mb-4" />
                <div className="text-sm text-muted-foreground">
                  {complianceStats?.by_standard.soc_2?.compliant || 0} / {complianceStats?.by_standard.soc_2?.total || 0} contrôles
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Users className="h-5 w-5 mr-2" />
                  RGPD
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold mb-2">
                  {calculateComplianceScore('rgpd')}%
                </div>
                <Progress value={calculateComplianceScore('rgpd')} className="mb-4" />
                <div className="text-sm text-muted-foreground">
                  {complianceStats?.by_standard.rgpd?.compliant || 0} / {complianceStats?.by_standard.rgpd?.total || 0} contrôles
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Alertes */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center text-red-600">
                  <AlertCircle className="h-5 w-5 mr-2" />
                  Contrôles en Retard
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {getOverdueControls().slice(0, 5).map(control => (
                    <div key={control.id} className="flex items-center justify-between p-2 bg-red-50 rounded">
                      <div>
                        <div className="font-medium">{control.control_id}</div>
                        <div className="text-sm text-muted-foreground">{control.title}</div>
                      </div>
                      <Badge variant="destructive">
                        {Math.ceil((new Date().getTime() - new Date(control.next_review_date).getTime()) / (1000 * 60 * 60 * 24))}j
                      </Badge>
                    </div>
                  ))}
                  {getOverdueControls().length === 0 && (
                    <p className="text-sm text-muted-foreground">Aucun contrôle en retard</p>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center text-orange-600">
                  <AlertTriangle className="h-5 w-5 mr-2" />
                  Risques Élevés
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {getHighRiskNonCompliant().slice(0, 5).map(control => (
                    <div key={control.id} className="flex items-center justify-between p-2 bg-orange-50 rounded">
                      <div>
                        <div className="font-medium">{control.control_id}</div>
                        <div className="text-sm text-muted-foreground">{control.title}</div>
                      </div>
                      <Badge className={getRiskColor(control.risk_level)}>
                        {control.risk_level}
                      </Badge>
                    </div>
                  ))}
                  {getHighRiskNonCompliant().length === 0 && (
                    <p className="text-sm text-muted-foreground">Aucun risque élevé</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Conformité */}
        <TabsContent value="compliance" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Contrôles de Conformité</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Contrôle</TableHead>
                    <TableHead>Standard</TableHead>
                    <TableHead>Catégorie</TableHead>
                    <TableHead>Risque</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Responsable</TableHead>
                    <TableHead>Prochaine Revue</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {controls.map(control => (
                    <TableRow key={control.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{control.control_id}</div>
                          <div className="text-sm text-muted-foreground">{control.title}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{control.standard}</Badge>
                      </TableCell>
                      <TableCell>{control.category}</TableCell>
                      <TableCell>
                        <Badge className={getRiskColor(control.risk_level)}>
                          {control.risk_level}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(control.status)}>
                          {control.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{control.responsible_person}</TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {new Date(control.next_review_date).toLocaleDateString()}
                          {new Date(control.next_review_date) < new Date() && (
                            <Badge variant="destructive" className="ml-2">En retard</Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Button variant="outline" size="sm">
                          Éditer
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Workflows */}
        <TabsContent value="workflows" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Workflows Personnalisables</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Workflow</TableHead>
                    <TableHead>Type Document</TableHead>
                    <TableHead>Version</TableHead>
                    <TableHead>Durée Estimée</TableHead>
                    <TableHead>SLA</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {workflows.map(workflow => (
                    <TableRow key={workflow.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{workflow.name}</div>
                          <div className="text-sm text-muted-foreground">{workflow.description}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{workflow.document_type}</Badge>
                      </TableCell>
                      <TableCell>{workflow.version}</TableCell>
                      <TableCell>{workflow.estimated_total_duration}h</TableCell>
                      <TableCell>{workflow.sla_hours}h</TableCell>
                      <TableCell>
                        <Badge className={workflow.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                          {workflow.is_active ? 'Actif' : 'Inactif'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button variant="outline" size="sm">
                            Configurer
                          </Button>
                          <Button variant="outline" size="sm">
                            Tester
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Incidents */}
        <TabsContent value="incidents" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Incidents de Sécurité</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Incident</TableHead>
                    <TableHead>Sévérité</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Utilisateurs Affectés</TableHead>
                    <TableHead>Détecté le</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {incidents.map(incident => (
                    <TableRow key={incident.id}>
                      <TableCell>
                        <div className="font-medium">{incident.title}</div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getSeverityColor(incident.severity)}>
                          {incident.severity}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(incident.status)}>
                          {incident.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{incident.affected_users}</TableCell>
                      <TableCell>
                        {new Date(incident.detected_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Button variant="outline" size="sm">
                          Détails
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Audit */}
        <TabsContent value="audit" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Logs d'Audit</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Activité récente</span>
                    <Button variant="outline" size="sm">
                      Voir tout
                    </Button>
                  </div>
                  <div className="space-y-2">
                    <div className="p-2 bg-gray-50 rounded">
                      <div className="text-sm font-medium">Connexion utilisateur</div>
                      <div className="text-xs text-muted-foreground">il y a 5 min</div>
                    </div>
                    <div className="p-2 bg-gray-50 rounded">
                      <div className="text-sm font-medium">Modification document</div>
                      <div className="text-xs text-muted-foreground">il y a 15 min</div>
                    </div>
                    <div className="p-2 bg-gray-50 rounded">
                      <div className="text-sm font-medium">Création workflow</div>
                      <div className="text-xs text-muted-foreground">il y a 1h</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Rapports de Conformité</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Rapports disponibles</span>
                    <Button variant="outline" size="sm">
                      Générer
                    </Button>
                  </div>
                  <div className="space-y-2">
                    <div className="p-2 bg-blue-50 rounded">
                      <div className="text-sm font-medium">Rapport ISO 27001 - Q4 2024</div>
                      <div className="text-xs text-muted-foreground">Score: 85%</div>
                    </div>
                    <div className="p-2 bg-green-50 rounded">
                      <div className="text-sm font-medium">Audit SOC 2 - Décembre 2024</div>
                      <div className="text-xs text-muted-foreground">Score: 92%</div>
                    </div>
                    <div className="p-2 bg-purple-50 rounded">
                      <div className="text-sm font-medium">Évaluation RGPD - Novembre 2024</div>
                      <div className="text-xs text-muted-foreground">Score: 88%</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
};

export default ComplianceDashboard; 