import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";

/**
 * Simple composant de redirection vers la page d'accueil
 */
export default function HomeRedirect() { const { user, isLoading } = useAuth();
  const navigate = useNavigate();

  console.log('HomeRedirect - Montage du composant');
  console.log('HomeRedirect - État de l\'authentification: ', { user, isLoading });

  useEffect(() => { 
    console.log('HomeRedirect - useEffect déclenché', { user, isLoading });
    
    if (!isLoading) { 
      console.log('HomeRedirect - Chargement terminé, décision de redirection');
      
      // Si l'utilisateur est authentifié, on dirige vers son tableau de bord
      if (user) {
        console.log('HomeRedirect - Utilisateur connecté:', user);
        
        if (user.type === 'client') {
          console.log('HomeRedirect - Redirection vers dashboard client');
          navigate(`/dashboard/client/${user.id}`);
        } else if (user.type === 'expert') { 
          console.log('HomeRedirect - Redirection vers dashboard expert');
          navigate('/dashboard/expert'); 
        } else { 
          console.log('HomeRedirect - Type utilisateur inconnu, redirection vers home');
          navigate('/home'); 
        }
      } else { 
        // Sinon vers la page d'accueil
        console.log('HomeRedirect - Aucun utilisateur, redirection vers home');
        navigate('/home'); 
      }
    }
  }, [isLoading, user, navigate]);

  // Afficher un indicateur de chargement pendant la redirection
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
    </div>
  );
} 