# Guide Final - Migration Complète

## ✅ Noms Exactes Confirmés (Version Finale)

Après diagnostic complet, voici tous les noms exacts :

### Tables
- ✅ **`Client`** (pas `client`)
- ✅ **`Expert`** (pas `expert`)
- ✅ **`ProduitEligible`** (pas `produiteligible`)
- ✅ **`ClientProduitEligible`** (pas `clientproduiteligible`)

### Colonnes
- ✅ **`clientId`** (pas `client_id`)
- ✅ **`produitId`** (pas `produit_eligible_id`)
- ✅ **`name`** (pas `first_name` et `last_name` dans Expert)
- ✅ **`email`** (dans Expert)
- ✅ **`company_name`** (dans Expert)

## 🚀 Application de la Migration Complète

### Fichier à Utiliser
- **Fichier** : `migrations/20250103_fix_schema_issues_complete.sql`
- **Statut** : ✅ Prêt pour application
- **Corrections** : Tous les noms exacts utilisés

### Étape 1 : Accéder à Supabase
1. **Aller sur** : https://supabase.com
2. **Se connecter** avec vos identifiants
3. **Sélectionner** le projet FinancialTracker
4. **Aller dans** SQL Editor

### Étape 2 : Créer le Script
1. **Cliquer** sur "New query"
2. **Nommer** : "Fix Schema Issues - Complete"
3. **Copier** le contenu de `migrations/20250103_fix_schema_issues_complete.sql`

### Étape 3 : Exécuter
1. **Vérifier** qu'il n'y a pas d'erreurs de syntaxe
2. **Cliquer** sur "Run" ou Ctrl+Enter
3. **Attendre** 2-3 minutes pour l'exécution

## 📋 Contenu de la Migration Complète

```sql
-- Migration complète pour corriger les problèmes de schéma
-- Date: 2025-01-03
-- Version: Complète avec tous les noms corrects

-- 1. Ajouter les colonnes manquantes à expertassignment
ALTER TABLE public.expertassignment 
ADD COLUMN IF NOT EXISTS client_produit_eligible_id UUID;

ALTER TABLE public.expertassignment 
ADD COLUMN IF NOT EXISTS statut VARCHAR(50) DEFAULT 'pending' CHECK (statut IN ('pending', 'accepted', 'rejected', 'completed', 'cancelled'));

-- 2. Ajouter les colonnes manquantes à ProduitEligible
ALTER TABLE public."ProduitEligible" 
ADD COLUMN IF NOT EXISTS category VARCHAR(100) DEFAULT 'general';

ALTER TABLE public."ProduitEligible" 
ADD COLUMN IF NOT EXISTS active BOOLEAN DEFAULT true;

-- 3. Ajouter la colonne manquante à message
ALTER TABLE public.message 
ADD COLUMN IF NOT EXISTS timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- 4. Créer la contrainte de clé étrangère
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'expertassignment_client_produit_eligible_fkey'
    ) THEN
        ALTER TABLE public.expertassignment 
        ADD CONSTRAINT expertassignment_client_produit_eligible_fkey 
        FOREIGN KEY (client_produit_eligible_id) 
        REFERENCES public."ClientProduitEligible"(id) ON DELETE CASCADE;
    END IF;
END $$;

-- 5. Activer RLS sur les tables critiques
ALTER TABLE public.expertassignment ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification ENABLE ROW LEVEL SECURITY;

-- 6. Créer les politiques RLS de base
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'expertassignment' 
        AND policyname = 'Enable read access for authenticated users'
    ) THEN
        CREATE POLICY "Enable read access for authenticated users" ON public.expertassignment
        FOR SELECT USING (auth.role() = 'authenticated');
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'message' 
        AND policyname = 'Enable read access for authenticated users'
    ) THEN
        CREATE POLICY "Enable read access for authenticated users" ON public.message
        FOR SELECT USING (auth.role() = 'authenticated');
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'notification' 
        AND policyname = 'Enable read access for authenticated users'
    ) THEN
        CREATE POLICY "Enable read access for authenticated users" ON public.notification
        FOR SELECT USING (auth.role() = 'authenticated');
    END IF;
END $$;

-- 7. Créer les index essentiels
CREATE INDEX IF NOT EXISTS idx_expertassignment_statut ON public.expertassignment(statut);
CREATE INDEX IF NOT EXISTS idx_expertassignment_client_produit_eligible_id ON public.expertassignment(client_produit_eligible_id);
CREATE INDEX IF NOT EXISTS idx_produiteligible_category ON public."ProduitEligible"(category);
CREATE INDEX IF NOT EXISTS idx_produiteligible_active ON public."ProduitEligible"(active);
CREATE INDEX IF NOT EXISTS idx_message_timestamp ON public.message(timestamp);

-- 8. Mettre à jour les données existantes
UPDATE public."ProduitEligible" 
SET 
    category = CASE 
        WHEN LOWER(nom) LIKE '%ticpe%' THEN 'ticpe'
        WHEN LOWER(nom) LIKE '%cee%' THEN 'cee'
        WHEN LOWER(nom) LIKE '%audit%' THEN 'audit'
        ELSE 'general'
    END,
    active = true
WHERE category IS NULL OR active IS NULL;

UPDATE public.expertassignment 
SET statut = 'pending' 
WHERE statut IS NULL;

UPDATE public.message 
SET timestamp = created_at 
WHERE timestamp IS NULL AND created_at IS NOT NULL;

-- 9. Créer la vue principale pour les assignations (AVEC NOMS CORRECTS)
CREATE OR REPLACE VIEW public.v_expert_assignments AS
SELECT 
    ea.id,
    ea.expert_id,
    ea.client_produit_eligible_id,
    ea.statut,
    ea.created_at,
    ea.updated_at,
    cpe."clientId" as client_id,
    cpe."produitId" as produit_eligible_id,
    c.company_name as client_name,
    pe.nom as produit_nom,
    pe.category as produit_category,
    e.name as expert_name,
    e.email as expert_email,
    e.company_name as expert_company
FROM public.expertassignment ea
LEFT JOIN public."ClientProduitEligible" cpe ON ea.client_produit_eligible_id = cpe.id
LEFT JOIN public."Client" c ON cpe."clientId" = c.id
LEFT JOIN public."ProduitEligible" pe ON cpe."produitId" = pe.id
LEFT JOIN public."Expert" e ON ea.expert_id = e.id
WHERE pe.active = true;

-- 10. Créer la vue pour les messages avec informations utilisateur
CREATE OR REPLACE VIEW public.v_messages_with_users AS
SELECT 
    m.id,
    m.conversation_id,
    m.sender_id,
    m.content,
    m.timestamp,
    m.created_at,
    m.updated_at,
    c.title as conversation_title,
    CASE 
        WHEN e.id IS NOT NULL THEN e.name
        WHEN cl.id IS NOT NULL THEN cl.company_name
        ELSE 'Utilisateur inconnu'
    END as sender_name,
    CASE 
        WHEN e.id IS NOT NULL THEN 'expert'
        WHEN cl.id IS NOT NULL THEN 'client'
        ELSE 'unknown'
    END as sender_type
FROM public.message m
LEFT JOIN public.conversation c ON m.conversation_id = c.id
LEFT JOIN public."Expert" e ON m.sender_id = e.id
LEFT JOIN public."Client" cl ON m.sender_id = cl.id
ORDER BY m.timestamp DESC;

-- 11. Créer la fonction de statistiques
CREATE OR REPLACE FUNCTION public.get_expert_assignments_by_status(status_filter VARCHAR(50))
RETURNS TABLE (
    assignment_id UUID,
    expert_name TEXT,
    client_name TEXT,
    produit_nom TEXT,
    statut VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ea.id::UUID,
        e.name::TEXT,
        c.company_name::TEXT,
        pe.nom::TEXT,
        ea.statut,
        ea.created_at
    FROM public.expertassignment ea
    LEFT JOIN public."ClientProduitEligible" cpe ON ea.client_produit_eligible_id = cpe.id
    LEFT JOIN public."Client" c ON cpe."clientId" = c.id
    LEFT JOIN public."ProduitEligible" pe ON cpe."produitId" = pe.id
    LEFT JOIN public."Expert" e ON ea.expert_id = e.id
    WHERE ea.statut = status_filter
    ORDER BY ea.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 12. Créer la fonction de statistiques
CREATE OR REPLACE FUNCTION public.get_assignment_statistics()
RETURNS TABLE (
    statut VARCHAR(50),
    count BIGINT,
    percentage NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    WITH stats AS (
        SELECT 
            statut,
            COUNT(*) as count,
            COUNT(*) * 100.0 / SUM(COUNT(*)) OVER() as percentage
        FROM public.expertassignment
        GROUP BY statut
    )
    SELECT 
        statut,
        count,
        ROUND(percentage, 2) as percentage
    FROM stats
    ORDER BY count DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 13. Créer la vue pour les rapports
CREATE OR REPLACE VIEW public.v_assignment_reports AS
SELECT 
    DATE_TRUNC('month', ea.created_at) as month,
    pe.category,
    ea.statut,
    COUNT(*) as count,
    COUNT(DISTINCT ea.expert_id) as unique_experts,
    COUNT(DISTINCT cpe."clientId") as unique_clients
FROM public.expertassignment ea
LEFT JOIN public."ClientProduitEligible" cpe ON ea.client_produit_eligible_id = cpe.id
LEFT JOIN public."ProduitEligible" pe ON cpe."produitId" = pe.id
GROUP BY DATE_TRUNC('month', ea.created_at), pe.category, ea.statut
ORDER BY month DESC, category, statut;

-- 14. Créer des politiques RLS plus avancées
DO $$
BEGIN
    -- Politique pour les experts: voir leurs propres assignations
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'expertassignment' 
        AND policyname = 'Experts can view their own assignments'
    ) THEN
        CREATE POLICY "Experts can view their own assignments" ON public.expertassignment
        FOR SELECT USING (
            auth.uid()::text = expert_id::text
        );
    END IF;
    
    -- Politique pour les clients: voir les assignations liées à leurs produits
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'expertassignment' 
        AND policyname = 'Clients can view assignments for their products'
    ) THEN
        CREATE POLICY "Clients can view assignments for their products" ON public.expertassignment
        FOR SELECT USING (
            EXISTS (
                SELECT 1 FROM public."ClientProduitEligible" cpe
                WHERE cpe.id = expertassignment.client_produit_eligible_id
                AND cpe."clientId"::text = auth.uid()::text
            )
        );
    END IF;
END $$;

-- 15. Finaliser avec des optimisations
ANALYZE public.expertassignment;
ANALYZE public."ProduitEligible";
ANALYZE public.message;
ANALYZE public."ClientProduitEligible";

-- Message de confirmation
DO $$
BEGIN
    RAISE NOTICE 'Migration complète appliquée avec succès !';
    RAISE NOTICE 'Tables utilisées: Client, ProduitEligible, ClientProduitEligible, Expert, expertassignment, message';
    RAISE NOTICE 'Colonnes utilisées: clientId, produitId, name (noms exacts trouvés)';
    RAISE NOTICE 'Colonnes ajoutées: client_produit_eligible_id, statut, category, active, timestamp';
    RAISE NOTICE 'RLS activé sur: expertassignment, message, notification';
    RAISE NOTICE 'Vues créées: v_expert_assignments, v_messages_with_users, v_assignment_reports';
    RAISE NOTICE 'Fonctions créées: get_assignment_statistics, get_expert_assignments_by_status';
END $$;
```

## 🧪 Vérification Après Application

### Test 1 : Vérifier les Colonnes
```sql
-- Vérifier que la colonne client_produit_eligible_id existe
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'expertassignment' 
AND column_name = 'client_produit_eligible_id';

-- Vérifier que la colonne statut existe
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'expertassignment' 
AND column_name = 'statut';
```

### Test 2 : Tester la Vue
```sql
-- Tester la vue v_expert_assignments
SELECT * FROM v_expert_assignments LIMIT 5;
```

### Test 3 : Tester la Fonction
```sql
-- Tester la fonction de statistiques
SELECT * FROM get_assignment_statistics();
```

### Test 4 : Tester les Jointures
```sql
-- Tester la jointure Expert avec name
SELECT 
    e.id,
    e.name,
    e.email,
    e.company_name
FROM "Expert" e
LIMIT 5;
```

## 🚀 Prochaines Étapes

Une fois la migration appliquée avec succès :

1. **Vérifier les tests** : `node scripts/test-schema-corrections.js`
2. **Démarrer le dashboard** : `node scripts/start-dashboard-admin.js`
3. **Tester l'intégration** : `node scripts/test-integration-complete.js`

## 📞 En Cas de Problème

Si d'autres erreurs surviennent :

1. **Vérifier les logs** dans Supabase
2. **Tester les jointures** une par une
3. **Vérifier les permissions** utilisateur
4. **Consulter** les messages d'erreur détaillés

---

**Statut** : ✅ Prêt pour application  
**Complexité** : 🟢 Simple  
**Temps estimé** : 2-3 minutes  
**Corrections** : Tous les noms exacts utilisés (y compris name pour Expert) 