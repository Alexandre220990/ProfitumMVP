import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, Shield, Calculator, Clock, CheckCircle, ArrowRight } from "lucide-react";
import PublicHeader from "@/components/PublicHeader";

export default function EconomiesGaranties() { return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-100">
      {/* Header avec navigation */ }
      <PublicHeader />

      { /* Hero Section */ }
      <section className="py-16 px-6">
        <div className="container mx-auto text-center">
          <div className="flex justify-center mb-6">
            <div className="bg-orange-100 p-4 rounded-full">
              <TrendingUp className="w-16 h-16 text-orange-600" />
            </div>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-orange-900 mb-6">
            Économies Garanties
          </h1>
          <p className="text-xl text-orange-700 mb-8 max-w-3xl mx-auto">
            Découvrez comment nos services permettent en moyenne de réduire vos charges de 15% 
            avec une garantie de résultats mesurables et prouvés.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button className="bg-orange-600 hover:bg-orange-700 text-white px-8 py-3 text-lg">
              Garantir mes économies
            </Button>
            <Button variant="outline" className="border-orange-600 text-orange-600 hover:bg-orange-50 px-8 py-3 text-lg">
              Calculer mes gains
            </Button>
          </div>
        </div>
      </section>

      { /* Section Évangélisation *, / }
      <section className="py-16 px-6 bg-white">
        <div className="container mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-orange-900 mb-6">
                La garantie qui transforme vos finances
              </h2>
              <div className="space-y-4 text-orange-800">
                <p className="text-lg leading-relaxed">
                  <strong>15% d'économies en moyenne</strong> - ce n'est pas une promesse, 
                  c'est notre engagement. Chez Profitum, nous ne nous contentons pas de 
                  vous accompagner, nous garantissons vos résultats.
                </p>
                <p className="text-lg leading-relaxed">
                  <strong>Comment ?</strong> Grâce à notre approche data-driven et notre 
                  expertise pointue, nous identifions systématiquement les opportunités 
                  d'optimisation que vous ne soupçonnez même pas.
                </p>
                <p className="text-lg leading-relaxed">
                  <strong>Résultat ?</strong> Des économies concrètes, mesurables et 
                  durables. Nos clients économisent en moyenne 15% sur leurs charges, 
                  avec des gains pouvant atteindre 40% dans certains cas.
                </p>
              </div>
            </div>
            <div className="bg-orange-50 p-8 rounded-2xl">
              <div className="grid grid-cols-2 gap-6">
                <div className="text-center">
                  <div className="bg-orange-100 p-4 rounded-full w-16 h-16 mx-auto mb-3 flex items-center justify-center">
                    <Percent className="w-8 h-8 text-orange-600" />
                  </div>
                  <h3 className="font-semibold text-orange-900 mb-2">15% en moyenne</h3>
                  <p className="text-sm text-orange-700">Économies garanties</p>
                </div>
                <div className="text-center">
                  <div className="bg-orange-100 p-4 rounded-full w-16 h-16 mx-auto mb-3 flex items-center justify-center">
                    <Shield className="w-8 h-8 text-orange-600" />
                  </div>
                  <h3 className="font-semibold text-orange-900 mb-2">Garantie Résultats</h3>
                  <p className="text-sm text-orange-700">Ou remboursé</p>
                </div>
                <div className="text-center">
                  <div className="bg-orange-100 p-4 rounded-full w-16 h-16 mx-auto mb-3 flex items-center justify-center">
                    <Clock className="w-8 h-8 text-orange-600" />
                  </div>
                  <h3 className="font-semibold text-orange-900 mb-2">Résultats Rapides</h3>
                  <p className="text-sm text-orange-700">Dès 3 mois</p>
                </div>
                <div className="text-center">
                  <div className="bg-orange-100 p-4 rounded-full w-16 h-16 mx-auto mb-3 flex items-center justify-center">
                    <Target className="w-8 h-8 text-orange-600" />
                  </div>
                  <h3 className="font-semibold text-orange-900 mb-2">Mesurables</h3>
                  <p className="text-sm text-orange-700">Suivi en temps réel</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      { /* Méthodologie */ }
      <section className="py-16 px-6 bg-orange-50">
        <div className="container mx-auto">
          <h2 className="text-3xl font-bold text-center text-orange-900 mb-12">
            Notre méthodologie pour garantir vos économies
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <Card className="border-orange-200 hover:shadow-lg transition-shadow">
              <CardHeader className="text-center">
                <div className="bg-orange-100 p-3 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                  <span className="text-2xl font-bold text-orange-600">1</span>
                </div>
                <CardTitle className="text-orange-900">Audit Complet</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-orange-700">
                  Analyse approfondie de vos charges et identification de toutes 
                  les opportunités d'optimisation disponibles.
                </p>
              </CardContent>
            </Card>

            <Card className="border-orange-200 hover:shadow-lg transition-shadow">
              <CardHeader className="text-center">
                <div className="bg-orange-100 p-3 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                  <span className="text-2xl font-bold text-orange-600">2</span>
                </div>
                <CardTitle className="text-orange-900">Stratégie Personnalisée</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-orange-700">
                  Élaboration d'un plan d'action sur-mesure avec des objectifs 
                  précis et des échéances réalistes.
                </p>
              </CardContent>
            </Card>

            <Card className="border-orange-200 hover:shadow-lg transition-shadow">
              <CardHeader className="text-center">
                <div className="bg-orange-100 p-3 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                  <span className="text-2xl font-bold text-orange-600">3</span>
                </div>
                <CardTitle className="text-orange-900">Mise en Œuvre</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-orange-700">
                  Exécution de votre stratégie d'optimisation avec un suivi 
                  rigoureux et des ajustements en temps réel.
                </p>
              </CardContent>
            </Card>

            <Card className="border-orange-200 hover:shadow-lg transition-shadow">
              <CardHeader className="text-center">
                <div className="bg-orange-100 p-3 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                  <span className="text-2xl font-bold text-orange-600">4</span>
                </div>
                <CardTitle className="text-orange-900">Mesure & Garantie</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-orange-700">
                  Suivi des résultats et garantie de vos économies. Si nous n'atteignons 
                  pas nos objectifs, nous vous remboursons.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      { /* Garanties concrètes */ }
      <section className="py-16 px-6 bg-white">
        <div className="container mx-auto">
          <h2 className="text-3xl font-bold text-center text-orange-900 mb-12">
            Nos garanties concrètes
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-orange-50 p-6 rounded-xl border border-orange-200">
              <div className="bg-orange-100 p-3 rounded-full w-12 h-12 mb-4 flex items-center justify-center">
                <Shield className="w-6 h-6 text-orange-600" />
              </div>
              <h3 className="text-xl font-semibold text-orange-900 mb-3">Garantie 15%</h3>
              <p className="text-orange-700 mb-4">
                Nous garantissons 15% d'économies en moyenne sur vos charges. 
                Si nous n'atteignons pas cet objectif, nous vous remboursons.
              </p>
              <ul className="space-y-2 text-sm text-orange-600">
                <li className="flex items-center">
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Objectif mesurable
                </li>
                <li className="flex items-center">
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Remboursement garanti
                </li>
                <li className="flex items-center">
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Suivi transparent
                </li>
              </ul>
            </div>

            <div className="bg-orange-50 p-6 rounded-xl border border-orange-200">
              <div className="bg-orange-100 p-3 rounded-full w-12 h-12 mb-4 flex items-center justify-center">
                <Clock className="w-6 h-6 text-orange-600" />
              </div>
              <h3 className="text-xl font-semibold text-orange-900 mb-3">Résultats Rapides</h3>
              <p className="text-orange-700 mb-4">
                Premiers résultats visibles dès 3 mois. Économies complètes 
                réalisées en moyenne en 6 à 12 mois.
              </p>
              <ul className="space-y-2 text-sm text-orange-600">
                <li className="flex items-center">
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Délai de 3 mois
                </li>
                <li className="flex items-center">
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Progression continue
                </li>
                <li className="flex items-center">
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Optimisation durable
                </li>
              </ul>
            </div>

            <div className="bg-orange-50 p-6 rounded-xl border border-orange-200">
              <div className="bg-orange-100 p-3 rounded-full w-12 h-12 mb-4 flex items-center justify-center">
                <Calculator className="w-6 h-6 text-orange-600" />
              </div>
              <h3 className="text-xl font-semibold text-orange-900 mb-3">Mesure Précise</h3>
              <p className="text-orange-700 mb-4">
                Suivi en temps réel de vos économies avec des métriques précises 
                et des rapports détaillés mensuels.
              </p>
              <ul className="space-y-2 text-sm text-orange-600">
                <li className="flex items-center">
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Dashboard en temps réel
                </li>
                <li className="flex items-center">
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Rapports mensuels
                </li>
                <li className="flex items-center">
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Métriques détaillées
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      { /* Statistiques */ }
      <section className="py-16 px-6 bg-orange-50">
        <div className="container mx-auto">
          <h2 className="text-3xl font-bold text-center text-orange-900 mb-12">
            Les chiffres qui parlent d'eux-mêmes
          </h2>
          <div className="grid md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="text-4xl font-bold text-orange-600 mb-2">15%</div>
              <div className="text-orange-700 font-semibold">Économies moyennes</div>
              <p className="text-sm text-orange-600 mt-2">Garanties sur vos charges</p>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-orange-600 mb-2">500+</div>
              <div className="text-orange-700 font-semibold">Clients satisfaits</div>
              <p className="text-sm text-orange-600 mt-2">Qui ont réalisé des économies</p>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-orange-600 mb-2">3 mois</div>
              <div className="text-orange-700 font-semibold">Délai moyen</div>
              <p className="text-sm text-orange-600 mt-2">Pour voir les premiers résultats</p>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-orange-600 mb-2">100%</div>
              <div className="text-orange-700 font-semibold">Satisfaction</div>
              <p className="text-sm text-orange-600 mt-2">Ou remboursement garanti</p>
            </div>
          </div>
        </div>
      </section>

      {/* Témoignages */}
      <section className="py-16 px-6 bg-white">
        <div className="container mx-auto">
          <h2 className="text-3xl font-bold text-center text-orange-900 mb-12">
            Nos clients témoignent de leurs économies garanties
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-orange-50 p-6 rounded-xl border border-orange-200">
              <div className="text-center mb-4">
                <div className="text-3xl font-bold text-orange-600 mb-2">18%</div>
                <div className="text-orange-700 font-semibold">d'économies en 6 mois</div>
              </div>
              <p className="text-orange-700 mb-4 italic">
                "Profitum a tenu sa promesse : 18% d'économies en seulement 6 mois ! 
                Leur garantie nous a donné confiance dès le début."
              </p>
              <div className="font-semibold text-orange-900">Sophie Martin</div>
              <div className="text-sm text-orange-600">Directrice Financière - TechCorp</div>
            </div>

            <div className="bg-orange-50 p-6 rounded-xl border border-orange-200">
              <div className="text-center mb-4">
                <div className="text-3xl font-bold text-orange-600 mb-2">22%</div>
                <div className="text-orange-700 font-semibold">d'économies en 8 mois</div>
              </div>
              <p className="text-orange-700 mb-4 italic">
                "22% d'économies garanties et réalisées ! Profitum a transformé 
                notre gestion des coûts avec une approche professionnelle."
              </p>
              <div className="font-semibold text-orange-900">Pierre Dubois</div>
              <div className="text-sm text-orange-600">CEO - InnovationStart</div>
            </div>

            <div className="bg-orange-50 p-6 rounded-xl border border-orange-200">
              <div className="text-center mb-4">
                <div className="text-3xl font-bold text-orange-600 mb-2">16%</div>
                <div className="text-orange-700 font-semibold">d'économies en 4 mois</div>
              </div>
              <p className="text-orange-700 mb-4 italic">
                "16% d'économies en seulement 4 mois ! La garantie Profitum 
                nous a permis de nous lancer en toute confiance."
              </p>
              <div className="font-semibold text-orange-900">Marie Leroy</div>
              <div className="text-sm text-orange-600">Entrepreneure - GreenTech</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-6 bg-gradient-to-r from-orange-600 to-orange-800 text-white">
        <div className="container mx-auto text-center">
          <h2 className="text-3xl font-bold mb-6">
            Prêt à garantir 15% d'économies sur vos charges ?
          </h2>
          <p className="text-xl mb-8 text-orange-100">
            Rejoignez les centaines d'entreprises qui bénéficient déjà de nos économies 
            garanties et transformez vos coûts en opportunités de croissance.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button className="bg-white text-orange-700 hover:bg-orange-50 px-8 py-3 text-lg font-semibold">
              Garantir mes économies
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
            <Button variant="outline" className="border-white text-white hover:bg-white hover:text-orange-700 px-8 py-3 text-lg">
              Calculer mes gains potentiels
            </Button>
          </div>
          <p className="text-sm text-orange-200 mt-4">
            🎯 Inscription gratuite • 🎯 Garantie 15% • 🎯 Satisfaction ou remboursé
          </p>
        </div>
      </section>
    </div>
  )
} 