import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Briefcase, Scale, Calculator, FileText } from "lucide-react";

const services = [
  {
    icon: <Briefcase className="w-8 h-8" />,
    title: "Consultation d'Entreprise",
    description: "Conseils stratégiques pour le développement et la croissance de votre entreprise",
  },
  {
    icon: <Scale className="w-8 h-8" />,
    title: "Services Juridiques",
    description: "Assistance juridique et conseils légaux par des avocats expérimentés",
  },
  {
    icon: <Calculator className="w-8 h-8" />,
    title: "Services Comptables",
    description: "Gestion comptable, fiscale et financière pour votre entreprise",
  },
  {
    icon: <FileText className="w-8 h-8" />,
    title: "Audit et Conformité",
    description: "Évaluation et mise en conformité de vos processus d'entreprise",
  },
];

export default function ServicesPage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="bg-background border-b">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold">Profitum</h1>
          <Button asChild variant="outline">
            <Link to="/">Retour à l'accueil</Link>
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Nos Services</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Découvrez notre gamme complète de services professionnels pour répondre à vos besoins
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {services.map((service, index) => (
            <Card key={index} className="group hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="mb-4 text-primary">{service.icon}</div>
                <CardTitle>{service.title}</CardTitle>
                <CardDescription>{service.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild className="w-full">
                  <Link to="/auth">Demander un devis</Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
    </div>
  );
}
