import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { 
  Mail, 
  Phone, 
  User, 
  MessageSquare, 
  Send,
  CheckCircle2,
  ArrowLeft,
  X,
  Users
} from "lucide-react";
import { toast } from "sonner";
import { config } from "@/config/env";
import { ParticipantSelectorModal, SelectedParticipant } from "@/components/leads/ParticipantSelectorModal";

export default function AjouterLeadPage() {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "",
    contexte: "",
    participants: [] as SelectedParticipant[]
  });
  
  const [showParticipantSelect, setShowParticipantSelect] = useState(false);
  const [participantsInfo, setParticipantsInfo] = useState<Map<string, { name: string; email: string; type: string }>>(new Map());

  // Charger les informations des participants sélectionnés pour l'affichage
  useEffect(() => {
    const loadParticipantsInfo = async () => {
      if (formData.participants.length === 0) {
        setParticipantsInfo(new Map());
        return;
      }

      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${config.API_URL}/api/unified-messaging/contacts`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          const result = await response.json();
          const contactsData = result.data || {};
          
          // Créer une map pour stocker les infos des participants
          const infoMap = new Map<string, { name: string; email: string; type: string }>();
          
          // Parcourir tous les contacts pour trouver ceux qui sont sélectionnés
          const groupKeys = ['clients', 'experts', 'apporteurs', 'admins'] as const;
          groupKeys.forEach((groupKey) => {
            const contacts = contactsData[groupKey] || [];
            const type = groupKey.slice(0, -1) as 'client' | 'expert' | 'apporteur' | 'admin'; // Enlève le 's' final
            
            if (Array.isArray(contacts)) {
              contacts.forEach((contact: any) => {
                formData.participants.forEach(participant => {
                  if (participant.user_id === contact.id && participant.user_type === type) {
                    infoMap.set(`${participant.user_id}-${participant.user_type}`, {
                      name: contact.full_name || contact.name || contact.email,
                      email: contact.email || '',
                      type: participant.user_type
                    });
                  }
                });
              });
            }
          });
          
          setParticipantsInfo(infoMap);
        }
      } catch (error) {
        console.error('Erreur chargement infos participants:', error);
      }
    };

    loadParticipantsInfo();
  }, [formData.participants]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Validation simple
      if (!formData.name || !formData.email || !formData.contexte) {
        toast.error("Veuillez remplir tous les champs obligatoires");
        setIsSubmitting(false);
        return;
      }

      // Validation email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        toast.error("Veuillez entrer une adresse email valide");
        setIsSubmitting(false);
        return;
      }

      const token = localStorage.getItem('token');
      const response = await fetch(`${config.API_URL}/api/admin/leads`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        credentials: 'include',
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          phone: formData.phone || null,
          subject: formData.subject || null,
          contexte: formData.contexte,
          participants: formData.participants.length > 0 ? formData.participants : undefined
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erreur lors de l\'enregistrement du lead');
      }

      const result = await response.json();
      
      if (result.success) {
        setIsSuccess(true);
        toast.success("Lead ajouté avec succès !");
        // Réinitialiser le formulaire
        setFormData({
          name: "",
          email: "",
          phone: "",
          subject: "",
          contexte: "",
          participants: []
        });
      } else {
        throw new Error(result.message || 'Erreur lors de l\'enregistrement du lead');
      }
    } catch (error: any) {
      console.error('Erreur enregistrement lead:', error);
      toast.error(error.message || "Une erreur est survenue. Veuillez réessayer.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen w-full overflow-x-hidden bg-gradient-to-br from-slate-50 via-white to-blue-50">
        <section className="py-12 sm:py-16">
          <div className="w-full max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-white rounded-2xl p-8 sm:p-10 border border-slate-200 shadow-xl text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mb-3">
                Lead ajouté avec succès !
              </h2>
              <p className="text-slate-600 mb-6 text-sm sm:text-base">
                Le lead a été enregistré dans le système.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button 
                  onClick={() => {
                    setIsSuccess(false);
                    navigate('/admin/dashboard-optimized');
                  }}
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white"
                >
                  Retour au dashboard
                </Button>
                <Button 
                  onClick={() => setIsSuccess(false)}
                  variant="outline"
                >
                  Ajouter un autre lead
                </Button>
              </div>
            </div>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-gradient-to-br from-slate-50 via-white to-blue-50">
      {/* Hero Section compacte */}
      <section className="relative py-6 sm:py-8 bg-gradient-to-br from-blue-50 via-white to-indigo-50 overflow-hidden">
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-full -translate-y-48 translate-x-48"></div>
        </div>
        
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-2xl mx-auto">
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-2">
              Ajouter un Lead
            </h1>
            <p className="text-sm sm:text-base text-slate-600">
              Enregistrez un nouveau lead dans le système.
            </p>
          </div>
        </div>
      </section>

      {/* Formulaire de contact et infos - Layout compact */}
      <section className="py-6 sm:py-8 pb-12">
        <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Formulaire */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-xl">
                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Nom et Email en ligne sur desktop */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="name" className="flex items-center gap-1.5 mb-1.5 text-sm">
                        <User className="w-3.5 h-3.5 text-slate-600" />
                        <span>Nom complet du contact <span className="text-red-500">*</span></span>
                      </Label>
                      <Input
                        id="name"
                        name="name"
                        type="text"
                        value={formData.name}
                        onChange={handleChange}
                        required
                        placeholder="Votre nom complet"
                        className="w-full"
                      />
                    </div>
                    <div>
                      <Label htmlFor="email" className="flex items-center gap-1.5 mb-1.5 text-sm">
                        <Mail className="w-3.5 h-3.5 text-slate-600" />
                        <span>Email <span className="text-red-500">*</span></span>
                      </Label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleChange}
                        required
                        placeholder="votre@email.com"
                        className="w-full"
                      />
                    </div>
                  </div>

                  {/* Téléphone et Sujet en ligne sur desktop */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="phone" className="flex items-center gap-1.5 mb-1.5 text-sm">
                        <Phone className="w-3.5 h-3.5 text-slate-600" />
                        <span>Téléphone</span>
                      </Label>
                      <Input
                        id="phone"
                        name="phone"
                        type="tel"
                        value={formData.phone}
                        onChange={handleChange}
                        placeholder="06 12 34 56 78"
                        className="w-full"
                      />
                    </div>
                    <div>
                      <Label htmlFor="subject" className="flex items-center gap-1.5 mb-1.5 text-sm">
                        <MessageSquare className="w-3.5 h-3.5 text-slate-600" />
                        <span>Sujet</span>
                      </Label>
                      <Input
                        id="subject"
                        name="subject"
                        type="text"
                        value={formData.subject}
                        onChange={handleChange}
                        placeholder="Objet de votre message"
                        className="w-full"
                      />
                    </div>
                  </div>

                  {/* Contexte */}
                  <div>
                    <Label htmlFor="contexte" className="flex items-center gap-1.5 mb-1.5 text-sm">
                      <MessageSquare className="w-3.5 h-3.5 text-slate-600" />
                      <span>Contexte <span className="text-red-500">*</span></span>
                    </Label>
                    <Textarea
                      id="contexte"
                      name="contexte"
                      value={formData.contexte}
                      onChange={handleChange}
                      required
                      placeholder="Décrivez le lead précisément"
                      className="w-full min-h-[100px]"
                      rows={4}
                    />
                  </div>

                  {/* Participants */}
                  <div>
                    <Label className="flex items-center gap-1.5 mb-1.5 text-sm">
                      <Users className="w-3.5 h-3.5 text-slate-600" />
                      <span>Participants (optionnel)</span>
                    </Label>
                    
                    {/* Participants sélectionnés */}
                    {formData.participants.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-2">
                        {formData.participants.map((participant, index) => {
                          const info = participantsInfo.get(`${participant.user_id}-${participant.user_type}`);
                          
                          return (
                            <Badge
                              key={`${participant.user_id}-${participant.user_type}-${index}`}
                              variant="secondary"
                              className="flex items-center gap-1 px-2 py-1"
                            >
                              <span className="text-xs">{info?.name || participant.user_type}</span>
                              <button
                                type="button"
                                onClick={() => {
                                  setFormData(prev => ({
                                    ...prev,
                                    participants: prev.participants.filter((_, i) => i !== index)
                                  }));
                                }}
                                className="ml-1 hover:bg-slate-300 rounded-full p-0.5"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </Badge>
                          );
                        })}
                      </div>
                    )}
                    
                    {/* Bouton pour ouvrir la sélection */}
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowParticipantSelect(true)}
                      className="w-full justify-start"
                    >
                      <Users className="w-4 h-4 mr-2" />
                      {formData.participants.length > 0 
                        ? `${formData.participants.length} participant(s) sélectionné(s)`
                        : "Ajouter des participants"}
                    </Button>
                    
                    {/* Modal de sélection des participants */}
                    <ParticipantSelectorModal
                      isOpen={showParticipantSelect}
                      onClose={() => setShowParticipantSelect(false)}
                      selectedParticipants={formData.participants}
                      onSelectParticipants={(participants) => {
                        setFormData(prev => ({
                          ...prev,
                          participants
                        }));
                      }}
                    />
                  </div>

                  {/* Bouton d'envoi */}
                  <div className="flex flex-col sm:flex-row gap-3 pt-2">
                    <Button
                      type="submit"
                      disabled={isSubmitting}
                      className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700"
                    >
                      {isSubmitting ? (
                        <span className="flex items-center gap-2">
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          Enregistrement en cours...
                        </span>
                      ) : (
                        <span className="flex items-center gap-2">
                          <Send className="w-4 h-4" />
                          Enregistrer le lead
                        </span>
                      )}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => navigate('/admin/dashboard-optimized')}
                      className="sm:w-auto"
                    >
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      Retour
                    </Button>
                  </div>
                </form>
              </div>
            </div>

            {/* Informations - Sidebar */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xl space-y-4">
                <h3 className="font-semibold text-slate-900 mb-4">Informations</h3>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-lg flex items-center justify-center flex-shrink-0">
                      <User className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <h4 className="font-medium text-slate-900 text-sm mb-0.5">Lead</h4>
                      <p className="text-slate-600 text-sm">Un lead est un contact potentiel qui peut devenir un client.</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 bg-gradient-to-br from-green-500 to-emerald-500 rounded-lg flex items-center justify-center flex-shrink-0">
                      <CheckCircle2 className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <h4 className="font-medium text-slate-900 text-sm mb-0.5">Contexte</h4>
                      <p className="text-slate-600 text-sm">Décrivez précisément le contexte du lead pour faciliter le suivi.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

