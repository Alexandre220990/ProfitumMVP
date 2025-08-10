import { useState, useEffect } from 'react';
import { Navigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { get } from "@/lib/api";
import HeaderAdmin from "@/components/HeaderAdmin";
import { 
  RefreshCw, UserPlus, Users, FileText, 
  Eye, ClipboardList, Edit, Check, X
} from "lucide-react";
import { motion } from "framer-motion";

// ============================================================================
// TYPES ET INTERFACES
// ============================================================================

interface SectionData {
  experts: any[];
  clients: any[];
  dossiers: any[];
}

interface ClientProduitEligible {
  id: string;
  clientId: string;
  produitId: string;
  statut: 'pending' | 'validated' | 'rejected' | 'in_progress';
  progress: number;
  montantFinal?: number;
  tauxFinal?: number;
  documents_sent?: string[];
  expert_id?: string;
  created_at: string;
  updated_at: string;
  Client?: {
    id: string;
    company_name: string;
    email: string;
    statut: string;
  };
  ProduitEligible?: {
    id: string;
    nom: string;
    description: string;
    montant: number;
    taux: number;
  };
}

type ActiveSection = 'overview' | 'experts' | 'clients' | 'dossiers';

// ============================================================================
// DASHBOARD ADMIN OPTIMISÉ - VUE MÉTIER PURE
// ============================================================================
// Interface simplifiée pour un pilotage optimal de l'activité

const AdminDashboardOptimized: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  // ===== ÉTATS LOCAUX =====
  const [activeSection, setActiveSection] = useState<ActiveSection>('overview');
  const [sectionData, setSectionData] = useState<SectionData>({
    experts: [],
    clients: [],
    dossiers: []
  });
  const [loading, setLoading] = useState(false);
  
  // ===== DONNÉES KPI =====
  const [kpiData, setKpiData] = useState({
    totalClients: 0,
    clientsThisMonth: 0,
    totalExperts: 0,
    activeExperts: 0,
    pendingExperts: 0,
    totalDossiers: 0,
    pendingDossiers: 0,
    montantPotentiel: 0,
    montantRealise: 0
  });

  // Fonction utilitaire pour formater les montants
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  // ========================================
  // CHARGEMENT DES DONNÉES
  // ========================================

  useEffect(() => {
    loadKPIData();
    loadSectionData('overview');
  }, []);

  // Charger les données quand la section change
  useEffect(() => {
    console.log('🔄 Section changée:', activeSection);
    if (activeSection !== 'overview') {
      console.log('📡 Chargement des données pour:', activeSection);
      loadSectionData(activeSection);
    }
  }, [activeSection]);

  // Test d'authentification admin
  useEffect(() => {
    const testAdminAuth = async () => {
      try {
        console.log('🧪 Test authentification admin...');
        
        // Test de base
        const testResponse = await get('/admin/test');
        console.log('✅ Test admin de base:', testResponse.success);
        
        // Test de diagnostic détaillé
        const diagnosticResponse = await get('/admin/diagnostic');
        console.log('✅ Test diagnostic admin:', diagnosticResponse.success);
        
        if (diagnosticResponse.success) {
          console.log('📊 Diagnostic admin:', diagnosticResponse.data);
        } else {
          console.error('❌ Erreur diagnostic admin:', diagnosticResponse.message);
        }
        
      } catch (error) {
        console.error('❌ Erreur test admin auth:', error);
      }
    };
    
    if (user?.id && user.type === 'admin') {
      testAdminAuth();
    }
  }, [user?.id, user?.type]);

  // ========================================
  // CHARGEMENT DES DONNÉES KPI
  // ========================================
  
  const loadKPIData = async () => {
    try {
      console.log('📊 Chargement des données KPI...');
      
      // Charger les clients
      const clientsResponse = await get('/admin/clients');
      const clients = clientsResponse.success ? (clientsResponse.data as any)?.clients || [] : [];
      
      // Charger les experts
      const expertsResponse = await get('/admin/experts');
      const experts = expertsResponse.success ? (expertsResponse.data as any)?.experts || [] : [];
      
      // Charger les dossiers
      const dossiersResponse = await get('/admin/dossiers');
      const dossiers = dossiersResponse.success ? (dossiersResponse.data as any)?.dossiers || [] : [];
      
      // Calculer les KPIs
      const totalClients = clients.length;
      const clientsThisMonth = clients.filter((client: any) => {
        const clientDate = new Date(client.created_at);
        const now = new Date();
        return clientDate.getMonth() === now.getMonth() && clientDate.getFullYear() === now.getFullYear();
      }).length;
      
      const totalExperts = experts.length;
      const activeExperts = experts.filter((expert: any) => expert.approval_status === 'approved').length;
      const pendingExperts = experts.filter((expert: any) => expert.approval_status === 'pending').length;
      
      const totalDossiers = dossiers.length;
      const pendingDossiers = dossiers.filter((dossier: any) => dossier.statut === 'pending').length;
      
      const montantPotentiel = dossiers.reduce((sum: number, dossier: any) => {
        return sum + (dossier.montantFinal || 0);
      }, 0);
      
      const montantRealise = dossiers.filter((dossier: any) => dossier.statut === 'validated')
        .reduce((sum: number, dossier: any) => {
          return sum + (dossier.montantFinal || 0);
        }, 0);
      
      // Mettre à jour les KPIs
      setKpiData({
        totalClients,
        clientsThisMonth,
        totalExperts,
        activeExperts,
        pendingExperts,
        totalDossiers,
        pendingDossiers,
        montantPotentiel,
        montantRealise
      });
      
      console.log('✅ KPIs mis à jour:', {
        totalClients,
        clientsThisMonth,
        totalExperts,
        activeExperts,
        pendingExperts,
        totalDossiers,
        pendingDossiers,
        montantPotentiel,
        montantRealise
      });
      
    } catch (error) {
      console.error('❌ Erreur chargement KPIs:', error);
    }
  };

  // ========================================
  // CHARGEMENT DES DONNÉES PAR SECTION
  // ========================================

  const loadSectionData = async (section: ActiveSection) => {
    if (section === 'overview') return;
    
    setLoading(true);
    try {
      console.log(`🔍 Chargement section: ${section}`);
      
      switch (section) {
        case 'experts':
          console.log('📡 Appel API /admin/experts...');
          const expertsResponse = await get('/admin/experts');
          console.log('📦 Réponse experts:', expertsResponse);
          if (expertsResponse.success) {
            setSectionData((prev: SectionData) => ({ ...prev, experts: (expertsResponse.data as any)?.experts || [] }));
          } else {
            console.error('❌ Erreur experts:', expertsResponse.message);
          }
          break;
          
        case 'clients':
          console.log('📡 Appel API /admin/clients...');
          const clientsResponse = await get('/admin/clients');
          console.log('📦 Réponse clients:', clientsResponse);
          if (clientsResponse.success) {
            setSectionData((prev: SectionData) => ({ ...prev, clients: (clientsResponse.data as any)?.clients || [] }));
          } else {
            console.error('❌ Erreur clients:', clientsResponse.message);
          }
          break;
          
        case 'dossiers':
          console.log('📡 Appel API /admin/dossiers/all...');
          const dossiersResponse = await get('/admin/dossiers/all');
          console.log('📦 Réponse dossiers:', dossiersResponse);
          if (dossiersResponse.success) {
            setSectionData((prev: SectionData) => ({ ...prev, dossiers: (dossiersResponse.data as any)?.dossiers || [] }));
          } else {
            console.error('❌ Erreur dossiers:', dossiersResponse.message);
          }
          break;
      }
    } catch (error) {
      console.error(`❌ Erreur chargement ${section}:`, error);
      toast({
        title: 'Erreur',
        description: `Impossible de charger les données ${section}`,
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  // ===== GESTION DES PERMISSIONS =====
  
  if (!user) {
    return <Navigate to="/connect-admin" replace />;
  }

  if (user.type !== 'admin') {
    if (user.type === 'client') {
      return <Navigate to="/dashboard" replace />;
    } else if (user.type === 'expert') {
      return <Navigate to="/expert" replace />;
    } else {
      return <Navigate to="/" replace />;
    }
  }

  // ========================================
  // GESTION DES ACTIONS
  // ========================================

  // ========================================
  // COMPOSANTS UI
  // ========================================

  const KPICard = ({ 
    title, 
    value, 
    change, 
    changeType, 
    icon: Icon, 
    color, 
    subtitle,
    onClick
  }: any) => (
    <Card 
      className={`cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-105 ${
        onClick ? 'hover:bg-gray-50' : ''
      }`}
      onClick={onClick}
    >
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
            {subtitle && (
              <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
            )}
            {change && (
              <div className="flex items-center mt-2">
                <span className={`text-sm font-medium ${
                  changeType === 'increase' ? 'text-green-600' : 
                  changeType === 'decrease' ? 'text-red-600' : 'text-gray-600'
                }`}>
                  {change}
                </span>
              </div>
            )}
          </div>
          <div className={`p-3 rounded-full bg-${color}-100`}>
            <Icon className={`w-6 h-6 text-${color}-600`} />
          </div>
        </div>
      </CardContent>
    </Card>
  );

  // ========================================
  // COMPOSANTS DE SECTIONS
  // ========================================

  // ========================================
  // SECTION CLIENTS - TABLEAU VISUEL
  // ========================================
  
  const ClientsAllSection = () => {
    const clients = sectionData.clients || [];
    console.log('👥 Clients dans la section:', clients.length, clients);
    
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-2xl font-bold text-slate-900">
              Tous les clients de la plateforme ({clients.length})
            </h3>
            <p className="text-slate-600 mt-1">
              Gestion complète des entreprises inscrites
            </p>
          </div>
        </div>

        {/* Tableau des clients */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">
                    Entreprise
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">
                    Contact
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">
                    Statut
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">
                    Inscription
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {clients.map((client: any) => (
                  <tr key={client.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <div>
                        <div className="font-medium text-slate-900">
                          {client.company_name || 'Entreprise Temporaire'}
                        </div>
                        {client.siren && (
                          <div className="text-sm text-slate-500">
                            SIREN: {client.siren}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-sm text-slate-900">{client.email}</div>
                        {client.phone_number && (
                          <div className="text-sm text-slate-500">{client.phone_number}</div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <Badge 
                        variant={client.statut === 'actif' ? 'default' : 'secondary'}
                        className="text-xs"
                      >
                        {client.statut || 'actif'}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {new Date(client.created_at).toLocaleDateString('fr-FR')}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => window.open(`/admin/client-details/${client.id}`, '_blank')}
                        >
                          Voir détails
                        </Button>
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => window.open(`/admin/messagerie-admin?user=${client.id}`, '_blank')}
                        >
                          Contacter
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </motion.div>
    );
  };

  // ========================================
  // SECTION EXPERTS - TABLEAU VISUEL
  // ========================================
  
  const ExpertsAllSection = () => {
    const experts = sectionData.experts || [];
    const [statusFilter, setStatusFilter] = useState<string>('all');
    console.log('👨‍💼 Experts dans la section:', experts.length, experts);
    
    // Filtrer les experts par statut
    const filteredExperts = experts.filter((expert: any) => {
      if (statusFilter === 'all') return true;
      return expert.approval_status === statusFilter;
    });
    
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-2xl font-bold text-slate-900">
              Tous les experts de la plateforme ({filteredExperts.length})
            </h3>
            <p className="text-slate-600 mt-1">
              Gestion complète des experts inscrits
            </p>
          </div>
          
          {/* Filtre par statut */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium text-slate-700">Filtrer par statut :</span>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Tous les statuts" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les statuts</SelectItem>
                  <SelectItem value="pending">En attente</SelectItem>
                  <SelectItem value="approved">Approuvés</SelectItem>
                  <SelectItem value="rejected">Rejetés</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Tableau des experts */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">
                    Expert
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">
                    Contact
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">
                    Spécialisations
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">
                    Statut
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">
                    Inscription
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredExperts.map((expert: any) => (
                  <tr key={expert.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <div>
                        <div className="font-medium text-slate-900">
                          {expert.name || expert.company_name}
                        </div>
                        {expert.company_name && expert.name && (
                          <div className="text-sm text-slate-500">
                            {expert.company_name}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-sm text-slate-900">{expert.email}</div>
                        {expert.location && (
                          <div className="text-sm text-slate-500">{expert.location}</div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {expert.specializations?.slice(0, 2).map((spec: string, index: number) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {spec}
                          </Badge>
                        ))}
                        {expert.specializations?.length > 2 && (
                          <Badge variant="secondary" className="text-xs">
                            +{expert.specializations.length - 2}
                          </Badge>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <Badge 
                        variant={
                          expert.approval_status === 'approved' ? 'default' : 
                          expert.approval_status === 'pending' ? 'secondary' : 'destructive'
                        }
                        className="text-xs"
                      >
                        {expert.approval_status === 'approved' ? 'Validé' : 
                         expert.approval_status === 'pending' ? 'En cours' : 'Rejeté'}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {new Date(expert.created_at).toLocaleDateString('fr-FR')}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => window.open(`/admin/expert-details/${expert.id}`, '_blank')}
                        >
                          Voir détails
                        </Button>
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => window.open(`/admin/messagerie-admin?user=${expert.id}`, '_blank')}
                        >
                          Contacter
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </motion.div>
    );
  };

  const DossiersProcessingSection = ({ dossiers, loading, onRefresh }: any) => {
    // Calculer les statistiques
    const totalDossiers = dossiers.length;
    const montantCumule = dossiers.reduce((sum: number, dossier: ClientProduitEligible) => {
      return sum + (dossier.montantFinal || 0);
    }, 0);
    
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <ClipboardList className="w-5 h-5 text-purple-600" />
              <span>Tous les dossiers ClientProduitEligible ({totalDossiers})</span>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm text-gray-600">Montant cumulé</p>
                <p className="text-lg font-bold text-purple-600">{formatCurrency(montantCumule)}</p>
              </div>
              <Button variant="secondary" size="sm" onClick={onRefresh} disabled={loading}>
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-gray-400" />
              <p className="text-gray-600">Chargement des dossiers...</p>
            </div>
          ) : dossiers.length === 0 ? (
            <div className="text-center py-8">
              <ClipboardList className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">Aucun dossier ClientProduitEligible trouvé</p>
            </div>
          ) : (
            <div className="space-y-4">
              {dossiers.map((dossier: ClientProduitEligible) => (
                <div key={dossier.id} className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                        <ClipboardList className="w-5 h-5 text-purple-600" />
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900">Dossier #{dossier.id}</h4>
                        <p className="text-sm text-gray-600">Client: {dossier.Client?.company_name || dossier.clientId}</p>
                        <p className="text-xs text-gray-500">Produit: {dossier.ProduitEligible?.nom || dossier.produitId}</p>
                        <p className="text-xs text-gray-400">Créé le: {new Date(dossier.created_at).toLocaleDateString('fr-FR')}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge 
                        variant={dossier.statut === 'pending' ? 'secondary' : 
                               dossier.statut === 'validated' ? 'default' : 
                               dossier.statut === 'rejected' ? 'destructive' : 'secondary'}
                      >
                        {dossier.statut}
                      </Badge>
                      {dossier.montantFinal && (
                        <p className="text-sm font-medium text-purple-600 mt-1">
                          {formatCurrency(dossier.montantFinal)}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  {/* Barre de progression */}
                  <div className="mb-3">
                    <div className="flex justify-between text-sm text-gray-600 mb-1">
                      <span>Progression</span>
                      <span>{dossier.progress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${dossier.progress}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex space-x-2">
                    <Button size="sm" variant="secondary">
                      <Eye className="w-4 h-4 mr-1" />
                      Voir détails
                    </Button>
                    <Button size="sm" variant="secondary">
                      <Edit className="w-4 h-4 mr-1" />
                      Modifier
                    </Button>
                    {dossier.statut === 'pending' && (
                      <>
                        <Button size="sm" variant="default" className="text-white">
                          <Check className="w-4 h-4 mr-1" />
                          Valider
                        </Button>
                        <Button size="sm" variant="destructive" className="text-white">
                          <X className="w-4 h-4 mr-1" />
                          Refuser
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  // ========================================
  // FOOTER ADMIN
  // ========================================
  
  const AdminFooter = () => (
    <footer className="bg-white border-t border-gray-200 mt-12">
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Logo et description */}
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">P</span>
              </div>
              <span className="text-xl font-bold text-gray-900">Profitum</span>
            </div>
            <p className="text-gray-600 mb-4 max-w-md">
              Plateforme de gestion financière et d'optimisation fiscale pour entreprises. 
              Simplifiez vos démarches administratives et maximisez vos économies.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="text-gray-400 hover:text-gray-600 transition-colors">
                <span className="sr-only">LinkedIn</span>
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.338 16.338H13.67V12.16c0-.995-.017-2.277-1.387-2.277-1.39 0-1.601 1.086-1.601 2.207v4.248H8.014v-8.59h2.559v1.174h.037c.356-.675 1.227-1.387 2.526-1.387 2.703 0 3.203 1.778 3.203 4.092v4.711zM5.005 6.575a1.548 1.548 0 11-.003-3.096 1.548 1.548 0 01.003 3.096zm-1.337 9.763H6.34v-8.59H3.667v8.59zM17.668 1H2.328C1.595 1 1 1.581 1 2.298v15.403C1 18.418 1.595 19 2.328 19h15.34c.734 0 1.332-.582 1.332-1.299V2.298C19 1.581 18.402 1 17.668 1z" clipRule="evenodd" />
                </svg>
              </a>
              <a href="#" className="text-gray-400 hover:text-gray-600 transition-colors">
                <span className="sr-only">Twitter</span>
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M6.29 18.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0020 3.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.073 4.073 0 01.8 7.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 010 16.407a11.616 11.616 0 006.29 1.84" />
                </svg>
              </a>
            </div>
          </div>

          {/* Liens rapides */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 tracking-wider uppercase mb-4">
              Plateforme
            </h3>
            <ul className="space-y-3">
              <li>
                <a href="/admin/dashboard-optimized" className="text-gray-600 hover:text-gray-900 transition-colors">
                  Dashboard Admin
                </a>
              </li>
              <li>
                <a href="/admin/messagerie-admin" className="text-gray-600 hover:text-gray-900 transition-colors">
                  Messagerie
                </a>
              </li>
              <li>
                <a href="/admin/agenda-admin" className="text-gray-600 hover:text-gray-900 transition-colors">
                  Agenda
                </a>
              </li>
              <li>
                <a href="/admin/documents" className="text-gray-600 hover:text-gray-900 transition-colors">
                  Documents
                </a>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 tracking-wider uppercase mb-4">
              Support
            </h3>
            <ul className="space-y-3">
              <li>
                <a href="#" className="text-gray-600 hover:text-gray-900 transition-colors">
                  Centre d'aide
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-600 hover:text-gray-900 transition-colors">
                  Contact support
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-600 hover:text-gray-900 transition-colors">
                  Documentation API
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-600 hover:text-gray-900 transition-colors">
                  Statut système
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Ligne de séparation */}
        <div className="border-t border-gray-200 mt-8 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-500 text-sm">
              © 2025 Profitum. Tous droits réservés.
            </p>
            <div className="flex space-x-6 mt-4 md:mt-0">
              <a href="#" className="text-gray-500 hover:text-gray-900 text-sm transition-colors">
                Politique de confidentialité
              </a>
              <a href="#" className="text-gray-500 hover:text-gray-900 text-sm transition-colors">
                Conditions d'utilisation
              </a>
              <a href="#" className="text-gray-500 hover:text-gray-900 text-sm transition-colors">
                Mentions légales
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );

  // ===== RENDU PRINCIPAL =====
  
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <HeaderAdmin />
      
      <div className="flex flex-1 pt-16">
        <div className="flex-1 p-6">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <RefreshCw className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-4" />
                <p className="text-gray-600">Chargement des données...</p>
              </div>
            </div>
          ) : (
            <>
              {/* Tuiles KPI toujours visibles en haut */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                {/* Clients */}
                <KPICard
                  title="Clients"
                  value={kpiData.clientsThisMonth}
                  total={`${kpiData.clientsThisMonth} ce mois`}
                  change={`+${kpiData.clientsThisMonth} ce mois`}
                  changeType="increase" 
                  icon={UserPlus}
                  color="blue"
                  onClick={() => setActiveSection('clients')}
                />

                {/* Experts */}
                <KPICard
                  title="Experts"
                  value={kpiData.totalExperts}
                  total={`${kpiData.pendingExperts} en attente`}
                  change={`${kpiData.activeExperts} actifs`}
                  icon={Users}
                  color="green"
                  onClick={() => setActiveSection('experts')}
                />

                {/* Dossiers à traiter */}
                <KPICard
                  title="Dossiers à traiter"
                  value={kpiData.montantPotentiel.toLocaleString('fr-FR')}
                  total={`${kpiData.montantRealise.toLocaleString('fr-FR')} € réalisés`}
                  change={`${kpiData.totalDossiers} dossiers`}
                  icon={FileText}
                  color="purple"
                  onClick={() => setActiveSection('dossiers')}
                />
              </div>

              {/* Section dynamique en dessous des tuiles */}
              <div className="mt-8">
                {activeSection === 'overview' && (
                  <div className="bg-gray-50 rounded-lg p-8 text-center">
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      Vue d'ensemble
                    </h3>
                    <p className="text-gray-600">
                      Cliquez sur une tuile ci-dessus pour voir les détails
                    </p>
                  </div>
                )}

                {activeSection === 'experts' && (
                  <ExpertsAllSection />
                )}

                {activeSection === 'clients' && (
                  <ClientsAllSection />
                )}

                {activeSection === 'dossiers' && (
                  <DossiersProcessingSection 
                    dossiers={sectionData.dossiers} 
                    loading={loading}
                    onRefresh={() => loadSectionData('dossiers')}
                  />
                )}
              </div>
            </>
          )}
        </div>
      </div>
      
      <AdminFooter />
    </div>
  );
};

export default AdminDashboardOptimized; 