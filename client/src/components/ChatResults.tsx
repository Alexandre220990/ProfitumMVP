import React, { useEffect, useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { CheckCircle, TrendingUp, ArrowRight, Euro, Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { API_URL } from '@/config';

interface EligibleProduct {
  id: string;
  nom: string;
  description: string;
  estimatedGain?: number;
  gainPotentiel?: number;
  reasons?: string[];
}

interface ChatResultsProps {
  eligibleProducts: EligibleProduct[];
  totalGain: number;
  profileData: any;
  onContactExpert: () => void;
  onStartProcess: () => void;
}

export const ChatResults: React.FC<ChatResultsProps> = ({
  eligibleProducts,
  totalGain,
  profileData,
  onContactExpert,
  onStartProcess
}) => {
  const { user } = useAuth();
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');
  const hasSavedRef = useRef(false); // Référence pour éviter la double sauvegarde

  // Fonction utilitaire pour obtenir le gain d'un produit de manière sécurisée
  const getProductGain = (product: EligibleProduct): number => {
    const gain = product.estimatedGain || product.gainPotentiel;
    return typeof gain === 'number' ? gain : 0;
  };

  // Calculer le gain total réel basé sur les produits
  const actualTotalGain = eligibleProducts.reduce((sum, product) => {
    return sum + getProductGain(product);
  }, 0);

  // Sauvegarder automatiquement les résultats
  useEffect(() => {
    const saveResults = async () => {
      // Protection contre la double sauvegarde
      if (!user?.id || eligibleProducts.length === 0 || saveStatus !== 'idle' || hasSavedRef.current) {
        return;
      }

      // Marquer comme sauvegardé pour éviter les doublons
      hasSavedRef.current = true;
      setIsSaving(true);
      setSaveStatus('saving');

      try {
        console.log('💾 Sauvegarde automatique des résultats du chatbot...');
        
        const response = await fetch(`${API_URL}/api/chatbot/save-results`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify({
            clientId: user.id,
            eligibleProducts: eligibleProducts.map(product => ({
              nom: product.nom,
              estimatedGain: getProductGain(product),
              reasons: product.reasons || []
            })),
            profileData
          })
        });

        const data = await response.json();

        if (data.success) {
          console.log('✅ Résultats sauvegardés avec succès:', data);
          setSaveStatus('success');
        } else {
          console.error('❌ Erreur sauvegarde:', data.message);
          setSaveStatus('error');
          // Réinitialiser la référence en cas d'erreur pour permettre une nouvelle tentative
          hasSavedRef.current = false;
        }
      } catch (error) {
        console.error('❌ Erreur lors de la sauvegarde:', error);
        setSaveStatus('error');
        // Réinitialiser la référence en cas d'erreur pour permettre une nouvelle tentative
        hasSavedRef.current = false;
      } finally {
        setIsSaving(false);
      }
    };

    saveResults();
  }, [user?.id, eligibleProducts, saveStatus]);

  return (
    <div className="space-y-6 p-6 bg-gradient-to-br from-green-50 to-blue-50 rounded-xl border border-green-200">
      {/* Header */}
      <div className="text-center">
        <div className="flex items-center justify-center mb-4">
          <CheckCircle className="w-12 h-12 text-green-600 mr-3" />
          <h2 className="text-3xl font-bold text-gray-800">Analyse terminée !</h2>
        </div>
        <p className="text-lg text-gray-600 mb-2">
          Nous avons identifié <span className="font-bold text-blue-600">{eligibleProducts.length}</span> opportunités d'optimisation
        </p>
        <div className="flex items-center justify-center text-2xl font-bold text-green-600">
          <Euro className="w-8 h-8 mr-2" />
          Gain total estimé : {actualTotalGain.toLocaleString()}€
        </div>
        
        {/* Statut de sauvegarde */}
        {saveStatus === 'saving' && (
          <div className="flex items-center justify-center mt-4 text-blue-600">
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            <span className="text-sm">Sauvegarde en cours...</span>
          </div>
        )}
        {saveStatus === 'success' && (
          <div className="flex items-center justify-center mt-4 text-green-600">
            <CheckCircle className="w-4 h-4 mr-2" />
            <span className="text-sm">Résultats sauvegardés !</span>
          </div>
        )}
        {saveStatus === 'error' && (
          <div className="flex items-center justify-center mt-4 text-red-600">
            <span className="text-sm">Erreur de sauvegarde</span>
          </div>
        )}
      </div>

      {/* Profil client */}
      <Card className="bg-white/80 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center">
            <TrendingUp className="w-5 h-5 mr-2 text-blue-600" />
            Votre profil
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <span className="font-semibold text-gray-600">Secteur :</span>
              <p className="text-gray-800">{profileData?.secteur || 'Non spécifié'}</p>
            </div>
            <div>
              <span className="font-semibold text-gray-600">Employés :</span>
              <p className="text-gray-800">{profileData?.nombreEmployes || 'Non spécifié'}</p>
            </div>
            <div>
              <span className="font-semibold text-gray-600">CA :</span>
              <p className="text-gray-800">{profileData?.chiffreAffaires || 'Non spécifié'}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Produits éligibles */}
      {eligibleProducts.length > 0 ? (
        <div className="space-y-4">
          <h3 className="text-xl font-bold text-gray-800 text-center">
            Produits éligibles identifiés
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {eligibleProducts.map((product) => {
              const gain = getProductGain(product);
              return (
                <Card key={product.id} className="bg-white/90 backdrop-blur-sm hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span className="text-lg">{product.nom}</span>
                      <div className="flex items-center text-green-600 font-bold">
                        <Euro className="w-4 h-4 mr-1" />
                        {gain.toLocaleString()}€
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600 mb-3">{product.description}</p>
                    <div className="space-y-1">
                      <span className="text-sm font-semibold text-gray-700">Raisons d'éligibilité :</span>
                      <ul className="text-sm text-gray-600 space-y-1">
                        {product.reasons && product.reasons.length > 0 ? (
                          product.reasons.map((reason, idx) => (
                            <li key={idx} className="flex items-start">
                              <CheckCircle className="w-3 h-3 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                              {reason}
                            </li>
                          ))
                        ) : (
                          <li className="text-gray-500 italic">Aucune raison spécifiée</li>
                        )}
                      </ul>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      ) : (
        <Card className="bg-white/80 backdrop-blur-sm">
          <CardContent className="text-center py-8">
            <div className="text-gray-500 mb-4">
              <TrendingUp className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <h3 className="text-xl font-semibold mb-2">Aucun produit éligible identifié</h3>
              <p className="text-gray-600">
                Nos experts peuvent vous aider à optimiser votre structure pour bénéficier de ces dispositifs.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
        <Button 
          onClick={onContactExpert}
          className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3"
        >
          <ArrowRight className="w-4 h-4 mr-2" />
          Contacter un expert
        </Button>
        <Button 
          onClick={onStartProcess}
          variant="outline"
          className="border-green-600 text-green-600 hover:bg-green-50 px-8 py-3"
        >
          Commencer le processus
        </Button>
      </div>

      {/* Prochaines étapes */}
      <Card className="bg-white/80 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-lg">Prochaines étapes</CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="space-y-2 text-sm">
            <li className="flex items-start">
              <span className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold mr-3 mt-0.5">1</span>
              <span>Validation détaillée de chaque dispositif par nos experts</span>
            </li>
            <li className="flex items-start">
              <span className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold mr-3 mt-0.5">2</span>
              <span>Optimisation des montants et conditions d'éligibilité</span>
            </li>
            <li className="flex items-start">
              <span className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold mr-3 mt-0.5">3</span>
              <span>Mise en place des dossiers et suivi administratif</span>
            </li>
          </ol>
        </CardContent>
      </Card>
    </div>
  );
}; 