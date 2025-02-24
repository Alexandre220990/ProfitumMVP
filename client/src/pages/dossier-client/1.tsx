import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { FileText, User, Calendar, DollarSign, CheckCircle2 } from "lucide-react";

export default function ClosedCasePage() {
  const [, setLocation] = useLocation();

  // ✅ Données détaillées du dossier clôturé
  const caseDetails = {
    id: 1,
    clientName: "Julien Mercier",
    auditType: "Audit TICPE",
    closureDate: "01/02/2025",
    estimatedAmount: 7800,
    obtainedAmount: 5000,
    fiability: 64,
    status: "success",
    comments: "Audit réalisé avec succès, montant obtenu conforme à l'estimation."
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6 flex justify-center">
      <Card className="w-full max-w-3xl">
        <CardHeader>
          <CardTitle className="text-2xl">Dossier Clôturé - {caseDetails.clientName}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center space-x-4">
            <User className="w-6 h-6 text-gray-600" />
            <p className="text-lg font-semibold">Client : {caseDetails.clientName}</p>
          </div>

          <div className="flex items-center space-x-4">
            <FileText className="w-6 h-6 text-gray-600" />
            <p className="text-lg font-semibold">Type d'audit : {caseDetails.auditType}</p>
          </div>

          <div className="flex items-center space-x-4">
            <Calendar className="w-6 h-6 text-gray-600" />
            <p className="text-lg font-semibold">Date de clôture : {caseDetails.closureDate}</p>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="flex items-center space-x-4">
              <DollarSign className="w-6 h-6 text-gray-600" />
              <p className="text-lg font-semibold">Montant estimé : {caseDetails.estimatedAmount} €</p>
            </div>
            <div className="flex items-center space-x-4">
              <DollarSign className="w-6 h-6 text-gray-600" />
              <p className="text-lg font-semibold">Montant obtenu : {caseDetails.obtainedAmount} €</p>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <CheckCircle2 className="w-6 h-6 text-gray-600" />
            <p className="text-lg font-semibold">Fiabilité : {caseDetails.fiability}%</p>
          </div>

          <div className="mt-4">
            <p className="text-lg font-semibold">Commentaires :</p>
            <p className="text-gray-700">{caseDetails.comments}</p>
          </div>

          <Button onClick={() => setLocation("/dashboard/partner")}>Retour au tableau de bord</Button>
        </CardContent>
      </Card>
    </div>
  );
}
