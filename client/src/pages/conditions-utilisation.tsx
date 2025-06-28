import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const ConditionsUtilisation = () => {
  return (
    <div className="container mx-auto p-4">
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Conditions d'utilisation</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="prose max-w-none">
            <h2>1. Introduction</h2>
            <p>
              Les présentes conditions d'utilisation régissent l'utilisation de notre plateforme.
              En accédant à notre site, vous acceptez ces conditions dans leur intégralité.
            </p>

            <h2>2. Utilisation du service</h2>
            <p>
              Notre plateforme est destinée à faciliter la mise en relation entre clients et experts.
              Vous vous engagez à utiliser le service de manière légale et éthique.
            </p>

            <h2>3. Confidentialité</h2>
            <p>
              Nous nous engageons à protéger vos données personnelles conformément à notre politique de confidentialité.
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-between items-center">
        <Button variant="outline" asChild>
          <Link to="/">Retour à l'accueil</Link>
        </Button>
      </div>
    </div>
  );
};

export default ConditionsUtilisation;
