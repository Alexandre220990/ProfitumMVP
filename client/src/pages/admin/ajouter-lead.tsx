import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { 
  Mail, 
  Phone, 
  User, 
  MessageSquare, 
  Send,
  CheckCircle2,
  ArrowLeft,
  X,
  Users,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import { toast } from "sonner";
import { config } from "@/config/env";

export default function AjouterLeadPage() {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  
  // Charger les utilisateurs disponibles pour la sélection
  useEffect(() => {
    const loadUsers = async () => {
      setLoadingUsers(true);
      try {
        const token = localStorage.getItem('token');
        
        // Charger experts
        const expertsRes = await fetch(`${config.API_URL}/api/admin/experts/all`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (expertsRes.ok) {
          const expertsData = await expertsRes.json();
          const experts = (expertsData.data?.experts || []).map((expert: any) => ({
            id: expert.auth_user_id || expert.id,
            name: expert.first_name && expert.last_name
              ? `${expert.first_name} ${expert.last_name}`.trim()
              : expert.name || expert.company_name || expert.email || 'Expert',
            email: expert.email,
            type: 'expert'
          }));
          setAvailableUsers(prev => ({ ...prev, experts }));
        }
        
        // Charger admins
        const adminsRes = await fetch(`${config.API_URL}/api/admin/admins/select`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (adminsRes.ok) {
          const adminsData = await adminsRes.json();
          setAvailableUsers(prev => ({ ...prev, admins: adminsData.data || [] }));
        }
        
        // Charger clients
        const clientsRes = await fetch(`${config.API_URL}/api/admin/clients/select`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (clientsRes.ok) {
          const clientsData = await clientsRes.json();
          setAvailableUsers(prev => ({ ...prev, clients: clientsData.data || [] }));
        }
        
        // Charger apporteurs
        const apporteursRes = await fetch(`${config.API_URL}/api/admin/apporteurs/select`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (apporteursRes.ok) {
          const apporteursData = await apporteursRes.json();
          setAvailableUsers(prev => ({ ...prev, apporteurs: apporteursData.data || [] }));
        }
      } catch (error) {
        console.error('Erreur chargement utilisateurs:', error);
      } finally {
        setLoadingUsers(false);
      }
    };
    
    loadUsers();
  }, []);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "",
    contexte: "",
    participants: [] as Array<{ user_id: string; user_type: 'admin' | 'expert' | 'client' | 'apporteur' }>
  });
  
  const [availableUsers, setAvailableUsers] = useState<{
    experts: Array<{ id: string; name: string; email: string; type: string }>;
    admins: Array<{ id: string; name: string; email: string; type: string }>;
    clients: Array<{ id: string; name: string; email: string; type: string }>;
    apporteurs: Array<{ id: string; name: string; email: string; type: string }>;
  }>({
    experts: [],
    admins: [],
    clients: [],
    apporteurs: []
  });
  
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [showParticipantSelect, setShowParticipantSelect] = useState(false);
  const [openSections, setOpenSections] = useState<{
    experts: boolean;
    admins: boolean;
    clients: boolean;
    apporteurs: boolean;
  }>({
    experts: true,
    admins: true,
    clients: true,
    apporteurs: true
  });

  const toggleSection = (section: keyof typeof openSections) => {
    setOpenSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const toggleParticipant = (userId: string, userType: 'admin' | 'expert' | 'client' | 'apporteur') => {
    setFormData(prev => {
      const existingIndex = prev.participants.findIndex(
        p => p.user_id === userId && p.user_type === userType
      );
      
      if (existingIndex >= 0) {
        // Retirer le participant
        return {
          ...prev,
          participants: prev.participants.filter((_, i) => i !== existingIndex)
        };
      } else {
        // Ajouter le participant
        return {
          ...prev,
          participants: [...prev.participants, { user_id: userId, user_type: userType }]
        };
      }
    });
  };

  const isParticipantSelected = (userId: string, userType: 'admin' | 'expert' | 'client' | 'apporteur') => {
    return formData.participants.some(
      p => p.user_id === userId && p.user_type === userType
    );
  };

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
                          const user = [
                            ...availableUsers.experts,
                            ...availableUsers.admins,
                            ...availableUsers.clients,
                            ...availableUsers.apporteurs
                          ].find(u => u.id === participant.user_id && u.type === participant.user_type);
                          
                          return (
                            <Badge
                              key={`${participant.user_id}-${participant.user_type}-${index}`}
                              variant="secondary"
                              className="flex items-center gap-1 px-2 py-1"
                            >
                              <span className="text-xs">{user?.name || `${participant.user_type}`}</span>
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
                    
                    {/* Dialog de sélection des participants */}
                    <Dialog open={showParticipantSelect} onOpenChange={setShowParticipantSelect}>
                      <DialogContent className="max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
                        <DialogHeader>
                          <DialogTitle className="flex items-center gap-2">
                            <Users className="w-5 h-5 text-blue-600" />
                            Sélectionner les participants
                          </DialogTitle>
                          <DialogDescription>
                            Choisissez les utilisateurs qui recevront ce lead. Les participants sont regroupés par catégorie.
                          </DialogDescription>
                        </DialogHeader>
                        
                        <div className="flex-1 overflow-y-auto mt-4 space-y-3">
                          {loadingUsers ? (
                            <div className="flex items-center justify-center py-12">
                              <div className="text-center">
                                <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                                <p className="text-sm text-slate-500">Chargement des utilisateurs...</p>
                              </div>
                            </div>
                          ) : (
                            <>
                              {/* Experts */}
                              <Collapsible open={openSections.experts} onOpenChange={() => toggleSection('experts')}>
                                <CollapsibleTrigger className="w-full flex items-center justify-between p-3 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors">
                                  <div className="flex items-center gap-2">
                                    <span className="font-medium text-sm text-slate-900">Experts</span>
                                    <Badge variant="secondary" className="text-xs">
                                      {availableUsers.experts.length}
                                    </Badge>
                                    {availableUsers.experts.filter(e => isParticipantSelected(e.id, 'expert')).length > 0 && (
                                      <Badge className="bg-blue-600 text-white text-xs">
                                        {availableUsers.experts.filter(e => isParticipantSelected(e.id, 'expert')).length} sélectionné(s)
                                      </Badge>
                                    )}
                                  </div>
                                  {openSections.experts ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
                                </CollapsibleTrigger>
                                <CollapsibleContent className="mt-2">
                                  <div className="max-h-60 overflow-y-auto space-y-1 p-2 border rounded-lg bg-slate-50">
                                    {availableUsers.experts.length === 0 ? (
                                      <p className="text-sm text-slate-500 text-center py-4">Aucun expert disponible</p>
                                    ) : (
                                      availableUsers.experts.map(expert => {
                                        const isSelected = isParticipantSelected(expert.id, 'expert');
                                        return (
                                          <label
                                            key={expert.id}
                                            className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                                              isSelected 
                                                ? 'bg-blue-50 border border-blue-200' 
                                                : 'bg-white border border-slate-200 hover:bg-slate-50'
                                            }`}
                                          >
                                            <Checkbox
                                              checked={isSelected}
                                              onCheckedChange={() => toggleParticipant(expert.id, 'expert')}
                                            />
                                            <div className="flex-1 min-w-0">
                                              <p className="font-medium text-sm text-slate-900 truncate">{expert.name}</p>
                                              {expert.email && (
                                                <p className="text-xs text-slate-500 truncate">{expert.email}</p>
                                              )}
                                            </div>
                                          </label>
                                        );
                                      })
                                    )}
                                  </div>
                                </CollapsibleContent>
                              </Collapsible>

                              {/* Admins */}
                              <Collapsible open={openSections.admins} onOpenChange={() => toggleSection('admins')}>
                                <CollapsibleTrigger className="w-full flex items-center justify-between p-3 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors">
                                  <div className="flex items-center gap-2">
                                    <span className="font-medium text-sm text-slate-900">Admins</span>
                                    <Badge variant="secondary" className="text-xs">
                                      {availableUsers.admins.length}
                                    </Badge>
                                    {availableUsers.admins.filter(a => isParticipantSelected(a.id, 'admin')).length > 0 && (
                                      <Badge className="bg-blue-600 text-white text-xs">
                                        {availableUsers.admins.filter(a => isParticipantSelected(a.id, 'admin')).length} sélectionné(s)
                                      </Badge>
                                    )}
                                  </div>
                                  {openSections.admins ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
                                </CollapsibleTrigger>
                                <CollapsibleContent className="mt-2">
                                  <div className="max-h-60 overflow-y-auto space-y-1 p-2 border rounded-lg bg-slate-50">
                                    {availableUsers.admins.length === 0 ? (
                                      <p className="text-sm text-slate-500 text-center py-4">Aucun admin disponible</p>
                                    ) : (
                                      availableUsers.admins.map(admin => {
                                        const isSelected = isParticipantSelected(admin.id, 'admin');
                                        return (
                                          <label
                                            key={admin.id}
                                            className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                                              isSelected 
                                                ? 'bg-blue-50 border border-blue-200' 
                                                : 'bg-white border border-slate-200 hover:bg-slate-50'
                                            }`}
                                          >
                                            <Checkbox
                                              checked={isSelected}
                                              onCheckedChange={() => toggleParticipant(admin.id, 'admin')}
                                            />
                                            <div className="flex-1 min-w-0">
                                              <p className="font-medium text-sm text-slate-900 truncate">{admin.name}</p>
                                              {admin.email && (
                                                <p className="text-xs text-slate-500 truncate">{admin.email}</p>
                                              )}
                                            </div>
                                          </label>
                                        );
                                      })
                                    )}
                                  </div>
                                </CollapsibleContent>
                              </Collapsible>

                              {/* Clients */}
                              <Collapsible open={openSections.clients} onOpenChange={() => toggleSection('clients')}>
                                <CollapsibleTrigger className="w-full flex items-center justify-between p-3 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors">
                                  <div className="flex items-center gap-2">
                                    <span className="font-medium text-sm text-slate-900">Clients</span>
                                    <Badge variant="secondary" className="text-xs">
                                      {availableUsers.clients.length}
                                    </Badge>
                                    {availableUsers.clients.filter(c => isParticipantSelected(c.id, 'client')).length > 0 && (
                                      <Badge className="bg-blue-600 text-white text-xs">
                                        {availableUsers.clients.filter(c => isParticipantSelected(c.id, 'client')).length} sélectionné(s)
                                      </Badge>
                                    )}
                                  </div>
                                  {openSections.clients ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
                                </CollapsibleTrigger>
                                <CollapsibleContent className="mt-2">
                                  <div className="max-h-60 overflow-y-auto space-y-1 p-2 border rounded-lg bg-slate-50">
                                    {availableUsers.clients.length === 0 ? (
                                      <p className="text-sm text-slate-500 text-center py-4">Aucun client disponible</p>
                                    ) : (
                                      availableUsers.clients.map(client => {
                                        const isSelected = isParticipantSelected(client.id, 'client');
                                        return (
                                          <label
                                            key={client.id}
                                            className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                                              isSelected 
                                                ? 'bg-blue-50 border border-blue-200' 
                                                : 'bg-white border border-slate-200 hover:bg-slate-50'
                                            }`}
                                          >
                                            <Checkbox
                                              checked={isSelected}
                                              onCheckedChange={() => toggleParticipant(client.id, 'client')}
                                            />
                                            <div className="flex-1 min-w-0">
                                              <p className="font-medium text-sm text-slate-900 truncate">{client.name}</p>
                                              {client.email && (
                                                <p className="text-xs text-slate-500 truncate">{client.email}</p>
                                              )}
                                            </div>
                                          </label>
                                        );
                                      })
                                    )}
                                  </div>
                                </CollapsibleContent>
                              </Collapsible>

                              {/* Apporteurs */}
                              <Collapsible open={openSections.apporteurs} onOpenChange={() => toggleSection('apporteurs')}>
                                <CollapsibleTrigger className="w-full flex items-center justify-between p-3 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors">
                                  <div className="flex items-center gap-2">
                                    <span className="font-medium text-sm text-slate-900">Apporteurs</span>
                                    <Badge variant="secondary" className="text-xs">
                                      {availableUsers.apporteurs.length}
                                    </Badge>
                                    {availableUsers.apporteurs.filter(a => isParticipantSelected(a.id, 'apporteur')).length > 0 && (
                                      <Badge className="bg-blue-600 text-white text-xs">
                                        {availableUsers.apporteurs.filter(a => isParticipantSelected(a.id, 'apporteur')).length} sélectionné(s)
                                      </Badge>
                                    )}
                                  </div>
                                  {openSections.apporteurs ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
                                </CollapsibleTrigger>
                                <CollapsibleContent className="mt-2">
                                  <div className="max-h-60 overflow-y-auto space-y-1 p-2 border rounded-lg bg-slate-50">
                                    {availableUsers.apporteurs.length === 0 ? (
                                      <p className="text-sm text-slate-500 text-center py-4">Aucun apporteur disponible</p>
                                    ) : (
                                      availableUsers.apporteurs.map(apporteur => {
                                        const isSelected = isParticipantSelected(apporteur.id, 'apporteur');
                                        return (
                                          <label
                                            key={apporteur.id}
                                            className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                                              isSelected 
                                                ? 'bg-blue-50 border border-blue-200' 
                                                : 'bg-white border border-slate-200 hover:bg-slate-50'
                                            }`}
                                          >
                                            <Checkbox
                                              checked={isSelected}
                                              onCheckedChange={() => toggleParticipant(apporteur.id, 'apporteur')}
                                            />
                                            <div className="flex-1 min-w-0">
                                              <p className="font-medium text-sm text-slate-900 truncate">{apporteur.name}</p>
                                              {apporteur.email && (
                                                <p className="text-xs text-slate-500 truncate">{apporteur.email}</p>
                                              )}
                                            </div>
                                          </label>
                                        );
                                      })
                                    )}
                                  </div>
                                </CollapsibleContent>
                              </Collapsible>

                              {availableUsers.experts.length === 0 && 
                               availableUsers.admins.length === 0 && 
                               availableUsers.clients.length === 0 && 
                               availableUsers.apporteurs.length === 0 && (
                                <div className="text-center py-12 text-slate-500">
                                  <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
                                  <p className="text-sm">Aucun utilisateur disponible</p>
                                </div>
                              )}
                            </>
                          )}
                        </div>
                        
                        <div className="flex justify-between items-center pt-4 mt-4 border-t">
                          <div className="text-sm text-slate-600">
                            {formData.participants.length > 0 ? (
                              <span className="font-medium text-slate-900">{formData.participants.length}</span>
                            ) : (
                              <span>Aucun</span>
                            )}{' '}
                            participant{formData.participants.length > 1 ? 's' : ''} sélectionné{formData.participants.length > 1 ? 's' : ''}
                          </div>
                          <Button 
                            type="button" 
                            onClick={() => setShowParticipantSelect(false)}
                            className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white"
                          >
                            Valider
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
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

