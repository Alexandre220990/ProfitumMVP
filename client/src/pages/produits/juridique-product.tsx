import CharteSignatureWorkflow from "@/components/CharteSignatureWorkflow";
import HeaderClient from "@/components/HeaderClient";

const JuridiqueProductPage = () => { 
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
      {/* Header Client */}
      <HeaderClient />

      {/* Contenu principal avec marge pour le header fixe */}
      <div className="pt-20">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <CharteSignatureWorkflow
            clientProduitId="juridique-dossier-001"
            productName="Juridique"
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

export default JuridiqueProductPage; 