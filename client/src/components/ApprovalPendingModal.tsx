
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Clock, Mail, AlertCircle, CheckCircle } from "lucide-react";

interface ApprovalPendingModalProps {
  isOpen: boolean;
  onClose: () => void;
  approvalStatus: string;
}

export default function ApprovalPendingModal({ isOpen, onClose, approvalStatus }: ApprovalPendingModalProps) {
  const getStatusInfo = () => {
    switch (approvalStatus) {
      case 'pending':
        return {
          title: "Compte en cours d'approbation",
          message: "Votre compte expert est actuellement en cours d'examen par nos équipes Profitum. Ce processus prend généralement 24 à 48 heures.",
          icon: Clock,
          color: "text-yellow-600",
          bgColor: "bg-yellow-50",
          borderColor: "border-yellow-200"
        };
      case 'rejected':
        return {
          title: "Compte non approuvé",
          message: "Votre demande d'inscription n'a pas été approuvée. Vous pouvez nous contacter pour plus d'informations.",
          icon: AlertCircle,
          color: "text-red-600",
          bgColor: "bg-red-50",
          borderColor: "border-red-200"
        };
      default:
        return {
          title: "Statut en cours de vérification",
          message: "Votre compte est en cours de vérification. Veuillez patienter.",
          icon: Clock,
          color: "text-blue-600",
          bgColor: "bg-blue-50",
          borderColor: "border-blue-200"
        };
    }
  };

  const statusInfo = getStatusInfo();
  const IconComponent = statusInfo.icon;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <IconComponent className={`h-5 w-5 ${statusInfo.color}`} />
            {statusInfo.title}
          </DialogTitle>
        </DialogHeader>
        
        <div className={`p-4 rounded-lg ${statusInfo.bgColor} ${statusInfo.borderColor} border`}>
          <p className="text-gray-700 mb-4">
            {statusInfo.message}
          </p>
          
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
              <div>
                <p className="font-medium text-gray-900">Ce que nous vérifions :</p>
                <ul className="text-sm text-gray-600 mt-1 space-y-1">
                  <li>• Votre expertise et qualifications</li>
                  <li>• La validité de vos informations</li>
                  <li>• La conformité avec nos standards</li>
                </ul>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <Mail className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <p className="font-medium text-gray-900">Vous recevrez :</p>
                <p className="text-sm text-gray-600 mt-1">
                  Un email de confirmation dès que votre compte sera approuvé.
                </p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex justify-end gap-3 pt-4">
          <Button variant="outline" onClick={onClose}>
            Fermer
          </Button>
          <Button onClick={() => window.location.href = '/contact'}>
            Nous contacter
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
} 