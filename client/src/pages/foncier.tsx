import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { 
  Home,
  ArrowRight,
  CheckCircle2,
  TrendingUp,
  ShieldCheck,
  FileText,
  Calculator,
  ChevronDown,
  Building
} from "lucide-react";
import PublicHeader from '@/components/PublicHeader';
import { useState } from "react";

export default function FoncierPage() {
  const navigate = useNavigate();
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const faqItems = [
    {
      question: "Quels types d'erreurs peut-on identifier sur les taxes foncières ?",
      answer: "L'analyse des taxes foncières peut révéler plusieurs types d'erreurs : erreurs dans la base d'imposition, valeurs cadastrales surévaluées, erreurs dans le calcul des surfaces, erreurs dans l'application des abattements, et bien d'autres anomalies qui impactent le montant de vos taxes."
    },
    {
      question: "Combien de temps prend l'analyse des taxes foncières ?",
      answer: "Le délai moyen d'analyse est de 2 semaines. Ce délai peut varier selon la complexité de votre situation, le nombre de biens à analyser et le volume de documents à examiner. Notre équipe vous tient informé de l'avancement à chaque étape."
    },
    {
      question: "Quels documents sont nécessaires ?",
      answer: "Les documents nécessaires incluent vos avis d'imposition foncière, vos titres de propriété, les plans de vos biens, les évaluations cadastrales, et tout document relatif à vos biens immobiliers. Notre plateforme vous guide dans la collecte sécurisée de ces documents."
    },
    {
      question: "Peut-on contester les taxes des années précédentes ?",
      answer: "Oui, sous certaines conditions, il est possible de contester les taxes foncières pour les années précédentes. Les délais de prescription varient selon les situations. Notre équipe d'experts évalue votre éligibilité rétroactive lors de l'analyse initiale."
    },
    {
      question: "Y a-t-il des risques à contester ses taxes foncières ?",
      answer: "Non, contester ses taxes foncières est un droit légal. Notre accompagnement respecte strictement la réglementation en vigueur. Nous préparons des dossiers solides et argumentés pour maximiser vos chances de succès tout en sécurisant votre situation."
    }
  ];

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-gradient-to-br from-slate-50 via-white to-orange-50">
      <PublicHeader />
      
      {/* Hero Section */}
      <section className="relative py-16 sm:py-20 md:py-24 lg:py-28 bg-gradient-to-br from-orange-50 via-white to-amber-50 overflow-hidden">
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-orange-500 to-amber-500 rounded-full -translate-y-48 translate-x-48"></div>
        </div>
        
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-orange-600/10 to-amber-600/10 border border-orange-200 text-orange-700 px-4 sm:px-6 py-2 sm:py-3 rounded-full text-xs sm:text-sm font-semibold mb-6 sm:mb-8">
              <Home className="w-4 h-4" />
              <span>Solution d'optimisation financière</span>
            </div>
            
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-slate-900 mb-4 sm:mb-6 leading-tight">
              Analyse experte de vos <span className="bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent">taxes foncières</span> pour identifier les économies possibles
            </h1>
            
            <p className="text-base sm:text-lg md:text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed mb-8 sm:mb-10">
              Optimisez vos taxes foncières et immobilières grâce à notre expertise. Identification des erreurs, contestations et optimisations légales pour réduire vos impôts fonciers.
            </p>
            
            <Button 
              onClick={() => navigate('/simulateur')}
              className="bg-gradient-to-r from-orange-600 to-amber-600 text-white px-8 sm:px-10 py-3 sm:py-4 rounded-xl font-semibold hover:from-orange-700 hover:to-amber-700 transition-all duration-300 transform hover:-translate-y-1 hover:shadow-xl text-base sm:text-lg"
            >
              <span className="flex items-center gap-2">
                Simulez votre éligibilité
                <ArrowRight className="w-5 h-5" />
              </span>
            </Button>
          </div>
        </div>
      </section>

      {/* Section 1 : Qu'est-ce que l'optimisation des taxes foncières ? */}
      <section className="py-12 sm:py-16 md:py-20 lg:py-24 bg-white">
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-slate-900 mb-6 sm:mb-8 text-center">
              Comprendre les taxes foncières et immobilières
            </h2>
            
            <div className="prose prose-slate max-w-none">
              <p className="text-base sm:text-lg text-slate-600 leading-relaxed mb-6">
                Les <strong className="text-slate-900">taxes foncières et immobilières</strong> représentent un coût important pour les propriétaires. Une analyse experte permet d'identifier les erreurs d'évaluation, les contestations possibles et les optimisations légales pour réduire ces impôts.
              </p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mt-8">
                <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-2xl p-6 border border-orange-100">
                  <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-amber-500 rounded-xl flex items-center justify-center mb-4">
                    <FileText className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="font-semibold text-slate-900 mb-2">Analyse des bases</h3>
                  <p className="text-sm text-slate-600">Analyse des bases d'imposition</p>
                </div>
                
                <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-2xl p-6 border border-orange-100">
                  <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-amber-500 rounded-xl flex items-center justify-center mb-4">
                    <Calculator className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="font-semibold text-slate-900 mb-2">Détection d'erreurs</h3>
                  <p className="text-sm text-slate-600">Identification des erreurs d'évaluation</p>
                </div>
                
                <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-2xl p-6 border border-orange-100">
                  <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-amber-500 rounded-xl flex items-center justify-center mb-4">
                    <Building className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="font-semibold text-slate-900 mb-2">Contestation</h3>
                  <p className="text-sm text-slate-600">Contestation des valeurs cadastrales</p>
                </div>
                
                <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-2xl p-6 border border-orange-100">
                  <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-amber-500 rounded-xl flex items-center justify-center mb-4">
                    <ShieldCheck className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="font-semibold text-slate-900 mb-2">Optimisation légale</h3>
                  <p className="text-sm text-slate-600">Optimisation légale des taxes</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section 2 : Pourquoi optimiser vos taxes foncières ? */}
      <section className="py-12 sm:py-16 md:py-20 lg:py-24 bg-gradient-to-br from-slate-50 via-white to-orange-50">
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-slate-900 mb-6 sm:mb-8 text-center">
              Les avantages de l'optimisation des taxes foncières
            </h2>
            
            <p className="text-base sm:text-lg text-slate-600 leading-relaxed mb-8 sm:mb-10 text-center">
              Une optimisation bien menée peut générer des économies significatives sur vos taxes foncières et immobilières.
            </p>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-8">
              <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                <div className="w-14 h-14 bg-gradient-to-br from-orange-500 to-amber-500 rounded-xl flex items-center justify-center mb-4">
                  <TrendingUp className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-slate-900 mb-3">Réduction immédiate</h3>
                <p className="text-slate-600 leading-relaxed">Réduisez immédiatement vos impôts fonciers en identifiant les erreurs et optimisations applicables.</p>
              </div>
              
              <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                <div className="w-14 h-14 bg-gradient-to-br from-orange-500 to-amber-500 rounded-xl flex items-center justify-center mb-4">
                  <FileText className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-slate-900 mb-3">Correction des erreurs</h3>
                <p className="text-slate-600 leading-relaxed">Corrigez les erreurs d'évaluation présentes dans vos bases d'imposition pour réduire vos taxes.</p>
              </div>
              
              <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                <div className="w-14 h-14 bg-gradient-to-br from-orange-500 to-amber-500 rounded-xl flex items-center justify-center mb-4">
                  <Building className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-slate-900 mb-3">Contestation des valeurs</h3>
                <p className="text-slate-600 leading-relaxed">Contestez les valeurs cadastrales surévaluées pour obtenir une réduction de vos taxes.</p>
              </div>
              
              <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                <div className="w-14 h-14 bg-gradient-to-br from-orange-500 to-amber-500 rounded-xl flex items-center justify-center mb-4">
                  <ShieldCheck className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-slate-900 mb-3">Optimisation légale</h3>
                <p className="text-slate-600 leading-relaxed">Optimisez légalement vos taxes dans le respect de la réglementation en vigueur.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section 3 : Qui est concerné ? */}
      <section className="py-12 sm:py-16 md:py-20 lg:py-24 bg-white">
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-slate-900 mb-6 sm:mb-8 text-center">
              Votre bien immobilier peut-il être optimisé ?
            </h2>
            
            <p className="text-base sm:text-lg text-slate-600 leading-relaxed mb-8 sm:mb-10 text-center">
              Tous les propriétaires de biens immobiliers (terrain, bâtiment, local professionnel) peuvent bénéficier d'une analyse de leurs taxes foncières.
            </p>
            
            <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-3xl p-6 sm:p-8 md:p-10 border border-orange-100 mb-8 sm:mb-10">
              <h3 className="text-xl sm:text-2xl font-semibold text-slate-900 mb-6">Critères d'éligibilité</h3>
              
              <div className="space-y-4">
                {[
                  "Propriétaire de biens immobiliers",
                  "Paiement de taxes foncières",
                  "Tous types de biens (résidentiel, professionnel, commercial)",
                  "Historique de taxes à analyser"
                ].map((criteria, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-6 h-6 bg-gradient-to-br from-orange-500 to-amber-500 rounded-lg flex items-center justify-center mt-0.5">
                      <CheckCircle2 className="w-4 h-4 text-white" />
                    </div>
                    <p className="text-slate-700 leading-relaxed flex-1">{criteria}</p>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="text-center">
              <Button 
                onClick={() => navigate('/simulateur')}
                className="bg-gradient-to-r from-orange-600 to-amber-600 text-white px-8 sm:px-10 py-3 sm:py-4 rounded-xl font-semibold hover:from-orange-700 hover:to-amber-700 transition-all duration-300 transform hover:-translate-y-1 hover:shadow-xl"
              >
                <span className="flex items-center gap-2">
                  Vérifiez votre éligibilité en 2 minutes
                  <ArrowRight className="w-5 h-5" />
                </span>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Section 4 : Notre accompagnement */}
      <section className="py-12 sm:py-16 md:py-20 lg:py-24 bg-gradient-to-br from-slate-50 via-white to-orange-50">
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-slate-900 mb-6 sm:mb-8 text-center">
              Une expertise dédiée aux taxes foncières
            </h2>
            
            <p className="text-base sm:text-lg text-slate-600 leading-relaxed mb-8 sm:mb-10 text-center">
              Profitum vous accompagne dans l'optimisation de vos taxes foncières avec une expertise reconnue en fiscalité immobilière.
            </p>
            
            <div className="space-y-6 sm:space-y-8">
              {[
                {
                  step: "1",
                  title: "Analyse détaillée de vos taxes foncières",
                  description: "Examen approfondi de toutes vos taxes foncières pour identifier les erreurs, les incohérences et les opportunités d'optimisation."
                },
                {
                  step: "2",
                  title: "Identification des erreurs d'évaluation",
                  description: "Détection systématique des erreurs dans les bases d'imposition, les valeurs cadastrales et les calculs de taxes."
                },
                {
                  step: "3",
                  title: "Préparation des contestations",
                  description: "Préparation complète des dossiers de contestation avec argumentation solide et documentation appropriée."
                },
                {
                  step: "4",
                  title: "Accompagnement dans les démarches",
                  description: "Support complet dans toutes les démarches administratives jusqu'à l'obtention des résultats."
                }
              ].map((item, index) => (
                <div key={index} className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-sm hover:shadow-md transition-all">
                  <div className="flex items-start gap-4 sm:gap-6">
                    <div className="flex-shrink-0 w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-orange-500 to-amber-500 rounded-xl flex items-center justify-center text-white font-bold text-lg sm:text-xl">
                      {item.step}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl sm:text-2xl font-semibold text-slate-900 mb-2 sm:mb-3">
                        {item.title}
                      </h3>
                      <p className="text-slate-600 leading-relaxed">
                        {item.description}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="mt-10 sm:mt-12 grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="bg-white rounded-2xl p-6 border border-slate-200">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-amber-500 rounded-lg flex items-center justify-center">
                    <ShieldCheck className="w-5 h-5 text-white" />
                  </div>
                  <h4 className="font-semibold text-slate-900">Expertise en fiscalité immobilière</h4>
                </div>
                <p className="text-slate-600 text-sm">Connaissance approfondie de la réglementation fiscale immobilière.</p>
              </div>
              
              <div className="bg-white rounded-2xl p-6 border border-slate-200">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-amber-500 rounded-lg flex items-center justify-center">
                    <FileText className="w-5 h-5 text-white" />
                  </div>
                  <h4 className="font-semibold text-slate-900">Analyse complète de votre situation</h4>
                </div>
                <p className="text-slate-600 text-sm">Examen détaillé de tous vos biens et taxes pour une optimisation maximale.</p>
              </div>
              
              <div className="bg-white rounded-2xl p-6 border border-slate-200">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-amber-500 rounded-lg flex items-center justify-center">
                    <Building className="w-5 h-5 text-white" />
                  </div>
                  <h4 className="font-semibold text-slate-900">Préparation des dossiers de contestation</h4>
                </div>
                <p className="text-slate-600 text-sm">Dossiers solides et argumentés pour maximiser vos chances de succès.</p>
              </div>
              
              <div className="bg-white rounded-2xl p-6 border border-slate-200">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-amber-500 rounded-lg flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-white" />
                  </div>
                  <h4 className="font-semibold text-slate-900">Suivi jusqu'à l'obtention des résultats</h4>
                </div>
                <p className="text-slate-600 text-sm">Accompagnement complet jusqu'à la réduction effective de vos taxes.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section 5 : FAQ */}
      <section className="py-12 sm:py-16 md:py-20 lg:py-24 bg-gradient-to-br from-slate-50 via-white to-orange-50">
        <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-slate-900 mb-6 sm:mb-8 text-center">
            Questions fréquentes sur les taxes foncières
          </h2>
          
          <div className="space-y-4">
            {faqItems.map((item, index) => (
              <div key={index} className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                <button
                  onClick={() => toggleFaq(index)}
                  className="w-full flex items-center justify-between p-6 text-left hover:bg-slate-50 transition-colors"
                >
                  <span className="font-semibold text-slate-900 pr-4">{item.question}</span>
                  <ChevronDown 
                    className={`w-5 h-5 text-slate-600 flex-shrink-0 transition-transform ${
                      openFaq === index ? 'transform rotate-180' : ''
                    }`}
                  />
                </button>
                {openFaq === index && (
                  <div className="px-6 pb-6">
                    <p className="text-slate-600 leading-relaxed">{item.answer}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Section CTA finale */}
      <section className="py-12 sm:py-16 md:py-20 lg:py-24 bg-gradient-to-br from-orange-600 to-amber-600">
        <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-4 sm:mb-6">
            Prêt à réduire vos taxes foncières ?
          </h2>
          
          <p className="text-base sm:text-lg text-orange-50 mb-8 sm:mb-10 max-w-2xl mx-auto leading-relaxed">
            Découvrez en quelques clics si vous pouvez optimiser vos taxes foncières. Simulation gratuite et sans engagement.
          </p>
          
          <Button 
            onClick={() => navigate('/simulateur')}
            className="bg-white text-orange-600 px-8 sm:px-10 py-3 sm:py-4 rounded-xl font-semibold hover:bg-orange-50 transition-all duration-300 transform hover:-translate-y-1 hover:shadow-xl text-base sm:text-lg"
          >
            <span className="flex items-center gap-2">
              Simulez votre éligibilité
              <ArrowRight className="w-5 h-5" />
            </span>
          </Button>
        </div>
      </section>
    </div>
  );
}

