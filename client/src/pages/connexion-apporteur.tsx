import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/use-auth";
import { Eye, EyeOff, Loader2, UserCheck, AlertCircle, CheckCircle, Building2, Handshake, ArrowRight } from "lucide-react";
import Button from "@/components/ui/design-system/Button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/design-system/Card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export default function ConnexionApporteur() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  
  const { login } = useAuth();

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
    setErrors({});

    try {
      console.log('🔐 Tentative de connexion apporteur...');
      
      await login({
        email,
        password,
        type: "apporteur"
      });

      toast.success('Bienvenue dans votre espace apporteur d\'affaires');

      // La redirection est gérée dans le hook useAuth
      console.log('✅ Connexion apporteur réussie');

    } catch (error: any) {
      console.error('❌ Erreur connexion apporteur:', error);
      
      let errorMessage = "Erreur de connexion";
      
      if (error.message?.includes("Invalid login credentials")) {
        errorMessage = "Email ou mot de passe incorrect";
      } else if (error.message?.includes("Email not confirmed")) {
        errorMessage = "Veuillez confirmer votre email avant de vous connecter";
      } else if (error.message?.includes("Too many requests")) {
        errorMessage = "Trop de tentatives. Veuillez réessayer plus tard";
      } else if (error.message?.includes("User not found")) {
        errorMessage = "Aucun compte apporteur trouvé avec cet email";
      } else if (error.message?.includes("Account not approved")) {
        errorMessage = "Votre compte n'est pas encore approuvé par l'administrateur";
      }

      setErrors({
        email: errorMessage.includes("email") ? errorMessage : undefined,
        password: errorMessage.includes("mot de passe") ? errorMessage : undefined
      });

      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full">
              <Handshake className="w-8 h-8 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Apporteurs d'Affaires
          </h1>
          <p className="text-gray-600">
            Connectez-vous à votre espace dédié
          </p>
        </div>

        {/* Card de connexion */}
        <Card className="shadow-xl border-0">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-2xl font-semibold text-gray-900">
              Connexion
            </CardTitle>
            <CardDescription className="text-gray-600">
              Accédez à votre dashboard apporteur
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                  Email professionnel
                </Label>
                <div className="relative">
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={`pl-10 ${errors.email ? 'border-red-500' : 'border-gray-300'}`}
                    placeholder="votre@email.com"
                    disabled={isLoading}
                  />
                  <UserCheck className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                </div>
                {errors.email && (
                  <div className="flex items-center space-x-1 text-red-600 text-sm">
                    <AlertCircle className="w-4 h-4" />
                    <span>{errors.email}</span>
                  </div>
                )}
              </div>

              {/* Mot de passe */}
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                  Mot de passe
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={`pl-10 pr-10 ${errors.password ? 'border-red-500' : 'border-gray-300'}`}
                    placeholder="••••••••"
                    disabled={isLoading}
                  />
                  <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    disabled={isLoading}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.password && (
                  <div className="flex items-center space-x-1 text-red-600 text-sm">
                    <AlertCircle className="w-4 h-4" />
                    <span>{errors.password}</span>
                  </div>
                )}
              </div>

              {/* Bouton de connexion */}
              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium py-3 rounded-lg transition-all duration-200 transform hover:scale-[1.02]"
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center space-x-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Connexion...</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <span>Se connecter</span>
                    <ArrowRight className="w-4 h-4" />
                  </div>
                )}
              </Button>
            </form>

            {/* Informations importantes */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <CheckCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-blue-800">
                  <p className="font-medium mb-1">Compte créé par l'administrateur</p>
                  <p className="text-blue-700">
                    Votre compte apporteur d'affaires a été créé par l'équipe Profitum. 
                    Si vous n'avez pas encore d'accès, contactez votre administrateur.
                  </p>
                </div>
              </div>
            </div>

            {/* Liens utiles */}
            <div className="text-center space-y-2">
              <p className="text-sm text-gray-600">
                Problème de connexion ? 
                <Link 
                  to="/contact" 
                  className="text-blue-600 hover:text-blue-700 font-medium ml-1"
                >
                  Contactez le support
                </Link>
              </p>
              
              <div className="flex justify-center space-x-4 text-sm">
                <Link 
                  to="/connexion-client" 
                  className="text-gray-500 hover:text-gray-700"
                >
                  Espace Client
                </Link>
                <span className="text-gray-300">•</span>
                <Link 
                  to="/connexion-expert" 
                  className="text-gray-500 hover:text-gray-700"
                >
                  Espace Expert
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center mt-8">
          <p className="text-sm text-gray-500">
            © 2025 Profitum. Tous droits réservés.
          </p>
        </div>
      </div>
    </div>
  );
}
