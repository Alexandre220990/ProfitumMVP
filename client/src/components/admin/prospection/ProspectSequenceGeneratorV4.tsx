/**
 * Composant principal de génération de séquences V4
 * Intègre : Enrichissement complet, Ajustement automatique, Génération optimisée
 */

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Sparkles, Mail, AlertCircle, CheckCircle2, Zap } from 'lucide-react';
import { EnrichmentDisplayV4 } from './EnrichmentDisplayV4';
import { SequenceAdjustmentPanel } from './SequenceAdjustmentPanel';
import axios from 'axios';

interface Prospect {
  id?: string;
  email: string;
  firstname?: string;
  lastname?: string;
  company_name?: string;
  siren?: string;
  naf_code?: string;
  naf_label?: string;
  job_title?: string;
  company_website?: string;
  linkedin_company?: string;
  linkedin_profile?: string;
}

interface ProspectSequenceGeneratorV4Props {
  prospect: Prospect;
  onSequenceGenerated?: (sequence: any) => void;
  onClose?: () => void;
}

export const ProspectSequenceGeneratorV4: React.FC<ProspectSequenceGeneratorV4Props> = ({
  prospect,
  onSequenceGenerated,
  onClose
}) => {
  const [context, setContext] = useState('');
  const [defaultNumEmails, setDefaultNumEmails] = useState(3);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);
  const [showResult, setShowResult] = useState(false);

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);

    try {
      console.log('🚀 Génération séquence V4 pour:', prospect.company_name || prospect.email);

      const response = await axios.post('/api/prospects/generate-optimal-sequence-v4', {
        prospectInfo: prospect,
        context: context.trim() || undefined,
        defaultNumEmails
      });

      if (response.data.success) {
        setResult(response.data.data);
        setShowResult(true);
        
        if (onSequenceGenerated) {
          onSequenceGenerated(response.data.data.sequence);
        }

        console.log('✅ Séquence générée:', response.data.message);
      } else {
        throw new Error(response.data.error || 'Erreur lors de la génération');
      }
    } catch (err: any) {
      console.error('❌ Erreur génération:', err);
      setError(err.response?.data?.error || err.message || 'Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-600" />
            Génération de Séquence V4 - Optimisée
          </CardTitle>
          <CardDescription>
            Enrichissement complet (LinkedIn, Web, Opérationnel, Timing) + Ajustement automatique
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Infos prospect */}
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="font-semibold mb-2">Prospect ciblé</div>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div><span className="text-gray-600">Email:</span> {prospect.email}</div>
              {prospect.company_name && (
                <div><span className="text-gray-600">Entreprise:</span> {prospect.company_name}</div>
              )}
              {prospect.firstname && prospect.lastname && (
                <div><span className="text-gray-600">Contact:</span> {prospect.firstname} {prospect.lastname}</div>
              )}
              {prospect.naf_label && (
                <div className="col-span-2"><span className="text-gray-600">Secteur:</span> {prospect.naf_label}</div>
              )}
            </div>
          </div>

          {/* Nombre d'emails par défaut */}
          <div className="space-y-2">
            <Label htmlFor="numEmails">
              Nombre d'emails souhaité (base)
              <Badge variant="secondary" className="ml-2">Ajusté automatiquement par l'IA</Badge>
            </Label>
            <Input
              id="numEmails"
              type="number"
              min="2"
              max="5"
              value={defaultNumEmails}
              onChange={(e) => setDefaultNumEmails(parseInt(e.target.value) || 3)}
              className="w-32"
            />
            <p className="text-xs text-gray-500">
              L'IA ajustera automatiquement selon le contexte (période, attractivité, timing)
            </p>
          </div>

          {/* Contexte / Instructions */}
          <div className="space-y-2">
            <Label htmlFor="context">
              Instructions personnalisées (optionnel)
            </Label>
            <Textarea
              id="context"
              placeholder="Ex: Insister sur la TICPE car secteur transport. Ton chaleureux et professionnel. Mettre en avant les économies concrètes..."
              value={context}
              onChange={(e) => setContext(e.target.value)}
              rows={4}
              className="resize-none"
            />
            <p className="text-xs text-gray-500">
              Si vide, l'IA générera une séquence optimale standard basée sur l'enrichissement
            </p>
          </div>

          {/* Bouton génération */}
          <Button 
            onClick={handleGenerate} 
            disabled={loading}
            className="w-full"
            size="lg"
          >
            {loading ? (
              <>
                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                Génération en cours...
              </>
            ) : (
              <>
                <Zap className="h-5 w-5 mr-2" />
                Générer la séquence optimale V4
              </>
            )}
          </Button>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Étapes du process */}
          {loading && (
            <div className="space-y-2 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="font-semibold text-blue-900 mb-3">Étapes en cours...</div>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                  <span>Enrichissement LinkedIn (ice breakers, événements, posts)</span>
                </div>
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                  <span>Enrichissement Site Web (actualités, signaux)</span>
                </div>
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                  <span>Enrichissement Opérationnel (véhicules, salariés, CA, locaux)</span>
                </div>
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                  <span>Analyse Temporelle (timing optimal, ajustement emails)</span>
                </div>
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                  <span>Génération séquence ultra-personnalisée</span>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Résultats dans un Dialog */}
      <Dialog open={showResult} onOpenChange={setShowResult}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-6 w-6 text-green-600" />
              Séquence V4 Générée avec Succès
            </DialogTitle>
            <DialogDescription>
              Enrichissement complet + Ajustement automatique + Emails ultra-personnalisés
            </DialogDescription>
          </DialogHeader>

          {result && (
            <Tabs defaultValue="adjustment" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="adjustment">Ajustement</TabsTrigger>
                <TabsTrigger value="emails">Emails ({result.sequence.steps.length})</TabsTrigger>
                <TabsTrigger value="enrichment">Enrichissement</TabsTrigger>
              </TabsList>

              {/* Onglet Ajustement */}
              <TabsContent value="adjustment" className="space-y-4">
                <SequenceAdjustmentPanel
                  adjustment={result.adjustment}
                  sequence={result.sequence}
                />
              </TabsContent>

              {/* Onglet Emails */}
              <TabsContent value="emails" className="space-y-4">
                {result.sequence.steps.map((step: any, index: number) => (
                  <Card key={index}>
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between text-lg">
                        <span className="flex items-center gap-2">
                          <Mail className="h-5 w-5" />
                          Email {step.stepNumber}
                        </span>
                        <Badge variant="outline">
                          {step.delayDays === 0 ? 'Immédiat' : `J+${step.delayDays}`}
                        </Badge>
                      </CardTitle>
                      <CardDescription>
                        {step.nombre_mots && `${step.nombre_mots} mots • `}
                        {step.tone_check}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Sujet */}
                      <div>
                        <Label className="text-xs text-gray-500">SUJET</Label>
                        <div className="p-3 bg-gray-50 rounded font-semibold mt-1">
                          {step.subject}
                        </div>
                      </div>

                      {/* Corps */}
                      <div>
                        <Label className="text-xs text-gray-500">CORPS DE L'EMAIL</Label>
                        <div className="p-4 bg-white rounded border mt-1 whitespace-pre-line leading-relaxed">
                          {step.body}
                        </div>
                      </div>

                      {/* Métriques de personnalisation */}
                      {step.fluidite_narrative && (
                        <div className="grid grid-cols-2 gap-3 pt-3 border-t">
                          <div className="p-3 bg-blue-50 rounded">
                            <div className="text-xs text-gray-600 mb-1">Score fluidité</div>
                            <div className="text-2xl font-bold text-blue-700">
                              {step.fluidite_narrative.score_fluidite}/10
                            </div>
                          </div>
                          <div className="p-3 bg-green-50 rounded">
                            <div className="text-xs text-gray-600 mb-1">Score personnalisation</div>
                            <div className="text-2xl font-bold text-green-700">
                              {step.personalization_score}/10
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Ice breakers fusionnés */}
                      {step.ice_breakers_fusionnes && step.ice_breakers_fusionnes.length > 0 && (
                        <div className="p-3 bg-purple-50 rounded border border-purple-200">
                          <div className="text-sm font-semibold text-purple-900 mb-2">
                            Ice Breakers Utilisés
                          </div>
                          <div className="space-y-2">
                            {step.ice_breakers_fusionnes.map((ib: any, ibIdx: number) => (
                              <div key={ibIdx} className="text-sm bg-white p-2 rounded">
                                <Badge variant="outline" className="mb-1">{ib.type}</Badge>
                                <div className="text-gray-700 italic">"{ib.phrase_utilisee}"</div>
                                <div className="text-xs text-gray-500 mt-1">{ib.validation}</div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Adaptation temporelle */}
                      {step.adaptation_temporelle && (
                        <div className="p-3 bg-orange-50 rounded border border-orange-200">
                          <div className="text-sm font-semibold text-orange-900 mb-2">
                            Adaptation Temporelle
                          </div>
                          <div className="space-y-1 text-sm text-gray-700">
                            <div><span className="font-medium">Contexte:</span> {step.adaptation_temporelle.contexte_reconnu}</div>
                            <div><span className="font-medium">Accroche:</span> {step.adaptation_temporelle.accroche_utilisee}</div>
                            <div><span className="font-medium">CTA adapté:</span> {step.adaptation_temporelle.cta_adapte}</div>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </TabsContent>

              {/* Onglet Enrichissement */}
              <TabsContent value="enrichment">
                <EnrichmentDisplayV4
                  enrichment={result.enrichment}
                  prospectInsights={result.prospect_insights}
                />
              </TabsContent>
            </Tabs>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t">
            <Button variant="outline" onClick={() => setShowResult(false)} className="flex-1">
              Fermer
            </Button>
            {onSequenceGenerated && result && (
              <Button 
                onClick={() => {
                  onSequenceGenerated(result.sequence);
                  setShowResult(false);
                  if (onClose) onClose();
                }}
                className="flex-1"
              >
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Valider et utiliser cette séquence
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ProspectSequenceGeneratorV4;

