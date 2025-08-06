-- ============================================================================
-- VÉRIFICATION ALIGNEMENT API ROUTES vs BASE DE DONNÉES
-- ============================================================================

-- 1. VÉRIFICATION DES ROUTES CALENDAR

-- POST /api/calendar/events
SELECT 
    'CALENDAR_API_ROUTES' as check_type,
    'POST /api/calendar/events' as route,
    'CalendarEvent' as table_name,
    'title,description,start_date,end_date,type,priority,status' as required_columns,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'CalendarEvent' 
            AND column_name IN ('title', 'description', 'start_date', 'end_date', 'type', 'priority', 'status')
        ) THEN '✅ ALIGNÉ'
        ELSE '❌ NON ALIGNÉ'
    END as alignment_status;

-- 2. VÉRIFICATION DES ROUTES SIMULATIONS

-- POST /api/simulations
SELECT 
    'SIMULATIONS_API_ROUTES' as check_type,
    'POST /api/simulations' as route,
    'simulations' as table_name,
    'client_id,type,answers,status,expires_at' as required_columns,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'simulations' 
            AND column_name IN ('client_id', 'type', 'answers', 'status', 'expires_at')
        ) THEN '✅ ALIGNÉ'
        ELSE '❌ NON ALIGNÉ'
    END as alignment_status

UNION ALL

-- GET /api/simulations/check-recent/:clientId
SELECT 
    'SIMULATIONS_API_ROUTES' as check_type,
    'GET /api/simulations/check-recent/:clientId' as route,
    'simulations' as table_name,
    'client_id,created_at,status' as required_columns,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'simulations' 
            AND column_name IN ('client_id', 'created_at', 'status')
        ) THEN '✅ ALIGNÉ'
        ELSE '❌ NON ALIGNÉ'
    END as alignment_status

UNION ALL

-- GET /api/simulations/client/:clientId
SELECT 
    'SIMULATIONS_API_ROUTES' as check_type,
    'GET /api/simulations/client/:clientId' as route,
    'simulations' as table_name,
    'client_id,created_at' as required_columns,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'simulations' 
            AND column_name IN ('client_id', 'created_at')
        ) THEN '✅ ALIGNÉ'
        ELSE '❌ NON ALIGNÉ'
    END as alignment_status;

-- 3. VÉRIFICATION DES ROUTES DOCUMENTS

-- GEDDocument routes
SELECT 
    'DOCUMENTS_API_ROUTES' as check_type,
    'POST /api/documents' as route,
    'GEDDocument' as table_name,
    'title,description,content,category,file_path,created_by' as required_columns,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'GEDDocument' 
            AND column_name IN ('title', 'description', 'content', 'category', 'file_path', 'created_by')
        ) THEN '✅ ALIGNÉ'
        ELSE '❌ NON ALIGNÉ'
    END as alignment_status;

-- 4. VÉRIFICATION DES ROUTES CLIENT-DOCUMENTS

-- GET /api/client-documents/client/:clientId
SELECT 
    'CLIENT_DOCUMENTS_API_ROUTES' as check_type,
    'GET /api/client-documents/client/:clientId' as route,
    'Audit,simulations' as tables_used,
    'clientId,client_id' as required_columns,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'Audit' 
            AND column_name = 'clientId'
        ) AND EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'simulations' 
            AND column_name = 'client_id'
        ) THEN '✅ ALIGNÉ'
        ELSE '❌ NON ALIGNÉ'
    END as alignment_status;

-- 5. VÉRIFICATION DES ROUTES COLLABORATIVE EVENTS

-- POST /api/collaborative-events
SELECT 
    'COLLABORATIVE_EVENTS_API_ROUTES' as check_type,
    'POST /api/collaborative-events' as route,
    'CalendarEvent' as table_name,
    'title,description,start_date,end_date,type,priority,status,category' as required_columns,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'CalendarEvent' 
            AND column_name IN ('title', 'description', 'start_date', 'end_date', 'type', 'priority', 'status', 'category')
        ) THEN '✅ ALIGNÉ'
        ELSE '❌ NON ALIGNÉ'
    END as alignment_status;

-- 6. VÉRIFICATION DES ROUTES ADMIN

-- GET /api/admin/clients
SELECT 
    'ADMIN_API_ROUTES' as check_type,
    'GET /api/admin/clients' as route,
    'Client' as table_name,
    'id,email,name,company_name,statut,created_at' as required_columns,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'Client' 
            AND column_name IN ('id', 'email', 'name', 'company_name', 'statut', 'created_at')
        ) THEN '✅ ALIGNÉ'
        ELSE '❌ NON ALIGNÉ'
    END as alignment_status;

-- 7. VÉRIFICATION DES ROUTES EXPERTS

-- GET /api/experts
SELECT 
    'EXPERTS_API_ROUTES' as check_type,
    'GET /api/experts' as route,
    'Expert' as table_name,
    'id,email,name,company_name,specializations,rating,status' as required_columns,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'Expert' 
            AND column_name IN ('id', 'email', 'name', 'company_name', 'specializations', 'rating', 'status')
        ) THEN '✅ ALIGNÉ'
        ELSE '❌ NON ALIGNÉ'
    END as alignment_status;

-- 8. RÉSUMÉ GLOBAL DES API ROUTES

SELECT 
    'API_ROUTES_SUMMARY' as check_type,
    COUNT(*) as total_routes_checked,
    COUNT(CASE WHEN alignment_status = '✅ ALIGNÉ' THEN 1 END) as aligned_routes,
    COUNT(CASE WHEN alignment_status = '❌ NON ALIGNÉ' THEN 1 END) as misaligned_routes,
    ROUND(
        COUNT(CASE WHEN alignment_status = '✅ ALIGNÉ' THEN 1 END) * 100.0 / COUNT(*), 
        2
    ) as alignment_percentage
FROM (
    SELECT 'POST /api/calendar/events' as route, 'CalendarEvent' as table_name,
           CASE WHEN EXISTS (
               SELECT 1 FROM information_schema.columns 
               WHERE table_schema = 'public' 
               AND table_name = 'CalendarEvent' 
               AND column_name IN ('title', 'description', 'start_date', 'end_date', 'type', 'priority', 'status')
           ) THEN '✅ ALIGNÉ' ELSE '❌ NON ALIGNÉ' END as alignment_status
    
    UNION ALL
    
    SELECT 'POST /api/simulations' as route, 'simulations' as table_name,
           CASE WHEN EXISTS (
               SELECT 1 FROM information_schema.columns 
               WHERE table_schema = 'public' 
               AND table_name = 'simulations' 
               AND column_name IN ('client_id', 'type', 'answers', 'status')
           ) THEN '✅ ALIGNÉ' ELSE '❌ NON ALIGNÉ' END as alignment_status
    
    UNION ALL
    
    SELECT 'POST /api/documents' as route, 'GEDDocument' as table_name,
           CASE WHEN EXISTS (
               SELECT 1 FROM information_schema.columns 
               WHERE table_schema = 'public' 
               AND table_name = 'GEDDocument' 
               AND column_name IN ('title', 'description', 'content', 'category')
           ) THEN '✅ ALIGNÉ' ELSE '❌ NON ALIGNÉ' END as alignment_status
    
    UNION ALL
    
    SELECT 'GET /api/admin/clients' as route, 'Client' as table_name,
           CASE WHEN EXISTS (
               SELECT 1 FROM information_schema.columns 
               WHERE table_schema = 'public' 
               AND table_name = 'Client' 
               AND column_name IN ('id', 'email', 'name', 'statut')
           ) THEN '✅ ALIGNÉ' ELSE '❌ NON ALIGNÉ' END as alignment_status
    
    UNION ALL
    
    SELECT 'GET /api/experts' as route, 'Expert' as table_name,
           CASE WHEN EXISTS (
               SELECT 1 FROM information_schema.columns 
               WHERE table_schema = 'public' 
               AND table_name = 'Expert' 
               AND column_name IN ('id', 'email', 'name', 'specializations', 'rating')
           ) THEN '✅ ALIGNÉ' ELSE '❌ NON ALIGNÉ' END as alignment_status
) as api_routes; 