import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Clock, Mail, Phone, ArrowLeft, AlertCircle } from 'lucide-react';

export default function ValidationPending() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card className="shadow-lg border-0">
          <CardHeader className="text-center pb-4">
            <div className="mx-auto mb-4 w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center">
              <Clock className="w-8 h-8 text-orange-600" />
            </div>
            <CardTitle className="text-2xl font-bold text-gray-900">
              Validation en cours
            </CardTitle>
            <CardDescription className="text-gray-600 mt-2">
              Votre compte expert est en cours d'approbation par nos équipes
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Statut actuel */}
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-orange-600" />
                <div>
                  <p className="font-medium text-orange-900">Statut : En attente</p>
                  <p className="text-sm text-orange-700">
                    Notre équipe examine votre candidature
                  </p>
                </div>
              </div>
            </div>

            {/* Prochaines étapes */}
            <div className="space-y-3">
              <h3 className="font-semibold text-gray-900">Prochaines étapes :</h3>
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center">
                    <span className="text-xs font-medium text-gray-600">1</span>
                  </div>
                  <span className="text-sm text-gray-600">
                    Vérification de vos qualifications
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center">
                    <span className="text-xs font-medium text-gray-600">2</span>
                  </div>
                  <span className="text-sm text-gray-600">
                    Validation de vos documents
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center">
                    <span className="text-xs font-medium text-gray-600">3</span>
                  </div>
                  <span className="text-sm text-gray-600">
                    Notification par email
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
                    2-3 jours ouvrés pour la validation
                  </p>
                </div>
              </div>
            </div>

            {/* Contact */}
            <div className="space-y-3">
              <h3 className="font-semibold text-gray-900">Besoin d'aide ?</h3>
              <div className="space-y-2">
                <div className="flex items-center gap-3 text-sm text-gray-600">
                  <Mail className="w-4 h-4" />
                  <span>contact@profitum.app</span>
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
                <Link to="/connexion-expert">
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
                Vous recevrez un email dès que votre compte sera validé.
                <br />
                En cas de question, n'hésitez pas à nous contacter.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
