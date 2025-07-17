import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./card";
import { Button } from "./button";
import { Badge } from "./badge";
import { Progress } from "./progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./tabs";
import { useExpert } from "@/contexts/ExpertContext";
import { 
  Briefcase, 
  Bell, 
  Clock, 
  AlertTriangle, 
  DollarSign, 
  Plus, 
  Settings, 
  RefreshCw, 
  Eye, 
  Edit, 
  Play, 
  Activity, 
  Download,
  CheckCircle,
  Star,
  Users
} from "lucide-react";

export const ExpertDashboard: React.FC = () => {
  const {
    assignments,
    notifications,
    workflows,
    analytics,
    loading,
    error,
    acceptAssignment,
    completeAssignment,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    deleteNotification,
    completeWorkflowStep
  } = useExpert();

  const [selectedTab, setSelectedTab] = useState('overview');

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
      case 'cancelled':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      case 'high':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
      default:
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'assignment':
        return <Briefcase className="w-4 h-4" />;
      case 'deadline':
        return <Clock className="w-4 h-4" />;
      case 'payment':
        return <DollarSign className="w-4 h-4" />;
      default:
        return <Bell className="w-4 h-4" />;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 mx-auto text-red-500 mb-4" />
          <p className="text-red-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            Dashboard Expert
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Gérez vos assignations et suivez vos performances
          </p>
        </div>
        
        <div className="flex items-center space-x-4">
          <Button variant="outline" size="sm">
            <Settings className="w-4 h-4 mr-2" />
            Préférences
          </Button>
          
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Exporter
          </Button>
        </div>
      </div>

      {/* Statistiques rapides */}
      {analytics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                  <Briefcase className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Assignations actives
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    {assignments.filter(a => a.status === 'in_progress').length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
                  <DollarSign className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Gains du mois
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    {formatCurrency(analytics.monthlyEarnings)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="p-2 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
                  <Star className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Score performance
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    {analytics.performanceScore}/100
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="p-2 bg-orange-100 dark:bg-orange-900/20 rounded-lg">
                  <Users className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Satisfaction client
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    {analytics.clientSatisfaction}/5
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Onglets principaux */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
          <TabsTrigger value="assignments">Assignations</TabsTrigger>
          <TabsTrigger value="workflows">Workflows</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        {/* Vue d'ensemble */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Assignations récentes */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Assignations récentes</span>
                  <Button variant="outline" size="sm">
                    <Eye className="w-4 h-4 mr-2" />
                    Voir tout
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {assignments.slice(0, 3).map((assignment) => (
                    <div key={assignment.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                          <Briefcase className="w-4 h-4 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-gray-100">
                            {assignment.clientName}
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {assignment.productType}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge className={getStatusColor(assignment.status)}>
                          {assignment.status === 'in_progress' ? 'En cours' : 
                           assignment.status === 'pending' ? 'En attente' :
                           assignment.status === 'completed' ? 'Terminé' : 'Annulé'}
                        </Badge>
                        <p className="text-sm text-gray-600 mt-1">
                          {assignment.progress}%
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Notifications récentes */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Notifications récentes</span>
                  <Button variant="outline" size="sm">
                    <Bell className="w-4 h-4 mr-2" />
                    Voir tout
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {notifications.slice(0, 3).map((notification) => (
                    <div key={notification.id} className="flex items-start space-x-3 p-3 border rounded-lg">
                      <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded-lg">
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-gray-900 dark:text-gray-100">
                          {notification.title}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {notification.message}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {formatDateTime(notification.timestamp)}
                        </p>
                      </div>
                      {!notification.read && (
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Workflows en cours */}
          <Card>
            <CardHeader>
              <CardTitle>Workflows en cours</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {workflows.map((workflow) => (
                  <div key={workflow.id} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium text-gray-900 dark:text-gray-100">
                        Dossier {workflow.dossierId}
                      </h4>
                      <Badge variant="outline">
                        Étape {workflow.step}/{workflow.totalSteps}
                      </Badge>
                    </div>
                    
                    <div className="mb-3">
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                        {workflow.currentStep.name}
                      </p>
                      <Progress value={(workflow.step / workflow.totalSteps) * 100} className="h-2" />
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Button size="sm" variant="outline">
                        <Eye className="w-4 h-4 mr-2" />
                        Détails
                      </Button>
                      <Button size="sm">
                        <Play className="w-4 h-4 mr-2" />
                        Continuer
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Assignations */}
        <TabsContent value="assignments" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Mes Assignations</span>
                <div className="flex items-center space-x-2">
                  <Button variant="outline" size="sm">
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Actualiser
                  </Button>
                  <Button size="sm">
                    <Plus className="w-4 h-4 mr-2" />
                    Nouvelle
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {assignments.map((assignment) => (
                  <div key={assignment.id} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                          <Briefcase className="w-4 h-4 text-blue-600" />
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900 dark:text-gray-100">
                            {assignment.clientName}
                          </h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {assignment.productType} • {assignment.dossierId}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge className={getStatusColor(assignment.status)}>
                          {assignment.status === 'in_progress' ? 'En cours' : 
                           assignment.status === 'pending' ? 'En attente' :
                           assignment.status === 'completed' ? 'Terminé' : 'Annulé'}
                        </Badge>
                        <Badge className={getPriorityColor(assignment.priority)}>
                          {assignment.priority}
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="mb-3">
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span>Progression</span>
                        <span>{assignment.progress}%</span>
                      </div>
                      <Progress value={assignment.progress} className="h-2" />
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600 dark:text-gray-400">Assigné le:</span>
                        <p>{formatDate(assignment.assignedAt)}</p>
                      </div>
                      {assignment.deadline && (
                        <div>
                          <span className="text-gray-600 dark:text-gray-400">Échéance:</span>
                          <p>{formatDate(assignment.deadline)}</p>
                        </div>
                      )}
                      {assignment.compensation && (
                        <div>
                          <span className="text-gray-600 dark:text-gray-400">Compensation:</span>
                          <p className="font-medium">{formatCurrency(assignment.compensation)}</p>
                        </div>
                      )}
                      {assignment.estimatedDuration && (
                        <div>
                          <span className="text-gray-600 dark:text-gray-400">Durée estimée:</span>
                          <p>{assignment.estimatedDuration}h</p>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center space-x-2 mt-4">
                      {assignment.status === 'pending' && (
                        <>
                          <Button size="sm" onClick={() => acceptAssignment(assignment.id)}>
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Accepter
                          </Button>
                          <Button size="sm" variant="outline">
                            <AlertTriangle className="w-4 h-4 mr-2" />
                            Rejeter
                          </Button>
                        </>
                      )}
                      
                      {assignment.status === 'in_progress' && (
                        <>
                          <Button size="sm" variant="outline">
                            <Edit className="w-4 h-4 mr-2" />
                            Mettre à jour
                          </Button>
                          <Button size="sm" onClick={() => completeAssignment(assignment.id)}>
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Terminer
                          </Button>
                        </>
                      )}
                      
                      <Button size="sm" variant="outline">
                        <Eye className="w-4 h-4 mr-2" />
                        Détails
                      </Button>
                      
                      <Button size="sm" variant="outline">
                        <Download className="w-4 h-4 mr-2" />
                        Rapport
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Workflows */}
        <TabsContent value="workflows" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Workflows en cours</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {workflows.map((workflow) => (
                  <div key={workflow.id} className="p-6 border rounded-lg">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h4 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                          Dossier {workflow.dossierId}
                        </h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Étape {workflow.step} sur {workflow.totalSteps}
                        </p>
                      </div>
                      <Badge variant="outline">
                        {workflow.currentStep.status === 'in_progress' ? 'En cours' :
                         workflow.currentStep.status === 'pending' ? 'En attente' :
                         workflow.currentStep.status === 'completed' ? 'Terminé' : 'Bloqué'}
                      </Badge>
                    </div>
                    
                    <div className="mb-4">
                      <Progress value={(workflow.step / workflow.totalSteps) * 100} className="h-3" />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h5 className="font-medium text-gray-900 dark:text-gray-100 mb-2">
                          Étape actuelle
                        </h5>
                        <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                          <p className="font-medium">{workflow.currentStep.name}</p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {workflow.currentStep.description}
                          </p>
                          {workflow.currentStep.deadline && (
                            <p className="text-sm text-gray-500 mt-1">
                              Échéance: {formatDate(workflow.currentStep.deadline)}
                            </p>
                          )}
                        </div>
                      </div>
                      
                      {workflow.nextStep && (
                        <div>
                          <h5 className="font-medium text-gray-900 dark:text-gray-100 mb-2">
                            Prochaine étape
                          </h5>
                          <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                            <p className="font-medium">{workflow.nextStep.name}</p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {workflow.nextStep.description}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center space-x-2 mt-4">
                      <Button onClick={() => completeWorkflowStep(workflow.id)}>
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Terminer l'étape
                      </Button>
                      <Button variant="outline">
                        <Eye className="w-4 h-4 mr-2" />
                        Voir l'historique
                      </Button>
                      <Button variant="outline">
                        <Download className="w-4 h-4 mr-2" />
                        Rapport
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications */}
        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Notifications</span>
                <Button variant="outline" size="sm" onClick={markAllNotificationsAsRead}>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Tout marquer comme lu
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {notifications.map((notification) => (
                  <div key={notification.id} className="flex items-start space-x-3 p-4 border rounded-lg">
                    <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded-lg">
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <p className="font-medium text-gray-900 dark:text-gray-100">
                          {notification.title}
                        </p>
                        <div className="flex items-center space-x-2">
                          {!notification.read && (
                            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                          )}
                          <Badge className={getPriorityColor(notification.priority)}>
                            {notification.priority}
                          </Badge>
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                        {notification.message}
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatDateTime(notification.timestamp)}
                      </p>
                      {notification.action && (
                        <Button size="sm" variant="outline" className="mt-2">
                          {notification.action.label}
                        </Button>
                      )}
                    </div>
                    <div className="flex items-center space-x-1">
                      {!notification.read && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => markNotificationAsRead(notification.id)}
                        >
                          <CheckCircle className="w-4 h-4" />
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => deleteNotification(notification.id)}
                      >
                        <AlertTriangle className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics */}
        <TabsContent value="analytics" className="space-y-6">
          {analytics && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Produits les plus demandés</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {analytics.topProducts.map((product) => (
                        <div key={product.name} className="flex items-center justify-between">
                          <span className="text-sm font-medium">{product.name}</span>
                          <div className="flex items-center space-x-2">
                            <span className="text-sm text-gray-600">{product.count} dossiers</span>
                            <span className="text-sm font-medium">{formatCurrency(product.revenue)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Activité récente</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {analytics.recentActivity.map((activity, index) => (
                        <div key={index} className="flex items-start space-x-3">
                          <div className="p-1 bg-blue-100 dark:bg-blue-900/20 rounded">
                            <Activity className="w-3 h-3 text-blue-600" />
                          </div>
                          <div className="flex-1">
                            <p className="text-sm text-gray-900 dark:text-gray-100">
                              {activity.description}
                            </p>
                            <p className="text-xs text-gray-500">
                              {formatDateTime(activity.timestamp)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Statistiques détaillées</span>
                    <Button variant="outline" size="sm">
                      <Download className="w-4 h-4 mr-2" />
                      Exporter rapport
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                        {analytics.totalAssignments}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Total assignations
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                        {analytics.completedAssignments}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Assignations terminées
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                        {analytics.averageCompletionTime}j
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Temps moyen
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                        {formatCurrency(analytics.totalEarnings)}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Gains totaux
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          
)}
        </TabsContent>
      </Tabs>
    </div>
  );
}; 