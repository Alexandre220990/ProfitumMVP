import { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Mail, Lock, Eye, EyeOff, Briefcase, ShieldCheck } from "lucide-react";

export default function ConnexionPartner() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = () => {
    if (!email || !password) {
      setError("Veuillez remplir tous les champs.");
      return;
    }
    setError("");
    console.log("Authentification en cours...");
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Section Image & Branding */}
      <div className="hidden md:flex w-1/2 bg-gradient-to-r from-blue-700 to-blue-900 text-white p-10 flex-col justify-center">
        <h1 className="text-4xl font-extrabold">Rejoignez la communauté d’experts !</h1>
        <p className="mt-4 text-lg opacity-90">
          Connectez-vous et accédez à des opportunités qualifiées en quelques secondes.
        </p>
        <Briefcase className="w-16 h-16 mt-6 text-white opacity-90" />
        <p className="mt-2 text-sm opacity-80">
          Une plateforme sécurisée et optimisée pour maximiser votre activité.
        </p>
      </div>

      {/* Section Connexion */}
      <div className="w-full md:w-1/2 flex items-center justify-center px-6">
        <div className="max-w-md w-full space-y-6 bg-white p-8 rounded-lg shadow-lg">
          <h2 className="text-3xl font-bold text-center text-gray-800">Connexion Partenaire</h2>
          <p className="text-center text-gray-500">
            Nouveau sur Profitum ?{" "}
            <Link href="/create-account-partner" className="text-blue-600 font-medium hover:underline">
              Créez un compte expert
            </Link>
          </p>

          {/* Formulaire */}
          <div className="space-y-4">
            <div className="relative">
              <Mail className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
              <Input
                type="email"
                placeholder="Adresse e-mail professionnelle"
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

            <Button onClick={handleLogin} className="w-full bg-blue-700 hover:bg-blue-800 text-white py-3">
              Se connecter
            </Button>
          </div>

          <p className="text-center text-gray-500 text-sm">
            En vous connectant, vous acceptez nos{" "}
            <Link href="/conditions" className="text-blue-600 font-medium hover:underline">
              conditions d’utilisation
            </Link>.
          </p>
        </div>
      </div>
    </div>
  );
}
