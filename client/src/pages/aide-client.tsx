import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Search, Send, ChevronDown, ChevronUp } from "lucide-react";
import HeaderClient from "@/components/HeaderClient";

interface FAQItem { id: string;
  question: string;
  answer: string;
  category: string; }

export default function AideClient() {
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [message, setMessage] = useState("");

  // Mock data - À remplacer par les données de l'API
  const faqs: FAQItem[] = [{ id: "1", question: "Comment contacter mon expert ?", answer: "Vous pouvez contacter votre expert directement via la messagerie intégrée en accédant à la section 'Messagerie' depuis votre tableau de bord.", category: "Communication" },
    { id: "2", question: "Comment accéder à mes documents ?", answer: "Tous vos documents sont disponibles dans la section 'Documents' de votre tableau de bord. Vous pouvez les consulter, les télécharger ou les partager avec votre expert.", category: "Documents" }];

  const filteredFaqs = faqs.filter((faq) =>
    faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
    faq.answer.toLowerCase().includes(searchQuery.toLowerCase()) ||
    faq.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSubmit = (e: React.FormEvent) => { e.preventDefault();
    // TODO: Implémenter l'envoi du message
    setMessage(""); };

  return (
    <div className="min-h-screen bg-gray-50">
      <HeaderClient />
      <div className="container mx-auto p-4 pt-24">
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Centre d'aide</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
                  <Input
                    placeholder="Rechercher une question..."
                    value={ searchQuery }
                    onChange={ (e) => setSearchQuery(e.target.value) }
                    className="pl-8"
                  />
                </div>
              </div>
              <div className="space-y-4">
                { filteredFaqs.map((faq) => (
                  <div key={faq.id } className="border rounded-lg p-4">
                    <button
                      className="w-full flex justify-between items-center"
                      onClick={ () => setExpandedId(expandedId === faq.id ? null : faq.id) }
                    >
                      <span className="font-medium">{ faq.question }</span>
                      { expandedId === faq.id ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      ) }
                    </button>
                    { expandedId === faq.id && (
                      <div className="mt-2 text-gray-600">{faq.answer }</div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Contactez le support</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={ handleSubmit } className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Votre message
                  </label>
                  <Textarea
                    value={ message }
                    onChange={ (e) => setMessage(e.target.value) }
                    placeholder="Décrivez votre problème ou votre question..."
                    className="min-h-[200px]"
                  />
                </div>
                <Button type="submit" className="w-full">
                  <Send className="h-4 w-4 mr-2" />
                  Envoyer
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
} 