import ProductProcessWorkflow from "@/components/ProductProcessWorkflow";
import HeaderClient from "@/components/HeaderClient";

const CEEProductPage = () => {
  // Pour l'instant, on utilise des valeurs par défaut
  // Ces valeurs devraient être récupérées depuis l'API pour un vrai client
  const defaultProps = {
    currentStep: "0",
    productType: "CEE",
    dossierId: "default-cee-dossier"
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-green-100">
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

export default CEEProductPage; 