import React from 'react';
import HeaderExpert from '@/components/HeaderExpert';
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileText, MessageSquare, CheckCircle, Clock, User, Download } from "lucide-react";

const dossier = { id: 1, client: {
    name: 'Transports Martin', siren: '123 456 789', contact: 'jean.martin@transports.fr', phone: '06 12 34 56 78', address: '12 rue de la Gare, 75010 Paris' },
  type: 'TICPE',
  status: 'En cours',
  progress: 70,
  gainPotentiel: 18000,
  gainObtenu: 6000,
  steps: [{ label: 'Charte signée', done: true },
    { label: 'Expert sélectionné', done: true },
    { label: 'Documents reçus', done: true },
    { label: 'Analyse en cours', done: false },
    { label: 'Rapport final', done: false }],
  documents: [{ name: 'Factures carburant.pdf', date: '12/05/2024', url: '#' },
    { name: 'Relevé kilométrique.xlsx', date: '10/05/2024', url: '#' }],
  messages: [{ from: 'client', content: 'Bonjour, voici les documents demandés.', date: '12/05/2024 09:12' },
    { from: 'expert', content: 'Merci, je commence l’analyse.', date: '12/05/2024 10:05' }]
};

const ExpertDossier: React.FC = () => { return (
    <div className="min-h-screen bg-gray-50">
      <HeaderExpert />
      <div className="container mx-auto p-4 mt-20">
        {/* Résumé du dossier */ }
        <Card className="p-6 mb-8 shadow-lg">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div>
              <h1 className="text-2xl font-bold text-blue-900 mb-2">Dossier #{ dossier.id } – { dossier.type }</h1>
              <Badge variant="secondary" className="mb-2">{ dossier.status }</Badge>
              <div className="text-gray-700">Client : <span className="font-semibold">{ dossier.client.name }</span></div>
              <div className="text-gray-500 text-sm">SIREN : { dossier.client.siren }</div>
            </div>
            <div className="flex flex-col gap-2 md:items-end">
              <div className="flex items-center gap-2">
                <span className="text-green-600 font-bold text-xl">{ dossier.gainPotentiel.toLocaleString() }€</span>
                <span className="text-gray-600">potentiel</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-blue-600 font-bold text-xl">{ dossier.gainObtenu.toLocaleString() }€</span>
                <span className="text-gray-600">obtenu</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-yellow-500" />
                <span className="text-yellow-600 font-semibold">{ dossier.progress }%</span>
                <span className="text-gray-600">avancement</span>
              </div>
            </div>
          </div>
        </Card>
        { /* Étapes */ }
        <Card className="p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4 text-blue-700">Étapes du dossier</h2>
          <div className="flex flex-wrap gap-4">
            { dossier.steps.map((step, idx) => (
              <div key={idx } className={ `flex items-center gap-2 px-4 py-2 rounded-full ${step.done ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-500' }`}>
                { step.done ? <CheckCircle className="w-5 h-5 text-green-500" /> : <Clock className="w-5 h-5 text-gray-400" /> }
                <span>{ step.label }</span>
              </div>
            ))}
          </div>
        </Card>
        { /* Documents et messages */ }
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          { /* Documents */ }
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2"><FileText className="w-5 h-5" /> Documents</h3>
            <ul className="space-y-3">
              { dossier.documents.map((doc, idx) => (
                <li key={idx } className="flex items-center justify-between bg-gray-100 rounded px-3 py-2">
                  <div className="flex items-center gap-2">
                    <Download className="w-4 h-4 text-blue-500" />
                    <span>{ doc.name }</span>
                  </div>
                  <span className="text-xs text-gray-500">{ doc.date }</span>
                </li>
              ))}
            </ul>
            <Button className="mt-4 w-full bg-blue-600 hover:bg-blue-700">Ajouter un document</Button>
          </Card>
          { /* Messages */ }
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2"><MessageSquare className="w-5 h-5" /> Messagerie</h3>
            <div className="space-y-4 max-h-60 overflow-y-auto">
              { dossier.messages.map((msg, idx) => (
                <div key={idx } className={ `flex ${msg.from === 'expert' ? 'justify-end' : 'justify-start' }`}> 
                  <div className={ `rounded-lg px-4 py-2 max-w-[70%] ${msg.from === 'expert' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-800' }`}>
                    <div className="flex items-center gap-2 mb-1">
                      <User className="w-4 h-4" />
                      <span className="font-semibold">{ msg.from === 'expert' ? 'Vous' : 'Client' }</span>
                    </div>
                    <div>{ msg.content }</div>
                    <div className="text-xs opacity-70 mt-1">{ msg.date }</div>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex gap-2 mt-4">
              <input className="flex-1 border rounded px-3 py-2" placeholder="Votre message..." />
              <Button>Envoyer</Button>
            </div>
          </Card>
        </div>
        { /* Actions rapides */ }
        <div className="flex flex-wrap gap-4 mt-10 justify-end">
          <Button variant="outline">Télécharger le rapport</Button>
          <Button className="bg-green-600 hover:bg-green-700">Finaliser le dossier</Button>
        </div>
      </div>
    </div>
  );
};

export default ExpertDossier;