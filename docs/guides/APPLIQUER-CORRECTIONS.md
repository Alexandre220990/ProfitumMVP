# 🔧 APPLIQUER LES CORRECTIONS - Guide Rapide

**Script généré automatiquement :** `server/migrations/20250110_correction_rdv.sql`

---

## 📋 SITUATION ACTUELLE

✅ Tables renommées correctement :
- `ClientRDV` → `RDV` ✅
- `ClientRDV_Produits` → `RDV_Produits` ✅

❌ Colonnes manquantes : 13 colonnes à ajouter

---

## 🎯 SOLUTION (2 MINUTES)

### Méthode 1 : Supabase Dashboard (RECOMMANDÉ)

1. **Ouvrir** le script : `server/migrations/20250110_correction_rdv.sql`
2. **Copier** tout le contenu (Cmd+A puis Cmd+C)
3. **Aller** sur : https://supabase.com/dashboard/project/gvvlsgtubqfxdztldunj/sql/new
4. **Coller** le script (Cmd+V)
5. **Cliquer** sur "Run"
6. ⏱️ **Attendre** ~10 secondes

### Messages attendus :
```
✅ Corrections appliquées avec succès
```

---

## ✅ APRÈS L'EXÉCUTION

### Vérifier :
```bash
node server/scripts/diagnostic-migration-rdv.mjs
```

**Résultat attendu :**
```
✅ Aucune correction nécessaire - Migration complète !
```

### Redémarrer le serveur :
```bash
cd server
npm run dev
```

**Logs attendus :**
```
🎯 Routes RDV unifiées montées sur /api/rdv
```

### Tester l'API :
```bash
./TEST-RDV-API.sh YOUR_TOKEN
```

---

## 📝 CHECKLIST

- [ ] Script de correction copié
- [ ] Exécuté dans Supabase SQL Editor
- [ ] Message de succès affiché
- [ ] Diagnostic re-exécuté → Aucune erreur
- [ ] Serveur redémarré
- [ ] API testée

---

## 🎉 APRÈS VALIDATION

**Migration complète !** Vous pouvez maintenant :
- ✅ Utiliser l'API `/api/rdv`
- ✅ Voir les RDV dans tous les agendas
- ✅ Créer/Modifier/Supprimer des RDV
- ✅ Architecture RDV unifiée opérationnelle

---

**Temps total : 2 minutes** ⏱️

