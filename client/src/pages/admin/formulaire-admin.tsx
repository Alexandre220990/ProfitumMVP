import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/use-auth";
import { useNavigate, Navigate } from "react-router-dom";
import { ArrowLeft, UserPlus, Mail, Lock, Eye, EyeOff, Shield, AlertCircle, CheckCircle, Key } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";

interface AdminForm {
  email: string;
  name: string;
  password: string;
  temp_password?: string;
  role?: string;
}

const FormulaireAdmin = () => {
  const { user, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();

  // États du formulaire
  const [form, setForm] = useState<AdminForm>({
    email: '',
    name: '',
    password: '',
    temp_password: '',
    role: 'admin'
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [showPassword, setShowPassword] = useState(false);

  // Vérification d'authentification
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-red-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Vérification de l'authentification...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/connect-admin" replace />;
  }

  if (user.type !== 'admin') {
    return <Navigate to="/connect-admin" replace />;
  }

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!form.name.trim()) errors.name = 'Le nom est requis';
    if (!form.email.trim()) errors.email = 'L\'email est requis';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errors.email = 'Format d\'email invalide';
    if (!form.password || form.password.length < 8) {
      errors.password = 'Le mot de passe doit contenir au moins 8 caractères';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      setError('Veuillez corriger les erreurs dans le formulaire');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate('/connect-admin');
        return;
      }

      const response = await fetch('/api/admin/admins', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: form.email,
          name: form.name,
          password: form.password,
          role: form.role || 'admin'
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erreur lors de la création de l\'admin');
      }

      await response.json();
      
      setSuccess('Admin créé avec succès ! Le mot de passe provisoire a été enregistré.');
      toast.success('Admin créé avec succès', {
        description: `L'admin ${form.name} a été créé avec l'email ${form.email}`
      });
      
      // Réinitialiser le formulaire
      setForm({
        email: '',
        name: '',
        password: '',
        temp_password: '',
        role: 'admin'
      });
      setShowPassword(false);
      
      // Redirection après 3 secondes
      setTimeout(() => {
        navigate('/admin/dashboard-optimized');
      }, 3000);

    } catch (err: any) {
      setError(err.message || 'Erreur lors de la création de l\'admin');
      toast.error('Erreur lors de la création', {
        description: err.message
      });
      console.error('Erreur création admin: ', err);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof AdminForm, value: any) => {
    setForm(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Effacer l'erreur de validation pour ce champ
    if (validationErrors[field]) {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const generateRandomPassword = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789@#$%';
    let password = '';
    
    // Assurer au moins une majuscule, une minuscule, un chiffre, un caractère spécial
    password += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'[Math.floor(Math.random() * 26)];
    password += 'abcdefghijklmnopqrstuvwxyz'[Math.floor(Math.random() * 26)];
    password += '0123456789'[Math.floor(Math.random() * 10)];
    password += '@#$%'[Math.floor(Math.random() * 4)];
    
    // Compléter avec 8 caractères aléatoires pour avoir 12 caractères au total
    for (let i = 0; i < 8; i++) {
      password += chars[Math.floor(Math.random() * chars.length)];
    }
    
    // Mélanger les caractères
    return password.split('').sort(() => Math.random() - 0.5).join('');
  };

  const handleGenerateTempPassword = () => {
    const newPassword = generateRandomPassword();
    setForm(prev => ({
      ...prev,
      temp_password: newPassword,
      password: newPassword
    }));
    setShowPassword(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-red-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <div className="flex space-x-2">
                <div className="w-6 h-4 bg-blue-600 rounded"></div>
                <div className="w-6 h-4 bg-white border border-gray-300 rounded"></div>
                <div className="w-6 h-4 bg-red-600 rounded"></div>
              </div>
              <h1 className="text-2xl font-bold text-gray-900">
                Ajouter un Administrateur
              </h1>
            </div>
            <Button 
              variant="outline" 
              onClick={() => navigate('/admin/dashboard-optimized')}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Retour au dashboard
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto p-6">
        <Card className="max-w-3xl mx-auto bg-white shadow-lg">
          <CardHeader className="border-b bg-gray-50">
            <CardTitle className="text-xl font-semibold text-gray-900 flex items-center">
              <UserPlus className="w-6 h-6 mr-3 text-blue-600" />
              Nouvel administrateur
            </CardTitle>
            <p className="text-gray-600 mt-2">
              Créez un nouveau compte administrateur avec un mot de passe provisoire
            </p>
          </CardHeader>
          
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="w-4 h-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {success && (
                <Alert className="bg-green-50 border-green-200">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <AlertDescription className="text-green-800">{success}</AlertDescription>
                </Alert>
              )}

              {/* Informations de base */}
              <div className="space-y-6">
                <div className="flex items-center space-x-2">
                  <UserPlus className="w-5 h-5 text-blue-600" />
                  <h3 className="text-lg font-semibold text-gray-900">Informations administrateur</h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="flex items-center">
                      Nom complet *
                      {validationErrors.name && <span className="text-red-500 ml-1">*</span>}
                    </Label>
                    <Input
                      id="name"
                      value={form.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      required
                      placeholder="Nom de l'administrateur"
                      className={validationErrors.name ? 'border-red-500' : ''}
                    />
                    {validationErrors.name && (
                      <p className="text-red-500 text-sm">{validationErrors.name}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email" className="flex items-center">
                      <Mail className="w-4 h-4 mr-2" />
                      Email *
                      {validationErrors.email && <span className="text-red-500 ml-1">*</span>}
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      value={form.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      required
                      placeholder="admin@example.com"
                      className={validationErrors.email ? 'border-red-500' : ''}
                    />
                    {validationErrors.email && (
                      <p className="text-red-500 text-sm">{validationErrors.email}</p>
                    )}
                  </div>
                </div>

                {/* Mot de passe provisoire */}
                <div className="space-y-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold text-gray-900 flex items-center">
                      <Lock className="w-5 h-5 mr-2 text-blue-600" />
                      Mot de passe provisoire *
                    </h4>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={handleGenerateTempPassword}
                      className="bg-blue-100 hover:bg-blue-200 text-blue-700 border-blue-300"
                    >
                      <Key className="w-4 h-4 mr-2" />
                      Générer un mot de passe
                    </Button>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="password" className="flex items-center">
                      Mot de passe provisoire *
                      <Badge variant="secondary" className="ml-2 text-xs">
                        Minimum 8 caractères
                      </Badge>
                    </Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        value={form.password || ''}
                        onChange={(e) => handleInputChange('password', e.target.value)}
                        placeholder="Entrez ou générez un mot de passe provisoire"
                        className="pl-10 pr-10"
                        required
                        minLength={8}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-3 text-gray-400 hover:text-gray-600 transition-colors"
                      >
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                    <p className="text-sm text-gray-600">
                      Ce mot de passe provisoire sera utilisé pour la première connexion. 
                      L'administrateur devra le changer lors de sa première connexion.
                    </p>
                    {form.temp_password && form.password === form.temp_password && (
                      <Alert className="bg-green-50 border-green-200">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        <AlertDescription className="text-green-800">
                          <strong>Mot de passe généré :</strong> Assurez-vous de le noter et de le transmettre 
                          en toute sécurité au nouvel administrateur.
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>
                </div>

                {/* Rôle */}
                <div className="space-y-2">
                  <Label htmlFor="role" className="flex items-center">
                    <Shield className="w-4 h-4 mr-2" />
                    Rôle
                  </Label>
                  <Input
                    id="role"
                    value={form.role || 'admin'}
                    onChange={(e) => handleInputChange('role', e.target.value)}
                    placeholder="admin"
                    disabled
                    className="bg-gray-100"
                  />
                  <p className="text-sm text-gray-500">
                    Le rôle par défaut est "admin". Tous les administrateurs ont les mêmes droits d'accès.
                  </p>
                </div>
              </div>

              <Separator />

              {/* Informations importantes */}
              <Alert className="bg-yellow-50 border-yellow-200">
                <AlertCircle className="w-4 h-4 text-yellow-600" />
                <AlertDescription className="text-yellow-800">
                  <strong>Important :</strong> Le mot de passe provisoire sera crypté et stocké de manière sécurisée. 
                  Assurez-vous de le transmettre au nouvel administrateur par un canal sécurisé. 
                  Toutes les actions effectuées par cet administrateur seront tracées dans le système d'audit.
                </AlertDescription>
              </Alert>

              {/* Boutons */}
              <div className="flex justify-end space-x-4 pt-6 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate('/admin/dashboard-optimized')}
                  disabled={loading}
                >
                  Annuler
                </Button>
                <Button
                  type="submit"
                  disabled={loading || !form.password || form.password.length < 8}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {loading ? (
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Création en cours...</span>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-2">
                      <UserPlus className="w-4 h-4" />
                      <span>Créer l'administrateur</span>
                    </div>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default FormulaireAdmin;

