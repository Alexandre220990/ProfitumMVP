import { useState, useEffect } from 'react';
import { supabase } from '@/config/supabase';

export function useFirstLogin(userId?: string) {
  const [isFirstLogin, setIsFirstLogin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    const checkFirstLogin = async () => {
      try {
        const { data, error } = await supabase
          .from('Client')
          .select('first_login')
          .eq('auth_id', userId)
          .single();

        if (error) {
          console.error('Erreur vérification first_login:', error);
          setIsFirstLogin(false);
        } else {
          setIsFirstLogin(data?.first_login === true);
        }
      } catch (err) {
        console.error('Erreur:', err);
        setIsFirstLogin(false);
      } finally {
        setLoading(false);
      }
    };

    checkFirstLogin();
  }, [userId]);

  return { isFirstLogin, loading, setIsFirstLogin };
}

