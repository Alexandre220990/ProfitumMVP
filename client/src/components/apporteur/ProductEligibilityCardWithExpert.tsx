import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Trophy, 
  CheckCircle, 
  AlertTriangle, 
  XCircle, 
  Euro, 
  User, 
  Star,
  ChevronDown,
  ChevronUp,
  FileText,
  Award,
  UserPlus,
  Info
} from 'lucide-react';

// ============================================================================
// TYPES
// ============================================================================

interface ProductEligibilityCardWithExpertProps {
  product: {
    id: string;
    produit_name: string;
    produit_description: string;
    score: number;
    statut: 'eligible' | 'non_eligible' | 'to_confirm';
    tauxFinal: number | null;
    montantFinal: number | null;
    priorite: number;
    recommended_expert?: {
      id: string;
      name: string;
      company_name: string;
      rating: number;
      matchScore: number;
    };
  };
  onExpertInvite?: (expertId: string, productId: string) => void;
  onExpertView?: (expertId: string) => void;
  onNotesChange?: (productId: string, notes: string) => void;
}

// ============================================================================
// FONCTIONS UTILITAIRES
// ============================================================================

function getScoreColor(score: number): string {
  if (score >= 80) return 'border-l-4 border-green-500 bg-gradient-to-br from-green-50 to-emerald-50';
  if (score >= 60) return 'border-l-4 border-blue-500 bg-gradient-to-br from-blue-50 to-indigo-50';
  if (score >= 40) return 'border-l-4 border-orange-500 bg-gradient-to-br from-orange-50 to-amber-50';
  return 'border-l-4 border-gray-400 bg-gray-50';
}

function getScoreBadge(score: number): { icon: any; text: string; className: string } {
  if (score >= 80) return {
    icon: Trophy,
    text: `${score}%`,
    className: 'bg-green-600 text-white'
  };
  if (score >= 60) return {
    icon: CheckCircle,
    text: `${score}%`,
    className: 'bg-blue-600 text-white'
  };
  if (score >= 40) return {
    icon: AlertTriangle,
    text: `${score}%`,
    className: 'bg-orange-600 text-white'
  };
  return {
    icon: XCircle,
    text: `${score}%`,
    className: 'bg-gray-500 text-white'
  };
}

function getPriorityBadge(priority: number): string {
  if (priority === 1) return '🏆 Priorité #1';
  if (priority <= 3) return `⭐ Priorité #${priority}`;
  if (priority <= 10) return `#${priority}`;
  return 'Non prioritaire';
}

// ============================================================================
// COMPOSANT PRINCIPAL
// ============================================================================

export function ProductEligibilityCardWithExpert({ 
  product, 
  onExpertInvite,
  onExpertView,
  onNotesChange
}: ProductEligibilityCardWithExpertProps) {
  
  const [expanded, setExpanded] = useState(product.score >= 60); // Auto-expand si éligible
  const [notes, setNotes] = useState('');
  const [expertInvited, setExpertInvited] = useState(false);
  
  const scoreBadge = getScoreBadge(product.score);
  const ScoreIcon = scoreBadge.icon;
  
  const handleExpertInvite = () => {
    if (product.recommended_expert && onExpertInvite) {
      onExpertInvite(product.recommended_expert.id, product.id);
      setExpertInvited(true);
    }
  };
  
  const handleNotesChange = (value: string) => {
    setNotes(value);
    if (onNotesChange) {
      onNotesChange(product.id, value);
    }
  };
  
  return (
    <Card className={`overflow-hidden transition-all duration-300 hover:shadow-lg ${getScoreColor(product.score)}`}>
      <div className="p-5">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2 flex-wrap">
              <h4 className="text-lg font-bold text-gray-900">
                {product.produit_name}
              </h4>
              <Badge className={scoreBadge.className}>
                <ScoreIcon className="h-3 w-3 mr-1" />
                Score: {scoreBadge.text}
              </Badge>
              {product.priorite <= 10 && (
                <Badge variant="outline" className="text-xs">
                  {getPriorityBadge(product.priorite)}
                </Badge>
              )}
            </div>
            <p className="text-sm text-gray-600">{product.produit_description}</p>
          </div>
        </div>
        
        {/* Économies estimées (si éligible) */}
        {product.montantFinal && product.montantFinal > 0 && (
          <div className="flex items-center gap-2 mb-4 p-3 bg-green-100 rounded-lg border border-green-300">
            <Euro className="h-5 w-5 text-green-600" />
            <div>
              <p className="text-sm font-bold text-green-900">
                Économies estimées : ~{product.montantFinal.toLocaleString('fr-FR')} €/an
              </p>
              <p className="text-xs text-green-700">
                Taux final: {product.tauxFinal ? (product.tauxFinal * 100).toFixed(0) : 0}%
              </p>
            </div>
          </div>
        )}
        
        {/* Expert recommandé */}
        {product.recommended_expert && (
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-4 border-2 border-purple-300 mb-4">
            <div className="flex items-center gap-2 mb-3">
              <Award className="h-5 w-5 text-purple-600" />
              <p className="font-bold text-purple-900">Expert Recommandé</p>
              {expertInvited && (
                <Badge className="bg-green-500 text-white">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Invité
                </Badge>
              )}
            </div>
            
            <div className="flex items-center gap-3 mb-3">
              {/* Avatar */}
              <div className="w-12 h-12 rounded-full bg-purple-300 flex items-center justify-center flex-shrink-0">
                <User className="h-6 w-6 text-purple-700" />
              </div>
              
              {/* Infos expert */}
              <div className="flex-1 min-w-0">
                <p className="font-bold text-gray-900 truncate">{product.recommended_expert.name}</p>
                <p className="text-sm text-gray-600 truncate">{product.recommended_expert.company_name}</p>
              </div>
              
              {/* Rating */}
              <div className="flex items-center gap-1 bg-yellow-100 px-2 py-1 rounded flex-shrink-0">
                <Star className="h-4 w-4 text-yellow-600 fill-current" />
                <span className="font-bold text-sm text-yellow-900">
                  {product.recommended_expert.rating.toFixed(1)}
                </span>
              </div>
            </div>
            
            {/* Stats expert */}
            <div className="grid grid-cols-2 gap-2 text-xs mb-3">
              <div className="flex items-center gap-1 text-gray-700 bg-white rounded px-2 py-1">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span>Match: {product.recommended_expert.matchScore}%</span>
              </div>
              <div className="flex items-center gap-1 text-gray-700 bg-white rounded px-2 py-1">
                <FileText className="h-4 w-4 text-blue-600" />
                <span>Spécialiste</span>
              </div>
            </div>
            
            {/* Actions */}
            <div className="flex gap-2">
              <Button 
                type="button"
                size="sm" 
                className={`flex-1 ${expertInvited ? 'bg-green-600' : 'bg-purple-600'} hover:opacity-90`}
                onClick={handleExpertInvite}
                disabled={expertInvited}
              >
                {expertInvited ? (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Expert Invité
                  </>
                ) : (
                  <>
                    <UserPlus className="h-4 w-4 mr-2" />
                    Inviter au RDV
                  </>
                )}
              </Button>
              {onExpertView && (
                <Button 
                  type="button"
                  size="sm" 
                  variant="outline"
                  onClick={() => onExpertView(product.recommended_expert!.id)}
                  className="border-purple-300"
                >
                  <Info className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        )}
        
        {/* Warning si à confirmer */}
        {product.score >= 40 && product.score < 60 && (
          <div className="bg-orange-100 border border-orange-300 rounded-lg p-3 mb-4">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-orange-900">
                <p className="font-semibold mb-1">Éligibilité à confirmer avec expert</p>
                <p className="text-xs text-orange-800">
                  Un expert pourra affiner l'analyse et valider l'éligibilité réelle de ce produit.
                </p>
              </div>
            </div>
          </div>
        )}
        
        {/* Section détails (collapsible) */}
        <div className="border-t pt-4">
          <button
            type="button"
            onClick={() => setExpanded(!expanded)}
            className="flex items-center justify-between w-full text-sm font-semibold text-gray-700 hover:text-gray-900 transition-colors"
          >
            <span>Détails et notes</span>
            {expanded ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </button>
          
          {expanded && (
            <div className="mt-4 space-y-3 animate-in fade-in duration-300">
              {/* Notes spécifiques */}
              <div>
                <Label htmlFor={`notes-${product.id}`} className="text-xs text-gray-700">
                  Notes spécifiques pour ce produit
                </Label>
                <Input
                  id={`notes-${product.id}`}
                  placeholder="Informations complémentaires..."
                  value={notes}
                  onChange={(e) => handleNotesChange(e.target.value)}
                  className="text-sm mt-1"
                />
              </div>
              
              {/* Métadonnées */}
              <div className="bg-gray-50 rounded p-3 text-xs text-gray-600 space-y-1">
                <div className="flex justify-between">
                  <span className="font-semibold">Statut:</span>
                  <span className="capitalize">{product.statut.replace('_', ' ')}</span>
                </div>
                {product.tauxFinal && (
                  <div className="flex justify-between">
                    <span className="font-semibold">Taux final:</span>
                    <span>{(product.tauxFinal * 100).toFixed(0)}%</span>
                  </div>
                )}
                {product.montantFinal && (
                  <div className="flex justify-between">
                    <span className="font-semibold">Montant estimé:</span>
                    <span>{product.montantFinal.toLocaleString('fr-FR')} €</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}

export default ProductEligibilityCardWithExpert;

