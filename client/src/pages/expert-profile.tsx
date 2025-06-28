import React from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Star, Building2, Award, Clock, Percent } from "lucide-react";

const ExpertProfile = () => {
  const { id } = useParams();

  // Données de démonstration pour Jean Dupont
  const expertData = {
    id: "1",
    name: "Jean Dupont",
    company: "Cabinet Fiscal Plus",
    specializations: ["TICPE", "CIR"],
    experience: 15,
    description: "Expert reconnu en optimisation fiscale avec une expertise particulière en TICPE",
    rating: 4.8,
    commission: 15,
    location: "Paris, France",
    completedAudits: 150,
    successRate: 95
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6 pt-28">
      <div className="max-w-4xl mx-auto">
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-2xl">{expertData.name}</CardTitle>
              <div className="flex items-center gap-2">
                <Star className="h-5 w-5 text-yellow-400" />
                <span className="text-lg font-semibold">{expertData.rating}/5</span>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-gray-500" />
                  <span className="text-lg">{expertData.company}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-gray-500" />
                  <span className="text-lg">{expertData.experience} ans d'expérience</span>
                </div>
                <div className="flex items-center gap-2">
                  <Percent className="h-5 w-5 text-gray-500" />
                  <span className="text-lg">Commission : {expertData.commission}%</span>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">Spécialisations</h3>
                  <div className="flex flex-wrap gap-2">
                    {expertData.specializations.map((spec, index) => (
                      <Badge key={index} variant="secondary">
                        {spec}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Description</h3>
                  <p className="text-gray-600">{expertData.description}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5" />
                Statistiques
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-500">Audits complétés</p>
                  <p className="text-2xl font-bold">{expertData.completedAudits}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Taux de réussite</p>
                  <p className="text-2xl font-bold">{expertData.successRate}%</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Localisation</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-lg">{expertData.location}</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ExpertProfile; 