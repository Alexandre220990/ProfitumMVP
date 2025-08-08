#!/bin/bash

echo "🚀 Installation et exécution du script d'upload des guides..."

# Aller dans le dossier scripts
cd "$(dirname "$0")"

# Vérifier si Node.js est installé
if ! command -v node &> /dev/null; then
    echo "❌ Node.js n'est pas installé. Veuillez l'installer d'abord."
    exit 1
fi

# Vérifier si npm est installé
if ! command -v npm &> /dev/null; then
    echo "❌ npm n'est pas installé. Veuillez l'installer d'abord."
    exit 1
fi

echo "📦 Installation des dépendances..."

# Installer les dépendances
npm install

echo "✅ Dépendances installées !"

echo ""
echo "🔧 Configuration Supabase..."
echo "⚠️  IMPORTANT: Vous devez configurer vos variables d'environnement Supabase"
echo ""
echo "Créez un fichier .env dans le dossier scripts avec :"
echo "SUPABASE_URL=https://votre-projet.supabase.co"
echo "SUPABASE_ANON_KEY=votre-clé-anon"
echo ""

# Vérifier si le fichier .env existe
if [ ! -f .env ]; then
    echo "❌ Fichier .env non trouvé !"
    echo "Veuillez créer le fichier .env avec vos informations Supabase"
    exit 1
fi

echo "✅ Configuration trouvée !"

echo ""
echo "🚀 Lancement de l'upload des guides..."

# Exécuter le script
node upload-guides.js

echo ""
echo "🎉 Script terminé !"
echo ""
echo "📋 Vérifiez dans votre bucket Supabase 'formation' que les fichiers ont été uploadés."
