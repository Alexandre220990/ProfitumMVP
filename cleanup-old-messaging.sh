#!/bin/bash

# Script de nettoyage des anciens fichiers de messagerie
# Date: 2025-01-03

echo "🧹 Nettoyage des anciens fichiers de messagerie..."

# ========================================
# FICHIERS À SUPPRIMER (CLIENT)
# ========================================

echo "📁 Suppression des anciens hooks WebSocket..."

# Hooks WebSocket obsolètes
rm -f client/src/hooks/use-unified-websocket.ts
rm -f client/src/hooks/use-unified-messaging.ts
rm -f client/src/hooks/use-messaging.ts

echo "📁 Suppression des anciens composants..."

# Composants obsolètes
rm -f client/src/components/UnifiedMessaging.tsx
rm -f client/src/components/messaging/UnifiedMessagingInterface.tsx
rm -f client/src/components/messaging/RealTimeMessaging.tsx
rm -f client/src/components/messaging/MessageThread.tsx

# ========================================
# FICHIERS À SUPPRIMER (SERVEUR)
# ========================================

echo "📁 Suppression des anciens services WebSocket..."

# Services WebSocket obsolètes
rm -f server/src/services/unified-websocket.ts
rm -f server/src/services/websocketService.ts
rm -f server/src/services/socket-service.ts
rm -f server/src/websocket-server.ts

# ========================================
# FICHIERS À SUPPRIMER (PAGES OBSOLÈTES)
# ========================================

echo "📁 Suppression des anciennes pages..."

# Pages obsolètes
rm -f client/src/pages/messagerie-expert.tsx
rm -f client/src/pages/admin/messagerie-admin.tsx

# ========================================
# FICHIERS À SUPPRIMER (SERVICES OBSOLÈTES)
# ========================================

echo "📁 Suppression des anciens services..."

# Services obsolètes
rm -f client/src/services/messaging-service.ts

# ========================================
# VÉRIFICATION ET RAPPORT
# ========================================

echo ""
echo "✅ Nettoyage terminé !"
echo ""
echo "📋 Fichiers supprimés :"
echo "   - Hooks WebSocket obsolètes"
echo "   - Composants de messagerie unifiés"
echo "   - Services WebSocket serveur"
echo "   - Pages de messagerie obsolètes"
echo ""
echo "🆕 Nouveaux fichiers créés :"
echo "   - client/src/services/supabase-messaging.ts"
echo "   - client/src/hooks/use-supabase-messaging.ts"
echo "   - client/src/components/messaging/MessagingProvider.tsx"
echo "   - client/src/components/messaging/MessageItem.tsx"
echo "   - client/src/components/messaging/MessageInput.tsx"
echo "   - client/src/components/messaging/MessagingApp.tsx"
echo "   - server/migrations/20250103_supabase_realtime_messaging.sql"
echo ""
echo "🚀 Architecture optimisée avec Supabase Realtime !" 