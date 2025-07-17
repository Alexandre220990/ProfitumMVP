import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { MapPin, Building, Clock, MessageSquare, Award, Star, CheckCircle, Users, Calendar } from "lucide-react";

interface Expert {
  id: string;
  name: string;
  email: string;
  company_name: string;
  specializations: string[];
  rating: number;
  compensation: number;
  location: string;
  description: string;
  experience: string;
  status: string;
  disponibilites?: any;
  certifications?: any;
  photo_url?: string;
  dossiers_traites?: number;
  delai_reponse_moyen?: string;
  delai_traitement_moyen?: string;
}

interface ExpertDetailModalProps {
  expert: Expert | null;
  isOpen: boolean;
  onClose: () => void;
  onSelect: (expertId: string) => void;
  onContact: (expert: Expert) => void;
  isLoading?: boolean;
}

export default function ExpertDetailModal({ expert, isOpen, onClose, onSelect, onContact, isLoading = false }: ExpertDetailModalProps) {
  const [isSelecting, setIsSelecting] = useState(false);

  const handleSelect = async () => {
    if (!expert) return;
    
    setIsSelecting(true);
    try {
      await onSelect(expert.id);
    } finally {
      setIsSelecting(false);
    }
  };

  if (!expert) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center text-2xl font-bold">
            <Users className="w-6 h-6 mr-3 text-blue-600" />
            {expert.name}
          </DialogTitle>
          <DialogDescription className="text-lg">
            {expert.company_name} • {expert.location}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* En-tête avec photo et informations principales */}
          <div className="flex items-start gap-6">
            <div className="flex-shrink-0">
              <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                {expert.photo_url ? (
                  <img 
                    src={expert.photo_url} 
                    alt={expert.name}
                    className="w-24 h-24 rounded-full object-cover"
                  />
                ) : (
                  expert.name.split(' ').map(n => n[0]).join('').toUpperCase()
                )}
              </div>
            </div>
            
            <div className="flex-1 space-y-3">
              <div className="flex items-center gap-4">
                <div className="flex items-center text-yellow-500">
                  <Star className="w-5 h-5 fill-current" />
                  <span className="ml-1 font-semibold">{expert.rating}</span>
                  <span className="text-gray-600 ml-1">({expert.dossiers_traites || 0} dossiers)</span>
                </div>
                <Badge variant="secondary" className="bg-green-100 text-green-800">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Expert vérifié
                </Badge>
              </div>
              
              <div className="flex items-center gap-4 text-sm text-gray-600">
                <div className="flex items-center">
                  <MapPin className="w-4 h-4 mr-1" />
                  {expert.location}
                </div>
                <div className="flex items-center">
                  <Building className="w-4 h-4 mr-1" />
                  Commission: {expert.compensation}%
                </div>
                <div className="flex items-center">
                  <Clock className="w-4 h-4 mr-1" />
                  {expert.experience} d'expérience
                </div>
              </div>
            </div>
          </div>

          {/* Description */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">À propos de l'expert</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 leading-relaxed">
                {expert.description || `${expert.name} est un expert spécialisé dans ${expert.specializations.join(', ')} avec ${expert.experience} d'expérience.`}
              </p>
            </CardContent>
          </Card>

          {/* Spécialisations */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center">
                <Award className="w-5 h-5 mr-2" />
                Spécialisations
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {expert.specializations.map((spec) => (
                  <Badge key={spec} variant="secondary" className="bg-blue-50 text-blue-700">
                    {spec}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Statistiques et performances */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-blue-600">{expert.dossiers_traites || 0}</div>
                <div className="text-sm text-gray-600">Dossiers traités</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-green-600">{expert.delai_reponse_moyen || '24h'}</div>
                <div className="text-sm text-gray-600">Délai de réponse</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-purple-600">{expert.delai_traitement_moyen || '7 jours'}</div>
                <div className="text-sm text-gray-600">Traitement moyen</div>
              </CardContent>
            </Card>
          </div>

          {/* Certifications */}
          {expert.certifications && expert.certifications.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center">
                  <Award className="w-5 h-5 mr-2" />
                  Certifications et diplômes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {expert.certifications.map((cert: any, index: number) => (
                    <div key={index} className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span className="text-sm">{cert.nom || cert}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Disponibilités */}
          {expert.disponibilites && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center">
                  <Calendar className="w-5 h-5 mr-2" />
                  Disponibilités
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-gray-700">
                  {expert.disponibilites.description || 'Disponible en semaine de 9h à 18h'}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <DialogFooter className="flex gap-3">
          <Button variant="outline" onClick={onClose}>
            Fermer
          </Button>
          
          <Button 
            variant="outline" 
            onClick={() => onContact(expert)}
            className="flex items-center"
          >
            <MessageSquare className="w-4 h-4 mr-2" />
            Contacter
          </Button>
          
          <Button 
            onClick={handleSelect}
            disabled={isSelecting || isLoading}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 flex items-center"
          >
            {isSelecting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                Sélection en cours...
              </>
            ) : (
              <>
                <CheckCircle className="w-4 h-4 mr-2" />
                Sélectionner cet expert
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 