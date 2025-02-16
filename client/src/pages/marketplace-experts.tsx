import { useEffect, useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectContent, SelectItem } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import HeaderClient from "@/components/HeaderClient";
import { ArrowLeft, Star, MapPin, Search } from "lucide-react";
import axios from "axios";

export default function MarketplaceExperts() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("Tous");
  const [experts, setExperts] = useState([]);

  useEffect(() => {
    axios.get("/api/experts")
      .then((response) => {
        setExperts(response.data);
      })
      .catch((error) => {
        console.error("Erreur lors du chargement des experts :", error);
      });
  }, []);

  const filteredExperts = experts
    .filter((expert) =>
      expert.name.toLowerCase().includes(search.toLowerCase()) &&
      (filter === "Tous" || expert.auditType.includes(filter))
    );

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <HeaderClient />
      <div className="container mx-auto px-6 py-16">
        {/* Bouton retour */}
        <div className="mb-10">
          <Link href="/">
            <Button variant="ghost" className="flex items-center gap-2 text-gray-700 hover:text-blue-600">
              <ArrowLeft className="w-5 h-5" /> Retour au Dashboard
            </Button>
          </Link>
        </div>

        {/* Titre principal */}
        <h1 className="text-6xl font-extrabold text-center mb-16">🚀 Découvrez les meilleurs experts sélectionnés pour vous</h1>

        {/* Filtres et recherche */}
        <div className="flex flex-wrap gap-6 justify-center mb-12">
          <div className="relative w-72">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" />
            <Input
              type="text"
              placeholder="Rechercher un expert..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-48">{filter}</SelectTrigger>
            <SelectContent>
              <SelectItem value="Tous">Tous</SelectItem>
              <SelectItem value="TICPE">TICPE</SelectItem>
              <SelectItem value="CII">CII</SelectItem>
              <SelectItem value="CIR">CIR</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Liste des experts */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
          {filteredExperts.map((expert) => (
            <Card key={expert.id} className="shadow-xl bg-white rounded-2xl p-8 hover:shadow-2xl transition-all">
              <CardContent className="space-y-4">
                <h2 className="text-3xl font-bold">{expert.name}</h2>
                <p className="text-gray-600">Type : {expert.auditType.join(", ")}</p>
                <p className="text-gray-600">Commission : {expert.commission}%</p>
                <p className="text-gray-600 flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-blue-600" /> {expert.location}
                </p>
                <div className="flex items-center gap-1">
                  {[...Array(Math.round(expert.rating))].map((_, i) => (
                    <Star key={i} className="w-6 h-6 text-yellow-500" />
                  ))}
                </div>
                <Link href={`/expert/${expert.id}`}>
                  <Button className="bg-blue-600 text-white hover:bg-blue-700 px-8 py-3 rounded-lg shadow-md w-full text-lg">
                    Voir le profil
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
