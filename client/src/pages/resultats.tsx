import { CheckCircle } from "lucide-react";

const ResultatsPage = () => {

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-green-100">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-green-900 mb-4">Résultats de votre simulation</h1>
          <p className="text-lg text-green-700">
            Voici un aperçu des opportunités d'optimisation identifiées pour votre entreprise.
          </p>
        </div>
        
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">Récapitulatif</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-green-50 p-4 rounded-lg">
              <h3 className="font-semibold text-green-800 mb-2">Économies potentielles</h3>
              <p className="text-2xl font-bold text-green-600">€15,000 - €25,000</p>
              <p className="text-sm text-green-600">par an</p>
            </div>
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="font-semibold text-blue-800 mb-2">Produits éligibles</h3>
              <p className="text-2xl font-bold text-blue-600">4</p>
              <p className="text-sm text-blue-600">opportunités identifiées</p>
            </div>
          </div>
        </div>
        
        <div className="text-center">
          <p className="text-gray-600 mb-4">
            Pour commencer votre démarche d'optimisation, contactez-nous ou consultez nos experts.
          </p>
          <div className="space-x-4">
            <button className="bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700 transition">
              Commencer maintenant
            </button>
            <button className="bg-gray-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-gray-700 transition">
              En savoir plus
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResultatsPage; 