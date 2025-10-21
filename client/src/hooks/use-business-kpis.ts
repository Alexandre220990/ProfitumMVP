import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

interface BusinessKPIs {
  // Clients
  totalClients: number;
  activeClients: number;
  newClientsThisMonth: number;
  
  // Experts
  totalExperts: number;
  pendingExperts: number;
  activeExperts: number;
  
  // Dossiers
  totalDossiers: number;
  dossiersOpportunites: number;
  dossiersEnCours: number;
  
  // Financier
  montantTotalEligible: number;
  gainsPotentiels: number;
  gainsRealises: number;
  
  // Tendances
  croissanceClients: number;
  tauxConversion: number;
  performanceGlobale: number;
}

interface UserData {
  clients: {
    total: number;
    active: number;
    pending: number;
    recent: any[];
  };
  experts: {
    total: number;
    active: number;
    pending: number;
    recent: any[];
  };
  validations: {
    pendingExperts: any[];
    pendingClients: any[];
    pendingDossiers: any[];
  };
}

export const useBusinessKPIs = () => {
  const [businessKPIs, setBusinessKPIs] = useState<BusinessKPIs | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // ===== CHARGEMENT DES KPIs MÉTIER =====
  
  const loadBusinessKPIs = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // 1. Récupérer les données clients
      const { data: clientsData, error: clientsError } = await supabase
        .from('Client')
        .select('id, statut, created_at');

      if (clientsError) throw clientsError;

      const totalClients = clientsData?.length || 0;
      const activeClients = clientsData?.filter(c => c.statut === 'actif').length || 0;
      const newClientsThisMonth = clientsData?.filter(c => {
        const createdDate = new Date(c.created_at);
        const now = new Date();
        return createdDate.getMonth() === now.getMonth() && createdDate.getFullYear() === now.getFullYear();
      }).length || 0;

      // 2. Récupérer les données experts
      const { data: expertsData, error: expertsError } = await supabase
        .from('Expert')
        .select('id, status, approval_status, created_at');

      if (expertsError) throw expertsError;

      const totalExperts = expertsData?.length || 0;
      const pendingExperts = expertsData?.filter(e => e.approval_status === 'pending').length || 0;
      const activeExperts = expertsData?.filter(e => e.status === 'active').length || 0;

      // 3. Récupérer les données dossiers (ClientProduitEligible)
      const { data: dossiersData, error: dossiersError } = await supabase
        .from('ClientProduitEligible')
        .select('id, statut, montantFinal, progress, created_at');

      if (dossiersError) throw dossiersError;

      const totalDossiers = dossiersData?.length || 0;
      const dossiersOpportunites = dossiersData?.filter(d => d.statut === 'opportunite').length || 0;
      const dossiersEnCours = dossiersData?.filter(d => d.statut === 'en_cours').length || 0;

      // 4. Calculer les montants financiers
      const montantTotalEligible = dossiersData?.reduce((sum, d) => sum + (d.montantFinal || 0), 0) || 0;
      const gainsPotentiels = dossiersData?.filter(d => d.statut === 'opportunite')
        .reduce((sum, d) => sum + (d.montantFinal || 0), 0) || 0;
      const gainsRealises = dossiersData?.filter(d => d.statut === 'termine')
        .reduce((sum, d) => sum + (d.montantFinal || 0), 0) || 0;

      // 5. Calculer les tendances
      const croissanceClients = totalClients > 0 ? ((newClientsThisMonth / totalClients) * 100) : 0;
      const tauxConversion = totalDossiers > 0 ? ((dossiersEnCours / totalDossiers) * 100) : 0;
      const performanceGlobale = ((activeClients / Math.max(totalClients, 1)) * 0.4 + 
                                 (activeExperts / Math.max(totalExperts, 1)) * 0.3 + 
                                 (dossiersEnCours / Math.max(totalDossiers, 1)) * 0.3) * 100;

      // 6. Construire l'objet KPIs
      const kpis: BusinessKPIs = {
        totalClients,
        activeClients,
        newClientsThisMonth,
        totalExperts,
        pendingExperts,
        activeExperts,
        totalDossiers,
        dossiersOpportunites,
        dossiersEnCours,
        montantTotalEligible,
        gainsPotentiels,
        gainsRealises,
        croissanceClients,
        tauxConversion,
        performanceGlobale
      };

      setBusinessKPIs(kpis);
      setLastUpdated(new Date());

    } catch (err) {
      console.error('Erreur lors du chargement des KPIs:', err);
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // ===== CHARGEMENT DES DONNÉES UTILISATEURS =====
  
  const loadUserData = useCallback(async () => {
    try {
      // 1. Récupérer les clients récents
      const { data: recentClients, error: clientsError } = await supabase
        .from('Client')
        .select('id, name, company_name, statut, created_at')
        .order('created_at', { ascending: false })
        .limit(5);

      if (clientsError) throw clientsError;

      // 2. Récupérer les experts récents
      const { data: recentExperts, error: expertsError } = await supabase
        .from('Expert')
        .select('id, name, email, status, approval_status, specializations')
        .order('created_at', { ascending: false })
        .limit(5);

      if (expertsError) throw expertsError;

      // 3. Récupérer les experts en attente de validation
      const { data: pendingExperts, error: pendingExpertsError } = await supabase
        .from('Expert')
        .select('id, name, email, specializations')
        .eq('approval_status', 'pending')
        .order('created_at', { ascending: false });

      if (pendingExpertsError) throw pendingExpertsError;

      // 4. Récupérer les clients en attente
      const { data: pendingClients, error: pendingClientsError } = await supabase
        .from('Client')
        .select('id, name, company_name, email')
        .eq('statut', 'pending')
        .order('created_at', { ascending: false });

      if (pendingClientsError) throw pendingClientsError;

      // 5. Récupérer les dossiers en attente
      const { data: pendingDossiers, error: pendingDossiersError } = await supabase
        .from('ClientProduitEligible')
        .select(`
          id, 
          statut, 
          montantFinal,
          Client(name, company_name),
          ProduitEligible(nom)
        `)
        .eq('statut', 'opportunite')
        .order('created_at', { ascending: false });

      if (pendingDossiersError) throw pendingDossiersError;

      // 6. Construire l'objet UserData
      const userData: UserData = {
        clients: {
          total: businessKPIs?.totalClients || 0,
          active: businessKPIs?.activeClients || 0,
          pending: pendingClients?.length || 0,
          recent: recentClients?.map((c: any) => ({
            id: c.id,
            name: c.company_name || c.name,
            status: c.statut,
            created_at: c.created_at
          })) || []
        },
        experts: {
          total: businessKPIs?.totalExperts || 0,
          active: businessKPIs?.activeExperts || 0,
          pending: businessKPIs?.pendingExperts || 0,
          recent: recentExperts?.map(e => ({
            id: e.id,
            name: e.name,
            status: e.status,
            specializations: e.specializations || []
          })) || []
        },
        validations: {
          pendingExperts: pendingExperts?.map(e => ({
            id: e.id,
            name: e.name,
            email: e.email,
            specializations: e.specializations || []
          })) || [],
          pendingClients: pendingClients?.map((c: any) => ({
            id: c.id,
            name: c.company_name || c.name,
            email: c.email
          })) || [],
          pendingDossiers: pendingDossiers?.map((d: any) => ({
            id: d.id,
            clientName: d.Client?.company_name || d.Client?.name,
            produitName: d.ProduitEligible?.nom,
            montantFinal: d.montantFinal
          })) || []
        }
      };

      setUserData(userData);

    } catch (err) {
      console.error('Erreur lors du chargement des données utilisateurs:', err);
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    }
  }, [businessKPIs]);

  // ===== CHARGEMENT COMPLET =====
  
  const loadAllData = useCallback(async () => {
    await loadBusinessKPIs();
  }, [loadBusinessKPIs]);

  useEffect(() => {
    loadAllData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (businessKPIs) {
      loadUserData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [businessKPIs]);

  // ===== ACTIONS =====
  
  const refreshData = useCallback(async () => {
    await loadAllData();
  }, [loadAllData]);

  // ===== UTILITAIRES =====
  
  const formatCurrency = useCallback((value: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  }, []);

  const formatPercentage = useCallback((value: number) => {
    return `${value.toFixed(1)}%`;
  }, []);

  const formatNumber = useCallback((value: number) => {
    return value.toLocaleString('fr-FR');
  }, []);

  return {
    // Données
    businessKPIs,
    userData,
    
    // États
    isLoading,
    error,
    lastUpdated,
    
    // Actions
    refreshData,
    loadBusinessKPIs,
    loadUserData,
    
    // Utilitaires
    formatCurrency,
    formatPercentage,
    formatNumber
  };
}; 