import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { 
  ArrowLeft, 
  ArrowRight, 
  Calendar, 
  Video, 
  Phone, 
  MapPin,
  User,
  CheckCircle,
  X,
  Plus
} from 'lucide-react';
import { config } from '@/config';
 import { getSupabaseToken } from '@/lib/auth-helpers';
import { toast } from 'sonner';

interface MeetingToCreate {
  id: string; // Unique ID pour React
  participant_type: 'expert' | 'apporteur';
  participant_id: string | null;
  participant_name: string;
  participant_company?: string;
  meeting_type: 'physical' | 'video' | 'phone';
  scheduled_date: string;
  scheduled_time: string;
  location: string;
  meeting_url: string;
  phone_number: string;
  notes: string;
  duration_minutes: number;
  product_ids: string[];
}

interface Step4Props {
  prospectId: string;
  prospectName: string;
  selectedExperts: Record<string, string | null>;
  simulationResults: any;
  scheduledMeetings: any[];
  onUpdate: (meetings: any[]) => void;
  onNext: () => void;
  onSkip: () => void;
  onBack: () => void;
}

export function Step4_MeetingPlanning({
  prospectId,
  prospectName,
  selectedExperts,
  simulationResults,
  scheduledMeetings: _scheduledMeetings,
  onUpdate: _onUpdate,
  onNext,
  onSkip,
  onBack
}: Step4Props) {
  
  const [meetings, setMeetings] = useState<MeetingToCreate[]>([]);
  const [saving, setSaving] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [currentUserName, setCurrentUserName] = useState<string>('');
  
  // Charger les infos de l'apporteur connecté
  useEffect(() => {
    const loadCurrentUser = async () => {
      try {
        const response = await fetch(`${config.API_URL}/api/apporteur/profile`, {
          headers: {
            'Authorization': `Bearer ${await getSupabaseToken()}`
          }
        });
        
        if (response.ok) {
          const result = await response.json();
          setCurrentUserId(result.data?.id);
          setCurrentUserName(`${result.data?.first_name} ${result.data?.last_name}`.trim());
        }
      } catch (error) {
        console.error('Erreur chargement profil:', error);
      }
    };
    
    loadCurrentUser();
  }, []);
  
  // Générer les options de RDV à partir des experts sélectionnés
  const availableOptions = React.useMemo(() => {
    const options: Array<{ type: 'expert' | 'apporteur'; id: string; name: string; company?: string; products: string[] }> = [];
    
    // Regrouper les produits par expert sélectionné
    const expertProducts: Record<string, string[]> = {};
    
    Object.entries(selectedExperts).forEach(([productId, expertId]) => {
      if (expertId) {
        if (!expertProducts[expertId]) {
          expertProducts[expertId] = [];
        }
        expertProducts[expertId].push(productId);
      }
    });
    
    // Créer une option par expert
    Object.entries(expertProducts).forEach(([expertId, productIds]) => {
      // Trouver les infos de l'expert depuis simulationResults
      const products = simulationResults?.eligible_products || [];
      const expertInfo = products
        .find((p: any) => p.recommended_expert?.id === expertId)
        ?.recommended_expert;
      
      if (expertInfo) {
        options.push({
          type: 'expert',
          id: expertId,
          name: expertInfo.name,
          company: expertInfo.company_name,
          products: productIds
        });
      }
    });
    
    // Ajouter l'option "RDV avec moi-même"
    if (currentUserId) {
      options.push({
        type: 'apporteur',
        id: currentUserId,
        name: currentUserName || 'Moi-même',
        company: 'Rappel de qualification',
        products: []
      });
    }
    
    return options;
  }, [selectedExperts, simulationResults, currentUserId, currentUserName]);
  
  const addMeeting = (option: typeof availableOptions[0]) => {
    const newMeeting: MeetingToCreate = {
      id: `meeting-${Date.now()}-${Math.random()}`,
      participant_type: option.type,
      participant_id: option.id,
      participant_name: option.name,
      participant_company: option.company,
      meeting_type: 'video',
      scheduled_date: '',
      scheduled_time: '',
      location: '',
      meeting_url: '',
      phone_number: '',
      notes: option.type === 'expert' 
        ? `RDV avec ${option.name} pour ${option.products.length} produit(s)`
        : 'Rappel de qualification prospect',
      duration_minutes: 60,
      product_ids: option.products
    };
    
    setMeetings(prev => [...prev, newMeeting]);
  };
  
  const removeMeeting = (meetingId: string) => {
    setMeetings(prev => prev.filter(m => m.id !== meetingId));
  };
  
  const updateMeeting = (meetingId: string, field: string, value: any) => {
    setMeetings(prev => prev.map(m => 
      m.id === meetingId ? { ...m, [field]: value } : m
    ));
  };
  
  const handleSaveAndContinue = async () => {
    if (meetings.length === 0) {
      onNext();
      return;
    }
    
    // Validation
    const invalidMeetings = meetings.filter(m => 
      !m.scheduled_date || !m.scheduled_time
    );
    
    if (invalidMeetings.length > 0) {
      toast.error('Veuillez remplir la date et l\'heure pour tous les RDV');
      return;
    }
    
    setSaving(true);
    
    try {
      const response = await fetch(
        `${config.API_URL}/api/apporteur/prospects/${prospectId}/schedule-meetings`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${await getSupabaseToken()}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            meetings: meetings.map(m => ({
              expert_id: m.participant_type === 'expert' ? m.participant_id : null,
              apporteur_id: m.participant_type === 'apporteur' ? m.participant_id : null,
              meeting_type: m.meeting_type,
              scheduled_date: m.scheduled_date,
              scheduled_time: m.scheduled_time,
              location: m.location || null,
              meeting_url: m.meeting_url || null,
              notes: m.notes,
              estimated_duration: m.duration_minutes,
              product_ids: m.product_ids
            }))
          })
        }
      );
      
      if (!response.ok) {
        throw new Error('Erreur création RDV');
      }
      
      const result = await response.json();
      toast.success(`${result.data?.total_created || meetings.length} RDV créé(s) !`);
      onNext();
      
    } catch (error) {
      console.error('❌ Erreur:', error);
      toast.error('Erreur lors de la création des RDV');
    } finally {
      setSaving(false);
    }
  };
  
  return (
    <div className="space-y-6">
      {/* Introduction */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <h3 className="font-semibold text-green-900 mb-1">
          Étape 4 : Planification des rendez-vous (Optionnelle)
        </h3>
        <p className="text-sm text-green-700 mb-2">
          Planifiez des rendez-vous entre le prospect et les experts sélectionnés, 
          ou programmez-vous un rappel de qualification.
        </p>
        <p className="text-xs text-green-600 font-medium">
          💡 Règle : 1 RDV = Prospect + 1 personne (expert OU apporteur)
        </p>
      </div>

      {/* Options de RDV disponibles */}
      {availableOptions.length > 0 && (
        <div className="space-y-3">
          <h4 className="font-semibold text-gray-900">Créer des rendez-vous :</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {availableOptions.map((option, idx) => {
              const alreadyAdded = meetings.some(m => m.participant_id === option.id);
              
              return (
                <Card
                  key={idx}
                  className={`p-4 cursor-pointer transition-all hover:shadow-md ${
                    alreadyAdded ? 'bg-green-50 border-green-500' : 'hover:bg-gray-50'
                  }`}
                  onClick={() => {
                    if (!alreadyAdded) {
                      addMeeting(option);
                    }
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-gray-600" />
                        <p className="font-medium">{option.name}</p>
                        {alreadyAdded && <CheckCircle className="h-5 w-5 text-green-600" />}
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{option.company}</p>
                      {option.products.length > 0 && (
                        <p className="text-xs text-gray-500 mt-1">
                          {option.products.length} produit(s)
                        </p>
                      )}
                    </div>
                    {!alreadyAdded && (
                      <Plus className="h-5 w-5 text-blue-600" />
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* RDV planifiés */}
      {meetings.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold text-gray-900">
              {meetings.length} rendez-vous à planifier :
            </h4>
          </div>

          {meetings.map((meeting) => (
            <Card key={meeting.id} className="p-4 border-2 border-blue-200">
              <div className="space-y-4">
                {/* Header */}
                <div className="flex items-center justify-between pb-3 border-b">
                  <div>
                    <h5 className="font-semibold flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      RDV avec {meeting.participant_name}
                    </h5>
                    <p className="text-sm text-gray-600">{meeting.participant_company}</p>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeMeeting(meeting.id)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                {/* Participants (read-only) */}
                <div className="bg-gray-50 p-3 rounded">
                  <p className="text-xs text-gray-600 mb-2">Participants :</p>
                  <div className="flex gap-2">
                    <span className="text-sm px-2 py-1 bg-blue-100 text-blue-800 rounded">
                      ✓ {prospectName} (Prospect)
                    </span>
                    <span className="text-sm px-2 py-1 bg-green-100 text-green-800 rounded">
                      ✓ {meeting.participant_name}
                    </span>
                  </div>
                </div>

                {/* Type de RDV */}
                <div>
                  <Label>Type de rendez-vous</Label>
                  <div className="grid grid-cols-3 gap-2 mt-2">
                    <button
                      type="button"
                      onClick={() => updateMeeting(meeting.id, 'meeting_type', 'physical')}
                      className={`flex items-center justify-center gap-2 p-3 border-2 rounded-lg transition-all ${
                        meeting.meeting_type === 'physical'
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-300 hover:border-gray-400'
                      }`}
                    >
                      <MapPin className="h-4 w-4" />
                      <span className="text-sm font-medium">Physique</span>
                    </button>
                    
                    <button
                      type="button"
                      onClick={() => updateMeeting(meeting.id, 'meeting_type', 'video')}
                      className={`flex items-center justify-center gap-2 p-3 border-2 rounded-lg transition-all ${
                        meeting.meeting_type === 'video'
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-300 hover:border-gray-400'
                      }`}
                    >
                      <Video className="h-4 w-4" />
                      <span className="text-sm font-medium">Visio</span>
                    </button>
                    
                    <button
                      type="button"
                      onClick={() => updateMeeting(meeting.id, 'meeting_type', 'phone')}
                      className={`flex items-center justify-center gap-2 p-3 border-2 rounded-lg transition-all ${
                        meeting.meeting_type === 'phone'
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-300 hover:border-gray-400'
                      }`}
                    >
                      <Phone className="h-4 w-4" />
                      <span className="text-sm font-medium">Téléphone</span>
                    </button>
                  </div>
                </div>

                {/* Date et heure */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Date *</Label>
                    <Input
                      type="date"
                      value={meeting.scheduled_date}
                      onChange={(e) => updateMeeting(meeting.id, 'scheduled_date', e.target.value)}
                      min={new Date().toISOString().split('T')[0]}
                      required
                    />
                  </div>
                  <div>
                    <Label>Heure *</Label>
                    <Input
                      type="time"
                      value={meeting.scheduled_time}
                      onChange={(e) => updateMeeting(meeting.id, 'scheduled_time', e.target.value)}
                      required
                    />
                  </div>
                </div>

                {/* Lieu (conditionnel selon type) */}
                {meeting.meeting_type === 'physical' && (
                  <div>
                    <Label>
                      <MapPin className="h-4 w-4 inline mr-1" />
                      Adresse du rendez-vous
                    </Label>
                    <Input
                      value={meeting.location}
                      onChange={(e) => updateMeeting(meeting.id, 'location', e.target.value)}
                      placeholder="12 rue de la Paix, 75000 Paris"
                    />
                  </div>
                )}

                {meeting.meeting_type === 'video' && (
                  <div>
                    <Label>
                      <Video className="h-4 w-4 inline mr-1" />
                      Lien visioconférence
                    </Label>
                    <Input
                      value={meeting.meeting_url}
                      onChange={(e) => updateMeeting(meeting.id, 'meeting_url', e.target.value)}
                      placeholder="https://zoom.us/j/..."
                    />
                  </div>
                )}

                {meeting.meeting_type === 'phone' && (
                  <div>
                    <Label>
                      <Phone className="h-4 w-4 inline mr-1" />
                      Numéro de téléphone
                    </Label>
                    <Input
                      value={meeting.phone_number}
                      onChange={(e) => updateMeeting(meeting.id, 'phone_number', e.target.value)}
                      placeholder="À confirmer avec le prospect"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Le numéro du prospect sera utilisé par défaut
                    </p>
                  </div>
                )}

                {/* Notes */}
                <div>
                  <Label>Notes</Label>
                  <Textarea
                    value={meeting.notes}
                    onChange={(e) => updateMeeting(meeting.id, 'notes', e.target.value)}
                    placeholder="Ordre du jour, points à aborder..."
                    rows={2}
                  />
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Message si aucun RDV */}
      {meetings.length === 0 && (
        <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
          <Calendar className="h-12 w-12 mx-auto mb-3 text-gray-400" />
          <p className="text-gray-600 mb-4">Aucun rendez-vous planifié</p>
          {availableOptions.length > 0 ? (
            <p className="text-sm text-gray-500">
              Cliquez sur une carte ci-dessus pour ajouter un RDV
            </p>
          ) : (
            <p className="text-sm text-gray-500">
              Aucune option de RDV disponible. Passez à l'étape suivante.
            </p>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex justify-between pt-6 border-t">
        <Button
          type="button"
          variant="outline"
          onClick={onBack}
          disabled={saving}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Retour
        </Button>

        <div className="flex gap-3">
          <Button
            type="button"
            variant="ghost"
            onClick={onSkip}
            disabled={saving}
            className="text-gray-600"
          >
            Passer cette étape
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>

          <Button
            type="button"
            onClick={handleSaveAndContinue}
            disabled={saving}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {saving ? 'Enregistrement...' : meetings.length > 0 ? `Valider ${meetings.length} RDV` : 'Continuer'}
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </div>
    </div>
  );
}

