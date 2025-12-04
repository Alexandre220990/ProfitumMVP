import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Calendar as CalendarIcon, Clock, MapPin, Video, Phone, Users, X } from 'lucide-react';
import { toast } from 'sonner';
import { config } from '@/config';
import { supabase } from '@/lib/supabase';

// ============================================================================
// TYPES
// ============================================================================

interface Participant {
  id: string;
  name: string;
  email: string;
  type: 'client' | 'expert' | 'apporteur' | 'admin';
  company_name?: string;
}

type EventCategory =
  | 'rdv_client'
  | 'reunion_interne'
  | 'suivi_dossier'
  | 'echeance_admin'
  | 'rappel_personnel';

interface RDVFormData {
  title: string;
  scheduled_date: string;
  scheduled_time: string;
  duration_minutes: number;
  meeting_type: 'video' | 'physical' | 'phone';
  location?: string;
  meeting_url?: string;
  description?: string;
  notes?: string;
  client_id?: string;
  expert_id?: string;
  apporteur_id?: string;
  priority: number;
  category: EventCategory;
  id?: string; // ID du RDV pour le mode édition
}

interface RDVFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  editMode?: boolean;
  initialData?: Partial<RDVFormData>;
}

// ============================================================================
// CONSTANTES
// ============================================================================

const MEETING_TYPES = [
  { value: 'video', label: 'Visioconférence', icon: Video },
  { value: 'physical', label: 'Présentiel', icon: MapPin },
  { value: 'phone', label: 'Téléphone', icon: Phone }
];

const PRIORITY_LEVELS = [
  { value: 1, label: 'Basse', color: 'bg-gray-100 text-gray-800' },
  { value: 2, label: 'Normale', color: 'bg-blue-100 text-blue-800' },
  { value: 3, label: 'Haute', color: 'bg-orange-100 text-orange-800' },
  { value: 4, label: 'Urgente', color: 'bg-red-100 text-red-800' }
];

// 🔥 Générer les créneaux 30min (09:00 → 18:00)
const generateTimeSlots = (): string[] => {
  const slots: string[] = [];
  for (let hour = 9; hour <= 18; hour++) {
    slots.push(`${hour.toString().padStart(2, '0')}:00`);
    if (hour < 18) {
      slots.push(`${hour.toString().padStart(2, '0')}:30`);
    }
  }
  return slots;
};

const TIME_SLOTS = generateTimeSlots();

const EVENT_CATEGORIES: Array<{
  value: EventCategory;
  label: string;
  description: string;
  badge: string;
}> = [
  {
    value: 'rdv_client',
    label: 'RDV client',
    description: 'Rencontre client/prospect (visio, tel, physique)',
    badge: 'Client'
  },
  {
    value: 'reunion_interne',
    label: 'Réunion interne',
    description: 'Point entre experts, apporteurs ou équipes support',
    badge: 'Interne'
  },
  {
    value: 'suivi_dossier',
    label: 'Suivi de dossier',
    description: 'Action dédiée à un dossier (relance documents, audit…)',
    badge: 'Dossier'
  },
  {
    value: 'echeance_admin',
    label: 'Échéance administrative',
    description: 'Date limite réglementaire ou dépôt administratif',
    badge: 'Admin'
  },
  {
    value: 'rappel_personnel',
    label: 'Rappel personnel',
    description: 'Mémo interne non partagé',
    badge: 'Rappel'
  }
];

// ============================================================================
// COMPOSANT
// ============================================================================

export const RDVFormModal: React.FC<RDVFormModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  editMode = false,
  initialData = {}
}) => {
  const [loading, setLoading] = useState(false);
  const [contacts, setContacts] = useState<Participant[]>([]);
  const [selectedParticipants, setSelectedParticipants] = useState<{
    client?: Participant;
    expert?: Participant;
    apporteur?: Participant;
    additionals?: Participant[];
  }>({});

  const [formData, setFormData] = useState<RDVFormData>({
    title: '',
    scheduled_date: '',
    scheduled_time: '09:00',
    duration_minutes: 30, // 🔥 30min par défaut
    meeting_type: 'video',
    location: '',
    meeting_url: '',
    description: '',
    notes: '',
    priority: 2,
    category: 'rdv_client',
    ...initialData
  });

  // Réinitialiser formData quand initialData change (mode édition)
  useEffect(() => {
    if (isOpen) {
      if (editMode && initialData && Object.keys(initialData).length > 0) {
        setFormData({
          title: initialData.title || '',
          scheduled_date: initialData.scheduled_date || '',
          scheduled_time: initialData.scheduled_time || '09:00',
          duration_minutes: initialData.duration_minutes || 30,
          meeting_type: initialData.meeting_type || 'video',
          location: initialData.location || '',
          meeting_url: initialData.meeting_url || '',
          description: initialData.description || '',
          notes: initialData.notes || '',
          priority: initialData.priority || 2,
          category: initialData.category || 'rdv_client',
          client_id: initialData.client_id,
          expert_id: initialData.expert_id,
          apporteur_id: initialData.apporteur_id,
          id: initialData.id
        });
      } else if (!editMode) {
        setFormData({
          title: '',
          scheduled_date: '',
          scheduled_time: '09:00',
          duration_minutes: 30,
          meeting_type: 'video',
          location: '',
          meeting_url: '',
          description: '',
          notes: '',
          priority: 2,
          category: 'rdv_client'
        });
        setSelectedParticipants({});
      }
    }
  }, [isOpen, editMode, initialData]);

  // Charger les contacts reliés
  useEffect(() => {
    if (isOpen) {
      loadContacts();
    }
  }, [isOpen]);

  // Charger les participants après que les contacts soient chargés
  useEffect(() => {
    if (isOpen && editMode && initialData && contacts.length > 0) {
      const participants: typeof selectedParticipants = {};
      
      if (initialData.client_id) {
        const client = contacts.find(c => c.id === initialData.client_id);
        if (client) participants.client = client;
      }
      
      if (initialData.expert_id) {
        const expert = contacts.find(c => c.id === initialData.expert_id);
        if (expert) participants.expert = expert;
      }
      
      if (initialData.apporteur_id) {
        const apporteur = contacts.find(c => c.id === initialData.apporteur_id);
        if (apporteur) participants.apporteur = apporteur;
      }
      
      if (Object.keys(participants).length > 0) {
        setSelectedParticipants(participants);
      }
    }
  }, [isOpen, editMode, initialData, contacts]);

  const loadContacts = async () => {
    try {
      // ✅ Utiliser le token Supabase
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      const response = await fetch(`${config.API_URL}/api/unified-messaging/contacts`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        setContacts([]);
        return;
      }

      const result = await response.json();
      const data = result.data || {};

      const groupKeys = ['clients', 'experts', 'apporteurs', 'admins'] as const;
      const flatten = groupKeys.flatMap((key) =>
        (data[key] || []).map((contact: any) => {
          const keyString = key as string;
          const inferredType = (keyString.endsWith('s')
            ? keyString.slice(0, -1)
            : keyString) as Participant['type'];

          return {
            id: contact.id,
            name:
              contact.full_name ||
              contact.company_name ||
              `${contact.first_name || ''} ${contact.last_name || ''}`.trim() ||
              contact.name ||
              contact.email,
            email: contact.email,
            type: (contact.type as Participant['type']) || inferredType,
            company_name: contact.company_name
          };
        })
      );

      setContacts(flatten);
    } catch (error) {
      console.error('Erreur chargement contacts:', error);
      setContacts([]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.scheduled_date || !formData.scheduled_time) {
      toast.error('Date et heure requises');
      return;
    }

    if (!selectedParticipants.client || !selectedParticipants.expert) {
      toast.error('Un client et un expert sont requis');
      return;
    }

    if (formData.meeting_type === 'physical' && !formData.location) {
      toast.error('Adresse requise pour un RDV présentiel');
      return;
    }

    if (formData.meeting_type === 'video' && !formData.meeting_url) {
      toast.error('Lien visio requis pour un RDV vidéo');
      return;
    }

    setLoading(true);

    try {
      const additionalInternalParticipants = (selectedParticipants.additionals || []).map(p => ({
        id: p.id,
        name: p.name,
        email: p.email,
        type: p.type,
        company_name: p.company_name
      }));

      const rdvPayload = {
        ...formData,
        // S'assurer que scheduled_date et scheduled_time sont des chaînes simples
        scheduled_date: String(formData.scheduled_date).trim(),
        scheduled_time: String(formData.scheduled_time).trim(),
        client_id: selectedParticipants.client.id,
        expert_id: selectedParticipants.expert.id,
        apporteur_id: selectedParticipants.apporteur?.id || null,
        metadata: {
          additional_participants: additionalInternalParticipants
        }
      };

      // ✅ Utiliser le token Supabase
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      
      // URL correcte : inclure l'ID pour PUT
      const url = editMode && formData.id
        ? `${config.API_URL}/api/rdv/${formData.id}`
        : `${config.API_URL}/api/rdv`;
      
      const response = await fetch(url, {
        method: editMode ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(rdvPayload)
      });

      const result = await response.json();

      if (result.success) {
        toast.success(editMode ? 'RDV modifié avec succès' : 'RDV créé avec succès');
        onSuccess?.();
        onClose();
      } else {
        toast.error(result.message || 'Erreur lors de la création du RDV');
      }
    } catch (error) {
      console.error('Erreur création RDV:', error);
      toast.error('Erreur lors de la création du RDV');
    } finally {
      setLoading(false);
    }
  };

  const addParticipant = (participant: Participant, type: 'client' | 'expert' | 'apporteur') => {
    setSelectedParticipants(prev => ({
      ...prev,
      [type]: participant
    }));
  };

  const removeParticipant = (type: 'client' | 'expert' | 'apporteur') => {
    setSelectedParticipants(prev => {
      const updated = { ...prev };
      delete updated[type];
      return updated;
    });
  };

  const getContactsByType = (type: 'client' | 'expert' | 'apporteur') => {
    return contacts.filter(c => c.type === type);
  };

  const internalParticipantTypes: Participant['type'][] = ['expert', 'apporteur'];

  const addInternalParticipant = (participant: Participant | undefined) => {
    if (!participant) return;
    setSelectedParticipants(prev => {
      const list = prev.additionals || [];
      if (list.some(p => p.id === participant.id)) {
        return prev;
      }
      return {
        ...prev,
        additionals: [...list, participant]
      };
    });
  };

  const removeInternalParticipant = (participantId: string) => {
    setSelectedParticipants(prev => ({
      ...prev,
      additionals: (prev.additionals || []).filter(p => p.id !== participantId)
    }));
  };

  const availableInternalContacts = contacts.filter(contact => {
    if (!internalParticipantTypes.includes(contact.type)) return false;
    if (selectedParticipants.expert && contact.id === selectedParticipants.expert.id) return false;
    if (selectedParticipants.apporteur && contact.id === selectedParticipants.apporteur.id) return false;
    if (selectedParticipants.additionals?.some(p => p.id === contact.id)) return false;
    return true;
  });

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[95vh] sm:max-h-[90vh] overflow-y-auto w-[98vw] sm:w-[95vw] md:w-full p-3 sm:p-4 md:p-6">
        <DialogHeader>
          <DialogTitle className="text-lg sm:text-xl md:text-2xl">
            {editMode ? '✏️ Modifier le RDV' : '📅 Nouveau RDV'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5 md:space-y-6">
          {/* Section Type d'événement */}
          <div className="space-y-3 sm:space-y-4">
            <Label className="text-sm sm:text-base">Type d'événement</Label>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 sm:gap-3">
              {EVENT_CATEGORIES.map(category => {
                const isSelected = formData.category === category.value;
                return (
                  <button
                    key={category.value}
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, category: category.value }))}
                    className={`p-3 sm:p-4 rounded-xl border-2 text-left transition-all ${
                      isSelected
                        ? 'border-blue-600 bg-blue-50 shadow-sm'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1 sm:mb-2">
                      <p className="text-xs sm:text-sm md:text-base font-semibold text-gray-900 truncate">
                        {category.label}
                      </p>
                      <Badge variant={isSelected ? 'default' : 'outline'} className="text-[10px] sm:text-xs flex-shrink-0 ml-1">
                        {category.badge}
                      </Badge>
                    </div>
                    <p className="text-[10px] sm:text-xs md:text-sm text-gray-600 line-clamp-2">{category.description}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section Participants */}
          <div className="space-y-3 sm:space-y-4">
            <h3 className="text-base sm:text-lg font-semibold flex items-center gap-2">
              <Users className="w-4 h-4 sm:w-5 sm:h-5" />
              Participants
            </h3>

            {/* Client (Obligatoire) */}
            <div>
              <Label className="mb-2 flex items-center gap-2 text-sm sm:text-base">
                Client <span className="text-red-500">*</span>
              </Label>
              {selectedParticipants.client ? (
                <div className="flex items-center gap-2 sm:gap-3 p-2.5 sm:p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <Avatar className="w-8 h-8 sm:w-10 sm:h-10 flex-shrink-0">
                    <AvatarFallback className="bg-blue-600 text-white text-xs sm:text-sm">
                      {selectedParticipants.client.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm sm:text-base truncate">{selectedParticipants.client.name}</p>
                    <p className="text-xs sm:text-sm text-gray-600 truncate">{selectedParticipants.client.email}</p>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeParticipant('client')}
                    className="flex-shrink-0 h-7 w-7 sm:h-8 sm:w-8 p-0"
                  >
                    <X className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  </Button>
                </div>
              ) : (
                <Select onValueChange={(value) => {
                  const client = contacts.find(c => c.id === value);
                  if (client) addParticipant(client, 'client');
                }}>
                  <SelectTrigger className="h-9 sm:h-10 text-sm sm:text-base">
                    <SelectValue placeholder="Sélectionner un client" />
                  </SelectTrigger>
                  <SelectContent>
                    {getContactsByType('client').map(contact => (
                      <SelectItem key={contact.id} value={contact.id} className="text-sm sm:text-base">
                        {contact.name} - {contact.company_name || contact.email}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            {/* Expert (Obligatoire) */}
            <div>
              <Label className="mb-2 flex items-center gap-2 text-sm sm:text-base">
                Expert <span className="text-red-500">*</span>
              </Label>
              {selectedParticipants.expert ? (
                <div className="flex items-center gap-2 sm:gap-3 p-2.5 sm:p-3 bg-green-50 rounded-lg border border-green-200">
                  <Avatar className="w-8 h-8 sm:w-10 sm:h-10 flex-shrink-0">
                    <AvatarFallback className="bg-green-600 text-white text-xs sm:text-sm">
                      {selectedParticipants.expert.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm sm:text-base truncate">{selectedParticipants.expert.name}</p>
                    <p className="text-xs sm:text-sm text-gray-600 truncate">{selectedParticipants.expert.email}</p>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeParticipant('expert')}
                    className="flex-shrink-0 h-7 w-7 sm:h-8 sm:w-8 p-0"
                  >
                    <X className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  </Button>
                </div>
              ) : (
                <Select onValueChange={(value) => {
                  const expert = contacts.find(c => c.id === value);
                  if (expert) addParticipant(expert, 'expert');
                }}>
                  <SelectTrigger className="h-9 sm:h-10 text-sm sm:text-base">
                    <SelectValue placeholder="Sélectionner un expert" />
                  </SelectTrigger>
                  <SelectContent>
                    {getContactsByType('expert').map(contact => (
                      <SelectItem key={contact.id} value={contact.id} className="text-sm sm:text-base">
                        {contact.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            {/* Apporteur (Optionnel) */}
            <div>
              <Label className="mb-2 text-sm sm:text-base">Apporteur (optionnel)</Label>
              {selectedParticipants.apporteur ? (
                <div className="flex items-center gap-2 sm:gap-3 p-2.5 sm:p-3 bg-purple-50 rounded-lg border border-purple-200">
                  <Avatar className="w-8 h-8 sm:w-10 sm:h-10 flex-shrink-0">
                    <AvatarFallback className="bg-purple-600 text-white text-xs sm:text-sm">
                      {selectedParticipants.apporteur.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm sm:text-base truncate">{selectedParticipants.apporteur.name}</p>
                    <p className="text-xs sm:text-sm text-gray-600 truncate">{selectedParticipants.apporteur.email}</p>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeParticipant('apporteur')}
                    className="flex-shrink-0 h-7 w-7 sm:h-8 sm:w-8 p-0"
                  >
                    <X className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  </Button>
                </div>
              ) : (
                <Select onValueChange={(value) => {
                  const apporteur = contacts.find(c => c.id === value);
                  if (apporteur) addParticipant(apporteur, 'apporteur');
                }}>
                  <SelectTrigger className="h-9 sm:h-10 text-sm sm:text-base">
                    <SelectValue placeholder="Sélectionner (optionnel)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none" className="text-sm sm:text-base">Aucun</SelectItem>
                    {getContactsByType('apporteur').map(contact => (
                      <SelectItem key={contact.id} value={contact.id} className="text-sm sm:text-base">
                        {contact.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            {formData.category === 'reunion_interne' && (
              <div>
                <Label className="mb-2">Participants internes (experts / apporteurs)</Label>
                <div className="space-y-3">
                  <Select
                    onValueChange={(value) => {
                      const participant = contacts.find(c => c.id === value);
                      addInternalParticipant(participant);
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={
                        availableInternalContacts.length === 0
                          ? 'Tous les contacts internes sont sélectionnés'
                          : 'Ajouter un participant interne'
                      } />
                    </SelectTrigger>
                    <SelectContent className="max-h-64">
                      {availableInternalContacts.length === 0 ? (
                        <div className="px-3 py-2 text-sm text-gray-500">
                          Aucun contact interne disponible
                        </div>
                      ) : (
                        availableInternalContacts.map(contact => (
                          <SelectItem key={contact.id} value={contact.id}>
                            {contact.name} • {contact.type === 'expert' ? 'Expert' : 'Apporteur'}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  {selectedParticipants.additionals && selectedParticipants.additionals.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {selectedParticipants.additionals.map(participant => (
                        <Badge
                          key={participant.id}
                          variant="secondary"
                          className="flex items-center gap-1 bg-slate-100 text-slate-800"
                        >
                          {participant.name}
                          <button
                            type="button"
                            onClick={() => removeInternalParticipant(participant.id)}
                            className="ml-1"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Section Planning */}
          <div className="space-y-3 sm:space-y-4">
            <h3 className="text-base sm:text-lg font-semibold flex items-center gap-2">
              <CalendarIcon className="w-4 h-4 sm:w-5 sm:h-5" />
              Planning
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              {/* Date */}
              <div>
                <Label htmlFor="date" className="text-sm sm:text-base">Date <span className="text-red-500">*</span></Label>
                <Input
                  id="date"
                  type="date"
                  value={formData.scheduled_date}
                  onChange={(e) => setFormData(prev => ({ ...prev, scheduled_date: e.target.value }))}
                  min={new Date().toISOString().split('T')[0]}
                  required
                  className="h-9 sm:h-10 text-sm sm:text-base"
                />
              </div>

              {/* Heure (Slots 30min) */}
              <div>
                <Label htmlFor="time" className="text-sm sm:text-base">
                  Heure <span className="text-red-500">*</span>
                  <span className="text-[10px] sm:text-xs text-gray-500 ml-1 sm:ml-2">(30min)</span>
                </Label>
                <Select
                  value={formData.scheduled_time}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, scheduled_time: value }))}
                >
                  <SelectTrigger className="h-9 sm:h-10 text-sm sm:text-base">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="max-h-60">
                    {TIME_SLOTS.map(slot => (
                      <SelectItem key={slot} value={slot} className="text-sm sm:text-base">
                        <div className="flex items-center gap-2">
                          <Clock className="w-3 h-3 sm:w-4 sm:h-4" />
                          {slot}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Durée */}
            <div>
              <Label className="text-sm sm:text-base">Durée</Label>
              <Select
                value={formData.duration_minutes.toString()}
                onValueChange={(value) => setFormData(prev => ({ ...prev, duration_minutes: parseInt(value) }))}
              >
                <SelectTrigger className="h-9 sm:h-10 text-sm sm:text-base">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="30" className="text-sm sm:text-base">30 minutes</SelectItem>
                  <SelectItem value="60" className="text-sm sm:text-base">1 heure</SelectItem>
                  <SelectItem value="90" className="text-sm sm:text-base">1h30</SelectItem>
                  <SelectItem value="120" className="text-sm sm:text-base">2 heures</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Section Type de RDV */}
          <div className="space-y-3 sm:space-y-4">
            <h3 className="text-base sm:text-lg font-semibold">Type de RDV</h3>

            <div className="grid grid-cols-3 gap-2 sm:gap-3">
              {MEETING_TYPES.map(type => {
                const Icon = type.icon;
                const isSelected = formData.meeting_type === type.value;
                return (
                  <button
                    key={type.value}
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, meeting_type: type.value as any }))}
                    className={`p-2.5 sm:p-3 md:p-4 rounded-lg border-2 transition-all ${
                      isSelected
                        ? 'border-blue-600 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <Icon className={`w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 mx-auto mb-1 sm:mb-2 ${isSelected ? 'text-blue-600' : 'text-gray-600'}`} />
                    <p className={`text-[10px] sm:text-xs md:text-sm font-medium ${isSelected ? 'text-blue-900' : 'text-gray-700'}`}>
                      {type.label}
                    </p>
                  </button>
                );
              })}
            </div>

            {/* Champs conditionnels */}
            {formData.meeting_type === 'physical' && (
              <div>
                <Label htmlFor="location" className="text-sm sm:text-base">Adresse <span className="text-red-500">*</span></Label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                  placeholder="Adresse du RDV"
                  required
                  className="h-9 sm:h-10 text-sm sm:text-base"
                />
              </div>
            )}

            {formData.meeting_type === 'video' && (
              <div>
                <Label htmlFor="meeting_url" className="text-sm sm:text-base">Lien Visio <span className="text-red-500">*</span></Label>
                <Input
                  id="meeting_url"
                  type="url"
                  value={formData.meeting_url}
                  onChange={(e) => setFormData(prev => ({ ...prev, meeting_url: e.target.value }))}
                  placeholder="https://meet.google.com/..."
                  required
                  className="h-9 sm:h-10 text-sm sm:text-base"
                />
              </div>
            )}
          </div>

          {/* Section Détails */}
          <div className="space-y-3 sm:space-y-4">
            <h3 className="text-base sm:text-lg font-semibold">Détails</h3>

            <div>
              <Label htmlFor="title" className="text-sm sm:text-base">Titre du RDV</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Ex: Audit fiscal TICPE"
                className="h-9 sm:h-10 text-sm sm:text-base"
              />
            </div>

            <div>
              <Label htmlFor="description" className="text-sm sm:text-base">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Objectifs et points à aborder..."
                rows={3}
                className="text-sm sm:text-base"
              />
            </div>

            <div>
              <Label htmlFor="notes" className="text-sm sm:text-base">Notes internes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Notes privées"
                rows={2}
                className="text-sm sm:text-base"
              />
            </div>

            {/* Priorité */}
            <div>
              <Label className="text-sm sm:text-base">Priorité</Label>
              <div className="flex flex-wrap gap-1.5 sm:gap-2">
                {PRIORITY_LEVELS.map(priority => (
                  <Badge
                    key={priority.value}
                    className={`cursor-pointer text-[10px] sm:text-xs px-2 sm:px-3 py-1 ${
                      formData.priority === priority.value
                        ? priority.color
                        : 'bg-gray-100 text-gray-600 opacity-50'
                    }`}
                    onClick={() => setFormData(prev => ({ ...prev, priority: priority.value }))}
                  >
                    {priority.label}
                  </Badge>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading} className="w-full sm:w-auto text-sm">
              Annuler
            </Button>
            <Button type="submit" disabled={loading} className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-sm">
              {loading ? 'Création...' : (editMode ? 'Modifier' : 'Créer le RDV')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

