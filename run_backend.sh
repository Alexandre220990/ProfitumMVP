#!/bin/bash

# Script simple pour lancer le serveur backend Flask
echo "🚀 Démarrage du serveur backend Flask..."

# Vérifier que l'environnement virtuel existe
if [ ! -d "venv_311" ]; then
    echo "❌ L'environnement virtuel venv_311 n'existe pas."
    exit 1
fi

# Aller dans le dossier server et lancer l'application
cd server
../venv_311/bin/python app.py 