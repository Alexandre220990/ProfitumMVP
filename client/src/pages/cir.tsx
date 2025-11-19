import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { 
  Lightbulb,
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

export default function CIRPage() {
  const navigate = useNavigate();
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const faqItems = [
    {
      question: "Quelles dépenses sont éligibles au CIR ?",
      answer: "Les dépenses éligibles au CIR incluent les salaires des chercheurs, les dotations aux amortissements des équipements de recherche, les dépenses de fonctionnement de la recherche, les dépenses de sous-traitance de recherche, et d'autres dépenses directement liées aux activités de recherche et développement."
    },
    {
      question: "Comment calculer le crédit d'impôt recherche ?",
      answer: "Le CIR est calculé sur la base des dépenses éligibles de recherche et développement. Le taux de crédit d'impôt est généralement de 30% des dépenses éligibles, avec un plafond spécifique. Notre expertise vous permet d'optimiser ce calcul pour maximiser votre crédit."
    },
    {
      question: "Le CIR est-il remboursable ?",
      answer: "Oui, le CIR est remboursable si votre entreprise n'a pas d'impôt à payer ou si le crédit d'impôt dépasse le montant de l'impôt dû. Cela permet d'améliorer significativement votre trésorerie en récupérant le crédit sous forme de remboursement."
    },
    {
      question: "Quels documents sont nécessaires ?",
      answer: "Les documents nécessaires incluent les justificatifs des dépenses de recherche, les descriptions des projets R&D, les contrats de recherche, les déclarations fiscales, et tout document prouvant les activités de recherche et développement. Notre plateforme vous guide dans la collecte sécurisée de ces documents."
    },
    {
      question: "Peut-on récupérer le CIR rétroactivement ?",
      answer: "Oui, il est possible de récupérer le CIR pour les années précédentes dans les limites des délais de prescription. Cela permet de récupérer des crédits d'impôt sur plusieurs années et d'améliorer significativement votre trésorerie. Notre équipe évalue votre éligibilité rétroactive lors de l'analyse initiale."
    }
  ];

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-gradient-to-br from-slate-50 via-white to-yellow-50">
      <PublicHeader />
      
      {/* Hero Section */}
      <section className="relative py-16 sm:py-20 md:py-24 lg:py-28 bg-gradient-to-br from-yellow-50 via-white to-orange-50 overflow-hidden">
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-full -translate-y-48 translate-x-48"></div>
        </div>
        
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-yellow-600/10 to-orange-600/10 border border-yellow-200 text-yellow-700 px-4 sm:px-6 py-2 sm:py-3 rounded-full text-xs sm:text-sm font-semibold mb-6 sm:mb-8">
              <Lightbulb className="w-4 h-4" />
              <span>Solution d'optimisation financière</span>
            </div>
            
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-slate-900 mb-4 sm:mb-6 leading-tight">
              Valorisez vos innovations avec le <span className="bg-gradient-to-r from-yellow-600 to-orange-600 bg-clip-text text-transparent">Crédit Impôt Recherche</span>
            </h1>
            
            <p className="text-base sm:text-lg md:text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed mb-8 sm:mb-10">
              Boostez votre trésorerie en récupérant le Crédit Impôt Recherche sur vos dépenses d'innovation. Expertise dédiée et accompagnement complet pour maximiser vos économies.
            </p>
            
            <Button 
              onClick={() => navigate('/simulateur')}
              className="bg-gradient-to-r from-yellow-600 to-orange-600 text-white px-8 sm:px-10 py-3 sm:py-4 rounded-xl font-semibold hover:from-yellow-700 hover:to-orange-700 transition-all duration-300 transform hover:-translate-y-1 hover:shadow-xl text-base sm:text-lg"
            >
              <span className="flex items-center gap-2">
                Simulez votre éligibilité
                <ArrowRight className="w-5 h-5" />
              </span>
            </Button>
          </div>
        </div>
      </section>

      {/* Section 1 : Qu'est-ce que le CIR ? */}
      <section className="py-12 sm:py-16 md:py-20 lg:py-24 bg-white">
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-slate-900 mb-6 sm:mb-8 text-center">
              Comprendre le Crédit Impôt Recherche
            </h2>
            
            <div className="prose prose-slate max-w-none">
              <p className="text-base sm:text-lg text-slate-600 leading-relaxed mb-6">
                Le <strong className="text-slate-900">Crédit Impôt Recherche (CIR)</strong> est un dispositif fiscal permettant aux entreprises d'obtenir un crédit d'impôt sur leurs dépenses de recherche et développement. Ce crédit peut être remboursé si l'entreprise n'a pas d'impôt à payer.
              </p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mt-8">
                <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-2xl p-6 border border-yellow-100">
                  <div className="w-12 h-12 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-xl flex items-center justify-center mb-4">
                    <Lightbulb className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="font-semibold text-slate-900 mb-2">Dispositif fiscal</h3>
                  <p className="text-sm text-slate-600">Dispositif fiscal pour l'innovation</p>
                </div>
                
                <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-2xl p-6 border border-yellow-100">
                  <div className="w-12 h-12 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-xl flex items-center justify-center mb-4">
                    <Calculator className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="font-semibold text-slate-900 mb-2">Crédit d'impôt</h3>
                  <p className="text-sm text-slate-600">Crédit d'impôt sur les dépenses R&D</p>
                </div>
                
                <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-2xl p-6 border border-yellow-100">
                  <div className="w-12 h-12 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-xl flex items-center justify-center mb-4">
                    <TrendingUp className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="font-semibold text-slate-900 mb-2">Remboursement possible</h3>
                  <p className="text-sm text-slate-600">Remboursement possible si pas d'impôt</p>
                </div>
                
                <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-2xl p-6 border border-yellow-100">
                  <div className="w-12 h-12 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-xl flex items-center justify-center mb-4">
                    <ShieldCheck className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="font-semibold text-slate-900 mb-2">Valorisation R&D</h3>
                  <p className="text-sm text-slate-600">Valorisation des activités de recherche</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section 2 : Pourquoi valoriser le CIR ? */}
      <section className="py-12 sm:py-16 md:py-20 lg:py-24 bg-gradient-to-br from-slate-50 via-white to-yellow-50">
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-slate-900 mb-6 sm:mb-8 text-center">
              Les avantages du Crédit Impôt Recherche
            </h2>
            
            <p className="text-base sm:text-lg text-slate-600 leading-relaxed mb-8 sm:mb-10 text-center">
              Le CIR représente une opportunité significative de financement pour vos activités de recherche et développement.
            </p>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-8">
              <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                <div className="w-14 h-14 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-xl flex items-center justify-center mb-4">
                  <TrendingUp className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-slate-900 mb-3">Amélioration de la trésorerie</h3>
                <p className="text-slate-600 leading-relaxed">Améliorez immédiatement votre trésorerie en récupérant le crédit d'impôt recherche, même si vous n'avez pas d'impôt à payer.</p>
              </div>
              
              <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                <div className="w-14 h-14 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-xl flex items-center justify-center mb-4">
                  <Lightbulb className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-slate-900 mb-3">Financement de l'innovation</h3>
                <p className="text-slate-600 leading-relaxed">Financez vos projets d'innovation en récupérant une partie significative de vos dépenses de recherche et développement.</p>
              </div>
              
              <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                <div className="w-14 h-14 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-xl flex items-center justify-center mb-4">
                  <Calculator className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-slate-900 mb-3">Réduction des impôts</h3>
                <p className="text-slate-600 leading-relaxed">Réduisez vos impôts en bénéficiant d'un crédit d'impôt sur vos dépenses de recherche et développement.</p>
              </div>
              
              <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                <div className="w-14 h-14 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-xl flex items-center justify-center mb-4">
                  <ShieldCheck className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-slate-900 mb-3">Valorisation R&D</h3>
                <p className="text-slate-600 leading-relaxed">Valorisez vos activités de recherche et développement en récupérant le crédit d'impôt recherche.</p>
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
              Votre entreprise est-elle éligible au CIR ?
            </h2>
            
            <p className="text-base sm:text-lg text-slate-600 leading-relaxed mb-8 sm:mb-10 text-center">
              Toutes les entreprises réalisant des activités de recherche et développement peuvent potentiellement bénéficier du CIR.
            </p>
            
            <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-3xl p-6 sm:p-8 md:p-10 border border-yellow-100 mb-8 sm:mb-10">
              <h3 className="text-xl sm:text-2xl font-semibold text-slate-900 mb-6">Critères d'éligibilité</h3>
              
              <div className="space-y-4">
                {[
                  "Entreprise réalisant des activités R&D",
                  "Dépenses éligibles de recherche",
                  "Respect des critères d'éligibilité",
                  "Documentation des activités R&D"
                ].map((criteria, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-6 h-6 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-lg flex items-center justify-center mt-0.5">
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
                className="bg-gradient-to-r from-yellow-600 to-orange-600 text-white px-8 sm:px-10 py-3 sm:py-4 rounded-xl font-semibold hover:from-yellow-700 hover:to-orange-700 transition-all duration-300 transform hover:-translate-y-1 hover:shadow-xl"
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
      <section className="py-12 sm:py-16 md:py-20 lg:py-24 bg-gradient-to-br from-slate-50 via-white to-yellow-50">
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-slate-900 mb-6 sm:mb-8 text-center">
              Un accompagnement complet pour le CIR
            </h2>
            
            <p className="text-base sm:text-lg text-slate-600 leading-relaxed mb-8 sm:mb-10 text-center">
              Profitum vous accompagne dans la valorisation de votre Crédit Impôt Recherche avec une expertise reconnue.
            </p>
            
            <div className="space-y-6 sm:space-y-8">
              {[
                {
                  step: "1",
                  title: "Analyse de vos activités R&D",
                  description: "Examen approfondi de vos activités de recherche et développement pour identifier les projets éligibles au CIR."
                },
                {
                  step: "2",
                  title: "Identification des dépenses éligibles",
                  description: "Identification systématique de toutes les dépenses éligibles au CIR pour maximiser votre crédit d'impôt."
                },
                {
                  step: "3",
                  title: "Constitution du dossier CIR",
                  description: "Préparation complète de votre dossier CIR avec documentation appropriée et argumentation solide."
                },
                {
                  step: "4",
                  title: "Accompagnement jusqu'à la récupération",
                  description: "Support complet dans toutes les démarches jusqu'à l'obtention effective du crédit d'impôt recherche."
                }
              ].map((item, index) => (
                <div key={index} className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-sm hover:shadow-md transition-all">
                  <div className="flex items-start gap-4 sm:gap-6">
                    <div className="flex-shrink-0 w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-xl flex items-center justify-center text-white font-bold text-lg sm:text-xl">
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
                  <div className="w-10 h-10 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-lg flex items-center justify-center">
                    <ShieldCheck className="w-5 h-5 text-white" />
                  </div>
                  <h4 className="font-semibold text-slate-900">Expertise en fiscalité de l'innovation</h4>
                </div>
                <p className="text-slate-600 text-sm">Connaissance approfondie de la réglementation fiscale applicable à l'innovation et à la R&D.</p>
              </div>
              
              <div className="bg-white rounded-2xl p-6 border border-slate-200">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-lg flex items-center justify-center">
                    <FileText className="w-5 h-5 text-white" />
                  </div>
                  <h4 className="font-semibold text-slate-900">Identification optimale des dépenses éligibles</h4>
                </div>
                <p className="text-slate-600 text-sm">Détection de toutes les dépenses éligibles pour maximiser votre crédit d'impôt.</p>
              </div>
              
              <div className="bg-white rounded-2xl p-6 border border-slate-200">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-lg flex items-center justify-center">
                    <Lightbulb className="w-5 h-5 text-white" />
                  </div>
                  <h4 className="font-semibold text-slate-900">Constitution de dossiers sécurisés</h4>
                </div>
                <p className="text-slate-600 text-sm">Préparation de dossiers complets et conformes pour sécuriser votre crédit d'impôt.</p>
              </div>
              
              <div className="bg-white rounded-2xl p-6 border border-slate-200">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-lg flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-white" />
                  </div>
                  <h4 className="font-semibold text-slate-900">Maximisation de votre crédit d'impôt</h4>
                </div>
                <p className="text-slate-600 text-sm">Optimisation complète pour maximiser le montant de votre crédit d'impôt recherche.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section 5 : FAQ */}
      <section className="py-12 sm:py-16 md:py-20 lg:py-24 bg-gradient-to-br from-slate-50 via-white to-yellow-50">
        <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-slate-900 mb-6 sm:mb-8 text-center">
            Questions fréquentes sur le CIR
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
      <section className="py-12 sm:py-16 md:py-20 lg:py-24 bg-gradient-to-br from-yellow-600 to-orange-600">
        <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-4 sm:mb-6">
            Prêt à valoriser vos innovations ?
          </h2>
          
          <p className="text-base sm:text-lg text-yellow-50 mb-8 sm:mb-10 max-w-2xl mx-auto leading-relaxed">
            Découvrez en quelques clics si votre entreprise est éligible au Crédit Impôt Recherche. Simulation gratuite et sans engagement.
          </p>
          
          <Button 
            onClick={() => navigate('/simulateur')}
            className="bg-white text-yellow-600 px-8 sm:px-10 py-3 sm:py-4 rounded-xl font-semibold hover:bg-yellow-50 transition-all duration-300 transform hover:-translate-y-1 hover:shadow-xl text-base sm:text-lg"
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

