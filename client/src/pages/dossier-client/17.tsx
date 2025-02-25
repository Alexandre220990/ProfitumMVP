import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useLocation } from "wouter";

const DossierClient17 = () => {
  const [, setLocation] = useLocation();

  const documents = [
    { name: "Déclarations TICPE (2024)", url: "#", type: "PDF" },
    { name: "Factures carburant", url: "#", type: "PDF" },
    { name: "Certificats véhicules", url: "#", type: "PDF" },
  ];

  return (
    <div className="container mx-auto p-4">
      <Card className="mb-6">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Dossier TICPE - Express Logistics Sud</CardTitle>
            <Badge variant="destructive">Refusé</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <p className="text-sm text-gray-500">Client</p>
              <p className="font-medium">Express Logistics Sud</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Date de création</p>
              <p className="font-medium">21/02/2024</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Type d'audit</p>
              <p className="font-medium">TICPE</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Montant estimé</p>
              <p className="font-medium">13 800 €</p>
            </div>
          </div>

          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-2">Documents fournis</h3>
            <div className="space-y-2">
              {documents.map((doc, index) => (
                <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <span>{doc.name}</span>
                  <div className="flex gap-2">
                    <Badge variant="secondary">{doc.type}</Badge>
                    <Button variant="outline" size="sm">Voir</Button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-between items-center">
            <Button variant="outline" onClick={() => setLocation("/dashboard/partner")}>
              Retour au tableau de bord
            </Button>
            <div className="space-x-2">
              <Button variant="destructive">Dossier refusé</Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DossierClient17;
