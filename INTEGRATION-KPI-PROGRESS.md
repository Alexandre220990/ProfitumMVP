# 📊 INTÉGRATION KPI - PROGRESSION

**Date** : 16 octobre 2025  
**Status** : ⏳ EN COURS

---

## ✅ FAIT

### **1. Endpoints API** ✅
- ✅ `/api/admin/clients/stats` créé
- ✅ `/api/admin/experts/stats` créé
- ✅ `/api/admin/dossiers/stats` créé

### **2. Composant** ✅
- ✅ `KPISection.tsx` créé
- ✅ 4 tuiles responsive
- ✅ Loading state
- ✅ Icônes personnalisables

### **3. Intégration Pages**
- ✅ `gestion-clients.tsx` : États + fetch ajoutés
- ⏳ `gestion-clients.tsx` : KPISection à ajouter au JSX
- ⏳ `gestion-experts.tsx`
- ⏳ `gestion-dossiers.tsx`

---

## 📝 À FAIRE

### **gestion-clients.tsx**
```tsx
// Ajouter avant le Card des filtres :
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
      label: "Taux d'Engagement",
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
```

### **gestion-experts.tsx**
- Ajouter imports
- Ajouter états
- Ajouter fetchExpertStats
- Ajouter KPISection

### **gestion-dossiers.tsx**
- Ajouter imports
- Ajouter états
- Ajouter fetchDossierStats
- Ajouter formatMontant
- Ajouter KPISection

---

## 🚀 SUITE

Continuer après timeout avec commit intermédiaire.

