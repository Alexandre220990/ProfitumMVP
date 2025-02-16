import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Mail, Lock, Eye, EyeOff, ShieldCheck } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

export default function ConnexionClient() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [, setLocation] = useLocation();
  const { loginMutation } = useAuth();

  const handleLogin = async () => {
    if (!email || !password) {
      setError("Veuillez remplir tous les champs.");
      return;
    }
    setError("");
    try {
      const result = await loginMutation.mutateAsync({ email, password });
      if (result.type === 'client') {
        setLocation("/dashboard/client");
      } else if (result.type === 'partner') {
        setLocation("/dashboard/partner");
      }
    } catch (err) {
      setError("Identifiants invalides");
      console.error("Erreur de connexion:", err);
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Section Image & Branding */}
      <div className="hidden md:flex w-1/2 bg-gradient-to-r from-blue-600 to-blue-800 text-white p-10 flex-col justify-center">
        <h1 className="text-4xl font-extrabold">Bienvenue sur Profitum !</h1>
        <p className="mt-4 text-lg opacity-90">
          Connectez-vous et accédez à vos opportunités en quelques secondes.
        </p>
        <ShieldCheck className="w-16 h-16 mt-6 text-white opacity-90" />
        <p className="mt-2 text-sm opacity-80">
          Une plateforme sécurisée et optimisée pour votre réussite.
        </p>
      </div>

      {/* Section Connexion */}
      <div className="w-full md:w-1/2 flex items-center justify-center px-6">
        <div className="max-w-md w-full space-y-6 bg-white p-8 rounded-lg shadow-lg">
          <h2 className="text-3xl font-bold text-center text-gray-800">Connexion</h2>
          <p className="text-center text-gray-500">
            Nouveau sur Profitum ?{" "}
            <Link href="/create-account-client" className="text-blue-600 font-medium hover:underline">
              Créez un compte
            </Link>
          </p>

          {/* Formulaire */}
          <div className="space-y-4">
            <div className="relative">
              <Mail className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
              <Input
                type="email"
                placeholder="Adresse e-mail"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-10"
              />
            </div>

            <div className="relative">
              <Lock className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
              <Input
                type={showPassword ? "text" : "password"}
                placeholder="Mot de passe"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-10 pr-10"
              />
              <button
                type="button"
                className="absolute right-3 top-3 text-gray-400"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>

            {error && <p className="text-red-500 text-sm">{error}</p>}

            <div className="flex justify-between text-sm">
              <Link href="/mot-de-passe-oublie" className="text-blue-600 hover:underline">
                Mot de passe oublié ?
              </Link>
            </div>

            <Button 
              onClick={handleLogin} 
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3"
              disabled={loginMutation.isPending}
            >
              {loginMutation.isPending ? "Connexion..." : "Se connecter"}
            </Button>
          </div>

          <p className="text-center text-gray-500 text-sm">
            En vous connectant, vous acceptez nos{" "}
            <Link href="/conditions" className="text-blue-600 font-medium hover:underline">
              conditions d'utilisation
            </Link>.
          </p>
        </div>
      </div>
    </div>
  );
}