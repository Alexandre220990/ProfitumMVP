import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Star, MapPin, Building2, Phone, Mail, Euro } from "lucide-react";
import { get } from "@/lib/api";
import { toast } from "sonner";
import type { Expert } from "@/types/expert";
import type { ApiResponse } from "@/types/api";

const ExpertProfile = () => { 
  const { id } = useParams();
  const navigate = useNavigate();
  const [expert, setExpert] = useState<Expert | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { 
    const fetchExpert = async () => {
      if (!id) return;
      
      try {
        const response: ApiResponse<Expert> = await get<Expert>(`/api/experts/${id}`);
        
        if (!response.success || !response.data) { 
          throw new Error("Expert non trouvé"); 
        }
        
        setExpert(response.data);
      } catch (error) { 
        toast.error("Impossible de charger les informations de l'expert");
        navigate("/marketplace-experts");
      } finally { 
        setLoading(false); 
      }
    };

    fetchExpert();
  }, [id, navigate, toast]);

  if (loading) { 
    return (
      <div>
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-1/4"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    ); 
  }

  if (!expert) { 
    return null; 
  }

  return (
    <div>
      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-4xl mx-auto">
          <CardHeader className="relative">
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-3xl font-bold">{expert.name}</CardTitle>
                <p className="text-gray-500 mt-2 flex items-center">
                  <Building2 className="w-4 h-4 mr-2" />
                  {expert.company_name || 'Entreprise non spécifiée'}
                </p>
              </div>
              <div className="text-right">
                <div className="flex items-center space-x-1 mb-2">
                  <Star className="w-5 h-5 text-yellow-400 fill-current" />
                  <span className="font-bold text-lg">{expert.rating?.toFixed(1) || 'N/A'}</span>
                  <span className="text-gray-500">/5</span>
                </div>
                <Badge variant="outline" className="ml-2">
                  {expert.status === 'active' ? 'Actif' : 'Inactif'}
                </Badge>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Informations principales */}
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h3 className="font-semibold text-lg">Informations</h3>
                <div className="space-y-2">
                  <p className="flex items-center text-gray-600">
                    <MapPin className="w-4 h-4 mr-2" />
                    {expert.location || 'Localisation non spécifiée'}
                  </p>
                  <p className="flex items-center text-gray-600">
                    <Mail className="w-4 h-4 mr-2" />
                    {expert.email}
                  </p>
                  {expert.phone_number && (
                    <p className="flex items-center text-gray-600">
                      <Phone className="w-4 h-4 mr-2" />
                      {expert.phone_number}
                    </p>
                  )}
                  <p className="flex items-center text-gray-600">
                    <Euro className="w-4 h-4 mr-2" />
                    Clients : {expert.clients || 0}
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="font-semibold text-lg">Spécialisations</h3>
                <div className="flex flex-wrap gap-2">
                  {expert.specializations?.map((spec) => (
                    <Badge key={spec} variant="secondary">
                      {spec}
                    </Badge>
                  )) || <p className="text-gray-500">Aucune spécialisation spécifiée</p>}
                </div>
              </div>
            </div>

            <Separator />

            {/* Description */}
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">À propos</h3>
              <p className="text-gray-600 whitespace-pre-wrap">{expert.description || 'Aucune description disponible'}</p>
            </div>

            <Separator />

            {/* Informations entreprise */}
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Informations entreprise</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">SIREN</p>
                  <p className="font-medium">{expert.siren || 'Non spécifié'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Statut</p>
                  <Badge variant={expert.status === 'active' ? 'secondary' : 'outline'}>
                    {expert.status === 'active' ? 'Actif' : 'Inactif'}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Bouton de contact */}
            <div className="pt-4">
              <Button className="w-full md:w-auto" size="lg">
                Contacter l'expert
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ExpertProfile; 