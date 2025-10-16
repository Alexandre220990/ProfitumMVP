# 📊 PROPOSITION KPI PAR CATÉGORIE

**Date** : 16 octobre 2025  
**Objectif** : Ajouter KPI spécifiques en haut de chaque page de gestion

---

## 🎯 PRINCIPE

Comme pour **Apporteurs** qui affiche déjà :
```
┌─────────────────────────────────────────────┐
│  Apporteurs Actifs    Taux Conversion       │
│  1 / 1 total          68%                   │
│                                             │
│  Commissions Totales  Pipeline Actif        │
│  45.2k€               127 prospects         │
└─────────────────────────────────────────────┘
```

On veut la même chose pour **Clients**, **Experts** et **Dossiers**.

---

## 👥 **1. CLIENTS**

### **KPI Proposés** (4 tuiles)

```
┌─────────────────────────────────────────────┐
│  Clients Actifs       Taux d'Engagement     │
│  X / Y total          Z%                    │
│                                             │
│  Dossiers en Cours    Nouveaux ce Mois      │
│  N dossiers           M clients             │
└─────────────────────────────────────────────┘
```

### **Calculs depuis Supabase**

| KPI | Requête | Table |
|-----|---------|-------|
| **Clients Actifs** | `COUNT(CASE WHEN status='active')` | `Client` |
| **Total Clients** | `COUNT(*)` | `Client` |
| **Taux d'Engagement** | `(Clients avec dossiers / Total) * 100` | `Client` + `ClientProduitEligible` |
| **Dossiers en Cours** | `COUNT(CASE WHEN statut IN ('eligible','en_cours'))` | `ClientProduitEligible` |
| **Nouveaux ce Mois** | `COUNT(CASE WHEN created_at >= CURRENT_DATE - 30)` | `Client` |

### **Endpoint API**
```typescript
GET /api/admin/clients/stats
Response: {
  total_clients: number;
  clients_actifs: number;
  taux_engagement: number; // %
  dossiers_en_cours: number;
  nouveaux_ce_mois: number;
}
```

---

## 🎓 **2. EXPERTS**

### **KPI Proposés** (4 tuiles)

```
┌─────────────────────────────────────────────┐
│  Experts Approuvés    Note Moyenne          │
│  X / Y total          4.5 ⭐                │
│                                             │
│  Dossiers Actifs      En Attente Validation │
│  N dossiers           M experts             │
└─────────────────────────────────────────────┘
```

### **Calculs depuis Supabase**

| KPI | Requête | Table |
|-----|---------|-------|
| **Experts Approuvés** | `COUNT(CASE WHEN approval_status='approved')` | `Expert` |
| **Total Experts** | `COUNT(*)` | `Expert` |
| **Note Moyenne** | `AVG(rating)` | `Expert` |
| **Dossiers Actifs** | `COUNT(CASE WHEN statut='en_cours' AND expert_id IS NOT NULL)` | `ClientProduitEligible` |
| **En Attente Validation** | `COUNT(CASE WHEN approval_status='pending')` | `Expert` |

### **Endpoint API**
```typescript
GET /api/admin/experts/stats
Response: {
  total_experts: number;
  experts_approuves: number;
  note_moyenne: number;
  dossiers_actifs: number;
  en_attente_validation: number;
}
```

---

## 📁 **3. DOSSIERS (ClientProduitEligible)**

### **KPI Proposés** (4 tuiles)

```
┌─────────────────────────────────────────────┐
│  Dossiers Actifs      Taux de Réussite      │
│  X / Y total          Z%                    │
│                                             │
│  En Pré-Éligibilité   Montant Total         │
│  N dossiers           XXX k€ (moy: YY k€)   │
└─────────────────────────────────────────────┘
```

### **Calculs depuis Supabase**

| KPI | Requête | Table |
|-----|---------|-------|
| **Dossiers Actifs** | `COUNT(CASE WHEN statut IN ('eligible','en_cours'))` | `ClientProduitEligible` |
| **Total Dossiers** | `COUNT(*)` | `ClientProduitEligible` |
| **Taux de Réussite** | `(Validés / Total) * 100` | `ClientProduitEligible` |
| **En Pré-Éligibilité** | `COUNT(CASE WHEN validation_state='documents_uploaded')` | `ClientProduitEligible` |
| **Montant Total** | `SUM(metadata->>'montant_estime')` ou `SUM(montant_estime)` | `ClientProduitEligible` |
| **Montant Moyen** | `AVG(metadata->>'montant_estime')` ou `AVG(montant_estime)` | `ClientProduitEligible` |

### **Endpoint API**
```typescript
GET /api/admin/dossiers/stats
Response: {
  total_dossiers: number;
  dossiers_actifs: number;
  taux_reussite: number; // %
  en_pre_eligibilite: number;
  montant_total: number; // en euros
  montant_moyen: number; // en euros
}
```

---

## 🔧 **IMPLÉMENTATION**

### **Étape 1 : Créer Endpoints API**

**Fichier** : `server/src/routes/admin.ts`

```typescript
// 1. Stats Clients
router.get('/clients/stats', asyncHandler(async (req, res) => {
  const result = await supabaseClient
    .from('Client')
    .select(`
      id,
      status,
      created_at,
      ClientProduitEligible (
        id,
        statut
      )
    `);
  
  const clients = result.data || [];
  const total_clients = clients.length;
  const clients_actifs = clients.filter(c => c.status === 'active').length;
  const clients_avec_dossiers = clients.filter(c => c.ClientProduitEligible?.length > 0).length;
  const taux_engagement = total_clients > 0 ? (clients_avec_dossiers / total_clients * 100).toFixed(1) : 0;
  
  const dossiers_en_cours = clients.reduce((acc, c) => 
    acc + (c.ClientProduitEligible?.filter(d => ['eligible','en_cours'].includes(d.statut))?.length || 0), 0
  );
  
  const date_30j = new Date();
  date_30j.setDate(date_30j.getDate() - 30);
  const nouveaux_ce_mois = clients.filter(c => new Date(c.created_at) >= date_30j).length;
  
  res.json({
    success: true,
    data: {
      total_clients,
      clients_actifs,
      taux_engagement: parseFloat(taux_engagement),
      dossiers_en_cours,
      nouveaux_ce_mois
    }
  });
}));

// 2. Stats Experts
router.get('/experts/stats', asyncHandler(async (req, res) => {
  const result = await supabaseClient
    .from('Expert')
    .select(`
      id,
      approval_status,
      rating,
      created_at,
      ClientProduitEligible (
        id,
        statut
      )
    `);
  
  const experts = result.data || [];
  const total_experts = experts.length;
  const experts_approuves = experts.filter(e => e.approval_status === 'approved').length;
  const en_attente_validation = experts.filter(e => e.approval_status === 'pending').length;
  
  const ratings = experts.filter(e => e.rating).map(e => e.rating);
  const note_moyenne = ratings.length > 0 
    ? (ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(1) 
    : 0;
  
  const dossiers_actifs = experts.reduce((acc, e) => 
    acc + (e.ClientProduitEligible?.filter(d => d.statut === 'en_cours')?.length || 0), 0
  );
  
  res.json({
    success: true,
    data: {
      total_experts,
      experts_approuves,
      note_moyenne: parseFloat(note_moyenne),
      dossiers_actifs,
      en_attente_validation
    }
  });
}));

// 3. Stats Dossiers
router.get('/dossiers/stats', asyncHandler(async (req, res) => {
  const result = await supabaseClient
    .from('ClientProduitEligible')
    .select('*');
  
  const dossiers = result.data || [];
  const total_dossiers = dossiers.length;
  const dossiers_actifs = dossiers.filter(d => ['eligible','en_cours'].includes(d.statut)).length;
  const dossiers_valides = dossiers.filter(d => d.statut === 'validated').length;
  const taux_reussite = total_dossiers > 0 ? (dossiers_valides / total_dossiers * 100).toFixed(1) : 0;
  
  const en_pre_eligibilite = dossiers.filter(d => d.validation_state === 'documents_uploaded').length;
  
  // Calculer montants (depuis metadata.montant_estime ou champ direct)
  const montants = dossiers
    .map(d => {
      // Essayer metadata.montant_estime ou montant_estime direct
      const montant = d.metadata?.montant_estime || d.montant_estime || 0;
      return typeof montant === 'string' ? parseFloat(montant) : montant;
    })
    .filter(m => !isNaN(m) && m > 0);
  
  const montant_total = montants.reduce((acc, m) => acc + m, 0);
  const montant_moyen = montants.length > 0 ? montant_total / montants.length : 0;
  
  res.json({
    success: true,
    data: {
      total_dossiers,
      dossiers_actifs,
      taux_reussite: parseFloat(taux_reussite),
      en_pre_eligibilite,
      montant_total: Math.round(montant_total),
      montant_moyen: Math.round(montant_moyen)
    }
  });
}));
```

---

### **Étape 2 : Composant KPI Réutilisable**

**Fichier** : `client/src/components/admin/KPISection.tsx`

```typescript
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { LucideIcon } from 'lucide-react';

interface KPIItem {
  label: string;
  value: string | number;
  subtext?: string;
  icon?: LucideIcon;
  color?: string;
}

interface KPISectionProps {
  kpis: KPIItem[];
  loading?: boolean;
}

export const KPISection: React.FC<KPISectionProps> = ({ kpis, loading }) => {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[1,2,3,4].map(i => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-4 bg-gray-200 rounded mb-2"></div>
              <div className="h-8 bg-gray-200 rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {kpis.map((kpi, index) => (
        <Card key={index}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{kpi.label}</p>
                <p className={`text-2xl font-bold ${kpi.color || 'text-gray-900'}`}>
                  {kpi.value}
                </p>
                {kpi.subtext && (
                  <p className="text-xs text-gray-500 mt-1">{kpi.subtext}</p>
                )}
              </div>
              {kpi.icon && (
                <kpi.icon className={`w-8 h-8 ${kpi.color || 'text-blue-600'}`} />
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
```

---

### **Étape 3 : Intégrer dans Pages**

#### **A. Page Clients** (`gestion-clients.tsx`)

```typescript
import { KPISection } from '@/components/admin/KPISection';
import { Users, TrendingUp, FolderOpen, UserPlus } from 'lucide-react';

const [clientStats, setClientStats] = useState<any>(null);
const [loadingStats, setLoadingStats] = useState(true);

useEffect(() => {
  fetchClientStats();
}, []);

const fetchClientStats = async () => {
  try {
    const response = await fetch('/api/admin/clients/stats', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await response.json();
    if (data.success) {
      setClientStats(data.data);
    }
  } catch (error) {
    console.error('Erreur stats clients:', error);
  } finally {
    setLoadingStats(false);
  }
};

// Dans le JSX, avant le tableau
<KPISection
  loading={loadingStats}
  kpis={[
    {
      label: 'Clients Actifs',
      value: `${clientStats?.clients_actifs || 0}`,
      subtext: `sur ${clientStats?.total_clients || 0} total`,
      icon: Users,
      color: 'text-blue-600'
    },
    {
      label: 'Taux d\'Engagement',
      value: `${clientStats?.taux_engagement || 0}%`,
      subtext: 'clients avec dossiers',
      icon: TrendingUp,
      color: 'text-green-600'
    },
    {
      label: 'Dossiers en Cours',
      value: clientStats?.dossiers_en_cours || 0,
      subtext: 'dossiers actifs',
      icon: FolderOpen,
      color: 'text-purple-600'
    },
    {
      label: 'Nouveaux ce Mois',
      value: clientStats?.nouveaux_ce_mois || 0,
      subtext: '30 derniers jours',
      icon: UserPlus,
      color: 'text-orange-600'
    }
  ]}
/>

#### **C. Page Dossiers** (`gestion-dossiers.tsx`)

```typescript
import { KPISection } from '@/components/admin/KPISection';
import { FolderOpen, TrendingUp, Clock, Euro } from 'lucide-react';

const [dossierStats, setDossierStats] = useState<any>(null);
const [loadingStats, setLoadingStats] = useState(true);

useEffect(() => {
  fetchDossierStats();
}, []);

const fetchDossierStats = async () => {
  try {
    const response = await fetch('/api/admin/dossiers/stats', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await response.json();
    if (data.success) {
      setDossierStats(data.data);
    }
  } catch (error) {
    console.error('Erreur stats dossiers:', error);
  } finally {
    setLoadingStats(false);
  }
};

const formatMontant = (montant: number) => {
  if (montant >= 1000000) return `${(montant / 1000000).toFixed(1)}M€`;
  if (montant >= 1000) return `${(montant / 1000).toFixed(1)}k€`;
  return `${montant}€`;
};

// Dans le JSX, avant le tableau
<KPISection
  loading={loadingStats}
  kpis={[
    {
      label: 'Dossiers Actifs',
      value: `${dossierStats?.dossiers_actifs || 0}`,
      subtext: `sur ${dossierStats?.total_dossiers || 0} total`,
      icon: FolderOpen,
      color: 'text-blue-600'
    },
    {
      label: 'Taux de Réussite',
      value: `${dossierStats?.taux_reussite || 0}%`,
      subtext: 'dossiers validés',
      icon: TrendingUp,
      color: 'text-green-600'
    },
    {
      label: 'En Pré-Éligibilité',
      value: dossierStats?.en_pre_eligibilite || 0,
      subtext: 'en attente validation',
      icon: Clock,
      color: 'text-orange-600'
    },
    {
      label: 'Montant Total',
      value: formatMontant(dossierStats?.montant_total || 0),
      subtext: `moy: ${formatMontant(dossierStats?.montant_moyen || 0)}`,
      icon: Euro,
      color: 'text-purple-600'
    }
  ]}
/>
```

---

## 📊 **RÉCAPITULATIF**

| Catégorie | KPI 1 | KPI 2 | KPI 3 | KPI 4 |
|-----------|-------|-------|-------|-------|
| **Clients** | Clients Actifs | Taux d'Engagement | Dossiers en Cours | Nouveaux ce Mois |
| **Experts** | Experts Approuvés | Note Moyenne | Dossiers Actifs | En Attente Validation |
| **Dossiers** | Dossiers Actifs | Taux de Réussite | En Pré-Éligibilité | **Montant Total + Moyen** |
| **Apporteurs** | ✅ Déjà fait | ✅ Déjà fait | ✅ Déjà fait | ✅ Déjà fait |

---

## ✅ **VALIDATION**

### **Données Disponibles en BDD**
- ✅ `Client.status` → Clients actifs
- ✅ `Client.created_at` → Nouveaux ce mois
- ✅ `Expert.approval_status` → Approuvés / En attente
- ✅ `Expert.rating` → Note moyenne
- ✅ `ClientProduitEligible.statut` → Dossiers actifs
- ✅ `ClientProduitEligible.validation_state` → Pré-éligibilité
- ✅ `ClientProduitEligible.metadata.montant_estime` → Montants

### **Vues Nécessaires**
- ❌ Aucune vue spécifique nécessaire
- ✅ Tout calculable depuis les tables existantes

---

## 🚀 **PLAN D'ACTION**

1. **Analyser données BDD** (requête SQL) ← EN COURS
2. **Créer 3 endpoints API** (`/clients/stats`, `/experts/stats`, `/dossiers/stats`)
3. **Créer composant KPISection** réutilisable
4. **Intégrer dans gestion-clients.tsx**
5. **Intégrer dans gestion-experts.tsx**
6. **Intégrer dans gestion-dossiers.tsx**
7. **Tester avec données réelles**
8. **Commit & Push**

---

**Est-ce que cette proposition te convient ?** 🎯

