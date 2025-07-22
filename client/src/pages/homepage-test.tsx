import React, { useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Building2, 
  Users, 
  Shield, 
  TrendingUp, 
  CheckCircle, 
  Star,
  ArrowRight,
  Phone,
  Mail,
  MapPin,
  Clock,
  Award,
  Zap,
  Target,
  BarChart3
} from 'lucide-react';

// Données structurées Schema.org
const structuredData = {
  "@context": "https://schema.org",
  "@type": "FinancialService",
  "name": "Profitum - Plateforme de Gestion Financière et Fiscale",
  "description": "Plateforme innovante de gestion financière et fiscale pour entreprises. Services d'audit, conseil fiscal, et accompagnement par des experts certifiés.",
  "url": "https://www.profitum.app",
  "logo": "https://www.profitum.app/logo.png",
  "sameAs": [
    "https://www.linkedin.com/company/profitum",
    "https://twitter.com/profitum"
  ],
  "contactPoint": {
    "@type": "ContactPoint",
    "telephone": "+33-1-XX-XX-XX-XX",
    "contactType": "customer service",
    "availableLanguage": ["French", "English"]
  },
  "address": {
    "@type": "PostalAddress",
    "addressCountry": "FR",
    "addressLocality": "Paris",
    "addressRegion": "Île-de-France"
  },
  "serviceType": [
    "Audit Fiscal",
    "Conseil Financier", 
    "Optimisation Fiscale",
    "Gestion de Patrimoine",
    "Audit Énergétique",
    "Certifications CEE"
  ],
  "areaServed": "France",
  "hasOfferCatalog": {
    "@type": "OfferCatalog",
    "name": "Services Financiers et Fiscaux",
    "itemListElement": [
      {
        "@type": "Offer",
        "itemOffered": {
          "@type": "Service",
          "name": "Audit Fiscal Complet",
          "description": "Analyse approfondie de la situation fiscale de votre entreprise"
        }
      },
      {
        "@type": "Offer", 
        "itemOffered": {
          "@type": "Service",
          "name": "Optimisation Énergétique",
          "description": "Audit énergétique et solutions d'économie d'énergie"
        }
      }
    ]
  }
};

export default function HomepageTest() {
  useEffect(() => {
    // Injection des données structurées
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.text = JSON.stringify(structuredData);
    document.head.appendChild(script);

    return () => {
      document.head.removeChild(script);
    };
  }, []);

  return (
    <>
      <Helmet>
        <title>Profitum - Plateforme de Gestion Financière et Fiscale | Audit, Conseil, Optimisation</title>
        <meta name="description" content="Profitum est la plateforme innovante de gestion financière et fiscale pour entreprises. Services d'audit, conseil fiscal, et accompagnement par des experts certifiés. Optimisez votre fiscalité et votre performance énergétique." />
        <meta name="keywords" content="audit fiscal, conseil financier, optimisation fiscale, audit énergétique, CEE, gestion patrimoine, expert comptable, fiscalité entreprise, économies d'énergie, certification énergétique" />
        <meta name="robots" content="index, follow" />
        <meta property="og:title" content="Profitum - Plateforme de Gestion Financière et Fiscale" />
        <meta property="og:description" content="Services d'audit, conseil fiscal, et accompagnement par des experts certifiés pour optimiser votre fiscalité et performance énergétique." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://www.profitum.app" />
        <link rel="canonical" href="https://www.profitum.app" />
      </Helmet>

      <main className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
        {/* Header Hero Section */}
        <header className="relative overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
            <div className="text-center">
              <h1 className="text-4xl md:text-6xl font-bold text-slate-900 mb-6">
                Optimisez votre 
                <span className="text-blue-600"> performance financière</span>
              </h1>
              <p className="text-xl text-slate-600 mb-8 max-w-3xl mx-auto">
                Plateforme innovante de gestion financière et fiscale. Audit, conseil, et accompagnement par des experts certifiés pour maximiser vos économies et votre conformité.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" className="bg-blue-600 hover:bg-blue-700">
                  Démarrer un audit gratuit
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
                <Button size="lg" variant="outline">
                  Découvrir nos services
                </Button>
              </div>
            </div>
          </div>
        </header>

        {/* Services Section */}
        <section className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
                Nos Services d'Expertise
              </h2>
              <p className="text-xl text-slate-600 max-w-2xl mx-auto">
                Une gamme complète de services pour optimiser votre situation financière et fiscale
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              <article className="group">
                <Card className="h-full hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                      <Building2 className="w-6 h-6 text-blue-600" />
                    </div>
                    <CardTitle>Audit Fiscal Complet</CardTitle>
                    <CardDescription>
                      Analyse approfondie de votre situation fiscale pour identifier les opportunités d'optimisation
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2 text-sm text-slate-600">
                      <li className="flex items-center">
                        <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                        Analyse de la structure fiscale
                      </li>
                      <li className="flex items-center">
                        <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                        Identification des niches fiscales
                      </li>
                      <li className="flex items-center">
                        <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                        Plan d'optimisation personnalisé
                      </li>
                    </ul>
                  </CardContent>
                </Card>
              </article>

              <article className="group">
                <Card className="h-full hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                      <Zap className="w-6 h-6 text-green-600" />
                    </div>
                    <CardTitle>Audit Énergétique CEE</CardTitle>
                    <CardDescription>
                      Optimisez votre consommation énergétique et bénéficiez des certificats d'économie d'énergie
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2 text-sm text-slate-600">
                      <li className="flex items-center">
                        <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                        Diagnostic énergétique complet
                      </li>
                      <li className="flex items-center">
                        <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                        Solutions d'économie d'énergie
                      </li>
                      <li className="flex items-center">
                        <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                        Accompagnement CEE
                      </li>
                    </ul>
                  </CardContent>
                </Card>
              </article>

              <article className="group">
                <Card className="h-full hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                      <Users className="w-6 h-6 text-purple-600" />
                    </div>
                    <CardTitle>Conseil en Gestion</CardTitle>
                    <CardDescription>
                      Accompagnement personnalisé par des experts pour optimiser votre gestion financière
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2 text-sm text-slate-600">
                      <li className="flex items-center">
                        <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                        Stratégie financière
                      </li>
                      <li className="flex items-center">
                        <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                        Gestion de trésorerie
                      </li>
                      <li className="flex items-center">
                        <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                        Optimisation des coûts
                      </li>
                    </ul>
                  </CardContent>
                </Card>
              </article>
            </div>
          </div>
        </section>

        {/* Statistiques Section */}
        <section className="py-20 bg-slate-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
                Chiffres Clés
              </h2>
              <p className="text-xl text-slate-600">
                La confiance de centaines d'entreprises
              </p>
            </div>

            <div className="grid md:grid-cols-4 gap-8">
              <div className="text-center">
                <div className="text-4xl font-bold text-blue-600 mb-2">500+</div>
                <p className="text-slate-600">Entreprises accompagnées</p>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-green-600 mb-2">2M€</div>
                <p className="text-slate-600">Économies générées</p>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-purple-600 mb-2">50+</div>
                <p className="text-slate-600">Experts certifiés</p>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-orange-600 mb-2">98%</div>
                <p className="text-slate-600">Satisfaction client</p>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="py-20 bg-white">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
                Questions Fréquentes
              </h2>
              <p className="text-xl text-slate-600">
                Tout ce que vous devez savoir sur nos services
              </p>
            </div>

            <div className="space-y-6">
              <article className="border border-slate-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-slate-900 mb-3">
                  Qu'est-ce qu'un audit fiscal et quels sont ses avantages ?
                </h3>
                <p className="text-slate-600">
                  Un audit fiscal est une analyse approfondie de votre situation fiscale visant à identifier les opportunités d'optimisation légales. Il permet de réduire votre charge fiscale, d'améliorer votre trésorerie et d'assurer votre conformité fiscale.
                </p>
              </article>

              <article className="border border-slate-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-slate-900 mb-3">
                  Comment fonctionnent les certificats d'économie d'énergie (CEE) ?
                </h3>
                <p className="text-slate-600">
                  Les CEE sont des dispositifs permettant de financer des travaux d'économie d'énergie. En réalisant des travaux d'optimisation énergétique, vous pouvez bénéficier d'aides financières importantes et réduire vos factures énergétiques.
                </p>
              </article>

              <article className="border border-slate-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-slate-900 mb-3">
                  Combien de temps dure un accompagnement complet ?
                </h3>
                <p className="text-slate-600">
                  La durée varie selon la complexité de votre situation. Un audit fiscal prend généralement 2-4 semaines, tandis qu'un accompagnement CEE peut s'étendre sur 3-6 mois selon l'ampleur des travaux.
                </p>
              </article>

              <article className="border border-slate-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-slate-900 mb-3">
                  Vos services sont-ils adaptés aux PME ?
                </h3>
                <p className="text-slate-600">
                  Absolument ! Nos services sont spécialement conçus pour les PME et TPE. Nous proposons des solutions sur mesure adaptées à votre taille d'entreprise et à vos besoins spécifiques.
                </p>
              </article>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 bg-blue-600">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
              Prêt à optimiser votre performance ?
            </h2>
            <p className="text-xl text-blue-100 mb-8">
              Rejoignez les centaines d'entreprises qui nous font confiance
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" variant="secondary">
                Démarrer maintenant
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <Button size="lg" variant="outline" className="text-white border-white hover:bg-white hover:text-blue-600">
                Contacter un expert
              </Button>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="bg-slate-900 text-white py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid md:grid-cols-4 gap-8">
              <div>
                <h3 className="text-lg font-semibold mb-4">Profitum</h3>
                <p className="text-slate-400 mb-4">
                  Plateforme innovante de gestion financière et fiscale pour entreprises.
                </p>
                <div className="flex space-x-4">
                  <Phone className="w-4 h-4" />
                  <Mail className="w-4 h-4" />
                  <MapPin className="w-4 h-4" />
                </div>
              </div>
              
              <div>
                <h4 className="text-lg font-semibold mb-4">Services</h4>
                <ul className="space-y-2 text-slate-400">
                  <li>Audit Fiscal</li>
                  <li>Audit Énergétique</li>
                  <li>Conseil Financier</li>
                  <li>Optimisation Fiscale</li>
                </ul>
              </div>
              
              <div>
                <h4 className="text-lg font-semibold mb-4">Entreprise</h4>
                <ul className="space-y-2 text-slate-400">
                  <li>À propos</li>
                  <li>Notre équipe</li>
                  <li>Carrières</li>
                  <li>Contact</li>
                </ul>
              </div>
              
              <div>
                <h4 className="text-lg font-semibold mb-4">Légal</h4>
                <ul className="space-y-2 text-slate-400">
                  <li>Mentions légales</li>
                  <li>Politique de confidentialité</li>
                  <li>CGU</li>
                  <li>Cookies</li>
                </ul>
              </div>
            </div>
            
            <div className="border-t border-slate-800 mt-12 pt-8 text-center text-slate-400">
              <p>&copy; 2024 Profitum. Tous droits réservés.</p>
            </div>
          </div>
        </footer>
      </main>
    </>
  );
} 