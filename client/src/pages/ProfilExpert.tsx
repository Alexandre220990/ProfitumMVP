import { useState, useEffect } from "react";
import { useLocation, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UserCircle, CreditCard, Users, Calendar, LogOut, MapPin, Building2, Star, Briefcase } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { get } from "@/lib/api";
import { Expert } from "@/types/expert";
import HeaderPartner from "@/components/HeaderPartner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function ExpertProfile() {
  const location = useLocation();
  const [expertData, setExpertData] = useState<Expert | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const fetchExpertData = async () => {
      try {
        const response = await get<Expert>("/api/expert/profile");
        setExpertData(response);
      } catch (error) {
        console.error("Erreur lors du chargement du profil :", error);
        toast({
          variant: "destructive",
          title: "Erreur",
          description: "Impossible de charger les données du profil"
        });
      }
    };

    fetchExpertData();
  }, [toast]);

  if (!expertData) {
    return <div className="flex justify-center items-center h-screen text-lg">Chargement...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <HeaderPartner />
      <div className="container mx-auto py-10 px-6 max-w-3xl">
        <h1 className="text-3xl font-bold mb-6 text-center">Profil Expert</h1>
        <Card className="shadow-lg rounded-lg p-6">
          <CardContent>
            <div className="flex items-center space-x-4 mb-6">
              <UserCircle size={64} className="text-gray-500" />
              <div>
                <h2 className="text-2xl font-semibold">{expertData.name}</h2>
                <p className="text-gray-600">{expertData.email}</p>
                <p className="text-gray-600">{expertData.company}</p>
              </div>
            </div>
            <hr className="my-4" />
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-700 flex items-center">
                  <Building2 className="mr-2" /> SIREN :
                </span>
                <span className="font-semibold">{expertData.siren}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-700 flex items-center">
                  <MapPin className="mr-2" /> Localisation :
                </span>
                <span className="font-semibold">{expertData.location}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-700 flex items-center">
                  <Star className="mr-2" /> Note moyenne :
                </span>
                <span className="font-semibold">{expertData.rating}/5</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-700 flex items-center">
                  <Briefcase className="mr-2" /> Expérience :
                </span>
                <span className="font-semibold">{expertData.experience}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-700 flex items-center">
                  <CreditCard className="mr-2" /> Commission :
                </span>
                <span className="font-semibold">{expertData.compensation}%</span>
              </div>
              <div>
                <span className="text-gray-700 flex items-center mb-2">
                  <Users className="mr-2" /> Spécialisations :
                </span>
                <div className="flex flex-wrap gap-2">
                  {expertData.specializations.map((spec, index) => (
                    <span
                      key={index}
                      className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm"
                    >
                      {spec}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        <div className="flex justify-between mt-6">
          <Button
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition"
            onClick={() => location.push('/edit-profile')}
          >
            Modifier mon profil
          </Button>
          <Button
            className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 transition flex items-center"
            onClick={() => location.push('/logout')}
          >
            <LogOut className="mr-2" /> Déconnexion
          </Button>
        </div>
      </div>
    </div>
  );
} 