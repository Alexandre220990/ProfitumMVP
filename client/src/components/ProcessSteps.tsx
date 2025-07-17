import React, { useState, useCallback, useMemo } from "react";
import { 
  UserCircle, 
  ClipboardList, 
  CheckCircle, 
  Users, 
  Headphones, 
  ShieldCheck, 
  FileText, 
  DollarSign, 
  ThumbsUp, 
  Search 
} from "lucide-react";

interface StepData {
  icon: React.ReactNode;
  title: string;
  desc: string;
}

interface StepsData {
  client: StepData[];
  expert: StepData[];
}

// Optimisation : Données des étapes avec useMemo
const useStepsData = (): StepsData => useMemo(() => ({
  client: [
    {
      icon: <UserCircle className="w-6 h-6 text-slate-600" />,
      title: "Création de compte",
      desc: "Validation par le service client"
    },
    {
      icon: <ClipboardList className="w-6 h-6 text-slate-600" />,
      title: "Profil entreprise",
      desc: "Simulation IA pour définir vos besoins"
    },
    {
      icon: <CheckCircle className="w-6 h-6 text-slate-600" />,
      title: "Éligibilités",
      desc: "Découvrez vos opportunités d'optimisation"
    },
    {
      icon: <Users className="w-6 h-6 text-slate-600" />,
      title: "Sélection d'experts",
      desc: "Comparez et choisissez les meilleurs spécialistes"
    },
    {
      icon: <Headphones className="w-6 h-6 text-slate-600" />,
      title: "Briefing & validation",
      desc: "Finalisation du dossier avec l'expert"
    },
    {
      icon: <ShieldCheck className="w-6 h-6 text-slate-600" />,
      title: "Rapports & remboursements",
      desc: "Suivi et réception des optimisations"
    }
  ],
  expert: [
    {
      icon: <UserCircle className="w-6 h-6 text-slate-600" />,
      title: "Inscription & profil",
      desc: "Création de votre profil expert"
    },
    {
      icon: <ThumbsUp className="w-6 h-6 text-slate-600" />,
      title: "Validation conseiller",
      desc: "Entretien et validation de votre expertise"
    },
    {
      icon: <ClipboardList className="w-6 h-6 text-slate-600" />,
      title: "Abonnement & contractualisation",
      desc: "Choix de votre formule d'accompagnement"
    },
    {
      icon: <Search className="w-6 h-6 text-slate-600" />,
      title: "Ciblage client",
      desc: "Configuration de votre périmètre d'intervention"
    },
    {
      icon: <FileText className="w-6 h-6 text-slate-600" />,
      title: "Réception des demandes",
      desc: "Suivi et gestion de vos missions"
    },
    {
      icon: <DollarSign className="w-6 h-6 text-slate-600" />,
      title: "Paiement rapide",
      desc: "Rémunération sous 8 jours"
    }
  ]
}), []);

// Optimisation : Composant Step optimisé avec React.memo
const ProcessStep = React.memo(({
  step,
  index,
  isActive
}: {
  step: StepData;
  index: number;
  isActive: boolean;
}) => {
  return (
    <div
      className={`group relative bg-white/50 backdrop-blur-sm rounded-2xl border border-slate-200/60 transition-all duration-300 hover:bg-white hover:border-slate-300 hover:shadow-lg hover:shadow-slate-200/50 ${
        isActive ? 'ring-2 ring-blue-500/20' : ''
      }`}
    >
      <div className="p-6 space-y-4">
        {/* Numéro d'étape */}
        <div className="flex items-center justify-between">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center text-sm font-medium text-slate-600">
            {index + 1}
          </div>
          <div className="text-slate-400 group-hover:text-slate-600 transition-colors">
            {step.icon}
          </div>
        </div>
        
        {/* Contenu */}
        <div className="space-y-2">
          <h3 className="font-semibold text-slate-900 text-sm leading-tight">
            {step.title}
          </h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            {step.desc}
          </p>
        </div>
      </div>
      
      {/* Indicateur de progression */}
      {index < 5 && (
        <div className="absolute -bottom-3 left-1/2 transform -translate-x-1/2 w-6 h-6 bg-white border-2 border-slate-200 rounded-full flex items-center justify-center">
          <div className="w-2 h-2 bg-slate-300 rounded-full"></div>
        </div>
      )}
    </div>
  );
});

ProcessStep.displayName = 'ProcessStep';

// Optimisation : Composant RoleToggle optimisé avec React.memo
const RoleToggle = React.memo(({
  role,
  onRoleChange
}: {
  role: 'client' | 'expert';
  onRoleChange: (newRole: 'client' | 'expert') => void;
}) => (
  <div className="inline-flex bg-slate-100/80 backdrop-blur-sm rounded-2xl p-1.5 shadow-sm border border-slate-200/60">
    <button
      className={`px-6 py-2.5 rounded-xl font-medium text-sm transition-all duration-200 ${
        role === 'client' 
          ? 'bg-white text-slate-900 shadow-sm border border-slate-200/60' 
          : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
      }`}
      onClick={() => onRoleChange('client')}
      aria-label="Voir le processus client"
    >
      Client
    </button>
    <button
      className={`px-6 py-2.5 rounded-xl font-medium text-sm transition-all duration-200 ${
        role === 'expert' 
          ? 'bg-white text-slate-900 shadow-sm border border-slate-200/60' 
          : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
      }`}
      onClick={() => onRoleChange('expert')}
      aria-label="Voir le processus expert"
    >
      Expert
    </button>
  </div>
));

RoleToggle.displayName = 'RoleToggle';

export default function ProcessSteps() {
  const [role, setRole] = useState<'client' | 'expert'>('client');
  const stepsData = useStepsData();

  // Optimisation : Gestion du changement de rôle avec useCallback
  const handleRoleChange = useCallback((newRole: 'client' | 'expert') => {
    setRole(newRole);
  }, []);

  // Optimisation : Étapes actuelles avec useMemo
  const currentSteps = useMemo(() => {
    return stepsData[role];
  }, [stepsData, role]);

  return (
    <section className="w-full max-w-6xl mx-auto px-6 py-16">
      {/* En-tête */}
      <div className="text-center space-y-4 mb-12">
        <h2 className="text-3xl font-light text-slate-900 tracking-tight">
          Comment ça fonctionne
        </h2>
        <p className="text-slate-600 text-lg max-w-2xl mx-auto leading-relaxed">
          Découvrez notre approche simple et efficace pour optimiser vos finances
        </p>
      </div>
      
      {/* Sélecteur de rôle */}
      <div className="flex justify-center mb-12">
        <RoleToggle role={role} onRoleChange={handleRoleChange} />
      </div>
      
      {/* Grille des étapes */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {currentSteps.map((step, idx) => (
          <ProcessStep
            key={`${role}-${idx}`}
            step={step}
            index={idx}
            isActive={idx === 0}
          />
        ))}
      </div>
      
      {/* Note de bas de page */}
      <div className="text-center mt-12 pt-8 border-t border-slate-200/60">
        <p className="text-sm text-slate-500">
          Processus simplifié et transparent pour un accompagnement optimal
        </p>
      </div>
    </section>
  );
}