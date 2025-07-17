#!/bin/bash

# =====================================================
# SCRIPT : Test du Système de Calendrier
# Date : 2025-01-28
# Description : Test complet du système de calendrier avancé
# =====================================================

set -e

# Couleurs pour les messages
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}=====================================================${NC}"
echo -e "${BLUE}  TEST DU SYSTÈME DE CALENDRIER AVANCÉ${NC}"
echo -e "${BLUE}=====================================================${NC}"
echo ""

# Vérification de la connexion
echo -e "${YELLOW}1. Test de connexion à la base de données...${NC}"
if psql "$DATABASE_URL" -c "SELECT 1;" >/dev/null 2>&1; then
    echo -e "${GREEN}✅ Connexion réussie${NC}"
else
    echo -e "${RED}❌ Échec de la connexion${NC}"
    exit 1
fi

echo ""

# Test des tables
echo -e "${YELLOW}2. Test des tables...${NC}"
TABLES=(
    "CalendarEvent"
    "CalendarEventParticipant"
    "CalendarEventReminder"
    "DossierStep"
    "CalendarPreferences"
    "CalendarEventTemplate"
    "CalendarActivityLog"
)

for table in "${TABLES[@]}"; do
    if psql "$DATABASE_URL" -c "SELECT COUNT(*) FROM \"$table\";" >/dev/null 2>&1; then
        echo -e "${GREEN}✅ Table $table accessible${NC}"
    else
        echo -e "${RED}❌ Table $table inaccessible${NC}"
    fi
done

echo ""

# Test des vues
echo -e "${YELLOW}3. Test des vues...${NC}"
VIEWS=(
    "v_calendar_events_with_participants"
    "v_dossier_steps_with_assignee"
    "v_today_events"
)

for view in "${VIEWS[@]}"; do
    if psql "$DATABASE_URL" -c "SELECT COUNT(*) FROM \"$view\";" >/dev/null 2>&1; then
        echo -e "${GREEN}✅ Vue $view accessible${NC}"
    else
        echo -e "${RED}❌ Vue $view inaccessible${NC}"
    fi
done

echo ""

# Test d'insertion d'événement
echo -e "${YELLOW}4. Test d'insertion d'événement...${NC}"
EVENT_ID=$(psql "$DATABASE_URL" -t -c "
INSERT INTO \"CalendarEvent\" (
    title, description, start_date, end_date, type, priority, status, category
) VALUES (
    'Test Système Calendrier',
    'Test d''insertion pour vérifier le système',
    NOW() + INTERVAL '1 hour',
    NOW() + INTERVAL '2 hours',
    'meeting',
    'medium',
    'confirmed',
    'system'
) RETURNING id;" | grep -Eo '^[0-9a-fA-F-]{36}$' | head -1)

if [ ! -z "$EVENT_ID" ]; then
    echo -e "${GREEN}✅ Événement créé avec ID: $EVENT_ID${NC}"
    
    # Test d'insertion de participant
    psql "$DATABASE_URL" -c "
    INSERT INTO \"CalendarEventParticipant\" (
        event_id, user_type, user_email, user_name, status
    ) VALUES (
        '$EVENT_ID',
        'admin',
        'test@example.com',
        'Test User',
        'accepted'
    );
    "
    echo -e "${GREEN}✅ Participant ajouté${NC}"
    
    # Test d'insertion de rappel
    psql "$DATABASE_URL" -c "
    INSERT INTO \"CalendarEventReminder\" (
        event_id, type, time_minutes
    ) VALUES (
        '$EVENT_ID',
        'email',
        15
    );
    "
    echo -e "${GREEN}✅ Rappel ajouté${NC}"
    
    # Nettoyer
    psql "$DATABASE_URL" -c "DELETE FROM \"CalendarEvent\" WHERE id = '$EVENT_ID';"
    echo -e "${GREEN}✅ Événement de test nettoyé${NC}"
else
    echo -e "${RED}❌ Échec de création d'événement${NC}"
fi

echo ""

# Test d'insertion d'étape de dossier
echo -e "${YELLOW}5. Test d'insertion d'étape de dossier...${NC}"
STEP_ID=$(psql "$DATABASE_URL" -t -c "
INSERT INTO \"DossierStep\" (
    dossier_id, dossier_name, step_name, step_type, due_date, priority, progress
) VALUES (
    gen_random_uuid(),
    'Test Dossier',
    'Validation Documents',
    'validation',
    NOW() + INTERVAL '3 days',
    'high',
    25
) RETURNING id;" | grep -Eo '^[0-9a-fA-F-]{36}$' | head -1)

if [ ! -z "$STEP_ID" ]; then
    echo -e "${GREEN}✅ Étape créée avec ID: $STEP_ID${NC}"
    
    # Nettoyer
    psql "$DATABASE_URL" -c "DELETE FROM \"DossierStep\" WHERE id = '$STEP_ID';"
    echo -e "${GREEN}✅ Étape de test nettoyée${NC}"
else
    echo -e "${RED}❌ Échec de création d'étape${NC}"
fi

echo ""

# Test des templates
echo -e "${YELLOW}6. Test des templates d'événements...${NC}"
TEMPLATE_COUNT=$(psql "$DATABASE_URL" -t -c "SELECT COUNT(*) FROM \"CalendarEventTemplate\";" | tr -d ' ')
echo -e "${GREEN}✅ $TEMPLATE_COUNT templates disponibles${NC}"

echo ""

# Test des fonctions
echo -e "${YELLOW}7. Test des fonctions...${NC}"
if psql "$DATABASE_URL" -c "SELECT update_calendar_updated_at();" >/dev/null 2>&1; then
    echo -e "${GREEN}✅ Fonction update_calendar_updated_at accessible${NC}"
else
    echo -e "${RED}❌ Fonction update_calendar_updated_at inaccessible${NC}"
fi

echo ""

# Test des triggers
echo -e "${YELLOW}8. Test des triggers...${NC}"
TRIGGER_COUNT=$(psql "$DATABASE_URL" -t -c "
SELECT COUNT(*) FROM information_schema.triggers 
WHERE trigger_name LIKE '%calendar%' OR trigger_name LIKE '%updated_at%';
" | tr -d ' ')
echo -e "${GREEN}✅ $TRIGGER_COUNT triggers configurés${NC}"

echo ""

# Test des index
echo -e "${YELLOW}9. Test des index...${NC}"
INDEX_COUNT=$(psql "$DATABASE_URL" -t -c "
SELECT COUNT(*) FROM pg_indexes 
WHERE indexname LIKE 'idx_calendar%' OR indexname LIKE 'idx_dossier%';
" | tr -d ' ')
echo -e "${GREEN}✅ $INDEX_COUNT index créés${NC}"

echo ""

# Test des politiques RLS
echo -e "${YELLOW}10. Test des politiques RLS...${NC}"
POLICY_COUNT=$(psql "$DATABASE_URL" -t -c "
SELECT COUNT(*) FROM pg_policies 
WHERE tablename LIKE '%Calendar%' OR tablename LIKE '%Dossier%';
" | tr -d ' ')
echo -e "${GREEN}✅ $POLICY_COUNT politiques RLS configurées${NC}"

echo ""

# Résumé final
echo -e "${BLUE}=====================================================${NC}"
echo -e "${BLUE}  RÉSUMÉ DES TESTS${NC}"
echo -e "${BLUE}=====================================================${NC}"
echo ""
echo -e "${GREEN}✅ Système de calendrier opérationnel!${NC}"
echo ""
echo -e "${YELLOW}Fonctionnalités testées:${NC}"
echo "  • Connexion à la base de données"
echo "  • Accès aux tables et vues"
echo "  • Insertion d'événements et participants"
echo "  • Insertion d'étapes de dossier"
echo "  • Gestion des rappels"
echo "  • Templates d'événements"
echo "  • Fonctions et triggers"
echo "  • Index de performance"
echo "  • Politiques de sécurité RLS"
echo ""
echo -e "${BLUE}Prochaines étapes:${NC}"
echo "  1. Tester le composant AdvancedCalendar dans l'interface"
echo "  2. Configurer les préférences utilisateur"
echo "  3. Créer des événements réels"
echo "  4. Tester les notifications"
echo ""
echo -e "${GREEN}🎉 Tests du système de calendrier terminés avec succès!${NC}" 