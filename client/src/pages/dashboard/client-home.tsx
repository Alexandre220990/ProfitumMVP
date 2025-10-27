import React from 'react';
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import { User, Briefcase, MessageSquare, Settings, BarChart3, ArrowRight } from "lucide-react";

export default function ClientHome() {
  const { user } = useAuth();
  const { id: urlId } = useParams();
  const navigate = useNavigate();

  // Redirection si un client tente d'accéder à un autre dashboard
  React.useEffect(() => {
    if (user?.type === 'client' && urlId && urlId !== user.id) {
      console.warn('⚠️ Client tentant d\'accéder à un autre dashboard, redirection vers son propre dashboard');
      navigate(`/dashboard/client-home/${user.id}`);
    }
  }, [user, urlId, navigate]);

  const dashboardCards = [
    {
      title: 'Dashboard Principal',
      description: 'Vue d\'ensemble de vos dossiers et simulations',
      icon: BarChart3,
      path: `/dashboard/client/${user?.id}`,
      color: 'bg-blue-500',
      features: ['Dossiers clients', 'Suivi des produits', 'Simulations', 'KPIs']
    }
  ];

  const quickActions = [
    {
      title: 'Messagerie',
      description: 'Communiquez avec vos experts',
      icon: MessageSquare,
      path: '/messagerie-client',
      color: 'bg-purple-500'
    },
    {
      title: 'Documents',
      description: 'Accédez à vos documents',
      icon: Briefcase,
      path: '/documents-client',
      color: 'bg-orange-500'
    },
    {
      title: 'Profil',
      description: 'Gérez vos informations',
      icon: User,
      path: '/profile/client',
      color: 'bg-indigo-500'
    },
    {
      title: 'Paramètres',
      description: 'Configurez vos préférences',
      icon: Settings,
      path: '/settings',
      color: 'bg-gray-500'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Bienvenue, {user?.username || 'Client'}
          </h1>
          <p className="text-gray-600">
            Accédez à vos différents tableaux de bord et outils
          </p>
        </div>

        {/* Dashboard principal */}
        <div className="mb-12">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">
            Tableau de bord
          </h2>
          <div className="grid grid-cols-1 gap-6">
            {dashboardCards.map((card) => {
              const IconComponent = card.icon;
              return (
                <Card key={card.title} className="hover:shadow-lg transition-shadow cursor-pointer"
                      onClick={() => navigate(card.path)}>
                  <CardHeader className="pb-4">
                    <div className="flex items-center justify-between">
                      <div className={`p-3 rounded-lg ${card.color} text-white`}>
                        <IconComponent className="h-6 w-6" />
                      </div>
                      <ArrowRight className="h-5 w-5 text-gray-400" />
                    </div>
                    <CardTitle className="text-xl">{card.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600 mb-4">{card.description}</p>
                    <div className="space-y-2">
                      {card.features.map((feature) => (
                        <div key={feature} className="flex items-center text-sm text-gray-500">
                          <div className="w-1.5 h-1.5 bg-gray-400 rounded-full mr-2"></div>
                          {feature}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Actions rapides */}
        <div className="mb-12">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">
            Actions rapides
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {quickActions.map((action) => {
              const IconComponent = action.icon;
              return (
                <Card key={action.title} className="hover:shadow-md transition-shadow cursor-pointer"
                      onClick={() => navigate(action.path)}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className={`p-2 rounded-lg ${action.color} text-white`}>
                        <IconComponent className="h-5 w-5" />
                      </div>
                      <ArrowRight className="h-4 w-4 text-gray-400" />
                    </div>
                    <h3 className="font-semibold text-gray-900 mb-2">{action.title}</h3>
                    <p className="text-sm text-gray-600">{action.description}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Statistiques rapides */}
        <div className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">
            Aperçu rapide
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Briefcase className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Dossiers actifs</p>
                    <p className="text-2xl font-bold text-gray-900">-</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <MessageSquare className="h-6 w-6 text-purple-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Messages</p>
                    <p className="text-2xl font-bold text-gray-900">-</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
} 