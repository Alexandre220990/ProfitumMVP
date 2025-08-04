import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, FileText, Shield, Users, Building2, Truck, Calculator } from "lucide-react";
import { useNavigate } from "react-router-dom";

const CGVPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => navigate(-1)}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Retour
              </Button>
              <div className="flex items-center gap-2">
                <FileText className="w-6 h-6 text-blue-600" />
                <h1 className="text-xl font-semibold text-gray-900">
                  Conditions Générales de Vente
                </h1>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Contenu principal */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="space-y-8">
          
          {/* Section Conditions Générales */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-600" />
                Conditions Générales de Vente
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-gray-700">
              <p className="text-sm">
                <strong>Date d'effet :</strong> 1er janvier 2024
              </p>
              
              <div className="space-y-4">
                <section>
                  <h3 className="font-semibold text-gray-900 mb-2">1. Objet</h3>
                  <p className="text-sm">
                    Les présentes conditions générales de vente (CGV) régissent les relations contractuelles entre Profitum, 
                    société spécialisée dans l'optimisation fiscale et sociale, et ses clients dans le cadre de l'accompagnement 
                    pour l'optimisation de leurs obligations fiscales et sociales.
                  </p>
                </section>

                <section>
                  <h3 className="font-semibold text-gray-900 mb-2">2. Services proposés</h3>
                  <p className="text-sm">
                    Profitum propose des services d'accompagnement et d'optimisation pour les entreprises dans les domaines suivants :
                  </p>
                  <ul className="text-sm list-disc list-inside ml-4 space-y-1">
                    <li>Optimisation des charges sociales (URSSAF, MSA)</li>
                    <li>Récupération de taxes (TICPE, CEE)</li>
                    <li>Crédits d'impôt (CIR, CICE)</li>
                    <li>Optimisation foncière</li>
                    <li>Audit énergétique</li>
                    <li>Accompagnement comptable et juridique</li>
                  </ul>
                </section>

                <section>
                  <h3 className="font-semibold text-gray-900 mb-2">3. Engagement du client</h3>
                  <p className="text-sm">
                    En souscrivant à nos services, le client s'engage à :
                  </p>
                  <ul className="text-sm list-disc list-inside ml-4 space-y-1">
                    <li>Fournir les informations et documents nécessaires dans les délais impartis</li>
                    <li>Collaborer activement avec l'expert assigné pour optimiser ses gains</li>
                    <li>Respecter les procédures et réglementations en vigueur</li>
                    <li>Informer immédiatement de tout changement de situation</li>
                    <li>Accepter les conditions de commission de l'expert</li>
                  </ul>
                </section>

                <section>
                  <h3 className="font-semibold text-gray-900 mb-2">4. Commission et rémunération</h3>
                  <p className="text-sm">
                    La commission de Profitum est calculée sur les gains effectivement obtenus par le client. 
                    Le taux de commission varie selon le type de service et est défini dans le contrat spécifique 
                    à chaque produit. Aucune commission n'est due si aucun gain n'est obtenu.
                  </p>
                </section>

                <section>
                  <h3 className="font-semibold text-gray-900 mb-2">5. Confidentialité</h3>
                  <p className="text-sm">
                    Profitum s'engage à maintenir la stricte confidentialité des informations fournies par le client 
                    et à ne les utiliser que dans le cadre de l'exécution des services souscrits.
                  </p>
                </section>
              </div>
            </CardContent>
          </Card>

          {/* Section Chartes d'Engagement par Produit */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-green-600" />
                Chartes d'Engagement par Produit
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              
              {/* Charte TICPE */}
              <div className="border-l-4 border-blue-500 pl-4">
                <div className="flex items-center gap-2 mb-2">
                  <Truck className="w-5 h-5 text-blue-600" />
                  <h4 className="font-semibold text-gray-900">TICPE - Taxe Intérieure de Consommation sur les Produits Énergétiques</h4>
                </div>
                <div className="text-sm text-gray-700 space-y-2">
                  <p><strong>Engagement du client :</strong></p>
                  <ul className="list-disc list-inside ml-4 space-y-1">
                    <li>Fournir les justificatifs de consommation de carburant</li>
                    <li>Maintenir les chronotachygraphes en bon état</li>
                    <li>Respecter les réglementations de transport</li>
                    <li>Collaborer pour l'optimisation des trajets</li>
                  </ul>
                </div>
              </div>

              {/* Charte URSSAF */}
              <div className="border-l-4 border-green-500 pl-4">
                <div className="flex items-center gap-2 mb-2">
                  <Users className="w-5 h-5 text-green-600" />
                  <h4 className="font-semibold text-gray-900">URSSAF - Optimisation des charges sociales</h4>
                </div>
                <div className="text-sm text-gray-700 space-y-2">
                  <p><strong>Engagement du client :</strong></p>
                  <ul className="list-disc list-inside ml-4 space-y-1">
                    <li>Fournir les bulletins de salaire et contrats de travail</li>
                    <li>Maintenir une comptabilité à jour</li>
                    <li>Respecter les obligations déclaratives</li>
                    <li>Informer des changements de situation</li>
                  </ul>
                </div>
              </div>

              {/* Charte CIR */}
              <div className="border-l-4 border-purple-500 pl-4">
                <div className="flex items-center gap-2 mb-2">
                  <Building2 className="w-5 h-5 text-purple-600" />
                  <h4 className="font-semibold text-gray-900">CIR - Crédit d'Impôt Recherche</h4>
                </div>
                <div className="text-sm text-gray-700 space-y-2">
                  <p><strong>Engagement du client :</strong></p>
                  <ul className="list-disc list-inside ml-4 space-y-1">
                    <li>Fournir les documents de recherche et développement</li>
                    <li>Maintenir un suivi des dépenses R&D</li>
                    <li>Respecter les critères d'éligibilité</li>
                    <li>Collaborer pour l'optimisation des déclarations</li>
                  </ul>
                </div>
              </div>

              {/* Charte CEE */}
              <div className="border-l-4 border-orange-500 pl-4">
                <div className="flex items-center gap-2 mb-2">
                  <Calculator className="w-5 h-5 text-orange-600" />
                  <h4 className="font-semibold text-gray-900">CEE - Certificats d'Économies d'Énergie</h4>
                </div>
                <div className="text-sm text-gray-700 space-y-2">
                  <p><strong>Engagement du client :</strong></p>
                  <ul className="list-disc list-inside ml-4 space-y-1">
                    <li>Fournir les factures d'équipements éco-performants</li>
                    <li>Maintenir les équipements en bon état</li>
                    <li>Respecter les conditions d'installation</li>
                    <li>Collaborer pour la valorisation des économies</li>
                  </ul>
                </div>
              </div>

            </CardContent>
          </Card>

          {/* Section Contact */}
          <Card>
            <CardHeader>
              <CardTitle>Contact et Support</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-gray-700">
              <p className="mb-2">
                Pour toute question concernant nos conditions générales de vente ou nos chartes d'engagement, 
                n'hésitez pas à nous contacter :
              </p>
              <ul className="space-y-1">
                <li><strong>Email :</strong> contact@profitum.fr</li>
                <li><strong>Téléphone :</strong> 01 23 45 67 89</li>
                <li><strong>Adresse :</strong> 123 Rue de l'Optimisation, 75001 Paris</li>
              </ul>
            </CardContent>
          </Card>

        </div>
      </div>
    </div>
  );
};

export default CGVPage; 