import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { 
  Zap,
  ArrowRight,
  CheckCircle2,
  TrendingUp,
  ShieldCheck,
  FileText,
  Calculator,
  ChevronDown
} from "lucide-react";
import PublicHeader from '@/components/PublicHeader';
import { useState } from "react";

export default function EnergiePage() {
  const navigate = useNavigate();
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const faqItems = [
    {
      question: "Quels types de contrats peuvent être optimisés ?",
      answer: "Tous les types de contrats d'énergie peuvent être optimisés : contrats d'électricité, de gaz, de fioul, et autres énergies. Que vous soyez en marché régulé ou en marché libre, notre expertise vous permet d'identifier les meilleures offres."
    },
    {
      question: "Combien de temps prend l'optimisation ?",
      answer: "Le délai moyen d'optimisation est de 2 semaines. Ce délai inclut l'analyse de vos contrats actuels, la comparaison des offres du marché, la négociation, et la mise en place de la nouvelle offre. Notre équipe vous tient informé à chaque étape."
    },
    {
      question: "Y a-t-il des frais cachés ?",
      answer: "Non, notre transparence est totale. Les frais sont clairement indiqués dès le départ. Si aucune optimisation n'est possible ou si vous n'acceptez pas notre proposition, aucun frais n'est dû."
    },
    {
      question: "Peut-on changer de fournisseur facilement ?",
      answer: "Oui, changer de fournisseur d'énergie est simple et sans risque. Le changement se fait sans interruption de service et sans intervention technique. Nous vous accompagnons dans toutes les démarches pour faciliter la transition."
    },
    {
      question: "Le suivi est-il inclus dans l'accompagnement ?",
      answer: "Oui, notre accompagnement inclut un suivi continu de vos contrats d'énergie. Nous vous alertons des opportunités d'optimisation et réévaluons régulièrement votre situation pour maintenir les meilleures conditions."
    }
  ];

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-gradient-to-br from-slate-50 via-white to-pink-50">
      <PublicHeader />
      
      {/* Hero Section */}
      <section className="relative py-16 sm:py-20 md:py-24 lg:py-28 bg-gradient-to-br from-pink-50 via-white to-rose-50 overflow-hidden">
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-pink-500 to-rose-500 rounded-full -translate-y-48 translate-x-48"></div>
        </div>
        
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-pink-600/10 to-rose-600/10 border border-pink-200 text-pink-700 px-4 sm:px-6 py-2 sm:py-3 rounded-full text-xs sm:text-sm font-semibold mb-6 sm:mb-8">
              <Zap className="w-4 h-4" />
              <span>Solution d'optimisation financière</span>
            </div>
            
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-slate-900 mb-4 sm:mb-6 leading-tight">
              Réduisez vos factures d'énergie avec des <span className="bg-gradient-to-r from-pink-600 to-rose-600 bg-clip-text text-transparent">offres négociées</span>
            </h1>
            
            <p className="text-base sm:text-lg md:text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed mb-8 sm:mb-10">
              Optimisez vos contrats d'énergie grâce à notre expertise. Négociation d'offres sur-mesure et suivi personnalisé pour réduire vos coûts énergétiques.
            </p>
            
            <Button 
              onClick={() => navigate('/simulateur')}
              className="bg-gradient-to-r from-pink-600 to-rose-600 text-white px-8 sm:px-10 py-3 sm:py-4 rounded-xl font-semibold hover:from-pink-700 hover:to-rose-700 transition-all duration-300 transform hover:-translate-y-1 hover:shadow-xl text-base sm:text-lg"
            >
              <span className="flex items-center gap-2">
                Simulez votre éligibilité
                <ArrowRight className="w-5 h-5" />
              </span>
            </Button>
          </div>
        </div>
      </section>

      {/* Section 1 : Qu'est-ce que l'optimisation énergétique ? */}
      <section className="py-12 sm:py-16 md:py-20 lg:py-24 bg-white">
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-slate-900 mb-6 sm:mb-8 text-center">
              Comprendre l'optimisation énergétique
            </h2>
            
            <div className="prose prose-slate max-w-none">
              <p className="text-base sm:text-lg text-slate-600 leading-relaxed mb-6">
                L'<strong className="text-slate-900">optimisation énergétique</strong> consiste à analyser vos contrats d'énergie, négocier les meilleures offres et mettre en place des solutions pour réduire vos factures d'électricité, de gaz et autres énergies.
              </p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mt-8">
                <div className="bg-gradient-to-br from-pink-50 to-rose-50 rounded-2xl p-6 border border-pink-100">
                  <div className="w-12 h-12 bg-gradient-to-br from-pink-500 to-rose-500 rounded-xl flex items-center justify-center mb-4">
                    <FileText className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="font-semibold text-slate-900 mb-2">Analyse des contrats</h3>
                  <p className="text-sm text-slate-600">Analyse de vos contrats d'énergie</p>
                </div>
                
                <div className="bg-gradient-to-br from-pink-50 to-rose-50 rounded-2xl p-6 border border-pink-100">
                  <div className="w-12 h-12 bg-gradient-to-br from-pink-500 to-rose-500 rounded-xl flex items-center justify-center mb-4">
                    <Calculator className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="font-semibold text-slate-900 mb-2">Négociation d'offres</h3>
                  <p className="text-sm text-slate-600">Négociation d'offres sur-mesure</p>
                </div>
                
                <div className="bg-gradient-to-br from-pink-50 to-rose-50 rounded-2xl p-6 border border-pink-100">
                  <div className="w-12 h-12 bg-gradient-to-br from-pink-500 to-rose-500 rounded-xl flex items-center justify-center mb-4">
                    <TrendingUp className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="font-semibold text-slate-900 mb-2">Réduction des factures</h3>
                  <p className="text-sm text-slate-600">Réduction des factures énergétiques</p>
                </div>
                
                <div className="bg-gradient-to-br from-pink-50 to-rose-50 rounded-2xl p-6 border border-pink-100">
                  <div className="w-12 h-12 bg-gradient-to-br from-pink-500 to-rose-500 rounded-xl flex items-center justify-center mb-4">
                    <ShieldCheck className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="font-semibold text-slate-900 mb-2">Suivi continu</h3>
                  <p className="text-sm text-slate-600">Suivi et optimisation continue</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section 2 : Pourquoi optimiser vos contrats d'énergie ? */}
      <section className="py-12 sm:py-16 md:py-20 lg:py-24 bg-gradient-to-br from-slate-50 via-white to-pink-50">
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-slate-900 mb-6 sm:mb-8 text-center">
              Les avantages de l'optimisation énergétique
            </h2>
            
            <p className="text-base sm:text-lg text-slate-600 leading-relaxed mb-8 sm:mb-10 text-center">
              Une optimisation bien menée de vos contrats d'énergie peut générer des économies significatives sur vos factures.
            </p>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-8">
              <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                <div className="w-14 h-14 bg-gradient-to-br from-pink-500 to-rose-500 rounded-xl flex items-center justify-center mb-4">
                  <TrendingUp className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-slate-900 mb-3">Réduction immédiate</h3>
                <p className="text-slate-600 leading-relaxed">Réduisez immédiatement vos factures d'énergie en bénéficiant d'offres négociées et optimisées.</p>
              </div>
              
              <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                <div className="w-14 h-14 bg-gradient-to-br from-pink-500 to-rose-500 rounded-xl flex items-center justify-center mb-4">
                  <Calculator className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-slate-900 mb-3">Négociation d'offres compétitives</h3>
                <p className="text-slate-600 leading-relaxed">Bénéficiez d'offres négociées spécialement pour votre entreprise avec des tarifs compétitifs.</p>
              </div>
              
              <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                <div className="w-14 h-14 bg-gradient-to-br from-pink-500 to-rose-500 rounded-xl flex items-center justify-center mb-4">
                  <FileText className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-slate-900 mb-3">Optimisation de vos contrats</h3>
                <p className="text-slate-600 leading-relaxed">Optimisez vos contrats d'énergie pour obtenir les meilleures conditions tarifaires.</p>
              </div>
              
              <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                <div className="w-14 h-14 bg-gradient-to-br from-pink-500 to-rose-500 rounded-xl flex items-center justify-center mb-4">
                  <ShieldCheck className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-slate-900 mb-3">Suivi personnalisé</h3>
                <p className="text-slate-600 leading-relaxed">Bénéficiez d'un suivi personnalisé de votre consommation et de vos contrats pour maintenir les meilleures conditions.</p>
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
              Votre entreprise peut-elle optimiser ses contrats d'énergie ?
            </h2>
            
            <p className="text-base sm:text-lg text-slate-600 leading-relaxed mb-8 sm:mb-10 text-center">
              Toutes les entreprises consommant de l'énergie peuvent bénéficier d'une optimisation de leurs contrats.
            </p>
            
            <div className="bg-gradient-to-br from-pink-50 to-rose-50 rounded-3xl p-6 sm:p-8 md:p-10 border border-pink-100 mb-8 sm:mb-10">
              <h3 className="text-xl sm:text-2xl font-semibold text-slate-900 mb-6">Critères d'éligibilité</h3>
              
              <div className="space-y-4">
                {[
                  "Entreprise consommant de l'énergie",
                  "Contrats d'électricité, gaz ou autres énergies",
                  "Toutes tailles d'entreprise",
                  "Volonté de réduire les coûts énergétiques"
                ].map((criteria, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-6 h-6 bg-gradient-to-br from-pink-500 to-rose-500 rounded-lg flex items-center justify-center mt-0.5">
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
                className="bg-gradient-to-r from-pink-600 to-rose-600 text-white px-8 sm:px-10 py-3 sm:py-4 rounded-xl font-semibold hover:from-pink-700 hover:to-rose-700 transition-all duration-300 transform hover:-translate-y-1 hover:shadow-xl"
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
      <section className="py-12 sm:py-16 md:py-20 lg:py-24 bg-gradient-to-br from-slate-50 via-white to-pink-50">
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-slate-900 mb-6 sm:mb-8 text-center">
              Un accompagnement sur-mesure pour l'optimisation énergétique
            </h2>
            
            <p className="text-base sm:text-lg text-slate-600 leading-relaxed mb-8 sm:mb-10 text-center">
              Profitum vous accompagne dans l'optimisation de vos contrats d'énergie avec une expertise dédiée.
            </p>
            
            <div className="space-y-6 sm:space-y-8">
              {[
                {
                  step: "1",
                  title: "Analyse de vos contrats actuels",
                  description: "Examen approfondi de vos contrats d'énergie actuels pour identifier les opportunités d'optimisation et les économies possibles."
                },
                {
                  step: "2",
                  title: "Comparaison des offres du marché",
                  description: "Comparaison complète des offres disponibles sur le marché pour identifier les meilleures options adaptées à votre situation."
                },
                {
                  step: "3",
                  title: "Négociation d'offres sur-mesure",
                  description: "Négociation personnalisée d'offres sur-mesure avec les fournisseurs pour obtenir les meilleures conditions tarifaires."
                },
                {
                  step: "4",
                  title: "Suivi et réoptimisation continue",
                  description: "Suivi régulier de vos contrats et réoptimisation continue pour maintenir les meilleures conditions et identifier de nouvelles opportunités."
                }
              ].map((item, index) => (
                <div key={index} className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-sm hover:shadow-md transition-all">
                  <div className="flex items-start gap-4 sm:gap-6">
                    <div className="flex-shrink-0 w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-pink-500 to-rose-500 rounded-xl flex items-center justify-center text-white font-bold text-lg sm:text-xl">
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
                  <div className="w-10 h-10 bg-gradient-to-br from-pink-500 to-rose-500 rounded-lg flex items-center justify-center">
                    <ShieldCheck className="w-5 h-5 text-white" />
                  </div>
                  <h4 className="font-semibold text-slate-900">Expertise en marché de l'énergie</h4>
                </div>
                <p className="text-slate-600 text-sm">Connaissance approfondie du marché de l'énergie et des offres disponibles.</p>
              </div>
              
              <div className="bg-white rounded-2xl p-6 border border-slate-200">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-pink-500 to-rose-500 rounded-lg flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-white" />
                  </div>
                  <h4 className="font-semibold text-slate-900">Accès aux meilleures offres</h4>
                </div>
                <p className="text-slate-600 text-sm">Accès privilégié aux meilleures offres du marché grâce à nos partenariats.</p>
              </div>
              
              <div className="bg-white rounded-2xl p-6 border border-slate-200">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-pink-500 to-rose-500 rounded-lg flex items-center justify-center">
                    <Calculator className="w-5 h-5 text-white" />
                  </div>
                  <h4 className="font-semibold text-slate-900">Négociation personnalisée</h4>
                </div>
                <p className="text-slate-600 text-sm">Négociation sur-mesure pour obtenir les meilleures conditions adaptées à votre consommation.</p>
              </div>
              
              <div className="bg-white rounded-2xl p-6 border border-slate-200">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-pink-500 to-rose-500 rounded-lg flex items-center justify-center">
                    <FileText className="w-5 h-5 text-white" />
                  </div>
                  <h4 className="font-semibold text-slate-900">Suivi continu</h4>
                </div>
                <p className="text-slate-600 text-sm">Suivi régulier de vos contrats pour maintenir les meilleures conditions et identifier de nouvelles opportunités.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section 5 : FAQ */}
      <section className="py-12 sm:py-16 md:py-20 lg:py-24 bg-gradient-to-br from-slate-50 via-white to-pink-50">
        <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-slate-900 mb-6 sm:mb-8 text-center">
            Questions fréquentes sur l'optimisation énergétique
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
      <section className="py-12 sm:py-16 md:py-20 lg:py-24 bg-gradient-to-br from-pink-600 to-rose-600">
        <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-4 sm:mb-6">
            Prêt à réduire vos factures d'énergie ?
          </h2>
          
          <p className="text-base sm:text-lg text-pink-50 mb-8 sm:mb-10 max-w-2xl mx-auto leading-relaxed">
            Découvrez en quelques clics si vous pouvez optimiser vos contrats d'énergie. Simulation gratuite et sans engagement.
          </p>
          
          <Button 
            onClick={() => navigate('/simulateur')}
            className="bg-white text-pink-600 px-8 sm:px-10 py-3 sm:py-4 rounded-xl font-semibold hover:bg-pink-50 transition-all duration-300 transform hover:-translate-y-1 hover:shadow-xl text-base sm:text-lg"
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

