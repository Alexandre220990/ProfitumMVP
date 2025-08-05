import HeaderClient from "@/components/HeaderClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Fuel, FileText } from "lucide-react";

const TICPEProductPage = () => { 
  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-red-100">
      {/* Header Client */}
      <HeaderClient />

      {/* Contenu principal avec marge pour le header fixe */}
      <div className="pt-20">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Fuel className="w-6 h-6 text-red-600" />
                Optimisation TICPE
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-700">
                L'optimisation TICPE est maintenant intégrée dans nos Conditions Générales de Vente.
                En vous inscrivant, vous acceptez automatiquement les chartes d'engagement.
              </p>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => window.open('/cgv', '_blank')}>
                  <FileText className="w-4 h-4 mr-2" />
                  Voir les CGV
                </Button>
                <Button>
                  Contacter un expert
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default TICPEProductPage; 