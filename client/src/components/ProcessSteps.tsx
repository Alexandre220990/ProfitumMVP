import { useState } from "react";
import { UserCircle, ClipboardList, CheckCircle, Users, Headphones, ShieldCheck, Briefcase, FileText, DollarSign, ThumbsUp, Search, BookOpen, Edit3 } from "lucide-react";

const stepsData = {
  client: [
    {
      icon: <UserCircle className="w-8 h-8 text-blue-600 mb-2" />,
      title: "Création de compte",
      desc: "Validation par le service client"
    },
    {
      icon: <ClipboardList className="w-8 h-8 text-blue-600 mb-2" />,
      title: "Définissez votre profil entreprise",
      desc: "Effectuez votre 1e simulation grâce à notre agent IA"
    },
    {
      icon: <CheckCircle className="w-8 h-8 text-blue-600 mb-2" />,
      title: "Découvrez vos éligibilités",
      desc: "et démarrez facilement vos dossiers"
    },
    {
      icon: <Users className="w-8 h-8 text-blue-600 mb-2" />,
      title: "Recherchez, comparez et sélectionnez",
      desc: "les meilleurs experts"
    },
    {
      icon: <Headphones className="w-8 h-8 text-blue-600 mb-2" />,
      title: "Briefing & validation",
      desc: "Prise de contact avec l'expert et finalisation du dossier"
    },
    {
      icon: <ShieldCheck className="w-8 h-8 text-blue-600 mb-2" />,
      title: "Rapports et remboursements ",
      desc: "Recevez les rapports d'experts et recevez directement vos remboursements des trop perçus"
    }
  ],
  expert: [
    {
      icon: <UserCircle className="w-8 h-8 text-yellow-500 mb-2" />,
      title: "Inscription & profil",
      desc: "Création de votre profil"
    },
    {
      icon: <ThumbsUp className="w-8 h-8 text-yellow-500 mb-2" />,
      title: "Validation conseiller",
      desc: "Entretien et validation avec un conseiller"
    },
    {
      icon: <ClipboardList className="w-8 h-8 text-yellow-500 mb-2" />,
      title: "Sélection de l'abonnement et contractualisation",
      desc: "en fonction de vos besoins"
    },
    {
      icon: <Search className="w-8 h-8 text-yellow-500 mb-2" />,
      title: "Programmation du ciblage client",
      desc: "Secteur, taille, type d'entreprise, etc."
    },
    {
      icon: <FileText className="w-8 h-8 text-yellow-500 mb-2" />,
      title: "Commencez à recevoir et à suivre vos 1e demandes",
      desc: "Et uploadez votre activité actuelle pour un suivi global"
    },
    {
      icon: <DollarSign className="w-8 h-8 text-yellow-500 mb-2" />,
      title: "Paiement rapide",
      desc: "Gains versés sous 8 jours"
    }
  ]
};

export default function ProcessSteps() {
  const [role, setRole] = useState<'client' | 'expert'>('client');

  return (
    <section className="w-full max-w-7xl px-4 mx-auto py-12">
      <h2 className="text-3xl font-bold text-center mb-2">Fonctionnement de la plateforme</h2>
      <p className="text-center text-gray-500 mb-6">Découvrez notre service de mise en relation spécialisé dans l'optimisation de vos finances.</p>
      <div className="flex justify-center mb-8">
        <div className="inline-flex rounded-full bg-gray-100 p-1 shadow-sm">
          <button
            className={`px-6 py-2 rounded-full font-semibold transition-colors ${role === 'client' ? 'bg-blue-600 text-white shadow' : 'text-blue-600 hover:bg-blue-100'}`}
            onClick={() => setRole('client')}
          >
            Client
          </button>
          <button
            className={`px-6 py-2 rounded-full font-semibold transition-colors ${role === 'expert' ? 'bg-yellow-400 text-gray-900 shadow' : 'text-yellow-600 hover:bg-yellow-100'}`}
            onClick={() => setRole('expert')}
          >
            Expert
          </button>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-6">
        {stepsData[role].map((step, idx) => (
          <div
            key={idx}
            className="bg-white rounded-xl shadow flex flex-col items-center text-center border-t-4 border-blue-600 md:border-t-0 md:border-l-4 md:border-blue-600 lg:border-t-4 lg:border-l-0 transition-all min-h-[340px] px-4 py-8 transform hover:scale-105 hover:shadow-lg duration-200 cursor-pointer"
          >
            <div className="flex flex-col items-center w-full">
              {step.icon}
              <div className="text-2xl font-bold mb-1 mt-2">{idx + 1}</div>
              <div className="font-semibold mb-2 text-base leading-tight break-words w-full">{step.title}</div>
              <div className="text-gray-500 text-sm mt-2 leading-snug w-full break-words text-center">
                {step.desc}
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
} 