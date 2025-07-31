import CharteSignatureWorkflow from "@/components/CharteSignatureWorkflow";
import HeaderClient from "@/components/HeaderClient";

const CEEProductPage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-green-100">
      {/* Header Client */}
      <HeaderClient />

      {/* Contenu principal avec marge pour le header fixe */}
      <div className="pt-20">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <CharteSignatureWorkflow
            clientProduitId="default-cee-dossier"
            productName="CEE"
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

export default CEEProductPage; 