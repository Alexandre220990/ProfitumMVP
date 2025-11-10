/**
 * Carte pour demander un devis au partenaire
 */

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Loader2, Handshake, CheckCircle } from 'lucide-react';
import { post } from '@/lib/api';

interface PartnerRequestCardProps {
  dossierId: string;
  productName: string;
  partnerName: string;
  onRequestSent: () => void;
}

export default function PartnerRequestCard({
  dossierId,
  productName,
  partnerName,
  onRequestSent
}: PartnerRequestCardProps) {
  const [loading, setLoading] = useState(false);

  const handleRequest = async () => {
    try {
      setLoading(true);
      const response = await post(`/api/simplified-products/${dossierId}/partner-request`, {});

      if (response.success) {
        toast.success('✅ Demande de devis envoyée avec succès');
        onRequestSent();
      } else {
        toast.error(response.message || 'Erreur lors de l\'envoi');
      }
    } catch (error: any) {
      console.error('Erreur partner-request:', error);
      toast.error('Erreur lors de l\'envoi de la demande');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="max-w-2xl mx-auto border-blue-200 bg-gradient-to-br from-blue-50 via-white to-blue-50">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="p-3 bg-blue-100 rounded-lg">
            <Handshake className="w-6 h-6 text-blue-600" />
          </div>
          <div className="flex-1">
            <CardTitle className="text-xl">Notre partenaire {partnerName}</CardTitle>
            <p className="text-sm text-gray-600 mt-1">
              {partnerName === 'O\'clock' 
                ? '1er fournisseur de chronotachygraphes digitaux en France'
                : 'Solution de gestion comptable et RH pour PME'}
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
          <div className="p-4 bg-white rounded-lg border border-blue-200">
          <p className="text-sm text-gray-700 mb-3">
            {partnerName.toLowerCase().includes('sdei')
              ? 'SDEI est le partenaire recommandé pour déployer vos chronotachygraphes digitaux et assurer la conformité de votre flotte.'
              : `${partnerName} propose une solution complète pour automatiser votre gestion comptable et RH.`}
          </p>
          <p className="text-sm font-semibold text-gray-900">
            Souhaitez-vous envoyer votre demande de devis pour obtenir les informations complémentaires ?
          </p>
        </div>

        <div className="flex justify-end">
          <Button
            onClick={handleRequest}
            disabled={loading}
            className="min-w-[180px]"
            size="lg"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Envoi en cours...
              </>
            ) : (
              <>
                <CheckCircle className="w-4 h-4 mr-2" />
                Envoyer ma demande de devis
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

