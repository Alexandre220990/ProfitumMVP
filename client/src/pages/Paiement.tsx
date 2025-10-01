import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Loader2, CreditCard, Lock, Building2, Briefcase, User, Mail, Key, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import { post, get } from "@/lib/api";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";

interface ApiResponse<T> { 
  success: boolean;
  data?: T;
  message?: string;
}

interface Specialization { 
  id: number;
  name: string; 
}

interface PaymentFormData { 
  cardNumber: string;
  expiryDate: string;
  cvc: string;
  name: string;
  email: string;
  company: string;
  siren: string;
  specialization: string[];
  experience: string;
  password: string;
  confirmPassword: string;
  acceptTerms: boolean; 
}

interface FormErrors { 
  [key: string]: string; 
}

const Paiement = () => { 
  const navigate = useNavigate();
  const [selectedPlan, setSelectedPlan] = useState<any>(null);
  const [errors, setErrors] = useState<FormErrors>({});
  const [isProcessing, setIsProcessing] = useState(false);
  const [specializations, setSpecializations] = useState<Specialization[]>([]);
  const [formData, setFormData] = useState<PaymentFormData>({ 
    cardNumber: "", 
    expiryDate: "", 
    cvc: "", 
    name: "", 
    email: "", 
    company: "", 
    siren: "", 
    specialization: [], 
    experience: "", 
    password: "", 
    confirmPassword: "", 
    acceptTerms: false 
  });

  useEffect(() => { 
    const planData = localStorage.getItem("selectedPlan");
    if (planData) {
      setSelectedPlan(JSON.parse(planData)); 
    } else { 
      navigate("/tarifs"); 
    }

    // Charger les spécialisations depuis l'API
    const fetchSpecializations = async () => { 
      try {
        console.log("Début de la récupération des spécialisations");
        const response = await get<ApiResponse<Specialization[]>>('/api/specializations');
        console.log("Réponse reçue: ", response);
        if (response.success && response.data?.data) {
          console.log("Spécialisations trouvées: ", response.data.data);
          setSpecializations(response.data.data); 
        } else { 
          console.error("Erreur dans la réponse: ", response);
          // Fallback vers les spécialisations statiques
          setSpecializations([
            { id: 1, name: "TICPE" },
            { id: 2, name: "URSSAF" },
            { id: 3, name: "DFS" },
            { id: 4, name: "Foncier" },
            { id: 5, name: "MSA" },
            { id: 6, name: "Audit Énergétique" }
          ]);
        }
      } catch (error) { 
        console.error("Erreur lors du chargement des spécialisations: ", error);
        // Fallback vers les spécialisations statiques
        setSpecializations([
          { id: 1, name: "TICPE" },
          { id: 2, name: "URSSAF" },
          { id: 3, name: "DFS" },
          { id: 4, name: "Foncier" },
          { id: 5, name: "MSA" },
          { id: 6, name: "Audit Énergétique" }
        ]);
      }
    };

    fetchSpecializations();
  }, [navigate]);

  const validateForm = (): boolean => { 
    const newErrors: FormErrors = {};

    if (!formData.name.trim()) { 
      newErrors.name = "Le nom est requis"; 
    }

    if (!formData.email.trim()) { 
      newErrors.email = "L'email est requis"; 
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) { 
      newErrors.email = "L'email n'est pas valide"; 
    }

    if (!formData.company.trim()) { 
      newErrors.company = "Le nom de l'entreprise est requis"; 
    }

    if (!formData.siren.trim()) { 
      newErrors.siren = "Le SIREN est requis"; 
    } else if (!/^\d{9}$/.test(formData.siren)) { 
      newErrors.siren = "Le SIREN doit contenir 9 chiffres"; 
    }

    if (!formData.specialization.length) { 
      newErrors.specialization = "Au moins une spécialisation est requise"; 
    }

    if (!formData.experience.trim()) { 
      newErrors.experience = "L'expérience est requise"; 
    }

    if (!formData.password.trim()) { 
      newErrors.password = "Le mot de passe est requis"; 
    } else if (formData.password.length < 8) { 
      newErrors.password = "Le mot de passe doit contenir au moins 8 caractères"; 
    }

    if (!formData.confirmPassword.trim()) { 
      newErrors.confirmPassword = "La confirmation du mot de passe est requise"; 
    } else if (formData.confirmPassword !== formData.password) { 
      newErrors.confirmPassword = "Les mots de passe ne correspondent pas"; 
    }

    if (!formData.cardNumber.trim()) { 
      newErrors.cardNumber = "Le numéro de carte est requis"; 
    } else if (!/^\d{16}$/.test(formData.cardNumber.replace(/\s/g, ''))) { 
      newErrors.cardNumber = "Le numéro de carte doit contenir 16 chiffres"; 
    }

    if (!formData.expiryDate.trim()) { 
      newErrors.expiryDate = "La date d'expiration est requise"; 
    } else if (!/^(0[1-9]|1[0-2])\/([0-9]{2})$/.test(formData.expiryDate)) { 
      newErrors.expiryDate = "Format invalide (MM/AA)"; 
    }

    if (!formData.cvc.trim()) { 
      newErrors.cvc = "Le CVC est requis"; 
    } else if (!/^\d{3}$/.test(formData.cvc)) { 
      newErrors.cvc = "Le CVC doit contenir 3 chiffres"; 
    }

    if (!formData.acceptTerms) { 
      newErrors.acceptTerms = "Vous devez accepter les conditions d'utilisation"; 
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => { 
    const { name, value } = e.target;
    setFormData((prev: PaymentFormData) => ({ ...prev, [name]: value }));
    if (errors[name]) { 
      setErrors((prev: FormErrors) => ({ ...prev, [name]: "" }));
    }
  };

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => { 
    const { name, value } = e.target;
    setFormData((prev: PaymentFormData) => ({ ...prev, [name]: value }));
    if (errors[name]) { 
      setErrors((prev: FormErrors) => ({ ...prev, [name]: "" }));
    }
  };

  const handleSpecializationChange = (value: string) => { 
    setFormData((prev: PaymentFormData) => {
      const newSpecializations = prev.specialization.includes(value)
        ? prev.specialization.filter((s: string) => s !== value)
        : [...prev.specialization, value];
      return { ...prev, specialization: newSpecializations };
    });
    if (errors.specialization) { 
      setErrors((prev: FormErrors) => ({ ...prev, specialization: "" }));
    }
  };

  const handleTermsChange = (checked: boolean) => { 
    setFormData(prev => ({ ...prev, acceptTerms: checked }));
    if (errors.acceptTerms) { 
      setErrors(prev => ({ ...prev, acceptTerms: "" }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => { 
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error("Veuillez corriger les erreurs dans le formulaire");
      return;
    }
    
    setIsProcessing(true);
    try { 
      console.log('📝 Début de l\'inscription expert...');
      
      // Appel API pour créer l'expert
      const response = await post<any>('/api/experts/register', {
        name: formData.name, 
        email: formData.email, 
        password: formData.password, 
        company: formData.company, 
        siren: formData.siren, 
        specializations: formData.specialization, 
        experience: formData.experience, 
        location: "France", 
        description: `Expert spécialisé en ${formData.specialization.join(', ')}`,
        card_number: formData.cardNumber,
        card_expiry: formData.expiryDate,
        card_cvc: formData.cvc,
        abonnement: selectedPlan?.name || 'basic'
      });

      if (response.success) { 
        console.log('✅ Expert inscrit avec succès');
        
        // Stocker les informations de l'expert
        localStorage.setItem("userInfo", JSON.stringify({
          ...response.data, type: 'expert' 
        }));
        
        toast.success("Inscription réussie ! Votre compte expert a été créé avec succès");
        
        // Rediriger vers la page de confirmation
        navigate("/confirmation");
      } else { 
        throw new Error(response.message || "Erreur lors de l'inscription"); 
      }
    } catch (error) { 
      console.error('❌ Erreur lors de l\'inscription: ', error);
      toast.error(error instanceof Error ? error.message : "Une erreur est survenue lors du traitement");
    } finally { 
      setIsProcessing(false); 
    }
  };

  if (!selectedPlan) { 
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-6">
            <h2 className="text-xl font-semibold text-center mb-4">
              Aucun plan sélectionné
            </h2>
            <Button 
              className="w-full" 
              onClick={() => navigate("/tarifs") }
            >
              Retour à la sélection des plans
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6 text-center">Finaliser votre inscription</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        { /* Résumé du plan */ }
        <div className="md:col-span-1">
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Résumé de votre abonnement</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold">{ selectedPlan.name }</h3>
                  <p className="text-2xl font-bold">{ selectedPlan.price } € / mois</p>
                </div>
                <div className="border-t pt-4">
                  <h4 className="font-medium mb-2">Inclus dans votre abonnement :</h4>
                  <ul className="space-y-2">
                    { selectedPlan.features.map((feature: any, index: number) => (
                      <li key={index } className="flex items-start">
                        <CheckCircle className="h-5 w-5 text-green-500 mr-2 mt-0.5" />
                        <span>{ feature.text }</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        { /* Formulaire d'inscription */ }
        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Informations personnelles</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={ handleSubmit } className="space-y-6">
                { /* Informations personnelles */ }
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Nom complet</Label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input 
                          id="name" 
                          name="name"
                          placeholder="Votre nom" 
                          className="pl-10"
                          value={ formData.name }
                          onChange={ handleInputChange }
                        />
                      </div>
                      { errors.name && <p className="text-sm text-red-500">{errors.name }</p>}
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input 
                          id="email" 
                          name="email"
                          type="email" 
                          placeholder="votre@email.com" 
                          className="pl-10"
                          value={ formData.email }
                          onChange={ handleInputChange }
                        />
                      </div>
                      { errors.email && <p className="text-sm text-red-500">{errors.email }</p>}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="company">Nom de l'entreprise</Label>
                      <div className="relative">
                        <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input 
                          id="company" 
                          name="company"
                          placeholder="Votre entreprise" 
                          className="pl-10"
                          value={ formData.company }
                          onChange={ handleInputChange }
                        />
                      </div>
                      { errors.company && <p className="text-sm text-red-500">{errors.company }</p>}
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="siren">Numéro SIREN</Label>
                      <div className="relative">
                        <Briefcase className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input 
                          id="siren" 
                          name="siren"
                          placeholder="123456789" 
                          className="pl-10"
                          value={ formData.siren }
                          onChange={ handleInputChange }
                        />
                      </div>
                      { errors.siren && <p className="text-sm text-red-500">{errors.siren }</p>}
                    </div>
                  </div>
                </div>
                
                { /* Spécialisations */ }
                <div className="space-y-2">
                  <Label>Spécialisations *</Label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3 p-4 border rounded-lg bg-gray-50">
                    { specializations.length > 0 ? (
                      specializations.map((spec) => (
                        <div key={spec.id } className="flex items-center space-x-2">
                          <Checkbox 
                            id={ `spec-${spec.id }`}
                            checked={ formData.specialization.includes(spec.name) }
                            onCheckedChange={ () => handleSpecializationChange(spec.name) }
                          />
                          <Label 
                            htmlFor={ `spec-${spec.id }`} 
                            className="text-sm cursor-pointer hover:text-blue-600 transition-colors"
                          >
                            { spec.name }
                          </Label>
                        </div>
                      ))
                    ) : (
                      <div className="col-span-full text-center text-gray-500 py-4">
                        Chargement des spécialisations...
                      </div>
                    )}
                  </div>
                  { errors.specialization && <p className="text-sm text-red-500">{errors.specialization }</p>}
                  <p className="text-xs text-gray-500">
                    Sélectionnez au moins une spécialisation pour définir votre domaine d'expertise
                  </p>
                </div>
                
                { /* Expérience */ }
                <div className="space-y-2">
                  <Label htmlFor="experience">Expérience professionnelle *</Label>
                  <select
                    id="experience"
                    name="experience"
                    className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={ formData.experience }
                    onChange={ handleSelectChange }
                  >
                    <option value="">Sélectionnez votre expérience</option>
                    <option value="Moins de 5 ans">Moins de 5 ans</option>
                    <option value="Entre 5 et 10 ans">Entre 5 et 10 ans</option>
                    <option value="Entre 10 et 20 ans">Entre 10 et 20 ans</option>
                    <option value="Plus de 20 ans">Plus de 20 ans</option>
                  </select>
                  { errors.experience && <p className="text-sm text-red-500">{errors.experience }</p>}
                  <p className="text-xs text-gray-500">
                    Indiquez votre niveau d'expérience dans votre domaine d'expertise
                  </p>
                </div>
                
                { /* Mot de passe */ }
                <div className="space-y-2">
                  <Label htmlFor="password">Mot de passe</Label>
                  <div className="relative">
                    <Key className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input 
                      id="password" 
                      name="password"
                      type="password" 
                      placeholder="Votre mot de passe" 
                      className="pl-10"
                      value={ formData.password }
                      onChange={ handleInputChange }
                    />
                  </div>
                  { errors.password && <p className="text-sm text-red-500">{errors.password }</p>}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirmer le mot de passe</Label>
                  <div className="relative">
                    <Key className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input 
                      id="confirmPassword" 
                      name="confirmPassword"
                      type="password" 
                      placeholder="Confirmez votre mot de passe" 
                      className="pl-10"
                      value={ formData.confirmPassword }
                      onChange={ handleInputChange }
                    />
                  </div>
                  { errors.confirmPassword && <p className="text-sm text-red-500">{errors.confirmPassword }</p>}
                </div>
                
                { /* Informations de paiement */ }
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg">Informations de paiement</h3>
                  
                  <div className="space-y-2">
                    <Label htmlFor="cardNumber">Numéro de carte</Label>
                    <div className="relative">
                      <CreditCard className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input 
                        id="cardNumber" 
                        name="cardNumber"
                        placeholder="1234 5678 9012 3456" 
                        className="pl-10"
                        value={ formData.cardNumber }
                        onChange={ handleInputChange }
                      />
                    </div>
                    { errors.cardNumber && <p className="text-sm text-red-500">{errors.cardNumber }</p>}
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="expiryDate">Date d'expiration</Label>
                      <Input 
                        id="expiryDate" 
                        name="expiryDate"
                        placeholder="MM/AA" 
                        value={ formData.expiryDate }
                        onChange={ handleInputChange }
                      />
                      { errors.expiryDate && <p className="text-sm text-red-500">{errors.expiryDate }</p>}
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="cvc">CVC</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input 
                          id="cvc" 
                          name="cvc"
                          placeholder="123" 
                          className="pl-10"
                          value={ formData.cvc }
                          onChange={ handleInputChange }
                        />
                      </div>
                      { errors.cvc && <p className="text-sm text-red-500">{errors.cvc }</p>}
                    </div>
                  </div>
                </div>
                
                { /* Conditions d'utilisation */ }
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="terms"
                      checked={ formData.acceptTerms }
                      onCheckedChange={ handleTermsChange }
                    />
                    <Label htmlFor="terms" className="text-sm">
                      J'accepte les <Link to="/conditions-utilisation" className="text-blue-600 hover:underline">conditions d'utilisation</Link>
                    </Label>
                  </div>
                  { errors.acceptTerms && <p className="text-sm text-red-500">{errors.acceptTerms }</p>}
                </div>
                
                { /* Bouton de soumission */ }
                <Button 
                  type="submit" 
                  className="w-full"
                  disabled={ isProcessing }
                >
                  { isProcessing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Traitement en cours...
                    </>
                  ) : (
                    <>
                      <CreditCard className="mr-2 h-4 w-4" />
                      Payer {selectedPlan.price } €
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Paiement;
