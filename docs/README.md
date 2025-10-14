# 📚 Documentation - Profitum

**Organisation de la documentation du projet**

---

## 📁 Structure

```
docs/
├── README.md                          (ce fichier)
├── session-2025-10-14/                Session corrections espace client
│   ├── Analyses/                      Analyses détaillées des erreurs
│   ├── Corrections/                   Rapports de corrections
│   ├── Migration/                     Migration WebSocket → Realtime
│   └── Résumés/                       Résumés de session
├── guides/                            Guides pratiques
│   ├── README-SYSTEME-REALTIME.md     Guide système temps réel
│   ├── GUIDE-SYSTEME-HYBRIDE.md       Guide messagerie hybride
│   ├── FINAL-CHECKLIST.md             Checklist finale
│   ├── TODO-ACTIVATION-REALTIME.md    Guide activation Realtime
│   ├── TEST-FINAL-PRET-A-EXECUTER.sql Tests Realtime
│   └── COMMIT-FINAL.sh                Script déploiement
└── archives/                          Archives anciennes sessions
```

---

## 📖 GUIDES PRINCIPAUX

### Système Temps Réel
**Fichier**: `guides/README-SYSTEME-REALTIME.md`

Guide complet du système temps réel avec Supabase Realtime:
- Architecture
- Hooks disponibles
- Exemples d'utilisation
- Tests et debug

### Système Hybride Messagerie
**Fichier**: `guides/GUIDE-SYSTEME-HYBRIDE.md`

Guide du système hybride de messagerie:
- use-messaging.ts (messagerie élaborée)
- useRealtimeMessages (chat rapide)
- useRealtimeNotifications (notifications)
- Quand utiliser quoi

### Checklist Finale
**Fichier**: `guides/FINAL-CHECKLIST.md`

Validation complète de tous les composants du projet.

---

## 📅 Session du 14 Octobre 2025

**Dossier**: `session-2025-10-14/`

### Corrections Espace Client
- ✅ ApporteurAffaires.name corrigé
- ✅ meeting_type validation
- ✅ apporteur_id nullable
- ✅ check_future_date supprimé
- ✅ Logs WebSocket nettoyés
- ✅ Migration complète vers Supabase Realtime

### Résultats
- 7 problèmes corrigés
- 2 nouveaux hooks créés
- 30+ documents créés
- Tests 100% validés
- 0 erreur finale

**Documentation complète disponible dans le dossier.**

---

## 🎯 DÉMARRAGE RAPIDE

### Utiliser la messagerie temps réel

```typescript
// Chat rapide
import { useRealtimeMessages } from '@/hooks/useRealtimeMessages';
const { messages, sendMessage } = useRealtimeMessages({ conversationId });

// Notifications
import { useRealtimeNotifications } from '@/hooks/useRealtimeNotifications';
const { notifications, unreadCount } = useRealtimeNotifications();
```

### Activer Realtime sur nouvelle table

```sql
ALTER PUBLICATION supabase_realtime ADD TABLE ma_table;
```

Voir: `guides/README-SYSTEME-REALTIME.md` pour plus de détails.

---

## 🔗 LIENS UTILES

- [Supabase Realtime](https://supabase.com/docs/guides/realtime)
- [Hooks React](../client/src/hooks/)
- [Architecture](./guides/GUIDE-SYSTEME-HYBRIDE.md)

---

**Documentation mise à jour**: 14 octobre 2025
