import dotenv from 'dotenv';

dotenv.config();

export const PYTHON_API_URL = process.env.PYTHON_API_URL || 'http://[::1]:5001';
console.log('URL de l\'API Python configurée sur:', PYTHON_API_URL); 