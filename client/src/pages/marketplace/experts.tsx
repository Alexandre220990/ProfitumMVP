import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, MapPin, Clock, X, ShieldCheck, TrendingUp, Sparkles, UserCheck, MessageSquare, Handshake, DollarSign, BarChart3, CheckCircle, Zap, ArrowRight, Target, Star, Users } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import api from "@/lib/api";
import HeaderClient from "@/components/HeaderClient";

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
  relevance_score: number;
  match_percentage: number;
  availability_status: string;
  response_time: string;
  completed_assignments: number;
  success_rate: number;
}

interface SearchFilters {
  query: string;
  specializations: string[];
  location: string;
  minRating: number;
  maxRating: number;
  experience: string;
  priceRange: { min?: number; max?: number };
  availability: boolean;
}

const expertStats = [
  { icon: TrendingUp, value: "+200", label: "Experts vérifiés" },
  { icon: CheckCircle, value: "98%", label: "Taux de satisfaction" },
  { icon: TrendingUp, value: "15%", label: "d'économies moyennes" },
  { icon: Clock, value: "<24h", label: "Temps de réponse" }
];

const marketplaceProcess = [
  { 
    step: "01", 
    icon: Search, 
    title: "Recherche intelligente", 
    description: "Notre algorithme vous propose les experts les plus pertinents selon vos besoins spécifiques", 
    color: "from-blue-500 to-cyan-500" 
  },
  { 
    step: "02", 
    icon: UserCheck, 
    title: "Sélection vérifiée", 
    description: "Tous nos experts sont rigoureusement sélectionnés et validés pour garantir la qualité", 
    color: "from-purple-500 to-pink-500" 
  },
  { 
    step: "03", 
    icon: MessageSquare, 
    title: "Contact direct", 
    description: "Échangez directement avec l'expert de votre choix, sans intermédiaire", 
    color: "from-green-500 to-emerald-500" 
  },
  { 
    step: "04", 
    icon: Handshake, 
    title: "Accompagnement sur-mesure", 
    description: "Bénéficiez d'un suivi personnalisé et d'un accompagnement adapté à vos objectifs", 
    color: "from-orange-500 to-red-500" 
  }
];

const marketplaceBenefits = [
  { 
    icon: Zap, 
    title: "Simplicité absolue", 
    description: "Trouvez l'expert parfait en quelques clics. Plus besoin de passer des heures à chercher et comparer.", 
    highlight: "Gain de temps : 80%" 
  },
  { 
    icon: ShieldCheck, 
    title: "Qualité garantie", 
    description: "Tous nos experts sont vérifiés et évalués. Vous avez accès aux meilleurs professionnels du marché.", 
    highlight: "Experts certifiés : 100%" 
  },
  { 
    icon: DollarSign, 
    title: "Tarifs transparents", 
    description: "Pas de surprise ! Les tarifs sont clairement affichés et négociés pour vous garantir les meilleurs prix.", 
    highlight: "Économies : 15-30%" 
  },
  { 
    icon: BarChart3, 
    title: "Suivi en temps réel", 
    description: "Suivez l'avancement de vos projets en temps réel avec notre tableau de bord intuitif.", 
    highlight: "Visibilité : 100%" 
  }
];

export default function ExpertsMarketplace() {
  const { user } = useAuth();
  const [experts, setExperts] = useState<Expert[]>([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState<SearchFilters>({
    query: '',
    specializations: [],
    location: '',
    minRating: 0,
    maxRating: 5,
    experience: 'toutes',
    priceRange: {},
    availability: false
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Recherche d'experts
  const searchExperts = async (page: number = 1) => {
    setLoading(true);
    try {
      const response = await api.post('/experts/search', {
        ...filters,
        page,
        limit: 12
      });

      if (response.data.success) {
        setExperts(response.data.data.experts);
        setTotalPages(response.data.data.pagination.totalPages);
        setCurrentPage(page);
      }
    } catch (error) {
      console.error('Erreur recherche experts: ', error);
    } finally {
      setLoading(false);
    }
  };

  // Recherche initiale
  useEffect(() => {
    searchExperts();
  }, []);

  // Gestion des filtres
  const handleFilterChange = (key: keyof SearchFilters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
      query: '',
      specializations: [],
      location: '',
      minRating: 0,
      maxRating: 5,
      experience: 'toutes',
      priceRange: {},
      availability: false
    });
  };

  const applyFilters = () => {
    searchExperts(1);
  };

  // Contacter un expert
  const contactExpert = async (expertId: string) => {
    if (!user) {
      // Rediriger vers la connexion
      return;
    }

    try {
      const response = await api.post(`/experts/marketplace/${expertId}/contact`, {
        message: 'Je souhaite vous contacter pour une prestation.'
      });

      if (response.data.success) {
        alert('Demande envoyée avec succès !');
      }
    } catch (error) {
      console.error('Erreur contact expert: ', error);
      alert('Erreur lors de l\'envoi de la demande');
    }
  };

  return (
    <div className="app-professional min-h-screen">
      <HeaderClient />
      {/* Section Hero */}
      <section className="relative min-h-[60vh] flex items-center justify-center overflow-hidden bg-blue-900 pt-16">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(59,130,246,0.08),transparent_50%)]"></div>
        <div className="relative z-10 max-w-7xl mx-auto px-8 text-center">
          {/* Badge exclusif */}
          <div className="inline-flex items-center bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-blue-400/30 px-6 py-3 rounded-full text-sm font-medium text-blue-200 mb-8 backdrop-blur-sm">
            <Sparkles className="w-4 h-4 mr-2" />
            Réseau d'experts premium • Accès exclusif
          </div>
          
          {/* Titre principal */}
          <h1 className="text-4xl lg:text-6xl font-light mb-8 leading-tight">
            <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-blue-400 bg-clip-text text-transparent">
              Trouvez l'expert qu'il vous faut
            </span>
            <br />
            <span className="text-white/90 font-light">
              pour transformer vos contraintes en opportunités
            </span>
          </h1>
          
          {/* Punchline principale */}
          <div className="relative mb-12">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-blue-500/10 rounded-2xl blur-xl"></div>
            <div className="relative bg-gradient-to-r from-slate-800/50 to-slate-700/50 backdrop-blur-xl border border-white/10 rounded-2xl p-8">
              <p className="text-xl lg:text-2xl text-white/90 font-light leading-relaxed">
                Des experts qualifiés et vérifiés pour tous vos besoins
                <br />
                <span className="text-blue-300 font-normal">fiscaux et énergétiques</span>
              </p>
            </div>
          </div>

          {/* Barre de recherche principale */}
          <div className="max-w-4xl mx-auto">
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-2xl blur-xl group-hover:blur-2xl transition-all duration-300"></div>
              <div className="relative bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-2">
                <div className="flex items-center">
                  <Search className="ml-4 text-white/70 h-6 w-6" />
                  <Input
                    placeholder="Rechercher un expert, une spécialisation, une localisation..."
                    value={filters.query}
                    onChange={(e) => handleFilterChange('query', e.target.value)}
                    className="flex-1 bg-transparent border-0 text-white placeholder:text-white/50 text-lg py-4 ml-3 focus:ring-0 focus:outline-none"
                    onKeyPress={(e) => e.key === 'Enter' && applyFilters()}
                  />
                  <Button 
                    onClick={applyFilters}
                    className="bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium px-8 py-4 rounded-xl hover:from-blue-700 hover:to-purple-700 transform hover:scale-105 transition-all duration-300 shadow-xl hover:shadow-blue-500/25 mr-2"
                  >
                    <Search className="w-5 h-5 mr-2" />
                    Rechercher
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Key Metrics */}
      <section className="relative py-16 bg-white">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50/30 via-transparent to-purple-50/30"></div>
        <div className="relative z-10 max-w-7xl mx-auto px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {expertStats.map((metric, index) => (
              <div key={index} className="group">
                <div className="bg-white border border-slate-100 rounded-3xl p-6 text-center hover:shadow-xl transition-all duration-500 hover:scale-105">
                  <div className="bg-gradient-to-r from-blue-500 to-purple-500 p-3 rounded-2xl inline-flex mb-4 group-hover:scale-110 transition-transform duration-300">
                    <metric.icon className="text-white w-6 h-6" />
                  </div>
                  <div className="text-2xl font-bold text-slate-800 mb-1">
                    {metric.value}
                  </div>
                  <div className="text-slate-600 text-sm font-medium">{metric.label}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Section Process Marketplace */}
      <section className="relative py-24 bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="relative z-10 max-w-7xl mx-auto px-8">
          <div className="text-center mb-20">
            <h2 className="text-4xl font-light mb-6 text-slate-800">
              Comment ça marche ?
            </h2>
            <p className="text-xl text-slate-600 font-light max-w-3xl mx-auto leading-relaxed">
              Un processus simple et efficace pour connecter entreprises et experts
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {marketplaceProcess.map((step, index) => (
              <div key={index} className="group">
                <div className="bg-white/80 backdrop-blur-sm border border-white/60 rounded-3xl p-8 hover:bg-white transition-all duration-500 hover:scale-105 cursor-pointer shadow-sm hover:shadow-xl h-full flex flex-col relative">
                  {/* Numéro d'étape */}
                  <div className="absolute -top-4 -left-4 w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg">
                    {step.step}
                  </div>
                  
                  {/* Icône */}
                  <div className={`bg-gradient-to-r ${step.color} p-4 rounded-2xl inline-flex mb-6 group-hover:scale-110 transition-transform duration-300 self-start mt-4`}>
                    <step.icon className="text-white w-8 h-8" />
                  </div>
                  
                  {/* Contenu */}
                  <h3 className="text-xl font-semibold mb-4 text-slate-800 group-hover:text-slate-900 transition-colors duration-300">
                    {step.title}
                  </h3>
                  <p className="text-slate-600 leading-relaxed group-hover:text-slate-700 transition-colors duration-300 flex-1">
                    {step.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Section Avantages Marketplace */}
      <section className="relative py-24 bg-gradient-to-br from-slate-900 to-blue-900">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(59,130,246,0.08),transparent_50%)]"></div>
        <div className="relative z-10 max-w-7xl mx-auto px-8">
          <div className="text-center mb-20">
            <h2 className="text-4xl font-light mb-6 text-white">
              Pourquoi choisir notre marketplace ?
            </h2>
            <p className="text-xl text-white/80 font-light max-w-3xl mx-auto">
              Une plateforme révolutionnaire qui simplifie l'accès à l'expertise
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            {marketplaceBenefits.map((benefit, index) => (
              <div key={index} className="group">
                <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-3xl p-8 hover:bg-white/10 transition-all duration-500 hover:scale-105">
                  <div className="flex items-start gap-6">
                    <div className={`bg-gradient-to-r ${benefit.icon === Zap ? 'from-yellow-500 to-orange-500' : 
                                                   benefit.icon === ShieldCheck ? 'from-green-500 to-emerald-500' :
                                                   benefit.icon === DollarSign ? 'from-blue-500 to-cyan-500' :
                                                   'from-purple-500 to-pink-500'} p-4 rounded-2xl group-hover:scale-110 transition-transform duration-300`}>
                      <benefit.icon className="text-white w-8 h-8" />
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-xl mb-3 text-white">{benefit.title}</div>
                      <div className="text-white/80 leading-relaxed mb-4">{benefit.description}</div>
                      <div className="inline-flex items-center bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-4 py-2">
                        <span className="text-blue-300 font-semibold text-sm">{benefit.highlight}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {/* CTA Section */}
          <div className="text-center mt-16">
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-3xl p-12">
              <h3 className="text-3xl font-light text-white mb-6">
                Prêt à trouver votre expert ?
              </h3>
              <p className="text-xl text-white/80 font-light mb-8 max-w-2xl mx-auto">
                Rejoignez des centaines d'entreprises qui font déjà confiance à notre marketplace
              </p>
              <Button 
                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                className="group relative bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold px-10 py-4 text-lg rounded-full hover:from-blue-700 hover:to-purple-700 transform hover:scale-105 transition-all duration-300 shadow-xl hover:shadow-blue-500/25"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full opacity-0 group-hover:opacity-20 transition-opacity duration-300 blur-xl"></div>
                <span className="relative flex items-center">
                  <Search className="w-5 h-5 mr-3" />
                  Commencer ma recherche
                  <ArrowRight className="w-5 h-5 ml-3 group-hover:translate-x-1 transition-transform duration-300" />
                </span>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Section de recherche et filtres */}
      <div className="max-w-7xl mx-auto px-8 py-12">
        <div className="flex flex-col lg:flex-row gap-12">
          {/* Filtres */}
          <div className="lg:w-1/4">
            <div className="sticky top-8">
              <div className="bg-white/80 backdrop-blur-sm border border-white/60 rounded-3xl p-8 shadow-sm hover:shadow-xl transition-all duration-500">
                <div className="flex items-center justify-between mb-8">
                  <h3 className="text-xl font-semibold text-slate-800 flex items-center gap-2">
                    Filtres avancés
                  </h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearFilters}
                    className="text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-full p-2"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                
                <div className="space-y-8">
                  {/* Localisation */}
                  <div>
                    <h4 className="font-semibold mb-4 text-slate-800">Localisation</h4>
                    <Input
                      placeholder="Ville, région..."
                      value={filters.location}
                      onChange={(e) => handleFilterChange('location', e.target.value)}
                      className="bg-slate-50 border-slate-200 focus:border-blue-400 focus:ring-blue-400"
                    />
                  </div>

                  {/* Expérience */}
                  <div>
                    <h4 className="font-semibold mb-4 text-slate-800">Expérience</h4>
                    <Select
                      value={filters.experience}
                      onValueChange={(value: string) => handleFilterChange('experience', value)}
                    >
                      <SelectTrigger className="bg-slate-50 border-slate-200 focus:border-blue-400 focus:ring-blue-400">
                        <SelectValue placeholder="Toutes les expériences" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="toutes">Toutes les expériences</SelectItem>
                        <SelectItem value="débutant">Débutant (1-2 ans)</SelectItem>
                        <SelectItem value="intermédiaire">Intermédiaire (3-5 ans)</SelectItem>
                        <SelectItem value="expérimenté">Expérimenté (5+ ans)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Disponibilité */}
                  <div>
                    <label className="flex items-center space-x-3 cursor-pointer group">
                      <div className="relative">
                        <input
                          type="checkbox"
                          checked={filters.availability}
                          onChange={(e) => handleFilterChange('availability', e.target.checked)}
                          className="sr-only"
                        />
                        <div className={`
                          w-5 h-5 rounded border-2 flex items-center justify-center transition-all duration-200
                          ${filters.availability
                            ? 'bg-gradient-to-r from-blue-500 to-purple-500 border-transparent'
                            : 'border-slate-300 group-hover:border-blue-400'}
                        `}>
                          {filters.availability && (
                            <CheckCircle className="w-3 h-3 text-white" />
                          )}
                        </div>
                      </div>
                      <span className="text-sm font-medium text-slate-700 group-hover:text-slate-900 transition-colors">Disponible maintenant</span>
                    </label>
                  </div>

                  <Button 
                    onClick={applyFilters} 
                    className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold py-3 rounded-xl hover:from-blue-700 hover:to-purple-700 transform hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-blue-500/25"
                  >
                    Appliquer les filtres
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Liste des experts */}
          <div className="lg:w-3/4">
            {/* Statistiques */}
            <div className="mb-8">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-3xl font-light text-slate-800 mb-2">
                    {loading ? 'Recherche en cours...' : `${experts.length} experts trouvés`}
                  </h2>
                  {experts.length > 0 && (
                    <p className="text-slate-600 font-light">
                      Triés par pertinence et expertise
                    </p>
                  )}
                </div>
                <div className="flex items-center space-x-4 text-sm text-slate-500">
                  <span className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    {experts.length} experts
                  </span>
                </div>
              </div>
            </div>

            {/* Grille des experts */}
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="bg-white/80 backdrop-blur-sm border border-white/60 rounded-3xl p-8 animate-pulse">
                    <div className="h-6 bg-slate-200 rounded mb-4"></div>
                    <div className="h-4 bg-slate-200 rounded mb-2"></div>
                    <div className="h-4 bg-slate-200 rounded w-2/3"></div>
                  </div>
                ))}
              </div>
            ) : experts.length > 0 ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {experts.map((expert) => (
                    <div key={expert.id} className="group">
                      <div className="bg-white/80 backdrop-blur-sm border border-white/60 rounded-3xl p-8 hover:bg-white transition-all duration-500 hover:scale-105 cursor-pointer shadow-sm hover:shadow-xl">
                        {/* Header expert */}
                        <div className="flex items-start justify-between mb-6">
                          <div className="flex-1">
                            <h3 className="text-xl font-semibold text-slate-800 mb-2 group-hover:text-slate-900 transition-colors">
                              {expert.name}
                            </h3>
                            <p className="text-slate-600 mb-3 font-medium">{expert.company_name}</p>
                            <div className="flex items-center gap-3 mb-4">
                              <div className="flex items-center gap-1">
                                <Star className="h-4 w-4 text-yellow-400 fill-current" />
                                <span className="text-sm font-semibold text-slate-800">{expert.rating}</span>
                              </div>
                              <Badge variant="secondary" className="bg-gradient-to-r from-blue-100 to-purple-100 text-blue-700 border-blue-200">
                                {expert.match_percentage}% match
                              </Badge>
                            </div>
                          </div>
                          <div className="text-right">
                            <Badge 
                              variant={expert.availability_status === 'Disponible' ? 'default' : 'secondary'}
                              className={`
                                ${expert.availability_status === 'Disponible' 
                                  ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white' 
                                  : 'bg-slate-100 text-slate-600'}
                              `}
                            >
                              {expert.availability_status}
                            </Badge>
                          </div>
                        </div>

                        {/* Spécialisations */}
                        <div className="mb-6">
                          <div className="flex flex-wrap gap-2">
                            {expert.specializations?.slice(0, 3).map((spec) => (
                              <Badge key={spec} variant="outline" className="text-xs border-slate-200 text-slate-700">
                                {spec}
                              </Badge>
                            ))}
                            {expert.specializations?.length > 3 && (
                              <Badge variant="outline" className="text-xs border-slate-200 text-slate-700">
                                +{expert.specializations.length - 3}
                              </Badge>
                            )}
                          </div>
                        </div>

                        {/* Localisation et temps de réponse */}
                        <div className="flex items-center justify-between text-sm text-slate-600 mb-6">
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-blue-500" />
                            {expert.location}
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-purple-500" />
                            {expert.response_time}
                          </div>
                        </div>

                        {/* Statistiques */}
                        <div className="flex items-center justify-between text-sm mb-6 p-4 bg-slate-50 rounded-2xl">
                          <span className="font-medium text-slate-700">{expert.completed_assignments} missions</span>
                          <span className="font-medium text-slate-700">{expert.success_rate}% de réussite</span>
                        </div>

                        {/* Description */}
                        <p className="text-sm text-slate-600 mb-6 line-clamp-2 leading-relaxed">
                          {expert.description || 'Expert qualifié dans son domaine avec une expertise reconnue.'}
                        </p>

                        {/* Actions */}
                        <div className="flex gap-3">
                          <Button 
                            onClick={() => contactExpert(expert.id)}
                            className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold py-3 rounded-xl hover:from-blue-700 hover:to-purple-700 transform hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-blue-500/25"
                          >
                            <Target className="w-4 h-4 mr-2" />
                            Contacter
                          </Button>
                          <Button 
                            variant="outline" 
                            className="border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300 font-medium py-3 rounded-xl transition-all duration-300"
                            onClick={() => window.open(`/marketplace/experts/${expert.id}`, '_blank')}
                          >
                            Voir profil
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex justify-center mt-12">
                    <div className="flex items-center space-x-4 bg-white/80 backdrop-blur-sm border border-white/60 rounded-2xl p-4 shadow-sm">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => searchExperts(currentPage - 1)}
                        disabled={currentPage === 1}
                        className="border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300 rounded-xl transition-all duration-300"
                      >
                        Précédent
                      </Button>
                      <span className="text-sm font-medium text-slate-700 px-4">
                        Page {currentPage} sur {totalPages}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => searchExperts(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        className="border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300 rounded-xl transition-all duration-300"
                      >
                        Suivant
                      </Button>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="bg-white/80 backdrop-blur-sm border border-white/60 rounded-3xl p-16 text-center">
                <div className="text-slate-400 mb-6">
                  <Search className="h-20 w-20 mx-auto" />
                </div>
                <h3 className="text-2xl font-semibold text-slate-800 mb-4">
                  Aucun expert trouvé
                </h3>
                <p className="text-slate-600 mb-8 max-w-md mx-auto leading-relaxed">
                  Essayez de modifier vos critères de recherche pour trouver l'expert parfait pour vos besoins.
                </p>
                <Button 
                  onClick={clearFilters} 
                  variant="outline"
                  className="border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300 font-medium py-3 px-6 rounded-xl transition-all duration-300"
                >
                  <X className="w-4 h-4 mr-2" />
                  Effacer les filtres
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 