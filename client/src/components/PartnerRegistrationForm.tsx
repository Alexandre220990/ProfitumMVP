import React, { useState, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
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

// Optimisation : Composant Input optimisé avec React.memo
const FormInput = React.memo(({
  type,
  name,
  placeholder,
  value,
  onChange,
  required = false
}: {
  type: string;
  name: string;
  placeholder: string;
  value: string | number;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  required?: boolean;
}) => (
  <Input
    type={type}
    name={name}
    placeholder={placeholder}
    value={value}
    onChange={onChange}
    required={required}
  />
));

FormInput.displayName = 'FormInput';

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

  // Optimisation : Gestion de la soumission avec useCallback
  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await post<ApiResponse<{ id: number }>>('/api/experts', formData);
      
      toast.success("Inscription réussie ! Votre compte a été créé avec succès. Vous pouvez maintenant vous connecter");

      navigate("/connexion-expert");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Une erreur est survenue lors de l'inscription";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, [formData, toast, navigate]);

  // Optimisation : Gestion des changements d'input avec useCallback
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  }, []);

  // Optimisation : Gestion des changements de textarea avec useCallback
  const handleTextareaChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setFormData(prev => ({ ...prev, description: e.target.value }));
  }, []);

  // Optimisation : Validation du formulaire avec useMemo
  const isFormValid = useMemo(() => {
    return (
      formData.email.trim() !== "" &&
      formData.password.trim() !== "" &&
      formData.name.trim() !== "" &&
      formData.company.trim() !== "" &&
      formData.siren.trim() !== "" &&
      formData.location.trim() !== "" &&
      formData.experience.trim() !== "" &&
      formData.compensation > 0 &&
      formData.description.trim() !== ""
    );
  }, [formData]);

  // Optimisation : Champs du formulaire avec useMemo
  const formFields = useMemo(() => [
    { type: "email", name: "email", placeholder: "Email" },
    { type: "password", name: "password", placeholder: "Mot de passe" },
    { type: "text", name: "name", placeholder: "Nom complet" },
    { type: "text", name: "company", placeholder: "Nom de l'entreprise" },
    { type: "text", name: "siren", placeholder: "SIREN" },
    { type: "text", name: "location", placeholder: "Localisation" },
    { type: "text", name: "experience", placeholder: "Années d'expérience" },
    { type: "number", name: "compensation", placeholder: "Taux de commission (%)" }
  ], []);

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {formFields.map((field) => (
        <FormInput
          key={field.name}
          type={field.type}
          name={field.name}
          placeholder={field.placeholder}
          value={formData[field.name as keyof RegistrationData] as string | number}
          onChange={handleInputChange}
          required
        />
      ))}
      
      <textarea
        name="description"
        placeholder="Description de votre expertise"
        value={formData.description}
        onChange={handleTextareaChange}
        className="w-full p-2 border rounded resize-none"
        rows={4}
        required
      />
      
      <Button 
        type="submit" 
        disabled={loading || !isFormValid}
        className="w-full"
      >
        {loading ? "Inscription en cours..." : "S'inscrire"}
      </Button>
    </form>
  );
} 