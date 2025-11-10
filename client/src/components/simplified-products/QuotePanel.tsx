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
import { post, get } from '@/lib/api';
import { useAuth } from '@/hooks/use-auth';

interface QuotePanelProps {
  dossierId: string;
  devis: any;
  userType: 'client' | 'expert';
  onUpdate: () => void;
}

export default function QuotePanel({ dossierId, devis, userType, onUpdate }: QuotePanelProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [commentaire, setCommentaire] = useState('');
  const [showCommentDialog, setShowCommentDialog] = useState(false);

  const formulaire = devis?.formulaire || {};
  const status = devis?.status || 'pending';
  const isClient = userType === 'client';
  const isExpert = userType === 'expert';

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
        {/* Informations du devis */}
        {formulaire.total && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
            <div>
              <p className="text-sm text-gray-600">Montant total</p>
              <p className="text-2xl font-bold text-gray-900">{formulaire.total.toLocaleString('fr-FR')}€</p>
            </div>
            {formulaire.nombre_camions && (
              <div>
                <p className="text-sm text-gray-600">Nombre de camions</p>
                <p className="text-xl font-semibold text-gray-900">{formulaire.nombre_camions}</p>
              </div>
            )}
            {formulaire.prix_unit && (
              <div>
                <p className="text-sm text-gray-600">Prix unitaire</p>
                <p className="text-xl font-semibold text-gray-900">{formulaire.prix_unit.toLocaleString('fr-FR')}€</p>
              </div>
            )}
          </div>
        )}

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

