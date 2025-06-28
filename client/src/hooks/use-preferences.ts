import { useState, useEffect } from 'react';
import { useAuth } from './use-auth';
import { get, post, put } from '@/lib/api';
import type { UserPreferences, UISettings, UsePreferencesReturn } from '@/types/preferences';

const defaultPreferences: UserPreferences = {
    id: 0,
    user_id: '',
    dashboard_visited: false,
    tutorial_completed: {},
    ui_settings: {
        theme: 'light',
        language: 'fr',
        notifications: {
            email: true,
            push: true
        }
    },
    notifications_settings: {
        email: true,
        push: true
    },
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
};

export function usePreferences(): UsePreferencesReturn {
    const { user } = useAuth();
    const [preferences, setPreferences] = useState<UserPreferences | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        async function fetchPreferences() {
            if (!user) {
                setPreferences(null);
                setIsLoading(false);
                return;
            }

            try {
                const response = await get<{ data: UserPreferences }>('/api/preferences');
                setPreferences(response.data);
            } catch (err) {
                // Si les préférences n'existent pas encore, on crée les préférences par défaut
                if ((err as any).status === 404) {
                    try {
                        const response = await post<{ data: UserPreferences }>('/api/preferences', {
                            ...defaultPreferences,
                            user_id: user.id
                        });
                        setPreferences(response.data);
                    } catch (createErr) {
                        setError(createErr as Error);
                    }
                } else {
                    setError(err as Error);
                }
            } finally {
                setIsLoading(false);
            }
        }

        fetchPreferences();
    }, [user]);

    const updatePreferences = async (updates: Partial<UserPreferences>) => {
        if (!preferences) return;

        try {
            const response = await put<{ data: UserPreferences }>('/api/preferences', updates);
            setPreferences(response.data);
        } catch (err) {
            setError(err as Error);
            throw err;
        }
    };

    const setDashboardVisited = async () => {
        await updatePreferences({ dashboard_visited: true });
    };

    const setTutorialCompleted = async (tutorialKey: string) => {
        if (!preferences) return;

        const updatedTutorials = {
            ...preferences.tutorial_completed,
            [tutorialKey]: true
        };

        await updatePreferences({ tutorial_completed: updatedTutorials });
    };

    const updateUISettings = async (settings: Partial<UISettings>) => {
        if (!preferences) return;

        const updatedSettings = {
            ...preferences.ui_settings,
            ...settings
        };

        await updatePreferences({ ui_settings: updatedSettings });
    };

    const updateNotificationSettings = async (settings: { email?: boolean; push?: boolean }) => {
        if (!preferences) return;

        const updatedSettings = {
            ...preferences.notifications_settings,
            ...settings
        };

        await updatePreferences({ notifications_settings: updatedSettings });
    };

    const setLastViewedRequest = async (requestId: number) => {
        await updatePreferences({ last_viewed_request: requestId });
    };

    return {
        preferences,
        isLoading,
        error,
        updatePreferences,
        setDashboardVisited,
        setTutorialCompleted,
        updateUISettings,
        updateNotificationSettings,
        setLastViewedRequest
    };
} 