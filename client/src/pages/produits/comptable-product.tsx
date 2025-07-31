import CharteSignatureWorkflow from "@/components/CharteSignatureWorkflow";
import HeaderClient from "@/components/HeaderClient";

const ComptableProductPage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100">
      {/* Header Client */}
      <HeaderClient />

      {/* Contenu principal avec marge pour le header fixe */}
      <div className="pt-20">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <CharteSignatureWorkflow
            clientProduitId="default-comptable-dossier"
            productName="Comptable"
            companyName="Votre entreprise"
            onSignatureComplete={(success) => {
              console.log('Signature terminée:', success);
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default ComptableProductPage; 