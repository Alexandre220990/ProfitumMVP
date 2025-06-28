import { useState } from "react";
import { UserCircle, ClipboardList, CheckCircle, Users, Headphones, ShieldCheck, Briefcase, FileText, DollarSign, ThumbsUp, Search, BookOpen, Edit3, Award, Sparkles } from "lucide-react";

// Couleurs officielles du drapeau français
const FRENCH_COLORS = {
  blue: '#002395',
  white: '#FFFFFF',
  red: '#ED2939'
};

const stepsData = {
  client: [
    {
      icon: <UserCircle className="w-10 h-10 text-blue-600 mb-3" />,
      title: "Création de compte",
      desc: "Validation par le service client",
      color: "blue"
    },
    {
      icon: <ClipboardList className="w-10 h-10 text-red-600 mb-3" />,
      title: "Définissez votre profil entreprise",
      desc: "Effectuez votre 1e simulation grâce à notre agent IA",
      color: "red"
    },
    {
      icon: <CheckCircle className="w-10 h-10 text-blue-600 mb-3" />,
      title: "Découvrez vos éligibilités",
      desc: "et démarrez facilement vos dossiers",
      color: "blue"
    },
    {
      icon: <Users className="w-10 h-10 text-red-600 mb-3" />,
      title: "Recherchez, comparez et sélectionnez",
      desc: "les meilleurs experts",
      color: "red"
    },
    {
      icon: <Headphones className="w-10 h-10 text-blue-600 mb-3" />,
      title: "Briefing & validation",
      desc: "Prise de contact avec l'expert et finalisation du dossier",
      color: "blue"
    },
    {
      icon: <ShieldCheck className="w-10 h-10 text-red-600 mb-3" />,
      title: "Rapports et remboursements",
      desc: "Recevez les rapports d'experts et recevez directement vos remboursements des trop perçus",
      color: "red"
    }
  ],
  expert: [
    {
      icon: <UserCircle className="w-10 h-10 text-blue-600 mb-3" />,
      title: "Inscription & profil",
      desc: "Création de votre profil",
      color: "blue"
    },
    {
      icon: <ThumbsUp className="w-10 h-10 text-red-600 mb-3" />,
      title: "Validation conseiller",
      desc: "Entretien et validation avec un conseiller",
      color: "red"
    },
    {
      icon: <ClipboardList className="w-10 h-10 text-blue-600 mb-3" />,
      title: "Sélection de l'abonnement et contractualisation",
      desc: "en fonction de vos besoins",
      color: "blue"
    },
    {
      icon: <Search className="w-10 h-10 text-red-600 mb-3" />,
      title: "Programmation du ciblage client",
      desc: "Secteur, taille, type d'entreprise, etc.",
      color: "red"
    },
    {
      icon: <FileText className="w-10 h-10 text-blue-600 mb-3" />,
      title: "Commencez à recevoir et à suivre vos 1e demandes",
      desc: "Et uploadez votre activité actuelle pour un suivi global",
      color: "blue"
    },
    {
      icon: <DollarSign className="w-10 h-10 text-red-600 mb-3" />,
      title: "Paiement rapide",
      desc: "Gains versés sous 8 jours",
      color: "red"
    }
  ]
};

export default function ProcessStepsTest() {
  const [role, setRole] = useState<'client' | 'expert'>('client');

  return (
    <section className="w-full max-w-7xl px-4 mx-auto py-16 bg-gradient-to-br from-blue-50 to-red-50 rounded-2xl">
      <div className="text-center mb-12">
        <div className="flex items-center justify-center mb-4">
          <Sparkles className="w-8 h-8 text-blue-600 mr-3" />
          <h2 className="text-4xl font-bold text-blue-900">Fonctionnement de la plateforme</h2>
          <Award className="w-8 h-8 text-red-600 ml-3" />
        </div>
        <p className="text-xl text-gray-600 mb-8">Découvrez notre service de mise en relation spécialisé dans l'optimisation de vos finances.</p>
        
        {/* Bande tricolore subtile */}
        <div className="w-32 h-1 bg-gradient-to-r from-blue-600 via-white to-red-600 rounded-full mx-auto mb-8 opacity-80"></div>
        
        <div className="flex justify-center mb-12">
          <div className="inline-flex rounded-full bg-white p-2 shadow-lg border-2 border-blue-200">
            <button
              className={`px-8 py-3 rounded-full font-semibold transition-all duration-300 ${
                role === 'client' 
                  ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg transform scale-105' 
                  : 'text-blue-600 hover:bg-blue-50 hover:text-blue-700'
              }`}
              onClick={() => setRole('client')}
            >
              Client
            </button>
            <button
              className={`px-8 py-3 rounded-full font-semibold transition-all duration-300 ${
                role === 'expert' 
                  ? 'bg-gradient-to-r from-red-600 to-red-700 text-white shadow-lg transform scale-105' 
                  : 'text-red-600 hover:bg-red-50 hover:text-red-700'
              }`}
              onClick={() => setRole('expert')}
            >
              Expert
            </button>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
        {stepsData[role].map((step, idx) => (
          <div
            key={idx}
            className={`bg-white rounded-xl shadow-lg flex flex-col items-center text-center border-2 transition-all duration-300 min-h-[380px] px-6 py-8 transform hover:scale-105 hover:shadow-xl cursor-pointer relative overflow-hidden ${
              step.color === 'blue' 
                ? 'border-blue-200 hover:border-blue-400' 
                : 'border-red-200 hover:border-red-400'
            }`}
          >
            {/* Éléments décoratifs français subtils */}
            <div className={`absolute top-0 left-0 w-full h-1 ${
              step.color === 'blue' 
                ? 'bg-gradient-to-r from-blue-600 via-blue-400 to-blue-600' 
                : 'bg-gradient-to-r from-red-600 via-red-400 to-red-600'
            } opacity-80`}></div>
            
            <div className="flex flex-col items-center w-full relative z-10">
              {/* Numéro d'étape avec design français */}
              <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg mb-4 ${
                step.color === 'blue' 
                  ? 'bg-gradient-to-r from-blue-600 to-blue-700' 
                  : 'bg-gradient-to-r from-red-600 to-red-700'
              } shadow-lg`}>
                {idx + 1}
              </div>
              
              {/* Icône */}
              <div className="mb-4">
                {step.icon}
              </div>
              
              {/* Titre */}
              <div className={`font-bold mb-3 text-lg leading-tight break-words w-full ${
                step.color === 'blue' ? 'text-blue-900' : 'text-red-900'
              }`}>
                {step.title}
              </div>
              
              {/* Description */}
              <div className="text-gray-600 text-sm leading-relaxed w-full break-words text-center">
                {step.desc}
              </div>
            </div>
            
            {/* Indicateur de progression */}
            {idx < stepsData[role].length - 1 && (
              <div className="hidden lg:block absolute -right-3 top-1/2 transform -translate-y-1/2">
                <div className={`w-6 h-6 rounded-full border-2 ${
                  step.color === 'blue' ? 'border-blue-300' : 'border-red-300'
                } bg-white shadow-md`}>
                  <div className={`w-2 h-2 rounded-full mx-auto mt-1 ${
                    step.color === 'blue' ? 'bg-blue-600' : 'bg-red-600'
                  }`}></div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
      
      {/* Section d'information supplémentaire */}
      <div className="mt-16 text-center">
        <div className="bg-white rounded-xl p-8 shadow-lg border border-blue-100">
          <h3 className="text-2xl font-bold text-blue-900 mb-4">L'expertise française à votre service</h3>
          <p className="text-gray-600 mb-6">
            Notre plateforme connecte les meilleurs experts français aux entreprises qui en ont besoin, 
            garantissant un accompagnement de qualité et des résultats optimaux.
          </p>
          <div className="flex items-center justify-center space-x-6">
            <div className="flex items-center space-x-2">
              <Award className="w-5 h-5 text-blue-600" />
              <span className="text-sm text-gray-600">Experts certifiés</span>
            </div>
            <div className="flex items-center space-x-2">
              <ShieldCheck className="w-5 h-5 text-red-600" />
              <span className="text-sm text-gray-600">Sécurité garantie</span>
            </div>
            <div className="flex items-center space-x-2">
              <DollarSign className="w-5 h-5 text-blue-600" />
              <span className="text-sm text-gray-600">Économies assurées</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
} 