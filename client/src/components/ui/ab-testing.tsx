import React, { createContext, useContext, useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Activity, Loader2, Plus, Users } from "lucide-react";

// Types pour les tests A/B
interface ABTest {
  id: string;
  name: string;
  description: string;
  status: 'draft' | 'running' | 'paused' | 'completed';
  startDate: string;
  endDate?: string;
  targetAudience: string;
  trafficSplit: number; // Pourcentage vers la variante B
  variants: {
    a: Variant;
    b: Variant;
  };
  metrics: TestMetric[];
  results: TestResults;
  createdAt: string;
  updatedAt: string;
}

interface Variant {
  id: string;
  name: string;
  description: string;
  changes: VariantChange[];
  isControl: boolean;
}

interface VariantChange {
  type: 'css' | 'html' | 'javascript' | 'content';
  selector: string;
  property: string;
  value: string;
  description: string;
}

interface TestMetric {
  id: string;
  name: string;
  type: 'conversion' | 'engagement' | 'revenue' | 'custom';
  goal: string;
  weight: number;
}

interface TestResults {
  totalVisitors: number;
  variantA: VariantResult;
  variantB: VariantResult;
  confidence: number;
  winner?: 'a' | 'b' | null;
  isSignificant: boolean;
}

interface VariantResult {
  visitors: number;
  conversions: number;
  conversionRate: number;
  revenue: number;
  avgOrderValue: number;
  engagementScore: number;
}

// Context pour les tests A/B
interface ABTestingContextType {
  activeTests: ABTest[];
  getActiveTest: (testId: string) => ABTest | null;
  isUserInTest: (testId: string) => boolean;
  getUserVariant: (testId: string) => 'a' | 'b' | null;
  trackEvent: (testId: string, event: string, value?: number) => void;
}

const ABTestingContext = createContext<ABTestingContextType | undefined>(undefined);

export const useABTesting = () => {
  const context = useContext(ABTestingContext);
  if (!context) {
    throw new Error('useABTesting must be used within an ABTestingProvider');
  }
  return context;
};

// Provider pour les tests A/B
export const ABTestingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeTests, setActiveTests] = useState<ABTest[]>([]);
  const [userAssignments, setUserAssignments] = useState<Record<string, 'a' | 'b'>>({});

  // Charger les tests actifs
  useEffect(() => {
    loadActiveTests();
  }, []);

  const loadActiveTests = async () => {
    try {
      // TODO: Remplacer par l'API réelle
      const mockTests: ABTest[] = [
        {
          id: 'cta-button-test',
          name: 'Test CTA Button',
          description: 'Test de différentes couleurs pour le bouton CTA principal',
          status: 'running',
          startDate: '2024-01-01',
          targetAudience: 'all',
          trafficSplit: 50,
          variants: {
            a: {
              id: 'a',
              name: 'Contrôle (Bleu)',
              description: 'Bouton bleu original',
              isControl: true,
              changes: []
            },
            b: {
              id: 'b',
              name: 'Variante (Vert)',
              description: 'Bouton vert pour plus d\'impact',
              isControl: false,
              changes: [
                {
                  type: 'css',
                  selector: '.cta-button',
                  property: 'background-color',
                  value: '#10b981',
                  description: 'Changer la couleur de fond en vert'
                }
              ]
            }
          },
          metrics: [
            {
              id: 'conversion-rate',
              name: 'Taux de conversion',
              type: 'conversion',
              goal: 'click',
              weight: 1
            }
          ],
          results: {
            totalVisitors: 1000,
            variantA: {
              visitors: 500,
              conversions: 45,
              conversionRate: 9.0,
              revenue: 4500,
              avgOrderValue: 100,
              engagementScore: 0.75
            },
            variantB: {
              visitors: 500,
              conversions: 52,
              conversionRate: 10.4,
              revenue: 5200,
              avgOrderValue: 100,
              engagementScore: 0.82
            },
            confidence: 85.2,
            winner: 'b',
            isSignificant: true
          },
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-15T00:00:00Z'
        }
      ];

      setActiveTests(mockTests);
    } catch (error) {
      console.error('Erreur lors du chargement des tests A/B:', error);
    }
  };

  // Vérifier si l'utilisateur est dans un test
  const isUserInTest = (testId: string): boolean => {
    return testId in userAssignments;
  };

  // Obtenir la variante de l'utilisateur
  const getUserVariant = (testId: string): 'a' | 'b' | null => {
    return userAssignments[testId] || null;
  };

  // Assigner une variante à l'utilisateur
  const assignVariant = (testId: string): 'a' | 'b' => {
    if (userAssignments[testId]) {
      return userAssignments[testId];
    }

    const test = activeTests.find(t => t.id === testId);
    if (!test || test.status !== 'running') {
      return 'a';
    }

    const variant = Math.random() * 100 < test.trafficSplit ? 'b' : 'a';
    setUserAssignments(prev => ({ ...prev, [testId]: variant }));
    return variant;
  };

  // Tracker un événement
  const trackEvent = (testId: string, event: string, value?: number) => {
    if (!isUserInTest(testId)) {
      assignVariant(testId);
    }

    // TODO: Envoyer l'événement à l'API de tracking
    console.log(`Tracking event: ${testId} - ${event}`, { value });
  };

  const value: ABTestingContextType = {
    activeTests,
    getActiveTest: (testId) => activeTests.find(t => t.id === testId) || null,
    isUserInTest,
    getUserVariant,
    trackEvent
  };

  return (
    <ABTestingContext.Provider value={value}>
      {children}
    </ABTestingContext.Provider>
  );
};

// Composant principal de gestion des tests A/B
export const ABTestingDashboard: React.FC = () => {
  const [tests, setTests] = useState<ABTest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTests();
  }, []);

  const loadTests = async () => {
    try {
      setLoading(true);
      // TODO: Remplacer par l'API réelle
      const mockTests: ABTest[] = [
        {
          id: 'cta-button-test',
          name: 'Test CTA Button',
          description: 'Test de différentes couleurs pour le bouton CTA principal',
          status: 'running',
          startDate: '2024-01-01',
          targetAudience: 'all',
          trafficSplit: 50,
          variants: {
            a: {
              id: 'a',
              name: 'Contrôle (Bleu)',
              description: 'Bouton bleu original',
              isControl: true,
              changes: []
            },
            b: {
              id: 'b',
              name: 'Variante (Vert)',
              description: 'Bouton vert pour plus d\'impact',
              isControl: false,
              changes: [
                {
                  type: 'css',
                  selector: '.cta-button',
                  property: 'background-color',
                  value: '#10b981',
                  description: 'Changer la couleur de fond en vert'
                }
              ]
            }
          },
          metrics: [
            {
              id: 'conversion-rate',
              name: 'Taux de conversion',
              type: 'conversion',
              goal: 'click',
              weight: 1
            }
          ],
          results: {
            totalVisitors: 1000,
            variantA: {
              visitors: 500,
              conversions: 45,
              conversionRate: 9.0,
              revenue: 4500,
              avgOrderValue: 100,
              engagementScore: 0.75
            },
            variantB: {
              visitors: 500,
              conversions: 52,
              conversionRate: 10.4,
              revenue: 5200,
              avgOrderValue: 100,
              engagementScore: 0.82
            },
            confidence: 85.2,
            winner: 'b',
            isSignificant: true
          },
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-15T00:00:00Z'
        }
      ];

      setTests(mockTests);
    } catch (error) {
      console.error('Erreur lors du chargement des tests:', error);
    } finally {
      setLoading(false);
    }
  };



  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            Tests A/B
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Optimisez vos conversions avec des tests scientifiques
          </p>
        </div>
        <Button onClick={() => console.log('Nouveau test clicked')} className="flex items-center space-x-2">
          <Plus className="w-4 h-4" />
          <span>Nouveau test</span>
        </Button>
      </div>

      {/* Statistiques globales */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                <Activity className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Tests actifs
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {tests.filter(t => t.status === 'running').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
                <Users className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Visiteurs totaux
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {tests.reduce((sum, test) => sum + test.results.totalVisitors, 0).toLocaleString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}; 