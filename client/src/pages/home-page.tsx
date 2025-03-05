import { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { 
  UserCircle, TrendingUp, ShieldCheck, Users, CheckCircle, Briefcase, DollarSign, 
  Lightbulb, BarChart2, Handshake, FileText
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";

const testimonials = [
  { text: "Grâce à Profitum, nous avons économisé 15% sur nos charges annuelles !", author: "Jean Dupont", position: "Directeur Financier" },
  { text: "Une plateforme intuitive et efficace qui nous a fait gagner un temps précieux.", author: "Sophie Martin", position: "Responsable Comptable" },
  { text: "Enfin une solution transparente qui centralise tout en un seul endroit !", author: "Pierre Lambert", position: "CEO StartupTech" },
  { text: "Des experts qualifiés, un suivi impeccable et des économies à la clé.", author: "Isabelle Morel", position: "Entrepreneure" },
];

const keyMetrics = [
  { icon: Users, value: "+500", label: "Clients satisfaits" },
  { icon: Briefcase, value: "+200", label: "Experts partenaires" },
  { icon: DollarSign, value: "15%", label: "d'économies garanties" },
  { icon: Lightbulb, value: "100%", label: "Transparence" }
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-blue-900 text-white py-3 px-6">
        <div className="container mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-6">
            <Link href="/">
              <img src="/Logo-Profitum.png" alt="Profitum Logo" className="h-10 cursor-pointer" />
            </Link>
            <div className="flex space-x-6">
              <Link href="/nos-services">Nos Services</Link>
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
                <Link href="/connexion-partner">Partenaire</Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </nav>

      {/* Content wrapper with padding for fixed navbar */}
      <div className="pt-20">
        {/* Header principal */}
        <header className="bg-gradient-to-r from-blue-700 to-blue-900 text-white p-10 text-center">
          <h1 className="text-4xl font-bold">Une plateforme incontournable !</h1>
          <p className="mt-4 text-lg">Accédez instantanément aux meilleurs experts, bénéficiez de tarifs négociés et suivez chaque étape de vos dossiers en toute transparence.</p>
          <Link href="/create-account-client">
            <Button className="mt-7 bg-yellow-400 text-black font-bold px-10 py-6 rounded-lg hover:bg-yellow-500">
              Inscrivez-vous dès maintenant !
            </Button>
          </Link>
        </header>

        {/* Key Metrics */}
        <section className="py-10 container mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {keyMetrics.map((metric, index) => (
              <div key={index} className="flex flex-col items-center p-4">
                <metric.icon className="text-blue-600 w-12 h-12 mb-2" />
                <span className="text-3xl font-bold">{metric.value}</span>
                <span className="text-gray-600">{metric.label}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Section Valeur Ajoutée */}
        <section className="py-12 container mx-auto text-center">
          <h2 className="text-3xl font-bold mb-8">Pourquoi choisir Profitum ?</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[{ icon: ShieldCheck, title: "Experts vérifiés", desc: "Tous nos experts sont rigoureusement sélectionnés pour garantir un accompagnement de qualité.", link: "/create-account-client" },
              { icon: Handshake, title: "Tarifs négociés", desc: "Bénéficiez des meilleurs prix grâce à nos accords avec nos partenaires." },
              { icon: TrendingUp, title: "Économies garanties", desc: "Nos services permettent en moyenne de réduire vos charges de 15%." },
            ].map((advantage, index) => (
              <Link key={index} href={advantage.link || "#"} >
                <div className="p-6 border-2 border-blue-600 shadow-md rounded-lg flex flex-col items-center hover:shadow-xl hover:-translate-y-1 bg-white cursor-pointer">
                  <advantage.icon className="text-blue-600 w-14 h-14 mb-4" />
                  <h3 className="text-xl font-semibold">{advantage.title}</h3>
                  <p className="text-gray-700 mt-2 text-center">{advantage.desc}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* Témoignages */}
        <section className="py-12 bg-gray-100">
          <div className="container mx-auto">
            <h2 className="text-3xl font-bold text-center mb-8">Témoignages</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {testimonials.map((testimonial, index) => (
                <div key={index} className="p-4 bg-white rounded-lg shadow-md">
                  <p className="italic">"{testimonial.text}"</p>
                  <h3 className="font-bold mt-4">{testimonial.author}</h3>
                  <p className="text-sm text-gray-600">{testimonial.position}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="bg-blue-900 text-white py-6">
          <div className="container mx-auto text-center">
            <p>© 2025 Profitum. Tous droits réservés.</p>
          </div>
        </footer>
      </div>
    </div>
  );
}