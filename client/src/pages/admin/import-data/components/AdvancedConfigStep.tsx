import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { WorkflowConfig } from '@/types/import';
import { toast } from 'sonner';
import { config as envConfig } from '@/config/env';

interface AdvancedConfigStepProps {
  onConfigured: (workflowConfig: WorkflowConfig) => void;
  initialConfig?: WorkflowConfig;
}

export default function AdvancedConfigStep({
  onConfigured,
  initialConfig
}: AdvancedConfigStepProps) {
  const [config, setConfig] = useState<WorkflowConfig>(initialConfig || {
    defaultProductStatus: 'eligible',
    initialStep: 1,
    initialProgress: 0
  });
  const [experts, setExperts] = useState<Array<{ id: string; name: string }>>([]);
  const [cabinets, setCabinets] = useState<Array<{ id: string; name: string }>>([]);
  const [produits, setProduits] = useState<Array<{ id: string; nom: string }>>([]);

  useEffect(() => {
    // Charger les experts, cabinets et produits
    loadData();
  }, []);

  const loadData = async () => {
    const token = localStorage.getItem('token');
    
    try {
      // Charger experts
      const expertsRes = await fetch(`${envConfig.API_URL}/api/admin/experts?limit=100`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (expertsRes.ok) {
        const expertsData = await expertsRes.json();
        setExperts(expertsData.data?.map((e: any) => ({
          id: e.id,
          name: e.name || `${e.first_name} ${e.last_name}` || e.company_name
        })) || []);
      }

      // Charger cabinets
      const cabinetsRes = await fetch(`${envConfig.API_URL}/api/admin/cabinets?limit=100`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (cabinetsRes.ok) {
        const cabinetsData = await cabinetsRes.json();
        setCabinets(cabinetsData.data?.map((c: any) => ({
          id: c.id,
          name: c.name
        })) || []);
      }

      // Charger produits
      const produitsRes = await fetch(`${envConfig.API_URL}/api/produits-eligibles`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (produitsRes.ok) {
        const produitsData = await produitsRes.json();
        setProduits(produitsData.data?.map((p: any) => ({
          id: p.id,
          nom: p.nom
        })) || []);
      }
    } catch (error) {
      console.error('Erreur chargement données:', error);
    }
  };

  const handleSave = () => {
    onConfigured(config);
    toast.success('Configuration enregistrée');
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold mb-2">Configuration avancée</h2>
        <p className="text-sm text-gray-600">
          Configurez les statuts produits, experts et cabinets par défaut pour les clients importés
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <Label htmlFor="default-status">Statut produit par défaut</Label>
          <Select
            value={config.defaultProductStatus}
            onValueChange={(value) => setConfig({ ...config, defaultProductStatus: value })}
          >
            <SelectTrigger id="default-status" className="mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="eligible">Éligible</SelectItem>
              <SelectItem value="en_cours">En cours</SelectItem>
              <SelectItem value="en_attente">En attente</SelectItem>
              <SelectItem value="valide">Validé</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="default-expert">Expert par défaut (optionnel)</Label>
          <Select
            value={config.defaultExpertId || ''}
            onValueChange={(value) => setConfig({ ...config, defaultExpertId: value || undefined })}
          >
            <SelectTrigger id="default-expert" className="mt-1">
              <SelectValue placeholder="Aucun" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Aucun</SelectItem>
              {experts.map((expert) => (
                <SelectItem key={expert.id} value={expert.id}>
                  {expert.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="default-cabinet">Cabinet par défaut (optionnel)</Label>
          <Select
            value={config.defaultCabinetId || ''}
            onValueChange={(value) => setConfig({ ...config, defaultCabinetId: value || undefined })}
          >
            <SelectTrigger id="default-cabinet" className="mt-1">
              <SelectValue placeholder="Aucun" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Aucun</SelectItem>
              {cabinets.map((cabinet) => (
                <SelectItem key={cabinet.id} value={cabinet.id}>
                  {cabinet.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="initial-step">Étape initiale du workflow</Label>
          <Input
            id="initial-step"
            type="number"
            min="1"
            value={config.initialStep || 1}
            onChange={(e) => setConfig({ ...config, initialStep: Number(e.target.value) })}
            className="mt-1"
          />
        </div>

        <div>
          <Label htmlFor="initial-progress">Progression initiale (%)</Label>
          <Input
            id="initial-progress"
            type="number"
            min="0"
            max="100"
            value={config.initialProgress || 0}
            onChange={(e) => setConfig({ ...config, initialProgress: Number(e.target.value) })}
            className="mt-1"
          />
        </div>
      </div>

      <div className="border-t pt-4">
        <h3 className="text-sm font-medium mb-3">Patterns de colonnes multiples (optionnel)</h3>
        <p className="text-xs text-gray-500 mb-4">
          Si votre fichier contient plusieurs produits par client (ex: Produit_1, Produit_2, etc.)
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="product-pattern">Pattern produit</Label>
            <Input
              id="product-pattern"
              value={config.productPatterns?.productPattern || 'Produit_{index}'}
              onChange={(e) => setConfig({
                ...config,
                productPatterns: {
                  ...config.productPatterns,
                  productPattern: e.target.value
                }
              })}
              placeholder="Produit_{index}"
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="expert-pattern">Pattern expert</Label>
            <Input
              id="expert-pattern"
              value={config.productPatterns?.expertPattern || 'Expert_Produit_{index}'}
              onChange={(e) => setConfig({
                ...config,
                productPatterns: {
                  ...config.productPatterns,
                  expertPattern: e.target.value
                }
              })}
              placeholder="Expert_Produit_{index}"
              className="mt-1"
            />
          </div>
        </div>
      </div>

      <div className="flex justify-end space-x-4">
        <Button variant="outline" onClick={() => window.history.back()}>
          Retour
        </Button>
        <Button onClick={handleSave} className="bg-red-600 hover:bg-red-700">
          Continuer
        </Button>
      </div>
    </div>
  );
}

