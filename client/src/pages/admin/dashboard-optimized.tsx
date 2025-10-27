import { useState, useEffect } from 'react';
import { Navigate, useNavigate, useSearchParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";
import { get } from "@/lib/api";
import { config } from "@/config/env";
import ApporteurManagement from "@/components/admin/ApporteurManagement";
import { NotificationCenter } from "@/components/admin/NotificationCenter";
import { 
  RefreshCw, Users, FileText, 
  Eye, ClipboardList, Edit, Check, X,
  UserCheck, AlertTriangle, Clock,
  Download, Settings, TrendingUp, DollarSign,
  Bell, Mail, Target, CheckCircle, XCircle,
  Handshake, Package, Trash2, Calendar, Lock
} from "lucide-react";
import { TypeSwitcher } from "@/components/TypeSwitcher";
import { motion } from "framer-motion";
import { PerformanceCharts } from "@/components/charts/PerformanceCharts";

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

type ActiveSection = 'overview' | 'experts' | 'clients' | 'dossiers' | 'apporteurs' | 'validations' | 'performance';

// ============================================================================
// DASHBOARD ADMIN OPTIMISÉ - VUE MÉTIER PURE
// ============================================================================
// Interface simplifiée pour un pilotage optimal de l'activité

const AdminDashboardOptimized: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
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

  useEffect(() => {
    loadKPIData();
    loadSectionData('overview');
  }, []);

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
      const dossiersResponse = await get('/admin/dossiers/all');
      console.log('📦 Dossiers pour KPI:', dossiersResponse);
      const dossiers = dossiersResponse.success ? (dossiersResponse.data as any)?.dossiers || [] : [];
      
      // Charger les produits
      const produitsResponse = await get('/admin/produits');
      console.log('📦 Produits pour KPI:', produitsResponse);
      const produits = produitsResponse.success ? (produitsResponse.data as any)?.produits || [] : [];
      
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
      const expertsPendingValidation = experts.filter((e: any) => {
        const createdAt = new Date(e.created_at);
        const now = new Date();
        const diffHours = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60);
        return e.approval_status === 'pending' && diffHours > 48;
      }).length;

      const dossiersEnRetard = dossiers.filter((d: any) => {
        const createdAt = new Date(d.created_at);
        const now = new Date();
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
      
      const alertesUrgentes = validationsDocuments + expertsPendingValidation;
      const alertesNormales = dossiersEnRetard;

      // Calculer les données du mois précédent pour la croissance
      const now = new Date();
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
          'Authorization': `Bearer ${localStorage.getItem('supabase.auth.token')}`
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
      const expertsResponse = await get('/admin/experts');
      if (expertsResponse.success) {
        const allExperts = (expertsResponse.data as any)?.experts || [];
        // Filtrer uniquement les experts approuvés
        const approvedExperts = allExperts.filter((expert: any) => expert.approval_status === 'approved');
        setAvailableExperts(approvedExperts);
      } else {
        console.error('❌ Erreur chargement experts:', expertsResponse.message);
        toast.error('Erreur lors du chargement des experts');
        setAvailableExperts([]);
      }
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
          'Authorization': `Bearer ${localStorage.getItem('supabase.auth.token')}`
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
          'Authorization': `Bearer ${localStorage.getItem('supabase.auth.token')}`
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
          'Authorization': `Bearer ${localStorage.getItem('supabase.auth.token')}`
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
    // Vérifier le cache (valide pendant 5 minutes)
    const now = Date.now();
    const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
    
    if (dataCache[tile] && (now - dataCache[tile].timestamp) < CACHE_DURATION) {
      console.log(`💾 Utilisation du cache pour: ${tile}`);
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
            
            // Enrichir avec le nombre de dossiers à valider
            const dossiersResponse = await get('/admin/dossiers/all');
            if (dossiersResponse.success) {
              const allDossiers = (dossiersResponse.data as any)?.dossiers || [];
              
              data = clients.map((client: any) => {
                const clientDossiersAValider = allDossiers.filter((d: any) => 
                  d.clientId === client.id && 
                  (d.statut === 'documents_uploaded' || d.statut === 'eligible_confirmed')
                ).length;
                
                return {
                  ...client,
                  dossiersAValider: clientDossiersAValider
                };
              });
            } else {
              data = clients;
            }
          } else {
            console.error('❌ Erreur chargement clients:', clientsResponse.message);
          }
          break;
          
        case 'experts':
          const expertsResponse = await get('/admin/experts');
          if (expertsResponse.success) {
            data = (expertsResponse.data as any)?.experts || [];
          } else {
            console.error('❌ Erreur chargement experts:', expertsResponse.message);
          }
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
          if (produitsResponse.success) {
            data = (produitsResponse.data as any)?.produits || [];
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
      
      setSelectedTileData(data);
      
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
            setSectionData((prev: SectionData) => ({ 
              ...prev, 
              dossiers: (validationsDossiersResponse.data as any)?.dossiers || [] 
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
                          {client.company_name || 'Entreprise'}
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
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
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
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
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
                  <div className="grid grid-cols-2 gap-3 mb-3 p-3 bg-gray-50 rounded-lg">
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
                    <div className="grid grid-cols-3 gap-2 text-xs">
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
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
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
              {/* Notifications temps réel */}
              <div className="mb-6">
                <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                        <div>
                          <h3 className="font-semibold text-blue-900">Système en temps réel</h3>
                          <p className="text-sm text-blue-700">Dernière mise à jour: {new Date().toLocaleTimeString('fr-FR')}</p>
                        </div>
                      </div>
                      <div className="flex gap-3 items-center">
                        {/* TypeSwitcher */}
                        <TypeSwitcher />
                        
                        <div className="flex gap-2">
                          <Badge variant="default" className="bg-green-100 text-green-800">
                            <Check className="w-3 h-3 mr-1" />
                            {kpiData.alertesUrgentes === 0 ? 'Aucune urgence' : `${kpiData.alertesUrgentes} urgences`}
                          </Badge>
                          <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                            <Clock className="w-3 h-3 mr-1" />
                            {kpiData.alertesNormales} alertes
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Section dynamique */}
              <div className="mt-8">
                {activeSection === 'overview' && (
                  <div className="space-y-6">
                    {/* En-tête avec actions de reporting */}
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="text-2xl font-bold text-slate-900">Vue d'ensemble - Reporting</h2>
                        <p className="text-slate-600">Tableaux de bord et analyses en temps réel</p>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm">
                          <Download className="w-4 h-4 mr-2" />
                          Exporter Rapport
                        </Button>
                        <Button variant="outline" size="sm">
                          <RefreshCw className="w-4 h-4 mr-2" />
                          Actualiser
                        </Button>
                        <Button variant="outline" size="sm">
                          <Settings className="w-4 h-4 mr-2" />
                          Configurer
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
                          {/* Tuiles Écosystème */}
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">
                            {/* Clients */}
                            <div 
                              className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                                selectedEcosystemTile === 'clients' 
                                  ? 'border-green-500 bg-green-50 shadow-md' 
                                  : 'border-gray-200 hover:border-green-300 hover:bg-green-50'
                              }`}
                              onClick={() => setSelectedEcosystemTile('clients')}
                            >
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="text-sm text-gray-600">Clients actifs</p>
                                  <p className="text-2xl font-bold text-green-600">{kpiData.totalClients}</p>
                                </div>
                                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                                  <Users className="w-4 h-4 text-green-600" />
                                </div>
                              </div>
                            </div>

                            {/* Experts */}
                            <div 
                              className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                                selectedEcosystemTile === 'experts' 
                                  ? 'border-blue-500 bg-blue-50 shadow-md' 
                                  : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50'
                              }`}
                              onClick={() => setSelectedEcosystemTile('experts')}
                            >
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="text-sm text-gray-600">Experts</p>
                                  <p className="text-2xl font-bold text-blue-600">{kpiData.totalExperts}</p>
                                </div>
                                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                  <UserCheck className="w-4 h-4 text-blue-600" />
                                </div>
                              </div>
                            </div>

                            {/* Apporteurs */}
                            <div 
                              className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                                selectedEcosystemTile === 'apporteurs' 
                                  ? 'border-purple-500 bg-purple-50 shadow-md' 
                                  : 'border-gray-200 hover:border-purple-300 hover:bg-purple-50'
                              }`}
                              onClick={() => setSelectedEcosystemTile('apporteurs')}
                            >
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="text-sm text-gray-600">Apporteurs</p>
                                  <p className="text-2xl font-bold text-purple-600">{kpiData.apporteursTotal}</p>
                                </div>
                                <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                                  <Handshake className="w-4 h-4 text-purple-600" />
                                </div>
                              </div>
                            </div>

                            {/* Dossiers */}
                            <div 
                              className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                                selectedEcosystemTile === 'dossiers' 
                                  ? 'border-indigo-500 bg-indigo-50 shadow-md' 
                                  : 'border-gray-200 hover:border-indigo-300 hover:bg-indigo-50'
                              }`}
                              onClick={() => setSelectedEcosystemTile('dossiers')}
                            >
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="text-sm text-gray-600">Dossiers en cours</p>
                                  <p className="text-2xl font-bold text-indigo-600">{kpiData.totalDossiers}</p>
                                </div>
                                <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
                                  <FileText className="w-4 h-4 text-indigo-600" />
                                </div>
                              </div>
                            </div>

                            {/* Produits */}
                            <div 
                              className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                                selectedEcosystemTile === 'produits' 
                                  ? 'border-orange-500 bg-orange-50 shadow-md' 
                                  : 'border-gray-200 hover:border-orange-300 hover:bg-orange-50'
                              }`}
                              onClick={() => setSelectedEcosystemTile('produits')}
                            >
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="text-sm text-gray-600">Produits éligibles</p>
                                  <p className="text-2xl font-bold text-orange-600">{kpiData.totalProduits || 0}</p>
                                </div>
                                <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                                  <Package className="w-4 h-4 text-orange-600" />
                                </div>
                              </div>
                            </div>

                            {/* Performance */}
                            <div 
                              className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                                selectedEcosystemTile === 'performance' 
                                  ? 'border-emerald-500 bg-emerald-50 shadow-md' 
                                  : 'border-gray-200 hover:border-emerald-300 hover:bg-emerald-50'
                              }`}
                              onClick={() => setSelectedEcosystemTile('performance')}
                            >
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="text-sm text-gray-600">Performance</p>
                                  <p className={`text-2xl font-bold ${kpiData.croissanceRevenus >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                    {kpiData.croissanceRevenus >= 0 ? '+' : ''}{kpiData.croissanceRevenus}%
                                  </p>
                                </div>
                                <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center">
                                  <TrendingUp className="w-4 h-4 text-emerald-600" />
                                </div>
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
                                        Détails Experts ({kpiData.totalExperts})
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
                                        Détails Produits ({kpiData.totalProduits})
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
                                      ) : selectedTileData.length > 0 ? (
                                        <div className="space-y-3">
                                          <div className="flex justify-between items-center">
                                            <h4 className="font-semibold text-gray-800">
                                              Clients actifs ({selectedTileData.length})
                                            </h4>
                                            <Button 
                                              variant="outline" 
                                              size="sm"
                                              onClick={() => setActiveSection('clients')}
                                            >
                                              Voir tous
                                            </Button>
                                          </div>
                                          
                                          <div className="space-y-2 max-h-96 overflow-y-auto">
                                            {selectedTileData.slice(0, 10).map((client: any) => (
                                              <div key={client.id} className="p-3 border rounded-lg hover:bg-gray-50">
                                                <div className="flex justify-between items-start">
                                                  <div className="flex-1">
                                                    <div className="flex items-center gap-2 mb-1">
                                                      <h5 className="font-medium text-gray-800">
                                                        {client.company_name || `${client.first_name || ''} ${client.last_name || ''}`.trim() || 'N/A'}
                                                      </h5>
                                                      <Badge variant={
                                                        client.statut === 'active' ? 'default' :
                                                        client.statut === 'pending' ? 'secondary' : 'outline'
                                                      }>
                                                        {client.statut}
                                                      </Badge>
                                                      {client.dossiersAValider > 0 && (
                                                        <Badge variant="destructive" className="animate-pulse">
                                                          ⚠️ {client.dossiersAValider} à valider
                                                        </Badge>
                                                      )}
                                                    </div>
                                                    
                                                    <div className="text-sm text-gray-600">
                                                      <p>📧 {client.email}</p>
                                                      {client.phone && <p>📞 {client.phone}</p>}
                                                      <p>📅 Créé le {new Date(client.created_at).toLocaleDateString('fr-FR')}</p>
                                                    </div>
                                                  </div>
                                                  
                                                  <div className="text-right">
                                                    <Button 
                                                      variant="ghost" 
                                                      size="sm"
                                                      onClick={() => navigate(`/admin/clients/${client.id}`)}
                                                      title="Voir la synthèse du client"
                                                    >
                                                      <Eye className="w-4 h-4" />
                                                    </Button>
                                                  </div>
                                                </div>
                                              </div>
                                            ))}
                                            
                                            {selectedTileData.length > 10 && (
                                              <div className="text-center py-2 text-sm text-gray-500">
                                                ... et {selectedTileData.length - 10} autres clients
                                              </div>
                                            )}
                                          </div>
                                        </div>
                                      ) : (
                                        <div className="text-center py-8">
                                          <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                                          <p className="text-gray-500">Aucun client trouvé</p>
                                        </div>
                                      )}
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
                                        <div className="space-y-3">
                                          <div className="flex justify-between items-center">
                                            <h4 className="font-semibold text-gray-800">
                                              Experts ({selectedTileData.length})
                                            </h4>
                                            <Button 
                                              variant="outline" 
                                              size="sm"
                                              onClick={() => setActiveSection('experts')}
                                            >
                                              Voir tous
                                            </Button>
                                          </div>
                                          
                                          <div className="space-y-2 max-h-96 overflow-y-auto">
                                            {selectedTileData.slice(0, 10).map((expert: any) => (
                                              <div key={expert.id} className="p-3 border rounded-lg hover:bg-gray-50">
                                                <div className="flex justify-between items-start">
                                                  <div className="flex-1">
                                                    <div className="flex items-center gap-2 mb-1">
                                                      <h5 className="font-medium text-gray-800">
                                                        {`${expert.first_name || ''} ${expert.last_name || ''}`.trim() || expert.company_name || 'N/A'}
                                                      </h5>
                                                      <Badge variant={
                                                        expert.approval_status === 'approved' ? 'default' :
                                                        expert.approval_status === 'pending' ? 'secondary' :
                                                        expert.approval_status === 'rejected' ? 'destructive' : 'outline'
                                                      }>
                                                        {expert.approval_status}
                                                      </Badge>
                                                      {expert.rating && (
                                                        <span className="text-xs text-yellow-600">
                                                          ⭐ {expert.rating}/5
                                                        </span>
                                                      )}
                                                    </div>
                                                    
                                                    <div className="text-sm text-gray-600">
                                                      {expert.company_name && <p>🏢 {expert.company_name}</p>}
                                                      <p>📧 {expert.email}</p>
                                                      {expert.specializations && expert.specializations.length > 0 && (
                                                        <p>🎯 {expert.specializations.slice(0, 2).join(', ')}</p>
                                                      )}
                                                      <p>📅 Créé le {new Date(expert.created_at).toLocaleDateString('fr-FR')}</p>
                                                    </div>
                                                  </div>
                                                  
                                                  <div className="text-right">
                                                    <Button 
                                                      variant="ghost" 
                                                      size="sm"
                                                      onClick={() => navigate(`/admin/experts/${expert.id}`)}
                                                      title="Voir la synthèse de l'expert"
                                                    >
                                                      <Eye className="w-4 h-4" />
                                                    </Button>
                                                  </div>
                                                </div>
                                              </div>
                                            ))}
                                            
                                            {selectedTileData.length > 10 && (
                                              <div className="text-center py-2 text-sm text-gray-500">
                                                ... et {selectedTileData.length - 10} autres experts
                                              </div>
                                            )}
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
                                              <div key={apporteur.id} className="p-3 border rounded-lg hover:bg-gray-50">
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
                                                      onClick={() => {
                                                        setActiveSection('apporteurs');
                                                        setSelectedEcosystemTile(null);
                                                      }}
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
                                              <div className="grid grid-cols-2 gap-1">
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
                                                        {dossier.tauxFinal}%
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
                                        <div className="space-y-3">
                                          <div className="flex justify-between items-center">
                                            <h4 className="font-semibold text-gray-800">
                                              Produits éligibles ({selectedTileData.length})
                                            </h4>
                                            <Button 
                                              variant="outline" 
                                              size="sm"
                                              onClick={() => navigate('/admin/gestion-produits')}
                                            >
                                              Gérer
                                            </Button>
                                          </div>
                                          
                                          <div className="space-y-2 max-h-96 overflow-y-auto">
                                            {selectedTileData.slice(0, 10).map((produit: any) => (
                                              <div key={produit.id} className="p-3 border rounded-lg hover:bg-gray-50">
                                                <div className="flex justify-between items-start">
                                                  <div className="flex-1">
                                                    <div className="flex items-center gap-2 mb-1">
                                                      <h5 className="font-medium text-gray-800">
                                                        {produit.nom || 'N/A'}
                                                      </h5>
                                                      <Badge variant="default">
                                                        {produit.categorie || 'Autre'}
                                                      </Badge>
                                                    </div>
                                                    
                                                    <div className="text-sm text-gray-600">
                                                      {produit.description && (
                                                        <p className="mb-1 line-clamp-2">{produit.description}</p>
                                                      )}
                                                      <div className="flex items-center gap-4">
                                                        {produit.montant_min && produit.montant_max && (
                                                          <p>💰 {produit.montant_min.toLocaleString('fr-FR')}€ - {produit.montant_max.toLocaleString('fr-FR')}€</p>
                                                        )}
                                                        {produit.taux_min && produit.taux_max && (
                                                          <p>📊 {produit.taux_min}% - {produit.taux_max}%</p>
                                                        )}
                                                      </div>
                                                      {produit.eligibility_criteria && (
                                                        <p className="mt-1 text-xs text-gray-500">
                                                          Critères: {Object.keys(produit.eligibility_criteria).length} conditions
                                                        </p>
                                                      )}
                                                    </div>
                                                  </div>
                                                  
                                                  <div className="text-right">
                                                    <Button 
                                                      variant="ghost" 
                                                      size="sm"
                                                      onClick={() => navigate('/admin/gestion-produits')}
                                                    >
                                                      <Eye className="w-4 h-4" />
                                                    </Button>
                                                  </div>
                                                </div>
                                              </div>
                                            ))}
                                            
                                            {selectedTileData.length > 10 && (
                                              <div className="text-center py-2 text-sm text-gray-500">
                                                ... et {selectedTileData.length - 10} autres produits
                                              </div>
                                            )}
                                          </div>
                                        </div>
                                      ) : (
                                        <div className="text-center py-8">
                                          <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                                          <p className="text-gray-500">Aucun produit trouvé</p>
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
                                      <div className="grid grid-cols-2 gap-4">
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

                    {/* Alertes et notifications récentes */}
                    <Card 
                      className="cursor-pointer hover:shadow-lg transition-shadow"
                      onClick={() => setActiveSection('validations')}
                    >
                      <CardHeader>
                        <CardTitle className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Bell className="w-5 h-5" />
                            Alertes Récentes
                          </div>
                          <Badge variant={kpiData.alertesUrgentes > 0 ? 'destructive' : 'default'}>
                            {kpiData.validationsPending || 0}
                          </Badge>
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {kpiData.alertesUrgentes > 0 && (
                            <div className="flex items-center gap-3 p-3 bg-red-50 border border-red-200 rounded">
                              <AlertTriangle className="w-4 h-4 text-red-600" />
                              <div className="flex-1">
                                <p className="font-medium text-red-800">Actions urgentes</p>
                                <p className="text-sm text-red-600">
                                  {kpiData.validationsDocuments} validation{kpiData.validationsDocuments > 1 ? 's' : ''} documents + 
                                  {kpiData.expertsPendingValidation} expert{kpiData.expertsPendingValidation > 1 ? 's' : ''} &gt;48h
                                </p>
                              </div>
                              <CheckCircle className="w-5 h-5 text-red-600" />
                            </div>
                          )}
                          {kpiData.dossiersEnRetard > 0 && (
                            <div className="flex items-center gap-3 p-3 bg-yellow-50 border border-yellow-200 rounded">
                              <Clock className="w-4 h-4 text-yellow-600" />
                              <div className="flex-1">
                                <p className="font-medium text-yellow-800">Dossiers en retard</p>
                                <p className="text-sm text-yellow-600">{kpiData.dossiersEnRetard} dossier{kpiData.dossiersEnRetard > 1 ? 's' : ''} bloqué{kpiData.dossiersEnRetard > 1 ? 's' : ''} &gt;21 jours</p>
                              </div>
                              <Eye className="w-5 h-5 text-yellow-600" />
                            </div>
                          )}
                          {kpiData.alertesUrgentes === 0 && kpiData.dossiersEnRetard === 0 && (
                            <div className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded">
                              <CheckCircle className="w-4 h-4 text-green-600" />
                              <div>
                                <p className="font-medium text-green-800">Aucune alerte</p>
                                <p className="text-sm text-green-600">Tout est à jour !</p>
                              </div>
                            </div>
                          )}
                          <p className="text-xs text-center text-gray-500 mt-2">
                            Cliquez pour voir toutes les validations →
                          </p>
                        </div>
                      </CardContent>
                    </Card>
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
                        <h2 className="text-2xl font-bold text-slate-900">Centre de Notifications & Validations</h2>
                        <p className="text-slate-600">Gérez vos notifications et validez les dossiers en attente</p>
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

                    {/* Centre de notifications intégré */}
                    <NotificationCenter 
                      onNotificationAction={async (dossierId: string, action: 'validate' | 'reject') => {
                        const dossier = sectionData.dossiers.find(d => d.id === dossierId);
                        const dossierName = dossier?.ProduitEligible?.nom || 'Dossier';
                        
                        if (action === 'validate') {
                          await handleValidateEligibility(dossierId, dossierName);
                        } else {
                          await handleRejectEligibility(dossierId, dossierName);
                        }
                      }}
                    />

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
                                      <Button size="sm" variant="default" onClick={() => navigate('/admin/gestion-experts')}>
                                        <Eye className="w-4 h-4 mr-1" />
                                        Gérer
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
                                          📎 {dossier.documents_sent?.length || 0} document(s) uploadé(s)
                                        </p>
                                      </div>
                                      <div className="flex flex-col gap-2">
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
                                                  'Authorization': `Bearer ${localStorage.getItem('token')}`,
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
                                                  'Authorization': `Bearer ${localStorage.getItem('token')}`,
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
                          <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded">
                            <div className="flex items-center gap-3">
                              <Check className="w-4 h-4 text-green-600" />
                              <div>
                                <p className="font-medium text-green-800">Expert URSSAF validé</p>
                                <p className="text-sm text-green-600">Par Admin - Il y a 2h</p>
                              </div>
                            </div>
                            <Badge variant="default">Validé</Badge>
                          </div>
                          
                          <div className="flex items-center justify-between p-3 bg-red-50 border border-red-200 rounded">
                            <div className="flex items-center gap-3">
                              <X className="w-4 h-4 text-red-600" />
                              <div>
                                <p className="font-medium text-red-800">Document DFS rejeté</p>
                                <p className="text-sm text-red-600">Par Admin - Il y a 4h</p>
                              </div>
                            </div>
                            <Badge variant="destructive">Rejeté</Badge>
                          </div>
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