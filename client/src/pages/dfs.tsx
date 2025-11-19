import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { 
  Receipt,
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

export default function DFSPage() {
  const navigate = useNavigate();
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const faqItems = [
    {
      question: "Quelles professions sont éligibles à la DFS ?",
      answer: "La Déduction Forfaitaire Spécifique concerne certaines professions libérales spécifiques définies par la réglementation fiscale, notamment certaines professions médicales, juridiques, et autres professions réglementées. Notre équipe vérifie votre éligibilité lors de l'analyse initiale."
    },
    {
      question: "Comment calculer la déduction forfaitaire spécifique ?",
      answer: "Le calcul de la DFS dépend de votre profession et de vos revenus. Le montant de la déduction est calculé selon des barèmes spécifiques définis par la réglementation. Notre expertise vous permet d'optimiser ce calcul pour maximiser vos économies."
    },
    {
      question: "Quels documents sont nécessaires ?",
      answer: "Les documents nécessaires incluent vos déclarations fiscales, vos justificatifs de revenus professionnels, vos documents d'identification professionnelle, et tout document relatif à votre activité. Notre plateforme vous guide dans la collecte sécurisée de ces documents."
    },
    {
      question: "La DFS est-elle compatible avec d'autres dispositifs ?",
      answer: "Oui, la DFS peut être compatible avec d'autres dispositifs fiscaux sous certaines conditions. Notre équipe analyse votre situation globale pour identifier toutes les optimisations possibles et leurs compatibilités."
    },
    {
      question: "Peut-on bénéficier de la DFS rétroactivement ?",
      answer: "Oui, sous certaines conditions, il est possible de bénéficier de la DFS pour les années précédentes. Les délais de prescription varient selon les situations. Notre équipe d'experts évalue votre éligibilité rétroactive lors de l'analyse initiale."
    }
  ];

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-gradient-to-br from-slate-50 via-white to-indigo-50">
      <PublicHeader />
      
      {/* Hero Section */}
      <section className="relative py-16 sm:py-20 md:py-24 lg:py-28 bg-gradient-to-br from-indigo-50 via-white to-blue-50 overflow-hidden">
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-indigo-500 to-blue-500 rounded-full -translate-y-48 translate-x-48"></div>
        </div>
        
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-indigo-600/10 to-blue-600/10 border border-indigo-200 text-indigo-700 px-4 sm:px-6 py-2 sm:py-3 rounded-full text-xs sm:text-sm font-semibold mb-6 sm:mb-8">
              <Receipt className="w-4 h-4" />
              <span>Solution d'optimisation financière</span>
            </div>
            
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-slate-900 mb-4 sm:mb-6 leading-tight">
              Accompagnement sur-mesure pour la <span className="bg-gradient-to-r from-indigo-600 to-blue-600 bg-clip-text text-transparent">Déduction Forfaitaire Spécifique</span>
            </h1>
            
            <p className="text-base sm:text-lg md:text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed mb-8 sm:mb-10">
              Bénéficiez de la Déduction Forfaitaire Spécifique (DFS) pour réduire vos impôts. Expertise dédiée et accompagnement personnalisé pour maximiser vos économies fiscales.
            </p>
            
            <Button 
              onClick={() => navigate('/simulateur')}
              className="bg-gradient-to-r from-indigo-600 to-blue-600 text-white px-8 sm:px-10 py-3 sm:py-4 rounded-xl font-semibold hover:from-indigo-700 hover:to-blue-700 transition-all duration-300 transform hover:-translate-y-1 hover:shadow-xl text-base sm:text-lg"
            >
              <span className="flex items-center gap-2">
                Simulez votre éligibilité
                <ArrowRight className="w-5 h-5" />
              </span>
            </Button>
          </div>
        </div>
      </section>

      {/* Section 1 : Qu'est-ce que la DFS ? */}
      <section className="py-12 sm:py-16 md:py-20 lg:py-24 bg-white">
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-slate-900 mb-6 sm:mb-8 text-center">
              Comprendre la Déduction Forfaitaire Spécifique
            </h2>
            
            <div className="prose prose-slate max-w-none">
              <p className="text-base sm:text-lg text-slate-600 leading-relaxed mb-6">
                La <strong className="text-slate-900">Déduction Forfaitaire Spécifique (DFS)</strong> est un dispositif fiscal permettant aux entreprises de certaines professions libérales de bénéficier d'une déduction forfaitaire sur leurs revenus. Cette déduction permet de réduire significativement l'assiette imposable.
              </p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mt-8">
                <div className="bg-gradient-to-br from-indigo-50 to-blue-50 rounded-2xl p-6 border border-indigo-100">
                  <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-blue-500 rounded-xl flex items-center justify-center mb-4">
                    <Receipt className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="font-semibold text-slate-900 mb-2">Dispositif fiscal</h3>
                  <p className="text-sm text-slate-600">Dispositif fiscal pour professions libérales</p>
                </div>
                
                <div className="bg-gradient-to-br from-indigo-50 to-blue-50 rounded-2xl p-6 border border-indigo-100">
                  <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-blue-500 rounded-xl flex items-center justify-center mb-4">
                    <Calculator className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="font-semibold text-slate-900 mb-2">Déduction forfaitaire</h3>
                  <p className="text-sm text-slate-600">Déduction forfaitaire sur les revenus</p>
                </div>
                
                <div className="bg-gradient-to-br from-indigo-50 to-blue-50 rounded-2xl p-6 border border-indigo-100">
                  <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-blue-500 rounded-xl flex items-center justify-center mb-4">
                    <TrendingUp className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="font-semibold text-slate-900 mb-2">Réduction imposable</h3>
                  <p className="text-sm text-slate-600">Réduction de l'assiette imposable</p>
                </div>
                
                <div className="bg-gradient-to-br from-indigo-50 to-blue-50 rounded-2xl p-6 border border-indigo-100">
                  <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-blue-500 rounded-xl flex items-center justify-center mb-4">
                    <ShieldCheck className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="font-semibold text-slate-900 mb-2">Conditions spécifiques</h3>
                  <p className="text-sm text-slate-600">Conditions d'éligibilité spécifiques</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section 2 : Pourquoi bénéficier de la DFS ? */}
      <section className="py-12 sm:py-16 md:py-20 lg:py-24 bg-gradient-to-br from-slate-50 via-white to-indigo-50">
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-slate-900 mb-6 sm:mb-8 text-center">
              Les avantages de la Déduction Forfaitaire Spécifique
            </h2>
            
            <p className="text-base sm:text-lg text-slate-600 leading-relaxed mb-8 sm:mb-10 text-center">
              La DFS permet de réduire significativement vos impôts en déduisant forfaitairement une partie de vos revenus professionnels.
            </p>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-8">
              <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-blue-500 rounded-xl flex items-center justify-center mb-4">
                  <TrendingUp className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-slate-900 mb-3">Réduction immédiate</h3>
                <p className="text-slate-600 leading-relaxed">Réduisez immédiatement vos impôts grâce à la déduction forfaitaire sur vos revenus professionnels.</p>
              </div>
              
              <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-blue-500 rounded-xl flex items-center justify-center mb-4">
                  <FileText className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-slate-900 mb-3">Simplification</h3>
                <p className="text-slate-600 leading-relaxed">Simplifiez la gestion fiscale avec une déduction forfaitaire plutôt que des justificatifs détaillés.</p>
              </div>
              
              <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-blue-500 rounded-xl flex items-center justify-center mb-4">
                  <Calculator className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-slate-900 mb-3">Optimisation légale</h3>
                <p className="text-slate-600 leading-relaxed">Optimisez légalement votre fiscalité en bénéficiant d'un dispositif reconnu par la réglementation.</p>
              </div>
              
              <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-blue-500 rounded-xl flex items-center justify-center mb-4">
                  <ShieldCheck className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-slate-900 mb-3">Accompagnement expert</h3>
                <p className="text-slate-600 leading-relaxed">Bénéficiez de l'expertise de nos spécialistes pour vérifier votre éligibilité et optimiser votre situation.</p>
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
              Votre profession est-elle éligible à la DFS ?
            </h2>
            
            <p className="text-base sm:text-lg text-slate-600 leading-relaxed mb-8 sm:mb-10 text-center">
              La DFS concerne certaines professions libérales spécifiques définies par la réglementation fiscale.
            </p>
            
            <div className="bg-gradient-to-br from-indigo-50 to-blue-50 rounded-3xl p-6 sm:p-8 md:p-10 border border-indigo-100 mb-8 sm:mb-10">
              <h3 className="text-xl sm:text-2xl font-semibold text-slate-900 mb-6">Critères d'éligibilité</h3>
              
              <div className="space-y-4">
                {[
                  "Profession libérale éligible",
                  "Respect des conditions d'activité",
                  "Revenus professionnels déclarés",
                  "Conformité aux critères réglementaires"
                ].map((criteria, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-6 h-6 bg-gradient-to-br from-indigo-500 to-blue-500 rounded-lg flex items-center justify-center mt-0.5">
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
                className="bg-gradient-to-r from-indigo-600 to-blue-600 text-white px-8 sm:px-10 py-3 sm:py-4 rounded-xl font-semibold hover:from-indigo-700 hover:to-blue-700 transition-all duration-300 transform hover:-translate-y-1 hover:shadow-xl"
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
      <section className="py-12 sm:py-16 md:py-20 lg:py-24 bg-gradient-to-br from-slate-50 via-white to-indigo-50">
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-slate-900 mb-6 sm:mb-8 text-center">
              Un accompagnement sur-mesure pour la DFS
            </h2>
            
            <p className="text-base sm:text-lg text-slate-600 leading-relaxed mb-8 sm:mb-10 text-center">
              Profitum vous accompagne dans la mise en place de la Déduction Forfaitaire Spécifique avec une expertise dédiée.
            </p>
            
            <div className="space-y-6 sm:space-y-8">
              {[
                {
                  step: "1",
                  title: "Vérification de votre éligibilité",
                  description: "Analyse complète de votre situation professionnelle pour vérifier votre éligibilité à la Déduction Forfaitaire Spécifique."
                },
                {
                  step: "2",
                  title: "Analyse de votre situation fiscale",
                  description: "Examen détaillé de votre situation fiscale pour identifier les optimisations possibles et calculer la déduction optimale."
                },
                {
                  step: "3",
                  title: "Mise en place de la déduction",
                  description: "Accompagnement dans la mise en place de la DFS avec préparation des déclarations et suivi des démarches."
                },
                {
                  step: "4",
                  title: "Suivi et optimisation continue",
                  description: "Suivi régulier de votre situation et optimisation continue pour maximiser vos économies fiscales."
                }
              ].map((item, index) => (
                <div key={index} className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-sm hover:shadow-md transition-all">
                  <div className="flex items-start gap-4 sm:gap-6">
                    <div className="flex-shrink-0 w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-indigo-500 to-blue-500 rounded-xl flex items-center justify-center text-white font-bold text-lg sm:text-xl">
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
                  <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-blue-500 rounded-lg flex items-center justify-center">
                    <ShieldCheck className="w-5 h-5 text-white" />
                  </div>
                  <h4 className="font-semibold text-slate-900">Expertise en fiscalité des professions libérales</h4>
                </div>
                <p className="text-slate-600 text-sm">Connaissance approfondie de la réglementation fiscale applicable aux professions libérales.</p>
              </div>
              
              <div className="bg-white rounded-2xl p-6 border border-slate-200">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-blue-500 rounded-lg flex items-center justify-center">
                    <FileText className="w-5 h-5 text-white" />
                  </div>
                  <h4 className="font-semibold text-slate-900">Vérification complète de l'éligibilité</h4>
                </div>
                <p className="text-slate-600 text-sm">Analyse détaillée pour confirmer votre éligibilité et optimiser votre situation.</p>
              </div>
              
              <div className="bg-white rounded-2xl p-6 border border-slate-200">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-blue-500 rounded-lg flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-white" />
                  </div>
                  <h4 className="font-semibold text-slate-900">Accompagnement dans les démarches</h4>
                </div>
                <p className="text-slate-600 text-sm">Support complet pour mettre en place la DFS et optimiser vos déclarations.</p>
              </div>
              
              <div className="bg-white rounded-2xl p-6 border border-slate-200">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-blue-500 rounded-lg flex items-center justify-center">
                    <Calculator className="w-5 h-5 text-white" />
                  </div>
                  <h4 className="font-semibold text-slate-900">Optimisation continue</h4>
                </div>
                <p className="text-slate-600 text-sm">Suivi régulier pour maximiser vos économies et adapter votre stratégie fiscale.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section 5 : FAQ */}
      <section className="py-12 sm:py-16 md:py-20 lg:py-24 bg-gradient-to-br from-slate-50 via-white to-indigo-50">
        <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-slate-900 mb-6 sm:mb-8 text-center">
            Questions fréquentes sur la DFS
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
      <section className="py-12 sm:py-16 md:py-20 lg:py-24 bg-gradient-to-br from-indigo-600 to-blue-600">
        <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-4 sm:mb-6">
            Prêt à optimiser votre fiscalité avec la DFS ?
          </h2>
          
          <p className="text-base sm:text-lg text-indigo-50 mb-8 sm:mb-10 max-w-2xl mx-auto leading-relaxed">
            Découvrez en quelques clics si vous êtes éligible à la Déduction Forfaitaire Spécifique. Simulation gratuite et sans engagement.
          </p>
          
          <Button 
            onClick={() => navigate('/simulateur')}
            className="bg-white text-indigo-600 px-8 sm:px-10 py-3 sm:py-4 rounded-xl font-semibold hover:bg-indigo-50 transition-all duration-300 transform hover:-translate-y-1 hover:shadow-xl text-base sm:text-lg"
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

