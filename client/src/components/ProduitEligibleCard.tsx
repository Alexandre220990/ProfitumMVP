import React from 'react';
import { ProduitEligible } from '../types/database';

interface ProduitEligibleCardProps {
  produit: ProduitEligible;
}

export const ProduitEligibleCard: React.FC<ProduitEligibleCardProps> = ({ produit }) => {
  return (
    <div className="bg-white shadow-lg rounded-lg p-6 mb-4 transition-all hover:shadow-xl">
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-xl font-bold text-gray-800">{produit.nom}</h3>
        <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
          Score: {produit.score}/100
        </div>
      </div>
      
      <p className="text-gray-600 mb-4">{produit.description}</p>
      
      {produit.tauxInteret && (
        <div className="mb-3">
          <span className="font-semibold">Taux d'intérêt : </span>
          <span className="text-green-600">{produit.tauxInteret}%</span>
        </div>
      )}
      
      {produit.montantMaximum && (
        <div className="mb-3">
          <span className="font-semibold">Montant maximum : </span>
          <span className="text-green-600">{produit.montantMaximum.toLocaleString()}€</span>
        </div>
      )}
      
      {produit.dureeRemboursement && (
        <div className="mb-4">
          <span className="font-semibold">Durée de remboursement : </span>
          <span>
            {produit.dureeRemboursement.minimum} - {produit.dureeRemboursement.maximum}{' '}
            {produit.dureeRemboursement.unite}
          </span>
        </div>
      )}
      
      {produit.conditions.length > 0 && (
        <div className="mb-4">
          <h4 className="font-semibold text-gray-700 mb-2">Conditions :</h4>
          <ul className="list-disc list-inside space-y-1">
            {produit.conditions.map((condition, index) => (
              <li key={index} className="text-gray-600">
                <span className="font-medium">{condition.titre}</span>
                <ul className="ml-6 list-circle">
                  {condition.details.map((detail, detailIndex) => (
                    <li key={detailIndex} className="text-sm">{detail}</li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        </div>
      )}
      
      {produit.criteres.length > 0 && (
        <div>
          <h4 className="font-semibold text-gray-700 mb-2">Critères d'éligibilité :</h4>
          <ul className="list-disc list-inside space-y-1">
            {produit.criteres.map((critere, index) => (
              <li key={index} className="text-gray-600">
                {critere.minimum} - {critere.maximum} {critere.unite}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}; 