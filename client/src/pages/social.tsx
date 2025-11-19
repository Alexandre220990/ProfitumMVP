import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { 
  Users,
  ArrowRight,
  CheckCircle2,
  TrendingUp,
  ShieldCheck,
  FileText,
  Calculator,
  ChevronDown,
  Receipt
} from "lucide-react";
import PublicHeader from '@/components/PublicHeader';
import { useState } from "react";

export default function SocialPage() {
  const navigate = useNavigate();
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const faqItems = [
    {
      question: "Quels types d'erreurs peut-on trouver sur les fiches de paie ?",
      answer: "L'analyse des fiches de paie peut révéler plusieurs types d'erreurs : erreurs de calcul des cotisations, application incorrecte des taux, oublis de réduction ou d'exonération, erreurs dans le calcul des heures supplémentaires, erreurs dans les bases de cotisation, et bien d'autres anomalies qui impactent vos charges sociales."
    },
    {
      question: "Combien de temps prend l'analyse des fiches de paie ?",
      answer: "Le délai d'analyse dépend du nombre de fiches de paie à examiner et de la complexité de votre situation. En moyenne, l'audit complet prend entre 2 et 4 semaines. Notre équipe vous tient informé de l'avancement à chaque étape du processus."
    },
    {
      question: "Quels documents sont nécessaires pour l'audit ?",
      answer: "Les documents nécessaires incluent vos fiches de paie (sur la période à analyser), vos contrats de travail, vos tableaux de bord sociaux, vos déclarations URSSAF, et tout document relatif à la gestion de votre paie. Notre plateforme vous guide dans la collecte sécurisée de ces documents."
    },
    {
      question: "L'optimisation est-elle légale et conforme ?",
      answer: "Absolument. Notre approche respecte strictement la réglementation en vigueur. Nous identifions uniquement les optimisations légales autorisées par la loi, telles que les réductions de cotisations, les exonérations applicables, et les dispositifs d'aide à l'emploi. Toutes nos recommandations sont conformes et sécurisées."
    },
    {
      question: "Peut-on optimiser les fiches de paie rétroactivement ?",
      answer: "Oui, il est possible d'analyser et d'optimiser les fiches de paie sur plusieurs périodes passées, dans les limites des délais de prescription. Cela permet de récupérer des économies sur les périodes précédentes et d'identifier les erreurs récurrentes. Notre équipe vous conseille sur les périodes auditable."
    }
  ];

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-gradient-to-br from-slate-50 via-white to-purple-50">
      <PublicHeader />
      
      {/* Hero Section */}
      <section className="relative py-16 sm:py-20 md:py-24 lg:py-28 bg-gradient-to-br from-purple-50 via-white to-violet-50 overflow-hidden">
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-purple-500 to-violet-500 rounded-full -translate-y-48 translate-x-48"></div>
        </div>
        
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-600/10 to-violet-600/10 border border-purple-200 text-purple-700 px-4 sm:px-6 py-2 sm:py-3 rounded-full text-xs sm:text-sm font-semibold mb-6 sm:mb-8">
              <Users className="w-4 h-4" />
              <span>Solution d'optimisation financière</span>
            </div>
            
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-slate-900 mb-4 sm:mb-6 leading-tight">
              Optimisez vos charges sociales grâce à l'analyse de vos <span className="bg-gradient-to-r from-purple-600 to-violet-600 bg-clip-text text-transparent">fiches de paie</span>
            </h1>
            
            <p className="text-base sm:text-lg md:text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed mb-8 sm:mb-10">
              Réduisez vos coûts en identifiant les optimisations possibles sur les fiches de paie de vos employés. Audit complet et accompagnement expert pour maximiser vos économies.
            </p>
            
            <Button 
              onClick={() => navigate('/simulateur')}
              className="bg-gradient-to-r from-purple-600 to-violet-600 text-white px-8 sm:px-10 py-3 sm:py-4 rounded-xl font-semibold hover:from-purple-700 hover:to-violet-700 transition-all duration-300 transform hover:-translate-y-1 hover:shadow-xl text-base sm:text-lg"
            >
              <span className="flex items-center gap-2">
                Simulez votre éligibilité
                <ArrowRight className="w-5 h-5" />
              </span>
            </Button>
          </div>
        </div>
      </section>

      {/* Section 1 : Qu'est-ce que l'optimisation des charges sociales ? */}
      <section className="py-12 sm:py-16 md:py-20 lg:py-24 bg-white">
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-slate-900 mb-6 sm:mb-8 text-center">
              Comprendre l'optimisation des charges sociales
            </h2>
            
            <div className="prose prose-slate max-w-none">
              <p className="text-base sm:text-lg text-slate-600 leading-relaxed mb-6">
                L'<strong className="text-slate-900">optimisation des charges sociales</strong> consiste à analyser les fiches de paie de vos employés pour identifier les erreurs, les réductions applicables et les dispositifs légaux permettant de réduire vos coûts sociaux tout en restant conforme à la réglementation.
              </p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mt-8">
                <div className="bg-gradient-to-br from-purple-50 to-violet-50 rounded-2xl p-6 border border-purple-100">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-violet-500 rounded-xl flex items-center justify-center mb-4">
                    <Receipt className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="font-semibold text-slate-900 mb-2">Analyse détaillée</h3>
                  <p className="text-sm text-slate-600">Analyse détaillée des fiches de paie</p>
                </div>
                
                <div className="bg-gradient-to-br from-purple-50 to-violet-50 rounded-2xl p-6 border border-purple-100">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-violet-500 rounded-xl flex items-center justify-center mb-4">
                    <Calculator className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="font-semibold text-slate-900 mb-2">Détection d'erreurs</h3>
                  <p className="text-sm text-slate-600">Identification des erreurs de calcul</p>
                </div>
                
                <div className="bg-gradient-to-br from-purple-50 to-violet-50 rounded-2xl p-6 border border-purple-100">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-violet-500 rounded-xl flex items-center justify-center mb-4">
                    <TrendingUp className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="font-semibold text-slate-900 mb-2">Réductions légales</h3>
                  <p className="text-sm text-slate-600">Application des réductions et exonérations légales</p>
                </div>
                
                <div className="bg-gradient-to-br from-purple-50 to-violet-50 rounded-2xl p-6 border border-purple-100">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-violet-500 rounded-xl flex items-center justify-center mb-4">
                    <ShieldCheck className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="font-semibold text-slate-900 mb-2">Conformité garantie</h3>
                  <p className="text-sm text-slate-600">Optimisation dans le respect de la réglementation</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section 2 : Pourquoi optimiser vos charges sociales ? */}
      <section className="py-12 sm:py-16 md:py-20 lg:py-24 bg-gradient-to-br from-slate-50 via-white to-purple-50">
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-slate-900 mb-6 sm:mb-8 text-center">
              Les avantages de l'optimisation des charges sociales
            </h2>
            
            <p className="text-base sm:text-lg text-slate-600 leading-relaxed mb-8 sm:mb-10 text-center">
              Une optimisation bien menée de vos charges sociales peut générer des économies significatives tout en sécurisant votre conformité sociale.
            </p>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-8">
              <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-violet-500 rounded-xl flex items-center justify-center mb-4">
                  <TrendingUp className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-slate-900 mb-3">Réduction immédiate</h3>
                <p className="text-slate-600 leading-relaxed">Réduisez immédiatement vos coûts sociaux en identifiant les optimisations applicables à vos fiches de paie.</p>
              </div>
              
              <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-violet-500 rounded-xl flex items-center justify-center mb-4">
                  <FileText className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-slate-900 mb-3">Correction des erreurs</h3>
                <p className="text-slate-600 leading-relaxed">Corrigez les erreurs présentes sur vos fiches de paie pour éviter les surcoûts et les risques de contrôle.</p>
              </div>
              
              <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-violet-500 rounded-xl flex items-center justify-center mb-4">
                  <Calculator className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-slate-900 mb-3">Application optimale</h3>
                <p className="text-slate-600 leading-relaxed">Appliquez de manière optimale toutes les réductions légales auxquelles vous avez droit.</p>
              </div>
              
              <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-violet-500 rounded-xl flex items-center justify-center mb-4">
                  <ShieldCheck className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-slate-900 mb-3">Sécurisation de la conformité</h3>
                <p className="text-slate-600 leading-relaxed">Assurez-vous que vos fiches de paie sont conformes et évitez les risques de contrôle social.</p>
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
              Votre entreprise peut-elle optimiser ses charges sociales ?
            </h2>
            
            <p className="text-base sm:text-lg text-slate-600 leading-relaxed mb-8 sm:mb-10 text-center">
              Toutes les entreprises employant du personnel et versant des charges sociales peuvent bénéficier d'une optimisation, quelle que soit leur taille ou leur secteur.
            </p>
            
            <div className="bg-gradient-to-br from-purple-50 to-violet-50 rounded-3xl p-6 sm:p-8 md:p-10 border border-purple-100 mb-8 sm:mb-10">
              <h3 className="text-xl sm:text-2xl font-semibold text-slate-900 mb-6">Critères d'éligibilité</h3>
              
              <div className="space-y-4">
                {[
                  "Entreprise employant du personnel",
                  "Versement de charges sociales",
                  "Fiches de paie à analyser",
                  "Toutes tailles d'entreprise (TPE, PME, grandes entreprises)"
                ].map((criteria, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-6 h-6 bg-gradient-to-br from-purple-500 to-violet-500 rounded-lg flex items-center justify-center mt-0.5">
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
                className="bg-gradient-to-r from-purple-600 to-violet-600 text-white px-8 sm:px-10 py-3 sm:py-4 rounded-xl font-semibold hover:from-purple-700 hover:to-violet-700 transition-all duration-300 transform hover:-translate-y-1 hover:shadow-xl"
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
      <section className="py-12 sm:py-16 md:py-20 lg:py-24 bg-gradient-to-br from-slate-50 via-white to-purple-50">
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-slate-900 mb-6 sm:mb-8 text-center">
              Un audit complet de vos fiches de paie
            </h2>
            
            <p className="text-base sm:text-lg text-slate-600 leading-relaxed mb-8 sm:mb-10 text-center">
              Profitum vous accompagne dans l'optimisation de vos charges sociales en analysant en détail vos fiches de paie avec une expertise reconnue.
            </p>
            
            <div className="space-y-6 sm:space-y-8">
              {[
                {
                  step: "1",
                  title: "Analyse détaillée de vos fiches de paie",
                  description: "Examen approfondi de toutes vos fiches de paie pour identifier les erreurs, les incohérences et les opportunités d'optimisation sur chaque ligne de calcul."
                },
                {
                  step: "2",
                  title: "Détection des erreurs et incohérences",
                  description: "Identification systématique des erreurs de calcul, des anomalies dans les cotisations, et des écarts par rapport à la réglementation en vigueur."
                },
                {
                  step: "3",
                  title: "Identification des optimisations légales applicables",
                  description: "Recherche et application de toutes les réductions, exonérations et dispositifs légaux applicables à votre situation pour optimiser vos charges."
                },
                {
                  step: "4",
                  title: "Mise en œuvre des corrections et optimisations",
                  description: "Accompagnement complet dans la mise en œuvre des corrections et optimisations identifiées, avec suivi et validation de chaque étape."
                }
              ].map((item, index) => (
                <div key={index} className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-sm hover:shadow-md transition-all">
                  <div className="flex items-start gap-4 sm:gap-6">
                    <div className="flex-shrink-0 w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-purple-500 to-violet-500 rounded-xl flex items-center justify-center text-white font-bold text-lg sm:text-xl">
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
                  <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-violet-500 rounded-lg flex items-center justify-center">
                    <Receipt className="w-5 h-5 text-white" />
                  </div>
                  <h4 className="font-semibold text-slate-900">Analyse complète de toutes vos fiches de paie</h4>
                </div>
                <p className="text-slate-600 text-sm">Examen détaillé de chaque fiche de paie pour une optimisation maximale.</p>
              </div>
              
              <div className="bg-white rounded-2xl p-6 border border-slate-200">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-violet-500 rounded-lg flex items-center justify-center">
                    <ShieldCheck className="w-5 h-5 text-white" />
                  </div>
                  <h4 className="font-semibold text-slate-900">Expertise en droit social et paie</h4>
                </div>
                <p className="text-slate-600 text-sm">Connaissance approfondie de la réglementation sociale et de la paie.</p>
              </div>
              
              <div className="bg-white rounded-2xl p-6 border border-slate-200">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-violet-500 rounded-lg flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-white" />
                  </div>
                  <h4 className="font-semibold text-slate-900">Identification des réductions et exonérations</h4>
                </div>
                <p className="text-slate-600 text-sm">Détection de tous les dispositifs légaux applicables à votre situation.</p>
              </div>
              
              <div className="bg-white rounded-2xl p-6 border border-slate-200">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-violet-500 rounded-lg flex items-center justify-center">
                    <FileText className="w-5 h-5 text-white" />
                  </div>
                  <h4 className="font-semibold text-slate-900">Accompagnement dans la mise en œuvre</h4>
                </div>
                <p className="text-slate-600 text-sm">Support complet pour appliquer les optimisations identifiées.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section 5 : Résultats et statistiques */}
      <section className="py-12 sm:py-16 md:py-20 lg:py-24 bg-white">
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-slate-900 mb-6 sm:mb-8 text-center">
              Des économies significatives pour nos clients
            </h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8">
              <div className="text-center">
                <div className="text-3xl sm:text-4xl md:text-5xl font-bold bg-gradient-to-r from-purple-600 to-violet-600 bg-clip-text text-transparent mb-3">
                  10-20%
                </div>
                <p className="text-slate-600 text-sm sm:text-base">En moyenne d'économies sur vos charges sociales</p>
              </div>
              
              <div className="text-center">
                <div className="text-3xl sm:text-4xl md:text-5xl font-bold bg-gradient-to-r from-purple-600 to-violet-600 bg-clip-text text-transparent mb-3">
                  2-4 semaines
                </div>
                <p className="text-slate-600 text-sm sm:text-base">Délai moyen d'audit</p>
              </div>
              
              <div className="text-center">
                <div className="text-3xl sm:text-4xl md:text-5xl font-bold bg-gradient-to-r from-purple-600 to-violet-600 bg-clip-text text-transparent mb-3">
                  100%
                </div>
                <p className="text-slate-600 text-sm sm:text-base">Conformité garantie</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section 6 : FAQ */}
      <section className="py-12 sm:py-16 md:py-20 lg:py-24 bg-gradient-to-br from-slate-50 via-white to-purple-50">
        <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-slate-900 mb-6 sm:mb-8 text-center">
            Questions fréquentes sur l'optimisation des charges sociales
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
      <section className="py-12 sm:py-16 md:py-20 lg:py-24 bg-gradient-to-br from-purple-600 to-violet-600">
        <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-4 sm:mb-6">
            Prêt à réduire vos charges sociales ?
          </h2>
          
          <p className="text-base sm:text-lg text-purple-50 mb-8 sm:mb-10 max-w-2xl mx-auto leading-relaxed">
            Découvrez en quelques clics si votre entreprise peut bénéficier d'une optimisation de ses charges sociales. Simulation gratuite et sans engagement.
          </p>
          
          <Button 
            onClick={() => navigate('/simulateur')}
            className="bg-white text-purple-600 px-8 sm:px-10 py-3 sm:py-4 rounded-xl font-semibold hover:bg-purple-50 transition-all duration-300 transform hover:-translate-y-1 hover:shadow-xl text-base sm:text-lg"
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

