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
    ...initialData
  });

  // Charger les contacts reliés
  useEffect(() => {
    if (isOpen) {
      loadContacts();
    }
  }, [isOpen]);

  const loadContacts = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${config.API_URL}/api/messaging/contacts`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const result = await response.json();
        setContacts(result.data || []);
      }
    } catch (error) {
      console.error('Erreur chargement contacts:', error);
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
      const rdvPayload = {
        ...formData,
        client_id: selectedParticipants.client.id,
        expert_id: selectedParticipants.expert.id,
        apporteur_id: selectedParticipants.apporteur?.id || null
      };

      const token = localStorage.getItem('token');
      const response = await fetch(`${config.API_URL}/api/rdv`, {
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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">
            {editMode ? '✏️ Modifier le RDV' : '📅 Nouveau Rendez-vous'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Section Participants */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Users className="w-5 h-5" />
              Participants
            </h3>

            {/* Client (Obligatoire) */}
            <div>
              <Label className="mb-2 flex items-center gap-2">
                Client <span className="text-red-500">*</span>
              </Label>
              {selectedParticipants.client ? (
                <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <Avatar className="w-10 h-10">
                    <AvatarFallback className="bg-blue-600 text-white">
                      {selectedParticipants.client.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="font-semibold">{selectedParticipants.client.name}</p>
                    <p className="text-sm text-gray-600">{selectedParticipants.client.email}</p>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeParticipant('client')}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ) : (
                <Select onValueChange={(value) => {
                  const client = contacts.find(c => c.id === value);
                  if (client) addParticipant(client, 'client');
                }}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un client" />
                  </SelectTrigger>
                  <SelectContent>
                    {getContactsByType('client').map(contact => (
                      <SelectItem key={contact.id} value={contact.id}>
                        {contact.name} - {contact.company_name || contact.email}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            {/* Expert (Obligatoire) */}
            <div>
              <Label className="mb-2 flex items-center gap-2">
                Expert <span className="text-red-500">*</span>
              </Label>
              {selectedParticipants.expert ? (
                <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg border border-green-200">
                  <Avatar className="w-10 h-10">
                    <AvatarFallback className="bg-green-600 text-white">
                      {selectedParticipants.expert.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="font-semibold">{selectedParticipants.expert.name}</p>
                    <p className="text-sm text-gray-600">{selectedParticipants.expert.email}</p>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeParticipant('expert')}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ) : (
                <Select onValueChange={(value) => {
                  const expert = contacts.find(c => c.id === value);
                  if (expert) addParticipant(expert, 'expert');
                }}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un expert" />
                  </SelectTrigger>
                  <SelectContent>
                    {getContactsByType('expert').map(contact => (
                      <SelectItem key={contact.id} value={contact.id}>
                        {contact.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            {/* Apporteur (Optionnel) */}
            <div>
              <Label className="mb-2">Apporteur (optionnel)</Label>
              {selectedParticipants.apporteur ? (
                <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg border border-purple-200">
                  <Avatar className="w-10 h-10">
                    <AvatarFallback className="bg-purple-600 text-white">
                      {selectedParticipants.apporteur.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="font-semibold">{selectedParticipants.apporteur.name}</p>
                    <p className="text-sm text-gray-600">{selectedParticipants.apporteur.email}</p>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeParticipant('apporteur')}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ) : (
                <Select onValueChange={(value) => {
                  const apporteur = contacts.find(c => c.id === value);
                  if (apporteur) addParticipant(apporteur, 'apporteur');
                }}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un apporteur (optionnel)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Aucun</SelectItem>
                    {getContactsByType('apporteur').map(contact => (
                      <SelectItem key={contact.id} value={contact.id}>
                        {contact.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>

          {/* Section Planning */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <CalendarIcon className="w-5 h-5" />
              Planning
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Date */}
              <div>
                <Label htmlFor="date">Date <span className="text-red-500">*</span></Label>
                <Input
                  id="date"
                  type="date"
                  value={formData.scheduled_date}
                  onChange={(e) => setFormData(prev => ({ ...prev, scheduled_date: e.target.value }))}
                  min={new Date().toISOString().split('T')[0]}
                  required
                />
              </div>

              {/* Heure (Slots 30min) */}
              <div>
                <Label htmlFor="time">
                  Heure <span className="text-red-500">*</span>
                  <span className="text-xs text-gray-500 ml-2">(Créneaux de 30min)</span>
                </Label>
                <Select
                  value={formData.scheduled_time}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, scheduled_time: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="max-h-60">
                    {TIME_SLOTS.map(slot => (
                      <SelectItem key={slot} value={slot}>
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4" />
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
              <Label>Durée</Label>
              <Select
                value={formData.duration_minutes.toString()}
                onValueChange={(value) => setFormData(prev => ({ ...prev, duration_minutes: parseInt(value) }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="30">30 minutes</SelectItem>
                  <SelectItem value="60">1 heure</SelectItem>
                  <SelectItem value="90">1h30</SelectItem>
                  <SelectItem value="120">2 heures</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Section Type de RDV */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Type de Rendez-vous</h3>

            <div className="grid grid-cols-3 gap-3">
              {MEETING_TYPES.map(type => {
                const Icon = type.icon;
                const isSelected = formData.meeting_type === type.value;
                return (
                  <button
                    key={type.value}
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, meeting_type: type.value as any }))}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      isSelected
                        ? 'border-blue-600 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <Icon className={`w-6 h-6 mx-auto mb-2 ${isSelected ? 'text-blue-600' : 'text-gray-600'}`} />
                    <p className={`text-sm font-medium ${isSelected ? 'text-blue-900' : 'text-gray-700'}`}>
                      {type.label}
                    </p>
                  </button>
                );
              })}
            </div>

            {/* Champs conditionnels */}
            {formData.meeting_type === 'physical' && (
              <div>
                <Label htmlFor="location">Adresse <span className="text-red-500">*</span></Label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                  placeholder="123 Rue de la Paix, 75001 Paris"
                  required
                />
              </div>
            )}

            {formData.meeting_type === 'video' && (
              <div>
                <Label htmlFor="meeting_url">Lien Visioconférence <span className="text-red-500">*</span></Label>
                <Input
                  id="meeting_url"
                  type="url"
                  value={formData.meeting_url}
                  onChange={(e) => setFormData(prev => ({ ...prev, meeting_url: e.target.value }))}
                  placeholder="https://meet.google.com/xxx-yyyy-zzz"
                  required
                />
              </div>
            )}
          </div>

          {/* Section Détails */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Détails</h3>

            <div>
              <Label htmlFor="title">Titre du RDV</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Ex: Audit fiscal TICPE"
              />
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Objectifs et points à aborder..."
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="notes">Notes internes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Notes privées (non visibles par le client)"
                rows={2}
              />
            </div>

            {/* Priorité */}
            <div>
              <Label>Priorité</Label>
              <div className="flex gap-2">
                {PRIORITY_LEVELS.map(priority => (
                  <Badge
                    key={priority.value}
                    className={`cursor-pointer ${
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

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Annuler
            </Button>
            <Button type="submit" disabled={loading} className="bg-blue-600 hover:bg-blue-700">
              {loading ? 'Création...' : (editMode ? 'Modifier' : 'Créer le RDV')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

