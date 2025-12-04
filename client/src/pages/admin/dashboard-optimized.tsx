import { useState, useEffect } from 'react';
import { Navigate, useNavigate, useSearchParams, useLocation } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { useAuth } from "@/hooks/use-auth";
import { useNotificationSSE } from "@/hooks/use-notification-sse";
import { getSupabaseToken } from "@/lib/auth-helpers";
import { toast } from "sonner";
import { get } from "@/lib/api";
import { config } from "@/config/env";
import ApporteurManagement from "@/components/admin/ApporteurManagement";
import { UniversalNotificationCenter } from "@/components/notifications/UniversalNotificationCenter";
import { 
  RefreshCw, Users, FileText, 
  Eye, ClipboardList, Edit, Check, X,
  UserCheck, Clock,
  Download, Settings, TrendingUp, DollarSign,
  Bell, Mail, Target, CheckCircle, XCircle,
  Handshake, Package, Trash2, Calendar, Lock,
  Building, Phone, Plus, User
} from "lucide-react";
import { TypeSwitcher } from "@/components/TypeSwitcher";
import { motion } from "framer-motion";
import { PerformanceCharts } from "@/components/charts/PerformanceCharts";
import LoadingScreen from "@/components/LoadingScreen";

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
  statut: string; // Tous les statuts possibles : pending, validated, rejected, in_progress, documents_uploaded, eligibility_validated, eligibility_rejected, eligible, en_cours
  progress: number;
  montantFinal?: number;
  tauxFinal?: number;
  documents_sent?: string[];
  expert_id?: string;
  eligibility_validated_at?: string;
  pre_eligibility_validated_at?: string;
  expert_report_status?: string;
  validation_admin_notes?: string;
  created_at: string;
  updated_at: string;
  Client?: {
    id: string;
    company_name?: string;
    first_name?: string;
    last_name?: string;
    email: string;
    statut: string;
    phone?: string;
    apporteur_id?: string;
  };
  ProduitEligible?: {
    id: string;
    nom: string;
    description: string;
    montant_min?: number;
    montant_max?: number;
    taux_min?: number;
    taux_max?: number;
    categorie?: string;
  };
  Expert?: {
    id: string;
    first_name: string;
    last_name: string;
    company_name: string;
    email: string;
    specializations?: string[];
    rating?: number;
    approval_status?: string;
  };
}

interface ProduitEligible {
  id: string;
  nom: string;
  description: string;
  categorie?: string;
  secteurs_activite?: string[]; // Liste des secteurs d'activité (JSONB dans la BDD)
  montant_min?: number;
  montant_max?: number;
  taux_min?: number;
  taux_max?: number;
  duree_min?: number;
  duree_max?: number;
  active?: boolean;
  type_produit?: string;
  created_at: string;
  updated_at: string;
}

type ActiveSection = 'overview' | 'experts' | 'clients' | 'dossiers' | 'apporteurs' | 'validations' | 'performance';

// ============================================================================
// DASHBOARD ADMIN OPTIMISÉ - VUE MÉTIER PURE
// ============================================================================
// Interface simplifiée pour un pilotage optimal de l'activité

const AdminDashboardOptimized: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  // ===== ÉTATS LOCAUX =====
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeSection, setActiveSection] = useState<ActiveSection>(
    (searchParams.get('section') as ActiveSection) || 'overview'
  );

  // Synchroniser activeSection avec l'URL
  useEffect(() => {
    if (activeSection !== 'overview') {
      setSearchParams({ section: activeSection });
    } else {
      setSearchParams({});
    }
  }, [activeSection, setSearchParams]);
  
  // Synchroniser l'URL avec activeSection au chargement
  useEffect(() => {
    const sectionFromUrl = searchParams.get('section') as ActiveSection;
    if (sectionFromUrl && sectionFromUrl !== activeSection) {
      setActiveSection(sectionFromUrl);
    }
  }, [searchParams]);
  const [selectedEcosystemTile, setSelectedEcosystemTile] = useState<string | null>(null);
  const [selectedTileData, setSelectedTileData] = useState<any[]>([]);
  const [loadingTileData, setLoadingTileData] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filteredTileData, setFilteredTileData] = useState<any[]>([]);
  const [clientTypeFilter, setClientTypeFilter] = useState<'client' | 'temporaire' | 'all'>('client');
  
  // Filtres avancés
  const [filterDateStart, setFilterDateStart] = useState<string>('');
  const [filterDateEnd, setFilterDateEnd] = useState<string>('');
  const [filterMontantMin, setFilterMontantMin] = useState<number>(0);
  const [filterMontantMax, setFilterMontantMax] = useState<number>(1000000);
  
  // Cache des données pour éviter de recharger inutilement
  const [dataCache, setDataCache] = useState<{[key: string]: {data: any[], timestamp: number}}>({});
  
  // Actions rapides
  const [updatingDossier, setUpdatingDossier] = useState<string | null>(null);
  const [expertModalOpen, setExpertModalOpen] = useState(false);
  const [selectedDossierForExpert, setSelectedDossierForExpert] = useState<any>(null);
  const [availableExperts, setAvailableExperts] = useState<any[]>([]);
  const [loadingExperts, setLoadingExperts] = useState(false);
  
  // Affichage urgences/alertes
  const [selectedAlertType, setSelectedAlertType] = useState<'urgences' | 'alertes' | null>(null);
  const [urgencesData, setUrgencesData] = useState<{
    dossiers: any[];
    experts: any[];
  }>({ dossiers: [], experts: [] });
  const [alertesData, setAlertesData] = useState<{
    dossiers: any[];
    experts: any[];
  }>({ dossiers: [], experts: [] });
  
  // Historique et Commentaires
  const [histoireModalOpen, setHistoireModalOpen] = useState(false);
  const [selectedDossierForHistoire, setSelectedDossierForHistoire] = useState<any>(null);
  const [historique, setHistorique] = useState<any[]>([]);
  const [commentaires, setCommentaires] = useState<any[]>([]);
  const [loadingHistoire, setLoadingHistoire] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [isPrivateComment, setIsPrivateComment] = useState(false);
  
  // Modal Documents Pré-éligibilité
  const [documentsModalOpen, setDocumentsModalOpen] = useState(false);
  const [selectedDossierForDocuments, setSelectedDossierForDocuments] = useState<ClientProduitEligible | null>(null);
  const [previewDocument, setPreviewDocument] = useState<string | null>(null);
  const [validationNotes, setValidationNotes] = useState('');
  const [sectionData, setSectionData] = useState<SectionData>({
    experts: [],
    clients: [],
    dossiers: []
  });
  const [loading, setLoading] = useState(false);
  
  // États Gestion Produits
  const [showAddProduitModal, setShowAddProduitModal] = useState(false);
  const [showEditProduitModal, setShowEditProduitModal] = useState(false);
  const [showDeleteProduitModal, setShowDeleteProduitModal] = useState(false);
  const [selectedProduit, setSelectedProduit] = useState<ProduitEligible | null>(null);
  const [produitForm, setProduitForm] = useState({
    nom: '',
    description: '',
    categorie: '',
    secteurs_activite: [] as string[], // Liste des secteurs sélectionnés
    type_produit: 'financier',
    montant_min: '',
    montant_max: '',
    taux_min: '',
    taux_max: '',
    duree_min: '',
    duree_max: '',
    active: true
  });

  // Liste des secteurs d'activité disponibles (alignés sur GENERAL_001)
  const secteursActiviteOptions = [
    'Transport et Logistique',
    'Commerce et Distribution',
    'Industrie et Fabrication',
    'Services aux Entreprises',
    'BTP et Construction',
    'Restauration et Hôtellerie',
    'Santé et Services Sociaux',
    'Agriculture et Agroalimentaire',
    'Services à la Personne',
    'Autre secteur'
  ];

  // Liste des catégories disponibles
  const categoriesOptions = [
    'Optimisation Fiscale',
    'Optimisation Sociale',
    'Optimisation Énergétique',
    'Services Juridiques et Recouvrement',
    'Logiciels et Outils Numériques',
    'Services Additionnels et Équipements'
  ];
  
  // ===== DONNÉES KPI PROFITUM =====
  const [kpiData, setKpiData] = useState({
    // Clients
    totalClients: 0,
    clientsThisMonth: 0,
    clientsLastMonth: 0, // Pour calculer la croissance
    clientsSatisfaction: 0, // NPS moyen
    
    // Experts
    totalExperts: 0,
    activeExperts: 0,
    pendingExperts: 0,
    expertsPendingValidation: 0, // &gt; 48h
    expertsPendingRecents: 0, // &lt;= 48h (nouveaux)
    expertsNPS: 0, // NPS moyen
    
    // Dossiers
    totalDossiers: 0,
    dossiersThisMonth: 0, // Pour objectifs
    dossiersLastMonth: 0, // Pour croissance
    pendingDossiers: 0,
    dossiersEnRetard: 0, // > 21 jours
    montantPotentiel: 0,
    montantRealise: 0,
    montantLastMonth: 0, // Pour croissance
    tauxConversion: 0, // simulateur → dossier
    
    // Objectifs (calculés dynamiquement)
    objectifDossiersMonth: 0, // Moyenne des 3 derniers mois * 1.2
    objectifRevenusMonth: 0, // Moyenne des 3 derniers mois * 1.2
    croissanceDossiers: 0, // % de croissance mois actuel vs précédent
    croissanceRevenus: 0, // % de croissance revenus vs mois précédent
    
    // Produits
    totalProduits: 0,
    
    // Apporteurs
    apporteursTotal: 0,
    apporteursActifs: 0,
    apporteursPerformance: 0, // dossiers/mois moyen
    
    // Validations
    validationsPending: 0,
    validationsExperts: 0,
    validationsDocuments: 0,
    
    // Alertes
    alertesUrgentes: 0,
    alertesNormales: 0
  });

  // Fonction utilitaire pour formater les montants
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  // Fonction utilitaire pour formater le temps écoulé
  const getTimeAgo = (date: Date) => {
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) {
      return 'Il y a moins d\'une minute';
    }
    
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) {
      return `Il y a ${diffInMinutes} minute${diffInMinutes > 1 ? 's' : ''}`;
    }
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) {
      return `Il y a ${diffInHours} heure${diffInHours > 1 ? 's' : ''}`;
    }
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) {
      return `Il y a ${diffInDays} jour${diffInDays > 1 ? 's' : ''}`;
    }
    
    const diffInWeeks = Math.floor(diffInDays / 7);
    if (diffInWeeks < 4) {
      return `Il y a ${diffInWeeks} semaine${diffInWeeks > 1 ? 's' : ''}`;
    }
    
    const diffInMonths = Math.floor(diffInDays / 30);
    if (diffInMonths < 12) {
      return `Il y a ${diffInMonths} mois`;
    }
    
    const diffInYears = Math.floor(diffInDays / 365);
    return `Il y a ${diffInYears} an${diffInYears > 1 ? 's' : ''}`;
  };

  // ========================================
  // FONCTION DE RÉINITIALISATION DASHBOARD
  // ========================================
  
  const resetDashboard = () => {
    // Réinitialiser la section active
    setActiveSection('overview');
    
    // Réinitialiser tous les filtres
    setFilterStatus('all');
    setFilterDateStart('');
    setFilterDateEnd('');
    setFilterMontantMin(0);
    setFilterMontantMax(1000000);
    
    // Réinitialiser les tuiles sélectionnées
    setSelectedEcosystemTile(null);
    setSelectedTileData([]);
    setFilteredTileData([]);
    
    // Réinitialiser les URL params
    setSearchParams({});
    
    // Recharger les données
    loadKPIData();
    
    toast.success('Dashboard réinitialisé');
  };

  // ========================================
  // CHARGEMENT DES DONNÉES
  // ========================================

  // 📡 Connexion SSE pour notifications temps réel
  // DÉSACTIVÉ pour éviter les erreurs 429 et les logs excessifs
  // Les notifications sont récupérées via polling classique au lieu de SSE
  useNotificationSSE({
    silent: true, // Ne pas afficher les toasts d'erreur sur le dashboard
    onNotification: (notification) => {
      console.log('🔔 Nouvelle notification reçue via SSE:', notification);
      // La notification toast est déjà gérée par le hook
    },
    onKPIRefresh: () => {
      console.log('📊 Rafraîchissement KPI demandé via SSE');
      loadKPIData();
    },
    enabled: false // DÉSACTIVÉ pour éviter les erreurs 429 et les logs excessifs
  });

  useEffect(() => {
    loadKPIData();
    loadSectionData('overview');
  }, []);

  // Recharger le dashboard quand on revient à la page (navigation depuis autre page)
  useEffect(() => {
    // Si on arrive sur le dashboard ET qu'on vient d'une autre page admin
    if (location.pathname === '/admin/dashboard-optimized' && !searchParams.get('section')) {
      console.log('🔄 Retour au dashboard - Rechargement des données');
      loadKPIData();
      setActiveSection('overview');
      setSelectedEcosystemTile(null);
    }
  }, [location.pathname]);

  // Charger les données quand la section change
  useEffect(() => {
    console.log('🔄 Section changée:', activeSection);
    if (activeSection !== 'overview' && activeSection !== 'apporteurs') {
      console.log('📡 Chargement des données pour:', activeSection);
      loadSectionData(activeSection);
    }
  }, [activeSection]);

  // Charger les données quand une tuile écosystème est sélectionnée
  useEffect(() => {
    if (selectedEcosystemTile) {
      loadTileData(selectedEcosystemTile);
      setFilterStatus('all'); // Reset filter
    }
  }, [selectedEcosystemTile]);

  // Appliquer les filtres sur les données
  useEffect(() => {
    let filtered = [...selectedTileData];
    
    // Filtre par statut
    if (filterStatus !== 'all') {
      filtered = filtered.filter((item: any) => 
        item.statut === filterStatus || item.status === filterStatus || item.approval_status === filterStatus
      );
    }
    
    // Filtre par date (pour dossiers)
    if (selectedEcosystemTile === 'dossiers' && (filterDateStart || filterDateEnd)) {
      filtered = filtered.filter((item: any) => {
        const itemDate = new Date(item.created_at);
        const start = filterDateStart ? new Date(filterDateStart) : null;
        const end = filterDateEnd ? new Date(filterDateEnd) : null;
        
        if (start && itemDate < start) return false;
        if (end && itemDate > end) return false;
        return true;
      });
    }
    
    // Filtre par montant (pour dossiers)
    if (selectedEcosystemTile === 'dossiers' && (filterMontantMin > 0 || filterMontantMax < 1000000)) {
      filtered = filtered.filter((item: any) => {
        const montant = item.montantFinal || 0;
        return montant >= filterMontantMin && montant <= filterMontantMax;
      });
    }
    
    setFilteredTileData(filtered);
  }, [selectedTileData, filterStatus, filterDateStart, filterDateEnd, filterMontantMin, filterMontantMax, selectedEcosystemTile]);

  // Charger les experts quand le modal s'ouvre
  useEffect(() => {
    if (expertModalOpen) {
      loadAvailableExperts();
    }
  }, [expertModalOpen]);

  // Charger historique et commentaires quand le modal s'ouvre
  useEffect(() => {
    if (histoireModalOpen && selectedDossierForHistoire) {
      loadHistoireEtCommentaires(selectedDossierForHistoire.id);
    }
  }, [histoireModalOpen, selectedDossierForHistoire]);

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
  
  const fetchAllExperts = async () => {
    try {
      const response = await get('/admin/experts/all');
      if (response.success) {
        return (response.data as any)?.experts || [];
      }
      console.warn('⚠️ /admin/experts/all indisponible, fallback sur /admin/experts?limit=1000');
    } catch (error) {
      console.warn('⚠️ Erreur lors de l\'appel /admin/experts/all:', error);
    }

    const fallbackResponse = await get('/admin/experts?limit=1000');
    if (fallbackResponse.success) {
      return (fallbackResponse.data as any)?.experts || [];
    }

    console.error('❌ Impossible de charger les experts:', fallbackResponse.message);
    return [];
  };

  const loadKPIData = async () => {
    try {
      console.log('📊 Chargement des données KPI...');
      
      // Charger les clients
      const clientsResponse = await get('/admin/clients');
      const clients = clientsResponse.success ? (clientsResponse.data as any)?.clients || [] : [];
      console.log('👥 Clients chargés:', clients.length, '(brut)');
      
      // Charger TOUS les experts (sans pagination)
      const experts = await fetchAllExperts();
      console.log('👔 Experts chargés:', experts.length, 'experts');
      
      // Charger les dossiers
      const dossiersResponse = await get('/admin/dossiers/all');
      const dossiers = dossiersResponse.success ? (dossiersResponse.data as any)?.dossiers || [] : [];
      console.log('📁 Dossiers chargés:', dossiers.length, 'dossiers');
      
      // Charger les produits du catalogue (structure: { success, data: { produits } })
      const produitsResponse = await get('/admin/produits');
      console.log('📦 Réponse produits complète:', produitsResponse);
      const produits = produitsResponse.success ? (produitsResponse.data as any)?.produits || [] : [];
      console.log('📦 Produits catalogue chargés:', produits.length, 'produits');
      
      // Calculer les KPIs (EXCLURE les clients temporaires - utiliser le champ type)
      const realClients = clients.filter((client: any) => 
        client.type === 'client' || !client.type || client.type === null
      );
      
      const totalClients = realClients.length;
      const clientsThisMonth = realClients.filter((client: any) => {
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
      
      // Charger les apporteurs (données réelles)
      const apporteursResponse = await get('/admin/apporteurs');
      // L'API retourne directement un tableau dans data, pas data.apporteurs
      const apporteurs: any[] = apporteursResponse.success && Array.isArray(apporteursResponse.data) 
        ? apporteursResponse.data 
        : [];
      
      console.log('📊 Apporteurs chargés:', {
        total: apporteurs.length,
        data: apporteurs,
        structure: apporteurs[0]
      });
      
      // Calculer les KPIs à partir des DONNÉES RÉELLES uniquement
      
      // Séparer les experts en attente par ancienneté
      const now = new Date();
      const expertsPendingRecents = experts.filter((e: any) => {
        if (e.approval_status !== 'pending') return false;
        const createdAt = new Date(e.created_at);
        const diffHours = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60);
        return diffHours <= 48;
      }).length;
      
      const expertsPendingValidation = experts.filter((e: any) => {
        if (e.approval_status !== 'pending') return false;
        const createdAt = new Date(e.created_at);
        const diffHours = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60);
        return diffHours > 48;
      }).length;

      const dossiersEnRetard = dossiers.filter((d: any) => {
        const createdAt = new Date(d.created_at);
        const diffDays = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24);
        return (d.statut === 'pending' || d.statut === 'in_progress') && diffDays > 21;
      }).length;

      const validationsExperts = experts.filter((e: any) => e.approval_status === 'pending').length;
      
      const validationsDocuments = dossiers.filter((d: any) => 
        d.statut === 'documents_uploaded' || d.statut === 'eligible_confirmed'
      ).length;

      // Compter les apporteurs actifs (tous sauf rejected/suspended)
      const apporteursActifs = apporteurs.filter((a: any) => 
        a.status === 'active' || a.status === 'candidature'
      ).length;
      
      console.log('📊 Apporteurs actifs calculés:', {
        total: apporteurs.length,
        actifs: apporteursActifs,
        parStatut: apporteurs.reduce((acc: any, a: any) => {
          acc[a.status] = (acc[a.status] || 0) + 1;
          return acc;
        }, {})
      });
      
      // Alertes urgentes : Validations documents + Experts en attente >48h
      const alertesUrgentes = validationsDocuments + expertsPendingValidation;
      // Alertes normales : Dossiers en retard + Nouveaux experts en attente <48h
      const alertesNormales = dossiersEnRetard + expertsPendingRecents;
      
      // Stocker les données d'urgences
      const dossiersUrgents = dossiers.filter((d: any) => 
        d.statut === 'documents_uploaded' || d.statut === 'eligible_confirmed'
      );
      const expertsUrgents = experts.filter((e: any) => {
        if (e.approval_status !== 'pending') return false;
        const createdAt = new Date(e.created_at);
        const diffHours = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60);
        return diffHours > 48;
      });
      setUrgencesData({ dossiers: dossiersUrgents, experts: expertsUrgents });
      
      // Stocker les données d'alertes
      const dossiersAlertes = dossiers.filter((d: any) => {
        const createdAt = new Date(d.created_at);
        const diffDays = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24);
        return (d.statut === 'pending' || d.statut === 'in_progress') && diffDays > 21;
      });
      const expertsAlertes = experts.filter((e: any) => {
        if (e.approval_status !== 'pending') return false;
        const createdAt = new Date(e.created_at);
        const diffHours = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60);
        return diffHours <= 48;
      });
      setAlertesData({ dossiers: dossiersAlertes, experts: expertsAlertes });

      // Calculer les données du mois précédent pour la croissance
      const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
      
      const clientsLastMonth = clients.filter((client: any) => {
        const clientDate = new Date(client.created_at);
        return clientDate >= lastMonth && clientDate <= lastMonthEnd;
      }).length;
      
      const dossiersThisMonth = dossiers.filter((dossier: any) => {
        const dossierDate = new Date(dossier.created_at);
        return dossierDate.getMonth() === now.getMonth() && dossierDate.getFullYear() === now.getFullYear();
      }).length;
      
      const dossiersLastMonth = dossiers.filter((dossier: any) => {
        const dossierDate = new Date(dossier.created_at);
        return dossierDate >= lastMonth && dossierDate <= lastMonthEnd;
      }).length;
      
      const montantLastMonth = dossiers
        .filter((dossier: any) => {
          const dossierDate = new Date(dossier.created_at);
          return dossierDate >= lastMonth && dossierDate <= lastMonthEnd && dossier.statut === 'validated';
        })
        .reduce((sum: number, dossier: any) => sum + (dossier.montantFinal || 0), 0);
      
      // Calculer les objectifs (moyenne des 3 derniers mois * 1.2 pour objectif ambitieux)
      // Ou simplement mois précédent * 1.5 si pas assez de données
      const objectifDossiersMonth = Math.max(dossiersLastMonth * 1.5, 10); // Minimum 10 dossiers
      const objectifRevenusMonth = Math.max(montantLastMonth * 1.5, 50000); // Minimum 50k€
      
      // Calculer les croissances (en %)
      const croissanceDossiers = dossiersLastMonth > 0 
        ? Math.round(((dossiersThisMonth - dossiersLastMonth) / dossiersLastMonth) * 100)
        : 0;
      
      const croissanceRevenus = montantLastMonth > 0
        ? Math.round(((montantRealise - montantLastMonth) / montantLastMonth) * 100)
        : 0;

      // Mettre à jour les KPIs (DONNÉES RÉELLES UNIQUEMENT)
      setKpiData({
        totalClients,
        clientsThisMonth,
        clientsLastMonth,
        clientsSatisfaction: 0, // À calculer depuis satisfaction réelle si disponible
        totalExperts,
        activeExperts,
        pendingExperts,
        expertsPendingValidation,
        expertsPendingRecents,
        expertsNPS: 0, // À calculer depuis notes réelles si disponible
        totalDossiers,
        dossiersThisMonth,
        dossiersLastMonth,
        pendingDossiers,
        dossiersEnRetard,
        montantPotentiel,
        montantRealise,
        montantLastMonth,
        tauxConversion: totalDossiers > 0 ? Math.round((totalDossiers / Math.max(totalClients, 1)) * 100) : 0,
        objectifDossiersMonth,
        objectifRevenusMonth,
        croissanceDossiers,
        croissanceRevenus,
        totalProduits: produits.length,
        apporteursTotal: apporteurs.length,
        apporteursActifs,
        apporteursPerformance: 0, // À calculer depuis performance réelle si disponible
        validationsPending: validationsDocuments + validationsExperts,
        validationsExperts,
        validationsDocuments,
        alertesUrgentes,
        alertesNormales
      });
      
      console.log('✅ KPIs mis à jour:', {
        totalClients,
        clientsThisMonth,
        totalExperts,
        activeExperts,
        pendingExperts,
        totalDossiers,
        totalProduits: produits.length,
        pendingDossiers,
        montantPotentiel,
        montantRealise
      });
      
    } catch (error) {
      console.error('❌ Erreur chargement KPIs:', error);
    }
  };

  // ========================================
  // ACTIONS RAPIDES
  // ========================================

  const updateDossierStatut = async (dossierId: string, newStatut: string) => {
    setUpdatingDossier(dossierId);
    try {
      const response = await fetch(`${config.API_URL}/admin/dossiers/${dossierId}/statut`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await getSupabaseToken()}`
        },
        credentials: 'include',
        body: JSON.stringify({ statut: newStatut })
      });

      if (response.ok) {
        toast.success(`Statut mis à jour : ${newStatut}`);
        
        // Mettre à jour les données locales
        setSelectedTileData(prev => 
          prev.map(d => d.id === dossierId ? { ...d, statut: newStatut } : d)
        );
        
        // Invalider le cache
        setDataCache(prev => ({ ...prev, dossiers: { data: [], timestamp: 0 } }));
      } else {
        toast.error('Erreur lors de la mise à jour du statut');
      }
    } catch (error) {
      console.error('Erreur updateDossierStatut:', error);
      toast.error('Erreur lors de la mise à jour');
    } finally {
      setUpdatingDossier(null);
    }
  };

  const loadAvailableExperts = async () => {
    setLoadingExperts(true);
    try {
      const allExperts = await fetchAllExperts();
      const approvedExperts = allExperts.filter((expert: any) => expert.approval_status === 'approved');
      setAvailableExperts(approvedExperts);
    } catch (error) {
      console.error('Erreur loadAvailableExperts:', error);
      toast.error('Erreur lors du chargement des experts');
      setAvailableExperts([]);
    } finally {
      setLoadingExperts(false);
    }
  };

  const assignExpertToDossier = async (dossierId: string, expertId: string) => {
    if (!expertId || expertId === 'none') {
      toast.error('Veuillez sélectionner un expert');
      return;
    }

    try {
      const response = await fetch(`${config.API_URL}/admin/dossiers/${dossierId}/assign-expert`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await getSupabaseToken()}`
        },
        credentials: 'include',
        body: JSON.stringify({ expert_id: expertId })
      });

      if (response.ok) {
        await response.json();
        toast.success(`Expert assigné avec succès`);
        
        // Recharger les données
        loadTileData('dossiers');
        setExpertModalOpen(false);
        setSelectedDossierForExpert(null);
      } else {
        toast.error('Erreur lors de l\'assignation de l\'expert');
      }
    } catch (error) {
      console.error('Erreur assignExpertToDossier:', error);
      toast.error('Erreur lors de l\'assignation');
    }
  };

  // ========================================
  // HISTORIQUE & COMMENTAIRES
  // ========================================

  const loadHistoireEtCommentaires = async (dossierId: string) => {
    setLoadingHistoire(true);
    try {
      // Charger l'historique
      const historiqueResponse = await get(`/admin/dossiers/${dossierId}/historique`);
      if (historiqueResponse.success) {
        setHistorique((historiqueResponse.data as any)?.historique || []);
      } else {
        setHistorique([]);
      }

      // Charger les commentaires
      const commentairesResponse = await get(`/admin/dossiers/${dossierId}/commentaires`);
      if (commentairesResponse.success) {
        setCommentaires((commentairesResponse.data as any)?.commentaires || []);
      } else {
        setCommentaires([]);
      }
    } catch (error) {
      console.error('Erreur chargement historique/commentaires:', error);
      toast.error('Erreur lors du chargement');
    } finally {
      setLoadingHistoire(false);
    }
  };

  const addCommentaire = async () => {
    if (!newComment.trim() || !selectedDossierForHistoire) {
      toast.error('Veuillez saisir un commentaire');
      return;
    }

    try {
      const response = await fetch(`${config.API_URL}/admin/dossiers/${selectedDossierForHistoire.id}/commentaires`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await getSupabaseToken()}`
        },
        credentials: 'include',
        body: JSON.stringify({
          content: newComment,
          is_private: isPrivateComment
        })
      });

      if (response.ok) {
        toast.success('Commentaire ajouté');
        setNewComment('');
        setIsPrivateComment(false);
        // Recharger les données
        loadHistoireEtCommentaires(selectedDossierForHistoire.id);
      } else {
        toast.error('Erreur lors de l\'ajout du commentaire');
      }
    } catch (error) {
      console.error('Erreur addCommentaire:', error);
      toast.error('Erreur lors de l\'ajout');
    }
  };

  const deleteCommentaire = async (commentId: string) => {
    if (!selectedDossierForHistoire) return;

    if (!confirm('Voulez-vous vraiment supprimer ce commentaire ?')) {
      return;
    }

    try {
      const response = await fetch(`${config.API_URL}/admin/dossiers/${selectedDossierForHistoire.id}/commentaires/${commentId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${await getSupabaseToken()}`
        },
        credentials: 'include'
      });

      if (response.ok) {
        toast.success('Commentaire supprimé');
        // Recharger les données
        loadHistoireEtCommentaires(selectedDossierForHistoire.id);
      } else {
        toast.error('Erreur lors de la suppression');
      }
    } catch (error) {
      console.error('Erreur deleteCommentaire:', error);
      toast.error('Erreur lors de la suppression');
    }
  };

  // ========================================
  // CHARGEMENT DES DONNÉES PAR TUILE ÉCOSYSTÈME
  // ========================================

  const loadTileData = async (tile: string) => {
    console.log(`🎯 loadTileData appelé avec tile="${tile}"`);
    
    // Vérifier le cache (valide pendant 5 minutes)
    const now = Date.now();
    const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
    
    if (dataCache[tile] && (now - dataCache[tile].timestamp) < CACHE_DURATION) {
      console.log(`💾 Utilisation du cache pour: ${tile} - ${dataCache[tile].data.length} éléments`);
      setSelectedTileData(dataCache[tile].data);
      return;
    }
    
    setLoadingTileData(true);
    try {
      console.log(`🔍 Chargement données tuile: ${tile}`);
      let data: any[] = [];
      
      switch (tile) {
        case 'dossiers':
          const dossiersResponse = await get('/admin/dossiers/all');
          if (dossiersResponse.success) {
            data = (dossiersResponse.data as any)?.dossiers || [];
          } else {
            console.error('❌ Erreur chargement dossiers:', dossiersResponse.message);
          }
          break;
          
        case 'clients':
          const clientsResponse = await get('/admin/clients');
          if (clientsResponse.success) {
            const clients = (clientsResponse.data as any)?.clients || [];
            
            // ✅ FILTRER selon le type (client/temporaire) - le filtrage par typeFilter sera fait dans le rendu
            // On garde tous les clients ici, le filtrage se fera selon clientTypeFilter
            const allClients = clients;
            
            // Enrichir avec le nombre de dossiers à valider et le total de dossiers
            const dossiersResponse = await get('/admin/dossiers/all');
            if (dossiersResponse.success) {
              const allDossiers = (dossiersResponse.data as any)?.dossiers || [];
              
              data = allClients.map((client: any) => {
                const clientDossiers = allDossiers.filter((d: any) => d.clientId === client.id);
                const clientDossiersAValider = clientDossiers.filter((d: any) => 
                  d.statut === 'documents_uploaded' || d.statut === 'eligible_confirmed'
                ).length;
                
                return {
                  ...client,
                  dossiersAValider: clientDossiersAValider,
                  dossiersCount: clientDossiers.length
                };
              });
            } else {
              data = allClients;
            }
          } else {
            console.error('❌ Erreur chargement clients:', clientsResponse.message);
          }
          break;
          
        case 'experts':
          const expertsTileData = await fetchAllExperts();
          console.log('👔 Données experts pour tuile:', expertsTileData.length);
          data = expertsTileData;
          break;
          
        case 'apporteurs':
          const apporteursResponse = await get('/admin/apporteurs');
          if (apporteursResponse.success) {
            data = Array.isArray(apporteursResponse.data) ? apporteursResponse.data : [];
          } else {
            console.error('❌ Erreur chargement apporteurs:', apporteursResponse.message);
          }
          break;
          
        case 'produits':
          const produitsResponse = await get('/admin/produits');
          console.log('📦 Réponse produits COMPLÈTE:', produitsResponse);
          if (produitsResponse.success) {
            // Format standard : { success: true, data: { produits: [...] } }
            let produitsData = (produitsResponse.data as any)?.produits || [];
            console.log('📦 Produits extraits:', produitsData);
            
            // Filtrer "Optimisation Énergie" qui a été remplacé
            produitsData = produitsData.filter((p: any) => p.nom !== 'Optimisation Énergie');
            
            // Convertir secteurs_activite de JSONB (string ou array) en array
            produitsData = produitsData.map((p: any) => {
              if (p.secteurs_activite) {
                // Si c'est une string JSON, la parser
                if (typeof p.secteurs_activite === 'string') {
                  try {
                    p.secteurs_activite = JSON.parse(p.secteurs_activite);
                  } catch (e) {
                    p.secteurs_activite = [];
                  }
                }
                // Si c'est déjà un array, on le garde tel quel
              } else {
                p.secteurs_activite = [];
              }
              return p;
            });
            
            console.log('📦 Nombre de produits (après filtrage):', produitsData.length);
            data = produitsData;
          } else {
            console.error('❌ Erreur chargement produits:', produitsResponse.message);
          }
          break;
          
        case 'performance':
          // Pour performance, on utilise les données KPI déjà chargées
          break;
          
        default:
          break;
      }
      
      // Stocker dans le cache
      setDataCache(prev => ({
        ...prev,
        [tile]: {
          data,
          timestamp: now
        }
      }));
      
      console.log(`📦 AVANT setSelectedTileData - data.length:`, data.length);
      setSelectedTileData(data);
      console.log(`✅ APRÈS setSelectedTileData - Tuile ${tile} chargée avec ${data.length} éléments`);
      
    } catch (error) {
      console.error(`❌ Erreur chargement tuile ${tile}:`, error);
      setSelectedTileData([]);
    } finally {
      setLoadingTileData(false);
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
          console.log('📡 Appel fetchAllExperts() pour section experts...');
          const expertsSectionData = await fetchAllExperts();
          setSectionData((prev: SectionData) => ({ ...prev, experts: expertsSectionData }));
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

        case 'performance':
          console.log('📡 Appel API /admin/dossiers/all pour graphiques...');
          const perfDossiersResponse = await get('/admin/dossiers/all');
          if (perfDossiersResponse.success) {
            setSectionData((prev: SectionData) => ({ ...prev, dossiers: (perfDossiersResponse.data as any)?.dossiers || [] }));
          } else {
            console.error('❌ Erreur dossiers performance:', perfDossiersResponse.message);
          }
          break;
        
        case 'validations':
          console.log('📡 Chargement données pour validations...');
          // Charger les dossiers et experts pour la section validations
          const validationsDossiersResponse = await get('/admin/dossiers/all');
          const validationsExpertsResponse = await get('/admin/experts');
          
          if (validationsDossiersResponse.success) {
            const dossiers = (validationsDossiersResponse.data as any)?.dossiers || [];
            
            // Récupérer les documents pour chaque dossier depuis ClientProcessDocument
            const dossierIds = dossiers.map((d: any) => d.id);
            let documentsByDossier: {[key: string]: any[]} = {};
            
            if (dossierIds.length > 0) {
              try {
                // Récupérer les documents pour chaque dossier individuellement
                const documentPromises = dossierIds.map(async (dossierId: string) => {
                  try {
                    const response = await fetch(`${config.API_URL}/api/admin/documents/process?client_produit_id=${dossierId}`, {
                      headers: {
                        'Authorization': `Bearer ${await getSupabaseToken()}`
                      }
                    });
                    if (response.ok) {
                      const data = await response.json();
                      if (data.success && data.data) {
                        return { dossierId, documents: data.data };
                      }
                    }
                  } catch (error) {
                    console.error(`❌ Erreur récupération documents pour dossier ${dossierId}:`, error);
                  }
                  return { dossierId, documents: [] };
                });
                
                const documentsResults = await Promise.all(documentPromises);
                documentsResults.forEach(({ dossierId, documents }) => {
                  documentsByDossier[dossierId] = documents;
                });
              } catch (error) {
                console.error('❌ Erreur récupération documents:', error);
              }
            }
            
            // Enrichir les dossiers avec le nombre de documents validés
            const enrichedDossiers = dossiers.map((dossier: any) => {
              const docs = documentsByDossier[dossier.id] || [];
              const validatedDocs = docs.filter((doc: any) => doc.validation_status === 'validated').length;
              return {
                ...dossier,
                documents_count: docs.length,
                validated_documents_count: validatedDocs
              };
            });
            
            setSectionData((prev: SectionData) => ({ 
              ...prev, 
              dossiers: enrichedDossiers
            }));
          } else {
            console.error('❌ Erreur dossiers validations:', validationsDossiersResponse.message);
          }
          
          if (validationsExpertsResponse.success) {
            setSectionData((prev: SectionData) => ({ 
              ...prev, 
              experts: (validationsExpertsResponse.data as any)?.experts || [] 
            }));
          } else {
            console.error('❌ Erreur experts validations:', validationsExpertsResponse.message);
          }
          break;
      }
    } catch (error) {
      console.error(`❌ Erreur chargement ${section}:`, error);
      toast.error(`Impossible de charger les données ${section}`);
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
          <div>
            <Button 
              variant="outline" 
              size="sm"
              onClick={resetDashboard}
            >
              ← Retour au dashboard
            </Button>
          </div>
        </div>

        {/* Tableau des clients - Design haut de gamme - Responsive */}
        <div className="bg-white rounded-2xl shadow-lg border border-slate-200/60 overflow-hidden">
          <div className="overflow-y-auto max-h-[600px]">
            <div className="min-w-full">
              {/* Desktop: Table */}
              <div className="hidden md:block">
                <table className="w-full">
                  <thead className="bg-gradient-to-r from-slate-50 to-slate-100/50 border-b border-slate-200">
                    <tr>
                      <th className="px-8 py-5 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">
                        Entreprise
                      </th>
                      <th className="px-8 py-5 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">
                        Contact
                      </th>
                      <th className="px-8 py-5 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">
                        Statut
                      </th>
                      <th className="px-8 py-5 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">
                        Inscription
                      </th>
                      <th className="px-8 py-5 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {clients.map((client: any) => (
                      <tr 
                        key={client.id} 
                        onClick={() => navigate(`/admin/clients/${client.id}`)}
                        className="group cursor-pointer hover:bg-gradient-to-r hover:from-blue-50/50 hover:to-indigo-50/30 transition-all duration-200 hover:shadow-sm"
                      >
                        <td className="px-8 py-5">
                          <div className="flex items-center gap-3">
                            <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-semibold text-sm shadow-md group-hover:shadow-lg transition-shadow">
                              {(client.company_name || 'E')[0].toUpperCase()}
                            </div>
                            <div>
                              <div className="font-semibold text-slate-900 group-hover:text-blue-700 transition-colors">
                                {client.company_name || 'Entreprise'}
                              </div>
                              {client.siren && (
                                <div className="text-xs text-slate-500 mt-0.5 font-mono">
                                  SIREN: {client.siren}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-8 py-5">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 text-sm text-slate-900">
                              <Mail className="h-3.5 w-3.5 text-slate-400" />
                              <span className="truncate max-w-[200px]">{client.email}</span>
                            </div>
                            {client.phone_number && (
                              <div className="flex items-center gap-2 text-sm text-slate-600">
                                <Phone className="h-3.5 w-3.5 text-slate-400" />
                                <span>{client.phone_number}</span>
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-8 py-5">
                          <Badge 
                            variant={client.statut === 'actif' ? 'default' : 'secondary'}
                            className={`text-xs font-medium px-3 py-1 ${
                              client.statut === 'actif' 
                                ? 'bg-emerald-100 text-emerald-700 border-emerald-200' 
                                : 'bg-amber-100 text-amber-700 border-amber-200'
                            }`}
                          >
                            {client.statut || 'actif'}
                          </Badge>
                        </td>
                        <td className="px-8 py-5">
                          <div className="flex items-center gap-2 text-sm text-slate-600">
                            <Calendar className="h-3.5 w-3.5 text-slate-400" />
                            <span>{new Date(client.created_at).toLocaleDateString('fr-FR')}</span>
                          </div>
                        </td>
                        <td className="px-8 py-5">
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/admin/messagerie-admin?user=${client.id}`);
                              }}
                              className="border-slate-300 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700 transition-all"
                            >
                              <Mail className="h-3.5 w-3.5 mr-1.5" />
                              Contacter
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {/* Mobile: Cards */}
              <div className="md:hidden space-y-2 p-2">
                {clients.map((client: any) => (
                  <div
                    key={client.id}
                    onClick={() => navigate(`/admin/clients/${client.id}`)}
                    className="group cursor-pointer hover:bg-gradient-to-r hover:from-blue-50/50 hover:to-indigo-50/30 transition-all duration-200 hover:shadow-sm p-3 md:p-4 border rounded-lg"
                  >
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                      <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-semibold text-sm shadow-md group-hover:shadow-lg transition-shadow">
                        {(client.company_name || 'E')[0].toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0 w-full">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 mb-2">
                          <h3 className="font-semibold text-sm md:text-base text-slate-900 truncate w-full sm:w-auto">
                            {client.company_name || 'Entreprise'}
                          </h3>
                          <Badge 
                            variant={client.statut === 'actif' ? 'default' : 'secondary'}
                            className={`text-xs font-medium px-3 py-1 whitespace-nowrap ${
                              client.statut === 'actif' 
                                ? 'bg-emerald-100 text-emerald-700 border-emerald-200' 
                                : 'bg-amber-100 text-amber-700 border-amber-200'
                            }`}
                          >
                            {client.statut || 'actif'}
                          </Badge>
                        </div>
                        {client.siren && (
                          <div className="text-xs text-slate-500 mb-2 font-mono">
                            SIREN: {client.siren}
                          </div>
                        )}
                        <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 text-xs md:text-sm text-slate-600">
                          <div className="flex items-center gap-2 min-w-0">
                            <Mail className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" />
                            <span className="truncate">{client.email}</span>
                          </div>
                          {client.phone_number && (
                            <div className="flex items-center gap-2 min-w-0">
                              <Phone className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" />
                              <span className="truncate">{client.phone_number}</span>
                            </div>
                          )}
                          <div className="flex items-center gap-2">
                            <Calendar className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" />
                            <span>{new Date(client.created_at).toLocaleDateString('fr-FR')}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 w-full sm:w-auto">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/admin/messagerie-admin?user=${client.id}`);
                          }}
                          className="flex-1 sm:flex-initial text-xs border-slate-300 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700 transition-all"
                        >
                          <Mail className="h-3.5 w-3.5 mr-1.5" />
                          Contacter
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
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
            <Button 
              variant="outline" 
              size="sm"
              onClick={resetDashboard}
            >
              ← Retour au dashboard
            </Button>
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

        {/* Tableau des experts - Responsive */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="overflow-y-auto max-h-[600px]">
            <div className="min-w-full">
              {/* Desktop: Table */}
              <div className="hidden md:block">
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
              {/* Mobile: Cards */}
              <div className="md:hidden space-y-2 p-2">
                {filteredExperts.map((expert: any) => (
                  <div
                    key={expert.id}
                    className="hover:bg-slate-50 transition-colors p-3 md:p-4 border rounded-lg"
                  >
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                      <div className="flex-1 min-w-0 w-full">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 mb-2">
                          <h3 className="font-semibold text-sm md:text-base text-slate-900 truncate w-full sm:w-auto">
                            {expert.name || expert.company_name}
                          </h3>
                          <Badge 
                            variant={
                              expert.approval_status === 'approved' ? 'default' : 
                              expert.approval_status === 'pending' ? 'secondary' : 'destructive'
                            }
                            className="text-xs whitespace-nowrap"
                          >
                            {expert.approval_status === 'approved' ? 'Validé' : 
                             expert.approval_status === 'pending' ? 'En cours' : 'Rejeté'}
                          </Badge>
                        </div>
                        {expert.company_name && expert.name && (
                          <div className="text-xs text-slate-500 mb-2">
                            {expert.company_name}
                          </div>
                        )}
                        <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 text-xs md:text-sm text-slate-600 mb-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <Mail className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" />
                            <span className="truncate">{expert.email}</span>
                          </div>
                          {expert.location && (
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="truncate">{expert.location}</span>
                            </div>
                          )}
                          <div className="flex items-center gap-2">
                            <Calendar className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" />
                            <span>{new Date(expert.created_at).toLocaleDateString('fr-FR')}</span>
                          </div>
                        </div>
                        {expert.specializations && expert.specializations.length > 0 && (
                          <div className="flex flex-wrap gap-1 mb-2">
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
                        )}
                      </div>
                      <div className="flex items-center gap-2 w-full sm:w-auto">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => window.open(`/admin/expert-details/${expert.id}`, '_blank')}
                          className="flex-1 sm:flex-initial text-xs"
                        >
                          Détails
                        </Button>
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => window.open(`/admin/messagerie-admin?user=${expert.id}`, '_blank')}
                          className="flex-1 sm:flex-initial text-xs"
                        >
                          Contacter
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    );
  };

  // ========================================
  // HANDLERS VALIDATION ÉLIGIBILITÉ
  // ========================================

  const handleValidateEligibility = async (dossierId: string, dossierName: string) => {
    try {
      const confirmValidation = window.confirm(
        `Confirmer la validation d'éligibilité pour le dossier "${dossierName}" ?\n\n` +
        `Le client pourra passer à la sélection d'expert.`
      );

      if (!confirmValidation) return;

      const response = await fetch(`${config.API_URL}/api/admin/dossiers/${dossierId}/validate-eligibility`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${await getSupabaseToken()}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: 'approve',
          notes: 'Éligibilité validée par l\'administrateur'
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Erreur de validation');
      }

      const result = await response.json();
      
      if (result.success) {
        toast.success('✅ Éligibilité validée avec succès !', {
          description: 'Le client peut maintenant sélectionner un expert'
        });
        // Recharger les dossiers
        loadSectionData('dossiers');
      }
    } catch (error: any) {
      console.error('❌ Erreur validation:', error);
      toast.error('Erreur lors de la validation', {
        description: error.message
      });
    }
  };

  const handleRejectEligibility = async (dossierId: string, dossierName: string) => {
    const reason = window.prompt(
      `Refuser l'éligibilité pour "${dossierName}"\n\n` +
      `Veuillez indiquer la raison du refus :`
    );

    if (!reason || reason.trim() === '') {
      toast.error('Refus annulé - Une raison est requise');
      return;
    }

    try {
      const response = await fetch(`${config.API_URL}/api/admin/dossiers/${dossierId}/validate-eligibility`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${await getSupabaseToken()}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: 'reject',
          notes: reason
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Erreur de refus');
      }

      const result = await response.json();
      
      if (result.success) {
        toast.success('Éligibilité refusée', {
          description: 'Le client a été notifié'
        });
        // Recharger les dossiers
        loadSectionData('dossiers');
      }
    } catch (error: any) {
      console.error('❌ Erreur refus:', error);
      toast.error('Erreur lors du refus', {
        description: error.message
      });
    }
  };

  const DossiersProcessingSection = ({ dossiers, loading, onRefresh }: { dossiers: ClientProduitEligible[], loading: boolean, onRefresh: () => void }) => {
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
              <Button 
                variant="outline" 
                size="sm"
                onClick={resetDashboard}
              >
                ← Retour au dashboard
              </Button>
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
                <div key={dossier.id} className="p-4 border rounded-lg hover:shadow-md transition-shadow bg-white">
                  {/* Header avec infos principales */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-start space-x-4 flex-1">
                      <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center flex-shrink-0">
                        <ClipboardList className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold text-gray-900">
                            {dossier.Client?.company_name || `Client #${dossier.clientId}`}
                          </h4>
                          <Badge 
                            variant={dossier.statut === 'pending' ? 'secondary' : 
                                   dossier.statut === 'eligible' || dossier.statut === 'validated' ? 'default' : 
                                   dossier.statut === 'rejected' ? 'destructive' : 'secondary'}
                            className="ml-auto"
                          >
                            {dossier.statut}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600 mb-1">
                          📦 {dossier.ProduitEligible?.nom || dossier.produitId}
                          {dossier.ProduitEligible?.categorie && (
                            <span className="text-gray-400 ml-2">• {dossier.ProduitEligible.categorie}</span>
                          )}
                        </p>
                        <p className="text-xs text-gray-400">
                          🕒 Créé le {new Date(dossier.created_at).toLocaleDateString('fr-FR', { 
                            day: 'numeric', 
                            month: 'long', 
                            year: 'numeric' 
                          })}
                        </p>
                      </div>
                    </div>
                    <div className="text-right ml-4">
                      {dossier.montantFinal ? (
                        <div className="bg-purple-50 px-3 py-2 rounded-lg">
                          <p className="text-xs text-gray-600">Montant</p>
                          <p className="text-lg font-bold text-purple-600">
                            {formatCurrency(dossier.montantFinal)}
                          </p>
                        </div>
                      ) : (
                        <p className="text-sm text-gray-400">Non évalué</p>
                      )}
                    </div>
                  </div>

                  {/* Infos Expert et Apporteur */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3 p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-blue-600" />
                      <div className="min-w-0">
                        <p className="text-xs text-gray-500">Expert attitré</p>
                        {(dossier as any).Expert ? (
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {(dossier as any).Expert.first_name} {(dossier as any).Expert.last_name}
                            {(dossier as any).Expert.rating && (
                              <span className="text-yellow-600 ml-1">⭐{(dossier as any).Expert.rating}</span>
                            )}
                          </p>
                        ) : (
                          <p className="text-sm text-gray-400">Non assigné</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Target className="w-4 h-4 text-green-600" />
                      <div className="min-w-0">
                        <p className="text-xs text-gray-500">Apporteur</p>
                        {dossier.Client?.apporteur_id ? (
                          <p className="text-sm font-medium text-gray-900 truncate">
                            Via Client
                          </p>
                        ) : (
                          <p className="text-sm text-gray-400">Aucun</p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Étapes de validation */}
                  <div className="mb-3 p-3 bg-blue-50 rounded-lg">
                    <p className="text-xs font-medium text-gray-700 mb-2">📋 Étapes de validation</p>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                      <div className="flex items-center gap-1">
                        {(dossier as any).pre_eligibility_validated_at ? (
                          <CheckCircle className="w-3 h-3 text-green-600" />
                        ) : (
                          <Clock className="w-3 h-3 text-orange-500" />
                        )}
                        <span className={`${(dossier as any).pre_eligibility_validated_at ? 'text-green-700' : 'text-gray-600'}`}>
                          Pré-éligibilité
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        {(dossier as any).eligibility_validated_at ? (
                          <CheckCircle className="w-3 h-3 text-green-600" />
                        ) : (
                          <Clock className="w-3 h-3 text-orange-500" />
                        )}
                        <span className={`${(dossier as any).eligibility_validated_at ? 'text-green-700' : 'text-gray-600'}`}>
                          Éligibilité
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        {(dossier as any).expert_report_status === 'completed' ? (
                          <CheckCircle className="w-3 h-3 text-green-600" />
                        ) : (dossier as any).expert_report_status === 'in_progress' ? (
                          <Clock className="w-3 h-3 text-orange-500" />
                        ) : (
                          <XCircle className="w-3 h-3 text-gray-400" />
                        )}
                        <span className={`${
                          (dossier as any).expert_report_status === 'completed' ? 'text-green-700' : 
                          (dossier as any).expert_report_status === 'in_progress' ? 'text-orange-600' : 
                          'text-gray-600'
                        }`}>
                          Rapport expert
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Barre de progression */}
                  <div className="mb-3">
                    <div className="flex justify-between text-sm text-gray-600 mb-1">
                      <span>Progression globale</span>
                      <span className="font-medium">{dossier.progress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div 
                        className={`h-2.5 rounded-full transition-all duration-300 ${
                          dossier.progress >= 80 ? 'bg-green-600' : 
                          dossier.progress >= 50 ? 'bg-blue-600' : 
                          'bg-orange-500'
                        }`}
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
                    {(dossier.statut === 'pending' || dossier.statut === 'documents_uploaded') && (
                      <>
                        <Button 
                          size="sm" 
                          variant="default" 
                          className="bg-green-600 hover:bg-green-700 text-white"
                          onClick={() => handleValidateEligibility(
                            dossier.id, 
                            dossier.Client?.company_name || dossier.ProduitEligible?.nom || `Dossier ${dossier.id.substring(0, 8)}`
                          )}
                        >
                          <Check className="w-4 h-4 mr-1" />
                          Valider éligibilité
                        </Button>
                        <Button 
                          size="sm" 
                          variant="destructive" 
                          className="text-white"
                          onClick={() => handleRejectEligibility(
                            dossier.id,
                            dossier.Client?.company_name || dossier.ProduitEligible?.nom || `Dossier ${dossier.id.substring(0, 8)}`
                          )}
                        >
                          <X className="w-4 h-4 mr-1" />
                          Refuser
                        </Button>
                      </>
                    )}
                    {dossier.statut === 'eligibility_validated' && (
                      <Badge variant="default" className="bg-green-100 text-green-800">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Éligibilité validée
                      </Badge>
                    )}
                    {dossier.statut === 'eligibility_rejected' && (
                      <Badge variant="destructive">
                        <XCircle className="w-3 h-3 mr-1" />
                        Refusée
                      </Badge>
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
    <footer className="bg-white border-t border-gray-100 mt-12">
      <div className="max-w-7xl mx-auto px-6 py-5">
        {/* Ligne principale compacte */}
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 lg:gap-8">
          {/* Logo et description */}
          <div className="flex items-center gap-3 flex-shrink-0">
            <div className="w-7 h-7 bg-gradient-to-br from-blue-500 to-purple-600 rounded-md flex items-center justify-center shadow-sm">
              <span className="text-white font-semibold text-xs">P</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base font-semibold text-gray-900 tracking-tight">Profitum</span>
                <span className="text-xs text-gray-400 font-light">•</span>
                <span className="text-xs text-gray-500 font-light">Plateforme de gestion financière et d'optimisation fiscale</span>
              </div>
            </div>
          </div>

          {/* Liens groupés horizontalement */}
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs">
            <div className="flex items-center gap-4">
              <a href="/admin/dashboard-optimized" className="text-gray-500 hover:text-gray-900 transition-colors font-medium">Dashboard</a>
              <a href="/admin/messagerie-admin" className="text-gray-500 hover:text-gray-900 transition-colors font-medium">Messagerie</a>
              <a href="/admin/agenda-admin" className="text-gray-500 hover:text-gray-900 transition-colors font-medium">Agenda</a>
              <a href="/admin/documents" className="text-gray-500 hover:text-gray-900 transition-colors font-medium">Documents</a>
            </div>
            <span className="text-gray-300">|</span>
            <div className="flex items-center gap-4">
              <a href="#" className="text-gray-500 hover:text-gray-900 transition-colors">Centre d'aide</a>
              <a href="#" className="text-gray-500 hover:text-gray-900 transition-colors">Support</a>
              <a href="#" className="text-gray-500 hover:text-gray-900 transition-colors">API</a>
              <a href="#" className="text-gray-500 hover:text-gray-900 transition-colors">Statut</a>
            </div>
            <span className="text-gray-300">|</span>
            <div className="flex items-center gap-3">
              <a href="#" className="text-gray-400 hover:text-gray-600 transition-colors" aria-label="LinkedIn">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.338 16.338H13.67V12.16c0-.995-.017-2.277-1.387-2.277-1.39 0-1.601 1.086-1.601 2.207v4.248H8.014v-8.59h2.559v1.174h.037c.356-.675 1.227-1.387 2.526-1.387 2.703 0 3.203 1.778 3.203 4.092v4.711zM5.005 6.575a1.548 1.548 0 11-.003-3.096 1.548 1.548 0 01.003 3.096zm-1.337 9.763H6.34v-8.59H3.667v8.59zM17.668 1H2.328C1.595 1 1 1.581 1 2.298v15.403C1 18.418 1.595 19 2.328 19h15.34c.734 0 1.332-.582 1.332-1.299V2.298C19 1.581 18.402 1 17.668 1z" clipRule="evenodd" />
                </svg>
              </a>
              <a href="#" className="text-gray-400 hover:text-gray-600 transition-colors" aria-label="Twitter">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M6.29 18.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0020 3.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.073 4.073 0 01.8 7.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 010 16.407a11.616 11.616 0 006.29 1.84" />
                </svg>
              </a>
            </div>
          </div>
        </div>

        {/* Ligne inférieure */}
        <div className="border-t border-gray-100 mt-4 pt-4 flex flex-col sm:flex-row justify-between items-center gap-3">
          <p className="text-xs text-gray-400 font-light">
            © 2025 Profitum. Tous droits réservés.
          </p>
          <div className="flex items-center gap-4 text-xs">
            <a href="#" className="text-gray-400 hover:text-gray-600 transition-colors font-light">Confidentialité</a>
            <span className="text-gray-300">•</span>
            <a href="#" className="text-gray-400 hover:text-gray-600 transition-colors font-light">Conditions</a>
            <span className="text-gray-300">•</span>
            <a href="#" className="text-gray-400 hover:text-gray-600 transition-colors font-light">Mentions légales</a>
          </div>
        </div>
      </div>
    </footer>
  );

  // ===== RENDU PRINCIPAL =====
  
  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="flex-1 p-3 md:p-6">
          {loading ? (
            <LoadingScreen />
          ) : (
            <>
              {/* Notifications temps réel */}
              <div className="mb-4 md:mb-6">
                <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
                  <CardContent className="p-3 md:p-4">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0">
                      <div className="flex items-center gap-3">
                        <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                        <div>
                          <h3 className="font-semibold text-sm md:text-base text-blue-900">Système en temps réel</h3>
                          <p className="text-xs md:text-sm text-blue-700">Dernière mise à jour: {new Date().toLocaleTimeString('fr-FR')}</p>
                        </div>
                      </div>
                      <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 items-stretch sm:items-center w-full sm:w-auto">
                        {/* TypeSwitcher */}
                        <TypeSwitcher />
                        
                        <div className="flex gap-2">
                          <Badge 
                            variant="default" 
                            className={`bg-green-100 text-green-800 cursor-pointer hover:bg-green-200 transition-colors text-xs ${
                              selectedAlertType === 'urgences' ? 'ring-2 ring-green-500' : ''
                            }`}
                            onClick={() => setSelectedAlertType(selectedAlertType === 'urgences' ? null : 'urgences')}
                          >
                            <Check className="w-3 h-3 mr-1" />
                            {kpiData.alertesUrgentes === 0 ? 'Aucune urgence' : `${kpiData.alertesUrgentes} urgences`}
                          </Badge>
                          <Badge 
                            variant="secondary" 
                            className={`bg-yellow-100 text-yellow-800 cursor-pointer hover:bg-yellow-200 transition-colors text-xs ${
                              selectedAlertType === 'alertes' ? 'ring-2 ring-yellow-500' : ''
                            }`}
                            onClick={() => setSelectedAlertType(selectedAlertType === 'alertes' ? null : 'alertes')}
                          >
                            <Clock className="w-3 h-3 mr-1" />
                            {kpiData.alertesNormales} alertes
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Affichage des urgences/alertes détaillées */}
              {selectedAlertType && (
                <div className="mb-6">
                  <Card className="border-2 border-blue-300">
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        <span className="flex items-center gap-2">
                          {selectedAlertType === 'urgences' ? (
                            <>
                              <Check className="w-5 h-5 text-red-600" />
                              <span>Urgences ({kpiData.alertesUrgentes})</span>
                            </>
                          ) : (
                            <>
                              <Clock className="w-5 h-5 text-yellow-600" />
                              <span>Alertes ({kpiData.alertesNormales})</span>
                            </>
                          )}
                        </span>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => setSelectedAlertType(null)}
                        >
                          <XCircle className="w-4 h-4" />
                        </Button>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {selectedAlertType === 'urgences' ? (
                        <div className="space-y-4">
                          {/* Dossiers urgents */}
                          {urgencesData.dossiers.length > 0 && (
                            <div>
                              <h4 className="font-semibold text-sm text-gray-700 mb-2">
                                Dossiers à valider ({urgencesData.dossiers.length})
                              </h4>
                              <div className="space-y-2">
                                {urgencesData.dossiers.map((dossier: any) => (
                                  <div 
                                    key={dossier.id}
                                    className="p-3 border rounded-lg hover:bg-gray-50 cursor-pointer"
                                    onClick={() => navigate(`/admin/dossiers/${dossier.id}`)}
                                  >
                                    <div className="flex items-center justify-between">
                                      <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                          <Package className="w-4 h-4 text-blue-600" />
                                          <span className="font-medium text-sm">
                                            {dossier.ProduitEligible?.nom || dossier.produitId || 'Dossier'}
                                          </span>
                                          <Badge variant="outline" className="text-xs">
                                            {dossier.statut}
                                          </Badge>
                                        </div>
                                        {dossier.Client && (
                                          <p className="text-xs text-gray-600">
                                            Client: {dossier.Client.company_name || dossier.Client.email || 'N/A'}
                                          </p>
                                        )}
                                        {dossier.montantFinal && (
                                          <p className="text-xs text-gray-600">
                                            Montant: {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(dossier.montantFinal)}
                                          </p>
                                        )}
                                      </div>
                                      <Button variant="ghost" size="sm">
                                        <Eye className="w-4 h-4" />
                                      </Button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                          
                          {/* Experts urgents */}
                          {urgencesData.experts.length > 0 && (
                            <div>
                              <h4 className="font-semibold text-sm text-gray-700 mb-2">
                                Experts en attente {'>'}48h ({urgencesData.experts.length})
                              </h4>
                              <div className="space-y-2">
                                {urgencesData.experts.map((expert: any) => (
                                  <div 
                                    key={expert.id}
                                    className="p-3 border rounded-lg hover:bg-gray-50 cursor-pointer"
                                    onClick={() => navigate(`/admin/experts/${expert.id}`)}
                                  >
                                    <div className="flex items-center justify-between">
                                      <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                          <User className="w-4 h-4 text-purple-600" />
                                          <span className="font-medium text-sm">
                                            {expert.first_name || expert.name ? `${expert.first_name || expert.name?.split(' ')[0] || ''} ${expert.last_name || expert.name?.split(' ').slice(1).join(' ') || ''}`.trim() || expert.company_name : expert.company_name}
                                          </span>
                                          <Badge variant="outline" className="text-xs">
                                            {expert.approval_status}
                                          </Badge>
                                        </div>
                                        <p className="text-xs text-gray-600">
                                          Entreprise: {expert.company_name || 'N/A'}
                                        </p>
                                        <p className="text-xs text-gray-600">
                                          Email: {expert.email || 'N/A'}
                                        </p>
                                      </div>
                                      <Button variant="ghost" size="sm">
                                        <Eye className="w-4 h-4" />
                                      </Button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                          
                          {urgencesData.dossiers.length === 0 && urgencesData.experts.length === 0 && (
                            <p className="text-center text-gray-500 py-4">Aucune urgence</p>
                          )}
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {/* Dossiers en retard */}
                          {alertesData.dossiers.length > 0 && (
                            <div>
                              <h4 className="font-semibold text-sm text-gray-700 mb-2">
                                Dossiers en retard {'>'}21 jours ({alertesData.dossiers.length})
                              </h4>
                              <div className="space-y-2">
                                {alertesData.dossiers.map((dossier: any) => {
                                  const createdAt = new Date(dossier.created_at);
                                  const diffDays = Math.floor((new Date().getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24));
                                  return (
                                    <div 
                                      key={dossier.id}
                                      className="p-3 border rounded-lg hover:bg-gray-50 cursor-pointer"
                                      onClick={() => navigate(`/admin/dossiers/${dossier.id}`)}
                                    >
                                      <div className="flex items-center justify-between">
                                        <div className="flex-1">
                                          <div className="flex items-center gap-2 mb-1">
                                            <Package className="w-4 h-4 text-orange-600" />
                                            <span className="font-medium text-sm">
                                              {dossier.ProduitEligible?.nom || dossier.produitId || 'Dossier'}
                                            </span>
                                            <Badge variant="outline" className="text-xs">
                                              {dossier.statut}
                                            </Badge>
                                            <Badge variant="outline" className="text-xs bg-orange-100">
                                              {diffDays} jours
                                            </Badge>
                                          </div>
                                          {dossier.Client && (
                                            <p className="text-xs text-gray-600">
                                              Client: {dossier.Client.company_name || dossier.Client.email || 'N/A'}
                                            </p>
                                          )}
                                          {dossier.montantFinal && (
                                            <p className="text-xs text-gray-600">
                                              Montant: {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(dossier.montantFinal)}
                                            </p>
                                          )}
                                        </div>
                                        <Button variant="ghost" size="sm">
                                          <Eye className="w-4 h-4" />
                                        </Button>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                          
                          {/* Experts récents */}
                          {alertesData.experts.length > 0 && (
                            <div>
                              <h4 className="font-semibold text-sm text-gray-700 mb-2">
                                Nouveaux experts en attente &lt;48h ({alertesData.experts.length})
                              </h4>
                              <div className="space-y-2">
                                {alertesData.experts.map((expert: any) => (
                                  <div 
                                    key={expert.id}
                                    className="p-3 border rounded-lg hover:bg-gray-50 cursor-pointer"
                                    onClick={() => navigate(`/admin/experts/${expert.id}`)}
                                  >
                                    <div className="flex items-center justify-between">
                                      <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                          <User className="w-4 h-4 text-blue-600" />
                                          <span className="font-medium text-sm">
                                            {expert.first_name || expert.name ? `${expert.first_name || expert.name?.split(' ')[0] || ''} ${expert.last_name || expert.name?.split(' ').slice(1).join(' ') || ''}`.trim() || expert.company_name : expert.company_name}
                                          </span>
                                          <Badge variant="outline" className="text-xs">
                                            {expert.approval_status}
                                          </Badge>
                                        </div>
                                        <p className="text-xs text-gray-600">
                                          Entreprise: {expert.company_name || 'N/A'}
                                        </p>
                                        <p className="text-xs text-gray-600">
                                          Email: {expert.email || 'N/A'}
                                        </p>
                                      </div>
                                      <Button variant="ghost" size="sm">
                                        <Eye className="w-4 h-4" />
                                      </Button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                          
                          {alertesData.dossiers.length === 0 && alertesData.experts.length === 0 && (
                            <p className="text-center text-gray-500 py-4">Aucune alerte</p>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Section dynamique */}
              <div className="mt-8">
                {activeSection === 'overview' && (
                  <div className="space-y-6">
                    {/* En-tête avec actions de reporting */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0 mb-4 md:mb-6">
                      <div>
                        <h2 className="text-xl md:text-2xl font-bold text-slate-900">Vue d'ensemble - Reporting</h2>
                        <p className="text-sm md:text-base text-slate-600">Tableaux de bord et analyses en temps réel</p>
                      </div>
                      <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                        <Button variant="outline" size="sm" className="text-xs md:text-sm flex-1 sm:flex-initial">
                          <Download className="w-4 h-4 mr-2" />
                          <span className="hidden sm:inline">Exporter Rapport</span>
                          <span className="sm:hidden">Exporter</span>
                        </Button>
                        <Button variant="outline" size="sm" className="text-xs md:text-sm flex-1 sm:flex-initial">
                          <RefreshCw className="w-4 h-4 mr-2" />
                          Actualiser
                        </Button>
                        <Button variant="outline" size="sm" className="text-xs md:text-sm flex-1 sm:flex-initial">
                          <Settings className="w-4 h-4 mr-2" />
                          <span className="hidden sm:inline">Configurer</span>
                          <span className="sm:hidden">Config</span>
                        </Button>
                      </div>
                    </div>

                    {/* Métriques écosystème uniquement */}
                    <div className="grid grid-cols-1 md:grid-cols-1 gap-6">
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <Users className="w-5 h-5" />
                            Écosystème
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          {/* Tuiles Écosystème - Grid responsive au lieu de flex avec overflow */}
                          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2 md:gap-3 mb-6">
                            {/* Clients */}
                            <div 
                              className={`p-2 md:p-3 rounded-lg border cursor-pointer transition-all ${
                                selectedEcosystemTile === 'clients' 
                                  ? 'border-green-500 bg-green-50 shadow-md' 
                                  : 'border-gray-200 hover:border-green-300 hover:bg-green-50'
                              }`}
                              onClick={() => setSelectedEcosystemTile('clients')}
                            >
                              <div className="flex flex-col items-center justify-center">
                                <p className="text-xs text-gray-600 mb-1 text-center">Clients actifs</p>
                                <p className="text-base md:text-lg font-bold text-green-600">{kpiData.totalClients}</p>
                              </div>
                            </div>

                            {/* Experts */}
                            <div 
                              className={`p-2 md:p-3 rounded-lg border cursor-pointer transition-all ${
                                selectedEcosystemTile === 'experts' 
                                  ? 'border-blue-500 bg-blue-50 shadow-md' 
                                  : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50'
                              }`}
                              onClick={() => setSelectedEcosystemTile('experts')}
                            >
                              <div className="flex flex-col items-center justify-center">
                                <p className="text-xs text-gray-600 mb-1 text-center">Experts</p>
                                <p className="text-base md:text-lg font-bold text-blue-600">{kpiData.totalExperts}</p>
                              </div>
                            </div>

                            {/* Apporteurs */}
                            <div 
                              className={`p-2 md:p-3 rounded-lg border cursor-pointer transition-all ${
                                selectedEcosystemTile === 'apporteurs' 
                                  ? 'border-purple-500 bg-purple-50 shadow-md' 
                                  : 'border-gray-200 hover:border-purple-300 hover:bg-purple-50'
                              }`}
                              onClick={() => setSelectedEcosystemTile('apporteurs')}
                            >
                              <div className="flex flex-col items-center justify-center">
                                <p className="text-xs text-gray-600 mb-1 text-center">Apporteurs</p>
                                <p className="text-base md:text-lg font-bold text-purple-600">{kpiData.apporteursTotal}</p>
                              </div>
                            </div>

                            {/* Dossiers */}
                            <div 
                              className={`p-2 md:p-3 rounded-lg border cursor-pointer transition-all ${
                                selectedEcosystemTile === 'dossiers' 
                                  ? 'border-indigo-500 bg-indigo-50 shadow-md' 
                                  : 'border-gray-200 hover:border-indigo-300 hover:bg-indigo-50'
                              }`}
                              onClick={() => setSelectedEcosystemTile('dossiers')}
                            >
                              <div className="flex flex-col items-center justify-center">
                                <p className="text-xs text-gray-600 mb-1 text-center">Dossiers en cours</p>
                                <p className="text-base md:text-lg font-bold text-indigo-600">{kpiData.totalDossiers}</p>
                              </div>
                            </div>

                            {/* Produits */}
                            <div 
                              className={`p-2 md:p-3 rounded-lg border cursor-pointer transition-all ${
                                selectedEcosystemTile === 'produits' 
                                  ? 'border-orange-500 bg-orange-50 shadow-md' 
                                  : 'border-gray-200 hover:border-orange-300 hover:bg-orange-50'
                              }`}
                              onClick={() => {
                                console.log('🎯 CLIC sur tuile Produits - selectedEcosystemTile va être mis à "produits"');
                                setSelectedEcosystemTile('produits');
                              }}
                            >
                              <div className="flex flex-col items-center justify-center">
                                <p className="text-xs text-gray-600 mb-1 text-center">Produits éligibles</p>
                                <p className="text-base md:text-lg font-bold text-orange-600">{kpiData.totalProduits || 0}</p>
                              </div>
                            </div>

                            {/* Performance */}
                            <div 
                              className={`p-2 md:p-3 rounded-lg border cursor-pointer transition-all ${
                                selectedEcosystemTile === 'performance' 
                                  ? 'border-emerald-500 bg-emerald-50 shadow-md' 
                                  : 'border-gray-200 hover:border-emerald-300 hover:bg-emerald-50'
                              }`}
                              onClick={() => setSelectedEcosystemTile('performance')}
                            >
                              <div className="flex flex-col items-center justify-center">
                                <p className="text-xs text-gray-600 mb-1 text-center">Performance</p>
                                <p className={`text-base md:text-lg font-bold ${kpiData.croissanceRevenus >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                  {kpiData.croissanceRevenus >= 0 ? '+' : ''}{kpiData.croissanceRevenus}%
                                </p>
                              </div>
                            </div>
                          </div>

                          {/* Tableau dynamique selon la tuile sélectionnée */}
                          {selectedEcosystemTile && (
                            <div className="mt-6">
                              <Card>
                                <CardHeader>
                                  <CardTitle className="flex items-center gap-2">
                                    {selectedEcosystemTile === 'clients' && (
                                      <>
                                        <Users className="w-5 h-5 text-green-600" />
                                        Détails Clients ({kpiData.totalClients})
                                      </>
                                    )}
                                    {selectedEcosystemTile === 'experts' && (
                                      <>
                                        <UserCheck className="w-5 h-5 text-blue-600" />
                                        Annuaire Experts Certifiés
                                      </>
                                    )}
                                    {selectedEcosystemTile === 'apporteurs' && (
                                      <>
                                        <Handshake className="w-5 h-5 text-purple-600" />
                                        Détails Apporteurs ({kpiData.apporteursTotal})
                                      </>
                                    )}
                                    {selectedEcosystemTile === 'dossiers' && (
                                      <>
                                        <FileText className="w-5 h-5 text-indigo-600" />
                                        Détails Dossiers ({kpiData.totalDossiers})
                                      </>
                                    )}
                                    {selectedEcosystemTile === 'produits' && (
                                      <>
                                        <Package className="w-5 h-5 text-orange-600" />
                                        Catalogue Produits Éligibles
                                      </>
                                    )}
                                    {selectedEcosystemTile === 'performance' && (
                                      <>
                                        <TrendingUp className="w-5 h-5 text-emerald-600" />
                                        Détails Performance
                                      </>
                                    )}
                                  </CardTitle>
                                </CardHeader>
                                <CardContent>
                                  {selectedEcosystemTile === 'clients' && (
                                    <div className="space-y-4">
                                      {loadingTileData ? (
                                        <div className="flex items-center justify-center py-8">
                                          <RefreshCw className="w-6 h-6 animate-spin text-green-600" />
                                          <span className="ml-2 text-gray-600">Chargement des clients...</span>
                                        </div>
                                      ) : (() => {
                                        // Filtrer selon le type de client
                                        const filteredClients = selectedTileData.filter((client: any) => {
                                          if (clientTypeFilter === 'all') return true;
                                          return client.type === clientTypeFilter;
                                        });
                                        
                                        return filteredClients.length > 0 ? (
                                        <div className="space-y-3">
                                          <div className="flex justify-between items-center">
                                            <h4 className="font-semibold text-gray-800">
                                              {clientTypeFilter === 'client' ? 'Clients actifs' : clientTypeFilter === 'temporaire' ? 'Prospects simulateur' : 'Tous les clients'} ({filteredClients.length})
                                            </h4>
                                            <div className="flex items-center gap-2">
                                              <div className="flex gap-1">
                                                <Button 
                                                  variant={clientTypeFilter === 'client' ? 'default' : 'outline'}
                                                  size="sm"
                                                  onClick={() => setClientTypeFilter('client')}
                                                  className="text-xs"
                                                >
                                                  Clients actifs
                                                </Button>
                                                <Button 
                                                  variant={clientTypeFilter === 'temporaire' ? 'default' : 'outline'}
                                                  size="sm"
                                                  onClick={() => setClientTypeFilter('temporaire')}
                                                  className="text-xs"
                                                >
                                                  Prospects simulateur
                                                </Button>
                                              </div>
                                              <Button 
                                                variant="outline" 
                                                size="sm"
                                                onClick={() => setActiveSection('clients')}
                                              >
                                                Voir tous
                                              </Button>
                                            </div>
                                          </div>
                                          
                                          <div className="space-y-3 max-h-96 overflow-y-auto">
                                            {filteredClients.slice(0, 10).map((client: any) => (
                                              <div 
                                                key={client.id} 
                                                onClick={() => navigate(`/admin/clients/${client.id}`)}
                                                className="group relative p-4 border border-gray-200 rounded-xl hover:border-green-400 hover:shadow-lg transition-all duration-300 bg-white hover:bg-gradient-to-br hover:from-white hover:to-green-50/40 cursor-pointer transform hover:-translate-y-0.5"
                                              >
                                                <div className="flex items-start gap-4">
                                                  {/* Avatar/Icône Entreprise - Plus grand et plus premium */}
                                                  <div className="flex-shrink-0 w-14 h-14 rounded-xl bg-gradient-to-br from-green-500 via-emerald-500 to-teal-600 flex items-center justify-center text-white font-bold text-lg shadow-md ring-2 ring-green-100 group-hover:ring-green-300 transition-all">
                                                    {(client.company_name || client.first_name || 'C')[0].toUpperCase()}
                                                  </div>
                                                  
                                                  {/* Informations principales */}
                                                  <div className="flex-1 min-w-0">
                                                    <div className="flex items-start justify-between gap-3 mb-2">
                                                      <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                                                          <h5 className="font-bold text-gray-900 text-base truncate">
                                                            {client.company_name || `${client.first_name || ''} ${client.last_name || ''}`.trim() || 'N/A'}
                                                          </h5>
                                                          <Badge 
                                                            variant={client.statut === 'active' || client.statut === 'actif' ? 'default' : 'secondary'}
                                                            className="text-[11px] px-2 py-0.5 h-5 font-medium"
                                                          >
                                                            {client.statut}
                                                          </Badge>
                                                          {client.dossiersAValider > 0 && (
                                                            <Badge variant="destructive" className="text-[11px] px-2 py-0.5 h-5 font-medium animate-pulse">
                                                              ⚠️ {client.dossiersAValider}
                                                            </Badge>
                                                          )}
                                                        </div>
                                                        <div className="flex items-center gap-4 text-sm text-gray-600 mb-2">
                                                          <span className="flex items-center gap-1.5">
                                                            <Mail className="w-3.5 h-3.5 text-gray-400" />
                                                            <span className="truncate max-w-[200px]">{client.email?.length > 30 ? `${client.email.substring(0, 30)}...` : client.email}</span>
                                                          </span>
                                                          {client.phone_number && (
                                                            <span className="flex items-center gap-1.5">
                                                              <Phone className="w-3.5 h-3.5 text-gray-400" />
                                                              {client.phone_number}
                                                            </span>
                                                          )}
                                                        </div>
                                                        
                                                        {/* Informations métier */}
                                                        <div className="flex items-center gap-4 text-xs text-gray-500">
                                                          {client.secteurActivite ? (
                                                            <div className="flex items-center gap-1.5">
                                                              <Building className="w-3.5 h-3.5 text-blue-500" />
                                                              <span className="truncate max-w-[150px]">{client.secteurActivite}</span>
                                                            </div>
                                                          ) : (
                                                            <span className="text-gray-400 italic">Infos entreprise manquantes</span>
                                                          )}
                                                          {client.nombreEmployes && (
                                                            <div className="flex items-center gap-1.5">
                                                              <Users className="w-3.5 h-3.5 text-purple-500" />
                                                              <span>{client.nombreEmployes} emp.</span>
                                                            </div>
                                                          )}
                                                        </div>
                                                      </div>
                                                      
                                                      {/* Colonne droite - Dossiers et Date */}
                                                      <div className="flex flex-col items-end gap-2 text-right">
                                                        {/* Nombre de dossiers */}
                                                        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg border border-green-200">
                                                          <FileText className="w-4 h-4 text-green-600" />
                                                          <span className="font-bold text-green-700 text-sm">{client.dossiersCount || 0}</span>
                                                        </div>
                                                        
                                                        {/* Date de création */}
                                                        <div className="text-xs text-gray-500">
                                                          <div className="font-medium text-[10px] text-gray-400 uppercase tracking-wide mb-0.5">Créé</div>
                                                          <div className="font-semibold">{new Date(client.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: '2-digit' })}</div>
                                                        </div>
                                                      </div>
                                                    </div>
                                                  </div>
                                                </div>
                                                
                                                {/* Indicateur de clic subtil */}
                                                <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                                  <Eye className="w-4 h-4 text-green-600" />
                                                </div>
                                              </div>
                                            ))}
                                            
                                            {filteredClients.length > 10 && (
                                              <div className="text-center py-2 text-sm text-gray-500">
                                                ... et {filteredClients.length - 10} autres clients
                                              </div>
                                            )}
                                          </div>
                                        </div>
                                        ) : (
                                          <div className="text-center py-8">
                                            <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                                            <p className="text-gray-500">
                                              {clientTypeFilter === 'client' ? 'Aucun client actif trouvé' : 
                                               clientTypeFilter === 'temporaire' ? 'Aucun prospect simulateur trouvé' : 
                                               'Aucun client trouvé'}
                                            </p>
                                          </div>
                                        );
                                      })()}
                                    </div>
                                  )}
                                  
                                  {selectedEcosystemTile === 'experts' && (
                                    <div className="space-y-4">
                                      {loadingTileData ? (
                                        <div className="flex items-center justify-center py-8">
                                          <RefreshCw className="w-6 h-6 animate-spin text-blue-600" />
                                          <span className="ml-2 text-gray-600">Chargement des experts...</span>
                                        </div>
                                      ) : selectedTileData.length > 0 ? (
                                        <div className="space-y-4">
                                          <div className="flex justify-between items-center mb-4">
                                            <div className="flex items-center gap-3">
                                              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                                                <UserCheck className="w-6 h-6 text-white" />
                                              </div>
                                              <div>
                                                <h4 className="text-xl font-bold text-gray-900">
                                                  Annuaire Experts Certifiés
                                                </h4>
                                                <p className="text-sm text-gray-600">
                                                  {selectedTileData.length} expert{selectedTileData.length > 1 ? 's' : ''} référencé{selectedTileData.length > 1 ? 's' : ''}
                                                </p>
                                              </div>
                                            </div>
                                            <Button 
                                              variant="outline" 
                                              size="sm"
                                              onClick={() => setActiveSection('experts')}
                                            >
                                              Voir tous
                                            </Button>
                                          </div>

                                          <div className="rounded-md border overflow-hidden">
                                            <table className="w-full text-sm">
                                              <thead className="bg-slate-50 border-b border-slate-200">
                                                <tr>
                                                  <th className="px-4 py-3 text-left font-semibold text-slate-900">Expert</th>
                                                  <th className="px-4 py-3 text-left font-semibold text-slate-900">Email</th>
                                                  <th className="px-4 py-3 text-left font-semibold text-slate-900">Spécialisations</th>
                                                  <th className="px-4 py-3 text-left font-semibold text-slate-900">Statut</th>
                                                  <th className="px-4 py-3 text-left font-semibold text-slate-900">Créé le</th>
                                                  <th className="px-4 py-3 text-center font-semibold text-slate-900">Actions</th>
                                                </tr>
                                              </thead>
                                              <tbody className="divide-y divide-slate-200">
                                                {selectedTileData.map((expert: any) => {
                                                  const fullName = `${expert.first_name || ''} ${expert.last_name || ''}`.trim();
                                                  const displayName = fullName || expert.company_name || expert.name || 'N/A';
                                                  const specialisations = expert.specializations?.length ? expert.specializations.join(', ') : '—';
                                                  return (
                                                    <tr
                                                      key={expert.id}
                                                      className="hover:bg-blue-50 cursor-pointer transition-colors"
                                                      onClick={() => navigate(`/admin/experts/${expert.id}`)}
                                                    >
                                                      <td className="px-4 py-3 font-medium text-slate-900 flex flex-col">
                                                        <span>{displayName}</span>
                                                        {expert.company_name && (
                                                          <span className="text-xs text-slate-500">{expert.company_name}</span>
                                                        )}
                                                      </td>
                                                      <td className="px-4 py-3 text-slate-600">{expert.email || '—'}</td>
                                                      <td className="px-4 py-3 text-slate-600">{specialisations}</td>
                                                      <td className="px-4 py-3">
                                                        <Badge
                                                          variant={
                                                            expert.approval_status === 'approved' ? 'default' :
                                                            expert.approval_status === 'pending' ? 'secondary' :
                                                            'destructive'
                                                          }
                                                          className={
                                                            expert.approval_status === 'approved'
                                                              ? 'bg-blue-100 text-blue-800'
                                                              : expert.approval_status === 'pending'
                                                              ? 'bg-yellow-100 text-yellow-800'
                                                              : 'bg-red-100 text-red-800'
                                                          }
                                                        >
                                                          {expert.approval_status || 'N/A'}
                                                        </Badge>
                                                      </td>
                                                      <td className="px-4 py-3 text-slate-600">
                                                        {expert.created_at ? new Date(expert.created_at).toLocaleDateString('fr-FR') : '—'}
                                                      </td>
                                                      <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                                                        <div className="flex items-center justify-center gap-1">
                                                          <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => navigate(`/admin/experts/${expert.id}`)}
                                                            title="Voir la synthèse"
                                                          >
                                                            <Eye className="h-4 w-4" />
                                                          </Button>
                                                          <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => navigate(`/admin/messagerie-admin?user=${expert.id}`)}
                                                            title="Contacter l'expert"
                                                          >
                                                            <Mail className="h-4 w-4" />
                                                          </Button>
                                                        </div>
                                                      </td>
                                                    </tr>
                                                  );
                                                })}
                                              </tbody>
                                            </table>
                                          </div>
                                        </div>
                                      ) : (
                                        <div className="text-center py-8">
                                          <UserCheck className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                                          <p className="text-gray-500">Aucun expert trouvé</p>
                                        </div>
                                      )}
                                    </div>
                                  )}
                                  
                                  {selectedEcosystemTile === 'apporteurs' && (
                                    <div className="space-y-4">
                                      {loadingTileData ? (
                                        <div className="flex items-center justify-center py-8">
                                          <RefreshCw className="w-6 h-6 animate-spin text-purple-600" />
                                          <span className="ml-2 text-gray-600">Chargement des apporteurs...</span>
                                        </div>
                                      ) : selectedTileData.length > 0 ? (
                                        <div className="space-y-3">
                                          <div className="flex justify-between items-center">
                                            <h4 className="font-semibold text-gray-800">
                                              Apporteurs d'affaires ({selectedTileData.length})
                                            </h4>
                                            <Button 
                                              variant="outline" 
                                              size="sm"
                                              onClick={() => setActiveSection('apporteurs')}
                                            >
                                              Voir tous
                                            </Button>
                                          </div>
                                          
                                          <div className="space-y-2 max-h-96 overflow-y-auto">
                                            {selectedTileData.slice(0, 10).map((apporteur: any) => (
                                              <div
                                                key={apporteur.id}
                                                className="p-3 border rounded-lg hover:bg-purple-50 cursor-pointer transition-colors"
                                                onClick={() => navigate(`/admin/apporteurs/${apporteur.id}`)}
                                              >
                                                <div className="flex justify-between items-start">
                                                  <div className="flex-1">
                                                    <div className="flex items-center gap-2 mb-1">
                                                      <h5 className="font-medium text-gray-800">
                                                        {`${apporteur.first_name || ''} ${apporteur.last_name || ''}`.trim() || apporteur.company_name || 'N/A'}
                                                      </h5>
                                                      <Badge variant={
                                                        apporteur.status === 'active' ? 'default' :
                                                        apporteur.status === 'candidature' ? 'secondary' :
                                                        apporteur.status === 'suspended' ? 'destructive' : 'outline'
                                                      }>
                                                        {apporteur.status}
                                                      </Badge>
                                                    </div>
                                                    
                                                    <div className="text-sm text-gray-600">
                                                      {apporteur.company_name && <p>🏢 {apporteur.company_name}</p>}
                                                      <p>📧 {apporteur.email}</p>
                                                      {apporteur.phone && <p>📞 {apporteur.phone}</p>}
                                                      {apporteur.commission_rate && (
                                                        <p>💰 Commission: {apporteur.commission_rate}%</p>
                                                      )}
                                                      <p>📅 Créé le {new Date(apporteur.created_at).toLocaleDateString('fr-FR')}</p>
                                                    </div>
                                                  </div>
                                                  
                                                  <div className="text-right">
                                                    <Button 
                                                      variant="ghost" 
                                                      size="sm"
                                                      onClick={(e) => {
                                                        e.stopPropagation();
                                                        navigate(`/admin/apporteurs/${apporteur.id}`);
                                                      }}
                                                      title="Voir la synthèse de l'apporteur"
                                                    >
                                                      <Eye className="w-4 h-4" />
                                                    </Button>
                                                  </div>
                                                </div>
                                              </div>
                                            ))}
                                            
                                            {selectedTileData.length > 10 && (
                                              <div className="text-center py-2 text-sm text-gray-500">
                                                ... et {selectedTileData.length - 10} autres apporteurs
                                              </div>
                                            )}
                                          </div>
                                        </div>
                                      ) : (
                                        <div className="text-center py-8">
                                          <Handshake className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                                          <p className="text-gray-500">Aucun apporteur trouvé</p>
                                        </div>
                                      )}
                                    </div>
                                  )}
                                  
                                  {selectedEcosystemTile === 'dossiers' && (
                                    <div className="space-y-4">
                                      {loadingTileData ? (
                                        <div className="flex items-center justify-center py-8">
                                          <RefreshCw className="w-6 h-6 animate-spin text-blue-600" />
                                          <span className="ml-2 text-gray-600">Chargement des dossiers...</span>
                                        </div>
                                      ) : selectedTileData.length > 0 ? (
                                        <div className="space-y-3">
                                          <div className="flex flex-col gap-3">
                                            {/* Header */}
                                            <div className="flex justify-between items-center">
                                              <h4 className="font-semibold text-gray-800">
                                                Dossiers ClientProduitEligible ({filteredTileData.length}/{selectedTileData.length})
                                              </h4>
                                              <Button 
                                                variant="outline" 
                                                size="sm"
                                                onClick={() => setActiveSection('dossiers')}
                                              >
                                                Voir tous
                                              </Button>
                                            </div>
                                            
                                            {/* Filtres */}
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-2 p-3 bg-gray-50 rounded-lg">
                                              {/* Filtre Statut */}
                                              <div>
                                                <Label className="text-xs text-gray-600 mb-1 block">Statut</Label>
                                                <Select value={filterStatus} onValueChange={setFilterStatus}>
                                                  <SelectTrigger className="h-8 text-xs">
                                                    <SelectValue placeholder="Tous" />
                                                  </SelectTrigger>
                                                  <SelectContent>
                                                    <SelectItem value="all">Tous</SelectItem>
                                                    <SelectItem value="eligible">Éligible</SelectItem>
                                                    <SelectItem value="pending">En attente</SelectItem>
                                                    <SelectItem value="validated">Validé</SelectItem>
                                                    <SelectItem value="rejected">Rejeté</SelectItem>
                                                  </SelectContent>
                                                </Select>
                                              </div>
                                              
                                              {/* Filtre Date */}
                                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
                                                <div>
                                                  <Label className="text-xs text-gray-600 mb-1 block">Date début</Label>
                                                  <Input
                                                    type="date"
                                                    value={filterDateStart}
                                                    onChange={(e) => setFilterDateStart(e.target.value)}
                                                    className="h-8 text-xs"
                                                  />
                                                </div>
                                                <div>
                                                  <Label className="text-xs text-gray-600 mb-1 block">Date fin</Label>
                                                  <Input
                                                    type="date"
                                                    value={filterDateEnd}
                                                    onChange={(e) => setFilterDateEnd(e.target.value)}
                                                    className="h-8 text-xs"
                                                  />
                                                </div>
                                              </div>
                                              
                                              {/* Filtre Montant */}
                                              <div>
                                                <Label className="text-xs text-gray-600 mb-1 block">
                                                  Montant: {filterMontantMin.toLocaleString('fr-FR')}€ - {filterMontantMax.toLocaleString('fr-FR')}€
                                                </Label>
                                                <div className="flex items-center gap-2">
                                                  <Input
                                                    type="number"
                                                    value={filterMontantMin}
                                                    onChange={(e) => setFilterMontantMin(Number(e.target.value))}
                                                    placeholder="Min"
                                                    className="h-8 text-xs w-24"
                                                  />
                                                  <span className="text-xs text-gray-400">-</span>
                                                  <Input
                                                    type="number"
                                                    value={filterMontantMax}
                                                    onChange={(e) => setFilterMontantMax(Number(e.target.value))}
                                                    placeholder="Max"
                                                    className="h-8 text-xs w-24"
                                                  />
                                                </div>
                                              </div>
                                              
                                              {/* Reset */}
                                              {(filterStatus !== 'all' || filterDateStart || filterDateEnd || filterMontantMin > 0 || filterMontantMax < 1000000) && (
                                                <div className="flex items-end">
                                                  <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-8 text-xs w-full"
                                                    onClick={() => {
                                                      setFilterStatus('all');
                                                      setFilterDateStart('');
                                                      setFilterDateEnd('');
                                                      setFilterMontantMin(0);
                                                      setFilterMontantMax(1000000);
                                                    }}
                                                  >
                                                    <X className="w-3 h-3 mr-1" />
                                                    Réinitialiser
                                                  </Button>
                                                </div>
                                              )}
                                            </div>
                                          </div>
                                          
                                          <div className="space-y-2 max-h-96 overflow-y-auto">
                                            {filteredTileData.slice(0, 10).map((dossier: any) => (
                                              <div key={dossier.id} className="p-3 border rounded-lg hover:bg-gray-50">
                                                <div className="flex justify-between items-start">
                                                  <div className="flex-1">
                                                    <div className="flex items-center gap-2 mb-1">
                                                      <Badge variant={
                                                        dossier.statut === 'eligible' ? 'default' :
                                                        dossier.statut === 'pending' ? 'secondary' :
                                                        dossier.statut === 'validated' ? 'default' : 'outline'
                                                      }>
                                                        {dossier.statut}
                                                      </Badge>
                                                      {dossier.montantFinal && (
                                                        <span className="text-sm font-medium text-green-600">
                                                          {dossier.montantFinal.toLocaleString('fr-FR')}€
                                                        </span>
                                                      )}
                                                    </div>
                                                    
                                                    <div className="text-sm text-gray-600">
                                                      <p><strong>Client:</strong> {dossier.Client?.company_name || dossier.Client?.first_name || 'N/A'}</p>
                                                      <p><strong>Produit:</strong> {dossier.ProduitEligible?.nom || 'N/A'}</p>
                                                      {dossier.Expert && (
                                                        <p><strong>Expert:</strong> {dossier.Expert.first_name} {dossier.Expert.last_name}</p>
                                                      )}
                                                      <p><strong>Créé:</strong> {new Date(dossier.created_at).toLocaleDateString('fr-FR')}</p>
                                                    </div>
                                                  </div>
                                                  
                                                  <div className="flex flex-col gap-2">
                                                    <div className="text-xs text-gray-500 text-right">
                                                      Progress: {dossier.progress || 0}%
                                                    </div>
                                                    {dossier.tauxFinal && (
                                                      <div className="text-sm font-medium text-blue-600 text-right">
                                                        {(dossier.tauxFinal * 100).toFixed(2)}%
                                                      </div>
                                                    )}
                                                    
                                                    {/* Actions rapides */}
                                                    <div className="flex flex-col gap-1">
                                                      <div className="flex gap-1">
                                                        <Select 
                                                          value={dossier.statut} 
                                                          onValueChange={(newStatut) => updateDossierStatut(dossier.id, newStatut)}
                                                          disabled={updatingDossier === dossier.id}
                                                        >
                                                          <SelectTrigger className="h-7 text-xs w-[100px]">
                                                            <SelectValue />
                                                          </SelectTrigger>
                                                          <SelectContent>
                                                            <SelectItem value="eligible">Éligible</SelectItem>
                                                            <SelectItem value="pending">En attente</SelectItem>
                                                            <SelectItem value="validated">Validé</SelectItem>
                                                            <SelectItem value="rejected">Rejeté</SelectItem>
                                                          </SelectContent>
                                                        </Select>
                                                        
                                                        {!dossier.Expert && (
                                                          <Button 
                                                            size="sm"
                                                            variant="outline"
                                                            className="h-7 text-xs px-2"
                                                            onClick={() => {
                                                              setSelectedDossierForExpert(dossier);
                                                              setExpertModalOpen(true);
                                                            }}
                                                            title="Assigner un expert"
                                                          >
                                                            <UserCheck className="w-3 h-3" />
                                                          </Button>
                                                        )}
                                                      </div>
                                                      
                                                      <div className="flex gap-1">
                                                        <Button 
                                                          size="sm"
                                                          variant="ghost"
                                                          className="h-7 text-xs flex-1"
                                                          onClick={() => {
                                                            if (dossier.Client?.id) {
                                                              navigate(`/admin/clients/${dossier.Client.id}`);
                                                            }
                                                          }}
                                                        >
                                                          <Eye className="w-3 h-3 mr-1" />
                                                          Voir client
                                                        </Button>
                                                        <Button 
                                                          size="sm"
                                                          variant="ghost"
                                                          className="h-7 text-xs flex-1"
                                                          onClick={() => {
                                                            navigate(`/admin/dossiers/${dossier.id}`);
                                                          }}
                                                        >
                                                          <FileText className="w-3 h-3 mr-1" />
                                                          Voir dossier
                                                        </Button>
                                                      </div>
                                                      
                                                      <Button 
                                                        size="sm"
                                                        variant="ghost"
                                                        className="h-7 text-xs"
                                                        onClick={() => {
                                                          setSelectedDossierForHistoire(dossier);
                                                          setHistoireModalOpen(true);
                                                        }}
                                                      >
                                                        <Clock className="w-3 h-3 mr-1" />
                                                        Historique
                                                      </Button>
                                                    </div>
                                                  </div>
                                                </div>
                                              </div>
                                            ))}
                                            
                                            {filteredTileData.length > 10 && (
                                              <div className="text-center py-2 text-sm text-gray-500">
                                                ... et {filteredTileData.length - 10} autres dossiers
                                              </div>
                                            )}
                                          </div>
                                        </div>
                                      ) : (
                                        <div className="text-center py-8">
                                          <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                                          <p className="text-gray-500">Aucun dossier trouvé</p>
                                        </div>
                                      )}
                                    </div>
                                  )}
                                  
                                  {selectedEcosystemTile === 'produits' && (
                                    <div className="space-y-4">
                                      {loadingTileData ? (
                                        <div className="flex items-center justify-center py-8">
                                          <RefreshCw className="w-6 h-6 animate-spin text-orange-600" />
                                          <span className="ml-2 text-gray-600">Chargement des produits...</span>
                                        </div>
                                      ) : selectedTileData.length > 0 ? (
                                        <div className="space-y-4">
                                          <div className="flex justify-between items-center mb-4">
                                            <div className="flex items-center gap-3">
                                              <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-amber-600 rounded-lg flex items-center justify-center">
                                                <Package className="w-6 h-6 text-white" />
                                              </div>
                                              <div>
                                                <h4 className="text-xl font-bold text-gray-900">
                                                  Catalogue Produits Éligibles
                                                </h4>
                                                <p className="text-sm text-gray-600">
                                                  {selectedTileData.length} produit{selectedTileData.length > 1 ? 's' : ''} dans votre catalogue
                                                </p>
                                              </div>
                                            </div>
                                            <div className="flex gap-2">
                                              <Button 
                                                variant="default" 
                                                size="sm"
                                                className="bg-orange-600 hover:bg-orange-700"
                                                onClick={() => setShowAddProduitModal(true)}
                                              >
                                                <Plus className="w-4 h-4 mr-1" />
                                                Nouveau Produit
                                              </Button>
                                            </div>
                                          </div>
                                          
                                          {/* Tableau des produits */}
                                          <div className="rounded-md border overflow-hidden">
                                            <table className="w-full text-sm">
                                              <thead className="bg-slate-50 border-b border-slate-200">
                                                <tr>
                                                  <th className="px-4 py-3 text-left font-semibold text-slate-900">Nom</th>
                                                  <th className="px-4 py-3 text-left font-semibold text-slate-900">Description</th>
                                                  <th className="px-4 py-3 text-left font-semibold text-slate-900">Catégorie</th>
                                                  <th className="px-4 py-3 text-left font-semibold text-slate-900">Montant</th>
                                                  <th className="px-4 py-3 text-left font-semibold text-slate-900">Taux</th>
                                                  <th className="px-4 py-3 text-left font-semibold text-slate-900">Durée</th>
                                                  <th className="px-4 py-3 text-left font-semibold text-slate-900">Statut</th>
                                                  <th className="px-4 py-3 text-center font-semibold text-slate-900">Actions</th>
                                                </tr>
                                              </thead>
                                              <tbody className="divide-y divide-slate-200">
                                                {selectedTileData.map((produit: ProduitEligible) => (
                                                  <tr 
                                                    key={produit.id} 
                                                    className="hover:bg-orange-50 cursor-pointer transition-colors"
                                                    onClick={() => navigate(`/admin/produits/${produit.id}`)}
                                                  >
                                                    <td className="px-4 py-3 font-medium text-slate-900">{produit.nom}</td>
                                                    <td className="px-4 py-3 max-w-xs truncate text-slate-600">{produit.description}</td>
                                                    <td className="px-4 py-3">
                                                      {produit.categorie ? (
                                                        <Badge variant="outline">{produit.categorie}</Badge>
                                                      ) : 'N/A'}
                                                    </td>
                                                    <td className="px-4 py-3 text-slate-600">
                                                      {produit.montant_min && produit.montant_max 
                                                        ? `${formatCurrency(produit.montant_min)} - ${formatCurrency(produit.montant_max)}`
                                                        : 'N/A'
                                                      }
                                                    </td>
                                                    <td className="px-4 py-3 text-slate-600">
                                                      {produit.taux_min !== null && produit.taux_min !== undefined && produit.taux_max !== null && produit.taux_max !== undefined
                                                        ? `${produit.taux_min.toFixed(1)}% - ${produit.taux_max.toFixed(1)}%`
                                                        : 'N/A'
                                                      }
                                                    </td>
                                                    <td className="px-4 py-3 text-slate-600">
                                                      {produit.duree_min && produit.duree_max 
                                                        ? `${produit.duree_min} - ${produit.duree_max} mois`
                                                        : 'N/A'
                                                      }
                                                    </td>
                                                    <td className="px-4 py-3">
                                                      <Badge 
                                                        variant={produit.active ? 'default' : 'secondary'}
                                                        className={produit.active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}
                                                      >
                                                        {produit.active ? 'Actif' : 'Inactif'}
                                                      </Badge>
                                                    </td>
                                                    <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                                                      <div className="flex items-center justify-center gap-1">
                                                        <Button
                                                          variant="ghost"
                                                          size="sm"
                                                          onClick={() => navigate(`/admin/produits/${produit.id}`)}
                                                          title="Voir la synthèse"
                                                        >
                                                          <Eye className="h-4 w-4" />
                                                        </Button>
                                                        <Button
                                                          variant="ghost"
                                                          size="sm"
                                                          onClick={(e) => {
                                                            e.stopPropagation();
                                                            setSelectedProduit(produit);
                                                            setProduitForm({
                                                              nom: produit.nom,
                                                              description: produit.description,
                                                              categorie: produit.categorie || '',
                                                              secteurs_activite: Array.isArray(produit.secteurs_activite) 
                                                                ? produit.secteurs_activite 
                                                                : (typeof produit.secteurs_activite === 'string' 
                                                                  ? (() => {
                                                                      try {
                                                                        return JSON.parse(produit.secteurs_activite);
                                                                      } catch {
                                                                        return [];
                                                                      }
                                                                    })()
                                                                  : []),
                                                              type_produit: produit.type_produit || 'financier',
                                                              montant_min: produit.montant_min?.toString() || '',
                                                              montant_max: produit.montant_max?.toString() || '',
                                                              taux_min: produit.taux_min?.toString() || '',
                                                              taux_max: produit.taux_max?.toString() || '',
                                                              duree_min: produit.duree_min?.toString() || '',
                                                              duree_max: produit.duree_max?.toString() || '',
                                                              active: produit.active !== false
                                                            });
                                                            setShowEditProduitModal(true);
                                                          }}
                                                          title="Éditer le produit"
                                                        >
                                                          <Edit className="h-4 w-4" />
                                                        </Button>
                                                        <Button
                                                          variant="ghost"
                                                          size="sm"
                                                          onClick={(e) => {
                                                            e.stopPropagation();
                                                            setSelectedProduit(produit);
                                                            setShowDeleteProduitModal(true);
                                                          }}
                                                          title="Supprimer le produit"
                                                        >
                                                          <Trash2 className="h-4 w-4 text-red-600" />
                                                        </Button>
                                                      </div>
                                                    </td>
                                                  </tr>
                                                ))}
                                              </tbody>
                                            </table>
                                          </div>
                                        </div>
                                      ) : (
                                        <div className="text-center py-8">
                                          <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                                          <p className="text-gray-500">Aucun produit trouvé</p>
                                          <Button 
                                            variant="outline" 
                                            className="mt-4"
                                            onClick={() => setShowAddProduitModal(true)}
                                          >
                                            <Plus className="w-4 h-4 mr-2" />
                                            Créer le premier produit
                                          </Button>
                                        </div>
                                      )}
                                    </div>
                                  )}
                                  
                                  {selectedEcosystemTile === 'performance' && (
                                    <div className="space-y-4">
                                      <div className="flex justify-between items-center">
                                        <h4 className="font-semibold text-gray-800">
                                          Aperçu Performance
                                        </h4>
                                        <Button 
                                          variant="outline" 
                                          size="sm"
                                          onClick={() => setActiveSection('performance')}
                                        >
                                          Voir détails complets
                                        </Button>
                                      </div>
                                      
                                      {/* Mini graphiques */}
                                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <Card>
                                          <CardHeader className="pb-2">
                                            <CardTitle className="text-sm flex items-center gap-2">
                                              <TrendingUp className="w-4 h-4 text-green-600" />
                                              Revenus
                                            </CardTitle>
                                          </CardHeader>
                                          <CardContent>
                                            <div className="space-y-2">
                                              <div className="flex justify-between">
                                                <span className="text-xs text-gray-600">Ce mois</span>
                                                <span className="text-sm font-bold text-green-600">
                                                  {kpiData.montantRealise.toLocaleString('fr-FR')}€
                                                </span>
                                              </div>
                                              <div className="flex justify-between">
                                                <span className="text-xs text-gray-600">Croissance</span>
                                                <span className={`text-sm font-bold ${kpiData.croissanceRevenus >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                  {kpiData.croissanceRevenus >= 0 ? '+' : ''}{kpiData.croissanceRevenus}%
                                                </span>
                                              </div>
                                            </div>
                                          </CardContent>
                                        </Card>

                                        <Card>
                                          <CardHeader className="pb-2">
                                            <CardTitle className="text-sm flex items-center gap-2">
                                              <FileText className="w-4 h-4 text-blue-600" />
                                              Dossiers
                                            </CardTitle>
                                          </CardHeader>
                                          <CardContent>
                                            <div className="space-y-2">
                                              <div className="flex justify-between">
                                                <span className="text-xs text-gray-600">Ce mois</span>
                                                <span className="text-sm font-bold text-blue-600">
                                                  {kpiData.dossiersThisMonth}
                                                </span>
                                              </div>
                                              <div className="flex justify-between">
                                                <span className="text-xs text-gray-600">Objectif</span>
                                                <span className="text-sm font-bold text-gray-600">
                                                  {Math.round(kpiData.objectifDossiersMonth)}
                                                </span>
                                              </div>
                                            </div>
                                          </CardContent>
                                        </Card>
                                      </div>
                                    </div>
                                  )}
                                </CardContent>
                              </Card>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </div>

                    {/* Centre de notifications */}
                    <UniversalNotificationCenter mode="compact" />
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

                {activeSection === 'apporteurs' && (
                  <div className="space-y-6">
                    {/* En-tête avec actions avancées */}
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="text-2xl font-bold text-slate-900">Gestion des Apporteurs d'Affaires</h2>
                        <p className="text-slate-600">Performance, pipeline et paiements</p>
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={resetDashboard}
                        >
                          ← Retour au dashboard
                        </Button>
                        <Button variant="outline" size="sm">
                          <RefreshCw className="w-4 h-4 mr-2" />
                          Actualiser
                        </Button>
                        <Button variant="outline" size="sm">
                          <Download className="w-4 h-4 mr-2" />
                          Exporter
                        </Button>
                        <Button variant="outline" size="sm">
                          <Mail className="w-4 h-4 mr-2" />
                          Newsletter
                        </Button>
                      </div>
                    </div>

                    {/* Métriques de performance */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <Card>
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-medium text-gray-600">Apporteurs Actifs</p>
                              <p className="text-2xl font-bold text-gray-900">{kpiData.apporteursActifs}</p>
                              <p className="text-sm text-gray-500">sur {kpiData.apporteursTotal} total</p>
                            </div>
                            <TrendingUp className="w-8 h-8 text-green-600" />
                          </div>
                        </CardContent>
                      </Card>
                      
                      <Card>
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-medium text-gray-600">Taux de Conversion</p>
                              <p className="text-2xl font-bold text-gray-900">68%</p>
                              <p className="text-sm text-gray-500">prospects → dossiers</p>
                            </div>
                            <Target className="w-8 h-8 text-blue-600" />
                          </div>
                        </CardContent>
                      </Card>
                      
                      <Card>
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-medium text-gray-600">Commissions Totales</p>
                              <p className="text-2xl font-bold text-gray-900">45.2k€</p>
                              <p className="text-sm text-gray-500">ce mois</p>
                            </div>
                            <DollarSign className="w-8 h-8 text-green-600" />
                          </div>
                        </CardContent>
                      </Card>
                      
                      <Card>
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-medium text-gray-600">Pipeline Actif</p>
                              <p className="text-2xl font-bold text-gray-900">127</p>
                              <p className="text-sm text-gray-500">prospects en cours</p>
                            </div>
                            <Users className="w-8 h-8 text-purple-600" />
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    {/* Composant ApporteurManagement existant */}
                    <ApporteurManagement />
                  </div>
                )}

                {activeSection === 'performance' && (
                  <div className="space-y-6">
                    {/* En-tête Performance */}
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="text-2xl font-bold text-slate-900">Performance & Revenus</h2>
                        <p className="text-slate-600">Analyses financières et métriques de conversion</p>
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={resetDashboard}
                        >
                          ← Retour au dashboard
                        </Button>
                        <Button variant="outline" size="sm">
                          <Download className="w-4 h-4 mr-2" />
                          Exporter Rapport
                        </Button>
                      </div>
                    </div>

                    {/* KPI Performance */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      {/* Performance Globale */}
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <TrendingUp className="w-5 h-5 text-indigo-600" />
                            Performance Globale
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-4">
                            <div className="flex justify-between">
                              <span className="text-sm text-gray-600">Taux de conversion</span>
                              <span className="font-semibold text-green-600">{kpiData.tauxConversion}%</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm text-gray-600">En retard</span>
                              <span className="font-semibold text-red-600">{kpiData.dossiersEnRetard}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm text-gray-600">Ce mois</span>
                              <span className="font-semibold text-purple-600">{kpiData.clientsThisMonth}</span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      {/* Revenus */}
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <DollarSign className="w-5 h-5 text-green-600" />
                            Revenus
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-4">
                            <div className="flex justify-between">
                              <span className="text-sm text-gray-600">Ce mois</span>
                              <span className="font-semibold text-green-600">{kpiData.montantRealise.toLocaleString('fr-FR')}€</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm text-gray-600">Potentiel</span>
                              <span className="font-semibold text-blue-600">{kpiData.montantPotentiel.toLocaleString('fr-FR')}€</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm text-gray-600">Croissance</span>
                              <span className={`font-semibold ${kpiData.croissanceRevenus >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {kpiData.croissanceRevenus >= 0 ? '+' : ''}{kpiData.croissanceRevenus}%
                              </span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      {/* Objectifs */}
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <Target className="w-5 h-5 text-blue-600" />
                            Objectifs du Mois
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-4">
                            <div>
                              <div className="flex justify-between mb-2">
                                <span className="text-sm text-gray-600">Dossiers ce mois</span>
                                <span className="font-semibold text-blue-600">
                                  {kpiData.dossiersThisMonth}/{Math.round(kpiData.objectifDossiersMonth)}
                                </span>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-2">
                                <div 
                                  className={`h-2 rounded-full ${
                                    kpiData.dossiersThisMonth >= kpiData.objectifDossiersMonth 
                                      ? 'bg-green-600' 
                                      : kpiData.dossiersThisMonth >= kpiData.objectifDossiersMonth * 0.7
                                      ? 'bg-blue-600'
                                      : 'bg-yellow-600'
                                  }`}
                                  style={{ width: `${Math.min((kpiData.dossiersThisMonth / Math.max(kpiData.objectifDossiersMonth, 1)) * 100, 100)}%` }}
                                ></div>
                              </div>
                              <p className="text-xs text-gray-500 mt-1">
                                {kpiData.dossiersThisMonth >= kpiData.objectifDossiersMonth 
                                  ? '🎉 Objectif atteint !' 
                                  : `Reste ${Math.round(kpiData.objectifDossiersMonth - kpiData.dossiersThisMonth)} dossiers`}
                              </p>
                            </div>
                            <div>
                              <div className="flex justify-between mb-2">
                                <span className="text-sm text-gray-600">Revenus ce mois</span>
                                <span className="font-semibold text-green-600">
                                  {Math.round((kpiData.montantRealise / Math.max(kpiData.objectifRevenusMonth, 1)) * 100)}%
                                </span>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-2">
                                <div 
                                  className={`h-2 rounded-full ${
                                    kpiData.montantRealise >= kpiData.objectifRevenusMonth 
                                      ? 'bg-green-600' 
                                      : kpiData.montantRealise >= kpiData.objectifRevenusMonth * 0.7
                                      ? 'bg-blue-600'
                                      : 'bg-yellow-600'
                                  }`}
                                  style={{ width: `${Math.min((kpiData.montantRealise / Math.max(kpiData.objectifRevenusMonth, 1)) * 100, 100)}%` }}
                                ></div>
                              </div>
                              <p className="text-xs text-gray-500 mt-1">
                                Objectif: {kpiData.objectifRevenusMonth.toLocaleString('fr-FR')}€
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    {/* Top 5 Clients */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Users className="w-5 h-5 text-green-600" />
                          Top 5 Clients
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        {(() => {
                          // Calculer les top clients basés sur les dossiers
                          const clientStats = new Map<string, {
                            company_name: string;
                            email: string;
                            nombre_dossiers: number;
                            montant_total: number;
                            montant_moyen: number;
                            premier_dossier_id?: string; // ID du premier dossier pour navigation
                          }>();

                          sectionData.dossiers.forEach((dossier: any) => {
                            if (!dossier.Client) return;
                            
                            const clientId = dossier.Client.id;
                            const email = dossier.Client.email || 'N/A';
                            const companyName = dossier.Client.company_name || 
                                              `${dossier.Client.first_name || ''} ${dossier.Client.last_name || ''}`.trim() || 
                                              'N/A';
                            
                            if (!clientStats.has(clientId)) {
                              clientStats.set(clientId, {
                                company_name: companyName,
                                email: email,
                                nombre_dossiers: 0,
                                montant_total: 0,
                                montant_moyen: 0,
                                premier_dossier_id: dossier.id
                              });
                            }
                            
                            const stats = clientStats.get(clientId)!;
                            stats.nombre_dossiers += 1;
                            stats.montant_total += dossier.montantFinal || 0;
                            if (!stats.premier_dossier_id) {
                              stats.premier_dossier_id = dossier.id;
                            }
                          });

                          // Calculer les montants moyens et trier
                          const topClients = Array.from(clientStats.values())
                            .map(client => ({
                              ...client,
                              montant_moyen: client.nombre_dossiers > 0 
                                ? client.montant_total / client.nombre_dossiers 
                                : 0
                            }))
                            .sort((a, b) => b.montant_total - a.montant_total)
                            .slice(0, 5);

                          return topClients.length > 0 ? (
                            <div className="space-y-2">
                              {topClients.map((client) => (
                                <div
                                  key={client.email}
                                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                                  onClick={() => {
                                    if (client.premier_dossier_id) {
                                      navigate(`/admin/dossiers/${client.premier_dossier_id}`);
                                    }
                                  }}
                                >
                                  <div className="flex-1">
                                    <p className="font-medium text-gray-900">{client.company_name}</p>
                                    <p className="text-sm text-gray-500">{client.email}</p>
                                  </div>
                                  <div className="flex items-center gap-6 text-sm">
                                    <div className="text-right">
                                      <p className="text-gray-500">Dossiers</p>
                                      <p className="font-bold text-blue-600">{client.nombre_dossiers}</p>
                                    </div>
                                    <div className="text-right">
                                      <p className="text-gray-500">Montant total</p>
                                      <p className="font-bold text-green-600">{formatCurrency(client.montant_total)}</p>
                                    </div>
                                    <div className="text-right">
                                      <p className="text-gray-500">Montant moyen</p>
                                      <p className="font-bold text-purple-600">{formatCurrency(client.montant_moyen)}</p>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="text-center py-8 text-gray-500">
                              <Users className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                              <p>Aucun client avec dossiers</p>
                            </div>
                          );
                        })()}
                      </CardContent>
                    </Card>

                    {/* Graphiques et analyses détaillées */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <TrendingUp className="w-5 h-5 text-emerald-600" />
                          Graphiques de Performance
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <PerformanceCharts 
                          kpiData={kpiData} 
                          dossiers={sectionData.dossiers}
                        />
                      </CardContent>
                    </Card>
                  </div>
                )}

                {activeSection === 'validations' && (
                  <div className="space-y-6">
                    {/* En-tête avec statistiques */}
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="text-2xl font-bold text-slate-900">CENTRE DE VALIDATION</h2>
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={resetDashboard}
                        >
                          ← Retour au dashboard
                        </Button>
                        <Badge variant="destructive" className="px-3 py-1">
                          <Bell className="w-3 h-3 mr-1" />
                          {kpiData.validationsPending} en attente
                        </Badge>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => window.location.reload()}
                        >
                          <RefreshCw className="w-4 h-4 mr-2" />
                          Actualiser
                        </Button>
                      </div>
                    </div>

                    {/* Filtres avancés */}
                    <Card>
                      <CardContent className="p-4">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                          <Select>
                            <SelectTrigger>
                              <SelectValue placeholder="Produit" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">Tous les produits</SelectItem>
                              <SelectItem value="ticpe">TICPE</SelectItem>
                              <SelectItem value="urssaf">URSSAF</SelectItem>
                              <SelectItem value="dfs">DFS</SelectItem>
                              <SelectItem value="foncier">Foncier</SelectItem>
                              <SelectItem value="cir">CIR/CII/JEI</SelectItem>
                            </SelectContent>
                          </Select>
                          
                          <Select>
                            <SelectTrigger>
                              <SelectValue placeholder="Montant" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">Tous montants</SelectItem>
                              <SelectItem value="15k">≥ 15k€</SelectItem>
                              <SelectItem value="50k">≥ 50k€</SelectItem>
                              <SelectItem value="150k">≥ 150k€</SelectItem>
                            </SelectContent>
                          </Select>
                          
                          <Select>
                            <SelectTrigger>
                              <SelectValue placeholder="Délai" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">Tous délais</SelectItem>
                              <SelectItem value="urgent">Urgent &lt; 7j</SelectItem>
                              <SelectItem value="normal">Normal &lt; 21j</SelectItem>
                              <SelectItem value="retard">En retard &gt; 21j</SelectItem>
                            </SelectContent>
                          </Select>
                          
                          <Select>
                            <SelectTrigger>
                              <SelectValue placeholder="Apporteur" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">Tous apporteurs</SelectItem>
                              <SelectItem value="performance">Performance</SelectItem>
                              <SelectItem value="zone">Zone géographique</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Experts à valider */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Users className="w-5 h-5" />
                          Experts en attente de validation ({kpiData.validationsExperts})
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          {sectionData.experts?.filter(e => e.approval_status === 'pending').length > 0 ? (
                            sectionData.experts
                              .filter(e => e.approval_status === 'pending')
                              .slice(0, 3)
                              .map((expert: any) => (
                                <div key={expert.id} className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                                  <div className="flex items-center justify-between">
                                    <div>
                                      <h4 className="font-semibold text-yellow-800">{expert.name}</h4>
                                      <p className="text-sm text-yellow-700">{expert.company_name}</p>
                                      <div className="flex gap-2 mt-2">
                                        {expert.specializations?.slice(0, 2).map((spec: string, idx: number) => (
                                          <Badge key={idx} variant="secondary">{spec}</Badge>
                                        ))}
                                      </div>
                                    </div>
                                    <div className="flex gap-2">
                                      <Button size="sm" variant="default" onClick={() => navigate(`/admin/experts/${expert.id}`)}>
                                        <Eye className="w-4 h-4 mr-1" />
                                        Voir synthèse
                                      </Button>
                                    </div>
                                  </div>
                                </div>
                              ))
                          ) : (
                            <div className="text-center py-8 text-gray-500">
                              <UserCheck className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                              <p>Aucun expert en attente</p>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>

                    {/* Pré-éligibilités à valider */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <FileText className="w-5 h-5" />
                          Pré-éligibilités à valider ({kpiData.validationsDocuments})
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          {sectionData.dossiers?.filter(d => 
                            d.statut === 'documents_uploaded' || d.statut === 'eligible_confirmed'
                          ).length > 0 ? (
                            <>
                              {sectionData.dossiers
                                .filter(d => d.statut === 'documents_uploaded' || d.statut === 'eligible_confirmed')
                                .slice(0, 3)
                                .map((dossier: ClientProduitEligible) => (
                                  <div key={dossier.id} className="bg-red-50 border border-red-300 rounded-lg p-4">
                                    <div className="flex items-start justify-between gap-4">
                                      <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                          <Badge variant="destructive">À VALIDER</Badge>
                                          <h4 className="font-semibold text-gray-900">
                                            {dossier.Client?.company_name || 
                                             `${dossier.Client?.first_name || ''} ${dossier.Client?.last_name || ''}`.trim() || 
                                             'Client inconnu'}
                                          </h4>
                                        </div>
                                        <p className="text-sm text-gray-700 mb-2">
                                          📦 {dossier.ProduitEligible?.nom || 'Produit inconnu'}
                                        </p>
                                        <div className="flex flex-wrap gap-2 text-xs text-gray-600 mb-2">
                                          {dossier.montantFinal && (
                                            <span className="flex items-center gap-1">
                                              <DollarSign className="w-3 h-3" />
                                              {formatCurrency(dossier.montantFinal)}
                                            </span>
                                          )}
                                          <span className="flex items-center gap-1">
                                            <Calendar className="w-3 h-3" />
                                            Soumis le {new Date(dossier.updated_at || dossier.created_at).toLocaleDateString('fr-FR')}
                                          </span>
                                        </div>
                                        <p className="text-xs text-gray-500">
                                          📎 {(dossier as any).documents_count || 0} document(s) uploadé(s)
                                        </p>
                                      </div>
                                      <div className="flex flex-col gap-2">
                                        <Button 
                                          size="sm" 
                                          variant="outline"
                                          onClick={() => navigate(`/admin/dossiers/${dossier.id}`)}
                                        >
                                          <Eye className="w-4 h-4 mr-1" />
                                          Consulter le dossier
                                        </Button>
                                        <Button 
                                          size="sm" 
                                          variant="outline"
                                          onClick={() => {
                                            setSelectedDossierForDocuments(dossier);
                                            setDocumentsModalOpen(true);
                                          }}
                                        >
                                          <Eye className="w-4 h-4 mr-1" />
                                          Voir documents
                                        </Button>
                                        <Button 
                                          size="sm" 
                                          variant="default"
                                          className="bg-green-600 hover:bg-green-700"
                                          disabled={(dossier as any).documents_count === 0 || (dossier as any).validated_documents_count === 0}
                                          onClick={() => handleValidateEligibility(dossier.id, dossier.ProduitEligible?.nom || 'Dossier')}
                                        >
                                          <CheckCircle className="w-4 h-4 mr-1" />
                                          Valider
                                        </Button>
                                        <Button 
                                          size="sm" 
                                          variant="destructive"
                                          onClick={() => handleRejectEligibility(dossier.id, dossier.ProduitEligible?.nom || 'Dossier')}
                                        >
                                          <XCircle className="w-4 h-4 mr-1" />
                                          Rejeter
                                        </Button>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              {sectionData.dossiers.filter(d => d.statut === 'documents_uploaded' || d.statut === 'eligible_confirmed').length > 3 && (
                                <div className="text-center pt-2">
                                  <Button 
                                    variant="link" 
                                    onClick={() => setActiveSection('dossiers')}
                                  >
                                    Voir tous les {sectionData.dossiers.filter(d => d.statut === 'documents_uploaded' || d.statut === 'eligible_confirmed').length} dossiers →
                                  </Button>
                                </div>
                              )}
                            </>
                          ) : (
                            <div className="text-center py-8 text-gray-500">
                              <FileText className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                              <p>Aucune pré-éligibilité à valider</p>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>

                    {/* Utilisateurs à valider */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Users className="w-5 h-5" />
                          Utilisateurs à valider ({
                            (sectionData.clients?.filter(c => c.statut === 'pending' || c.statut === 'en_attente').length || 0)
                          })
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          {sectionData.clients?.filter(c => c.statut === 'pending' || c.statut === 'en_attente').length > 0 ? (
                            <>
                              {sectionData.clients
                                .filter(c => c.statut === 'pending' || c.statut === 'en_attente')
                                .slice(0, 3)
                                .map((client: any) => (
                                  <div key={client.id} className="bg-blue-50 border border-blue-300 rounded-lg p-4">
                                    <div className="flex items-start justify-between gap-4">
                                      <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                          <Badge variant="secondary">EN ATTENTE</Badge>
                                          <h4 className="font-semibold text-gray-900">
                                            {client.company_name || 
                                             `${client.first_name || ''} ${client.last_name || ''}`.trim() || 
                                             'Utilisateur inconnu'}
                                          </h4>
                                        </div>
                                        <p className="text-sm text-gray-700 mb-2">
                                          👤 {client.type || 'Client'} - {client.email}
                                        </p>
                                        <p className="text-xs text-gray-500">
                                          📅 Inscrit le {new Date(client.created_at).toLocaleDateString('fr-FR')}
                                        </p>
                                      </div>
                                      <div className="flex flex-col gap-2">
                                        <Button 
                                          size="sm" 
                                          variant="outline"
                                          onClick={() => navigate(`/admin/client-details/${client.id}`)}
                                        >
                                          <Eye className="w-4 h-4 mr-1" />
                                          Voir profil
                                        </Button>
                                        <Button 
                                          size="sm" 
                                          variant="default"
                                          className="bg-green-600 hover:bg-green-700"
                                          onClick={async () => {
                                            try {
                                              await fetch(`${config.API_URL}/api/admin/clients/${client.id}/approve`, {
                                                method: 'PUT',
                                                headers: {
                                                  'Authorization': `Bearer ${await getSupabaseToken()}`,
                                                  'Content-Type': 'application/json'
                                                }
                                              });
                                              toast.success('Utilisateur validé');
                                              loadSectionData('clients');
                                            } catch (error) {
                                              toast.error('Erreur lors de la validation');
                                            }
                                          }}
                                        >
                                          <CheckCircle className="w-4 h-4 mr-1" />
                                          Valider
                                        </Button>
                                        <Button 
                                          size="sm" 
                                          variant="destructive"
                                          onClick={async () => {
                                            const reason = window.prompt('Raison du refus :');
                                            if (!reason) return;
                                            try {
                                              await fetch(`${config.API_URL}/api/admin/clients/${client.id}/reject`, {
                                                method: 'PUT',
                                                headers: {
                                                  'Authorization': `Bearer ${await getSupabaseToken()}`,
                                                  'Content-Type': 'application/json'
                                                },
                                                body: JSON.stringify({ reason })
                                              });
                                              toast.success('Utilisateur rejeté');
                                              loadSectionData('clients');
                                            } catch (error) {
                                              toast.error('Erreur lors du rejet');
                                            }
                                          }}
                                        >
                                          <XCircle className="w-4 h-4 mr-1" />
                                          Rejeter
                                        </Button>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              {sectionData.clients.filter(c => c.statut === 'pending' || c.statut === 'en_attente').length > 3 && (
                                <div className="text-center pt-2">
                                  <Button 
                                    variant="link" 
                                    onClick={() => setActiveSection('clients')}
                                  >
                                    Voir tous les {sectionData.clients.filter(c => c.statut === 'pending' || c.statut === 'en_attente').length} utilisateurs →
                                  </Button>
                                </div>
                              )}
                            </>
                          ) : (
                            <div className="text-center py-8 text-gray-500">
                              <UserCheck className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                              <p>Aucun utilisateur en attente</p>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>

                    {/* Historique des validations */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Clock className="w-5 h-5" />
                          Historique des validations
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {(() => {
                            // Filtrer les dossiers validés ou rejetés
                            const historiqueValidations = sectionData.dossiers
                              ?.filter((d: any) => 
                                d.admin_eligibility_status === 'validated' || 
                                d.admin_eligibility_status === 'rejected' ||
                                d.eligibility_validated_at ||
                                (d.statut === 'admin_validated' || d.statut === 'admin_rejected')
                              )
                              .sort((a: any, b: any) => {
                                const dateA = a.eligibility_validated_at || a.updated_at || a.created_at;
                                const dateB = b.eligibility_validated_at || b.updated_at || b.created_at;
                                return new Date(dateB).getTime() - new Date(dateA).getTime();
                              })
                              .slice(0, 10) || [];

                            if (historiqueValidations.length === 0) {
                              return (
                                <div className="text-center py-8 text-gray-500">
                                  <Clock className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                                  <p>Aucune validation dans l'historique</p>
                                </div>
                              );
                            }

                            return historiqueValidations.map((dossier: any) => {
                              const isValide = dossier.admin_eligibility_status === 'validated' || dossier.statut === 'admin_validated';
                              const dateValidation = dossier.eligibility_validated_at || dossier.updated_at || dossier.created_at;
                              const timeAgo = getTimeAgo(new Date(dateValidation));
                              const produitNom = dossier.ProduitEligible?.nom || 'Produit inconnu';
                              const clientNom = dossier.Client?.company_name || 
                                `${dossier.Client?.first_name || ''} ${dossier.Client?.last_name || ''}`.trim() || 
                                'Client inconnu';

                              return (
                                <div 
                                  key={dossier.id}
                                  className={`flex items-center justify-between p-3 rounded ${
                                    isValide 
                                      ? 'bg-green-50 border border-green-200' 
                                      : 'bg-red-50 border border-red-200'
                                  }`}
                                >
                                  <div className="flex items-center gap-3">
                                    {isValide ? (
                                      <Check className="w-4 h-4 text-green-600" />
                                    ) : (
                                      <X className="w-4 h-4 text-red-600" />
                                    )}
                                    <div>
                                      <p className={`font-medium ${isValide ? 'text-green-800' : 'text-red-800'}`}>
                                        {produitNom} - {clientNom}
                                      </p>
                                      <p className={`text-sm ${isValide ? 'text-green-600' : 'text-red-600'}`}>
                                        Par Admin - {timeAgo}
                                      </p>
                                    </div>
                                  </div>
                                  <Badge variant={isValide ? "default" : "destructive"}>
                                    {isValide ? 'Validé' : 'Rejeté'}
                                  </Badge>
                                </div>
                              );
                            });
                          })()}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      
      {/* Footer en bas de page */}
      <AdminFooter />
      
      {/* Modal Historique & Commentaires */}
      {histoireModalOpen && selectedDossierForHistoire && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={() => {
            setHistoireModalOpen(false);
            setSelectedDossierForHistoire(null);
            setNewComment('');
            setIsPrivateComment(false);
          }}
        >
          <div 
            className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="p-6 border-b flex-shrink-0">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-semibold mb-1">Historique & Commentaires</h3>
                  <p className="text-sm text-gray-600">
                    <strong>Client:</strong> {selectedDossierForHistoire.Client?.company_name || `${selectedDossierForHistoire.Client?.first_name || ''} ${selectedDossierForHistoire.Client?.last_name || ''}`.trim() || 'N/A'}
                  </p>
                  <p className="text-sm text-gray-600">
                    <strong>Produit:</strong> {selectedDossierForHistoire.ProduitEligible?.nom || 'N/A'}
                  </p>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => {
                    setHistoireModalOpen(false);
                    setSelectedDossierForHistoire(null);
                  }}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Contenu scrollable */}
            <div className="flex-1 overflow-y-auto p-6">
              {loadingHistoire ? (
                <div className="flex items-center justify-center py-12">
                  <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
                  <span className="ml-2 text-gray-600">Chargement...</span>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Timeline Historique */}
                  <div>
                    <h4 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                      <Clock className="w-5 h-5 text-blue-600" />
                      Historique des modifications ({historique.length})
                    </h4>
                    
                    {historique.length > 0 ? (
                      <div className="space-y-3">
                        {historique.map((entry: any, index: number) => (
                          <div key={entry.id} className="relative pl-6 pb-4">
                            {/* Ligne verticale */}
                            {index < historique.length - 1 && (
                              <div className="absolute left-2 top-6 bottom-0 w-0.5 bg-gray-200"></div>
                            )}
                            
                            {/* Point */}
                            <div className={`absolute left-0 top-1 w-4 h-4 rounded-full border-2 ${
                              entry.action_type === 'statut_change' ? 'bg-blue-500 border-blue-200' :
                              entry.action_type === 'expert_assigned' ? 'bg-green-500 border-green-200' :
                              entry.action_type === 'comment_added' ? 'bg-purple-500 border-purple-200' :
                              'bg-gray-500 border-gray-200'
                            }`}></div>
                            
                            {/* Contenu */}
                            <div className="bg-gray-50 rounded-lg p-3">
                              <div className="flex items-start justify-between mb-1">
                                <p className="text-sm font-medium text-gray-800">
                                  {entry.description || entry.action_type}
                                </p>
                                <span className="text-xs text-gray-500">
                                  {new Date(entry.created_at).toLocaleString('fr-FR', {
                                    day: '2-digit',
                                    month: 'short',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}
                                </span>
                              </div>
                              <p className="text-xs text-gray-600">
                                Par <strong>{entry.user_name}</strong> ({entry.user_type})
                              </p>
                              {entry.old_value && entry.new_value && (
                                <p className="text-xs text-gray-500 mt-1">
                                  {entry.old_value} → {entry.new_value}
                                </p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <Clock className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                        <p>Aucun historique</p>
                      </div>
                    )}
                  </div>

                  {/* Section Commentaires */}
                  <div>
                    <h4 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                      <Mail className="w-5 h-5 text-purple-600" />
                      Commentaires & Notes ({commentaires.length})
                    </h4>
                    
                    {/* Zone de saisie */}
                    <div className="mb-4 space-y-2">
                      <textarea
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        placeholder="Ajouter un commentaire..."
                        className="w-full p-3 border rounded-lg text-sm resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        rows={3}
                      />
                      <div className="flex items-center justify-between">
                        <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={isPrivateComment}
                            onChange={(e) => setIsPrivateComment(e.target.checked)}
                            className="rounded"
                          />
                          <Lock className="w-3 h-3" />
                          Privé (admin uniquement)
                        </label>
                        <Button 
                          size="sm"
                          onClick={addCommentaire}
                          disabled={!newComment.trim()}
                        >
                          <Mail className="w-3 h-3 mr-1" />
                          Envoyer
                        </Button>
                      </div>
                    </div>

                    {/* Liste commentaires */}
                    {commentaires.length > 0 ? (
                      <div className="space-y-3 max-h-96 overflow-y-auto">
                        {commentaires.map((comment: any) => (
                          <div key={comment.id} className={`p-3 rounded-lg border ${
                            comment.is_private ? 'bg-yellow-50 border-yellow-200' : 'bg-white border-gray-200'
                          }`}>
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold">
                                  {comment.author_name?.charAt(0)?.toUpperCase() || 'U'}
                                </div>
                                <div>
                                  <p className="text-sm font-medium text-gray-800">
                                    {comment.author_name}
                                  </p>
                                  <div className="flex items-center gap-2">
                                    <Badge variant="outline" className="text-xs">
                                      {comment.author_type}
                                    </Badge>
                                    {comment.is_private && (
                                      <Badge variant="secondary" className="text-xs">
                                        <Lock className="w-2 h-2 mr-1" />
                                        Privé
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-gray-500">
                                  {new Date(comment.created_at).toLocaleString('fr-FR', {
                                    day: '2-digit',
                                    month: 'short',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}
                                </span>
                                <Button 
                                  size="sm"
                                  variant="ghost"
                                  className="h-6 px-2"
                                  onClick={() => deleteCommentaire(comment.id)}
                                >
                                  <Trash2 className="w-3 h-3 text-red-500" />
                                </Button>
                              </div>
                            </div>
                            <p className="text-sm text-gray-700 whitespace-pre-wrap">
                              {comment.content}
                            </p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <Mail className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                        <p>Aucun commentaire</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t flex-shrink-0">
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => {
                  setHistoireModalOpen(false);
                  setSelectedDossierForHistoire(null);
                }}
              >
                Fermer
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Prévisualisation Documents Pré-éligibilité */}
      <Dialog open={documentsModalOpen} onOpenChange={setDocumentsModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl">
              Documents Pré-éligibilité - {selectedDossierForDocuments?.ProduitEligible?.nom || 'Produit'}
            </DialogTitle>
            <div className="space-y-1 text-sm text-gray-600 mt-2">
              <p><strong>Client:</strong> {selectedDossierForDocuments?.Client?.company_name || 
                `${selectedDossierForDocuments?.Client?.first_name || ''} ${selectedDossierForDocuments?.Client?.last_name || ''}`.trim() || 
                'Client inconnu'}</p>
              <p><strong>Produit:</strong> {selectedDossierForDocuments?.ProduitEligible?.nom || 'N/A'}</p>
              <p><strong>Montant estimé:</strong> {selectedDossierForDocuments?.montantFinal ? formatCurrency(selectedDossierForDocuments.montantFinal) : 'N/A'}</p>
              <p><strong>Date de soumission:</strong> {selectedDossierForDocuments?.updated_at ? new Date(selectedDossierForDocuments.updated_at).toLocaleDateString('fr-FR') : 'N/A'}</p>
            </div>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Liste des documents */}
            <div>
              <h3 className="font-semibold text-lg mb-4">Documents uploadés ({selectedDossierForDocuments?.documents_sent?.length || 0})</h3>
              
              {selectedDossierForDocuments?.documents_sent && selectedDossierForDocuments.documents_sent.length > 0 ? (
                <div className="space-y-3">
                  {selectedDossierForDocuments.documents_sent.map((doc: string, index: number) => {
                    const fileName = doc.split('/').pop() || doc;
                    const fileExtension = fileName.split('.').pop()?.toLowerCase();
                    const isPdf = fileExtension === 'pdf';
                    const isImage = ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(fileExtension || '');
                    
                    return (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-blue-100 rounded flex items-center justify-center">
                            <FileText className="w-5 h-5 text-blue-600" />
                          </div>
                          <div>
                            <p className="font-medium text-sm">{fileName}</p>
                            <p className="text-xs text-gray-500">Document {index + 1}</p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          {(isPdf || isImage) && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setPreviewDocument(doc)}
                            >
                              <Eye className="w-4 h-4 mr-1" />
                              Prévisualiser
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              window.open(doc, '_blank');
                            }}
                          >
                            <Download className="w-4 h-4 mr-1" />
                            Télécharger
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <FileText className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                  <p>Aucun document uploadé</p>
                </div>
              )}
            </div>

            {/* Prévisualisation du document */}
            {previewDocument && (
              <div className="border rounded-lg p-4 bg-gray-50">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-semibold">Prévisualisation</h4>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setPreviewDocument(null)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
                <div className="bg-white rounded border">
                  {previewDocument.toLowerCase().endsWith('.pdf') ? (
                    <iframe
                      src={previewDocument}
                      className="w-full h-96 rounded"
                      title="Prévisualisation PDF"
                    />
                  ) : (
                    <img
                      src={previewDocument}
                      alt="Prévisualisation"
                      className="w-full h-auto rounded"
                    />
                  )}
                </div>
              </div>
            )}

            {/* Notes admin (optionnel) */}
            <div>
              <Label htmlFor="validation-notes" className="text-sm font-semibold mb-2 block">
                Notes administrateur (optionnel)
              </Label>
              <Textarea
                id="validation-notes"
                placeholder="Ajoutez des notes concernant cette validation..."
                value={validationNotes}
                onChange={(e) => setValidationNotes(e.target.value)}
                rows={3}
                className="w-full"
              />
            </div>
          </div>

          <DialogFooter className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setDocumentsModalOpen(false);
                setSelectedDossierForDocuments(null);
                setPreviewDocument(null);
                setValidationNotes('');
              }}
            >
              Fermer
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (selectedDossierForDocuments) {
                  handleRejectEligibility(
                    selectedDossierForDocuments.id,
                    selectedDossierForDocuments.ProduitEligible?.nom || 'Dossier'
                  );
                  setDocumentsModalOpen(false);
                  setSelectedDossierForDocuments(null);
                  setPreviewDocument(null);
                  setValidationNotes('');
                }
              }}
            >
              <XCircle className="w-4 h-4 mr-2" />
              Rejeter le dossier
            </Button>
            <Button
              variant="default"
              className="bg-green-600 hover:bg-green-700"
              onClick={() => {
                if (selectedDossierForDocuments) {
                  handleValidateEligibility(
                    selectedDossierForDocuments.id,
                    selectedDossierForDocuments.ProduitEligible?.nom || 'Dossier'
                  );
                  setDocumentsModalOpen(false);
                  setSelectedDossierForDocuments(null);
                  setPreviewDocument(null);
                  setValidationNotes('');
                }
              }}
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Valider l'éligibilité
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Ajout Produit */}
      <Dialog open={showAddProduitModal} onOpenChange={setShowAddProduitModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Ajouter un nouveau produit</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="add-nom">Nom du produit *</Label>
                <Input
                  id="add-nom"
                  value={produitForm.nom}
                  onChange={(e) => setProduitForm(prev => ({ ...prev, nom: e.target.value }))}
                  placeholder="Ex: TICPE, URSSAF..."
                />
              </div>
              <div>
                <Label htmlFor="add-type">Type de produit</Label>
                <Select value={produitForm.type_produit} onValueChange={(val) => setProduitForm(prev => ({ ...prev, type_produit: val }))}>
                  <SelectTrigger id="add-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="financier">Financier</SelectItem>
                    <SelectItem value="qualitatif">Qualitatif</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label htmlFor="add-description">Description *</Label>
              <Textarea
                id="add-description"
                value={produitForm.description}
                onChange={(e) => setProduitForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Description détaillée du produit"
                rows={3}
              />
            </div>
            <div>
              <Label htmlFor="add-categorie">Catégorie *</Label>
              <Select 
                value={produitForm.categorie} 
                onValueChange={(val) => setProduitForm(prev => ({ ...prev, categorie: val }))}
              >
                <SelectTrigger id="add-categorie">
                  <SelectValue placeholder="Sélectionner une catégorie" />
                </SelectTrigger>
                <SelectContent>
                  {categoriesOptions.map((cat) => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="add-secteurs">Secteurs d'activité</Label>
              <p className="text-xs text-gray-500 mb-2">Sélectionnez les secteurs concernés (laisser vide = tous secteurs)</p>
              <div className="border rounded-md p-3 max-h-48 overflow-y-auto space-y-2">
                {secteursActiviteOptions.map((secteur) => (
                  <div key={secteur} className="flex items-center space-x-2">
                    <Checkbox
                      id={`secteur-${secteur}`}
                      checked={produitForm.secteurs_activite.includes(secteur)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setProduitForm(prev => ({
                            ...prev,
                            secteurs_activite: [...prev.secteurs_activite, secteur]
                          }));
                        } else {
                          setProduitForm(prev => ({
                            ...prev,
                            secteurs_activite: prev.secteurs_activite.filter(s => s !== secteur)
                          }));
                        }
                      }}
                    />
                    <label
                      htmlFor={`secteur-${secteur}`}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                    >
                      {secteur}
                    </label>
                  </div>
                ))}
              </div>
            </div>
            <div className="border-t pt-4">
              <h4 className="font-semibold mb-3">Montants (€)</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="add-montant-min">Minimum</Label>
                  <Input
                    id="add-montant-min"
                    type="number"
                    value={produitForm.montant_min}
                    onChange={(e) => setProduitForm(prev => ({ ...prev, montant_min: e.target.value }))}
                    placeholder="0"
                  />
                </div>
                <div>
                  <Label htmlFor="add-montant-max">Maximum</Label>
                  <Input
                    id="add-montant-max"
                    type="number"
                    value={produitForm.montant_max}
                    onChange={(e) => setProduitForm(prev => ({ ...prev, montant_max: e.target.value }))}
                    placeholder="50000"
                  />
                </div>
              </div>
            </div>
            <div className="border-t pt-4">
              <h4 className="font-semibold mb-3">Taux (en décimal, ex: 0.05 pour 5%)</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="add-taux-min">Minimum</Label>
                  <Input
                    id="add-taux-min"
                    type="number"
                    step="0.01"
                    value={produitForm.taux_min}
                    onChange={(e) => setProduitForm(prev => ({ ...prev, taux_min: e.target.value }))}
                    placeholder="0.05"
                  />
                </div>
                <div>
                  <Label htmlFor="add-taux-max">Maximum</Label>
                  <Input
                    id="add-taux-max"
                    type="number"
                    step="0.01"
                    value={produitForm.taux_max}
                    onChange={(e) => setProduitForm(prev => ({ ...prev, taux_max: e.target.value }))}
                    placeholder="0.40"
                  />
                </div>
              </div>
            </div>
            <div className="border-t pt-4">
              <h4 className="font-semibold mb-3">Durée (mois)</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="add-duree-min">Minimum</Label>
                  <Input
                    id="add-duree-min"
                    type="number"
                    value={produitForm.duree_min}
                    onChange={(e) => setProduitForm(prev => ({ ...prev, duree_min: e.target.value }))}
                    placeholder="1"
                  />
                </div>
                <div>
                  <Label htmlFor="add-duree-max">Maximum</Label>
                  <Input
                    id="add-duree-max"
                    type="number"
                    value={produitForm.duree_max}
                    onChange={(e) => setProduitForm(prev => ({ ...prev, duree_max: e.target.value }))}
                    placeholder="12"
                  />
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddProduitModal(false)}>Annuler</Button>
            <Button onClick={async () => {
              try {
                const response = await fetch(`${config.API_URL}/api/admin/produits`, {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${await getSupabaseToken()}`
                  },
                  credentials: 'include',
                  body: JSON.stringify({
                    ...produitForm,
                    montant_min: produitForm.montant_min ? parseFloat(produitForm.montant_min) : null,
                    montant_max: produitForm.montant_max ? parseFloat(produitForm.montant_max) : null,
                    taux_min: produitForm.taux_min ? parseFloat(produitForm.taux_min) : null,
                    taux_max: produitForm.taux_max ? parseFloat(produitForm.taux_max) : null,
                    duree_min: produitForm.duree_min ? parseInt(produitForm.duree_min) : null,
                    duree_max: produitForm.duree_max ? parseInt(produitForm.duree_max) : null
                  })
                });
                if (response.ok) {
                  toast.success('Produit créé avec succès');
                  setShowAddProduitModal(false);
                  setProduitForm({
                    nom: '',
                    description: '',
                    categorie: '',
                    secteurs_activite: [],
                    type_produit: 'financier',
                    montant_min: '',
                    montant_max: '',
                    taux_min: '',
                    taux_max: '',
                    duree_min: '',
                    duree_max: '',
                    active: true
                  });
                  loadTileData('produits');
                  loadKPIData();
                } else {
                  toast.error('Erreur lors de la création');
                }
              } catch (error) {
                console.error('Erreur création produit:', error);
                toast.error('Erreur lors de la création');
              }
            }}>
              Créer le produit
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Édition Produit */}
      <Dialog open={showEditProduitModal} onOpenChange={setShowEditProduitModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Modifier le produit</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-nom">Nom du produit</Label>
                <Input
                  id="edit-nom"
                  value={produitForm.nom}
                  onChange={(e) => setProduitForm(prev => ({ ...prev, nom: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="edit-type">Type de produit</Label>
                <Select value={produitForm.type_produit} onValueChange={(val) => setProduitForm(prev => ({ ...prev, type_produit: val }))}>
                  <SelectTrigger id="edit-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="financier">Financier</SelectItem>
                    <SelectItem value="qualitatif">Qualitatif</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={produitForm.description}
                onChange={(e) => setProduitForm(prev => ({ ...prev, description: e.target.value }))}
                rows={3}
              />
            </div>
            <div>
              <Label htmlFor="edit-categorie">Catégorie *</Label>
              <Select 
                value={produitForm.categorie} 
                onValueChange={(val) => setProduitForm(prev => ({ ...prev, categorie: val }))}
              >
                <SelectTrigger id="edit-categorie">
                  <SelectValue placeholder="Sélectionner une catégorie" />
                </SelectTrigger>
                <SelectContent>
                  {categoriesOptions.map((cat) => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="edit-secteurs">Secteurs d'activité</Label>
              <p className="text-xs text-gray-500 mb-2">Sélectionnez les secteurs concernés (laisser vide = tous secteurs)</p>
              <div className="border rounded-md p-3 max-h-48 overflow-y-auto space-y-2">
                {secteursActiviteOptions.map((secteur) => (
                  <div key={secteur} className="flex items-center space-x-2">
                    <Checkbox
                      id={`edit-secteur-${secteur}`}
                      checked={produitForm.secteurs_activite.includes(secteur)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setProduitForm(prev => ({
                            ...prev,
                            secteurs_activite: [...prev.secteurs_activite, secteur]
                          }));
                        } else {
                          setProduitForm(prev => ({
                            ...prev,
                            secteurs_activite: prev.secteurs_activite.filter(s => s !== secteur)
                          }));
                        }
                      }}
                    />
                    <label
                      htmlFor={`edit-secteur-${secteur}`}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                    >
                      {secteur}
                    </label>
                  </div>
                ))}
              </div>
            </div>
            <div className="border-t pt-4">
              <h4 className="font-semibold mb-3">Montants (€)</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-montant-min">Minimum</Label>
                  <Input
                    id="edit-montant-min"
                    type="number"
                    value={produitForm.montant_min}
                    onChange={(e) => setProduitForm(prev => ({ ...prev, montant_min: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-montant-max">Maximum</Label>
                  <Input
                    id="edit-montant-max"
                    type="number"
                    value={produitForm.montant_max}
                    onChange={(e) => setProduitForm(prev => ({ ...prev, montant_max: e.target.value }))}
                  />
                </div>
              </div>
            </div>
            <div className="border-t pt-4">
              <h4 className="font-semibold mb-3">Taux (en décimal)</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-taux-min">Minimum</Label>
                  <Input
                    id="edit-taux-min"
                    type="number"
                    step="0.01"
                    value={produitForm.taux_min}
                    onChange={(e) => setProduitForm(prev => ({ ...prev, taux_min: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-taux-max">Maximum</Label>
                  <Input
                    id="edit-taux-max"
                    type="number"
                    step="0.01"
                    value={produitForm.taux_max}
                    onChange={(e) => setProduitForm(prev => ({ ...prev, taux_max: e.target.value }))}
                  />
                </div>
              </div>
            </div>
            <div className="border-t pt-4">
              <h4 className="font-semibold mb-3">Durée (mois)</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-duree-min">Minimum</Label>
                  <Input
                    id="edit-duree-min"
                    type="number"
                    value={produitForm.duree_min}
                    onChange={(e) => setProduitForm(prev => ({ ...prev, duree_min: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-duree-max">Maximum</Label>
                  <Input
                    id="edit-duree-max"
                    type="number"
                    value={produitForm.duree_max}
                    onChange={(e) => setProduitForm(prev => ({ ...prev, duree_max: e.target.value }))}
                  />
                </div>
              </div>
            </div>
            <div className="border-t pt-4">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="edit-active"
                  checked={produitForm.active}
                  onChange={(e) => setProduitForm(prev => ({ ...prev, active: e.target.checked }))}
                  className="rounded"
                />
                <Label htmlFor="edit-active" className="cursor-pointer">Produit actif</Label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditProduitModal(false)}>Annuler</Button>
            <Button onClick={async () => {
              if (!selectedProduit) return;
              try {
                const response = await fetch(`${config.API_URL}/api/admin/produits/${selectedProduit.id}`, {
                  method: 'PUT',
                  headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${await getSupabaseToken()}`
                  },
                  credentials: 'include',
                  body: JSON.stringify({
                    ...produitForm,
                    secteurs_activite: produitForm.secteurs_activite.length > 0 ? produitForm.secteurs_activite : [],
                    montant_min: produitForm.montant_min ? parseFloat(produitForm.montant_min) : null,
                    montant_max: produitForm.montant_max ? parseFloat(produitForm.montant_max) : null,
                    taux_min: produitForm.taux_min ? parseFloat(produitForm.taux_min) : null,
                    taux_max: produitForm.taux_max ? parseFloat(produitForm.taux_max) : null,
                    duree_min: produitForm.duree_min ? parseInt(produitForm.duree_min) : null,
                    duree_max: produitForm.duree_max ? parseInt(produitForm.duree_max) : null
                  })
                });
                if (response.ok) {
                  toast.success('Produit modifié avec succès');
                  setShowEditProduitModal(false);
                  setSelectedProduit(null);
                  loadTileData('produits');
                  loadKPIData();
                } else {
                  toast.error('Erreur lors de la modification');
                }
              } catch (error) {
                console.error('Erreur modification produit:', error);
                toast.error('Erreur lors de la modification');
              }
            }}>
              Modifier
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Suppression Produit */}
      <Dialog open={showDeleteProduitModal} onOpenChange={setShowDeleteProduitModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Supprimer le produit</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-sm text-gray-600">
              Êtes-vous sûr de vouloir supprimer le produit <strong>{selectedProduit?.nom}</strong> ?
              Cette action est irréversible.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteProduitModal(false)}>Annuler</Button>
            <Button variant="destructive" onClick={async () => {
              if (!selectedProduit) return;
              try {
                const response = await fetch(`${config.API_URL}/api/admin/produits/${selectedProduit.id}`, {
                  method: 'DELETE',
                  headers: {
                    'Authorization': `Bearer ${await getSupabaseToken()}`
                  },
                  credentials: 'include'
                });
                if (response.ok) {
                  toast.success('Produit supprimé avec succès');
                  setShowDeleteProduitModal(false);
                  setSelectedProduit(null);
                  loadTileData('produits');
                  loadKPIData();
                } else {
                  toast.error('Erreur lors de la suppression');
                }
              } catch (error) {
                console.error('Erreur suppression produit:', error);
                toast.error('Erreur lors de la suppression');
              }
            }}>
              Supprimer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Assignation Expert */}
      {expertModalOpen && selectedDossierForExpert && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={() => {
            setExpertModalOpen(false);
            setSelectedDossierForExpert(null);
          }}
        >
          <div 
            className="bg-white rounded-lg p-6 max-w-md w-full mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold mb-2">Assigner un Expert</h3>
            <p className="text-sm text-gray-600 mb-4">
              <strong>Dossier :</strong> {selectedDossierForExpert.Client?.company_name || `${selectedDossierForExpert.Client?.first_name || ''} ${selectedDossierForExpert.Client?.last_name || ''}`.trim() || 'N/A'}
            </p>
            <p className="text-sm text-gray-600 mb-4">
              <strong>Produit :</strong> {selectedDossierForExpert.ProduitEligible?.nom || 'N/A'}
            </p>
            
            {loadingExperts ? (
              <div className="flex items-center justify-center py-8">
                <RefreshCw className="w-6 h-6 animate-spin text-blue-600" />
                <span className="ml-2 text-gray-600">Chargement des experts...</span>
              </div>
            ) : (
              <>
                <Select 
                  onValueChange={(expertId) => assignExpertToDossier(selectedDossierForExpert.id, expertId)}
                  disabled={availableExperts.length === 0}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un expert" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableExperts.length > 0 ? (
                      availableExperts.map((expert: any) => (
                        <SelectItem key={expert.id} value={expert.id}>
                          <div className="flex items-center gap-2">
                            <span>{`${expert.first_name || ''} ${expert.last_name || ''}`.trim() || expert.company_name || 'N/A'}</span>
                            {expert.rating && (
                              <span className="text-xs text-yellow-600">⭐ {expert.rating}/5</span>
                            )}
                            {expert.specializations && expert.specializations.length > 0 && (
                              <span className="text-xs text-gray-500">({expert.specializations[0]})</span>
                            )}
                          </div>
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="none" disabled>Aucun expert approuvé disponible</SelectItem>
                    )}
                  </SelectContent>
                </Select>
                
                {availableExperts.length === 0 && (
                  <p className="text-sm text-red-600 mt-2">
                    ⚠️ Aucun expert approuvé n'est disponible. Veuillez d'abord approuver des experts.
                  </p>
                )}
              </>
            )}
            
            <div className="flex gap-2 mt-6">
              <Button 
                variant="outline" 
                className="flex-1"
                onClick={() => {
                  setExpertModalOpen(false);
                  setSelectedDossierForExpert(null);
                }}
              >
                Annuler
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboardOptimized; 