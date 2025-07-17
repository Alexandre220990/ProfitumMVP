import { useEffect, useState } from "react";
import { testSupabaseConnection } from "../lib/supabase";

export const useSupabaseTest = () => { const [isConnected, setIsConnected] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const testConnection = async () => {
      try {
        const connected = await testSupabaseConnection();
        setIsConnected(connected); } catch (err) { setError(err instanceof Error ? err.message : 'Erreur inconnue');
        setIsConnected(false); }
    };

    testConnection();
  }, []);

  return { isConnected, error };
}; 