import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, DollarSign } from "lucide-react";

const StarterPage = () => { 
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-blue-900 mb-6">
            Bienvenue sur Profitum
          </h1>
          <p className="text-xl text-blue-700 mb-8 max-w-3xl mx-auto">
            La plateforme qui vous aide à optimiser vos charges et réduire vos coûts
          </p>
          
          <div className="grid md:grid-cols-2 gap-8 mb-12">
            <Card className="p-8">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="w-6 h-6 text-green-600" />
                  Commencer maintenant
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-6">
                  Accédez à nos services premium et commencez à économiser dès aujourd'hui.
                </p>
                <Button 
                  onClick={() => navigate("/paiement")}
                  className="w-full bg-green-600 hover:bg-green-700"
                >
                  Commencer
                </Button>
              </CardContent>
            </Card>
            
            <Card className="p-8">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-6 h-6 text-blue-600" />
                  Créer un compte
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-6">
                  Rejoignez notre communauté et bénéficiez de nos services exclusifs.
                </p>
                <Button 
                  onClick={() => navigate("/inscription")}
                  variant="outline"
                  className="w-full"
                >
                  S'inscrire
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StarterPage;
