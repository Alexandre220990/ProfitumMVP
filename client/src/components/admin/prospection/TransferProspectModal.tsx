import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, AlertCircle, UserPlus } from 'lucide-react';
import { toast } from 'sonner';
import { config } from '@/config/env';
import { getSupabaseToken } from '@/lib/auth-helpers';
import { useNavigate } from 'react-router-dom';

interface ProduitEligible {
  id: string;
  nom: string;
  description?: string;
  categorie?: string;
  type_produit?: string;
}

interface Expert {
  id: string;
  name: string;
  first_name?: string;
  last_name?: string;
  email: string;
  company_name?: string;
  specializations?: string[];
  rating?: number;
}

interface TransferProspectModalProps {
  isOpen: boolean;
  onClose: () => void;
  prospectId: string;
  prospectEmail?: string;
  prospectCompany?: string;
}

export default function TransferProspectModal({
  isOpen,
  onClose,
  prospectId,
  prospectEmail,
  prospectCompany
}: TransferProspectModalProps) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [loadingExperts, setLoadingExperts] = useState(false);
  const [produits, setProduits] = useState<ProduitEligible[]>([]);
  const [experts, setExperts] = useState<Expert[]>([]);
  const [selectedProduitId, setSelectedProduitId] = useState<string>('');
  const [selectedExpertId, setSelectedExpertId] = useState<string>('');
  const [montantPotentiel, setMontantPotentiel] = useState<string>('');
  const [notes, setNotes] = useState<string>('');

  // Charger les produits éligibles
  useEffect(() => {
    if (isOpen) {
      fetchProduits();
      // Reset les sélections
      setSelectedProduitId('');
      setSelectedExpertId('');
      setMontantPotentiel('');
      setNotes('');
    }
  }, [isOpen]);

  // Charger les experts quand un produit est sélectionné
  useEffect(() => {
    if (selectedProduitId) {
      fetchExperts(selectedProduitId);
    } else {
      setExperts([]);
      setSelectedExpertId('');
    }
  }, [selectedProduitId]);

  const fetchProduits = async () => {
    try {
      setLoadingProducts(true);
      const token = await getSupabaseToken();
      const response = await fetch(`${config.API_URL}/api/produits-eligibles`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Erreur lors du chargement des produits');
      }

      const result = await response.json();
      if (result.success) {
        setProduits(result.data || []);
      } else {
        throw new Error(result.error || 'Erreur lors du chargement des produits');
      }
    } catch (error: any) {
      console.error('Erreur chargement produits:', error);
      toast.error(error.message || 'Erreur lors du chargement des produits');
    } finally {
      setLoadingProducts(false);
    }
  };

  const fetchExperts = async (produitId: string) => {
    try {
      setLoadingExperts(true);
      const token = await getSupabaseToken();

      // Récupérer les experts disponibles pour ce produit via ExpertProduitEligible
      const response = await fetch(`${config.API_URL}/api/admin/dossiers/available-experts?produitId=${produitId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        // Fallback: récupérer tous les experts actifs
        const fallbackResponse = await fetch(`${config.API_URL}/api/admin/experts?status=active&approval_status=approved`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (fallbackResponse.ok) {
          const fallbackResult = await fallbackResponse.json();
          if (fallbackResult.success) {
            setExperts(fallbackResult.data || []);
          }
        } else {
          throw new Error('Erreur lors du chargement des experts');
        }
        return;
      }

      const result = await response.json();
      if (result.success) {
        setExperts(result.data || []);
      } else {
        throw new Error(result.error || 'Erreur lors du chargement des experts');
      }
    } catch (error: any) {
      console.error('Erreur chargement experts:', error);
      toast.error(error.message || 'Erreur lors du chargement des experts');
    } finally {
      setLoadingExperts(false);
    }
  };

  const handleTransfer = async () => {
    if (!selectedProduitId || !selectedExpertId) {
      toast.error('Veuillez sélectionner un produit et un expert');
      return;
    }

    try {
      setLoading(true);
      const token = await getSupabaseToken();

      const response = await fetch(`${config.API_URL}/api/prospects/${prospectId}/transfer-to-expert`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          produitId: selectedProduitId,
          expertId: selectedExpertId,
          montantPotentiel: montantPotentiel ? parseFloat(montantPotentiel) : undefined,
          notes: notes || undefined
        })
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Erreur lors du transfert');
      }

      toast.success('Prospect transféré avec succès vers un expert');
      
      // Rediriger vers la page client créé
      if (result.data?.clientId) {
        navigate(`/admin/clients/${result.data.clientId}`);
      } else {
        onClose();
      }
    } catch (error: any) {
      console.error('Erreur transfert:', error);
      toast.error(error.message || 'Erreur lors du transfert');
    } finally {
      setLoading(false);
    }
  };

  const selectedProduit = produits.find(p => p.id === selectedProduitId);
  const selectedExpert = experts.find(e => e.id === selectedExpertId);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Transférer le prospect vers un expert
          </DialogTitle>
          <DialogDescription>
            Sélectionnez un produit éligible et un expert pour transférer ce prospect en client.
            {prospectCompany && (
              <span className="block mt-2 font-semibold text-gray-700">
                Prospect: {prospectCompany} {prospectEmail && `(${prospectEmail})`}
              </span>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Sélection du produit */}
          <div className="space-y-2">
            <Label htmlFor="produit">Produit éligible *</Label>
            {loadingProducts ? (
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Loader2 className="h-4 w-4 animate-spin" />
                Chargement des produits...
              </div>
            ) : (
              <Select value={selectedProduitId} onValueChange={setSelectedProduitId}>
                <SelectTrigger id="produit">
                  <SelectValue placeholder="Sélectionnez un produit" />
                </SelectTrigger>
                <SelectContent>
                  {produits.map((produit) => (
                    <SelectItem key={produit.id} value={produit.id}>
                      {produit.nom}
                      {produit.categorie && (
                        <span className="text-xs text-gray-500 ml-2">({produit.categorie})</span>
                      )}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            {selectedProduit && selectedProduit.description && (
              <p className="text-sm text-gray-600 mt-1">{selectedProduit.description}</p>
            )}
          </div>

          {/* Sélection de l'expert */}
          <div className="space-y-2">
            <Label htmlFor="expert">Expert *</Label>
            {!selectedProduitId ? (
              <div className="text-sm text-gray-500 p-3 bg-gray-50 rounded-md">
                Veuillez d'abord sélectionner un produit
              </div>
            ) : loadingExperts ? (
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Loader2 className="h-4 w-4 animate-spin" />
                Chargement des experts...
              </div>
            ) : experts.length === 0 ? (
              <div className="text-sm text-amber-600 p-3 bg-amber-50 rounded-md flex items-start gap-2">
                <AlertCircle className="h-4 w-4 mt-0.5" />
                Aucun expert disponible pour ce produit
              </div>
            ) : (
              <Select value={selectedExpertId} onValueChange={setSelectedExpertId}>
                <SelectTrigger id="expert">
                  <SelectValue placeholder="Sélectionnez un expert" />
                </SelectTrigger>
                <SelectContent>
                  {experts.map((expert) => {
                    const expertName = expert.first_name && expert.last_name
                      ? `${expert.first_name} ${expert.last_name}`
                      : expert.name || expert.company_name || 'Expert';
                    return (
                      <SelectItem key={expert.id} value={expert.id}>
                        {expertName}
                        {expert.company_name && expert.company_name !== expertName && (
                          <span className="text-xs text-gray-500 ml-2">({expert.company_name})</span>
                        )}
                        {expert.rating && (
                          <span className="text-xs text-gray-500 ml-2">⭐ {expert.rating.toFixed(1)}</span>
                        )}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            )}
            {selectedExpert && (
              <div className="text-sm text-gray-600 mt-1">
                <p>{selectedExpert.email}</p>
                {selectedExpert.specializations && selectedExpert.specializations.length > 0 && (
                  <p className="text-xs mt-1">
                    Spécialisations: {selectedExpert.specializations.join(', ')}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Montant potentiel */}
          <div className="space-y-2">
            <Label htmlFor="montant">Montant potentiel (€)</Label>
            <Input
              id="montant"
              type="number"
              placeholder="Ex: 50000"
              value={montantPotentiel}
              onChange={(e) => setMontantPotentiel(e.target.value)}
            />
            <p className="text-xs text-gray-500">Montant estimé du dossier</p>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes (optionnel)</Label>
            <Textarea
              id="notes"
              placeholder="Notes supplémentaires sur ce transfert..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Annuler
          </Button>
          <Button
            onClick={handleTransfer}
            disabled={loading || !selectedProduitId || !selectedExpertId}
            className="bg-green-600 hover:bg-green-700"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Transfert en cours...
              </>
            ) : (
              <>
                <UserPlus className="h-4 w-4 mr-2" />
                Transférer vers expert
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
