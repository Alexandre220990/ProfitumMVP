import React, { createContext, useContext, useEffect } from 'react';
import { usePreferences } from '@/hooks/use-preferences';

type Theme = 'light' | 'dark';

interface ThemeContextType {
    theme: Theme;
    toggleTheme: () => Promise<void>;
}

const ThemeContext = createContext<ThemeContextType>({
    theme: 'light',
    toggleTheme: async () => {}
});

export const useTheme = () => useContext(ThemeContext);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    const { preferences, updateUISettings } = usePreferences();
    const theme = preferences?.ui_settings?.theme || 'light';

    useEffect(() => {
        document.documentElement.classList.remove('light', 'dark');
        document.documentElement.classList.add(theme);
    }, [theme]);

    const toggleTheme = async () => {
        const newTheme = theme === 'light' ? 'dark' : 'light';
        await updateUISettings({ theme: newTheme });
    };

    return (
        <ThemeContext.Provider value={{ theme, toggleTheme }}>
            {children}
        </ThemeContext.Provider>
    );
} 