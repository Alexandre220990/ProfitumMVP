import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const ServicesPage = () => { const services = [{
      id: 1, title: "Audit Fiscal", description: "Analyse complète de votre situation fiscale", price: "À partir de 1 500 €" },
    { id: 2, title: "Audit Social", description: "Vérification de votre conformité sociale", price: "À partir de 2 000 €" },
    { id: 3, title: "Audit URSSAF", description: "Contrôle de vos déclarations URSSAF", price: "À partir de 1 800 €" }];

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">Nos Services</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        { services.map((service) => (
          <Card key={service.id }>
            <CardHeader>
              <CardTitle>{ service.title }</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-4">{ service.description }</p>
              <p className="font-bold mb-4">{ service.price }</p>
              <Button asChild>
                <Link to={ `/services/${service.id }`}>En savoir plus</Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default ServicesPage;
