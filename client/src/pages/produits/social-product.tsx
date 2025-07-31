import DossierStepsDisplay from "@/components/DossierStepsDisplay";
import HeaderClient from "@/components/HeaderClient";

const SocialProductPage = () => { 
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-100">
      { /* Header Client */ }
      <HeaderClient />

      { /* Contenu principal avec marge pour le header fixe */ }
      <div className="pt-20">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <DossierStepsDisplay
            dossierId="default-social-dossier"
            dossierName="Social - Votre dossier"
            showGenerateButton={true}
            compact={true}
            onStepUpdate={(stepId, updates) => {
              console.log('Étape mise à jour:', stepId, updates);
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default SocialProductPage; 