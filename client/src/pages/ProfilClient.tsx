import { useState, useEffect } from "react";
import { useLocation, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { get } from "@/lib/api";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Client {
  id: number;
  name: string;
  email: string;
  company?: string;
  phone?: string;
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

const ProfilClient = () => {
  const location = useLocation();

  return (
    <div className="container mx-auto p-4">
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Profil Client</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="informations">
            <TabsList>
              <TabsTrigger value="informations">Informations</TabsTrigger>
              <TabsTrigger value="documents">Documents</TabsTrigger>
              <TabsTrigger value="historique">Historique</TabsTrigger>
            </TabsList>
            <TabsContent value="informations">
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="nom">Nom</Label>
                  <Input id="nom" placeholder="Votre nom" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" placeholder="Votre email" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="telephone">Téléphone</Label>
                  <Input id="telephone" placeholder="Votre téléphone" />
                </div>
                <Button>Enregistrer</Button>
              </div>
            </TabsContent>
            <TabsContent value="documents">
              <div className="space-y-4">
                <p>Aucun document disponible</p>
              </div>
            </TabsContent>
            <TabsContent value="historique">
              <div className="space-y-4">
                <p>Aucun historique disponible</p>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <div className="flex justify-between items-center">
        <Button variant="outline" asChild>
          <Link to="/dashboard/client">Retour au tableau de bord</Link>
        </Button>
      </div>
    </div>
  );
};

export default ProfilClient;
