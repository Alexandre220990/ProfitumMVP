import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { post } from "@/lib/api";

interface RegistrationData {
  email: string;
  password: string;
  name: string;
  company: string;
  siren: string;
  specializations: string[];
  experience: string;
  location: string;
  compensation: number;
  description: string;
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export default function PartnerRegistrationForm() {
  const [formData, setFormData] = useState<RegistrationData>({
    email: "",
    password: "",
    name: "",
    company: "",
    siren: "",
    specializations: [],
    experience: "",
    location: "",
    compensation: 0,
    description: ""
  });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await post<ApiResponse<{ id: number }>>('/api/experts', formData);
      
      toast({
        title: "Inscription réussie",
        description: "Votre compte a été créé avec succès. Vous pouvez maintenant vous connecter.",
      });

      navigate("/connexion-partner");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Une erreur est survenue lors de l'inscription";
      toast({
        title: "Erreur",
        description: message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        type="email"
        name="email"
        placeholder="Email"
        value={formData.email}
        onChange={handleInputChange}
        required
      />
      <Input
        type="password"
        name="password"
        placeholder="Mot de passe"
        value={formData.password}
        onChange={handleInputChange}
        required
      />
      <Input
        type="text"
        name="name"
        placeholder="Nom complet"
        value={formData.name}
        onChange={handleInputChange}
        required
      />
      <Input
        type="text"
        name="company"
        placeholder="Nom de l'entreprise"
        value={formData.company}
        onChange={handleInputChange}
        required
      />
      <Input
        type="text"
        name="siren"
        placeholder="SIREN"
        value={formData.siren}
        onChange={handleInputChange}
        required
      />
      <Input
        type="text"
        name="location"
        placeholder="Localisation"
        value={formData.location}
        onChange={handleInputChange}
        required
      />
      <Input
        type="text"
        name="experience"
        placeholder="Années d'expérience"
        value={formData.experience}
        onChange={handleInputChange}
        required
      />
      <Input
        type="number"
        name="compensation"
        placeholder="Taux de commission (%)"
        value={formData.compensation}
        onChange={handleInputChange}
        required
      />
      <textarea
        name="description"
        placeholder="Description de votre expertise"
        value={formData.description}
        onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
        className="w-full p-2 border rounded"
        required
      />
      <Button type="submit" disabled={loading}>
        {loading ? "Inscription en cours..." : "S'inscrire"}
      </Button>
    </form>
  );
} 