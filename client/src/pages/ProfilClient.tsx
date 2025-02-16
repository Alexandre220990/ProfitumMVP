import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { UserCircle, CreditCard, Users, Calendar, LogOut } from "lucide-react";
import axios from "axios";

export default function ClientProfile() {
  const [, setLocation] = useLocation();
  const [userData, setUserData] = useState(null);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await axios.get("/api/user/profile");
        setUserData(response.data);
      } catch (error) {
        console.error("Erreur lors du chargement du profil :", error);
      }
    };

    fetchUserData();
  }, []);

  if (!userData) {
    return <div className="flex justify-center items-center h-screen text-lg">Chargement...</div>;
  }

  return (
    <div className="container mx-auto py-10 px-6 max-w-3xl">
      <h1 className="text-3xl font-bold mb-6 text-center">Profil Client</h1>
      <Card className="shadow-lg rounded-lg p-6">
        <CardContent>
          <div className="flex items-center space-x-4 mb-6">
            <UserCircle size={64} className="text-gray-500" />
            <div>
              <h2 className="text-2xl font-semibold">{userData.name}</h2>
              <p className="text-gray-600">{userData.email}</p>
              <p className="text-gray-600">{userData.phone}</p>
            </div>
          </div>
          <hr className="my-4" />
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-gray-700 flex items-center"><CreditCard className="mr-2" /> Plan d’abonnement :</span>
              <span className="font-semibold">{userData.subscription}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-700 flex items-center"><Users className="mr-2" /> Contacts disponibles :</span>
              <span className="font-semibold">{userData.contacts}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-700 flex items-center"><Calendar className="mr-2" /> Expiration :</span>
              <span className="font-semibold">{userData.subscriptionEnd}</span>
            </div>
          </div>
        </CardContent>
      </Card>
      <div className="flex justify-between mt-6">
        <Button className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition"
          onClick={() => setLocation('/tarifs')}>
          Modifier mon abonnement
        </Button>
        <Button className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 transition flex items-center"
          onClick={() => setLocation('/logout')}>
          <LogOut className="mr-2" /> Déconnexion
        </Button>
      </div>
    </div>
  );
}
