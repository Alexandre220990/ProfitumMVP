import ProductProcessWorkflow from "@/components/ProductProcessWorkflow";
import HeaderClient from "@/components/HeaderClient";

const JuridiqueProductPage = () => { 
  // Pour l'instant, on utilise des valeurs par défaut
  // Ces valeurs devraient être récupérées depuis l'API pour un vrai client
  const defaultProps = {
    dossierId: "juridique-dossier-001", // ID du dossier juridique
    productType: "juridique", // Type de produit
    currentStep: "simulation", // Étape actuelle du processus
    onStepAction: (stepId: string, action: string) => console.log('Action sur étape:', stepId, action),
    onMessageSend: (message: string) => console.log('Message envoyé:', message)
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
      {/* Header Client */}
      <HeaderClient />

      {/* Contenu principal avec marge pour le header fixe */}
      <div className="pt-20">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <ProductProcessWorkflow {...defaultProps} />
        </div>
      </div>
    </div>
  );
};

export default JuridiqueProductPage; 