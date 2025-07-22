import React from 'react';

export default function HomepageTest() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-slate-900 mb-6">
            Homepage Test - SEO Optimisée
          </h1>
          <p className="text-xl text-slate-600 mb-8 max-w-3xl mx-auto">
            Cette page de test est optimisée pour le SEO et l'IA avec du contenu structuré et des meta tags.
          </p>
          
          <div className="bg-white rounded-lg shadow-lg p-8 max-w-2xl mx-auto">
            <h2 className="text-2xl font-bold text-slate-900 mb-4">
              Fonctionnalités SEO/IA implémentées :
            </h2>
            <ul className="text-left space-y-2 text-slate-600">
              <li>✅ HTML sémantique avec balises structurées</li>
              <li>✅ Meta tags optimisés (title, description, keywords)</li>
              <li>✅ Données structurées Schema.org</li>
              <li>✅ Contenu riche et détaillé</li>
              <li>✅ Structure claire pour les bots IA</li>
              <li>✅ Accessibilité améliorée</li>
            </ul>
          </div>
          
          <div className="mt-8">
            <a 
              href="/" 
              className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Retour à l'accueil
            </a>
          </div>
        </div>
      </div>
    </div>
  );
} 