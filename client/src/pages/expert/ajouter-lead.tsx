import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { 
  Mail, 
  Phone, 
  User, 
  MessageSquare, 
  Send,
  CheckCircle2,
  ArrowLeft
} from "lucide-react";
import { toast } from "sonner";
import { config } from "@/config/env";

export default function ExpertAjouterLeadPage() {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "",
    contexte: ""
  });

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
      const response = await fetch(`${config.API_URL}/api/expert/leads`, {
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
          contexte: formData.contexte
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erreur lors de l\'enregistrement du lead');
      }

      const result = await response.json();
      
      if (result.success) {
        setIsSuccess(true);
        toast.success("Lead ajouté avec succès ! L'admin a été notifié.");
        // Réinitialiser le formulaire
        setFormData({
          name: "",
          email: "",
          phone: "",
          subject: "",
          contexte: ""
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
                Le lead a été enregistré et l'admin a été notifié.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button 
                  onClick={() => {
                    setIsSuccess(false);
                    navigate('/expert/dashboard');
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
              Enregistrez un nouveau lead. L'admin sera automatiquement notifié.
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
                      onClick={() => navigate('/expert/dashboard')}
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
                      <h4 className="font-medium text-slate-900 text-sm mb-0.5">Notification Admin</h4>
                      <p className="text-slate-600 text-sm">L'admin sera automatiquement notifié de ce nouveau lead.</p>
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

