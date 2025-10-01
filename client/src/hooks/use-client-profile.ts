import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './use-auth';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

// Types basés sur la structure de la base de données
export interface ClientProfile {
  id: string;
  email: string;
  name: string | null;
  company_name: string | null;
  phone_number: string | null;
  address: string;
  city: string;
  postal_code: string;
  siren: string | null;
  revenuAnnuel: number | null;
  secteurActivite: string | null;
  nombreEmployes: number | null;
  ancienneteEntreprise: number | null;
  typeProjet: string | null;
  chiffreAffaires: number | null;
  statut: string;
  created_at: string;
  updated_at: string;
}

export interface ClientProfileUpdate {
  name?: string;
  company_name?: string;
  phone_number?: string;
  address?: string;
  city?: string;
  postal_code?: string;
  siren?: string;
  revenuAnnuel?: number;
  secteurActivite?: string;
  nombreEmployes?: number;
  ancienneteEntreprise?: number;
  typeProjet?: string;
  chiffreAffaires?: number;
}

export const useClientProfile = () => {
  const { user } = useAuth();
  
  const [profile, setProfile] = useState<ClientProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Récupérer le profil client depuis la base de données
  const fetchProfile = useCallback(async () => {
    if (!user?.id) {
      setError('Utilisateur non connecté');
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('Client')
        .select(`
          id,
          email,
          name,
          company_name,
          phone_number,
          address,
          city,
          postal_code,
          siren,
          revenuAnnuel,
          secteurActivite,
          nombreEmployes,
          ancienneteEntreprise,
          typeProjet,
          chiffreAffaires,
          statut,
          created_at,
          updated_at
        `)
        .eq('id', user.id)
        .single();

      if (fetchError) {
        console.error('Erreur lors de la récupération du profil:', fetchError);
        setError(fetchError.message);
        return;
      }

      if (data) {
        setProfile(data as ClientProfile);
      } else {
        setError('Profil non trouvé');
      }
    } catch (err) {
      console.error('Erreur lors de la récupération du profil:', err);
      setError('Erreur lors de la récupération du profil');
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  // Mettre à jour le profil client
  const updateProfile = useCallback(async (updates: ClientProfileUpdate) => {
    if (!user?.id) {
      toast.error('Utilisateur non connecté');
      return false;
    }

    try {
      setIsSaving(true);
      setError(null);

      const updateData = {
        ...updates,
        updated_at: new Date().toISOString()
      };

      const { data, error: updateError } = await supabase
        .from('Client')
        .update(updateData)
        .eq('id', user.id)
        .select()
        .single();

      if (updateError) {
        console.error('Erreur lors de la mise à jour du profil:', updateError);
        toast.error(updateError.message);
        return false;
      }

      if (data) {
        setProfile(data as ClientProfile);
        toast.success('Profil mis à jour ! Vos informations ont été sauvegardées avec succès');
        return true;
      }

      return false;
    } catch (err) {
      console.error('Erreur lors de la mise à jour du profil:', err);
      toast.error('Erreur lors de la sauvegarde');
      return false;
    } finally {
      setIsSaving(false);
    }
  }, [user?.id]);

  // Charger le profil au montage du composant
  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  // Rafraîchir le profil
  const refreshProfile = useCallback(() => {
    fetchProfile();
  }, [fetchProfile]);

  return {
    profile,
    isLoading,
    isSaving,
    error,
    updateProfile,
    refreshProfile
  };
}; 