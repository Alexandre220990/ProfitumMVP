#!/bin/bash

# Script pour convertir tous les useToast vers sonner

echo "🔄 Conversion des toasts vers sonner..."

# Fonction pour convertir un fichier
convert_file() {
    local file="$1"
    echo "📝 Conversion de $file"
    
    # Remplacer l'import useToast
    sed -i '' 's/import { useToast } from.*toast.*;/import { toast } from "sonner";/g' "$file"
    
    # Supprimer la ligne const { toast } = useToast();
    sed -i '' '/const { toast } = useToast();/d' "$file"
    
    # Remplacer toast({ title: 'X', description: 'Y' }) par toast.success('Y')
    sed -i '' 's/toast({[^}]*title:[^}]*description:[^}]*});/toast.success(\1);/g' "$file"
    
    # Remplacer toast({ variant: "destructive", ... }) par toast.error(...)
    sed -i '' 's/toast({[^}]*variant:[^}]*"destructive"[^}]*title:[^}]*description:[^}]*});/toast.error(\1);/g' "$file"
    
    echo "✅ $file converti"
}

# Convertir les fichiers principaux
convert_file "client/src/pages/connexion-expert.tsx"
convert_file "client/src/pages/create-account-client.tsx"
convert_file "client/src/pages/create-account-expert.tsx"
convert_file "client/src/pages/connect-admin.tsx"

echo "🎉 Conversion terminée !"
