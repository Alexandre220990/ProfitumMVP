import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, FileText, ExternalLink } from "lucide-react";

const ComptableProductPage = () => {
  return (
    <div>
        <div className="max-w-4xl mx-auto px-4 py-6">
          <Card className="bg-white/80 backdrop-blur-sm border border-white/20 shadow-xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-2xl">
                <FileText className="w-6 h-6 text-blue-600" />
                Produit Comptable
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="text-center py-8">
                <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                <h2 className="text-xl font-semibold text-gray-900 mb-2">
                  Conditions Générales de Vente
                </h2>
                <p className="text-gray-600 mb-6">
                  En vous inscrivant sur notre plateforme, vous acceptez automatiquement nos conditions générales de vente 
                  qui incluent les chartes d'engagement pour chaque produit.
                </p>
                <div className="flex gap-4 justify-center">
                  <Button 
                    variant="outline" 
                    className="flex items-center gap-2"
                    onClick={() => window.open('/cgv', '_blank')}
                  >
                    <ExternalLink className="w-4 h-4" />
                    Consulter les CGV
                  </Button>
                  <Button 
                    className="flex items-center gap-2"
                    onClick={() => window.history.back()}
                  >
                    Retour
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
    </div>
  );
};

export default ComptableProductPage; 