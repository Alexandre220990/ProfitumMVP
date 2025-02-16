import { useState, useEffect } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { UserCircle, ShieldCheck, Briefcase, Users, CheckCircle, Gavel, Landmark, Tractor, PiggyBank, Leaf } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { get } from "@/lib/api"; // Utilisation de la fonction get depuis lib/api.ts

interface Category {
  id: number;
  name: string;
}

export default function ExpertsPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await get("/api/expert-categories");

        if (response && response.success && Array.isArray(response.data)) {
          setCategories(response.data as Category[]);
        } else {
          console.error("Données de catégories invalides :", response);
          setError("Les données de catégories reçues ne sont pas valides.");
        }
      } catch (error) {
        console.error("Erreur lors du chargement des catégories :", error);
        setError("Impossible de charger les catégories d'experts.");
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  return (

    <div className="p-6 space-y-4">
      {/* Bandeau de navigation global */}
      <div className="bg-blue-900 text-white py-3 px-6 rounded-lg flex justify-between items-center text-sm">
        <div className="flex items-center space-x-6">
          <Link href="/">
            <img src="/Logo-Profitum.png" alt="Profitum Logo" className="h-10 cursor-pointer" />
          </Link>

          <div className="flex space-x-6">
            <Link href="/Nos-Services">Nos Services</Link>
            <Link href="/experts">Nos Experts</Link>
            <Link href="/tarifs">Tarifs</Link>
            <Link href="/contact">Contact</Link>
          </div>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button className="bg-white text-blue-600 flex items-center">
              <UserCircle className="mr-2" /> Connexion
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem asChild>
              <Link href="/connexion-client">Client</Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="connexion-partner">Partenaire</Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Header principal */}
      <header className="flex flex-col md:flex-row justify-between items-center bg-gradient-to-r from-blue-700 to-blue-900 text-white p-10 rounded-lg shadow-xl w-full">
        <div className="w-full md:w-2/3 text-center md:text-left">
          <h1 className="text-4xl font-bold">Les meilleurs spécialistes en un seul endroit.</h1>
          <p className="mt-4 text-lg">
            Accès instantané, tarifs négociés et suivi des dossiers en toute transparence.
          </p>
          <Link href="/create-account-client">
            <Button className="mt-7 bg-yellow-400 text-black font-bold px-6 py-6 rounded-lg hover:bg-yellow-500">
              Accédez à la Marketplace des Experts
            </Button>
          </Link>
        </div>

        <div className="w-full md:w-1/3 flex justify-center md:justify-end mt-6 md:mt-1">
          <img 
            src="ecureuil_costume_transparent.png" 
            alt="Écureuil représentant les solutions" 
            width={220} 
            height={200} 
            className="rounded-lg drop-shadow-lg"
          />
        </div>
      </header>

      {/* Section Pourquoi choisir Profitum */}
      <section className="py-12 px-6 container mx-auto text-center">
        <h2 className="text-3xl font-bold mb-6">Pourquoi choisir un expert sur Profitum ?</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            { icon: ShieldCheck, title: "Des experts vérifiés", text: "Tous nos experts sont validés selon des critères stricts." },
            { icon: Briefcase, title: "Vos dossiers centralisés", text: "Nous avons l'expert adapté pour chaque besoin." },
            { icon: Users, title: "Un suivi transparent", text: "Comparez, sélectionnez et suivez vos projets en toute clarté." }
          ].map((item, index) => (
            <div key={index} className="p-6 bg-white shadow-lg rounded-lg flex flex-col items-center">
              <item.icon className="text-blue-600 w-12 h-12 mb-4" />
              <h3 className="text-xl font-semibold">{item.title}</h3>
              <p className="text-gray-600 mt-2">{item.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Section Catégories d'expertise */}
      <section className="py-12 bg-gray-100 text-center">
        <h2 className="text-3xl font-bold mb-6">Nos domaines d'expertise</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-8 px-6">
          {[
            { name: "Audit Énergétique", icon: Leaf },
            { name: "Audit Social", icon: Users },
            { name: "Audit Foncier", icon: Landmark },
            { name: "Audit MSA", icon: Tractor },
            { name: "Audit DFS", icon: Briefcase },
            { name: "Audit Patrimoine", icon: PiggyBank },
            { name: "Avocats et Juristes", icon: Gavel },
            { name: "Conseil en Gestion", icon: ShieldCheck },
          ].map((category, index) => (
            <div
              key={index}
              className="p-6 bg-white shadow-lg rounded-lg flex flex-col items-center border border-blue-500 transform hover:scale-105 transition duration-300 ease-in-out"
            >
              <category.icon className="text-blue-600 w-14 h-14 mb-4" />
              <p className="text-xl font-semibold text-blue-900">{category.name}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-12 bg-gradient-to-r from-blue-700 to-blue-900 text-white text-center">
        <h2 className="text-3xl font-bold mb-4">Trouvez l'expert qu'il vous faut</h2>
        <p className="text-lg mb-6">Comparez et contactez nos experts qualifiés en quelques clics.</p>
        <Link href="/create-account-client">
          <Button className="bg-yellow-400 text-black px-8 py-3 font-bold rounded-lg hover:bg-yellow-500">
            Contacter un expert
          </Button>
        </Link>
      </section>

      {/* Footer */}
      <footer className="bg-gray-800 text-white rounded-lg py-6">
        <div className="container mx-auto text-center">
          <p className="text-sm">Copyright © {new Date().getFullYear()} Profitum. Tous droits réservés.</p>
        </div>
      </footer>
    </div>
  );
}
