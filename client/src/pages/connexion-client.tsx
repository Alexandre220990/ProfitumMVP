import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/use-auth";
import { Eye, EyeOff, Loader2, CheckCircle, AlertCircle, ArrowRight, Shield, Zap } from "lucide-react";
import Button from "@/components/ui/design-system/Button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

export default function ConnexionClient() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  
  const { login } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

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
      toast({
        variant: "destructive",
        title: 'Erreur de validation',
        description: 'Veuillez corriger les erreurs dans le formulaire'
      });
      return;
    }

    setIsLoading(true);
    
    try {
      await login({
        email,
        password,
        type: 'client'
      });
      toast({
        title: 'Connexion réussie',
        description: 'Bienvenue sur votre espace client !'
      });
      navigate(`/dashboard/client`);
    } catch (error) {
      console.error("Erreur de connexion:", error);
      toast({
        variant: "destructive",
        title: 'Erreur de connexion',
        description: 'Email ou mot de passe incorrect'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      {/* Section Branding - Amélioré avec plus d'effets visuels */}
      <div className="hidden md:flex w-1/2 bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 text-white p-12 flex-col justify-center relative overflow-hidden">
        {/* Effet de fond animé amélioré */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 via-transparent to-indigo-800/20 animate-pulse"></div>
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-bounce"></div>
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl animate-pulse"></div>
        
        <div className="relative z-10 animate-fade-in">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-white/10 rounded-xl backdrop-blur-sm">
              <Shield className="w-8 h-8 text-blue-200" />
            </div>
            <h1 className="text-5xl font-extrabold leading-tight">
              Bienvenue sur{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-200 to-indigo-200">
                Profitum
              </span>
            </h1>
          </div>
          <p className="text-xl opacity-90 mb-8 leading-relaxed">
            Connectez-vous pour accéder à votre espace client et optimiser vos finances
          </p>
          
          {/* Avantages avec icônes améliorées */}
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-3 bg-white/5 rounded-lg backdrop-blur-sm hover:bg-white/10 transition-all duration-300">
              <div className="p-2 bg-green-500/20 rounded-lg">
                <Zap className="w-5 h-5 text-green-300" />
              </div>
              <span className="text-lg">Optimisation fiscale automatisée</span>
            </div>
            <div className="flex items-center gap-3 p-3 bg-white/5 rounded-lg backdrop-blur-sm hover:bg-white/10 transition-all duration-300">
              <div className="p-2 bg-blue-500/20 rounded-lg">
                <CheckCircle className="w-5 h-5 text-blue-300" />
              </div>
              <span className="text-lg">Suivi en temps réel de vos dossiers</span>
            </div>
            <div className="flex items-center gap-3 p-3 bg-white/5 rounded-lg backdrop-blur-sm hover:bg-white/10 transition-all duration-300">
              <div className="p-2 bg-purple-500/20 rounded-lg">
                <Shield className="w-5 h-5 text-purple-300" />
              </div>
              <span className="text-lg">Expertise spécialisée disponible 24/7</span>
            </div>
          </div>
        </div>
      </div>

      {/* Section Formulaire - Amélioré avec micro-interactions */}
      <div className="w-full md:w-1/2 flex items-center justify-center px-6 py-12">
        <div className="max-w-lg w-full space-y-8 bg-white/80 backdrop-blur-sm p-8 rounded-2xl shadow-xl animate-scale-in border border-white/20">
          {/* Header amélioré */}
          <div className="text-center space-y-3">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl mb-4 shadow-lg">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-3xl font-bold text-slate-900">Connexion</h2>
            <p className="text-slate-600">
              Pas encore de compte ?{" "}
              <Link 
                to="/create-account-client" 
                className="text-blue-600 font-medium hover:text-blue-700 hover:underline transition-all duration-200 hover:scale-105 inline-block"
              >
                Créez-en un
              </Link>
            </p>
          </div>

          {/* Formulaire amélioré */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email avec animation d'état */}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium text-slate-700 flex items-center gap-2">
                <span>Adresse email</span>
                {email && !errors.email && (
                  <CheckCircle className="w-4 h-4 text-green-500 animate-fade-in" />
                )}
              </Label>
              <div className="relative group">
                <Input
                  id="email"
                  type="email"
                  placeholder="votre@email.com"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (errors.email) {
                      setErrors(prev => ({ ...prev, email: undefined }));
                    }
                  }}
                  className={`transition-all duration-300 group-hover:shadow-md ${
                    errors.email 
                      ? 'border-red-500 focus:border-red-500 focus:ring-red-500' 
                      : 'focus:border-blue-500 focus:ring-blue-500 hover:border-blue-300'
                  }`}
                  disabled={isLoading}
                  autoComplete="username"
                />
                {errors.email && (
                  <div className="flex items-center gap-1 mt-1 text-red-600 text-sm animate-fade-in">
                    <AlertCircle className="w-4 h-4" />
                    {errors.email}
                  </div>
                )}
              </div>
            </div>

            {/* Mot de passe avec animation d'état */}
            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium text-slate-700 flex items-center gap-2">
                <span>Mot de passe</span>
                {password && !errors.password && (
                  <CheckCircle className="w-4 h-4 text-green-500 animate-fade-in" />
                )}
              </Label>
              <div className="relative group">
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
                  className={`pr-10 transition-all duration-300 group-hover:shadow-md ${
                    errors.password 
                      ? 'border-red-500 focus:border-red-500 focus:ring-red-500' 
                      : 'focus:border-blue-500 focus:ring-blue-500 hover:border-blue-300'
                  }`}
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-all duration-200 hover:scale-110"
                  disabled={isLoading}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
                {errors.password && (
                  <div className="flex items-center gap-1 mt-1 text-red-600 text-sm animate-fade-in">
                    <AlertCircle className="w-4 h-4" />
                    {errors.password}
                  </div>
                )}
              </div>
            </div>

            {/* Actions améliorées */}
            <div className="space-y-4">
              <Button
                type="submit"
                className="w-full h-12 text-base font-medium hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 group relative overflow-hidden"
                disabled={isLoading}
              >
                <span className="relative z-10 flex items-center justify-center">
                  {isLoading ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Connexion en cours...
                    </>
                  ) : (
                    <>
                      Se connecter
                      <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform duration-200" />
                    </>
                  )}
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </Button>

              <div className="text-center">
                <Link 
                  to="/forgot-password" 
                  className="text-sm text-blue-600 hover:text-blue-700 hover:underline transition-all duration-200 hover:scale-105 inline-block"
                >
                  Mot de passe oublié ?
                </Link>
              </div>
            </div>
          </form>

          {/* Retour à l'accueil amélioré */}
          <div className="text-center pt-4 border-t border-slate-200">
            <Link 
              to="/" 
              className="text-sm text-slate-600 hover:text-slate-800 hover:underline transition-all duration-200 hover:scale-105 inline-block"
            >
              ← Retour à l'accueil
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
