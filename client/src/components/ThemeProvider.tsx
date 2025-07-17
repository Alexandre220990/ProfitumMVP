import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import { usePreferences } from "@/hooks/use-preferences";
import type { Theme } from "@/types/preferences";

interface ThemeContextType {
  theme: Theme;
  resolvedTheme: 'light' | 'dark';
  toggleTheme: () => Promise<void>;
  setTheme: (theme: Theme) => Promise<void>;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: 'light',
  resolvedTheme: 'light',
  toggleTheme: async () => {},
  setTheme: async () => {}
});

export const useTheme = () => useContext(ThemeContext);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { preferences, updateUISettings } = usePreferences();
  const [systemTheme, setSystemTheme] = useState<'light' | 'dark'>('light');
  
  // Récupérer le thème depuis les préférences ou utiliser 'light' par défaut
  const theme = preferences?.ui_settings?.theme || 'light';
  
  // Calculer le thème résolu (prendre en compte le thème système si 'auto')
  const resolvedTheme = useMemo(() => {
    if (theme === 'auto') {
      return systemTheme;
    }
    return theme as 'light' | 'dark';
  }, [theme, systemTheme]);

  // Détecter le thème système
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleChange = (e: MediaQueryListEvent) => {
      setSystemTheme(e.matches ? 'dark' : 'light');
    };

    // Définir le thème initial
    setSystemTheme(mediaQuery.matches ? 'dark' : 'light');
    
    // Écouter les changements
    mediaQuery.addEventListener('change', handleChange);
    
    return () => {
      mediaQuery.removeEventListener('change', handleChange);
    };
  }, []);

  // Appliquer le thème au document
  useEffect(() => {
    const root = document.documentElement;
    
    // Supprimer les classes existantes
    root.classList.remove('light', 'dark');
    
    // Ajouter la classe du thème résolu
    root.classList.add(resolvedTheme);
    
    // Ajouter un attribut data-theme pour les styles CSS personnalisés
    root.setAttribute('data-theme', resolvedTheme);
  }, [resolvedTheme]);

  // Fonction pour basculer entre les thèmes
  const toggleTheme = useCallback(async () => {
    const newTheme: Theme = theme === 'light' ? 'dark' : theme === 'dark' ? 'auto' : 'light';
    await updateUISettings({ theme: newTheme });
  }, [theme, updateUISettings]);

  // Fonction pour définir un thème spécifique
  const setTheme = useCallback(async (newTheme: Theme) => {
    await updateUISettings({ theme: newTheme });
  }, [updateUISettings]);

  // Valeur du contexte mémorisée
  const contextValue = useMemo(() => ({
    theme,
    resolvedTheme,
    toggleTheme,
    setTheme
  }), [theme, resolvedTheme, toggleTheme, setTheme]);

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
} 