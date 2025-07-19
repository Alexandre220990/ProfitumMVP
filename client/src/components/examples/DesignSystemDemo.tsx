import React from 'react';
import { 
  Button, 
  ButtonWithIcon, 
  LoadingButton, 
  SubmitButton, 
  CancelButton, 
  DeleteButton, 
  SuccessButton 
} from '@/components/ui/design-system/Button';
import { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardDescription, 
  CardContent, 
  CardFooter,
  ImageCard,
  IconCard,
  StatCard,
  NavigationCard
} from '@/components/ui/design-system/Card';
import { 
  Badge, 
  BadgeWithIcon, 
  StatusBadge, 
  NotificationBadge, 
  CategoryBadge, 
  PriorityBadge, 
  VersionBadge, 
  BadgeGroup 
} from '@/components/ui/design-system/Badge';
import { 
  Calculator, 
  TrendingUp, 
  ShieldCheck, 
  Users, 
  DollarSign, 
  CheckCircle, 
  AlertCircle,
  Clock,
  Star
} from 'lucide-react';

// ============================================================================
// COMPOSANT DE DÉMONSTRATION
// ============================================================================

export default function DesignSystemDemo() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 p-8">
      <div className="max-w-7xl mx-auto space-y-12">
        
        {/* Header */}
        <div className="text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4">
            Design System <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">FinancialTracker</span>
          </h1>
          <p className="text-xl text-slate-600 max-w-3xl mx-auto">
            Composants UI modernes et cohérents basés sur le style de la home page
          </p>
        </div>

        {/* Section Boutons */}
        <section className="space-y-6">
          <h2 className="text-3xl font-bold text-slate-900 mb-6">Boutons</h2>
          
          <Card>
            <CardHeader>
              <CardTitle>Variantes de boutons</CardTitle>
              <CardDescription>Différents styles de boutons disponibles</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-4">
                <Button variant="primary">Bouton Principal</Button>
                <Button variant="secondary">Bouton Secondaire</Button>
                <Button variant="ghost">Bouton Fantôme</Button>
                <Button variant="success">Bouton Succès</Button>
                <Button variant="error">Bouton Erreur</Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Boutons avec icônes</CardTitle>
              <CardDescription>Boutons avec icônes et états de chargement</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-4">
                <ButtonWithIcon icon={<Calculator className="w-4 h-4" />}>
                  Calculer
                </ButtonWithIcon>
                <ButtonWithIcon icon={<TrendingUp className="w-4 h-4" />}>
                  Analyser
                </ButtonWithIcon>
                <LoadingButton>Chargement...</LoadingButton>
                <SubmitButton>Envoyer</SubmitButton>
                <CancelButton />
                <DeleteButton />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Tailles de boutons</CardTitle>
              <CardDescription>Différentes tailles disponibles</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap items-center gap-4">
                <Button size="sm">Petit</Button>
                <Button size="md">Moyen</Button>
                <Button size="lg">Grand</Button>
                <Button size="xl">Très grand</Button>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Section Cartes */}
        <section className="space-y-6">
          <h2 className="text-3xl font-bold text-slate-900 mb-6">Cartes</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Carte Standard</CardTitle>
                <CardDescription>Une carte simple avec contenu</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600">
                  Contenu de la carte avec du texte descriptif.
                </p>
              </CardContent>
              <CardFooter>
                <Button size="sm">Action</Button>
              </CardFooter>
            </Card>

            <Card variant="glass">
              <CardHeader>
                <CardTitle>Carte Glass</CardTitle>
                <CardDescription>Effet de verre avec backdrop blur</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600">
                  Effet moderne avec transparence et flou.
                </p>
              </CardContent>
            </Card>

            <Card variant="dark">
              <CardHeader>
                <CardTitle>Carte Sombre</CardTitle>
                <CardDescription>Thème sombre pour contraste</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-slate-300">
                  Parfaite pour les sections importantes.
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard
              title="Revenus"
              value="€125,000"
              change="+12.5%"
              trend="up"
              icon={<DollarSign className="w-4 h-4" />}
            />
            
            <StatCard
              title="Clients"
              value="1,234"
              change="+8.2%"
              trend="up"
              icon={<Users className="w-4 h-4" />}
            />
            
            <StatCard
              title="Taux de conversion"
              value="15.8%"
              change="-2.1%"
              trend="down"
              icon={<TrendingUp className="w-4 h-4" />}
            />
            
            <StatCard
              title="Satisfaction"
              value="4.9/5"
              change="+0.3"
              trend="up"
              icon={<Star className="w-4 h-4" />}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <IconCard
              icon={<ShieldCheck className="w-6 h-6" />}
              title="Sécurité Garantie"
              description="Vos données sont protégées avec les meilleures pratiques de sécurité."
            />
            
            <NavigationCard
              title="Dashboard Principal"
              description="Accédez à toutes vos données et analyses"
              icon={<TrendingUp className="w-6 h-6" />}
              onClick={() => console.log('Navigation vers dashboard')}
            />
          </div>
        </section>

        {/* Section Badges */}
        <section className="space-y-6">
          <h2 className="text-3xl font-bold text-slate-900 mb-6">Badges</h2>
          
          <Card>
            <CardHeader>
              <CardTitle>Variantes de badges</CardTitle>
              <CardDescription>Différents types de badges disponibles</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-4">
                <Badge variant="primary">Primaire</Badge>
                <Badge variant="success">Succès</Badge>
                <Badge variant="warning">Avertissement</Badge>
                <Badge variant="error">Erreur</Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Badges spécialisés</CardTitle>
              <CardDescription>Badges avec fonctionnalités avancées</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <h4 className="font-semibold mb-3">Badges de statut</h4>
                  <div className="flex flex-wrap gap-3">
                    <StatusBadge status="online">En ligne</StatusBadge>
                    <StatusBadge status="offline">Hors ligne</StatusBadge>
                    <StatusBadge status="away">Absent</StatusBadge>
                    <StatusBadge status="busy">Occupé</StatusBadge>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold mb-3">Badges de catégorie</h4>
                  <div className="flex flex-wrap gap-3">
                    <CategoryBadge category="Finance" />
                    <CategoryBadge category="Legal" />
                    <CategoryBadge category="Marketing" />
                    <CategoryBadge category="Technology" />
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold mb-3">Badges de priorité</h4>
                  <div className="flex flex-wrap gap-3">
                    <PriorityBadge priority="low">Faible</PriorityBadge>
                    <PriorityBadge priority="medium">Moyenne</PriorityBadge>
                    <PriorityBadge priority="high">Élevée</PriorityBadge>
                    <PriorityBadge priority="urgent">Urgente</PriorityBadge>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold mb-3">Badges de notification</h4>
                  <div className="flex flex-wrap gap-3">
                    <NotificationBadge count={5} />
                    <NotificationBadge count={12} />
                    <NotificationBadge count={150} />
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold mb-3">Badges de version</h4>
                  <div className="flex flex-wrap gap-3">
                    <VersionBadge version="1.0.0" type="stable" />
                    <VersionBadge version="2.0.0" type="beta" />
                    <VersionBadge version="3.0.0" type="alpha" />
                    <VersionBadge version="dev" type="dev" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Groupe de badges</CardTitle>
              <CardDescription>Organisation de plusieurs badges</CardDescription>
            </CardHeader>
            <CardContent>
              <BadgeGroup gap="md">
                <BadgeWithIcon icon={<CheckCircle className="w-3 h-3" />}>
                  Validé
                </BadgeWithIcon>
                <BadgeWithIcon icon={<Clock className="w-3 h-3" />}>
                  En cours
                </BadgeWithIcon>
                <BadgeWithIcon icon={<AlertCircle className="w-3 h-3" />}>
                  Attention
                </BadgeWithIcon>
              </BadgeGroup>
            </CardContent>
          </Card>
        </section>

        {/* Section Utilisation */}
        <section className="space-y-6">
          <h2 className="text-3xl font-bold text-slate-900 mb-6">Exemple d'utilisation</h2>
          
          <Card>
            <CardHeader>
              <CardTitle>Interface de tableau de bord</CardTitle>
              <CardDescription>Exemple d'utilisation dans un contexte réel</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <StatCard
                  title="Audits en cours"
                  value="23"
                  change="+5 cette semaine"
                  trend="up"
                  icon={<ShieldCheck className="w-4 h-4" />}
                />
                <StatCard
                  title="Économies réalisées"
                  value="€45,230"
                  change="+12.3%"
                  trend="up"
                  icon={<DollarSign className="w-4 h-4" />}
                />
                <StatCard
                  title="Taux de réussite"
                  value="94.2%"
                  change="+2.1%"
                  trend="up"
                  icon={<CheckCircle className="w-4 h-4" />}
                />
              </div>
              
              <div className="flex flex-wrap gap-4">
                <ButtonWithIcon icon={<Calculator className="w-4 h-4" />}>
                  Nouvelle simulation
                </ButtonWithIcon>
                <Button variant="secondary">
                  Voir les rapports
                </Button>
                <Button variant="ghost">
                  Paramètres
                </Button>
              </div>
              
              <div className="mt-6">
                <BadgeGroup gap="sm">
                  <StatusBadge status="completed">Terminé</StatusBadge>
                  <CategoryBadge category="Finance" />
                  <PriorityBadge priority="high">Priorité élevée</PriorityBadge>
                </BadgeGroup>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Footer */}
        <div className="text-center py-8">
          <p className="text-slate-600">
            Design System créé pour FinancialTracker - Basé sur le style de la home page
          </p>
        </div>
      </div>
    </div>
  );
} 