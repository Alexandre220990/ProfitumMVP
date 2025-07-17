#!/usr/bin/env node

import http from 'http';
import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import os from 'os';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = 4000;
const FRONTEND_PORT = 3000;
const BACKEND_PORT = 5001;

// Démarrer le frontend s'il n'est pas déjà en cours
let frontendProcess = null;
let backendProcess = null;

// Fonction pour démarrer le frontend
function startFrontend() {
    console.log('🚀 Démarrage du frontend...');
    frontendProcess = spawn('npm', ['run', 'dev'], {
        cwd: path.join(__dirname, 'client'),
        stdio: 'pipe',
        shell: true
    });
    
    frontendProcess.stdout.on('data', (data) => {
        console.log(`Frontend: ${data}`);
    });
    
    frontendProcess.stderr.on('data', (data) => {
        console.log(`Frontend Error: ${data}`);
    });
}

// Fonction pour démarrer le backend
function startBackend() {
    console.log('🚀 Démarrage du backend...');
    backendProcess = spawn('npm', ['run', 'dev'], {
        cwd: path.join(__dirname, 'server'),
        stdio: 'pipe',
        shell: true
    });
    
    backendProcess.stdout.on('data', (data) => {
        console.log(`Backend: ${data}`);
    });
    
    backendProcess.stderr.on('data', (data) => {
        console.log(`Backend Error: ${data}`);
    });
}

const server = http.createServer((req, res) => {
    const url = req.url;
    
    // Rediriger vers le frontend
    if (url && !url.startsWith('/api')) {
        // Proxy vers le frontend
        const frontendUrl = `http://localhost:${FRONTEND_PORT}${url}`;
        
        const proxyReq = http.request(frontendUrl, {
            method: req.method,
            headers: req.headers
        }, (proxyRes) => {
            res.writeHead(proxyRes.statusCode, proxyRes.headers);
            proxyRes.pipe(res);
        });
        
        req.pipe(proxyReq);
    } else if (url && url.startsWith('/api')) {
        // Proxy vers le backend
        const backendUrl = `http://localhost:${BACKEND_PORT}${url}`;
        
        const proxyReq = http.request(backendUrl, {
            method: req.method,
            headers: req.headers
        }, (proxyRes) => {
            res.writeHead(proxyRes.statusCode, proxyRes.headers);
            proxyRes.pipe(res);
        });
        
        req.pipe(proxyReq);
    } else {
        // Page d'accueil avec redirection
        res.writeHead(200, { 
            'Content-Type': 'text/html; charset=utf-8' 
        });
        res.end(`
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <title>FinancialTracker - Serveur Partagé</title>
                <style>
                    body { font-family: Arial, sans-serif; margin: 40px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; }
                    .container { max-width: 600px; margin: 0 auto; text-align: center; }
                    .btn { display: inline-block; padding: 15px 30px; background: rgba(255,255,255,0.2); color: white; text-decoration: none; border-radius: 8px; margin: 10px; transition: all 0.3s; }
                    .btn:hover { background: rgba(255,255,255,0.3); transform: translateY(-2px); }
                    .status { background: rgba(255,255,255,0.1); padding: 20px; border-radius: 10px; margin: 20px 0; }
                </style>
            </head>
            <body>
                <div class="container">
                    <h1>🌐 FinancialTracker - Serveur Partagé</h1>
                    <div class="status">
                        <h2>✅ Serveur en ligne</h2>
                        <p>Votre application est accessible sur le réseau local</p>
                        <p><strong>Port:</strong> ${PORT}</p>
                    </div>
                    <a href="/" class="btn">🏠 Accéder à l'application</a>
                    <a href="/dashboard/admin" class="btn">⚙️ Dashboard Admin</a>
                    <a href="/monitoring" class="btn">📊 Monitoring</a>
                </div>
            </body>
            </html>
        `);
    }
});

server.listen(PORT, '0.0.0.0', () => {
    console.log(`🌐 Serveur partagé démarré sur http://0.0.0.0:${PORT}`);
    console.log(`📱 Accessible sur le réseau local`);
    console.log(`🔗 Votre IP locale: ${getLocalIP()}:${PORT}`);
    
    // Démarrer les services
    startFrontend();
    startBackend();
});

// Fonction pour obtenir l'IP locale
function getLocalIP() {
    const interfaces = os.networkInterfaces();
    for (const name of Object.keys(interfaces)) {
        for (const interface_ of interfaces[name]) {
            if (interface_.family === 'IPv4' && !interface_.internal) {
                return interface_.address;
            }
        }
    }
    return 'localhost';
}

// Gestion de l'arrêt propre
process.on('SIGTERM', () => {
    console.log('🛑 Arrêt du serveur partagé...');
    if (frontendProcess) frontendProcess.kill();
    if (backendProcess) backendProcess.kill();
    server.close(() => {
        console.log('✅ Serveur partagé arrêté');
        process.exit(0);
    });
});

process.on('SIGINT', () => {
    console.log('🛑 Arrêt du serveur partagé...');
    if (frontendProcess) frontendProcess.kill();
    if (backendProcess) backendProcess.kill();
    server.close(() => {
        console.log('✅ Serveur partagé arrêté');
        process.exit(0);
    });
}); 