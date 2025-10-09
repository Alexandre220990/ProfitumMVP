import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { 
  Calendar, 
  Clock, 
  Building, 
  Check,
  AlertCircle,
  Euro
} from 'lucide-react';

// ============================================================================
// TYPES
// ============================================================================

interface MeetingProposal {
  id: string;
  client: {
    name: string;
    company_name: string;
  };
  products: Array<{
    name: string;
    estimated_savings: number;
  }>;
  scheduled_date: string;
  scheduled_time: string;
  meeting_type: 'physical' | 'video' | 'phone';
  location?: string;
  duration_minutes: number;
  notes?: string;
}

interface ExpertMeetingProposalCardProps {
  meeting: MeetingProposal;
  onAccept: (meetingId: string) => Promise<void>;
  onPropose: (meetingId: string, alternativeDate: string, alternativeTime: string, notes?: string) => Promise<void>;
}

// ============================================================================
// COMPOSANT PRINCIPAL
// ============================================================================

export function ExpertMeetingProposalCard({ 
  meeting, 
  onAccept,
  onPropose
}: ExpertMeetingProposalCardProps) {
  
  const [mode, setMode] = useState<'view' | 'propose'>('view');
  const [alternativeDate, setAlternativeDate] = useState('');
  const [alternativeTime, setAlternativeTime] = useState('');
  const [expertNotes, setExpertNotes] = useState('');
  const [loading, setLoading] = useState(false);
  
  const totalSavings = meeting.products.reduce((sum, p) => sum + p.estimated_savings, 0);
  
  const handleAccept = async () => {
    setLoading(true);
    try {
      await onAccept(meeting.id);
    } finally {
      setLoading(false);
    }
  };
  
  const handlePropose = async () => {
    if (!alternativeDate || !alternativeTime) {
      alert('Date et heure alternatives requises');
      return;
    }
    
    setLoading(true);
    try {
      await onPropose(meeting.id, alternativeDate, alternativeTime, expertNotes);
      setMode('view');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <Card className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-300">
      {/* Badge nouveau */}
      <div className="mb-4">
        <Badge className="bg-orange-500 text-white">
          🆕 Nouveau RDV Proposé
        </Badge>
      </div>
      
      {/* Informations client */}
      <div className="mb-5">
        <h3 className="text-xl font-bold text-gray-900 mb-1">
          {meeting.client.company_name || meeting.client.name}
        </h3>
        <p className="text-sm text-gray-600">{meeting.client.name}</p>
      </div>
      
      {/* Détails RDV proposé */}
      <div className="bg-white rounded-lg p-4 mb-4 border border-blue-200">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-blue-600" />
            <div>
              <p className="text-xs text-gray-500">Date</p>
              <p className="font-semibold text-gray-900">
                {new Date(meeting.scheduled_date).toLocaleDateString('fr-FR', { 
                  weekday: 'long', 
                  day: 'numeric', 
                  month: 'long', 
                  year: 'numeric' 
                })}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-blue-600" />
            <div>
              <p className="text-xs text-gray-500">Heure</p>
              <p className="font-semibold text-gray-900">{meeting.scheduled_time}</p>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {meeting.meeting_type === 'physical' ? (
            <>
              <Building className="h-5 w-5 text-gray-600" />
              <div className="flex-1">
                <p className="text-xs text-gray-500">Présentiel</p>
                <p className="text-sm text-gray-900">{meeting.location || 'Lieu à définir'}</p>
              </div>
            </>
          ) : meeting.meeting_type === 'video' ? (
            <>
              <div className="h-5 w-5 text-gray-600">📹</div>
              <div className="flex-1">
                <p className="text-xs text-gray-500">Visioconférence</p>
                <p className="text-sm text-gray-900">Lien envoyé par email</p>
              </div>
            </>
          ) : (
            <>
              <div className="h-5 w-5 text-gray-600">📞</div>
              <div className="flex-1">
                <p className="text-xs text-gray-500">Téléphone</p>
                <p className="text-sm text-gray-900">Appel programmé</p>
              </div>
            </>
          )}
        </div>
        
        <div className="mt-3 pt-3 border-t border-gray-200">
          <p className="text-xs text-gray-500">Durée estimée : <span className="font-semibold text-gray-900">{meeting.duration_minutes} minutes</span></p>
        </div>
      </div>
      
      {/* Produits à traiter */}
      <div className="bg-purple-100 rounded-lg p-4 mb-4 border border-purple-300">
        <p className="text-xs font-semibold text-purple-900 mb-2">
          Produits à traiter ({meeting.products.length}) :
        </p>
        <div className="space-y-2">
          {meeting.products.map((product, idx) => (
            <div key={idx} className="flex items-center justify-between bg-white rounded px-3 py-2">
              <span className="text-sm font-medium text-gray-900">{product.name}</span>
              <span className="text-xs text-green-700 font-semibold">
                ~{product.estimated_savings.toLocaleString('fr-FR')}€
              </span>
            </div>
          ))}
        </div>
        <div className="mt-3 pt-3 border-t border-purple-300">
          <div className="flex items-center gap-2">
            <Euro className="h-5 w-5 text-green-600" />
            <div className="flex-1">
              <p className="text-xs text-gray-700">Économies totales client :</p>
              <p className="text-lg font-bold text-green-700">~{totalSavings.toLocaleString('fr-FR')} €</p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Notes apporteur */}
      {meeting.notes && (
        <div className="bg-gray-100 rounded-lg p-3 mb-4 border border-gray-300">
          <p className="text-xs font-semibold text-gray-700 mb-1">Notes de l'apporteur :</p>
          <p className="text-sm text-gray-900">{meeting.notes}</p>
        </div>
      )}
      
      {/* Actions */}
      {mode === 'view' ? (
        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            type="button"
            onClick={handleAccept}
            disabled={loading}
            className="flex-1 bg-green-600 hover:bg-green-700 text-white"
          >
            <Check className="h-4 w-4 mr-2" />
            Accepter ce RDV
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => setMode('propose')}
            className="flex-1 border-orange-400 text-orange-700 hover:bg-orange-50"
          >
            <Calendar className="h-4 w-4 mr-2" />
            Proposer Autre Date
          </Button>
        </div>
      ) : (
        <div className="space-y-4 bg-orange-50 rounded-lg p-4 border-2 border-orange-300">
          <h5 className="font-semibold text-gray-900 flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-orange-600" />
            Proposer une Date Alternative
          </h5>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Nouvelle date *</Label>
              <Input
                type="date"
                value={alternativeDate}
                onChange={(e) => setAlternativeDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                required
              />
            </div>
            <div>
              <Label className="text-xs">Nouvelle heure *</Label>
              <Input
                type="time"
                value={alternativeTime}
                onChange={(e) => setAlternativeTime(e.target.value)}
                required
              />
            </div>
          </div>
          
          <div>
            <Label className="text-xs">Raison du changement (optionnel)</Label>
            <Textarea
              value={expertNotes}
              onChange={(e) => setExpertNotes(e.target.value)}
              placeholder="Ex: Conflit d'agenda, autre RDV..."
              rows={2}
              className="text-sm"
            />
          </div>
          
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setMode('view')}
              disabled={loading}
              className="flex-1"
            >
              Annuler
            </Button>
            <Button
              type="button"
              onClick={handlePropose}
              disabled={loading || !alternativeDate || !alternativeTime}
              className="flex-1 bg-orange-600 hover:bg-orange-700"
            >
              {loading ? 'Envoi...' : 'Proposer cette Date'}
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}

export default ExpertMeetingProposalCard;

