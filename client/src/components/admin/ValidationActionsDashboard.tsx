import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/design-system/Card';
import Button from '@/components/ui/design-system/Button';
import Badge from '@/components/ui/design-system/Badge';
import { useToast } from '@/components/ui/toast-notifications';
import { useValidationData } from '@/hooks/use-validation-data';
import { 
  FileText, 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertTriangle,
  Eye,
  MessageSquare,
  Plus,
  Zap,
  Search,
  RefreshCw,
  DollarSign,
  Target,
  TrendingUp,
  UserCheck,
  FileCheck,
  Building,
  Phone,
  Mail,
  MapPin,
  ExternalLink
} from 'lucide-react';

// ============================================================================
// DASHBOARD VALIDATION & ACTIONS RAPIDES RÉVOLUTIONNAIRE
// ============================================================================
// Interface haute couture pour validation experts, dossiers, pré-éligibilités

interface ValidationItem {
  id: string;
  type: 'expert' | 'dossier' | 'pre_eligibilite';
  title: string;
  subtitle: string;
  status: 'pending' | 'approved' | 'rejected';
  priority: 'low' | 'medium' | 'high' | 'critical';
  createdAt: string;
  updatedAt: string;
  metadata: any;
  actions: string[];
}

interface ValidationActionsDashboardProps {
  onActionClick?: (action: string, itemId?: string) => void;
}

export const ValidationActionsDashboard: React.FC<ValidationActionsDashboardProps> = ({ 
  onActionClick 
}) => {
  const [activeTab, setActiveTab] = useState<'experts' | 'dossiers' | 'pre_eligibilite' | 'actions'>('experts');
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedItem, setSelectedItem] = useState<ValidationItem | null>(null);

  const { addToast } = useToast();

  // Hook de données de validation
  const {
    validationItems,
    stats,
    isLoading,
    error,
    refreshData,
    approveItem,
    rejectItem
  } = useValidationData({
    autoRefresh: true,
    refreshInterval: 30000
  });

  // ===== EFFETS =====

  useEffect(() => {
    refreshData();
  }, [activeTab, filterStatus, refreshData]);

  // ===== ACTIONS DE VALIDATION =====

  const handleValidationAction = async (action: string, itemId: string) => {
    try {
      const item = validationItems.find(item => item.id === itemId);
      if (!item) return;

      if (action === 'approve' || action === 'validate') {
        await approveItem(itemId, item.type);
      } else if (action === 'reject') {
        await rejectItem(itemId, item.type);
      }

      addToast({
        type: 'success',
        title: 'Action réussie',
        message: `Action ${action} effectuée avec succès`,
        duration: 3000
      });

      onActionClick?.(action, itemId);
    } catch (error) {
      addToast({
        type: 'error',
        title: 'Erreur',
        message: `Erreur lors de l'action ${action}`,
        duration: 5000
      });
    }
  };

  // ===== COMPOSANTS UI =====

  const PriorityBadge = ({ priority }: { priority: string }) => {
    const config = {
      low: { color: 'bg-green-100 text-green-800', icon: CheckCircle },
      medium: { color: 'bg-yellow-100 text-yellow-800', icon: Clock },
      high: { color: 'bg-orange-100 text-orange-800', icon: AlertTriangle },
      critical: { color: 'bg-red-100 text-red-800', icon: AlertTriangle }
    };

    const { color, icon: Icon } = config[priority as keyof typeof config];
    
    return (
      <Badge variant="base" className={color}>
        <Icon className="w-3 h-3 mr-1" />
        {priority.toUpperCase()}
      </Badge>
    );
  };

  const StatusBadge = ({ status }: { status: string }) => {
    const config = {
      pending: { color: 'bg-yellow-100 text-yellow-800', text: 'En attente' },
      approved: { color: 'bg-green-100 text-green-800', text: 'Approuvé' },
      rejected: { color: 'bg-red-100 text-red-800', text: 'Rejeté' }
    };

    const { color, text } = config[status as keyof typeof config];
    
    return (
      <Badge variant="base" className={color}>
        {text}
      </Badge>
    );
  };

  const ValidationItemCard = ({ item }: { item: ValidationItem }) => {
    const isSelected = selectedItem?.id === item.id;
    
    return (
      <Card 
        className={`cursor-pointer transition-all duration-300 hover:shadow-lg ${
          isSelected ? 'ring-2 ring-blue-500 bg-blue-50' : ''
        }`}
        onClick={() => setSelectedItem(isSelected ? null : item)}
      >
        <CardContent className="p-4">
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                {item.type === 'expert' && <UserCheck className="w-4 h-4 text-blue-600" />}
                {item.type === 'dossier' && <FileText className="w-4 h-4 text-green-600" />}
                {item.type === 'pre_eligibilite' && <FileCheck className="w-4 h-4 text-purple-600" />}
                <h3 className="font-semibold text-gray-900">{item.title}</h3>
              </div>
              <p className="text-sm text-gray-600 mb-2">{item.subtitle}</p>
              <div className="flex items-center gap-2">
                <StatusBadge status={item.status} />
                <PriorityBadge priority={item.priority} />
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-500">
                {new Date(item.createdAt).toLocaleDateString('fr-FR')}
              </p>
              <p className="text-xs text-gray-500">
                {new Date(item.updatedAt).toLocaleTimeString('fr-FR')}
              </p>
            </div>
          </div>

          {/* Actions rapides */}
          {item.status === 'pending' && (
            <div className="flex gap-2 mt-3">
              <Button
                size="sm"
                variant="base"
                className="bg-green-600 hover:bg-green-700"
                onClick={(e) => {
                  e.stopPropagation();
                  handleValidationAction('approve', item.id);
                }}
                disabled={isLoading}
              >
                <CheckCircle className="w-3 h-3 mr-1" />
                Approuver
              </Button>
                             <Button
                 size="sm"
                 variant="secondary"
                 className="border-red-300 text-red-600 hover:bg-red-50"
                 onClick={(e) => {
                   e.stopPropagation();
                   handleValidationAction('reject', item.id);
                 }}
                 disabled={isLoading}
               >
                 <XCircle className="w-3 h-3 mr-1" />
                 Rejeter
               </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedItem(item);
                }}
              >
                <Eye className="w-3 h-3 mr-1" />
                Voir
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  const ItemDetailModal = ({ item }: { item: ValidationItem }) => {
    if (!item) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">{item.title}</h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedItem(null)}
            >
              <XCircle className="w-5 h-5" />
            </Button>
          </div>

          <div className="space-y-4">
            {/* Informations générales */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-gray-600">Type</p>
                <p className="text-sm text-gray-900 capitalize">{item.type}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Statut</p>
                <StatusBadge status={item.status} />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Priorité</p>
                <PriorityBadge priority={item.priority} />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Créé le</p>
                <p className="text-sm text-gray-900">
                  {new Date(item.createdAt).toLocaleString('fr-FR')}
                </p>
              </div>
            </div>

            {/* Métadonnées spécifiques */}
            <div className="border-t pt-4">
              <h3 className="font-semibold text-gray-900 mb-3">Détails</h3>
              {item.type === 'expert' && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-gray-500" />
                    <span className="text-sm">{item.metadata.email}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-gray-500" />
                    <span className="text-sm">{item.metadata.phone}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-gray-500" />
                    <span className="text-sm">{item.metadata.location}</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-1">Spécialités</p>
                    <div className="flex flex-wrap gap-1">
                      {item.metadata.specialities.map((spec: string, index: number) => (
                        <Badge key={index} variant="base" className="text-xs">
                          {spec}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {item.type === 'dossier' && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Building className="w-4 h-4 text-gray-500" />
                    <span className="text-sm">{item.metadata.client}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-gray-500" />
                    <span className="text-sm">{item.metadata.montant.toLocaleString()}€</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <UserCheck className="w-4 h-4 text-gray-500" />
                    <span className="text-sm">{item.metadata.expert}</span>
                  </div>
                </div>
              )}

              {item.type === 'pre_eligibilite' && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Building className="w-4 h-4 text-gray-500" />
                    <span className="text-sm">{item.metadata.client}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Target className="w-4 h-4 text-gray-500" />
                    <span className="text-sm">{item.metadata.produit}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-gray-500" />
                    <span className="text-sm">{item.metadata.montant_estime.toLocaleString()}€</span>
                  </div>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="border-t pt-4">
              <h3 className="font-semibold text-gray-900 mb-3">Actions</h3>
              <div className="flex gap-2 flex-wrap">
                {item.status === 'pending' && (
                  <>
                    <Button
                      variant="base"
                      className="bg-green-600 hover:bg-green-700"
                      onClick={() => {
                        handleValidationAction('approve', item.id);
                        setSelectedItem(null);
                      }}
                      disabled={isLoading}
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Approuver
                    </Button>
                                         <Button
                       variant="secondary"
                       className="border-red-300 text-red-600 hover:bg-red-50"
                       onClick={() => {
                         handleValidationAction('reject', item.id);
                         setSelectedItem(null);
                       }}
                       disabled={isLoading}
                     >
                       <XCircle className="w-4 h-4 mr-2" />
                       Rejeter
                     </Button>
                  </>
                )}
                <Button
                  variant="ghost"
                  onClick={() => onActionClick?.('contact', item.id)}
                >
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Contacter
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => onActionClick?.('view_documents', item.id)}
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Voir documents
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // ===== FILTRES ET RECHERCHE =====

  const filteredItems = validationItems.filter(item => {
    const matchesStatus = filterStatus === 'all' || item.status === filterStatus;
    const matchesSearch = item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.subtitle.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = activeTab === 'experts' ? item.type === 'expert' :
                       activeTab === 'dossiers' ? item.type === 'dossier' :
                       activeTab === 'pre_eligibilite' ? item.type === 'pre_eligibilite' : true;
    
    return matchesStatus && matchesSearch && matchesType;
  });

  // ===== RENDU PRINCIPAL =====

  return (
    <div className="space-y-6">
      {/* Affichage des erreurs */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              <span>Erreur: {error}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Header avec statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-r from-blue-50 to-blue-100">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-600">Experts en attente</p>
                <p className="text-2xl font-bold text-blue-900">
                  {stats.expertsPending}
                </p>
              </div>
              <UserCheck className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-green-50 to-green-100">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-600">Dossiers à valider</p>
                <p className="text-2xl font-bold text-green-900">
                  {stats.dossiersPending}
                </p>
              </div>
              <FileText className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-purple-50 to-purple-100">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-600">Pré-éligibilités</p>
                <p className="text-2xl font-bold text-purple-900">
                  {stats.preEligibilitesPending}
                </p>
              </div>
              <FileCheck className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-orange-50 to-orange-100">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-orange-600">Critiques</p>
                <p className="text-2xl font-bold text-orange-900">
                  {stats.criticalItems}
                </p>
              </div>
              <AlertTriangle className="w-8 h-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Navigation par onglets */}
      <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
        {[
          { id: 'experts', label: 'Experts', icon: UserCheck, count: validationItems.filter(i => i.type === 'expert').length },
          { id: 'dossiers', label: 'Dossiers', icon: FileText, count: validationItems.filter(i => i.type === 'dossier').length },
          { id: 'pre_eligibilite', label: 'Pré-éligibilités', icon: FileCheck, count: validationItems.filter(i => i.type === 'pre_eligibilite').length },
          { id: 'actions', label: 'Actions', icon: Zap, count: 0 }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
              activeTab === tab.id
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <tab.icon className="h-4 w-4" />
            <span>{tab.label}</span>
            {tab.count > 0 && (
              <Badge variant="base" className="ml-1">
                {tab.count}
              </Badge>
            )}
          </button>
        ))}
      </div>

      {/* Filtres et recherche */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
        <div className="flex gap-2">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as any)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">Tous les statuts</option>
            <option value="pending">En attente</option>
            <option value="approved">Approuvés</option>
            <option value="rejected">Rejetés</option>
          </select>
          <Button
            variant="ghost"
            onClick={refreshData}
            disabled={isLoading}
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Contenu des onglets */}
      {activeTab !== 'actions' && (
        <div className="space-y-4">
          {isLoading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : filteredItems.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Aucun élément à valider</h3>
                <p className="text-gray-600">Tous les éléments ont été traités ou aucun ne correspond aux critères.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {filteredItems.map((item) => (
                <ValidationItemCard key={item.id} item={item} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Onglet Actions rapides */}
      {activeTab === 'actions' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Button
              variant="secondary"
              className="h-24 flex flex-col items-center justify-center space-y-2 hover:shadow-lg transition-all"
              onClick={() => onActionClick?.('create_client')}
            >
              <Plus className="w-6 h-6" />
              <span>Nouveau Client</span>
            </Button>
            
            <Button
              variant="secondary"
              className="h-24 flex flex-col items-center justify-center space-y-2 hover:shadow-lg transition-all"
              onClick={() => onActionClick?.('create_expert')}
            >
              <UserCheck className="w-6 h-6" />
              <span>Nouvel Expert</span>
            </Button>
            
            <Button
              variant="secondary"
              className="h-24 flex flex-col items-center justify-center space-y-2 hover:shadow-lg transition-all"
              onClick={() => onActionClick?.('messagerie_admin')}
            >
              <MessageSquare className="w-6 h-6" />
              <span>Messagerie Admin</span>
            </Button>
            
            <Button
              variant="secondary"
              className="h-24 flex flex-col items-center justify-center space-y-2 hover:shadow-lg transition-all"
              onClick={() => onActionClick?.('documentation')}
            >
              <FileText className="w-6 h-6" />
              <span>Documentation</span>
            </Button>
          </div>

          {/* Actions recommandées */}
          <Card className="border-blue-200 bg-blue-50">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-blue-800">
                <Zap className="h-5 w-5" />
                <span>Actions Recommandées</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {validationItems.filter(i => i.priority === 'critical').length > 0 && (
                  <div className="flex items-center justify-between p-3 bg-red-100 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <AlertTriangle className="w-4 h-4 text-red-600" />
                      <span className="text-sm font-medium text-red-800">
                        {validationItems.filter(i => i.priority === 'critical').length} éléments critiques en attente
                      </span>
                    </div>
                    <Button size="sm" variant="base" className="bg-red-600 hover:bg-red-700">
                      Traiter maintenant
                    </Button>
                  </div>
                )}
                
                <div className="flex items-center justify-between p-3 bg-green-100 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <TrendingUp className="w-4 h-4 text-green-600" />
                    <span className="text-sm font-medium text-green-800">
                      Performance validation: +15% ce mois
                    </span>
                  </div>
                  <Badge variant="base" className="bg-green-600 text-white">
                    Excellent
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Modal de détail */}
      {selectedItem && (
        <ItemDetailModal item={selectedItem} />
      )}
    </div>
  );
}; 