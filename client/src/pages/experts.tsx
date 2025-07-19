// import React from 'react';
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ShieldCheck, Clock, TrendingUp, Layers, BarChart } from "lucide-react";
import PublicHeader from '@/components/PublicHeader';

const benefits = [{ icon: <ShieldCheck className="w-8 h-8 text-blue-600" />, title: 'Experts certifiés', description: 'Des professionnels sélectionnés pour leur expérience et leur sérieux.' },
  { icon: <Clock className="w-8 h-8 text-blue-600" />, title: 'Réactivité & gain de temps', description: 'Accès rapide à l’expertise adaptée à votre besoin.' },
  { icon: <TrendingUp className="w-8 h-8 text-blue-600" />, title: 'Optimisation maximale', description: 'Des dispositifs sur-mesure pour maximiser vos économies.' },
  { icon: <Layers className="w-8 h-8 text-blue-600" />, title: 'Plateforme tout-en-un', description: 'Suivi, messagerie, documents et pilotage centralisés.' },
  { icon: <BarChart className="w-8 h-8 text-blue-600" />, title: 'Transparence & suivi', description: 'Vision claire des prestations, coûts et résultats.' }];

const ExpertsPage: React.FC = () => { const navigate = useNavigate();
  return (
    <div>
      <PublicHeader />
      { /* Section d'intro visuelle */ }
      <section className="bg-gradient-to-r from-blue-700 to-blue-900 text-white py-20 text-center mb-10 mt-8 rounded-xl shadow-lg mx-2">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-extrabold mb-6 drop-shadow">
            La 1<sup>ère</sup> marketplace où, au même endroit,<br />
            vous pouvez sélectionner vos experts<br />
            <span className="text-yellow-300">et suivre vos dossiers en temps réel</span>
          </h1>
          <p className="text-lg md:text-xl mb-10 opacity-90">
            Profitez d'une expérience unique&nbsp;: sélectionnez, échangez et pilotez vos missions avec des experts certifiés, le tout sur une plateforme centralisée et transparente.
          </p>
          <Button size="lg" className="text-lg px-8 py-4 bg-yellow-400 text-black font-bold hover:bg-yellow-500 shadow-lg" onClick={ () => navigate('/simulateur') }>
            Remplir le simulateur pour accéder à la plateforme
          </Button>
        </div>
      </section>
      { /* Bénéfices */ }
      <section className="container mx-auto px-4 py-8">
        <h2 className="text-2xl font-bold text-blue-900 mb-8 text-center">Pourquoi choisir un expert via Profitum&nbsp;?</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          { benefits.map((b, idx) => (
            <div key={idx } className="bg-white rounded-xl shadow p-8 flex flex-col items-center border-l-4 border-blue-500 hover:shadow-2xl transition-all">
              <div className="mb-4">{ b.icon }</div>
              <h3 className="text-xl font-semibold text-blue-700 mb-2">{ b.title }</h3>
              <p className="text-gray-700 text-center">{ b.description }</p>
            </div>
          ))}
        </div>
      </section>
      { /* Call to action final */ }
      <div className="flex justify-center mt-12 mb-10">
        <Button size="lg" className="text-lg px-8 py-4 bg-blue-600 hover:bg-blue-700 shadow-xl" onClick={ () => navigate('/create-account-client') }>
          Commencer avec un expert Profitum
        </Button>
      </div>
    </div>
  );
};

export default ExpertsPage;
