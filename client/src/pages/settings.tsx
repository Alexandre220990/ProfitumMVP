// import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/hooks/use-auth";
import { useNavigate } from "react-router-dom";

const Settings = () => { const { user } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = React.useState(true);
  const [email, setEmail] = React.useState(user?.email || '');

  // Rediriger si l'utilisateur n'est pas connecté
  React.useEffect(() => { if (!user) {
      navigate('/auth'); }
  }, [user, navigate]);

  const handleSave = () => { // TODO: Implémenter la sauvegarde des paramètres
    console.log('Sauvegarde des paramètres...'); };

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Paramètres</h1>
      
      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Profil</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={ email }
                onChange={ (e) => setEmail(e.target.value) }
              />
            </div>
            <Button onClick={ handleSave }>Sauvegarder les modifications</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Notifications</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="notifications">Activer les notifications</Label>
              <Switch
                id="notifications"
                checked={ notifications }
                onCheckedChange={ setNotifications }
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Sécurité</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button variant="outline" className="w-full">
              Changer le mot de passe
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Settings; 