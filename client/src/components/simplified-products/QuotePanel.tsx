/**
 * Composant pour afficher et gérer un devis (client et expert)
 */

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Loader2, FileText, CheckCircle, XCircle, MessageCircle, Download, Calendar } from 'lucide-react';
import { post } from '@/lib/api';

interface QuotePanelProps {
  dossierId: string;
  devis: any;
  userType: 'client' | 'expert';
  onUpdate: () => void;
}

export default function QuotePanel({ dossierId, devis, userType, onUpdate }: QuotePanelProps) {
  const [loading, setLoading] = useState(false);
  const [commentaire, setCommentaire] = useState('');
  const [showCommentDialog, setShowCommentDialog] = useState(false);

  const formulaire = devis?.formulaire || {};
  const status = devis?.status || 'pending';
  const isClient = userType === 'client';
  const isExpert = userType === 'expert';

  const inferredEnergyKey = (() => {
    if (typeof formulaire.energy_type === 'string') {
      return formulaire.energy_type.includes('gaz') ? 'optimisation_fournisseur_gaz' : 'optimisation_fournisseur_electricite';
    }
    if (typeof formulaire.energie === 'string') {
      return formulaire.energie.includes('gaz') ? 'optimisation_fournisseur_gaz' : 'optimisation_fournisseur_electricite';
    }
    if (Array.isArray(formulaire.energy_sources)) {
      return formulaire.energy_sources.includes('gaz')
        ? 'optimisation_fournisseur_gaz'
        : 'optimisation_fournisseur_electricite';
    }
    if (devis?.product_key === 'optimisation_fournisseur_gaz' || devis?.product_key === 'optimisation_fournisseur_electricite') {
      return devis.product_key;
    }
    if (typeof formulaire.monthly_spend === 'number' || typeof formulaire.monthly_consumption === 'number') {
      return devis?.product_key === 'optimisation_fournisseur_gaz'
        ? 'optimisation_fournisseur_gaz'
        : 'optimisation_fournisseur_electricite';
    }
    return null;
  })();

  const quoteType: 'chronotachygraphes' | 'logiciel_solid' | 'optimisation_fournisseur_electricite' | 'optimisation_fournisseur_gaz' =
    formulaire.type ||
    (formulaire.nb_chauffeurs || formulaire.prix_par_fiche
      ? 'logiciel_solid'
      : inferredEnergyKey ?? 'chronotachygraphes');

  const formatAmount = (value?: number | null, suffix: string = '€') => {
    if (value === undefined || value === null || Number.isNaN(value)) {
      return '—';
    }
    return `${value.toLocaleString('fr-FR')} ${suffix}`.trim();
  };

  const renderFinancialSummary = () => {
    if (quoteType === 'logiciel_solid') {
      const nbChauffeurs = formulaire.nb_chauffeurs ?? formulaire.nb_utilisateurs;
      const prixParFiche = formatAmount(formulaire.prix_par_fiche);
      const coutMensuelUnitaire = formatAmount(formulaire.cout_mensuel_unitaire);
      const coutAnnuelUnitaire = formatAmount(formulaire.cout_annuel_unitaire);
      const coutMensuelTotal = formatAmount(formulaire.cout_mensuel_total);
      const coutAnnuelTotal = formatAmount(formulaire.cout_annuel_total);
      const benefits: string[] =
        formulaire.benefits || [
          'Conformité garantie lors des contrôles',
          'Sécurisation des procédures RH',
          'Gain de temps sur la préparation salariale',
          'Optimisation des charges (service auto-financé)'
        ];

      return (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
            <div>
              <p className="text-sm text-gray-600">Nombre de chauffeurs</p>
              <p className="text-2xl font-bold text-gray-900">{nbChauffeurs ?? '—'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Prix par fiche de paie</p>
              <p className="text-xl font-semibold text-gray-900">{prixParFiche}</p>
              <p className="text-xs text-gray-500">Montant mensuel par fiche</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Coût annuel total</p>
              <p className="text-xl font-semibold text-gray-900">{coutAnnuelTotal}</p>
              <p className="text-xs text-gray-500">Inclut licences + accompagnement</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900">
              <p className="font-semibold text-blue-900 mb-1">Coûts unitaires</p>
              <p>Mensuel : {coutMensuelUnitaire}</p>
              <p>Annuel : {coutAnnuelUnitaire}</p>
            </div>
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
              <p className="font-semibold text-emerald-900 mb-1">Coût total</p>
              <p>Mensuel : {coutMensuelTotal}</p>
              <p>Annuel : {coutAnnuelTotal}</p>
            </div>
          </div>

          <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4">
            <p className="font-semibold text-sm text-emerald-900 mb-2">
              Bénéfices inclus dans l’offre :
            </p>
            <ul className="list-disc list-inside space-y-1 text-sm text-emerald-900">
              {benefits.map((benefit: string) => (
                <li key={benefit}>{benefit}</li>
              ))}
            </ul>
          </div>
        </div>
      );
    }

    if (quoteType === 'optimisation_fournisseur_electricite' || quoteType === 'optimisation_fournisseur_gaz') {
      const investissementEstime = formatAmount(formulaire.investissement_estime);
      const economiesMensuelles = formatAmount(formulaire.economies_mensuelles);
      const economiesAnnuelles = formatAmount(formulaire.economies_annuelles);
      const dureeRetour =
        formulaire.duree_retour !== undefined && formulaire.duree_retour !== null
          ? `${formulaire.duree_retour} mois`
          : '—';
      const recommandations: string[] =
        formulaire.recommandations || [
          'Analyse détaillée de vos factures',
          'Mise en concurrence accélérée des fournisseurs',
          'Projection des gains mensuels et annuels',
          'Accompagnement jusqu’à la signature du nouveau contrat'
        ];
      const energieLabel = quoteType === 'optimisation_fournisseur_electricite' ? 'Électricité' : 'Gaz naturel';
      const depenseMensuelleActuelle = formatAmount(formulaire.monthly_spend);
      const consommationMensuelle = formatAmount(formulaire.monthly_consumption, 'kWh/mois');
      const consommationReference = formatAmount(formulaire.consumption_reference, 'kWh/an');
      const siteCount = formulaire.site_count ?? '—';
      const hasMonthlyMetrics =
        typeof formulaire.monthly_spend === 'number' || typeof formulaire.monthly_consumption === 'number';

      return (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
            <div>
              <p className="text-sm text-gray-600">Investissement estimé</p>
              <p className="text-2xl font-bold text-gray-900">{investissementEstime}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Économies mensuelles estimées</p>
              <p className="text-2xl font-bold text-emerald-600">{economiesMensuelles}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Économies annuelles projetées</p>
              <p className="text-xl font-semibold text-emerald-600">{economiesAnnuelles}</p>
              <p className="text-xs text-gray-500">Retour sur investissement : {dureeRetour}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900">
              <p className="font-semibold text-blue-900 mb-1">Énergie concernée</p>
              <p>{energieLabel}</p>
              <p className="text-xs text-blue-700">
                Dépense mensuelle actuelle : {depenseMensuelleActuelle}
              </p>
            </div>
            {hasMonthlyMetrics ? (
              <div className="rounded-lg border border-purple-200 bg-purple-50 p-4 text-sm text-purple-900">
                <p className="font-semibold text-purple-900 mb-1">Consommation moyenne</p>
                <p>{consommationMensuelle}</p>
                <p className="text-xs text-purple-700">Référence annuelle : {consommationReference}</p>
              </div>
            ) : (
              <div className="rounded-lg border border-purple-200 bg-purple-50 p-4 text-sm text-purple-900">
                <p className="font-semibold text-purple-900 mb-1">Sites analysés</p>
                <p>{siteCount}</p>
                <p className="text-xs text-purple-700">Consommation de référence : {consommationReference}</p>
              </div>
            )}
          </div>

          <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4">
            <p className="font-semibold text-sm text-emerald-900 mb-2">
              Accompagnement proposé :
            </p>
            <ul className="list-disc list-inside space-y-1 text-sm text-emerald-900">
              {recommandations.map((item: string) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        </div>
      );
    }

    const nombreCamions = formulaire.nombre_camions ?? formulaire.nb_camions;
    const installations = formulaire.installations_souhaitees ?? formulaire.nb_installations;
    const prixInstallation = formatAmount(formulaire.prix_installation_unitaire);
    const prixAbonnementMensuel = formatAmount(formulaire.prix_abonnement_mensuel);
    const totalInstallation = formatAmount(formulaire.total_installation);
    const totalAbonnementMensuel = formatAmount(formulaire.total_abonnement_mensuel);
    const totalAbonnementAnnuel = formatAmount(formulaire.total_abonnement_annuel);

    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
          <div>
            <p className="text-sm text-gray-600">Véhicules concernés</p>
            <p className="text-2xl font-bold text-gray-900">{nombreCamions ?? '—'}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Nouvelles installations</p>
            <p className="text-xl font-semibold text-gray-900">{installations ?? '—'}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Installation unitaire</p>
            <p className="text-xl font-semibold text-gray-900">{prixInstallation}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Abonnement mensuel / camion</p>
            <p className="text-xl font-semibold text-gray-900">{prixAbonnementMensuel}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900">
            <p className="font-semibold text-blue-900 mb-1">Investissement installation</p>
            <p>{totalInstallation}</p>
          </div>
          <div className="rounded-lg border border-purple-200 bg-purple-50 p-4 text-sm text-purple-900">
            <p className="font-semibold text-purple-900 mb-1">Abonnement mensuel total</p>
            <p>{totalAbonnementMensuel}</p>
          </div>
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
            <p className="font-semibold text-emerald-900 mb-1">Abonnement annuel total</p>
            <p>{totalAbonnementAnnuel}</p>
          </div>
        </div>

        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          <p>
            L’abonnement inclut la conformité règlementaire, la supervision des données chrono, et un accompagnement complet en cas de contrôle.
          </p>
        </div>
      </div>
    );
  };

  const handleAccept = async () => {
    try {
      setLoading(true);
      const response = await post(`/api/simplified-products/${dossierId}/quote/accept`, {
        commentaire: commentaire || null
      });

      if (response.success) {
        toast.success('✅ Devis accepté avec succès');
        onUpdate();
      } else {
        toast.error(response.message || 'Erreur lors de l\'acceptation');
      }
    } catch (error: any) {
      console.error('Erreur accept quote:', error);
      toast.error('Erreur lors de l\'acceptation');
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async () => {
    if (!commentaire.trim()) {
      toast.error('Veuillez indiquer la raison du refus');
      return;
    }

    try {
      setLoading(true);
      const response = await post(`/api/simplified-products/${dossierId}/quote/reject`, {
        commentaire
      });

      if (response.success) {
        toast.success('Devis refusé');
        onUpdate();
        setShowCommentDialog(false);
        setCommentaire('');
      } else {
        toast.error(response.message || 'Erreur lors du refus');
      }
    } catch (error: any) {
      console.error('Erreur reject quote:', error);
      toast.error('Erreur lors du refus');
    } finally {
      setLoading(false);
    }
  };

  const handleComment = async () => {
    if (!commentaire.trim()) {
      toast.error('Veuillez saisir un commentaire');
      return;
    }

    try {
      setLoading(true);
      const response = await post(`/api/simplified-products/${dossierId}/quote/comment`, {
        commentaire
      });

      if (response.success) {
        toast.success('Commentaire envoyé');
        onUpdate();
        setShowCommentDialog(false);
        setCommentaire('');
      } else {
        toast.error(response.message || 'Erreur lors de l\'envoi');
      }
    } catch (error: any) {
      console.error('Erreur comment quote:', error);
      toast.error('Erreur lors de l\'envoi');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = () => {
    switch (status) {
      case 'proposed':
        return <Badge className="bg-blue-500">Proposé</Badge>;
      case 'accepted':
        return <Badge className="bg-green-500">Accepté</Badge>;
      case 'rejected':
        return <Badge className="bg-red-500">Refusé</Badge>;
      case 'needs_info':
        return <Badge className="bg-orange-500">Informations demandées</Badge>;
      default:
        return <Badge variant="secondary">En attente</Badge>;
    }
  };

  const validUntil = formulaire.valid_until 
    ? new Date(formulaire.valid_until).toLocaleDateString('fr-FR')
    : null;

  return (
    <Card className="max-w-4xl mx-auto">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Devis
          </CardTitle>
          {getStatusBadge()}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Informations financières */}
        {renderFinancialSummary()}

        {validUntil && (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Calendar className="w-4 h-4" />
            <span>Validité du devis : {validUntil}</span>
          </div>
        )}

        {/* Étapes du processus */}
        {formulaire.etapes && formulaire.etapes.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-semibold text-gray-900">Processus clé en main :</h4>
            <ol className="list-decimal list-inside space-y-1 text-sm text-gray-700">
              {formulaire.etapes.map((etape: string, idx: number) => (
                <li key={idx}>{etape}</li>
              ))}
            </ol>
          </div>
        )}

        {/* Document joint (si disponible) */}
        {devis?.document_id && (
          <div className="flex items-center gap-2">
            <Download className="w-4 h-4 text-gray-600" />
            <Button
              variant="outline"
              size="sm"
              onClick={async () => {
                // TODO: Implémenter le téléchargement du document
                toast.info('Téléchargement du document...');
              }}
            >
              Télécharger le devis PDF
            </Button>
          </div>
        )}

        {/* Commentaires existants */}
        {devis?.commentaire_client && (
          <div className="p-3 bg-blue-50 rounded-lg">
            <p className="text-sm font-semibold text-gray-900 mb-1">Commentaire client :</p>
            <p className="text-sm text-gray-700">{devis.commentaire_client}</p>
          </div>
        )}

        {devis?.commentaire_expert && (
          <div className="p-3 bg-green-50 rounded-lg">
            <p className="text-sm font-semibold text-gray-900 mb-1">Commentaire expert :</p>
            <p className="text-sm text-gray-700">{devis.commentaire_expert}</p>
          </div>
        )}

        {/* Actions client */}
        {isClient && status === 'proposed' && (
          <div className="flex flex-wrap gap-3 pt-4 border-t">
            <Button onClick={handleAccept} disabled={loading} className="flex-1 min-w-[120px]">
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Traitement...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Accepter
                </>
              )}
            </Button>

            <Dialog open={showCommentDialog} onOpenChange={setShowCommentDialog}>
              <DialogTrigger asChild>
                <Button variant="outline" className="flex-1 min-w-[120px]">
                  <MessageCircle className="w-4 h-4 mr-2" />
                  Demander des infos
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Demander des informations complémentaires</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="commentaire">Votre message</Label>
                    <Textarea
                      id="commentaire"
                      value={commentaire}
                      onChange={(e) => setCommentaire(e.target.value)}
                      placeholder="Indiquez les informations dont vous avez besoin..."
                      rows={4}
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setShowCommentDialog(false)}>
                      Annuler
                    </Button>
                    <Button onClick={handleComment} disabled={loading}>
                      {loading ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Envoi...
                        </>
                      ) : (
                        'Envoyer'
                      )}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            <Dialog>
              <DialogTrigger asChild>
                <Button variant="destructive" className="flex-1 min-w-[120px]">
                  <XCircle className="w-4 h-4 mr-2" />
                  Refuser
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Refuser le devis</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="reject-commentaire">Raison du refus (obligatoire)</Label>
                    <Textarea
                      id="reject-commentaire"
                      value={commentaire}
                      onChange={(e) => setCommentaire(e.target.value)}
                      placeholder="Indiquez pourquoi vous refusez ce devis..."
                      rows={4}
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setCommentaire('')}>
                      Annuler
                    </Button>
                    <Button variant="destructive" onClick={handleReject} disabled={loading || !commentaire.trim()}>
                      {loading ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Envoi...
                        </>
                      ) : (
                        'Confirmer le refus'
                      )}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        )}

        {/* Actions expert */}
        {isExpert && status === 'rejected' && (
          <div className="pt-4 border-t">
            <p className="text-sm text-gray-600 mb-3">
              Le client a refusé ce devis. Vous pouvez le modifier et le renvoyer.
            </p>
            <Button variant="outline" onClick={() => {
              // TODO: Rediriger vers la page de modification du devis
              toast.info('Redirection vers la modification du devis...');
            }}>
              Modifier le devis
            </Button>
          </div>
        )}

        {isExpert && status === 'needs_info' && (
          <div className="pt-4 border-t">
            <p className="text-sm text-gray-600 mb-3">
              Le client a demandé des informations complémentaires. Vous pouvez répondre ci-dessous.
            </p>
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <MessageCircle className="w-4 h-4 mr-2" />
                  Répondre
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Répondre au client</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="expert-commentaire">Votre réponse</Label>
                    <Textarea
                      id="expert-commentaire"
                      value={commentaire}
                      onChange={(e) => setCommentaire(e.target.value)}
                      placeholder="Répondez aux questions du client..."
                      rows={4}
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setCommentaire('')}>
                      Annuler
                    </Button>
                    <Button onClick={handleComment} disabled={loading || !commentaire.trim()}>
                      {loading ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Envoi...
                        </>
                      ) : (
                        'Envoyer'
                      )}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

