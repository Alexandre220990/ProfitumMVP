import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  Calendar, 
  MapPin, 
  Video, 
  Phone, 
  Building,
  Trash2
} from 'lucide-react';

// ============================================================================
// TYPES
// ============================================================================

export interface MeetingData {
  expert_id: string;
  expert_name: string;
  expert_company: string;
  product_ids: string[];
  product_names: string[];
  client_produit_eligible_ids: string[];
  meeting_type: 'physical' | 'video' | 'phone';
  scheduled_date: string;
  scheduled_time: string;
  location?: string;
  notes?: string;
  estimated_duration: number;
  estimated_savings: number;
}

interface MultiMeetingSchedulerProps {
  meetings: MeetingData[];
  onMeetingsChange: (meetings: MeetingData[]) => void;
  prospectName: string;
}

// ============================================================================
// COMPOSANT CARD RDV
// ============================================================================

function MeetingCard({ 
  meeting, 
  index,
  onUpdate, 
  onRemove 
}: { 
  meeting: MeetingData; 
  index: number;
  onUpdate: (field: string, value: any) => void;
  onRemove: () => void;
}) {
  
  return (
    <Card className="p-5 bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-300">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h4 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <Calendar className="h-5 w-5 text-purple-600" />
            RDV #{index + 1} avec {meeting.expert_name}
          </h4>
          <p className="text-sm text-gray-600">{meeting.expert_company}</p>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onRemove}
          className="text-red-600 hover:text-red-700 hover:bg-red-50"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
      
      {/* Produits à discuter */}
      <div className="bg-white rounded-lg p-3 mb-4">
        <p className="text-xs font-semibold text-gray-700 mb-2">Produits à discuter :</p>
        <div className="flex flex-wrap gap-2">
          {meeting.product_names.map((name, idx) => (
            <span 
              key={idx}
              className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full font-medium"
            >
              {name}
            </span>
          ))}
        </div>
        <p className="text-xs text-gray-500 mt-2">
          Durée estimée : {meeting.estimated_duration} min • 
          Économies : ~{meeting.estimated_savings.toLocaleString('fr-FR')} €
        </p>
      </div>
      
      {/* Formulaire RDV */}
      <div className="space-y-4">
        {/* Type de RDV */}
        <div>
          <Label className="text-sm font-semibold mb-2 block">Type de rendez-vous *</Label>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => onUpdate('meeting_type', 'physical')}
              className={`p-3 rounded-lg border-2 transition-all ${
                meeting.meeting_type === 'physical'
                  ? 'bg-purple-600 text-white border-purple-700'
                  : 'bg-white text-gray-700 border-gray-300 hover:border-purple-400'
              }`}
            >
              <Building className="h-5 w-5 mx-auto mb-1" />
              <span className="text-xs font-medium">Présentiel</span>
            </button>
            <button
              type="button"
              onClick={() => onUpdate('meeting_type', 'video')}
              className={`p-3 rounded-lg border-2 transition-all ${
                meeting.meeting_type === 'video'
                  ? 'bg-purple-600 text-white border-purple-700'
                  : 'bg-white text-gray-700 border-gray-300 hover:border-purple-400'
              }`}
            >
              <Video className="h-5 w-5 mx-auto mb-1" />
              <span className="text-xs font-medium">Visio</span>
            </button>
            <button
              type="button"
              onClick={() => onUpdate('meeting_type', 'phone')}
              className={`p-3 rounded-lg border-2 transition-all ${
                meeting.meeting_type === 'phone'
                  ? 'bg-purple-600 text-white border-purple-700'
                  : 'bg-white text-gray-700 border-gray-300 hover:border-purple-400'
              }`}
            >
              <Phone className="h-5 w-5 mx-auto mb-1" />
              <span className="text-xs font-medium">Téléphone</span>
            </button>
          </div>
        </div>
        
        {/* Date et heure */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Label htmlFor={`date-${index}`} className="text-sm">Date *</Label>
            <Input
              id={`date-${index}`}
              type="date"
              value={meeting.scheduled_date}
              onChange={(e) => onUpdate('scheduled_date', e.target.value)}
              min={new Date().toISOString().split('T')[0]}
              required
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor={`time-${index}`} className="text-sm">Heure *</Label>
            <Input
              id={`time-${index}`}
              type="time"
              value={meeting.scheduled_time}
              onChange={(e) => onUpdate('scheduled_time', e.target.value)}
              required
              className="mt-1"
            />
          </div>
        </div>
        
        {/* Lieu (si présentiel) */}
        {meeting.meeting_type === 'physical' && (
          <div>
            <Label htmlFor={`location-${index}`} className="text-sm flex items-center gap-1">
              <MapPin className="h-4 w-4" />
              Lieu du rendez-vous
            </Label>
            <Input
              id={`location-${index}`}
              value={meeting.location || ''}
              onChange={(e) => onUpdate('location', e.target.value)}
              placeholder="Adresse complète..."
              className="mt-1"
            />
          </div>
        )}
        
        {/* Notes */}
        <div>
          <Label htmlFor={`notes-${index}`} className="text-sm">Notes pour l'expert</Label>
          <Textarea
            id={`notes-${index}`}
            value={meeting.notes || ''}
            onChange={(e) => onUpdate('notes', e.target.value)}
            placeholder="Informations complémentaires pour préparer le RDV..."
            rows={2}
            className="mt-1 text-sm"
          />
        </div>
      </div>
    </Card>
  );
}

// ============================================================================
// COMPOSANT PRINCIPAL
// ============================================================================

export function MultiMeetingScheduler({ 
  meetings, 
  onMeetingsChange,
  prospectName
}: MultiMeetingSchedulerProps) {
  
  const handleMeetingUpdate = (index: number, field: string, value: any) => {
    const updated = [...meetings];
    updated[index] = { ...updated[index], [field]: value };
    onMeetingsChange(updated);
  };
  
  const handleMeetingRemove = (index: number) => {
    const updated = meetings.filter((_, i) => i !== index);
    onMeetingsChange(updated);
  };
  
  const totalDuration = meetings.reduce((sum, m) => sum + m.estimated_duration, 0);
  const totalSavings = meetings.reduce((sum, m) => sum + m.estimated_savings, 0);
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2 mb-2">
          <Calendar className="h-6 w-6 text-purple-600" />
          Planification des Rendez-vous
        </h3>
        <p className="text-gray-600">
          {meetings.length} RDV à planifier pour {prospectName}
        </p>
      </div>
      
      {/* Résumé */}
      <div className="bg-gradient-to-r from-purple-100 to-pink-100 rounded-lg p-4 border border-purple-300">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-purple-900">{meetings.length}</div>
            <div className="text-xs text-purple-700">RDV</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-purple-900">{new Set(meetings.map(m => m.expert_id)).size}</div>
            <div className="text-xs text-purple-700">Expert{new Set(meetings.map(m => m.expert_id)).size > 1 ? 's' : ''}</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-purple-900">{totalDuration}</div>
            <div className="text-xs text-purple-700">Minutes</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-green-700">~{totalSavings.toLocaleString('fr-FR')}€</div>
            <div className="text-xs text-purple-700">Économies</div>
          </div>
        </div>
      </div>
      
      {/* Liste des RDV */}
      <div className="space-y-4">
        {meetings.map((meeting, index) => (
          <MeetingCard
            key={index}
            meeting={meeting}
            index={index}
            onUpdate={(field, value) => handleMeetingUpdate(index, field, value)}
            onRemove={() => handleMeetingRemove(index)}
          />
        ))}
      </div>
      
      {/* Info importante */}
      <div className="bg-blue-100 border border-blue-300 rounded-lg p-4">
        <p className="text-sm text-blue-900">
          <strong className="font-bold">ℹ️ Important :</strong> Ces RDV seront proposés aux experts qui devront les valider. 
          Le client recevra un email de confirmation uniquement après validation de l'expert.
        </p>
      </div>
    </div>
  );
}

export default MultiMeetingScheduler;

