import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/use-auth";
import { Eye, EyeOff, Loader2, UserCheck, AlertCircle, CheckCircle, Building2, Award, ArrowRight } from "lucide-react";
import Button from "@/components/ui/design-system/Button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/design-system/Card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export default function ConnexionExpert() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  
  const { login } = useAuth();
  const navigate = useNavigate();

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
    
    if (!validateForm()) {
      toast.error('Veuillez corriger les erreurs dans le formulaire');
      return;
    }

    setIsLoading(true);
    
    try {
      await login({
        email,
        password,
        type: 'expert'
      });
      toast.success('Connexion réussie ! Bienvenue dans votre espace expert');
      navigate('/dashboard/expert');
    } catch (error: any) {
      console.error("Erreur de connexion:", error);
      
      // Gérer l'erreur 403 avec redirection (multi-profils)
      if (error.response?.status === 403 && error.response?.data?.message) {
        toast.error(error.response.data.message);
        return;
      }
      
      toast.error('Email ou mot de passe incorrect');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Bandeau français - Amélioré */}
        <div className="mb-8 text-center animate-fade-in">
          <div className="flex justify-center space-x-2 mb-4">
            <div className="w-8 h-6 bg-blue-600 rounded shadow-sm"></div>
            <div className="w-8 h-6 bg-white border border-gray-300 rounded shadow-sm"></div>
            <div className="w-8 h-6 bg-red-600 rounded shadow-sm"></div>
          </div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Espace Expert Profitum</h1>
          <p className="text-slate-600">Plateforme de collaboration professionnelle</p>
        </div>

        <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm animate-scale-in">
          <CardHeader className="text-center pb-4">
            <div className="mx-auto w-12 h-12 bg-gradient-to-br from-emerald-600 to-teal-600 rounded-full flex items-center justify-center mb-4 shadow-lg">
              <UserCheck className="w-6 h-6 text-white" />
            </div>
            <CardTitle className="text-xl font-semibold text-slate-900">
              Connexion Expert
            </CardTitle>
            <CardDescription className="text-slate-600">
              Accédez à votre espace de collaboration
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Alerte de redirection si mauvais type */}
            {wrongTypeError && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-red-800 mb-2">
                      {wrongTypeError.message}
                    </p>
                    <p className="text-xs text-red-700 mb-3">
                      Nous avons trouvé un autre type de compte avec cet email :
                    </p>
                    
                    {/* Boutons de redirection */}
                    <div className="space-y-2">
                      {wrongTypeError.available_types?.map((type: any) => (
                        <Button
                          key={type.type}
                          onClick={() => handleRedirect(type.login_url)}
                          variant="secondary"
                          className="w-full justify-between bg-white hover:bg-red-50 border border-red-300"
                          size="sm"
                        >
                          <span>
                            Se connecter en tant que <strong>{type.name || type.type}</strong>
                          </span>
                          <ArrowRight className="w-4 h-4" />
                        </Button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

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
                    placeholder="expert@profitum.fr"
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
                        : 'focus:border-emerald-500 focus:ring-emerald-500'
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
                        : 'focus:border-emerald-500 focus:ring-emerald-500'
                    }`}
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors duration-200"
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
                  className="w-full h-12 text-base font-medium hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 bg-gradient-to-r from-emerald-600 to-teal-600"
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
                    to="/forgot-password-expert" 
                    className="text-sm text-emerald-600 hover:text-emerald-700 hover:underline transition-colors duration-200"
                  >
                    Mot de passe oublié ?
                  </Link>
                </div>
              </div>
            </form>

            {/* Avantages de la plateforme */}
            <div className="pt-6 border-t border-slate-200">
              <h4 className="font-semibold text-slate-900 mb-3 text-center">Pourquoi rejoindre Profitum ?</h4>
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-sm text-slate-600">
                  <Building2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                  <span>Accès à une large base de clients qualifiés</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-slate-600">
                  <Award className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                  <span>Tarification compétitive et transparente</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-slate-600">
                  <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                  <span>Support technique et administratif complet</span>
                </div>
              </div>
            </div>

            {/* Informations de sécurité */}
            <div className="pt-4 border-t border-slate-200">
              <div className="flex items-center gap-2 text-sm text-slate-600 mb-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span>Connexion sécurisée SSL/TLS</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <UserCheck className="w-4 h-4 text-emerald-500" />
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
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
