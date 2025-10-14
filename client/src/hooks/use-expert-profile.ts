import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './use-auth';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

// Types basés sur la structure de la base de données Expert
export interface ExpertProfile {
  id: string;
  email: string;
  name: string;
  company_name: string;
  siren: string;
  specializations: string[];
  experience: string | null;
  location: string | null;
  rating: number;
  compensation: number | null;
  description: string | null;
  status: string;
  disponibilites: any | null;
  certifications: any | null;
  website: string | null;
  linkedin: string | null;
  languages: string[] | null;
  availability: string | null;
  max_clients: number | null;
  hourly_rate: number | null;
  phone: string | null;
  auth_id: string | null;
  approved_by: string | null;
  approved_at: string | null;
  approval_status: string | null;
  created_at: string;
  updated_at: string;
}

export const useExpertProfile = () => {
  const { user } = useAuth();
  
  const [profile, setProfile] = useState<ExpertProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Récupérer le profil expert depuis la base de données
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
        .from('Expert')
        .select(`
          id,
          email,
          name,
          company_name,
          siren,
          specializations,
          experience,
          location,
          rating,
          compensation,
          description,
          status,
          disponibilites,
          certifications,
          website,
          linkedin,
          languages,
          availability,
          max_clients,
          hourly_rate,
          phone,
          auth_user_id,
          approved_by,
          approved_at,
          approval_status,
          created_at,
          updated_at
        `)
        .eq('id', user.id)
        .single();

      if (fetchError) {
        console.error('Erreur lors de la récupération du profil expert:', fetchError);
        setError(fetchError.message);
        return;
      }

      if (data) {
        setProfile(data as ExpertProfile);
      } else {
        setError('Profil expert non trouvé');
      }
    } catch (err) {
      console.error('Erreur lors de la récupération du profil expert:', err);
      setError('Erreur lors de la récupération du profil expert');
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  // Demander une validation admin pour modifier le profil
  const requestProfileUpdate = useCallback(async (updateReason: string) => {
    if (!user?.id) {
      toast.error('Utilisateur non connecté');
      return false;
    }

    try {
      // Créer une notification pour la demande de modification
      const { error: requestError } = await (supabase
        .from('notification') as any)
        .insert({
          user_id: user.id,
          user_type: 'expert',
          title: 'Demande de modification de profil',
          message: `Demande de modification de profil: ${updateReason}`,
          notification_type: 'profile_update_request',
          priority: 'medium',
          is_read: false
        });

      if (requestError) {
        console.error('Erreur lors de la demande de modification:', requestError);
        toast.error('Erreur lors de l\'envoi de la demande');
        return false;
      }

      toast.success('Demande envoyée ! Votre demande de modification a été envoyée à l\'administrateur');
      return true;
    } catch (err) {
      console.error('Erreur lors de la demande de modification:', err);
      toast.error('Erreur lors de l\'envoi de la demande');
      return false;
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
    error,
    requestProfileUpdate,
    refreshProfile
  };
}; 