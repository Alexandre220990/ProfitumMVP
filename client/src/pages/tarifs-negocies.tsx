import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Handshake, TrendingDown, Shield, Calculator, Users, Percent, Award, Zap, Target, ArrowRight, CheckCircle } from "lucide-react";
import PublicHeader from "@/components/PublicHeader";

interface Testimonial {
  savings: string;
  quote: string;
  name: string;
  position: string;
  company: string;
}

const testimonials: Testimonial[] = [
  {
    savings: "32%",
    quote: "Grâce aux tarifs négociés de Profitum, nous avons économisé 32% sur nos prestations comptables. Un vrai gain pour notre trésorerie !",
    name: "Thomas Leroy",
    position: "Directeur Financier",
    company: "StartupTech"
  },
  {
    savings: "28%",
    quote: "Les tarifs négociés de Profitum nous ont permis de réduire nos coûts de 28% sans sacrifier la qualité. Exceptionnel !",
    name: "Isabelle Moreau",
    position: "CEO",
    company: "InnovationLab"
  },
  {
    savings: "41%",
    quote: "41% d'économies sur nos prestations juridiques ! Profitum a transformé notre approche des coûts externes.",
    name: "Marc Dubois",
    position: "Entrepreneur",
    company: "GreenTech"
  }
];

export default function TarifsNegocies() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-green-100">
      {/* Header avec navigation */}
      <PublicHeader />

      {/* Hero Section */}
      <section className="py-16 px-6">
        <div className="container mx-auto text-center">
          <div className="flex justify-center mb-6">
            <div className="bg-green-100 p-4 rounded-full">
              <Handshake className="w-16 h-16 text-green-600" />
            </div>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-green-900 mb-6">
            Tarifs Négociés
          </h1>
          <p className="text-xl text-green-700 mb-8 max-w-3xl mx-auto">
            Découvrez comment nous obtenons les meilleurs prix du marché grâce à nos accords 
            exclusifs avec plus de 200 partenaires premium.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 text-lg">
              Économiser maintenant
            </Button>
            <Button variant="outline" className="border-green-600 text-green-600 hover:bg-green-50 px-8 py-3 text-lg">
              Voir nos tarifs
            </Button>
          </div>
        </div>
      </section>

      {/* Section Évangélisation */}
      <section className="py-16 px-6 bg-white">
        <div className="container mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-green-900 mb-6">
                Le pouvoir de la négociation collective
              </h2>
              <div className="space-y-4 text-green-800">
                <p className="text-lg leading-relaxed">
                  <strong>Imaginez avoir le pouvoir de négocier avec 200+ partenaires premium</strong> 
                  simultanément. C'est exactement ce que Profitum vous offre grâce à notre 
                  réseau d'experts et nos accords exclusifs.
                </p>
                <p className="text-lg leading-relaxed">
                  <strong>Nous transformons votre taille en avantage</strong>. En regroupant 
                  des milliers d'entreprises, nous obtenons des conditions que vous ne pourriez 
                  jamais négocier seul, même en tant que grand groupe.
                </p>
                <p className="text-lg leading-relaxed">
                  <strong>Résultat ?</strong> Des économies moyennes de 15% à 40% sur vos 
                  prestations, sans compromis sur la qualité. Nos partenaires nous font 
                  confiance, nous vous faisons confiance.
                </p>
              </div>
            </div>
            <div className="bg-green-50 p-8 rounded-2xl">
              <div className="grid grid-cols-2 gap-6">
                <div className="text-center">
                  <div className="bg-green-100 p-4 rounded-full w-16 h-16 mx-auto mb-3 flex items-center justify-center">
                    <Users className="w-8 h-8 text-green-600" />
                  </div>
                  <h3 className="font-semibold text-green-900 mb-2">200+ Partenaires</h3>
                  <p className="text-sm text-green-700">Réseau premium exclusif</p>
                </div>
                <div className="text-center">
                  <div className="bg-green-100 p-4 rounded-full w-16 h-16 mx-auto mb-3 flex items-center justify-center">
                    <Percent className="w-8 h-8 text-green-600" />
                  </div>
                  <h3 className="font-semibold text-green-900 mb-2">15-40% d'économies</h3>
                  <p className="text-sm text-green-700">Réductions garanties</p>
                </div>
                <div className="text-center">
                  <div className="bg-green-100 p-4 rounded-full w-16 h-16 mx-auto mb-3 flex items-center justify-center">
                    <Award className="w-8 h-8 text-green-600" />
                  </div>
                  <h3 className="font-semibold text-green-900 mb-2">Qualité Premium</h3>
                  <p className="text-sm text-green-700">Sans compromis</p>
                </div>
                <div className="text-center">
                  <div className="bg-green-100 p-4 rounded-full w-16 h-16 mx-auto mb-3 flex items-center justify-center">
                    <Zap className="w-8 h-8 text-green-600" />
                  </div>
                  <h3 className="font-semibold text-green-900 mb-2">Accès Immédiat</h3>
                  <p className="text-sm text-green-700">Tarifs dès l'inscription</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Avantages des tarifs négociés */}
      <section className="py-16 px-6 bg-green-50">
        <div className="container mx-auto">
          <h2 className="text-3xl font-bold text-center text-green-900 mb-12">
            Pourquoi nos tarifs négociés font la différence
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="border-green-200 hover:shadow-lg transition-shadow">
              <CardHeader className="text-center">
                <div className="bg-green-100 p-3 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                  <TrendingDown className="w-8 h-8 text-green-600" />
                </div>
                <CardTitle className="text-green-900">Économies Garanties</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-green-700">
                  Bénéficiez de réductions de 15% à 40% sur vos prestations grâce à 
                  notre pouvoir de négociation collective.
                </p>
              </CardContent>
            </Card>

            <Card className="border-green-200 hover:shadow-lg transition-shadow">
              <CardHeader className="text-center">
                <div className="bg-green-100 p-3 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                  <Shield className="w-8 h-8 text-green-600" />
                </div>
                <CardTitle className="text-green-900">Qualité Préservée</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-green-700">
                  Nos partenaires premium garantissent la même qualité d'expertise 
                  malgré les réductions de prix obtenues.
                </p>
              </CardContent>
            </Card>

            <Card className="border-green-200 hover:shadow-lg transition-shadow">
              <CardHeader className="text-center">
                <div className="bg-green-100 p-3 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                  <Zap className="w-8 h-8 text-green-600" />
                </div>
                <CardTitle className="text-green-900">Accès Immédiat</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-green-700">
                  Profitez instantanément de nos tarifs négociés dès votre inscription, 
                  sans délai d'attente ni processus complexe.
                </p>
              </CardContent>
            </Card>

            <Card className="border-green-200 hover:shadow-lg transition-shadow">
              <CardHeader className="text-center">
                <div className="bg-green-100 p-3 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                  <Target className="w-8 h-8 text-green-600" />
                </div>
                <CardTitle className="text-green-900">Transparence Totale</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-green-700">
                  Comparez nos tarifs avec ceux du marché en toute transparence. 
                  Aucun coût caché, aucune surprise.
                </p>
              </CardContent>
            </Card>

            <Card className="border-green-200 hover:shadow-lg transition-shadow">
              <CardHeader className="text-center">
                <div className="bg-green-100 p-3 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                  <Calculator className="w-8 h-8 text-green-600" />
                </div>
                <CardTitle className="text-green-900">Simulation Gratuite</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-green-700">
                  Calculez vos économies potentielles avant même de vous engager. 
                  Notre simulateur vous donne une estimation précise.
                </p>
              </CardContent>
            </Card>

            <Card className="border-green-200 hover:shadow-lg transition-shadow">
              <CardHeader className="text-center">
                <div className="bg-green-100 p-3 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                  <Handshake className="w-8 h-8 text-green-600" />
                </div>
                <CardTitle className="text-green-900">Relations Durables</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-green-700">
                  Bénéficiez de relations privilégiées avec nos partenaires grâce 
                  à notre approche collaborative et durable.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Comparaison de prix */}
      <section className="py-16 px-6 bg-white">
        <div className="container mx-auto">
          <h2 className="text-3xl font-bold text-center text-green-900 mb-12">
            Comparaison des tarifs : Avant vs Après Profitum
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-red-50 p-6 rounded-xl border border-red-200">
              <h3 className="text-xl font-semibold text-red-900 mb-4 text-center">Tarifs du Marché</h3>
              <div className="space-y-4">
                <div className="text-center">
                  <div className="text-3xl font-bold text-red-600 mb-2">100%</div>
                  <div className="text-red-700">Prix standard</div>
                </div>
                <ul className="space-y-2 text-sm text-red-600">
                  <li className="flex items-center">
                    <span className="w-2 h-2 bg-red-400 rounded-full mr-2"></span>
                    Négociation individuelle
                  </li>
                  <li className="flex items-center">
                    <span className="w-2 h-2 bg-red-400 rounded-full mr-2"></span>
                    Peu de pouvoir de négociation
                  </li>
                  <li className="flex items-center">
                    <span className="w-2 h-2 bg-red-400 rounded-full mr-2"></span>
                    Qualité variable
                  </li>
                  <li className="flex items-center">
                    <span className="w-2 h-2 bg-red-400 rounded-full mr-2"></span>
                    Pas de garantie de prix
                  </li>
                </ul>
              </div>
            </div>

            <div className="bg-green-50 p-6 rounded-xl border-2 border-green-400 relative">
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <span className="bg-green-600 text-white px-4 py-1 rounded-full text-sm font-semibold">
                  RECOMMANDÉ
                </span>
              </div>
              <h3 className="text-xl font-semibold text-green-900 mb-4 text-center">Avec Profitum</h3>
              <div className="space-y-4">
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600 mb-2">60-85%</div>
                  <div className="text-green-700">Prix négocié</div>
                </div>
                <ul className="space-y-2 text-sm text-green-600">
                  <li className="flex items-center">
                    <CheckCircle className="w-4 h-4 mr-2 text-green-600" />
                    Négociation collective
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-4 h-4 mr-2 text-green-600" />
                    Pouvoir de négociation fort
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-4 h-4 mr-2 text-green-600" />
                    Qualité premium garantie
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-4 h-4 mr-2 text-green-600" />
                    Tarifs fixes et transparents
                  </li>
                </ul>
              </div>
            </div>

            <div className="bg-blue-50 p-6 rounded-xl border border-blue-200">
              <h3 className="text-xl font-semibold text-blue-900 mb-4 text-center">Économies Réalisées</h3>
              <div className="space-y-4">
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600 mb-2">15-40%</div>
                  <div className="text-blue-700">Économies moyennes</div>
                </div>
                <ul className="space-y-2 text-sm text-blue-600">
                  <li className="flex items-center">
                    <CheckCircle className="w-4 h-4 mr-2 text-blue-600" />
                    Économies immédiates
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-4 h-4 mr-2 text-blue-600" />
                    ROI rapide
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-4 h-4 mr-2 text-blue-600" />
                    Qualité préservée
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-4 h-4 mr-2 text-blue-600" />
                    Satisfaction garantie
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Témoignages */}
      <section className="py-16 px-6 bg-green-50">
        <div className="container mx-auto">
          <h2 className="text-3xl font-bold text-center text-green-900 mb-12">
            Nos clients témoignent de leurs économies
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="bg-white p-6 rounded-xl shadow-md">
                <div className="text-center mb-4">
                  <div className="text-3xl font-bold text-green-600 mb-2">{testimonial.savings}</div>
                  <div className="text-green-700 font-semibold">d'économies réalisées</div>
                </div>
                <p className="text-green-700 mb-4 italic">
                  "{testimonial.quote}"
                </p>
                <div className="font-semibold text-green-900">{testimonial.name}</div>
                <div className="text-sm text-green-600">{testimonial.position} - {testimonial.company}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-6 bg-gradient-to-r from-green-600 to-green-800 text-white">
        <div className="container mx-auto text-center">
          <h2 className="text-3xl font-bold mb-6">
            Prêt à économiser 15% à 40% sur vos prestations ?
          </h2>
          <p className="text-xl mb-8 text-green-100">
            Rejoignez les milliers d'entreprises qui bénéficient déjà de nos tarifs négociés 
            et transformez vos coûts en opportunités d'investissement.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button className="bg-white text-green-700 hover:bg-green-50 px-8 py-3 text-lg font-semibold">
              Commencer à économiser
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
            <Button variant="outline" className="border-white text-white hover:bg-white hover:text-green-700 px-8 py-3 text-lg">
              Simuler mes économies
            </Button>
          </div>
          <p className="text-sm text-green-200 mt-4">
            💰 Inscription gratuite • 💰 Économies immédiates • 💰 Satisfaction garantie
          </p>
        </div>
      </section>
    </div>
  );
} 