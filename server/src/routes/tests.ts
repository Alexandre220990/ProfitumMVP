import express from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { createClient } from '@supabase/supabase-js';
import { exec } from 'child_process';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const router = express.Router();

// Configuration Supabase
const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Validation des catégories autorisées
const ALLOWED_CATEGORIES = ['security', 'performance', 'database', 'api', 'system'];
const ALLOWED_TESTS = {
    security: ['testISO27001Compliance', 'testVulnerabilityScan', 'testAuthenticationSecurity', 'testDataEncryption', 'testAccessControls'],
    performance: ['testSystemMetrics', 'testDatabasePerformance', 'testAPIPerformance', 'testMemoryUsage', 'testResponseTime'],
    database: ['testDatabaseConnectivity', 'testDataIntegrity', 'testQueryPerformance', 'testBackupVerification', 'testIndexes', 'testConstraints'],
    api: ['testAPIEndpoints', 'testAuthentication', 'testDataValidation', 'testErrorHandling', 'testRateLimiting'],
    system: ['testSystemResources', 'testProcessMonitoring', 'testFileSystem', 'testNetworkConnectivity', 'testSystemLogs']
};

// Fonction de validation sécurisée
const validateInput = (input: string): boolean => {
    // Vérifier que l'entrée ne contient que des caractères autorisés
    const safePattern = /^[a-zA-Z0-9_-]+$/;
    return safePattern.test(input) && input.length <= 50;
};

// Fonction pour exécuter les scripts de manière sécurisée
const executeTestScript = async (scriptPath: string, args: string[] = []): Promise<any> => {
    return new Promise((resolve, reject) => {
        // Vérifier que le script existe
        if (!fs.existsSync(scriptPath)) {
            return reject(new Error(`Script non trouvé: ${scriptPath}`));
        }

        // Construire la commande de manière sécurisée
        const sanitizedArgs = args.map(arg => {
            if (!validateInput(arg)) {
                throw new Error(`Argument invalide: ${arg}`);
            }
            return arg;
        });

        const command = `node "${scriptPath}" ${sanitizedArgs.map(arg => `"${arg}"`).join(' ')}`;
        
        console.log(`🔒 Exécution sécurisée: ${command}`);

        exec(command, {
            timeout: 300000, // 5 minutes de timeout
            maxBuffer: 1024 * 1024 * 10 // 10MB de buffer
        }, (error: any, stdout: string, stderr: string) => {
            if (error) {
                console.error('❌ Erreur lors de l\'exécution des tests:', error);
                return reject(error);
            }
            
            if (stderr) {
                console.warn('⚠️ stderr:', stderr);
            }
            
            console.log('📋 stdout:', stdout);
            
            // Parser le résultat JSON de manière sécurisée
            try {
                const lines = stdout.split('\n');
                const jsonLine = lines.find(line => line.trim().startsWith('{'));
                if (jsonLine) {
                    const parsedResult = JSON.parse(jsonLine);
                    resolve(parsedResult);
                } else {
                    resolve({ 
                        success: true, 
                        message: 'Tests terminés',
                        output: stdout.substring(0, 1000) // Limiter la taille de la sortie
                    });
                }
            } catch (parseError) {
                console.warn('⚠️ Erreur de parsing JSON:', parseError);
                resolve({ 
                    success: true, 
                    message: 'Tests terminés', 
                    output: stdout.substring(0, 1000)
                });
            }
        });
    });
};

/**
 * POST /api/tests/run-all - Lancer tous les tests
 */
router.post('/run-all', asyncHandler(async (req, res) => {
    const scriptPath = path.resolve(__dirname, '../../scripts/tests/run-all-tests.js');

    console.log('🚀 Lancement sécurisé de tous les tests...');

    try {
        const result = await executeTestScript(scriptPath);
        
        return res.json({
            success: true,
            message: 'Tous les tests ont été lancés avec succès',
            data: result
        });
    } catch (error: any) {
        console.error('❌ Erreur lors du lancement des tests:', error);
        return res.status(500).json({
            success: false,
            message: 'Erreur lors du lancement des tests',
            error: error?.message || 'Erreur inconnue'
        });
    }
}));

/**
 * POST /api/tests/run-category/:category - Lancer les tests d'une catégorie
 */
router.post('/run-category/:category', asyncHandler(async (req, res) => {
    const { category } = req.params;

    // Validation de la catégorie
    if (!ALLOWED_CATEGORIES.includes(category)) {
        return res.status(400).json({
            success: false,
            message: `Catégorie non autorisée: ${category}`,
            allowed_categories: ALLOWED_CATEGORIES
        });
    }

    const scriptPath = path.resolve(__dirname, '../../scripts/tests/run-all-tests.js');

    console.log(`🚀 Lancement sécurisé des tests de la catégorie: ${category}`);

    try {
        const result = await executeTestScript(scriptPath, [category]);
        
        return res.json({
            success: true,
            message: `Tests de la catégorie ${category} lancés avec succès`,
            data: result
        });
    } catch (error: any) {
        console.error(`❌ Erreur lors des tests ${category}:`, error);
        return res.status(500).json({
            success: false,
            message: `Erreur lors des tests ${category}`,
            error: error?.message || 'Erreur inconnue'
        });
    }
}));

/**
 * POST /api/tests/run-specific/:category/:test - Lancer un test spécifique
 */
router.post('/run-specific/:category/:test', asyncHandler(async (req, res) => {
    const { category, test } = req.params;

    // Validation de la catégorie
    if (!ALLOWED_CATEGORIES.includes(category)) {
        return res.status(400).json({
            success: false,
            message: `Catégorie non autorisée: ${category}`,
            allowed_categories: ALLOWED_CATEGORIES
        });
    }

    // Validation du test
    const allowedTests = ALLOWED_TESTS[category as keyof typeof ALLOWED_TESTS] || [];
    if (!allowedTests.includes(test)) {
        return res.status(400).json({
            success: false,
            message: `Test non autorisé: ${test}`,
            allowed_tests: allowedTests
        });
    }

    const scriptPath = path.resolve(__dirname, '../../scripts/tests/run-all-tests.js');

    console.log(`🚀 Lancement sécurisé du test ${test} dans la catégorie ${category}`);

    try {
        const result = await executeTestScript(scriptPath, [category, test]);
        
        return res.json({
            success: true,
            message: `Test ${test} de la catégorie ${category} lancé avec succès`,
            data: result
        });
    } catch (error: any) {
        console.error(`❌ Erreur lors du test ${test}:`, error);
        return res.status(500).json({
            success: false,
            message: `Erreur lors du test ${test}`,
            error: error?.message || 'Erreur inconnue'
        });
    }
}));

/**
 * GET /api/tests/results - Récupérer les derniers résultats de tests
 */
router.get('/results', asyncHandler(async (req, res) => {
    const hours = parseInt(req.query.hours as string) || 24;
    
    // Validation du paramètre hours
    if (hours < 1 || hours > 168) { // Entre 1 heure et 1 semaine
        return res.status(400).json({
            success: false,
            message: 'Le paramètre hours doit être entre 1 et 168'
        });
    }
    
    try {
        // Récupérer les rapports de tests récents
        const { data: reports, error } = await supabase
            .from('iso_reports')
            .select('*')
            .like('script_name', '%TEST%')
            .gte('timestamp', new Date(Date.now() - hours * 60 * 60 * 1000).toISOString())
            .order('timestamp', { ascending: false })
            .limit(50);

        if (error) {
            throw error;
        }

        return res.json({
            success: true,
            data: {
                reports: reports || [],
                summary: {
                    total_reports: reports?.length || 0,
                    time_range_hours: hours
                }
            }
        });
    } catch (error: any) {
        console.error('❌ Erreur lors de la récupération des résultats:', error);
        return res.status(500).json({
            success: false,
            message: 'Erreur lors de la récupération des résultats',
            error: error?.message || 'Erreur inconnue'
        });
    }
}));

/**
 * GET /api/tests/categories - Récupérer les catégories de tests disponibles
 */
router.get('/categories', asyncHandler(async (req, res) => {
    const categories = [
        {
            id: 'security',
            name: 'Sécurité',
            description: 'Tests d\'audit ISO 27001, scan de vulnérabilités, authentification',
            tests: ALLOWED_TESTS.security
        },
        {
            id: 'performance',
            name: 'Performance',
            description: 'Tests de charge, monitoring des métriques, temps de réponse',
            tests: ALLOWED_TESTS.performance
        },
        {
            id: 'database',
            name: 'Base de Données',
            description: 'Intégrité des données, performance des requêtes, sauvegardes',
            tests: ALLOWED_TESTS.database
        },
        {
            id: 'api',
            name: 'API',
            description: 'Endpoints, authentification, validation des données',
            tests: ALLOWED_TESTS.api
        },
        {
            id: 'system',
            name: 'Système',
            description: 'Monitoring CPU/Mémoire, logs système, services critiques',
            tests: ALLOWED_TESTS.system
        }
    ];

    return res.json({
        success: true,
        data: categories
    });
}));

/**
 * GET /api/tests/status - Statut du système de tests
 */
router.get('/status', asyncHandler(async (req, res) => {
    try {
        const testScripts = [
            'security-tests.js',
            'performance-tests.js',
            'database-tests.js',
            'api-tests.js',
            'system-tests.js',
            'run-all-tests.js'
        ];

        const scriptsStatus = testScripts.map(script => {
            const scriptPath = path.resolve(__dirname, `../../scripts/tests/${script}`);
            const exists = fs.existsSync(scriptPath);
            return {
                name: script,
                exists,
                path: scriptPath,
                status: exists ? 'ready' : 'missing'
            };
        });

        const allScriptsExist = scriptsStatus.every(script => script.exists);
        const readyScripts = scriptsStatus.filter(script => script.exists).length;

        return res.json({
            success: true,
            data: {
                status: allScriptsExist ? 'ready' : 'incomplete',
                scripts: scriptsStatus,
                summary: {
                    total_scripts: testScripts.length,
                    ready_scripts: readyScripts,
                    missing_scripts: testScripts.length - readyScripts
                },
                message: allScriptsExist ? 'Système de tests prêt' : 'Certains scripts de tests manquent'
            }
        });
    } catch (error: any) {
        console.error('❌ Erreur lors de la vérification du statut:', error);
        return res.status(500).json({
            success: false,
            message: 'Erreur lors de la vérification du statut',
            error: error?.message || 'Erreur inconnue'
        });
    }
}));

export default router; 