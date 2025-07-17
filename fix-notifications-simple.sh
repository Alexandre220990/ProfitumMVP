#!/bin/bash

# Script simple pour corriger la table Notification
# Date: 2025-01-03

echo "🔧 Correction de la table Notification..."

# Appliquer la migration SQL directement
psql "postgresql://postgres.gvvlsgtubqfxdztldunj:eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd2dmxnc3R1YnFmeGR6dGxkdW5qIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczOTU0OTMzNywiZXhwIjoyMDU1MTI1MzM3fQ.Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8@aws-0-eu-central-1.pooler.supabase.com:6543/postgres" \
  -f server/migrations/20250103_fix_notification_structure.sql

echo "✅ Correction appliquée !" 