/**
 * Composant wizard pour les vérifications initiales
 * Utilisé pour Chronotachygraphes et Logiciel Solid
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Loader2, CheckCircle } from 'lucide-react';
import { post } from '@/lib/api';

interface InitialChecksWizardProps {
  dossierId: string;
  productKey: 'chronotachygraphes' | 'logiciel_solid';
  initialData?: {
    nb_camions?: number;
    equipement_chrono?: boolean;
    nb_utilisateurs?: number;
    besoins?: string;
  };
  onComplete: () => void;
}

export default function InitialChecksWizard({
  dossierId,
  productKey,
  initialData,
  onComplete
}: InitialChecksWizardProps) {
  const [loading, setLoading] = useState(false);
  const [nbCamions, setNbCamions] = useState<number>(initialData?.nb_camions || 0);
  const [equipementChrono, setEquipementChrono] = useState<boolean | null>(
    initialData?.equipement_chrono !== undefined ? initialData.equipement_chrono : null
  );
  const [nbUtilisateurs, setNbUtilisateurs] = useState<number>(initialData?.nb_utilisateurs || 0);
  const [besoins, setBesoins] = useState<string>(initialData?.besoins || '');

  const isChrono = productKey === 'chronotachygraphes';

  const handleSubmit = async () => {
    if (isChrono) {
      if (!nbCamions || nbCamions <= 0) {
        toast.error('Veuillez indiquer le nombre de véhicules');
        return;
      }
      if (equipementChrono === null) {
        toast.error('Veuillez répondre à la question sur l\'équipement');
        return;
      }
    } else {
      if (!nbUtilisateurs || nbUtilisateurs <= 0) {
        toast.error('Veuillez indiquer le nombre d\'utilisateurs');
        return;
      }
      if (!besoins.trim()) {
        toast.error('Veuillez décrire vos besoins');
        return;
      }
    }

    try {
      setLoading(true);
      const payload = isChrono
        ? { nb_camions: nbCamions, equipement_chrono: equipementChrono }
        : { nb_utilisateurs: nbUtilisateurs, besoins };

      const response = await post(`/api/simplified-products/${dossierId}/initial-checks`, payload);

      if (response.success) {
        toast.success('✅ Vérifications enregistrées avec succès');
        onComplete();
      } else {
        toast.error(response.message || 'Erreur lors de l\'enregistrement');
      }
    } catch (error: any) {
      console.error('Erreur initial-checks:', error);
      toast.error('Erreur lors de l\'enregistrement');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CheckCircle className="w-5 h-5 text-green-600" />
          {isChrono ? 'Vérifications initiales - Chronotachygraphes' : 'Vérifications initiales - Logiciel Solid'}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {isChrono ? (
          <>
            <div className="space-y-2">
              <Label htmlFor="nb_camions">
                Confirmez-vous le nombre de véhicules de +7,5T que votre entreprise possède ?
              </Label>
              <Input
                id="nb_camions"
                type="number"
                min="1"
                value={nbCamions || ''}
                onChange={(e) => setNbCamions(parseInt(e.target.value) || 0)}
                placeholder="Ex: 12"
              />
              <p className="text-sm text-gray-500">
                Ce nombre provient de votre dernière simulation. Vous pouvez le modifier si nécessaire.
              </p>
            </div>

            <div className="space-y-3">
              <Label>Vos véhicules sont-ils équipés de chronotachygraphes digitaux ?</Label>
              <RadioGroup
                value={equipementChrono === null ? '' : equipementChrono ? 'oui' : 'non'}
                onValueChange={(value) => setEquipementChrono(value === 'oui')}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="oui" id="equipement-oui" />
                  <Label htmlFor="equipement-oui" className="cursor-pointer">Oui</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="non" id="equipement-non" />
                  <Label htmlFor="equipement-non" className="cursor-pointer">Non</Label>
                </div>
              </RadioGroup>
            </div>
          </>
        ) : (
          <>
            <div className="space-y-2">
              <Label htmlFor="nb_utilisateurs">
                Nombre d'utilisateurs prévus
              </Label>
              <Input
                id="nb_utilisateurs"
                type="number"
                min="1"
                value={nbUtilisateurs || ''}
                onChange={(e) => setNbUtilisateurs(parseInt(e.target.value) || 0)}
                placeholder="Ex: 10"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="besoins">
                Décrivez vos besoins et attentes
              </Label>
              <Textarea
                id="besoins"
                value={besoins}
                onChange={(e) => setBesoins(e.target.value)}
                placeholder="Ex: Automatisation de la gestion comptable, intégration ERP, formation des équipes..."
                rows={4}
              />
            </div>
          </>
        )}

        <div className="flex justify-end gap-3 pt-4">
          <Button
            onClick={handleSubmit}
            disabled={loading}
            className="min-w-[120px]"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Enregistrement...
              </>
            ) : (
              'Valider'
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

