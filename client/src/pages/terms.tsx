import PublicHeader from '@/components/PublicHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, Shield, Users, CreditCard, AlertTriangle, CheckCircle } from 'lucide-react';

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <PublicHeader />
      
      <div className="max-w-4xl mx-auto px-6 py-16">
        <div className="mt-16"></div>
        
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="bg-blue-100 p-3 rounded-full">
              <FileText className="w-8 h-8 text-blue-600" />
            </div>
            <h1 className="text-4xl font-bold text-gray-900">Conditions d'Utilisation</h1>
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
                <FileText className="w-5 h-5 text-blue-600" />
                Introduction
              </CardTitle>
            </CardHeader>
            <CardContent className="prose max-w-none">
              <p>
                Ces conditions d'utilisation ("Conditions") régissent votre utilisation de la plateforme 
                Profitum ("Service") fournie par Profitum SAS ("nous", "notre", "nos"). 
                En utilisant notre Service, vous acceptez d'être lié par ces Conditions.
              </p>
              <p>
                <strong>Important :</strong> Veuillez lire attentivement ces Conditions avant d'utiliser notre Service. 
                Si vous n'acceptez pas ces Conditions, veuillez ne pas utiliser notre Service.
              </p>
            </CardContent>
          </Card>

          {/* Définitions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-600" />
                Définitions
              </CardTitle>
            </CardHeader>
            <CardContent className="prose max-w-none">
              <ul>
                <li><strong>"Service"</strong> : La plateforme Profitum et tous ses composants</li>
                <li><strong>"Utilisateur"</strong> : Toute personne utilisant le Service</li>
                <li><strong>"Client"</strong> : Entreprise utilisant nos services d'optimisation</li>
                <li><strong>"Expert"</strong> : Professionnel partenaire fournissant des services</li>
                <li><strong>"Contenu"</strong> : Toutes les données, informations et documents</li>
                <li><strong>"Compte"</strong> : Votre profil utilisateur sur la plateforme</li>
              </ul>
            </CardContent>
          </Card>

          {/* Acceptation des conditions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-blue-600" />
                Acceptation des Conditions
              </CardTitle>
            </CardHeader>
            <CardContent className="prose max-w-none">
              <p>En utilisant notre Service, vous confirmez que :</p>
              <ul>
                <li>Vous avez lu et compris ces Conditions</li>
                <li>Vous acceptez d'être lié par ces Conditions</li>
                <li>Vous avez la capacité légale d'accepter ces Conditions</li>
                <li>Vous êtes âgé d'au moins 18 ans ou avez l'autorisation parentale</li>
                <li>Vous utiliserez le Service conformément à ces Conditions</li>
              </ul>
            </CardContent>
          </Card>

          {/* Description du service */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-600" />
                Description du Service
              </CardTitle>
            </CardHeader>
            <CardContent className="prose max-w-none">
              <p>Profitum est une plateforme d'optimisation financière qui :</p>
              <ul>
                <li>Connecte les entreprises aux experts financiers qualifiés</li>
                <li>Facilite l'optimisation fiscale et sociale</li>
                <li>Gère les dossiers et documents administratifs</li>
                <li>Fournit des outils de simulation et d'analyse</li>
                <li>Intègre des calendriers et systèmes de messagerie</li>
                <li>Offre un suivi en temps réel des projets</li>
              </ul>
            </CardContent>
          </Card>

          {/* Création de compte */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-blue-600" />
                Création et Gestion de Compte
              </CardTitle>
            </CardHeader>
            <CardContent className="prose max-w-none">
              <h4>Obligations lors de la création de compte :</h4>
              <ul>
                <li>Fournir des informations exactes et à jour</li>
                <li>Protéger vos identifiants de connexion</li>
                <li>Notifier immédiatement toute utilisation non autorisée</li>
                <li>Maintenir la confidentialité de votre compte</li>
                <li>Ne pas partager votre compte avec des tiers</li>
              </ul>
              
              <h4>Nous nous réservons le droit de :</h4>
              <ul>
                <li>Refuser la création d'un compte</li>
                <li>Suspendre ou fermer un compte en cas de violation</li>
                <li>Demander une vérification d'identité</li>
                <li>Limiter l'accès au Service si nécessaire</li>
              </ul>
            </CardContent>
          </Card>

          {/* Utilisation acceptable */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-blue-600" />
                Utilisation Acceptable
              </CardTitle>
            </CardHeader>
            <CardContent className="prose max-w-none">
              <p>Vous vous engagez à utiliser le Service uniquement pour :</p>
              <ul>
                <li>Des activités légales et légitimes</li>
                <li>L'optimisation financière de votre entreprise</li>
                <li>La communication professionnelle avec nos experts</li>
                <li>La gestion de vos dossiers administratifs</li>
              </ul>
              
              <h4>Utilisations interdites :</h4>
              <ul>
                <li>Activités illégales ou frauduleuses</li>
                <li>Violation des droits de propriété intellectuelle</li>
                <li>Harcèlement ou comportement abusif</li>
                <li>Tentative de piratage ou d'accès non autorisé</li>
                <li>Transmission de virus ou logiciels malveillants</li>
                <li>Utilisation commerciale non autorisée</li>
              </ul>
            </CardContent>
          </Card>

          {/* Contenu utilisateur */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-600" />
                Contenu Utilisateur
              </CardTitle>
            </CardHeader>
            <CardContent className="prose max-w-none">
              <h4>Vous conservez vos droits sur votre contenu :</h4>
              <ul>
                <li>Vous gardez la propriété de vos documents</li>
                <li>Vous accordez une licence limitée pour l'utilisation du Service</li>
                <li>Vous êtes responsable du contenu que vous partagez</li>
                <li>Vous garantissez que votre contenu ne viole pas les droits d'autrui</li>
              </ul>
              
              <h4>Nos obligations :</h4>
              <ul>
                <li>Protéger la confidentialité de votre contenu</li>
                <li>Ne pas utiliser votre contenu à des fins commerciales</li>
                <li>Supprimer votre contenu sur demande</li>
                <li>Respecter les paramètres de confidentialité</li>
              </ul>
            </CardContent>
          </Card>

          {/* Paiements et facturation */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-blue-600" />
                Paiements et Facturation
              </CardTitle>
            </CardHeader>
            <CardContent className="prose max-w-none">
              <h4>Conditions de paiement :</h4>
              <ul>
                <li>Les prix sont exprimés en euros (€) TTC</li>
                <li>Les paiements sont dus à la commande</li>
                <li>Nous acceptons les cartes bancaires et virements</li>
                <li>Les factures sont émises automatiquement</li>
                <li>Pas de remboursement en cas d'utilisation du service</li>
              </ul>
              
              <h4>Modifications tarifaires :</h4>
              <ul>
                <li>Nous pouvons modifier nos tarifs avec préavis</li>
                <li>Les modifications seront notifiées par email</li>
                <li>Les tarifs en cours restent valables pour les commandes existantes</li>
              </ul>
            </CardContent>
          </Card>

          {/* Propriété intellectuelle */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-blue-600" />
                Propriété Intellectuelle
              </CardTitle>
            </CardHeader>
            <CardContent className="prose max-w-none">
              <h4>Nos droits :</h4>
              <ul>
                <li>Nous conservons tous les droits sur la plateforme</li>
                <li>Le code source et l'interface sont protégés</li>
                <li>La marque "Profitum" est notre propriété</li>
                <li>Les améliorations appartiennent à Profitum</li>
              </ul>
              
              <h4>Licence d'utilisation :</h4>
              <ul>
                <li>Nous vous accordons une licence limitée et révocable</li>
                <li>Cette licence est non-exclusive et non-transférable</li>
                <li>Vous ne pouvez pas copier, modifier ou redistribuer</li>
                <li>L'utilisation commerciale est autorisée selon ces Conditions</li>
              </ul>
            </CardContent>
          </Card>

          {/* Confidentialité */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-blue-600" />
                Confidentialité
              </CardTitle>
            </CardHeader>
            <CardContent className="prose max-w-none">
              <p>
                La protection de vos données personnelles est importante pour nous. 
                Notre politique de confidentialité détaille comment nous collectons, 
                utilisons et protégeons vos informations.
              </p>
              <p>
                <strong>Lien vers notre politique de confidentialité :</strong>
                <a href="/privacy" className="text-blue-600 hover:text-blue-800 ml-2">
                  https://profitum.app/privacy
                </a>
              </p>
            </CardContent>
          </Card>

          {/* Limitation de responsabilité */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-blue-600" />
                Limitation de Responsabilité
              </CardTitle>
            </CardHeader>
            <CardContent className="prose max-w-none">
              <h4>Exclusions de responsabilité :</h4>
              <ul>
                <li>Nous ne garantissons pas l'exactitude des simulations</li>
                <li>Les résultats dépendent de la qualité des données fournies</li>
                <li>Nous ne sommes pas responsables des décisions prises</li>
                <li>Les conseils des experts sont de leur seule responsabilité</li>
                <li>Nous ne garantissons pas la disponibilité continue du Service</li>
              </ul>
              
              <h4>Limitation de dommages :</h4>
              <ul>
                <li>Notre responsabilité est limitée au montant payé</li>
                <li>Nous ne sommes pas responsables des dommages indirects</li>
                <li>Les limitations s'appliquent dans toute la mesure permise par la loi</li>
              </ul>
            </CardContent>
          </Card>

          {/* Résiliation */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-blue-600" />
                Résiliation
              </CardTitle>
            </CardHeader>
            <CardContent className="prose max-w-none">
              <h4>Résiliation par l'utilisateur :</h4>
              <ul>
                <li>Vous pouvez fermer votre compte à tout moment</li>
                <li>La résiliation prend effet immédiatement</li>
                <li>Vos données seront supprimées selon notre politique</li>
              </ul>
              
              <h4>Résiliation par Profitum :</h4>
              <ul>
                <li>Nous pouvons résilier en cas de violation des Conditions</li>
                <li>Un préavis sera donné sauf en cas de violation grave</li>
                <li>La résiliation n'affecte pas les obligations antérieures</li>
              </ul>
            </CardContent>
          </Card>

          {/* Droit applicable */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-600" />
                Droit Applicable et Juridiction
              </CardTitle>
            </CardHeader>
            <CardContent className="prose max-w-none">
              <ul>
                <li>Ces Conditions sont régies par le droit français</li>
                <li>Les tribunaux français sont seuls compétents</li>
                <li>En cas de litige, nous privilégions la médiation</li>
                <li>Si une clause est invalide, les autres restent valides</li>
              </ul>
            </CardContent>
          </Card>

          {/* Contact */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-600" />
                Contact
              </CardTitle>
            </CardHeader>
            <CardContent className="prose max-w-none">
              <p>Pour toute question concernant ces Conditions :</p>
              <ul>
                <li><strong>Email :</strong> legal@profitum.app</li>
                <li><strong>Adresse :</strong> Profitum SAS, [Adresse complète]</li>
                <li><strong>Téléphone :</strong> +33 1 23 45 67 89</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
} 