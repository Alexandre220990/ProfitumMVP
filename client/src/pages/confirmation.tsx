import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface UserInfo { name: string;
  email: string;
  company: string;
  siren: string;
  specializations: string[]; }

const Confirmation = () => { const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);

  useEffect(() => {
    // Récupérer les informations de l'utilisateur depuis le localStorage
    const storedUserInfo = localStorage.getItem("userInfo");
    if (storedUserInfo) {
      setUserInfo(JSON.parse(storedUserInfo)); }

    // Simuler le traitement du paiement
    const processPayment = async () => { try {
        // Simuler un délai de traitement
        await new Promise(resolve => setTimeout(resolve, 2000));
        setStatus('success'); } catch (error) { setStatus('error'); }
    };

    processPayment();
  }, []);

  const handleContinue = () => { // Récupérer les informations de l'utilisateur
    const userInfo = localStorage.getItem("userInfo");
    if (userInfo) {
      const { id, type } = JSON.parse(userInfo);
      // Nettoyer le localStorage
      localStorage.removeItem("selectedPlan");
      
      // Rediriger vers le bon dashboard
      if (type === 'expert') { navigate(`/dashboard/expert/${id }`);
      } else { navigate("/dashboard"); }
    } else { navigate("/dashboard"); }
  };

  if (status === 'loading') { return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-500" />
            <h2 className="text-xl font-semibold mb-2">Traitement de votre paiement</h2>
            <p className="text-gray-600">Veuillez patienter pendant que nous finalisons votre inscription...</p>
          </CardContent>
        </Card>
      </div>
    ); }

  if (status === 'error') { return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-6">
            <div className="text-center mb-6">
              <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">Erreur lors du paiement</h2>
              <p className="text-gray-600 mb-4">Une erreur est survenue lors du traitement de votre paiement.</p>
            </div>
            <Alert variant="destructive" className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Veuillez réessayer ou contacter notre support si le problème persiste.
              </AlertDescription>
            </Alert>
            <div className="space-y-4">
              <Button 
                className="w-full" 
                onClick={() => navigate("/paiement") }
              >
                Réessayer le paiement
              </Button>
              <Button 
                variant="outline" 
                className="w-full"
                onClick={ () => navigate("/contact") }
              >
                Contacter le support
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardContent className="p-6">
          <div className="text-center mb-6">
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Paiement réussi !</h2>
            <p className="text-gray-600">Votre inscription a été confirmée avec succès.</p>
          </div>

          { userInfo && (
            <div className="space-y-4 mb-6">
              <h3 className="font-semibold">Récapitulatif de votre inscription :</h3>
              <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                <p><span className="font-medium">Nom :</span> {userInfo.name }</p>
                <p><span className="font-medium">Email :</span> { userInfo.email }</p>
                <p><span className="font-medium">Entreprise :</span> { userInfo.company }</p>
                <p><span className="font-medium">SIREN :</span> { userInfo.siren }</p>
                <p><span className="font-medium">Spécialisations :</span></p>
                <ul className="list-disc list-inside ml-4">
                  { userInfo.specializations.map((spec, index) => (
                    <li key={index }>{ spec }</li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          <div className="space-y-4">
            <Button 
              className="w-full" 
              onClick={ handleContinue }
            >
              Accéder à mon tableau de bord
            </Button>
            <p className="text-sm text-center text-gray-600">
              Un email de confirmation a été envoyé à votre adresse email.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Confirmation; 