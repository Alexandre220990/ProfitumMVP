import { 
  CheckCircle, 
  Clock, 
  Mail, 
  Phone, 
  ArrowRight, 
  Users,
  TrendingUp,
  Shield,
  Award
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import PublicHeader from '@/components/PublicHeader';

const DemoConfirmation = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <PublicHeader />
      
      {/* Section principale */}
      <section className="relative pt-32 pb-20 overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-0 left-0 w-full h-full opacity-10">
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-green-500/20 rounded-full blur-3xl animate-pulse"></div>
            <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-blue-500/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
          </div>
        </div>

        <div className="relative z-10 max-w-4xl mx-auto px-6">
          <div className="text-center">
            {/* Badge de succès */}
            <div className="inline-flex items-center gap-3 bg-gradient-to-r from-green-600/20 to-emerald-600/20 backdrop-blur-xl border border-green-500/30 text-green-100 px-8 py-4 rounded-full text-sm font-medium mb-8">
              <CheckCircle className="w-5 h-5 text-green-400" />
              Demande envoyée avec succès !
            </div>
            
            {/* Titre principal */}
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-6 leading-tight">
              Merci pour votre{' '}
              <span className="bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
                intérêt !
              </span>
            </h1>
            
            {/* Message principal */}
            <p className="text-xl md:text-2xl text-gray-300 mb-12 max-w-3xl mx-auto leading-relaxed">
              Votre demande a été transmise à notre équipe. Nous vous recontacterons dans les{' '}
              <span className="text-white font-semibold">24-48h</span> pour organiser une présentation 
              personnalisée de la plateforme Profitum.
            </p>

            {/* Informations importantes */}
            <Card className="bg-white/10 backdrop-blur-sm border-white/20 mb-12">
              <CardContent className="p-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="flex items-start space-x-4">
                    <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full flex items-center justify-center flex-shrink-0">
                      <Clock className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-white mb-2">Délai de réponse</h3>
                      <p className="text-gray-300">Nous vous recontacterons sous 24-48h pour organiser un créneau de présentation adapté à votre planning.</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-4">
                    <div className="w-12 h-12 bg-gradient-to-r from-green-600 to-emerald-600 rounded-full flex items-center justify-center flex-shrink-0">
                      <Mail className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-white mb-2">Contact par email</h3>
                      <p className="text-gray-300">Vous recevrez un email de notre équipe avec les détails de la présentation et les prochaines étapes.</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Prochaines étapes */}
            <div className="mb-12">
              <h2 className="text-2xl font-bold text-white mb-8">Prochaines étapes</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-white font-bold text-xl">1</span>
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">Contact de l'équipe</h3>
                  <p className="text-gray-300 text-sm">Notre équipe vous contacte pour organiser la présentation</p>
                </div>
                
                <div className="text-center">
                  <div className="w-16 h-16 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-white font-bold text-xl">2</span>
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">Présentation personnalisée</h3>
                  <p className="text-gray-300 text-sm">Découverte de la plateforme adaptée à vos besoins</p>
                </div>
                
                <div className="text-center">
                  <div className="w-16 h-16 bg-gradient-to-r from-green-600 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-white font-bold text-xl">3</span>
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">Intégration</h3>
                  <p className="text-gray-300 text-sm">Accès à la plateforme et début de collaboration</p>
                </div>
              </div>
            </div>

            {/* Avantages de la plateforme */}
            <div className="mb-12">
              <h2 className="text-2xl font-bold text-white mb-8">Ce qui vous attend</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card className="bg-white/10 backdrop-blur-sm border-white/20 text-center">
                  <CardContent className="p-6">
                    <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Users className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="text-lg font-semibold text-white mb-2">Clients qualifiés</h3>
                    <p className="text-gray-300 text-sm">Accédez à un réseau d'entreprises triées sur le volet</p>
                  </CardContent>
                </Card>
                
                <Card className="bg-white/10 backdrop-blur-sm border-white/20 text-center">
                  <CardContent className="p-6">
                    <div className="w-12 h-12 bg-gradient-to-r from-green-600 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
                      <TrendingUp className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="text-lg font-semibold text-white mb-2">Développement</h3>
                    <p className="text-gray-300 text-sm">Développez votre activité avec des outils performants</p>
                  </CardContent>
                </Card>
                
                <Card className="bg-white/10 backdrop-blur-sm border-white/20 text-center">
                  <CardContent className="p-6">
                    <div className="w-12 h-12 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Shield className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="text-lg font-semibold text-white mb-2">Sécurité</h3>
                    <p className="text-gray-300 text-sm">Plateforme sécurisée et conforme aux standards</p>
                  </CardContent>
                </Card>
                
                <Card className="bg-white/10 backdrop-blur-sm border-white/20 text-center">
                  <CardContent className="p-6">
                    <div className="w-12 h-12 bg-gradient-to-r from-yellow-600 to-orange-600 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Award className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="text-lg font-semibold text-white mb-2">Reconnaissance</h3>
                    <p className="text-gray-300 text-sm">Rejoignez l'élite des experts de la plateforme</p>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button 
                size="lg"
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-8 py-4 text-lg font-semibold rounded-full"
                onClick={() => window.location.href = '/'}
              >
                Retour à l'accueil
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
              
              <Button 
                variant="outline" 
                size="lg"
                className="border-white/20 text-white hover:bg-white/10 px-8 py-4 text-lg font-semibold rounded-full"
                onClick={() => window.open('mailto:contact@profitum.fr', '_blank')}
              >
                <Mail className="w-5 h-5 mr-2" />
                Nous contacter
              </Button>
            </div>

            {/* Informations de contact */}
            <div className="mt-12 pt-8 border-t border-white/10">
              <p className="text-gray-400 text-sm mb-4">
                Vous avez des questions ? N'hésitez pas à nous contacter :
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center text-sm text-gray-300">
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  <span>contact@profitum.fr</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4" />
                  <span>+33 1 23 45 67 89</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default DemoConfirmation; 