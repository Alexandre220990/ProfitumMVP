import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { 
  Search, 
  MapPin, 
  Star, 
  Users, 
  Building, 
  Coins, 
  MessageSquare, 
  Award, 
  Clock, 
  TrendingUp,
  Sparkles,
  Handshake
} from "lucide-react";
import HeaderClient from "@/components/HeaderClient";
import { get, post } from "@/lib/api";


// Types
interface ClientProduitEligible {
  id: string;
  clientId: string;
  produitId: string;
  statut: string;
  tauxFinal?: number;
  montantFinal?: number;
  dureeFinale?: number;
  created_at: string;
  updated_at: string;
  simulationId?: number;
  ProduitEligible: {
    id: string;
    nom: string;
    description: string;
    category: string;
  };

  expert_id?: string;
}

interface Expert {
  id: string;
  name: string;
  company_name: string;
  specializations: string[];
  experience: string;
  location: string;
  rating: number;
  description: string;
  compensation?: number;
  status: string;
  disponibilites?: any;
  certifications?: any;
  created_at: string;
  clients?: number;
  audits?: number;
}

interface ExpertMatch {
  expert: Expert;
  matchScore: number;
  matchingSpecializations: string[];
  potentialGain: number;
}

export default function MarketplaceExperts() {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  // États
  const [activeTab, setActiveTab] = useState("pour-vous");
  const [clientProduitsEligibles, setClientProduitsEligibles] = useState<ClientProduitEligible[]>([]);
  const [allExperts, setAllExperts] = useState<Expert[]>([]);
  const [expertMatches, setExpertMatches] = useState<ExpertMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<string>("all");
  const [sortBy, setSortBy] = useState("match-score");

  // États pour les modales
  const [showExpertSelectionModal, setShowExpertSelectionModal] = useState(false);
  const [selectedClientProduit, setSelectedClientProduit] = useState<ClientProduitEligible | null>(null);
  const [selectedExpert, setSelectedExpert] = useState<Expert | null>(null);
  const [isAssigningExpert, setIsAssigningExpert] = useState(false);



  // Charger les données
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // Charger les produits éligibles du client
      const produitsResponse = await get<ClientProduitEligible[]>("/api/client/produits-eligibles");
      if (produitsResponse.success && produitsResponse.data) {
        setClientProduitsEligibles(produitsResponse.data);
      }

      // Charger tous les experts
      const expertsResponse = await get<Expert[]>("/api/experts");
      if (expertsResponse.success && expertsResponse.data) {
        setAllExperts(expertsResponse.data);
        
        // Calculer les correspondances pour les experts
        const matches = calculateExpertMatches(produitsResponse.data || [], expertsResponse.data);
        setExpertMatches(matches);
      }
    } catch (error) {
      console.error("Erreur lors du chargement:", error);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible de charger les données de la marketplace"
      });
    } finally {
      setLoading(false);
    }
  };

  // Calculer les correspondances entre produits éligibles et experts
  const calculateExpertMatches = (produits: ClientProduitEligible[], experts: Expert[]): ExpertMatch[] => {
    return experts.map(expert => {
      let matchScore = 0;
      const matchingSpecializations: string[] = [];
      let potentialGain = 0;

      // Pour chaque produit éligible du client
      produits.forEach(produit => {
        // Vérifier si l'expert a des spécialisations correspondantes
        const matchingSpecs = expert.specializations?.filter(spec => 
          spec.toLowerCase().includes(produit.ProduitEligible.nom.toLowerCase()) ||
          produit.ProduitEligible.nom.toLowerCase().includes(spec.toLowerCase())
        ) || [];

        if (matchingSpecs.length > 0) {
          matchScore += 50; // Score de base pour correspondance
          matchingSpecializations.push(...matchingSpecs);
          
          // Calculer le gain potentiel basé sur le montant final
          potentialGain += (produit.montantFinal || 0) * (expert.compensation || 0.15) / 100;
        }
      });

      // Bonus pour la note et l'expérience
      if (expert.rating) matchScore += expert.rating * 10;
      if (expert.experience) matchScore += parseInt(expert.experience) * 2;

      return {
        expert,
        matchScore: Math.min(matchScore, 100),
        matchingSpecializations: [...new Set(matchingSpecializations)],
        potentialGain
      };
    }).sort((a, b) => b.matchScore - a.matchScore);
  };

  // Filtrer les experts selon les critères
  const getFilteredExperts = () => {
    let experts = activeTab === "pour-vous" ? 
      // Pour l'onglet "pour-vous", ne garder que les experts avec des spécialisations correspondantes
      expertMatches.filter(match => match.matchingSpecializations.length > 0) :
      // Pour l'onglet "tous", garder tous les experts
      allExperts.map(expert => ({
        expert,
        matchScore: 0,
        matchingSpecializations: [],
        potentialGain: 0
      }));

    // Filtre par recherche
    if (searchQuery) {
      experts = experts.filter(match => 
        match.expert.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        match.expert.company_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        match.expert.specializations.some(spec => 
          spec.toLowerCase().includes(searchQuery.toLowerCase())
        )
      );
    }

    // Filtre par produit sélectionné
    if (selectedProduct && selectedProduct !== "all" && activeTab === "pour-vous") {
      experts = experts.filter(match => 
        match.matchingSpecializations.some(spec => 
          spec.toLowerCase().includes(selectedProduct.toLowerCase())
        )
      );
    }

    // Tri
    experts.sort((a, b) => {
      switch (sortBy) {
        case "match-score":
          return b.matchScore - a.matchScore;
        case "rating":
          return (b.expert.rating || 0) - (a.expert.rating || 0);
        case "compensation":
          return (a.expert.compensation || 0) - (b.expert.compensation || 0);
        case "experience":
          return parseInt(b.expert.experience || "0") - parseInt(a.expert.experience || "0");
        default:
          return 0;
      }
    });

    return experts;
  };

  // Contacter un expert
  const contactExpert = async (expertId: string) => {
    try {
      const response = await post(`/api/experts/marketplace/${expertId}/contact`, {
        message: "Je souhaite vous contacter pour une prestation.",
        clientId: user?.id
      });

      if (response.success) {
        toast({
          title: "Demande envoyée",
          description: "L'expert a été notifié de votre demande"
        });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible d'envoyer la demande"
      });
    }
  };

  // Obtenir les produits uniques pour le filtre
  const getUniqueProducts = () => {
    const products = clientProduitsEligibles.map(p => p.ProduitEligible.nom);
    return [...new Set(products)];
  };



  // Ouvrir la modale de sélection d'expert
  const openExpertSelectionModal = (clientProduit: ClientProduitEligible) => {
    setSelectedClientProduit(clientProduit);
    setSelectedExpert(null);
    setShowExpertSelectionModal(true);
  };

  // Assigner un expert
  const assignExpert = async () => {
    if (!selectedClientProduit || !selectedExpert) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Veuillez sélectionner un expert"
      });
      return;
    }

    setIsAssigningExpert(true);
    try {
      const response = await post(`/api/client/produits-eligibles/${selectedClientProduit.id}/assign-expert`, {
        expert_id: selectedExpert.id
      });

      if (response.success) {
        setShowExpertSelectionModal(false);
        toast({
          title: "Succès",
          description: `Expert ${selectedExpert.name} assigné avec succès !`
        });
        // Recharger les données
        loadData();
        // Rediriger vers la page du produit
        navigate(`/dossier-client/${selectedClientProduit.ProduitEligible.nom.toLowerCase()}/${selectedClientProduit.id}`);
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible d'assigner l'expert"
      });
    } finally {
      setIsAssigningExpert(false);
    }
  };

  // Vérifier si un produit a un expert assigné
  const hasExpertAssigned = (clientProduit: ClientProduitEligible) => {
    return !!clientProduit.expert_id;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <HeaderClient />
        <div className="flex justify-center items-center h-screen">
          <div className="text-xl">Chargement de la marketplace...</div>
        </div>
      </div>
    );
  }

  const filteredExperts = getFilteredExperts();

  return (
    <div className="min-h-screen bg-gray-50">
      <HeaderClient />
      
      <div className="max-w-7xl mx-auto px-4 py-8 pt-24">
        {/* Header */}
        <div className="mb-8">
          <div className="relative">
            {/* Titre principal centré */}
            <div className="text-center mb-1">
              <h1 className="text-2xl md:text-3xl font-black bg-gradient-to-r from-gray-900 via-blue-800 to-purple-800 bg-clip-text text-transparent">
                🚀 Marketplace des Experts
              </h1>
            </div>
            
            {/* Sous-titre avec style moderne */}
            <p className="text-sm md:text-base text-gray-600 font-light max-w-2xl mx-auto text-center">
              Trouvez l'expert parfait pour <span className="font-semibold text-blue-600">optimiser vos gains</span>
            </p>
            
            {/* Ligne décorative moderne */}
            <div className="flex justify-center mt-2">
              <div className="w-12 h-0.5 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"></div>
            </div>
          </div>
        </div>

        {/* Onglets */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-8">
            <TabsTrigger value="pour-vous" className="flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              Experts pour vous
              {expertMatches.filter(m => m.matchingSpecializations.length > 0).length > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {expertMatches.filter(m => m.matchingSpecializations.length > 0).length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="tous" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              Tous les experts
              <Badge variant="secondary" className="ml-2">
                {allExperts.length}
              </Badge>
            </TabsTrigger>
          </TabsList>

          {/* Filtres */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Rechercher un expert..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            {activeTab === "pour-vous" && (
              <Select value={selectedProduct} onValueChange={setSelectedProduct}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="Filtrer par produit" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les produits</SelectItem>
                  {getUniqueProducts().map(product => (
                    <SelectItem key={product} value={product}>
                      {product}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Trier par" />
              </SelectTrigger>
              <SelectContent>
                {activeTab === "pour-vous" && (
                  <SelectItem value="match-score">Score de correspondance</SelectItem>
                )}
                <SelectItem value="rating">Note</SelectItem>
                <SelectItem value="compensation">Commission</SelectItem>
                <SelectItem value="experience">Expérience</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Contenu des onglets */}
          <TabsContent value="pour-vous" className="space-y-8">
            {expertMatches.filter(m => m.matchingSpecializations.length > 0).length === 0 ? (
              <Card className="text-center py-16 bg-gradient-to-br from-blue-50 to-indigo-50 border-0 shadow-sm">
                <CardContent>
                  <Users className="w-20 h-20 text-blue-300 mx-auto mb-6" />
                  <h3 className="text-2xl font-semibold text-gray-800 mb-3">
                    Aucun expert correspondant
                  </h3>
                  <p className="text-gray-600 mb-6 max-w-md mx-auto">
                    Nous n'avons pas trouvé d'experts correspondant à vos produits éligibles pour le moment.
                  </p>
                  <Button onClick={() => setActiveTab("tous")} className="bg-blue-600 hover:bg-blue-700">
                    Voir tous les experts
                  </Button>
                </CardContent>
              </Card>
            ) : (
              // Sections par produit éligible
              clientProduitsEligibles.map((produit) => {
                // Trouver les experts correspondants pour ce produit
                const expertsForProduct = expertMatches.filter(match => 
                  match.matchingSpecializations.some(spec => 
                    spec.toLowerCase().includes(produit.ProduitEligible.nom.toLowerCase()) ||
                    produit.ProduitEligible.nom.toLowerCase().includes(spec.toLowerCase())
                  )
                );

                if (expertsForProduct.length === 0) return null;

                return (
                  <div key={produit.id} className="space-y-6">
                    {/* En-tête de section produit */}
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-100">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
                            <Sparkles className="w-6 h-6 text-white" />
                          </div>
                          <div className="flex-1">
                            <h2 className="text-2xl font-bold text-gray-800">
                              {produit.ProduitEligible.nom}
                            </h2>
                            <p className="text-gray-600 mt-1">
                              {produit.ProduitEligible.description}
                            </p>
                            <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                              <span className="flex items-center gap-1">
                                <TrendingUp className="w-4 h-4" />
                                Gain potentiel : {produit.montantFinal?.toLocaleString()}€
                              </span>
                              <span className="flex items-center gap-1">
                                <Users className="w-4 h-4" />
                                {expertsForProduct.length} expert{expertsForProduct.length > 1 ? 's' : ''} conseillé{expertsForProduct.length > 1 ? 's' : ''}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-3">
                          <Badge variant="default" className="bg-blue-600 text-white px-3 py-1">
                            {produit.statut}
                          </Badge>
                          
                          {/* Statut de l'expert */}
                          {hasExpertAssigned(produit) ? (
                            <Badge variant="default" className="bg-purple-600 text-white text-xs">
                              <Users className="w-3 h-3 mr-1" />
                              Expert assigné
                            </Badge>
                          ) : (
                            <Button 
                              onClick={() => openExpertSelectionModal(produit)}
                              size="sm"
                              className="bg-purple-600 hover:bg-purple-700 text-white text-xs"
                            >
                              <Users className="w-3 h-3 mr-1" />
                              Choisir un expert
                            </Button>
                          )}
                          
                          {/* Bouton voir le dossier si expert assigné */}
                          {hasExpertAssigned(produit) && (
                            <Button 
                              onClick={() => navigate(`/dossier-client/${produit.ProduitEligible.nom.toLowerCase()}/${produit.id}`)}
                              size="sm"
                              variant="outline"
                              className="text-xs border-blue-200 text-blue-700 hover:bg-blue-50"
                            >
                              <Handshake className="w-3 h-3 mr-1" />
                              Voir le dossier
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Grille d'experts pour ce produit */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {expertsForProduct.map((match) => (
                        <Card key={`${produit.id}-${match.expert.id}`} className="border-0 shadow-sm hover:shadow-md transition-all duration-300 bg-white">
                          <CardHeader className="pb-4">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <CardTitle className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                                  {match.expert.name}
                                  {match.matchScore > 80 && (
                                    <Award className="w-5 h-5 text-yellow-500" />
                                  )}
                                </CardTitle>
                                <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                                  <Building className="w-4 h-4" />
                                  {match.expert.company_name}
                                </p>
                              </div>
                              <Badge 
                                variant={match.matchScore > 80 ? "default" : "secondary"}
                                className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white"
                              >
                                {match.matchScore}% match
                              </Badge>
                            </div>
                          </CardHeader>
                          
                          <CardContent className="space-y-4">
                            {/* Spécialisations correspondantes */}
                            <div>
                              <h4 className="text-sm font-medium text-gray-700 mb-2">Spécialisations correspondantes</h4>
                              <div className="flex flex-wrap gap-1">
                                {match.matchingSpecializations.slice(0, 3).map((spec, index) => (
                                  <Badge 
                                    key={index} 
                                    variant="default"
                                    className="text-xs bg-blue-100 text-blue-700 border-blue-200"
                                  >
                                    {spec}
                                  </Badge>
                                ))}
                                {match.matchingSpecializations.length > 3 && (
                                  <Badge variant="outline" className="text-xs text-gray-500">
                                    +{match.matchingSpecializations.length - 3}
                                  </Badge>
                                )}
                              </div>
                            </div>

                            {/* Informations clés */}
                            <div className="grid grid-cols-2 gap-3 text-sm">
                              <div className="flex items-center gap-2 text-gray-600">
                                <Star className="w-4 h-4 text-yellow-500" />
                                <span>{match.expert.rating || 0}/5</span>
                              </div>
                              <div className="flex items-center gap-2 text-gray-600">
                                <Coins className="w-4 h-4 text-green-500" />
                                <span>{match.expert.compensation || 0}%</span>
                              </div>
                              <div className="flex items-center gap-2 text-gray-600">
                                <MapPin className="w-4 h-4 text-blue-500" />
                                <span>{match.expert.location || "Non spécifié"}</span>
                              </div>
                              <div className="flex items-center gap-2 text-gray-600">
                                <Clock className="w-4 h-4 text-purple-500" />
                                <span>{match.expert.experience || "0"} ans</span>
                              </div>
                            </div>

                            {/* Gain potentiel */}
                            {match.potentialGain > 0 && (
                              <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-3 rounded-lg border border-green-100">
                                <div className="flex items-center gap-2 text-green-700">
                                  <TrendingUp className="w-4 h-4" />
                                  <span className="font-medium text-sm">
                                    Gain estimé : {match.potentialGain.toLocaleString()}€
                                  </span>
                                </div>
                              </div>
                            )}

                            {/* Actions */}
                            <div className="flex gap-2 pt-2">
                              <Button 
                                onClick={() => contactExpert(match.expert.id)}
                                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                                size="sm"
                              >
                                <MessageSquare className="w-4 h-4 mr-2" />
                                Contacter
                              </Button>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => navigate(`/experts/${match.expert.id}`)}
                                className="border-gray-200 text-gray-600 hover:bg-gray-50"
                              >
                                Détails
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                );
              })
            )}
          </TabsContent>

          <TabsContent value="tous" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredExperts.map((match) => (
                <Card key={match.expert.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg">{match.expert.name}</CardTitle>
                        <p className="text-sm text-gray-600 flex items-center gap-1">
                          <Building className="w-4 h-4" />
                          {match.expert.company_name}
                        </p>
                      </div>
                      <Badge variant={match.expert.status === "actif" ? "default" : "secondary"}>
                        {match.expert.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="space-y-3">
                    {/* Spécialisations */}
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Spécialisations</h4>
                      <div className="flex flex-wrap gap-1">
                        {match.expert.specializations?.slice(0, 3).map((spec, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {spec}
                          </Badge>
                        ))}
                        {match.expert.specializations?.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{match.expert.specializations.length - 3}
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* Informations clés */}
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div className="flex items-center gap-2">
                        <Star className="w-4 h-4 text-yellow-500" />
                        <span>{match.expert.rating || 0}/5</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Coins className="w-4 h-4 text-green-500" />
                        <span>{match.expert.compensation || 0}%</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-blue-500" />
                        <span>{match.expert.location || "Non spécifié"}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-purple-500" />
                        <span>{match.expert.experience || "0"} ans</span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 pt-2">
                      <Button 
                        onClick={() => contactExpert(match.expert.id)}
                        className="flex-1"
                        size="sm"
                      >
                        <MessageSquare className="w-4 h-4 mr-2" />
                        Contacter
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => navigate(`/experts/${match.expert.id}`)}
                      >
                        Détails
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>

        {/* Modale de sélection d'expert */}
        <Dialog open={showExpertSelectionModal} onOpenChange={setShowExpertSelectionModal}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Sélectionner un expert - {selectedClientProduit?.ProduitEligible.nom}
              </DialogTitle>
              <DialogDescription>
                Choisissez l'expert qui vous accompagnera pour optimiser vos gains.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {expertMatches
                  .filter(match => 
                    match.matchingSpecializations.some(spec => 
                      spec.toLowerCase().includes(selectedClientProduit?.ProduitEligible.nom.toLowerCase() || "")
                    )
                  )
                  .slice(0, 6)
                  .map((match) => (
                    <Card 
                      key={match.expert.id} 
                      className={`cursor-pointer transition-all ${
                        selectedExpert?.id === match.expert.id 
                          ? 'ring-2 ring-blue-500 bg-blue-50' 
                          : 'hover:shadow-md'
                      }`}
                      onClick={() => setSelectedExpert(match.expert)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h4 className="font-semibold">{match.expert.name}</h4>
                            <p className="text-sm text-gray-600">{match.expert.company_name}</p>
                          </div>
                          <Badge variant={match.matchScore > 80 ? "default" : "secondary"}>
                            {match.matchScore}% match
                          </Badge>
                        </div>
                        
                        <div className="space-y-2 text-sm">
                          <div className="flex items-center gap-2">
                            <Star className="w-4 h-4 text-yellow-500" />
                            <span>{match.expert.rating || 0}/5</span>
                            <Coins className="w-4 h-4 text-green-500 ml-2" />
                            <span>{match.expert.compensation || 0}%</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-blue-500" />
                            <span>{match.expert.location || "Non spécifié"}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-purple-500" />
                            <span>{match.expert.experience || "0"} ans d'expérience</span>
                          </div>
                        </div>
                        
                        {match.potentialGain > 0 && (
                          <div className="mt-3 p-2 bg-green-50 rounded text-sm">
                            <span className="font-medium text-green-700">
                              Gain potentiel : {match.potentialGain.toLocaleString()}€
                            </span>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
              </div>
              
              {selectedExpert && (
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-semibold mb-2">Expert sélectionné : {selectedExpert.name}</h4>
                  <p className="text-sm text-gray-700">
                    Commission : {selectedExpert.compensation || 0}% | 
                    Note : {selectedExpert.rating || 0}/5 | 
                    Expérience : {selectedExpert.experience || "0"} ans
                  </p>
                </div>
              )}
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowExpertSelectionModal(false)}>
                Annuler
              </Button>
              <Button 
                onClick={assignExpert}
                disabled={!selectedExpert || isAssigningExpert}
              >
                {isAssigningExpert ? "Assignation en cours..." : "Assigner l'expert"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
