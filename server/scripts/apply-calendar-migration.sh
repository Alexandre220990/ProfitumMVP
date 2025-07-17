#!/bin/bash

# =====================================================
# SCRIPT : Application de la migration Calendrier
# Date : 2025-01-28
# Description : Applique la migration du système de calendrier avancé
# =====================================================

set -e  # Arrêter en cas d'erreur

# Couleurs pour les messages
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
MIGRATION_FILE="migrations/20250128_create_calendar_system.sql"
BACKUP_DIR="server/backups/$(date +%Y%m%d_%H%M%S)_before_calendar_migration"
LOG_FILE="server/logs/calendar_migration_$(date +%Y%m%d_%H%M%S).log"

echo -e "${BLUE}=====================================================${NC}"
echo -e "${BLUE}  MIGRATION SYSTÈME DE CALENDRIER AVANCÉ${NC}"
echo -e "${BLUE}=====================================================${NC}"
echo ""

# Vérification des prérequis
echo -e "${YELLOW}1. Vérification des prérequis...${NC}"

# Vérifier que le fichier de migration existe
if [ ! -f "$MIGRATION_FILE" ]; then
    echo -e "${RED}❌ Fichier de migration non trouvé: $MIGRATION_FILE${NC}"
    exit 1
fi

# Vérifier que les variables d'environnement sont définies
if [ -z "$DATABASE_URL" ]; then
    echo -e "${RED}❌ Variable d'environnement DATABASE_URL manquante${NC}"
    echo "Assurez-vous que DATABASE_URL est définie"
    exit 1
fi

echo -e "${GREEN}✅ Prérequis vérifiés${NC}"
echo ""

# Création du backup
echo -e "${YELLOW}2. Création du backup...${NC}"
mkdir -p "$BACKUP_DIR"

# Backup des tables existantes liées au calendrier
echo "Création du backup des données existantes..."

# Vérifier si les tables existent déjà et les sauvegarder
psql "$DATABASE_URL" -c "
DO \$\$
BEGIN
    -- Backup CalendarEvent si elle existe
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'CalendarEvent') THEN
        COPY (SELECT * FROM \"CalendarEvent\") TO '$BACKUP_DIR/calendar_event_backup.csv' WITH CSV HEADER;
        RAISE NOTICE 'Backup CalendarEvent créé';
    END IF;
    
    -- Backup DossierStep si elle existe
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'DossierStep') THEN
        COPY (SELECT * FROM \"DossierStep\") TO '$BACKUP_DIR/dossier_step_backup.csv' WITH CSV HEADER;
        RAISE NOTICE 'Backup DossierStep créé';
    END IF;
    
    -- Backup CalendarPreferences si elle existe
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'CalendarPreferences') THEN
        COPY (SELECT * FROM \"CalendarPreferences\") TO '$BACKUP_DIR/calendar_preferences_backup.csv' WITH CSV HEADER;
        RAISE NOTICE 'Backup CalendarPreferences créé';
    END IF;
END \$\$;
" 2>/dev/null || echo "Aucune table existante à sauvegarder"

echo -e "${GREEN}✅ Backup créé dans: $BACKUP_DIR${NC}"
echo ""

# Application de la migration
echo -e "${YELLOW}3. Application de la migration...${NC}"

# Créer le dossier de logs
mkdir -p "$(dirname "$LOG_FILE")"

# Appliquer la migration avec logging
echo "Application de la migration du calendrier..."
psql "$DATABASE_URL" -f "$MIGRATION_FILE" > "$LOG_FILE" 2>&1

# Vérifier le succès de la migration
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Migration appliquée avec succès${NC}"
else
    echo -e "${RED}❌ Erreur lors de l'application de la migration${NC}"
    echo "Consultez le log: $LOG_FILE"
    exit 1
fi

echo ""

# Vérification post-migration
echo -e "${YELLOW}4. Vérification post-migration...${NC}"

# Vérifier que les tables ont été créées
echo "Vérification des tables créées..."

TABLES_TO_CHECK=(
    "CalendarEvent"
    "CalendarEventParticipant"
    "CalendarEventReminder"
    "DossierStep"
    "CalendarPreferences"
    "CalendarEventTemplate"
    "CalendarActivityLog"
)

for table in "${TABLES_TO_CHECK[@]}"; do
    if psql "$DATABASE_URL" -c "SELECT 1 FROM \"$table\" LIMIT 1;" >/dev/null 2>&1; then
        echo -e "${GREEN}✅ Table $table créée${NC}"
    else
        echo -e "${RED}❌ Table $table manquante${NC}"
    fi
done

echo ""

# Vérification des vues
echo "Vérification des vues créées..."

VIEWS_TO_CHECK=(
    "v_calendar_events_with_participants"
    "v_dossier_steps_with_assignee"
    "v_today_events"
)

for view in "${VIEWS_TO_CHECK[@]}"; do
    if psql "$DATABASE_URL" -c "SELECT 1 FROM \"$view\" LIMIT 1;" >/dev/null 2>&1; then
        echo -e "${GREEN}✅ Vue $view créée${NC}"
    else
        echo -e "${RED}❌ Vue $view manquante${NC}"
    fi
done

echo ""

# Test des fonctionnalités
echo -e "${YELLOW}5. Test des fonctionnalités...${NC}"

# Test d'insertion d'un événement de test
echo "Test d'insertion d'un événement de test..."

psql "$DATABASE_URL" -c "
INSERT INTO \"CalendarEvent\" (
    title, description, start_date, end_date, type, priority, status, category
) VALUES (
    'Test Migration Calendrier',
    'Événement de test pour vérifier la migration',
    NOW() + INTERVAL '1 hour',
    NOW() + INTERVAL '2 hours',
    'meeting',
    'medium',
    'confirmed',
    'system'
) ON CONFLICT DO NOTHING;
"

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Test d'insertion réussi${NC}"
    
    # Nettoyer l'événement de test
    psql "$DATABASE_URL" -c "
    DELETE FROM \"CalendarEvent\" 
    WHERE title = 'Test Migration Calendrier';
    "
    echo "Événement de test nettoyé"
else
    echo -e "${RED}❌ Test d'insertion échoué${NC}"
fi

echo ""

# Résumé final
echo -e "${BLUE}=====================================================${NC}"
echo -e "${BLUE}  RÉSUMÉ DE LA MIGRATION${NC}"
echo -e "${BLUE}=====================================================${NC}"
echo ""
echo -e "${GREEN}✅ Migration terminée avec succès!${NC}"
echo ""
echo -e "${YELLOW}Tables créées:${NC}"
echo "  • CalendarEvent (Événements du calendrier)"
echo "  • CalendarEventParticipant (Participants aux événements)"
echo "  • CalendarEventReminder (Rappels automatiques)"
echo "  • DossierStep (Étapes de workflow avec échéances)"
echo "  • CalendarPreferences (Préférences utilisateur)"
echo "  • CalendarEventTemplate (Templates d'événements)"
echo "  • CalendarActivityLog (Logs d'activité)"
echo ""
echo -e "${YELLOW}Vues créées:${NC}"
echo "  • v_calendar_events_with_participants"
echo "  • v_dossier_steps_with_assignee"
echo "  • v_today_events"
echo ""
echo -e "${YELLOW}Fonctionnalités disponibles:${NC}"
echo "  • Événements collaboratifs avec participants"
echo "  • Réunions en ligne avec URLs"
echo "  • Échéances d'étapes par dossier"
echo "  • Système de rappels automatiques"
echo "  • Templates d'événements prédéfinis"
echo "  • Préférences utilisateur personnalisables"
echo "  • Logs d'activité pour audit"
echo ""
echo -e "${YELLOW}Fichiers générés:${NC}"
echo "  • Backup: $BACKUP_DIR"
echo "  • Log: $LOG_FILE"
echo ""
echo -e "${BLUE}Prochaines étapes:${NC}"
echo "  1. Tester le composant AdvancedCalendar dans l'interface"
echo "  2. Configurer les préférences utilisateur"
echo "  3. Créer des événements de test"
echo "  4. Vérifier les notifications et rappels"
echo ""
echo -e "${GREEN}🎉 Migration du système de calendrier terminée!${NC}" 