import { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { 
  UserCircle, ChevronLeft, ChevronRight, TrendingUp, ShieldCheck, Users, CheckCircle, Briefcase, DollarSign, 
  Lightbulb, BarChart2, Handshake, FileText
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";

const testimonials = [
  {
    text: "Grâce à Profitum, nous avons économisé 15% sur nos charges annuelles !",
    author: "Jean Dupont",
    position: "Directeur Financier",
  },
  {
    text: "Une plateforme intuitive et efficace qui nous a fait gagner un temps précieux.",
    author: "Sophie Martin",
    position: "Responsable Comptable",
  },
  {
    text: "Enfin une solution transparente qui centralise tout en un seul endroit !",
    author: "Pierre Lambert",
    position: "CEO StartupTech",
  },
  {
    text: "Des experts qualifiés, un suivi impeccable et des économies à la clé.",
    author: "Isabelle Morel",
    position: "Entrepreneure",
  },
];

export default function HomePage() {
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
              <Link href="/auth?type=client">Client</Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/auth?type=partner">Partenaire</Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Logo en grand sous le header */}
      <div className="flex justify-center mt-6">
        <img
          src="/profitum_logo_texte.png"
          alt="Profitum Logo"
          className="w-60 md:w-80 lg:w-96"
        />
      </div>

      {/* Header principal */}
      <header className="flex flex-col md:flex-row justify-between items-center bg-gradient-to-r from-blue-700 to-blue-900 text-white p-10 rounded-lg shadow-xl w-full">
        <div className="w-full text-center md:text-left">
          <h1 className="text-4xl font-bold leading-tight w-full">
            Une plateforme incontournable !
          </h1>
          <p className="mt-4 text-lg">
            Accédez instantanément aux meilleurs experts, bénéficiez de tarifs négociés et suivez chaque étape de vos dossiers en toute transparence.
          </p>
          <Link href="/auth?type=partner">
            <Button className="mt-7 bg-yellow-400 text-black font-bold px-10 py-6 rounded-lg hover:bg-yellow-500">
              Inscrivez-vous dès maintenant !
            </Button>
          </Link>
        </div>
      </header>

      {/* Section Valeur Ajoutée */}
      <section className="py-12 px-6 container mx-auto text-center">
        <h2 className="text-3xl font-bold mb-8">Pourquoi choisir Profitum ?</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[
            { icon: ShieldCheck, title: "Experts vérifiés", desc: "Tous nos experts sont rigoureusement sélectionnés pour garantir un accompagnement de qualité." },
            { icon: Handshake, title: "Tarifs négociés", desc: "Bénéficiez des meilleurs prix grâce à nos accords avec nos partenaires." },
            { icon: TrendingUp, title: "Économies garanties", desc: "Nos services permettent en moyenne de réduire vos charges de 15%." },
            { icon: BarChart2, title: "Suivi en temps réel", desc: "Accédez à votre espace client et suivez l’évolution de vos dossiers en toute transparence." },
            { icon: FileText, title: "Dossiers centralisés", desc: "Tous vos documents et échanges avec les experts regroupés en un seul endroit sécurisé." },
            { icon: DollarSign, title: "Optimisation fiscale", desc: "Profitez de stratégies d'optimisation avancées pour maximiser vos bénéfices." },
          ].map((advantage, index) => (
            <div
              key={index}
              className="p-6 border-2 border-blue-600 shadow-md rounded-lg flex flex-col items-center transition-transform transform hover:shadow-xl hover:-translate-y-1 bg-white"
            >
              <advantage.icon className="text-blue-600 w-14 h-14 mb-4" />
              <h3 className="text-xl font-semibold">{advantage.title}</h3>
              <p className="text-gray-700 mt-2 text-center">{advantage.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
