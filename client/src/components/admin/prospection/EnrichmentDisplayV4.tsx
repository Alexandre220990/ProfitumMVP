/**
 * Composant d'affichage des données enrichies V4
 * Affiche toutes les données : LinkedIn, Web, Opérationnelles, Timing
 */

import React from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Calendar,
  Building2,
  Truck,
  Users,
  Euro,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  Clock,
  Target
} from 'lucide-react';

interface EnrichmentDisplayV4Props {
  enrichment: any; // Type complet serait EnrichedProspectDataV4
  prospectInsights: {
    potentiel_economies: string;
    score_attractivite: string;
    timing_strategy: string;
    donnees_operationnelles: {
      poids_lourds: number;
      chauffeurs: number;
      salaries: number;
      ca: number;
      surface_locaux: number;
      statut_propriete: string;
    };
  };
}

export const EnrichmentDisplayV4: React.FC<EnrichmentDisplayV4Props> = ({
  enrichment,
  prospectInsights
}) => {

  const getConfidenceBadge = (confiance: number) => {
    if (confiance >= 8) {
      return <Badge variant="default" className="bg-green-500">Haute confiance ({confiance}/10)</Badge>;
    } else if (confiance >= 5) {
      return <Badge variant="secondary">Confiance moyenne ({confiance}/10)</Badge>;
    } else {
      return <Badge variant="destructive">Faible confiance ({confiance}/10)</Badge>;
    }
  };

  const getScoreBadge = (score: number) => {
    if (score >= 8) {
      return <Badge variant="default" className="bg-green-500">{score}/10</Badge>;
    } else if (score >= 5) {
      return <Badge variant="secondary">{score}/10</Badge>;
    } else {
      return <Badge variant="destructive">{score}/10</Badge>;
    }
  };

  const operationalData = enrichment.operational_data;
  const timingAnalysis = enrichment.timing_analysis;
  const linkedinData = enrichment.linkedin_data;

  return (
    <div className="space-y-4">
      {/* En-tête avec insights clés */}
      <Card className="border-2 border-primary">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Synthèse Enrichissement V4
            </span>
            {getScoreBadge(operationalData.potentiel_global_profitum.score_attractivite_prospect)}
          </CardTitle>
          <CardDescription>
            Données complètes : LinkedIn, Site Web, Opérationnel, Timing
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <Euro className="h-5 w-5 mx-auto mb-2 text-green-600" />
              <div className="text-2xl font-bold text-green-600">
                {prospectInsights.potentiel_economies}
              </div>
              <div className="text-xs text-gray-600">Potentiel annuel</div>
            </div>

            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <TrendingUp className="h-5 w-5 mx-auto mb-2 text-blue-600" />
              <div className="text-2xl font-bold text-blue-600">
                {prospectInsights.score_attractivite}
              </div>
              <div className="text-xs text-gray-600">Score attractivité</div>
            </div>

            <div className="text-center p-3 bg-purple-50 rounded-lg">
              <Clock className="h-5 w-5 mx-auto mb-2 text-purple-600" />
              <div className="text-sm font-semibold text-purple-600">
                {timingAnalysis.scoring_opportunite.score_global_timing}/10
              </div>
              <div className="text-xs text-gray-600">Score timing</div>
            </div>

            <div className="text-center p-3 bg-orange-50 rounded-lg">
              <CheckCircle2 className="h-5 w-5 mx-auto mb-2 text-orange-600" />
              <div className="text-sm font-semibold text-orange-600">
                {operationalData.synthese_enrichissement.score_completude_donnees}%
              </div>
              <div className="text-xs text-gray-600">Complétude données</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Onglets pour les différentes catégories */}
      <Tabs defaultValue="operational" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="operational">Opérationnel</TabsTrigger>
          <TabsTrigger value="eligibility">Éligibilité</TabsTrigger>
          <TabsTrigger value="timing">Timing</TabsTrigger>
          <TabsTrigger value="icebreakers">Ice Breakers</TabsTrigger>
        </TabsList>

        {/* Onglet Données Opérationnelles */}
        <TabsContent value="operational" className="space-y-4">
          {/* Ressources Humaines */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Users className="h-5 w-5" />
                Ressources Humaines
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                  <span className="font-medium">Salariés totaux</span>
                  <div className="text-right">
                    <div className="font-bold">
                      {operationalData.donnees_operationnelles.ressources_humaines.nombre_salaries_total.valeur}
                    </div>
                    {getConfidenceBadge(
                      operationalData.donnees_operationnelles.ressources_humaines.nombre_salaries_total.confiance
                    )}
                  </div>
                </div>

                <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                  <span className="font-medium">Chauffeurs</span>
                  <div className="text-right">
                    <div className="font-bold">
                      {operationalData.donnees_operationnelles.ressources_humaines.nombre_chauffeurs.valeur}
                    </div>
                    {getConfidenceBadge(
                      operationalData.donnees_operationnelles.ressources_humaines.nombre_chauffeurs.confiance
                    )}
                  </div>
                </div>

                <div className="col-span-full p-3 bg-gray-50 rounded">
                  <div className="font-medium mb-2">Masse salariale estimée</div>
                  <div className="text-lg font-bold">
                    {operationalData.donnees_operationnelles.ressources_humaines.masse_salariale_estimee.valeur_annuelle}
                  </div>
                  <div className="text-sm text-gray-600 mt-1">
                    {operationalData.donnees_operationnelles.ressources_humaines.masse_salariale_estimee.fourchette}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Parc Véhicules */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Truck className="h-5 w-5" />
                Parc Véhicules
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg border border-blue-200">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <div className="font-medium text-blue-900">Poids lourds +7.5T</div>
                      <div className="text-3xl font-bold text-blue-700 mt-1">
                        {operationalData.donnees_operationnelles.parc_vehicules.poids_lourds_plus_7_5T.valeur}
                      </div>
                    </div>
                    {getConfidenceBadge(
                      operationalData.donnees_operationnelles.parc_vehicules.poids_lourds_plus_7_5T.confiance
                    )}
                  </div>
                  {operationalData.donnees_operationnelles.parc_vehicules.poids_lourds_plus_7_5T.eligibilite_ticpe.eligible && (
                    <div className="mt-3 pt-3 border-t border-blue-300">
                      <div className="flex items-center gap-2 text-green-700 font-semibold mb-1">
                        <CheckCircle2 className="h-4 w-4" />
                        Éligible TICPE
                      </div>
                      <div className="text-sm text-blue-900">
                        Potentiel: {operationalData.donnees_operationnelles.parc_vehicules.poids_lourds_plus_7_5T.eligibilite_ticpe.potentiel_annuel_estime}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Infrastructures */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Building2 className="h-5 w-5" />
                Infrastructures
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                  <span className="font-medium">Surface locaux</span>
                  <div className="text-right">
                    <div className="font-bold">
                      {operationalData.donnees_operationnelles.infrastructures.locaux_principaux.surface_m2.valeur} m²
                    </div>
                    {getConfidenceBadge(
                      operationalData.donnees_operationnelles.infrastructures.locaux_principaux.surface_m2.confiance
                    )}
                  </div>
                </div>

                <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                  <span className="font-medium">Statut propriété</span>
                  <Badge variant={
                    operationalData.donnees_operationnelles.infrastructures.locaux_principaux.statut_propriete.proprietaire_ou_locataire === 'PROPRIETAIRE' 
                      ? 'default' 
                      : 'secondary'
                  }>
                    {operationalData.donnees_operationnelles.infrastructures.locaux_principaux.statut_propriete.proprietaire_ou_locataire}
                  </Badge>
                </div>

                <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                  <span className="font-medium">Consommation énergétique</span>
                  <Badge variant="outline">
                    {operationalData.donnees_operationnelles.infrastructures.consommation_energetique.niveau}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Données Financières */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Euro className="h-5 w-5" />
                Données Financières
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="p-3 bg-gray-50 rounded">
                  <div className="font-medium mb-1">Chiffre d'affaires</div>
                  <div className="text-2xl font-bold">
                    {(operationalData.donnees_operationnelles.donnees_financieres.chiffre_affaires.valeur / 1000000).toFixed(1)}M€
                  </div>
                  <div className="text-sm text-gray-600 mt-1">
                    Année {operationalData.donnees_operationnelles.donnees_financieres.chiffre_affaires.annee}
                    {operationalData.donnees_operationnelles.donnees_financieres.chiffre_affaires.evolution && 
                      ` • ${operationalData.donnees_operationnelles.donnees_financieres.chiffre_affaires.evolution}`
                    }
                  </div>
                </div>

                <div className="p-3 bg-gray-50 rounded">
                  <div className="font-medium mb-1">Santé financière</div>
                  <Badge variant={
                    operationalData.donnees_operationnelles.donnees_financieres.santé_financiere.score === 'SAINE'
                      ? 'default'
                      : operationalData.donnees_operationnelles.donnees_financieres.santé_financiere.score === 'MOYENNE'
                      ? 'secondary'
                      : 'destructive'
                  }>
                    {operationalData.donnees_operationnelles.donnees_financieres.santé_financiere.score}
                  </Badge>
                  <div className="text-sm text-gray-600 mt-2">
                    {operationalData.donnees_operationnelles.donnees_financieres.santé_financiere.justification}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Onglet Éligibilité */}
        <TabsContent value="eligibility" className="space-y-4">
          {Object.entries(operationalData.donnees_operationnelles.signaux_eligibilite_profitum).map(
            ([key, value]: [string, any]) => (
              <Card key={key} className={value.eligible ? 'border-green-200 bg-green-50' : 'border-gray-200'}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between text-lg">
                    <span className="uppercase">{key}</span>
                    <div className="flex items-center gap-2">
                      {value.eligible ? (
                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                      ) : (
                        <AlertCircle className="h-5 w-5 text-gray-400" />
                      )}
                      <Badge variant={value.priorite === 'TRÈS HAUTE' || value.priorite === 'HAUTE' ? 'default' : 'secondary'}>
                        {value.priorite}
                      </Badge>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div>
                      <div className="text-sm font-medium text-gray-600 mb-1">Score certitude</div>
                      {getScoreBadge(value.score_certitude)}
                    </div>

                    <div>
                      <div className="text-sm font-medium text-gray-600 mb-1">Donnée clé</div>
                      <div className="text-sm">{value.donnee_cle}</div>
                    </div>

                    <div className="p-3 bg-white rounded border border-gray-200">
                      <div className="text-sm font-medium text-gray-600 mb-1">Potentiel économies annuelles</div>
                      <div className="text-xl font-bold text-green-600">
                        {value.potentiel_economie_annuelle}
                      </div>
                    </div>

                    {value.calcul_detaille && (
                      <div>
                        <div className="text-sm font-medium text-gray-600 mb-1">Calcul détaillé</div>
                        <div className="text-sm text-gray-700">{value.calcul_detaille}</div>
                      </div>
                    )}

                    {value.dispositifs_applicables && value.dispositifs_applicables.length > 0 && (
                      <div>
                        <div className="text-sm font-medium text-gray-600 mb-2">Dispositifs applicables</div>
                        <div className="flex flex-wrap gap-2">
                          {value.dispositifs_applicables.map((dispositif: string, idx: number) => (
                            <Badge key={idx} variant="outline">{dispositif}</Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          )}
        </TabsContent>

        {/* Onglet Timing */}
        <TabsContent value="timing" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Analyse Temporelle
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <div className="font-semibold mb-2">Période actuelle</div>
                  <div className="text-lg">{timingAnalysis.analyse_periode.periode_actuelle}</div>
                  <div className="mt-2 text-sm text-gray-700">
                    Charge mentale prospects: <Badge variant="secondary">
                      {timingAnalysis.analyse_periode.contexte_business.charge_mentale_prospects}
                    </Badge>
                  </div>
                </div>

                <div className="p-4 bg-green-50 rounded-lg">
                  <div className="font-semibold mb-2">Action recommandée</div>
                  <Badge variant="default" className="text-base px-3 py-1">
                    {timingAnalysis.scoring_opportunite.action_recommandee}
                  </Badge>
                  <div className="mt-2 text-sm text-gray-700">
                    {timingAnalysis.scoring_opportunite.justification_detaillee}
                  </div>
                </div>

                <div className="p-4 bg-purple-50 rounded-lg">
                  <div className="font-semibold mb-2">Nombre d'emails recommandé</div>
                  <div className="text-3xl font-bold text-purple-700">
                    {timingAnalysis.recommandations_sequence.nombre_emails_recommande}
                  </div>
                  <div className="mt-2 text-sm text-gray-700">
                    {timingAnalysis.recommandations_sequence.rationale_detaillee}
                  </div>
                </div>

                {timingAnalysis.recommandations_sequence.ajustements_contextuels.periodes_a_eviter_absolument.length > 0 && (
                  <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                    <div className="font-semibold mb-2 flex items-center gap-2 text-red-700">
                      <AlertCircle className="h-5 w-5" />
                      Périodes à éviter absolument
                    </div>
                    <div className="space-y-2">
                      {timingAnalysis.recommandations_sequence.ajustements_contextuels.periodes_a_eviter_absolument.map(
                        (periode: any, idx: number) => (
                          <div key={idx} className="text-sm bg-white p-2 rounded">
                            <div className="font-medium">{periode.date_debut} au {periode.date_fin}</div>
                            <div className="text-gray-600">{periode.raison}</div>
                          </div>
                        )
                      )}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Onglet Ice Breakers */}
        <TabsContent value="icebreakers" className="space-y-4">
          {linkedinData?.ice_breakers_generes && linkedinData.ice_breakers_generes.length > 0 ? (
            linkedinData.ice_breakers_generes
              .sort((a: any, b: any) => b.score - a.score)
              .map((icebreaker: any, idx: number) => (
                <Card key={idx} className={icebreaker.score >= 8 ? 'border-green-200 bg-green-50' : ''}>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between text-base">
                      <span className="flex items-center gap-2">
                        <Badge variant="outline">{icebreaker.type}</Badge>
                        <Badge variant={
                          icebreaker.statut_temporel === 'FUTUR' ? 'default' :
                          icebreaker.statut_temporel === 'PASSE' ? 'secondary' :
                          'destructive'
                        }>
                          {icebreaker.statut_temporel}
                        </Badge>
                      </span>
                      {getScoreBadge(icebreaker.score)}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div>
                        <div className="text-sm font-medium text-gray-600 mb-1">Phrase principale</div>
                        <div className="p-3 bg-white rounded border border-gray-200 italic">
                          "{icebreaker.phrase}"
                        </div>
                      </div>

                      {icebreaker.phrase_alternative_si_passe && (
                        <div>
                          <div className="text-sm font-medium text-gray-600 mb-1">Si événement passé</div>
                          <div className="p-3 bg-white rounded border border-gray-200 italic">
                            "{icebreaker.phrase_alternative_si_passe}"
                          </div>
                        </div>
                      )}

                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <span className="text-gray-600">Source:</span> <Badge variant="outline">{icebreaker.source}</Badge>
                        </div>
                        {icebreaker.anciennete_jours !== undefined && (
                          <div>
                            <span className="text-gray-600">Ancienneté:</span> {icebreaker.anciennete_jours} jours
                          </div>
                        )}
                      </div>

                      <div className="text-sm text-gray-600">
                        <span className="font-medium">Contexte:</span> {icebreaker.contexte}
                      </div>

                      <div className="text-xs text-gray-500 bg-gray-100 p-2 rounded">
                        {icebreaker.validite_temporelle}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
          ) : (
            <Card>
              <CardContent className="p-6 text-center text-gray-500">
                Aucun ice breaker disponible
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default EnrichmentDisplayV4;

