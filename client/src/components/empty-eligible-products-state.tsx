import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { Calculator, Phone, RefreshCw, TrendingUp, AlertCircle, ArrowRight } from "lucide-react";

export function EmptyEligibleProductsState() { 
  const navigate = useNavigate();
  
  const contactAdvisor = () => {
    // Ouvrir un modal ou rediriger vers une page de contact
    window.open('mailto:contact@profitum.fr?subject=Demande d\'analyse personnalisée', '_blank');
  };

  return (
    <div className="space-y-8">
      {/* Message principal */}
      <Card className="border-2 border-dashed border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50">
        <CardHeader className="text-center pb-4">
          <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
            <AlertCircle className="w-8 h-8 text-blue-600" />
          </div>
          <CardTitle className="text-2xl text-blue-900 mb-2">
            Aucune opportunité identifiée pour le moment
          </CardTitle>
          <p className="text-blue-700 text-lg leading-relaxed max-w-2xl mx-auto">
            Notre simulation n'a pas détecté d'opportunités d'optimisation immédiates dans votre situation actuelle. 
            Mais ne vous inquiétez pas, nous avons plusieurs solutions pour vous accompagner !
          </p>
        </CardHeader>
        <CardContent className="text-center">
          <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            
            {/* Option 1: Relancer la simulation */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-blue-100 hover:shadow-md transition-all duration-300">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <RefreshCw className="w-6 h-6 text-white" />
              </div>
              <h3 className="font-semibold text-blue-900 mb-2">Relancer la simulation</h3>
              <p className="text-blue-700 text-sm mb-4">
                Votre situation a peut-être évolué. Relancez la simulation avec des données mises à jour.
              </p>
              <Button 
                onClick={() => navigate("/simulateur")}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
              >
                <Calculator className="w-4 h-4 mr-2" />
                Nouvelle simulation
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>



            {/* Option 3: Contact conseiller */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-blue-100 hover:shadow-md transition-all duration-300">
              <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Phone className="w-6 h-6 text-white" />
              </div>
              <h3 className="font-semibold text-blue-900 mb-2">Analyse personnalisée</h3>
              <p className="text-blue-700 text-sm mb-4">
                Nos experts peuvent analyser votre situation individuellement et identifier des opportunités spécifiques.
              </p>
              <Button 
                onClick={contactAdvisor}
                variant="outline"
                className="w-full border-orange-600 text-orange-600 hover:bg-orange-50"
              >
                <TrendingUp className="w-4 h-4 mr-2" />
                Contacter un expert
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Section d'information */}
      <Card className="bg-gradient-to-r from-slate-50 to-blue-50 border-slate-200">
        <CardContent className="p-6">
          <div className="text-center">
            <h3 className="text-lg font-semibold text-slate-800 mb-3">
              Pourquoi aucune opportunité n'a été détectée ?
            </h3>
            <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto text-left">
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                  <p className="text-slate-700 text-sm">
                    <strong>Données incomplètes :</strong> Certaines informations peuvent manquer pour une analyse complète
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                  <p className="text-slate-700 text-sm">
                    <strong>Situation optimisée :</strong> Votre entreprise pourrait déjà être bien optimisée
                  </p>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                  <p className="text-slate-700 text-sm">
                    <strong>Éligibilité spécifique :</strong> Certaines optimisations nécessitent des critères particuliers
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                  <p className="text-slate-700 text-sm">
                    <strong>Évolution récente :</strong> De nouvelles opportunités peuvent apparaître avec le temps
                  </p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Call-to-action final */}
      <div className="text-center">
        <p className="text-slate-600 mb-4">
          Notre équipe d'experts est là pour vous accompagner dans votre recherche d'optimisation
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button 
            onClick={() => navigate("/experts-verifies")}
            variant="outline"
            className="border-blue-600 text-blue-600 hover:bg-blue-50"
          >
            Découvrir nos experts
          </Button>
          <Button 
            onClick={() => navigate("/a-propos")}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
          >
            En savoir plus
          </Button>
        </div>
      </div>
    </div>
  );
} 