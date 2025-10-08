import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, FileText } from "lucide-react";

const SocialProductPage = () => { 
  return (
    <div>
        <div className="max-w-7xl mx-auto px-4 py-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-6 h-6 text-orange-600" />
                Optimisation Sociale
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-700">
                L'optimisation sociale est maintenant intégrée dans nos Conditions Générales de Vente.
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
  );
};

export default SocialProductPage; 