import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createClient } from '@supabase/supabase-js';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Alert, AlertDescription } from '../components/ui/alert';
import { Eye, EyeOff, Shield, Lock } from 'lucide-react';

// Configuration Supabase
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default function ConnectAdmin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Connexion avec Supabase Auth
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        setError('Identifiants incorrects');
        return;
      }

      if (data.user) {
        // Vérifier que l'utilisateur est bien un admin
        const { data: adminData, error: adminError } = await supabase
          .from('Admin')
          .select('*')
          .eq('id', data.user.id)
          .single();

        if (adminError || !adminData) {
          setError('Accès non autorisé - Compte administrateur requis');
          // Déconnexion si ce n'est pas un admin
          await supabase.auth.signOut();
          return;
        }

        // Mettre à jour les métadonnées utilisateur pour définir le type admin
        await supabase.auth.updateUser({
          data: {
            type: 'admin',
            name: adminData.name,
            role: 'admin'
          }
        });

        // Mettre à jour la dernière connexion
        await supabase
          .from('Admin')
          .update({ last_login: new Date().toISOString() })
          .eq('id', data.user.id);

        // Redirection vers le dashboard admin
        navigate('/dashboard/admin');
      }
    } catch (err) {
      setError('Erreur de connexion');
      console.error('Erreur login admin:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-red-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Bandeau français */}
        <div className="mb-8 text-center">
          <div className="flex justify-center space-x-2 mb-4">
            <div className="w-8 h-6 bg-blue-600 rounded"></div>
            <div className="w-8 h-6 bg-white border border-gray-300 rounded"></div>
            <div className="w-8 h-6 bg-red-600 rounded"></div>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Administration Profitum</h1>
          <p className="text-gray-600 mt-2">Espace de gestion sécurisé</p>
        </div>

        <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader className="text-center pb-4">
            <div className="mx-auto w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center mb-4">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <CardTitle className="text-xl font-semibold text-gray-900">
              Connexion Administrateur
            </CardTitle>
            <CardDescription className="text-gray-600">
              Accédez à votre espace de gestion
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium text-gray-700">
                  Adresse email
                </label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@profitum.fr"
                  required
                  className="w-full"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="password" className="text-sm font-medium text-gray-700">
                  Mot de passe
                </label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="w-full pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
              >
                {loading ? (
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Connexion...</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <Lock className="w-4 h-4" />
                    <span>Se connecter</span>
                  </div>
                )}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-xs text-gray-500">
                Accès réservé aux administrateurs autorisés
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500">
            © 2025 Profitum - Tous droits réservés
          </p>
        </div>
      </div>
    </div>
  );
} 