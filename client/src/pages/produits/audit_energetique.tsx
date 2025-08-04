import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, FileText, ExternalLink, ArrowLeft } from 'lucide-react';
import HeaderClient from '@/components/HeaderClient';

const AuditEnergetiquePage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const handleStartProcess = async () => {
    if (!user) {
      navigate('/connect');
      return;
    }

    setIsLoading(true);
    try {
      // Logique simplifiée sans signature de charte
      console.log('Démarrage du processus Audit Énergétique pour:', user.id);
      navigate('/dashboard/client');
    } catch (error) {
      console.error('Erreur lors du démarrage du processus:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-100">
      <HeaderClient />
      
      <div className="pt-20">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="mb-6">
            <Button 
              variant="outline" 
              onClick={() => navigate(-1)}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Retour
            </Button>
          </div>

          <Card className="bg-white/80 backdrop-blur-sm border border-white/20 shadow-xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-2xl">
                <FileText className="w-6 h-6 text-orange-600" />
                Audit Énergétique
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="text-center py-8">
                <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                <h2 className="text-xl font-semibold text-gray-900 mb-2">
                  Conditions Générales de Vente
                </h2>
                <p className="text-gray-600 mb-6">
                  En vous inscrivant sur notre plateforme, vous acceptez automatiquement nos conditions générales de vente 
                  qui incluent les chartes d'engagement pour chaque produit.
                </p>
                <div className="flex gap-4 justify-center">
                  <Button 
                    variant="outline" 
                    className="flex items-center gap-2"
                    onClick={() => window.open('/cgv', '_blank')}
                  >
                    <ExternalLink className="w-4 h-4" />
                    Consulter les CGV
                  </Button>
                  <Button 
                    onClick={handleStartProcess}
                    disabled={isLoading}
                    className="flex items-center gap-2"
                  >
                    {isLoading ? 'Chargement...' : 'Commencer'}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AuditEnergetiquePage; 