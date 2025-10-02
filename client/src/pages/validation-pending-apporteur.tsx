import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Clock, Mail, Phone, ArrowLeft, CheckCircle, AlertCircle, Users } from 'lucide-react';

export default function ValidationPendingApporteur() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card className="shadow-lg border-0">
          <CardHeader className="text-center pb-4">
            <div className="mx-auto mb-4 w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center">
              <Users className="w-8 h-8 text-purple-600" />
            </div>
            <CardTitle className="text-2xl font-bold text-gray-900">
              Candidature en cours
            </CardTitle>
            <CardDescription className="text-gray-600 mt-2">
              Votre candidature d'apporteur d'affaires est en cours d'examen
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Statut actuel */}
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-purple-600" />
                <div>
                  <p className="font-medium text-purple-900">Statut : Candidature</p>
                  <p className="text-sm text-purple-700">
                    Notre équipe examine votre profil d'apporteur
                  </p>
                </div>
              </div>
            </div>

            {/* Processus de validation */}
            <div className="space-y-3">
              <h3 className="font-semibold text-gray-900">Processus de validation :</h3>
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center">
                    <span className="text-xs font-medium text-gray-600">1</span>
                  </div>
                  <span className="text-sm text-gray-600">
                    Vérification de votre profil professionnel
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center">
                    <span className="text-xs font-medium text-gray-600">2</span>
                  </div>
                  <span className="text-sm text-gray-600">
                    Validation de vos documents d'entreprise
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center">
                    <span className="text-xs font-medium text-gray-600">3</span>
                  </div>
                  <span className="text-sm text-gray-600">
                    Entretien avec notre équipe commerciale
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center">
                    <span className="text-xs font-medium text-gray-600">4</span>
                  </div>
                  <span className="text-sm text-gray-600">
                    Notification de votre statut final
                  </span>
                </div>
              </div>
            </div>

            {/* Délai moyen */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-blue-600" />
                <div>
                  <p className="font-medium text-blue-900">Délai moyen</p>
                  <p className="text-sm text-blue-700">
                    3-5 jours ouvrés pour la validation complète
                  </p>
                </div>
              </div>
            </div>

            {/* Avantages une fois validé */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center gap-3 mb-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <h4 className="font-medium text-green-900">Une fois validé, vous pourrez :</h4>
              </div>
              <ul className="space-y-1 text-sm text-green-700">
                <li>• Recommander des clients sur la plateforme</li>
                <li>• Suivre vos prospects et commissions</li>
                <li>• Accéder à votre dashboard apporteur</li>
                <li>• Bénéficier de notre support commercial</li>
              </ul>
            </div>

            {/* Contact */}
            <div className="space-y-3">
              <h3 className="font-semibold text-gray-900">Besoin d'aide ?</h3>
              <div className="space-y-2">
                <div className="flex items-center gap-3 text-sm text-gray-600">
                  <Mail className="w-4 h-4" />
                  <span>apporteurs@profitum.app</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-gray-600">
                  <Phone className="w-4 h-4" />
                  <span>01 23 45 67 89</span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-3 pt-4">
              <Button asChild className="w-full">
                <Link to="/connexion-apporteur">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Retour à la connexion
                </Link>
              </Button>
              
              <Button variant="outline" asChild className="w-full">
                <Link to="/home">
                  Retour à l'accueil
                </Link>
              </Button>
            </div>

            {/* Information complémentaire */}
            <div className="text-xs text-gray-500 text-center pt-4 border-t">
              <p>
                Vous recevrez un email dès que votre candidature sera validée.
                <br />
                Notre équipe commerciale peut vous contacter pour un entretien.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
