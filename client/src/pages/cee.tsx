import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { 
  Sparkles,
  ArrowRight,
  CheckCircle2,
  TrendingUp,
  ShieldCheck,
  FileText,
  Calculator,
  ChevronDown,
  Home
} from "lucide-react";
import PublicHeader from '@/components/PublicHeader';
import { useState } from "react";

export default function CEEPage() {
  const navigate = useNavigate();
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const faqItems = [
    {
      question: "Quels travaux sont éligibles aux CEE ?",
      answer: "Les travaux éligibles aux CEE incluent l'isolation thermique, le remplacement de systèmes de chauffage, l'installation de systèmes de production d'énergie renouvelable, la ventilation, et bien d'autres travaux d'efficacité énergétique. La liste complète est définie par la réglementation."
    },
    {
      question: "Comment calculer le montant des primes CEE ?",
      answer: "Le montant des primes CEE dépend du type de travaux, de la surface concernée, et des performances énergétiques obtenues. Chaque type de travaux a un forfait spécifique. Notre expertise vous permet d'optimiser ce calcul pour maximiser votre prime."
    },
    {
      question: "Les CEE couvrent-ils tout le coût des travaux ?",
      answer: "Les CEE peuvent couvrir une partie significative du coût des travaux, généralement entre 20% et 40% selon le type de travaux et les performances énergétiques. Le montant exact dépend de votre situation et des travaux réalisés."
    },
    {
      question: "Quels documents sont nécessaires ?",
      answer: "Les documents nécessaires incluent les devis des travaux, les factures, les attestations de conformité, les certificats de performance énergétique, et tout document prouvant la réalisation des travaux éligibles. Notre plateforme vous guide dans la collecte sécurisée de ces documents."
    },
    {
      question: "Peut-on cumuler les CEE avec d'autres aides ?",
      answer: "Oui, les CEE peuvent généralement être cumulés avec d'autres aides publiques comme MaPrimeRénov, l'éco-PTZ, ou les aides locales, sous certaines conditions. Notre équipe analyse votre situation pour optimiser le cumul des aides."
    }
  ];

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-gradient-to-br from-slate-50 via-white to-green-50">
      <PublicHeader />
      
      {/* Hero Section */}
      <section className="relative py-16 sm:py-20 md:py-24 lg:py-28 bg-gradient-to-br from-green-50 via-white to-emerald-50 overflow-hidden">
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-green-500 to-emerald-500 rounded-full -translate-y-48 translate-x-48"></div>
        </div>
        
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-green-600/10 to-emerald-600/10 border border-green-200 text-green-700 px-4 sm:px-6 py-2 sm:py-3 rounded-full text-xs sm:text-sm font-semibold mb-6 sm:mb-8">
              <Sparkles className="w-4 h-4" />
              <span>Solution d'optimisation financière</span>
            </div>
            
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-slate-900 mb-4 sm:mb-6 leading-tight">
              Financez vos travaux d'efficacité énergétique avec les <span className="bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">Certificats d'Économie d'Énergie</span>
            </h1>
            
            <p className="text-base sm:text-lg md:text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed mb-8 sm:mb-10">
              Réduisez le coût de vos travaux de rénovation énergétique grâce aux CEE. Accompagnement complet pour obtenir le financement optimal de vos projets.
            </p>
            
            <Button 
              onClick={() => navigate('/simulateur')}
              className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-8 sm:px-10 py-3 sm:py-4 rounded-xl font-semibold hover:from-green-700 hover:to-emerald-700 transition-all duration-300 transform hover:-translate-y-1 hover:shadow-xl text-base sm:text-lg"
            >
              <span className="flex items-center gap-2">
                Simulez votre éligibilité
                <ArrowRight className="w-5 h-5" />
              </span>
            </Button>
          </div>
        </div>
      </section>

      {/* Section 1 : Qu'est-ce que les CEE ? */}
      <section className="py-12 sm:py-16 md:py-20 lg:py-24 bg-white">
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-slate-900 mb-6 sm:mb-8 text-center">
              Comprendre les Certificats d'Économie d'Énergie
            </h2>
            
            <div className="prose prose-slate max-w-none">
              <p className="text-base sm:text-lg text-slate-600 leading-relaxed mb-6">
                Les <strong className="text-slate-900">Certificats d'Économie d'Énergie (CEE)</strong> sont un dispositif permettant de financer partiellement ou totalement vos travaux d'efficacité énergétique. Les fournisseurs d'énergie sont obligés d'acheter ces certificats, ce qui génère des primes pour les travaux éligibles.
              </p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mt-8">
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-6 border border-green-100">
                  <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center mb-4">
                    <Sparkles className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="font-semibold text-slate-900 mb-2">Dispositif de financement</h3>
                  <p className="text-sm text-slate-600">Dispositif de financement des travaux énergétiques</p>
                </div>
                
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-6 border border-green-100">
                  <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center mb-4">
                    <TrendingUp className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="font-semibold text-slate-900 mb-2">Primes versées</h3>
                  <p className="text-sm text-slate-600">Primes versées par les fournisseurs d'énergie</p>
                </div>
                
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-6 border border-green-100">
                  <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center mb-4">
                    <Calculator className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="font-semibold text-slate-900 mb-2">Réduction des coûts</h3>
                  <p className="text-sm text-slate-600">Réduction du coût des travaux</p>
                </div>
                
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-6 border border-green-100">
                  <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center mb-4">
                    <Home className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="font-semibold text-slate-900 mb-2">Transition écologique</h3>
                  <p className="text-sm text-slate-600">Transition énergétique encouragée</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section 2 : Pourquoi bénéficier des CEE ? */}
      <section className="py-12 sm:py-16 md:py-20 lg:py-24 bg-gradient-to-br from-slate-50 via-white to-green-50">
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-slate-900 mb-6 sm:mb-8 text-center">
              Les avantages des Certificats d'Économie d'Énergie
            </h2>
            
            <p className="text-base sm:text-lg text-slate-600 leading-relaxed mb-8 sm:mb-10 text-center">
              Les CEE permettent de réduire significativement le coût de vos travaux de rénovation énergétique.
            </p>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-8">
              <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center mb-4">
                  <TrendingUp className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-slate-900 mb-3">Financement des travaux</h3>
                <p className="text-slate-600 leading-relaxed">Financez vos travaux d'efficacité énergétique en récupérant des primes CEE significatives.</p>
              </div>
              
              <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center mb-4">
                  <Calculator className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-slate-900 mb-3">Réduction immédiate</h3>
                <p className="text-slate-600 leading-relaxed">Réduisez immédiatement le coût de vos travaux en bénéficiant des primes CEE.</p>
              </div>
              
              <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center mb-4">
                  <Home className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-slate-900 mb-3">Amélioration énergétique</h3>
                <p className="text-slate-600 leading-relaxed">Améliorez l'efficacité énergétique de votre bâtiment tout en réduisant vos coûts.</p>
              </div>
              
              <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center mb-4">
                  <ShieldCheck className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-slate-900 mb-3">Valorisation du patrimoine</h3>
                <p className="text-slate-600 leading-relaxed">Valorisez votre patrimoine en améliorant ses performances énergétiques.</p>
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
              Vos travaux sont-ils éligibles aux CEE ?
            </h2>
            
            <p className="text-base sm:text-lg text-slate-600 leading-relaxed mb-8 sm:mb-10 text-center">
              Tous les travaux d'efficacité énergétique réalisés sur des bâtiments peuvent potentiellement bénéficier des CEE.
            </p>
            
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-3xl p-6 sm:p-8 md:p-10 border border-green-100 mb-8 sm:mb-10">
              <h3 className="text-xl sm:text-2xl font-semibold text-slate-900 mb-6">Critères d'éligibilité</h3>
              
              <div className="space-y-4">
                {[
                  "Travaux d'efficacité énergétique",
                  "Bâtiment résidentiel ou professionnel",
                  "Travaux éligibles selon la réglementation",
                  "Respect des critères techniques"
                ].map((criteria, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-6 h-6 bg-gradient-to-br from-green-500 to-emerald-500 rounded-lg flex items-center justify-center mt-0.5">
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
                className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-8 sm:px-10 py-3 sm:py-4 rounded-xl font-semibold hover:from-green-700 hover:to-emerald-700 transition-all duration-300 transform hover:-translate-y-1 hover:shadow-xl"
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
      <section className="py-12 sm:py-16 md:py-20 lg:py-24 bg-gradient-to-br from-slate-50 via-white to-green-50">
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-slate-900 mb-6 sm:mb-8 text-center">
              Un accompagnement complet pour les CEE
            </h2>
            
            <p className="text-base sm:text-lg text-slate-600 leading-relaxed mb-8 sm:mb-10 text-center">
              Profitum vous accompagne dans l'obtention des Certificats d'Économie d'Énergie pour financer vos travaux.
            </p>
            
            <div className="space-y-6 sm:space-y-8">
              {[
                {
                  step: "1",
                  title: "Analyse de vos projets de travaux",
                  description: "Examen approfondi de vos projets de travaux pour identifier ceux éligibles aux CEE et estimer le montant des primes."
                },
                {
                  step: "2",
                  title: "Vérification de l'éligibilité aux CEE",
                  description: "Vérification complète de l'éligibilité de vos travaux aux CEE selon la réglementation en vigueur."
                },
                {
                  step: "3",
                  title: "Optimisation du montant des primes",
                  description: "Optimisation du montant des primes CEE en identifiant les meilleures options et les cumuls possibles."
                },
                {
                  step: "4",
                  title: "Accompagnement dans les démarches",
                  description: "Support complet dans toutes les démarches administratives pour obtenir les primes CEE."
                }
              ].map((item, index) => (
                <div key={index} className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-sm hover:shadow-md transition-all">
                  <div className="flex items-start gap-4 sm:gap-6">
                    <div className="flex-shrink-0 w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center text-white font-bold text-lg sm:text-xl">
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
                  <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-500 rounded-lg flex items-center justify-center">
                    <ShieldCheck className="w-5 h-5 text-white" />
                  </div>
                  <h4 className="font-semibold text-slate-900">Expertise en efficacité énergétique</h4>
                </div>
                <p className="text-slate-600 text-sm">Connaissance approfondie de la réglementation et des dispositifs d'aide à l'efficacité énergétique.</p>
              </div>
              
              <div className="bg-white rounded-2xl p-6 border border-slate-200">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-500 rounded-lg flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-white" />
                  </div>
                  <h4 className="font-semibold text-slate-900">Optimisation du montant des primes</h4>
                </div>
                <p className="text-slate-600 text-sm">Identification des meilleures options pour maximiser le montant de vos primes CEE.</p>
              </div>
              
              <div className="bg-white rounded-2xl p-6 border border-slate-200">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-500 rounded-lg flex items-center justify-center">
                    <FileText className="w-5 h-5 text-white" />
                  </div>
                  <h4 className="font-semibold text-slate-900">Accompagnement complet des démarches</h4>
                </div>
                <p className="text-slate-600 text-sm">Support dans toutes les étapes pour obtenir vos primes CEE rapidement et efficacement.</p>
              </div>
              
              <div className="bg-white rounded-2xl p-6 border border-slate-200">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-500 rounded-lg flex items-center justify-center">
                    <Sparkles className="w-5 h-5 text-white" />
                  </div>
                  <h4 className="font-semibold text-slate-900">Maximisation de votre financement</h4>
                </div>
                <p className="text-slate-600 text-sm">Optimisation complète pour maximiser le financement de vos travaux énergétiques.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section 5 : FAQ */}
      <section className="py-12 sm:py-16 md:py-20 lg:py-24 bg-gradient-to-br from-slate-50 via-white to-green-50">
        <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-slate-900 mb-6 sm:mb-8 text-center">
            Questions fréquentes sur les CEE
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
      <section className="py-12 sm:py-16 md:py-20 lg:py-24 bg-gradient-to-br from-green-600 to-emerald-600">
        <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-4 sm:mb-6">
            Prêt à financer vos travaux énergétiques ?
          </h2>
          
          <p className="text-base sm:text-lg text-green-50 mb-8 sm:mb-10 max-w-2xl mx-auto leading-relaxed">
            Découvrez en quelques clics si vos travaux sont éligibles aux Certificats d'Économie d'Énergie. Simulation gratuite et sans engagement.
          </p>
          
          <Button 
            onClick={() => navigate('/simulateur')}
            className="bg-white text-green-600 px-8 sm:px-10 py-3 sm:py-4 rounded-xl font-semibold hover:bg-green-50 transition-all duration-300 transform hover:-translate-y-1 hover:shadow-xl text-base sm:text-lg"
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

