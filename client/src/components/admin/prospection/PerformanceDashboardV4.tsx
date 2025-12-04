/**
 * Dashboard de Performances V4
 * Affiche les métriques, ice breakers performants, ajustements, A/B testing
 */

import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  BarChart3,
  TrendingUp,
  Mail,
  Target,
  Award,
  Loader2,
  RefreshCw,
  Download,
  Lightbulb,
  AlertCircle
} from 'lucide-react';
import axios from 'axios';

export const PerformanceDashboardV4: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<any>(null);
  const [abData, setAbData] = useState<any>(null);

  useEffect(() => {
    loadPerformanceData();
  }, []);

  const loadPerformanceData = async () => {
    setLoading(true);
    try {
      const [reportRes, abRes] = await Promise.all([
        axios.get('/api/prospects/performance/report'),
        axios.get('/api/prospects/performance/ab-testing-data')
      ]);

      if (reportRes.data.success) {
        setReport(reportRes.data.data);
      }

      if (abRes.data.success) {
        setAbData(abRes.data);
      }
    } catch (error) {
      console.error('Erreur chargement performances:', error);
    } finally {
      setLoading(false);
    }
  };

  const exportData = () => {
    if (!abData) return;

    const dataStr = JSON.stringify(abData.data, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ab-testing-data-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Chargement des performances...</p>
        </CardContent>
      </Card>
    );
  }

  if (!report) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <AlertCircle className="h-8 w-8 mx-auto mb-4 text-gray-400" />
          <p className="text-gray-600">Aucune donnée de performance disponible</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* En-tête avec boutons */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <BarChart3 className="h-6 w-6" />
            Dashboard Performances V4
          </h2>
          <p className="text-gray-600 mt-1">
            Analyse des performances des séquences V4 et A/B testing
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={loadPerformanceData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Rafraîchir
          </Button>
          <Button variant="default" onClick={exportData}>
            <Download className="h-4 w-4 mr-2" />
            Exporter A/B Data
          </Button>
        </div>
      </div>

      {/* Métriques Globales */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <Mail className="h-5 w-5 text-blue-600" />
              <Badge variant="secondary">Total</Badge>
            </div>
            <div className="text-3xl font-bold">{report.global_metrics.total_sent}</div>
            <div className="text-sm text-gray-600">Emails envoyés</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <Target className="h-5 w-5 text-green-600" />
              <Badge variant="default" className="bg-green-500">
                {report.global_metrics.open_rate.toFixed(1)}%
              </Badge>
            </div>
            <div className="text-3xl font-bold">{report.global_metrics.total_opened}</div>
            <div className="text-sm text-gray-600">Ouvertures</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <TrendingUp className="h-5 w-5 text-purple-600" />
              <Badge variant="default" className="bg-purple-500">
                {report.global_metrics.reply_rate.toFixed(1)}%
              </Badge>
            </div>
            <div className="text-3xl font-bold">{report.global_metrics.total_replied}</div>
            <div className="text-sm text-gray-600">Réponses</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <Award className="h-5 w-5 text-orange-600" />
              <Badge variant="default" className="bg-orange-500">
                {report.global_metrics.conversion_rate.toFixed(1)}%
              </Badge>
            </div>
            <div className="text-3xl font-bold">{report.global_metrics.total_converted}</div>
            <div className="text-sm text-gray-600">Conversions</div>
          </CardContent>
        </Card>
      </div>

      {/* Insights */}
      {report.insights && report.insights.length > 0 && (
        <Card className="border-purple-200 bg-purple-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Lightbulb className="h-5 w-5 text-purple-600" />
              Insights Clés
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {report.insights.map((insight: string, idx: number) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="text-purple-600 font-bold">•</span>
                  <span className="text-sm text-gray-700">{insight}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Onglets détaillés */}
      <Tabs defaultValue="icebreakers" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="icebreakers">Ice Breakers</TabsTrigger>
          <TabsTrigger value="adjustments">Ajustements</TabsTrigger>
          <TabsTrigger value="abtesting">A/B Testing</TabsTrigger>
        </TabsList>

        {/* Performances Ice Breakers */}
        <TabsContent value="icebreakers" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Top Ice Breakers Performants</CardTitle>
              <CardDescription>
                Classés par taux de réponse décroissant
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead>Source</TableHead>
                    <TableHead className="text-right">Utilisé</TableHead>
                    <TableHead className="text-right">Taux Ouverture</TableHead>
                    <TableHead className="text-right">Taux Réponse</TableHead>
                    <TableHead className="text-right">Score Moyen</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {report.top_performing_ice_breakers.map((ib: any, idx: number) => (
                    <TableRow key={idx}>
                      <TableCell className="font-medium">{ib.type}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{ib.source}</Badge>
                      </TableCell>
                      <TableCell className="text-right">{ib.total_used}</TableCell>
                      <TableCell className="text-right">
                        <Badge variant="secondary">{ib.open_rate.toFixed(1)}%</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge variant="default" className="bg-green-500">
                          {ib.reply_rate.toFixed(1)}%
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge>{ib.avg_score.toFixed(1)}/10</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Performances Ajustements */}
        <TabsContent value="adjustments" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Impact des Ajustements Automatiques</CardTitle>
              <CardDescription>
                Comparaison des performances selon l'ajustement IA
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type Ajustement</TableHead>
                    <TableHead className="text-right">Nombre → Nouveau</TableHead>
                    <TableHead className="text-right">Séquences</TableHead>
                    <TableHead className="text-right">Taux Ouverture</TableHead>
                    <TableHead className="text-right">Taux Réponse</TableHead>
                    <TableHead className="text-right">Taux Conversion</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {report.adjustment_performance.map((adj: any, idx: number) => (
                    <TableRow key={idx}>
                      <TableCell className="font-medium">
                        {adj.adjustment_type === 'increased' && (
                          <Badge variant="default" className="bg-blue-500">Augmenté</Badge>
                        )}
                        {adj.adjustment_type === 'decreased' && (
                          <Badge variant="default" className="bg-orange-500">Réduit</Badge>
                        )}
                        {adj.adjustment_type === 'unchanged' && (
                          <Badge variant="secondary">Inchangé</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {adj.original_num} → {adj.new_num}
                      </TableCell>
                      <TableCell className="text-right">{adj.total_sequences}</TableCell>
                      <TableCell className="text-right">
                        <Badge variant="secondary">{adj.avg_open_rate.toFixed(1)}%</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge variant="default" className="bg-green-500">
                          {adj.avg_reply_rate.toFixed(1)}%
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge variant="default" className="bg-purple-500">
                          {adj.avg_conversion_rate.toFixed(1)}%
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Corrélation Score Attractivité */}
          <Card>
            <CardHeader>
              <CardTitle>Corrélation Score Attractivité × Conversion</CardTitle>
              <CardDescription>
                Relation entre le score attractivité et les performances
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Plage Score</TableHead>
                    <TableHead className="text-right">Prospects</TableHead>
                    <TableHead className="text-right">Taux Ouverture</TableHead>
                    <TableHead className="text-right">Taux Réponse</TableHead>
                    <TableHead className="text-right">Taux Conversion</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {report.score_correlation.map((corr: any, idx: number) => (
                    <TableRow key={idx}>
                      <TableCell className="font-medium">{corr.score_range}</TableCell>
                      <TableCell className="text-right">{corr.total_prospects}</TableCell>
                      <TableCell className="text-right">
                        <Badge variant="secondary">{corr.avg_open_rate.toFixed(1)}%</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge variant="default" className="bg-green-500">
                          {corr.avg_reply_rate.toFixed(1)}%
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge variant="default" className="bg-purple-500">
                          {corr.avg_conversion_rate.toFixed(1)}%
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* A/B Testing V4 vs Legacy */}
        <TabsContent value="abtesting" className="space-y-4">
          {abData && (
            <>
              {/* Comparaison globale */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* V4 */}
                <Card className="border-2 border-green-200 bg-green-50">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Badge variant="default" className="bg-green-600">V4</Badge>
                      Système Optimisé
                    </CardTitle>
                    <CardDescription>
                      {abData.summary.v4_count} prospects
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="p-3 bg-white rounded">
                        <div className="text-sm text-gray-600 mb-1">Taux de Réponse Moyen</div>
                        <div className="text-3xl font-bold text-green-600">
                          {abData.summary.v4_avg_reply_rate.toFixed(1)}%
                        </div>
                      </div>
                      <div className="text-xs text-gray-600">
                        Enrichissement complet + Ajustement automatique + Fluidité narrative
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Legacy */}
                <Card className="border-2 border-gray-200">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Badge variant="secondary">Legacy</Badge>
                      Système Précédent
                    </CardTitle>
                    <CardDescription>
                      {abData.summary.legacy_count} prospects
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="p-3 bg-white rounded">
                        <div className="text-sm text-gray-600 mb-1">Taux de Réponse Moyen</div>
                        <div className="text-3xl font-bold text-gray-600">
                          {abData.summary.legacy_avg_reply_rate.toFixed(1)}%
                        </div>
                      </div>
                      <div className="text-xs text-gray-600">
                        Système sans enrichissement V4
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Gain V4 vs Legacy */}
              <Card className="border-2 border-blue-200 bg-blue-50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-blue-600" />
                    Amélioration V4 vs Legacy
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center p-4 bg-white rounded-lg">
                      <div className="text-4xl font-bold text-blue-600">
                        {abData.summary.v4_avg_reply_rate > 0 && abData.summary.legacy_avg_reply_rate > 0
                          ? `+${((abData.summary.v4_avg_reply_rate / abData.summary.legacy_avg_reply_rate - 1) * 100).toFixed(0)}%`
                          : 'N/A'
                        }
                      </div>
                      <div className="text-sm text-gray-600 mt-2">Gain taux de réponse</div>
                    </div>

                    <div className="text-center p-4 bg-white rounded-lg">
                      <div className="text-4xl font-bold text-green-600">
                        {Math.abs(abData.summary.v4_avg_reply_rate - abData.summary.legacy_avg_reply_rate).toFixed(1)}pp
                      </div>
                      <div className="text-sm text-gray-600 mt-2">Points de % en plus</div>
                    </div>

                    <div className="text-center p-4 bg-white rounded-lg">
                      <div className="text-2xl font-bold text-purple-600">
                        {abData.data.v4_prospects.filter((p: any) => p.converted).length}
                      </div>
                      <div className="text-sm text-gray-600 mt-2">Conversions V4</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Détails par prospect */}
              <Card>
                <CardHeader>
                  <CardTitle>Détails Prospects V4</CardTitle>
                  <CardDescription>
                    Premiers {Math.min(10, abData.data.v4_prospects.length)} prospects
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Prospect ID</TableHead>
                        <TableHead className="text-center">Ajustement</TableHead>
                        <TableHead className="text-right">Emails</TableHead>
                        <TableHead className="text-right">Taux Ouverture</TableHead>
                        <TableHead className="text-right">Taux Réponse</TableHead>
                        <TableHead className="text-center">Converti</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {abData.data.v4_prospects.slice(0, 10).map((prospect: any, idx: number) => (
                        <TableRow key={idx}>
                          <TableCell className="font-mono text-xs">
                            {prospect.prospect_id.substring(0, 8)}...
                          </TableCell>
                          <TableCell className="text-center">
                            {prospect.adjustment_applied ? (
                              <Badge variant="default" className="bg-blue-500">Oui</Badge>
                            ) : (
                              <Badge variant="secondary">Non</Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-right">{prospect.num_emails}</TableCell>
                          <TableCell className="text-right">
                            <Badge variant="secondary">{prospect.open_rate.toFixed(0)}%</Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <Badge variant="default" className="bg-green-500">
                              {prospect.reply_rate.toFixed(0)}%
                            </Badge>
                          </TableCell>
                          <TableCell className="text-center">
                            {prospect.converted ? (
                              <Badge variant="default" className="bg-purple-500">✓</Badge>
                            ) : (
                              <Badge variant="outline">-</Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PerformanceDashboardV4;

