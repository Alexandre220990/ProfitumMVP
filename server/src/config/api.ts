import dotenv from 'dotenv';

dotenv.config();

// PYTHON_API_URL doit rester sur 5001 (API Python)
// WebSocket classique Node : 5002
// WebSocket unifié Node : 5003
// API REST Node : 5004
export const PYTHON_API_URL = process.env.PYTHON_API_URL || 'http://[::1]:5001';
console.log('URL de l\'API Python configurée sur:', PYTHON_API_URL); 