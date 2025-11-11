/**
 * Composant wizard pour les vérifications initiales
 * Utilisé pour Chronotachygraphes et Logiciel Solid
 */

import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { Loader2, CheckCircle, Info } from 'lucide-react';
import { post } from '@/lib/api';
import { WorkflowDocumentUpload } from '@/components/documents/WorkflowDocumentUpload';

interface InitialChecksWizardProps {
  dossierId: string;
  productKey: 'chronotachygraphes' | 'logiciel_solid' | 'optimisation_fournisseur_electricite' | 'optimisation_fournisseur_gaz';
  initialData?: {
    total_vehicles?: number;
    equipped_vehicles?: number;
    installations_requested?: number;
    chauffeurs_estimes?: number;
    chauffeurs_confirmes?: number;
    nb_camions?: number;
    camions_equipes?: number;
    installations_souhaitees?: number;
    nb_chauffeurs?: number;
    nb_utilisateurs?: number;
    source?: 'simulation' | 'manual';
    energy_sources?: string[];
    site_count?: number;
    consumption_reference?: number;
  };
  simulationData?: {
    nb_chauffeurs?: number | null;
  };
  onComplete: (payload: Record<string, any>) => void;
}

export default function InitialChecksWizard({
  dossierId,
  productKey,
  initialData,
  simulationData,
  onComplete
}: InitialChecksWizardProps) {
  const isChrono = productKey === 'chronotachygraphes';
  const isElectricity = productKey === 'optimisation_fournisseur_electricite';
  const isGas = productKey === 'optimisation_fournisseur_gaz';
  const isEnergy = isElectricity || isGas;
  const isSolid = productKey === 'logiciel_solid';

  const simulationChauffeurs = useMemo(() => {
    if (!simulationData) return null;
    if (typeof simulationData.nb_chauffeurs === 'number') {
      return simulationData.nb_chauffeurs;
    }
    return null;
  }, [simulationData]);

  const [loading, setLoading] = useState(false);

  const [totalVehicles, setTotalVehicles] = useState<number>(
    initialData?.total_vehicles ??
      initialData?.nb_camions ??
      0
  );
  const [equippedVehicles, setEquippedVehicles] = useState<number>(
    initialData?.equipped_vehicles ??
      initialData?.camions_equipes ??
      0
  );
  const [installationsRequested, setInstallationsRequested] = useState<number>(
    initialData?.installations_requested ??
      initialData?.installations_souhaitees ??
      Math.max(
        (initialData?.total_vehicles ?? initialData?.nb_camions ?? 0) -
          (initialData?.equipped_vehicles ?? initialData?.camions_equipes ?? 0),
        0
      )
  );

  const [chauffeursEstimes, setChauffeursEstimes] = useState<number>(
    initialData?.chauffeurs_estimes ??
      initialData?.nb_chauffeurs ??
      initialData?.nb_utilisateurs ??
      simulationChauffeurs ??
      0
  );
  const [chauffeursConfirmes, setChauffeursConfirmes] = useState<number>(
    initialData?.chauffeurs_confirmes ??
      initialData?.nb_chauffeurs ??
      initialData?.nb_utilisateurs ??
      simulationChauffeurs ??
      0
  );
  const [source, setSource] = useState<'simulation' | 'manual'>(
    initialData?.source === 'manual' ? 'manual' : 'simulation'
  );

  const [energySources, setEnergySources] = useState<string[]>(() => {
    if (productKey === 'optimisation_fournisseur_electricite') {
      return ['electricite'];
    }
    if (Array.isArray(initialData?.energy_sources) && initialData.energy_sources.length > 0) {
      return initialData.energy_sources;
    }
    if (productKey === 'optimisation_fournisseur_gaz') {
      return ['gaz'];
    }
    return [];
  });
  const [siteCount, setSiteCount] = useState<number>(
    initialData?.site_count ?? 1
  );
  const [consumptionReference, setConsumptionReference] = useState<number>(
    initialData?.consumption_reference ?? 0
  );

  const installationsSuggestion = useMemo(() => {
    return Math.max(totalVehicles - equippedVehicles, 0);
  }, [totalVehicles, equippedVehicles]);

  useEffect(() => {
    if (!isChrono && simulationChauffeurs !== null) {
      if (
        (initialData?.chauffeurs_confirmes === undefined && chauffeursConfirmes === 0) ||
        (initialData && initialData.chauffeurs_confirmes === 0 && chauffeursConfirmes === 0)
      ) {
        setChauffeursEstimes(simulationChauffeurs);
        setChauffeursConfirmes(simulationChauffeurs);
        setSource('simulation');
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [simulationChauffeurs, isChrono]);

  const handleEnergySourceToggle = (value: string) => (checked: boolean | 'indeterminate') => {
    setEnergySources((prev) => {
      if (checked === true) {
        return Array.from(new Set([...prev, value]));
      }
      return prev.filter((item) => item !== value);
    });
  };

  const handleSubmit = async () => {
    if (isChrono) {
      if (!totalVehicles || totalVehicles <= 0) {
        toast.error('Indiquez le nombre de véhicules > 7,5 tonnes.');
        return;
      }
      if (equippedVehicles < 0 || equippedVehicles > totalVehicles) {
        toast.error('Le nombre de véhicules déjà équipés doit être compris entre 0 et le total de véhicules.');
        return;
      }
      if (installationsRequested < 0 || installationsRequested > totalVehicles) {
        toast.error('Le nombre d’installations souhaitées doit être compris entre 0 et le total de véhicules.');
        return;
      }
    } else {
      if (!chauffeursConfirmes || chauffeursConfirmes <= 0) {
        toast.error('Indiquez le nombre de chauffeurs concernés.');
        return;
      }
    } else if (isEnergy) {
      if (isGas && !energySources.length) {
        toast.error('Sélectionnez au moins une source d’énergie.');
        return;
      }
      if (!siteCount || siteCount <= 0) {
        toast.error('Indiquez le nombre de sites concernés.');
        return;
      }
    }

    try {
      setLoading(true);

      const normalizedEnergySources = isElectricity
        ? ['electricite']
        : energySources.length > 0
          ? energySources
          : ['gaz'];

      const payload = isChrono
        ? {
            total_camions: totalVehicles,
            camions_equipes: equippedVehicles,
            installations_souhaitees: installationsRequested
          }
        : isSolid
          ? {
              chauffeurs_estimes: chauffeursEstimes || chauffeursConfirmes,
              chauffeurs_confirmes: chauffeursConfirmes,
              source
            }
          : {
              energy_sources: normalizedEnergySources,
              site_count: siteCount,
              consumption_reference: consumptionReference
            };

      const response = await post(`/api/simplified-products/${dossierId}/initial-checks`, payload);

      if (response.success) {
        toast.success('✅ Informations enregistrées et transmises à l’expert');
        onComplete(payload);
      } else {
        toast.error(response.message || 'Erreur lors de l’enregistrement');
      }
    } catch (error: any) {
      console.error('Erreur initial-checks:', error);
      toast.error('Erreur lors de l’enregistrement');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CheckCircle className="w-5 h-5 text-green-600" />
          {isChrono
            ? 'Vérifications initiales - Chronotachygraphes'
            : isSolid
              ? 'Vérifications initiales - Logiciel Solid'
              : isElectricity
                ? 'Vérifications initiales - Optimisation fournisseur électricité'
                : 'Vérifications initiales - Optimisation fournisseur gaz'}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
      {isChrono ? (
          <>
            <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-blue-800">
              Ces informations permettent à notre expert d’établir un devis précis pour l’équipement de vos véhicules.
            </div>

            <div className="space-y-2">
              <Label htmlFor="nb_camions">Nombre total de véhicules &gt; 7,5 tonnes</Label>
              <Input
                id="nb_camions"
                type="number"
                min={1}
                value={Number.isNaN(totalVehicles) ? '' : totalVehicles}
                onChange={(e) => setTotalVehicles(Math.max(parseInt(e.target.value, 10) || 0, 0))}
                placeholder="Ex : 12"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="camions_equipes">Véhicules déjà équipés de chronotachygraphes digitaux</Label>
              <Input
                id="camions_equipes"
                type="number"
                min={0}
                value={Number.isNaN(equippedVehicles) ? '' : equippedVehicles}
                onChange={(e) => setEquippedVehicles(Math.max(parseInt(e.target.value, 10) || 0, 0))}
                placeholder="Ex : 4"
              />
              <p className="text-xs text-gray-500">
                Indiquez 0 si aucun véhicule n’est équipé.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="installations_souhaitees">Nombre de nouvelles installations souhaitées</Label>
              <Input
                id="installations_souhaitees"
                type="number"
                min={0}
                value={Number.isNaN(installationsRequested) ? '' : installationsRequested}
                onChange={(e) => setInstallationsRequested(Math.max(parseInt(e.target.value, 10) || 0, 0))}
                placeholder={`Suggestion : ${installationsSuggestion}`}
              />
              <p className="text-xs text-gray-500">
                Suggestion automatique : {installationsSuggestion} installation(s) à prévoir.
              </p>
            </div>

            <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 space-y-2">
              <p className="font-medium">Document requis : carte grise d’un véhicule &gt; 7,5 tonnes</p>
              <p>
                Ajoutez au moins une carte grise pour accélérer la validation administrative.
              </p>
              <WorkflowDocumentUpload
                clientProduitId={dossierId}
                onUploadSuccess={() => toast.success('Carte grise ajoutée au dossier')}
                className="mt-2"
              />
            </div>
          </>
        ) : isSolid ? (
          <>
            <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-blue-800 space-y-2">
              <p className="font-medium">Nombre de chauffeurs déclarés lors de votre simulation :</p>
              <p className="text-lg font-semibold">
                {simulationChauffeurs !== null ? `${simulationChauffeurs} chauffeur(s)` : 'Non renseigné'}
              </p>
              <div className="flex items-center gap-2 text-blue-900">
                <Info className="w-4 h-4" />
                Confirmez ce volume ou mettez-le à jour si votre équipe a évolué.
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="chauffeurs_estimes">Estimation (facultatif)</Label>
              <Input
                id="chauffeurs_estimes"
                type="number"
                min={0}
                value={Number.isNaN(chauffeursEstimes) ? '' : chauffeursEstimes}
                onChange={(e) => {
                  const value = Math.max(parseInt(e.target.value, 10) || 0, 0);
                  setChauffeursEstimes(value);
                  if (value !== chauffeursConfirmes) {
                    setSource('manual');
                  }
                }}
                placeholder="Ex : 12"
              />
              <p className="text-xs text-gray-500">
                L’estimation peut être différente si vous souhaitez conserver un scénario cible.
              </p>
            </div>

            {simulationChauffeurs !== null && (
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    setChauffeursEstimes(simulationChauffeurs);
                    setChauffeursConfirmes(simulationChauffeurs);
                    setSource('simulation');
                    toast.success('Valeur simulation confirmée');
                  }}
                >
                  Confirmer la valeur simulation ({simulationChauffeurs})
                </Button>
                <span className="text-xs text-gray-500">
                  ou ajustez le nombre exact dans le champ ci-dessous.
                </span>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="nb_chauffeurs">Nombre de chauffeurs à équiper (confirmé)</Label>
              <Input
                id="nb_chauffeurs"
                type="number"
                min={1}
                value={Number.isNaN(chauffeursConfirmes) ? '' : chauffeursConfirmes}
                onChange={(e) => {
                  const value = Math.max(parseInt(e.target.value, 10) || 0, 0);
                  setChauffeursConfirmes(value);
                  if (simulationChauffeurs !== null && value === simulationChauffeurs) {
                    setSource('simulation');
                  } else {
                    setSource('manual');
                  }
                }}
                placeholder="Ex : 15"
              />
              <p className="text-xs text-gray-500">
                Cette valeur est utilisée pour calculer le coût par fiche de paie et le forfait mensuel.
              </p>
            </div>

            <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
              Dès validation, nous transmettons ces données à l’expert Logiciel Solid afin qu’il prépare votre devis sur mesure.
            </div>

            <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 space-y-2">
              <p className="font-medium">Document requis : fiche de paie récente</p>
              <p>
                Téléversez une fiche de paie (moins de 3 mois) pour valider l’étape et accélérer l’émission du devis.
              </p>
              <WorkflowDocumentUpload
                clientProduitId={dossierId}
                onUploadSuccess={() => toast.success('Fiche de paie ajoutée au dossier')}
                className="mt-2"
              />
            </div>
          </>
        ) : (
          <>
            <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-blue-800 space-y-2">
              <p className="font-medium">
                {isElectricity
                  ? 'Optimisation de vos contrats d’électricité'
                  : 'Optimisation de vos contrats de gaz'}
              </p>
              <p>
                Téléversez vos factures récentes et précisez vos sites afin que notre expert prépare le diagnostic et la mise en concurrence des fournisseurs.
              </p>
            </div>

            {!isElectricity && (
              <div className="space-y-2">
                <Label>Sources d’énergie à analyser</Label>
                <div className="flex flex-wrap gap-4">
                  <label className="flex items-center gap-2 text-sm text-gray-700">
                    <Checkbox
                      checked={energySources.includes('gaz')}
                      onCheckedChange={handleEnergySourceToggle('gaz')}
                    />
                    Gaz naturel
                  </label>
                </div>
                <p className="text-xs text-gray-500">
                  Sélectionnez les énergies à optimiser (par défaut : gaz naturel).
                </p>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="site_count">Nombre de sites concernés</Label>
              <Input
                id="site_count"
                type="number"
                min={1}
                value={Number.isNaN(siteCount) ? '' : siteCount}
                onChange={(e) => setSiteCount(Math.max(parseInt(e.target.value, 10) || 0, 0))}
                placeholder="Ex : 3"
              />
              <p className="text-xs text-gray-500">
                Incluez les entrepôts, agences ou bureaux pour lesquels vous souhaitez réduire les coûts.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="consumption_reference">Consommation annuelle (optionnel)</Label>
              <Input
                id="consumption_reference"
                type="number"
                min={0}
                value={Number.isNaN(consumptionReference) ? '' : consumptionReference}
                onChange={(e) => setConsumptionReference(Math.max(parseInt(e.target.value, 10) || 0, 0))}
                placeholder={isElectricity ? 'Ex : 125000 (kWh)' : 'Ex : 45000 (kWh PCS)'}
              />
              <p className="text-xs text-gray-500">
                Si vous connaissez votre consommation annuelle, indiquez-la pour affiner l’analyse.
              </p>
            </div>

            <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 space-y-2">
              <p className="font-medium">
                Document requis : facture {isElectricity ? 'd’électricité' : 'de gaz'} récente
              </p>
              <p>
                Téléversez votre dernière facture {isElectricity ? 'd’électricité' : 'de gaz naturel'} pour lancer l’optimisation.
              </p>
              <WorkflowDocumentUpload
                clientProduitId={dossierId}
                onUploadSuccess={() =>
                  toast.success(`Facture ${isElectricity ? 'électricité' : 'gaz'} ajoutée au dossier`)
                }
                className="mt-2"
              />
            </div>
          </>
        )}

        <div className="flex justify-end gap-3 pt-4">
          <Button
            onClick={handleSubmit}
            disabled={loading}
            className="min-w-[140px]"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Enregistrement...
              </>
            ) : (
              'Valider les informations'
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

