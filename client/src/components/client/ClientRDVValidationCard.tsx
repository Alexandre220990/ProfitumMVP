import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Calendar, 
  Clock, 
  User, 
  ArrowRight,
  Check,
  X,
  AlertTriangle,
  Info
} from 'lucide-react';

// ============================================================================
// TYPES
// ============================================================================

interface ClientRDVValidationCardProps {
  meeting: {
    id: string;
    expert: {
      name: string;
      company_name: string;
    };
    products: Array<{
      name: string;
      estimated_savings: number;
    }>;
    original_date: string;
    original_time: string;
    alternative_date: string;
    alternative_time: string;
    expert_notes?: string;
  };
  onAccept: (meetingId: string) => Promise<void>;
  onRefuse: (meetingId: string) => Promise<void>;
}

// ============================================================================
// COMPOSANT PRINCIPAL
// ============================================================================

export function ClientRDVValidationCard({ 
  meeting, 
  onAccept,
  onRefuse
}: ClientRDVValidationCardProps) {
  
  const [loading, setLoading] = useState(false);
  
  const handleAccept = async () => {
    setLoading(true);
    try {
      await onAccept(meeting.id);
    } finally {
      setLoading(false);
    }
  };
  
  const handleRefuse = async () => {
    setLoading(true);
    try {
      await onRefuse(meeting.id);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <Card className="p-6 bg-gradient-to-br from-orange-50 to-amber-50 border-2 border-orange-400">
      {/* Header */}
      <div className="flex items-center gap-3 mb-5">
        <div className="w-12 h-12 bg-orange-500 rounded-full flex items-center justify-center">
          <AlertTriangle className="h-6 w-6 text-white" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-gray-900">RDV à Revalider</h3>
          <p className="text-sm text-gray-600">L'expert propose une nouvelle date</p>
        </div>
      </div>
      
      {/* Expert */}
      <div className="bg-white rounded-lg p-4 mb-4 border border-orange-200">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-purple-200 rounded-full flex items-center justify-center">
            <User className="h-5 w-5 text-purple-700" />
          </div>
          <div>
            <p className="font-semibold text-gray-900">{meeting.expert.name}</p>
            <p className="text-sm text-gray-600">{meeting.expert.company_name}</p>
          </div>
        </div>
      </div>
      
      {/* Comparaison dates */}
      <div className="bg-white rounded-lg p-4 mb-4 border-2 border-orange-300">
        <div className="space-y-4">
          {/* Date initiale */}
          <div className="opacity-60">
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="outline" className="text-xs">Date initiale</Badge>
            </div>
            <div className="flex items-center gap-3">
              <Calendar className="h-5 w-5 text-gray-500" />
              <span className="text-sm text-gray-700 line-through">
                {new Date(meeting.original_date).toLocaleDateString('fr-FR', { 
                  day: 'numeric', 
                  month: 'long',
                  year: 'numeric'
                })}
              </span>
              <Clock className="h-4 w-4 text-gray-500" />
              <span className="text-sm text-gray-700 line-through">{meeting.original_time}</span>
            </div>
          </div>
          
          {/* Flèche */}
          <div className="flex justify-center">
            <ArrowRight className="h-6 w-6 text-orange-500" />
          </div>
          
          {/* Nouvelle date */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Badge className="bg-orange-600 text-white text-xs">Nouvelle proposition</Badge>
            </div>
            <div className="flex items-center gap-3">
              <Calendar className="h-5 w-5 text-orange-600" />
              <span className="text-sm font-bold text-gray-900">
                {new Date(meeting.alternative_date).toLocaleDateString('fr-FR', { 
                  weekday: 'long',
                  day: 'numeric', 
                  month: 'long',
                  year: 'numeric'
                })}
              </span>
              <Clock className="h-5 w-5 text-orange-600" />
              <span className="text-sm font-bold text-gray-900">{meeting.alternative_time}</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Raison expert */}
      {meeting.expert_notes && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
          <div className="flex items-start gap-2">
            <Info className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-xs font-semibold text-blue-900 mb-1">Message de l'expert :</p>
              <p className="text-sm text-blue-800">{meeting.expert_notes}</p>
            </div>
          </div>
        </div>
      )}
      
      {/* Produits */}
      <div className="bg-purple-50 rounded-lg p-3 mb-5 border border-purple-200">
        <p className="text-xs font-semibold text-purple-900 mb-2">
          Produits à discuter ({meeting.products.length}) :
        </p>
        <div className="flex flex-wrap gap-2 mb-2">
          {meeting.products.map((product, idx) => (
            <span 
              key={idx}
              className="text-xs bg-white text-purple-700 px-2 py-1 rounded border border-purple-300 font-medium"
            >
              {product}
            </span>
          ))}
        </div>
        <p className="text-xs text-green-700 font-semibold">
          Économies potentielles : ~{totalSavings.toLocaleString('fr-FR')} €
        </p>
      </div>
      
      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Button
          type="button"
          onClick={handleAccept}
          disabled={loading}
          className="flex-1 bg-green-600 hover:bg-green-700 text-white"
        >
          <Check className="h-4 w-4 mr-2" />
          Accepter la Nouvelle Date
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={handleRefuse}
          disabled={loading}
          className="flex-1 border-red-400 text-red-700 hover:bg-red-50"
        >
          <X className="h-4 w-4 mr-2" />
          Refuser
        </Button>
      </div>
      
      <p className="text-xs text-gray-500 text-center mt-3">
        Si vous refusez, vous serez contacté pour trouver un créneau qui convient.
      </p>
    </Card>
  );
}

export default ClientRDVValidationCard;

