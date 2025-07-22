import PublicHeader from '@/components/PublicHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ShieldCheck, Lock, Eye, Users, Database, Server } from "lucide-react";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <PublicHeader />
      
      <div className="max-w-4xl mx-auto px-6 py-16">
        <div className="mt-16"></div>
        
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="bg-blue-100 p-3 rounded-full">
              <ShieldCheck className="w-8 h-8 text-blue-600" />
            </div>
            <h1 className="text-4xl font-bold text-gray-900">Politique de Confidentialité</h1>
          </div>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Dernière mise à jour : {new Date().toLocaleDateString('fr-FR')}
          </p>
        </div>

        <div className="space-y-8">
          {/* Introduction */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Server className="w-5 h-5 text-blue-600" />
                Introduction
              </CardTitle>
            </CardHeader>
            <CardContent className="prose max-w-none">
              <p>
                Profitum ("nous", "notre", "nos") s'engage à protéger votre vie privée. 
                Cette politique de confidentialité explique comment nous collectons, utilisons, 
                stockons et protégeons vos informations personnelles lorsque vous utilisez 
                notre plateforme d'optimisation financière.
              </p>
            </CardContent>
          </Card>

          {/* Collecte des données */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="w-5 h-5 text-blue-600" />
                Informations que nous collectons
              </CardTitle>
            </CardHeader>
            <CardContent className="prose max-w-none">
              <h4>Informations que vous nous fournissez :</h4>
              <ul>
                <li>Informations de compte (nom, email, numéro de téléphone)</li>
                <li>Informations professionnelles (entreprise, secteur d'activité)</li>
                <li>Documents et données financières que vous téléchargez</li>
                <li>Communications avec nos experts et notre équipe</li>
              </ul>
              
              <h4>Informations collectées automatiquement :</h4>
              <ul>
                <li>Données d'utilisation de la plateforme</li>
                <li>Informations techniques (adresse IP, type de navigateur)</li>
                <li>Cookies et technologies similaires</li>
                <li>Données de géolocalisation (si autorisé)</li>
              </ul>
            </CardContent>
          </Card>

          {/* Utilisation des données */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="w-5 h-5 text-blue-600" />
                Comment nous utilisons vos informations
              </CardTitle>
            </CardHeader>
            <CardContent className="prose max-w-none">
              <p>Nous utilisons vos informations pour :</p>
              <ul>
                <li>Fournir et améliorer nos services d'optimisation financière</li>
                <li>Connecter les entreprises aux experts appropriés</li>
                <li>Gérer votre compte et vos préférences</li>
                <li>Traiter les paiements et facturations</li>
                <li>Envoyer des communications importantes</li>
                <li>Assurer la sécurité et prévenir la fraude</li>
                <li>Respecter nos obligations légales</li>
              </ul>
            </CardContent>
          </Card>

          {/* Partage des données */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Server className="w-5 h-5 text-blue-600" />
                Partage de vos informations
              </CardTitle>
            </CardHeader>
            <CardContent className="prose max-w-none">
              <p>Nous ne vendons jamais vos informations personnelles. Nous pouvons partager vos données avec :</p>
              <ul>
                <li><strong>Experts partenaires :</strong> Pour vous connecter aux services appropriés</li>
                <li><strong>Prestataires de services :</strong> Pour le fonctionnement de notre plateforme</li>
                <li><strong>Autorités légales :</strong> Si requis par la loi</li>
                <li><strong>Parties avec votre consentement :</strong> Dans les cas où vous l'autorisez explicitement</li>
              </ul>
            </CardContent>
          </Card>

          {/* Sécurité */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="w-5 h-5 text-blue-600" />
                Sécurité de vos données
              </CardTitle>
            </CardHeader>
            <CardContent className="prose max-w-none">
              <p>Nous mettons en place des mesures de sécurité robustes pour protéger vos données :</p>
              <ul>
                <li>Chiffrement SSL/TLS pour toutes les transmissions</li>
                <li>Stockage sécurisé avec chiffrement au repos</li>
                <li>Accès limité aux données personnelles</li>
                <li>Surveillance continue de la sécurité</li>
                <li>Sauvegardes régulières et sécurisées</li>
                <li>Formation du personnel sur la protection des données</li>
              </ul>
            </CardContent>
          </Card>

          {/* Vos droits */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-blue-600" />
                Vos droits
              </CardTitle>
            </CardHeader>
            <CardContent className="prose max-w-none">
              <p>Conformément au RGPD, vous avez les droits suivants :</p>
              <ul>
                <li><strong>Droit d'accès :</strong> Consulter vos données personnelles</li>
                <li><strong>Droit de rectification :</strong> Corriger des données inexactes</li>
                <li><strong>Droit à l'effacement :</strong> Supprimer vos données</li>
                <li><strong>Droit à la portabilité :</strong> Récupérer vos données</li>
                <li><strong>Droit d'opposition :</strong> Vous opposer au traitement</li>
                <li><strong>Droit de limitation :</strong> Limiter le traitement</li>
              </ul>
            </CardContent>
          </Card>

          {/* Cookies */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="w-5 h-5 text-blue-600" />
                Cookies et technologies similaires
              </CardTitle>
            </CardHeader>
            <CardContent className="prose max-w-none">
              <p>Nous utilisons des cookies pour :</p>
              <ul>
                <li>Maintenir votre session connectée</li>
                <li>Mémoriser vos préférences</li>
                <li>Analyser l'utilisation de notre site</li>
                <li>Améliorer nos services</li>
              </ul>
              <p>Vous pouvez contrôler l'utilisation des cookies via les paramètres de votre navigateur.</p>
            </CardContent>
          </Card>

          {/* Intégration Google Calendar */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Server className="w-5 h-5 text-blue-600" />
                Intégration Google Calendar
              </CardTitle>
            </CardHeader>
            <CardContent className="prose max-w-none">
              <p>Lorsque vous utilisez l'intégration Google Calendar :</p>
              <ul>
                <li>Nous accédons à vos calendriers Google avec votre autorisation</li>
                <li>Nous synchronisons les événements entre Profitum et Google Calendar</li>
                <li>Nous ne partageons pas vos données de calendrier avec des tiers</li>
                <li>Vous pouvez révoquer l'accès à tout moment</li>
                <li>Vos données de calendrier sont chiffrées et sécurisées</li>
              </ul>
            </CardContent>
          </Card>

          {/* Contact */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-600" />
                Nous contacter
              </CardTitle>
            </CardHeader>
            <CardContent className="prose max-w-none">
              <p>Pour toute question concernant cette politique de confidentialité :</p>
              <ul>
                <li><strong>Email :</strong> privacy@profitum.app</li>
                <li><strong>Adresse :</strong> Profitum SAS, [Adresse complète]</li>
                <li><strong>Téléphone :</strong> +33 1 23 45 67 89</li>
              </ul>
              <p>Notre délégué à la protection des données (DPO) est disponible pour répondre à vos questions.</p>
            </CardContent>
          </Card>

          {/* Modifications */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-blue-600" />
                Modifications de cette politique
              </CardTitle>
            </CardHeader>
            <CardContent className="prose max-w-none">
              <p>
                Nous pouvons mettre à jour cette politique de confidentialité de temps à autre. 
                Les modifications importantes seront notifiées par email ou via notre plateforme. 
                Nous vous encourageons à consulter régulièrement cette page.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
} 