import ProductProcessWorkflow from "@/components/ProductProcessWorkflow";
import HeaderClient from "@/components/HeaderClient";

const ComptableProductPage = () => {
  // Pour l'instant, on utilise des valeurs par défaut
  // Ces valeurs devraient être récupérées depuis l'API pour un vrai client
  const defaultProps = {
    dossierId: "default-comptable-dossier",
    currentStep: "0",
    productType: "COMPTABLE"
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100">
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

export default ComptableProductPage; 