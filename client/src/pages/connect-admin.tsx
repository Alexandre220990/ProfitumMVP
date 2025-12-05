import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation, useSearchParams } from "react-router-dom";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/lib/supabase";
import { Eye, EyeOff, Loader2, Shield, AlertCircle, CheckCircle } from "lucide-react";
import Button from "@/components/ui/design-system/Button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export default function ConnectAdmin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  
  const { login, user, checkAuth } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  
  // Récupérer l'URL de redirection depuis différentes sources
  const [redirectUrl, setRedirectUrl] = useState<string | null>(null);
  
  // Vérifier la session Supabase au chargement de la page
  useEffect(() => {
    const verifyAndRedirect = async () => {
      console.log('🔍 [connect-admin] Vérification session Supabase...');
      
      try {
        // 1. Vérifier si une session existe
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (session && !sessionError) {
          const userType = session.user.user_metadata?.type;
          
          // 2. Vérifier si c'est un admin
          if (userType === 'admin') {
            console.log('✅ [connect-admin] Session admin trouvée, rafraîchissement...');
            
            // 3. Vérifier si la session est expirée ou va bientôt expirer
            const expiresAt = session.expires_at ? session.expires_at * 1000 : 0;
            const now = Date.now();
            const timeUntilExpiry = expiresAt - now;
            
            // Si la session expire dans moins de 5 minutes, essayer de la rafraîchir
            if (timeUntilExpiry < 5 * 60 * 1000) {
              console.log('🔄 [connect-admin] Session expire bientôt, rafraîchissement...');
              const { data: { session: refreshedSession }, error: refreshError } = await supabase.auth.refreshSession();
              
              if (refreshedSession && !refreshError) {
                console.log('✅ [connect-admin] Session rafraîchie');
              }
            }
            
            // 4. Mettre à jour le contexte d'authentification
            await checkAuth(false);
            
            // 5. Récupérer l'URL de redirection
            const redirectFromQuery = searchParams.get('redirect');
            const redirectFromState = (location.state as any)?.from?.pathname;
            const finalRedirect = redirectFromQuery || redirectFromState;
            
            // 6. Rediriger vers la destination
            if (finalRedirect) {
              console.log('🔀 [connect-admin] Redirection automatique vers:', finalRedirect);
              navigate(finalRedirect, { replace: true });
            } else {
              console.log('🔀 [connect-admin] Redirection vers dashboard');
              navigate('/admin/dashboard-optimized', { replace: true });
            }
            return;
          } else {
            console.log('⚠️ [connect-admin] Session trouvée mais type incorrect:', userType);
          }
        }
        
        // 7. Si pas de session, vérifier s'il y a un refresh token
        const storedSession = localStorage.getItem('supabase.auth.token');
        if (storedSession) {
          try {
            const parsed = JSON.parse(storedSession);
            if (parsed?.refresh_token) {
              console.log('🔄 [connect-admin] Refresh token trouvé, tentative de restauration...');
              const { data: { session: restoredSession }, error: restoreError } = await supabase.auth.refreshSession();
              
              if (restoredSession && !restoreError) {
                const restoredUserType = restoredSession.user.user_metadata?.type;
                if (restoredUserType === 'admin') {
                  console.log('✅ [connect-admin] Session admin restaurée');
                  await checkAuth(false);
                  
                  const redirectFromQuery = searchParams.get('redirect');
                  const redirectFromState = (location.state as any)?.from?.pathname;
                  const finalRedirect = redirectFromQuery || redirectFromState;
                  
                  if (finalRedirect) {
                    navigate(finalRedirect, { replace: true });
                  } else {
                    navigate('/admin/dashboard-optimized', { replace: true });
                  }
                  return;
                }
              }
            }
          } catch (e) {
            console.log('⚠️ [connect-admin] Erreur parsing session:', e);
          }
        }
        
        console.log('❌ [connect-admin] Aucune session admin valide, affichage formulaire');
        setIsCheckingSession(false);
      } catch (error) {
        console.error('❌ [connect-admin] Erreur vérification session:', error);
        setIsCheckingSession(false);
      }
    };

    verifyAndRedirect();
  }, [checkAuth, navigate, searchParams, location]);
  
  useEffect(() => {
    // Si l'utilisateur est déjà connecté (après vérification), rediriger
    if (!isCheckingSession && user && user.type === 'admin') {
      const redirectFromQuery = searchParams.get('redirect');
      const redirectFromState = (location.state as any)?.from?.pathname;
      const finalRedirect = redirectFromQuery || redirectFromState;
      
      if (finalRedirect) {
        navigate(finalRedirect, { replace: true });
      } else {
        navigate('/admin/dashboard-optimized', { replace: true });
      }
    }
  }, [user, isCheckingSession, navigate, searchParams, location]);
  
  useEffect(() => {
    // 1. Vérifier les query params (?redirect=/admin/...)
    const redirectFromQuery = searchParams.get('redirect');
    
    // 2. Vérifier le state de navigation (depuis ProtectedRoute)
    const redirectFromState = (location.state as any)?.from?.pathname;
    
    // 3. Déterminer l'URL de redirection finale
    const finalRedirect = redirectFromQuery || redirectFromState;
    
    if (finalRedirect) {
      setRedirectUrl(finalRedirect);
      console.log('🔀 [connect-admin] URL de redirection détectée:', finalRedirect);
    }
  }, [searchParams, location]);

  const validateForm = () => {
    const newErrors: { email?: string; password?: string } = {};

    if (!email) {
      newErrors.email = "L'email est requis";
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = "Format d'email invalide";
    }

    if (!password) {
      newErrors.password = "Le mot de passe est requis";
    } else if (password.length < 6) {
      newErrors.password = "Le mot de passe doit contenir au moins 6 caractères";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('🚀 [connect-admin] handleSubmit appelé', { email, redirectUrl });
    
    if (!validateForm()) {
      console.log('❌ [connect-admin] Validation formulaire échouée');
      toast.error('Veuillez corriger les erreurs dans le formulaire');
      return;
    }

    console.log('✅ [connect-admin] Validation OK, début connexion...');
    setIsLoading(true);
    
    try {
      console.log('🔐 [connect-admin] Appel de login() avec:', { email, type: 'admin' });
      
      // Connexion sans navigation automatique (on va naviguer manuellement après)
      await login({
        email,
        password,
        type: 'admin'
      }, false); // Désactiver la navigation automatique
      
      console.log('✅ [connect-admin] login() terminé avec succès');
      toast.success('Connexion réussie ! Bienvenue dans l\'espace d\'administration');
      
      // Rediriger vers l'URL demandée ou le dashboard par défaut
      if (redirectUrl) {
        console.log('🔀 [connect-admin] Redirection vers:', redirectUrl);
        navigate(redirectUrl, { replace: true });
      } else {
        console.log('🔀 [connect-admin] Redirection vers dashboard par défaut');
        navigate('/admin/dashboard-optimized', { replace: true });
      }
    } catch (error: any) {
      console.error("❌ [connect-admin] Erreur de connexion:", error);
      toast.error(error.message || 'Email ou mot de passe incorrect');
    } finally {
      setIsLoading(false);
    }
  };

  // Afficher un loader pendant la vérification de session
  if (isCheckingSession) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          <p className="text-gray-600">Vérification de l'authentification...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-red-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Bandeau français - Amélioré */}
        <div className="mb-8 text-center animate-fade-in">
          <div className="flex justify-center space-x-2 mb-4">
            <div className="w-8 h-6 bg-blue-600 rounded shadow-sm"></div>
            <div className="w-8 h-6 bg-white border border-gray-300 rounded shadow-sm"></div>
            <div className="w-8 h-6 bg-red-600 rounded shadow-sm"></div>
          </div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Administration Profitum</h1>
          <p className="text-slate-600">Espace de gestion sécurisé</p>
        </div>

        <div className="shadow-xl border-0 bg-white/80 backdrop-blur-sm animate-scale-in rounded-2xl">
          <div className="text-center pb-4 p-6">
            <div className="mx-auto w-12 h-12 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-full flex items-center justify-center mb-4 shadow-lg">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-xl font-semibold text-slate-900 mb-2">
              Connexion Administrateur
            </h2>
            <p className="text-slate-600">
              Accédez à votre espace de gestion
            </p>
          </div>

          <div className="space-y-6 p-6 pt-0">
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium text-slate-700">
                  Adresse email
                </Label>
                <div className="relative">
                  <Input
                    id="email"
                    type="email"
                    placeholder="admin@profitum.fr"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (errors.email) {
                        setErrors(prev => ({ ...prev, email: undefined }));
                      }
                    }}
                    className={`transition-all duration-200 ${
                      errors.email 
                        ? 'border-red-500 focus:border-red-500 focus:ring-red-500' 
                        : 'focus:border-blue-500 focus:ring-blue-500'
                    }`}
                    disabled={isLoading}
                  />
                  {errors.email && (
                    <div className="flex items-center gap-1 mt-1 text-red-600 text-sm">
                      <AlertCircle className="w-4 h-4" />
                      {errors.email}
                    </div>
                  )}
                </div>
              </div>

              {/* Mot de passe */}
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium text-slate-700">
                  Mot de passe
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Votre mot de passe"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (errors.password) {
                        setErrors(prev => ({ ...prev, password: undefined }));
                      }
                    }}
                    className={`pr-10 transition-all duration-200 ${
                      errors.password 
                        ? 'border-red-500 focus:border-red-500 focus:ring-red-500' 
                        : 'focus:border-blue-500 focus:ring-blue-500'
                    }`}
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors duration-200"
                    disabled={isLoading}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                  {errors.password && (
                    <div className="flex items-center gap-1 mt-1 text-red-600 text-sm">
                      <AlertCircle className="w-4 h-4" />
                      {errors.password}
                    </div>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="space-y-4 pt-4">
                <Button
                  type="submit"
                  className="w-full h-12 text-base font-medium hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 bg-gradient-to-r from-blue-600 to-indigo-600"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Connexion en cours...
                    </>
                  ) : (
                    'Se connecter'
                  )}
                </Button>

                <div className="text-center">
                  <Link 
                    to="/forgot-password-admin" 
                    className="text-sm text-blue-600 hover:text-blue-700 hover:underline transition-colors duration-200"
                  >
                    Mot de passe oublié ?
                  </Link>
                </div>
              </div>
            </form>

            {/* Informations de sécurité */}
            <div className="pt-4 border-t border-slate-200">
              <div className="flex items-center gap-2 text-sm text-slate-600 mb-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span>Connexion sécurisée SSL/TLS</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <Shield className="w-4 h-4 text-blue-500" />
                <span>Authentification à deux facteurs disponible</span>
              </div>
            </div>

            {/* Retour à l'accueil */}
            <div className="text-center pt-4">
              <Link 
                to="/" 
                className="text-sm text-slate-600 hover:text-slate-800 hover:underline transition-colors duration-200"
              >
                ← Retour à l'accueil
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 