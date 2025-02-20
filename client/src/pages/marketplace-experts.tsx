import { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import HeaderClient from "@/components/HeaderClient";
import { ArrowLeft, Star, Search, Briefcase, LineChart, Building, FileText, Coins, Filter, MapPin } from "lucide-react";

const AUDITS = [
  { id: "ticpe", name: "Audit TICPE", description: "Optimisez votre fiscalité sur les taxes carburant." },
  { id: "msa", name: "Audit MSA", description: "Maîtrisez vos obligations sociales agricoles." },
  { id: "dfs", name: "Audit DFS", description: "Optimisez vos déclarations fiscales et sociales." },
  { id: "foncier", name: "Audit Foncier", description: "Maximisez la rentabilité de votre patrimoine immobilier." },
  { id: "fiscal", name: "Audit Fiscal", description: "Bénéficiez d'une fiscalité optimisée et conforme." },
];

const EXPERTS = {
  ticpe: [
    { id: 1, name: "Jean Dupont", commission: 10, location: "Paris", rating: 4.8, experience: 12 },
    { id: 2, name: "Elisa Moreau", commission: 15, location: "Bordeaux", rating: 4.7, experience: 8 },
    { id: 3, name: "Maxime Laurent", commission: 9, location: "Lille", rating: 4.5, experience: 10 },
    { id: 4, name: "Lucien Richard", commission: 11, location: "Nice", rating: 4.6, experience: 9 },
    { id: 5, name: "Théo Garnier", commission: 12, location: "Lyon", rating: 4.8, experience: 11 },
    { id: 6, name: "Yannick Dubois", commission: 8, location: "Strasbourg", rating: 4.3, experience: 7 },
    { id: 7, name: "Marc Lambert", commission: 13, location: "Nantes", rating: 4.7, experience: 10 },
    { id: 8, name: "Paul Girard", commission: 10, location: "Marseille", rating: 4.6, experience: 9 },
    { id: 9, name: "Alice Fontaine", commission: 14, location: "Grenoble", rating: 4.5, experience: 12 },
    { id: 10, name: "Nicolas Dupuis", commission: 9, location: "Toulouse", rating: 4.7, experience: 8 },
  ],
  msa: [
    { id: 11, name: "Sophie Martin", commission: 12, location: "Lyon", rating: 4.6, experience: 14 },
    { id: 12, name: "Marc Lefevre", commission: 8, location: "Marseille", rating: 4.9, experience: 10 },
    { id: 13, name: "Camille Duret", commission: 14, location: "Nantes", rating: 4.7, experience: 11 },
    { id: 14, name: "Antoine Girard", commission: 10, location: "Strasbourg", rating: 4.5, experience: 9 },
    { id: 15, name: "Emilie Roche", commission: 11, location: "Dijon", rating: 4.8, experience: 13 },
    { id: 16, name: "Hugo Morel", commission: 9, location: "Bordeaux", rating: 4.6, experience: 7 },
    { id: 17, name: "Vincent Chevalier", commission: 13, location: "Paris", rating: 4.7, experience: 12 },
    { id: 18, name: "Isabelle Lemoine", commission: 10, location: "Lille", rating: 4.4, experience: 10 },
    { id: 19, name: "François Bernard", commission: 15, location: "Grenoble", rating: 4.8, experience: 14 },
    { id: 20, name: "Chloé Laurent", commission: 12, location: "Toulouse", rating: 4.5, experience: 8 },
  ],
  dfs: [
    { id: 21, name: "Laura Bernard", commission: 11, location: "Toulouse", rating: 4.5, experience: 9 },
    { id: 22, name: "Olivier Petit", commission: 9, location: "Grenoble", rating: 4.8, experience: 11 },
    { id: 23, name: "Julien Robert", commission: 10, location: "Paris", rating: 4.6, experience: 10 },
    { id: 24, name: "Nathalie Simon", commission: 12, location: "Bordeaux", rating: 4.7, experience: 13 },
    { id: 25, name: "Benoît Caron", commission: 14, location: "Marseille", rating: 4.8, experience: 12 },
    { id: 26, name: "Sébastien Lefèvre", commission: 8, location: "Lyon", rating: 4.6, experience: 9 },
    { id: 27, name: "Audrey Dumas", commission: 13, location: "Strasbourg", rating: 4.5, experience: 10 },
    { id: 28, name: "Quentin Rolland", commission: 11, location: "Nantes", rating: 4.7, experience: 8 },
    { id: 29, name: "Manon Perrot", commission: 10, location: "Dijon", rating: 4.4, experience: 9 },
    { id: 30, name: "Alexandre Blanchard", commission: 9, location: "Tours", rating: 4.6, experience: 7 },
  ],
  foncier: [
    { id: 31, name: "Charlotte Moreau", commission: 13, location: "Paris", rating: 4.8, experience: 14 },
    { id: 32, name: "Benjamin Lambert", commission: 10, location: "Lyon", rating: 4.6, experience: 10 },
    { id: 33, name: "Sophie Renard", commission: 11, location: "Toulouse", rating: 4.5, experience: 9 },
    { id: 34, name: "Jérôme Clément", commission: 14, location: "Bordeaux", rating: 4.7, experience: 11 },
    { id: 35, name: "Mathieu Giraud", commission: 9, location: "Marseille", rating: 4.4, experience: 8 },
    { id: 36, name: "Élise Fontaine", commission: 12, location: "Grenoble", rating: 4.7, experience: 12 },
    { id: 37, name: "Adrien Simon", commission: 15, location: "Lille", rating: 4.8, experience: 13 },
    { id: 38, name: "Clara Marchand", commission: 8, location: "Nantes", rating: 4.3, experience: 7 },
    { id: 39, name: "Guillaume Petit", commission: 11, location: "Strasbourg", rating: 4.6, experience: 10 },
    { id: 40, name: "Noémie Richard", commission: 10, location: "Dijon", rating: 4.5, experience: 9 },
  ],
  fiscal: [
    { id: 41, name: "Léa Dupont", commission: 12, location: "Lyon", rating: 4.7, experience: 11 },
    { id: 42, name: "Pierre Chevalier", commission: 9, location: "Toulouse", rating: 4.5, experience: 8 },
    { id: 43, name: "Camille Roux", commission: 11, location: "Paris", rating: 4.6, experience: 9 },
    { id: 44, name: "David Morel", commission: 13, location: "Strasbourg", rating: 4.7, experience: 10 },
    { id: 45, name: "Céline Garnier", commission: 10, location: "Marseille", rating: 4.8, experience: 12 },
    { id: 46, name: "Jean-Baptiste Leroy", commission: 15, location: "Grenoble", rating: 4.9, experience: 14 },
    { id: 47, name: "Aurélie Fontaine", commission: 8, location: "Nantes", rating: 4.5, experience: 9 },
    { id: 48, name: "Mathis Renaud", commission: 12, location: "Bordeaux", rating: 4.6, experience: 10 },
    { id: 49, name: "Juliette Lefebvre", commission: 10, location: "Dijon", rating: 4.4, experience: 7 },
    { id: 50, name: "Vincent Lemoine", commission: 11, location: "Lille", rating: 4.7, experience: 11 },
  ],
  };

export default function Marketplace() {
  const [selectedAudit, setSelectedAudit] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("commission-asc");

  const sortExperts = (experts) => {
    return [...experts].sort((a, b) => {
      if (sortBy === "commission-asc") return a.commission - b.commission;
      if (sortBy === "commission-desc") return b.commission - a.commission;
      if (sortBy === "rating-asc") return a.rating - b.rating;
      if (sortBy === "rating-desc") return b.rating - a.rating;
      return 0;
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <HeaderClient />
      <div className="container mx-auto px-6 py-16">
        <div className="mb-10">
          <Link href="/">
            <Button variant="ghost" className="flex items-center gap-2 text-gray-700 hover:text-blue-600">
              <ArrowLeft className="w-5 h-5" /> Retour au Dashboard
            </Button>
          </Link>
        </div>

        <h1 className="text-5xl font-extrabold text-center mb-12">🚀 Sélectionnez votre audit et trouvez l’expert idéal</h1>

        <div className="flex gap-4 justify-center mb-6">
          <Input type="text" placeholder="Rechercher un audit..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-72 pl-10" />
          <select onChange={(e) => setSortBy(e.target.value)} value={sortBy} className="border rounded p-2">
            <option value="commission-asc">Commission (ordre croissant)</option>
            <option value="commission-desc">Commission (ordre décroissant)</option>
            <option value="rating">Note </option>
          </select>
        </div>

        {!selectedAudit ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {AUDITS.filter(audit => audit.name.toLowerCase().includes(search.toLowerCase())).map((audit) => (
              <Card key={audit.id} className="shadow-md bg-white rounded-lg p-6 hover:shadow-xl transition-all cursor-pointer" onClick={() => setSelectedAudit(audit.id)}>
                <CardContent className="text-left space-y-3">
                  <h2 className="text-xl font-semibold">{audit.name}</h2>
                  <p className="text-gray-600 text-sm w-full">{audit.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div>
            <Button variant="ghost" className="mb-6 flex items-center gap-2 text-gray-700 hover:text-blue-600" onClick={() => setSelectedAudit(null)}>
              <ArrowLeft className="w-5 h-5" /> Retour aux audits
            </Button>
            <h2 className="text-3xl font-bold text-center mb-6">🔎 Experts en {AUDITS.find((a) => a.id === selectedAudit)?.name}</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {sortExperts(EXPERTS[selectedAudit], sortBy).map((expert) => (
                <Card key={expert.id} className="shadow-md bg-white rounded-lg p-5 hover:shadow-xl transition-all">
                  <CardContent className="space-y-2 text-left">
                    <h3 className="text-lg font-bold flex items-center gap-2">
                      <Star className="w-5 h-5 text-yellow-500" /> {expert.name}
                    </h3>
                    <p className="text-gray-600 text-sm w-full flex items-center gap-2">
                      <Coins className="w-5 h-5 text-green-600" /> Commission : {expert.commission}%
                    </p>
                    <p className="text-gray-600 text-sm w-full flex items-center gap-2">
                      <MapPin className="w-5 h-5 text-blue-600" /> Localisation : {expert.location}
                    </p>
                    <p className="text-gray-600 text-sm w-full flex items-center gap-2">
                      <Briefcase className="w-5 h-5 text-purple-600" /> Expérience : {expert.experience} ans
                    </p>
                    <p className="text-gray-600 text-sm w-full flex items-center gap-2">
                      <Star className="w-5 h-5 text-yellow-500" /> Note : {expert.rating}/5
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
