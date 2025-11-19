import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Target, Shield, Users, Award, TrendingUp, CheckCircle, Sparkles } from "lucide-react";
import PublicHeader from '@/components/PublicHeader';

export default function About() {
  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-gradient-to-br from-slate-50 via-white to-blue-50">
      <PublicHeader />

      {/* Hero Section */}
      <section className="relative py-12 sm:py-16 md:py-20 lg:py-24 bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-96 h-96 bg-white rounded-full -translate-y-48 translate-x-48"></div>
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-white rounded-full translate-y-48 -translate-x-48"></div>
        </div>
        
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl mb-6">
              <Sparkles className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-white mb-6">
              À propos de Profitum
            </h1>
            <p className="text-xl sm:text-2xl text-blue-100 leading-relaxed">
              Votre partenaire de confiance pour optimiser vos aides et subventions d'entreprise
            </p>
          </div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-12 sm:py-16 md:py-20 lg:py-24">
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center mb-20">
            <div>
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-2xl mb-6 shadow-lg">
                <Target className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-6">
                Notre Mission
              </h2>
              <p className="text-lg text-slate-600 leading-relaxed mb-4">
                Profitum est né d'une conviction simple : toute entreprise mérite d'accéder facilement aux aides et optimisations fiscales qui lui sont destinées.
              </p>
              <p className="text-lg text-slate-600 leading-relaxed">
                Notre plateforme connecte les entreprises avec des experts certifiés pour maximiser leurs opportunités d'optimisation fiscale et sociale, tout en garantissant une conformité totale.
              </p>
            </div>
            
            <div className="bg-white p-8 sm:p-10 rounded-3xl shadow-xl border border-slate-200">
              <div className="space-y-6">
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0 w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                    <CheckCircle className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900 mb-2 text-lg">Simplicité</h3>
                    <p className="text-slate-600 leading-relaxed">
                      Un processus intuitif et guidé pour identifier vos opportunités
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0 w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                    <CheckCircle className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900 mb-2 text-lg">Expertise</h3>
                    <p className="text-slate-600 leading-relaxed">
                      Un réseau d'experts certifiés et spécialisés à votre service
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0 w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                    <CheckCircle className="w-6 h-6 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900 mb-2 text-lg">Transparence</h3>
                    <p className="text-slate-600 leading-relaxed">
                      Une visibilité totale sur vos dossiers et leur avancement
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Valeurs Section */}
          <div className="mb-20">
            <div className="text-center mb-12">
              <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">
                Nos Valeurs
              </h2>
              <p className="text-lg text-slate-600 max-w-2xl mx-auto">
                Les principes qui guident notre action au quotidien
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
              <div className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border border-slate-200 group">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl mb-6 group-hover:scale-110 transition-transform duration-300">
                  <Shield className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-slate-900 mb-3">
                  Sécurité & Conformité
                </h3>
                <p className="text-slate-600 leading-relaxed">
                  Nous garantissons la protection de vos données et une conformité totale avec les réglementations en vigueur.
                </p>
              </div>

              <div className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border border-slate-200 group">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl mb-6 group-hover:scale-110 transition-transform duration-300">
                  <Users className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-slate-900 mb-3">
                  Accompagnement Personnalisé
                </h3>
                <p className="text-slate-600 leading-relaxed">
                  Chaque entreprise est unique. Nos experts vous accompagnent avec des solutions sur mesure.
                </p>
              </div>

              <div className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border border-slate-200 group">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl mb-6 group-hover:scale-110 transition-transform duration-300">
                  <TrendingUp className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-slate-900 mb-3">
                  Performance & Résultats
                </h3>
                <p className="text-slate-600 leading-relaxed">
                  Notre objectif : maximiser vos retombées financières et optimiser votre trésorerie.
                </p>
              </div>
            </div>
          </div>

          {/* Notre Expertise Section */}
          <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white rounded-3xl p-8 sm:p-12 lg:p-16 mb-20 shadow-2xl">
            <div className="text-center mb-12">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-white/10 backdrop-blur-sm rounded-2xl mb-6">
                <Award className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold mb-4">
                Notre Expertise
              </h2>
              <p className="text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed">
                Profitum couvre l'ensemble des dispositifs d'optimisation fiscale et sociale pour les entreprises françaises
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {[
                "Crédit d'Impôt Recherche (CIR)",
                "Certificats d'Économies d'Énergie (CEE)",
                "Remboursement TICPE",
                "Optimisation URSSAF",
                "Optimisation MSA",
                "Déficit Foncier Stratégique",
                "Audit énergétique",
                "Optimisation comptable",
                "Accompagnement social"
              ].map((expertise, index) => (
                <div key={index} className="flex items-center space-x-3 bg-white/5 backdrop-blur-sm rounded-xl p-4 hover:bg-white/10 transition-all duration-300">
                  <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
                  <span className="text-slate-200">{expertise}</span>
                </div>
              ))}
            </div>
          </div>

          {/* CTA Section */}
          <div className="text-center bg-gradient-to-br from-blue-50 to-indigo-50 rounded-3xl p-8 sm:p-12 lg:p-16 border border-blue-100">
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">
              Prêt à optimiser votre entreprise ?
            </h2>
            <p className="text-xl text-slate-600 mb-8 sm:mb-10 max-w-2xl mx-auto leading-relaxed">
              Découvrez vos opportunités en quelques minutes ou contactez-nous directement pour un accompagnement personnalisé
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4 sm:gap-6">
              <Link to="/simulateur">
                <Button className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 px-8 py-6 text-lg font-medium shadow-lg hover:shadow-xl transition-all duration-300 w-full sm:w-auto">
                  Effectuer une simulation
                </Button>
              </Link>
              <Link to="/contact">
                <Button variant="outline" className="border-2 border-blue-600 text-blue-600 hover:bg-blue-50 px-8 py-6 text-lg font-medium shadow-sm hover:shadow-md transition-all duration-300 w-full sm:w-auto">
                  Prendre contact
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
