export interface UISettings {
    theme: 'light' | 'dark';
    language: 'fr' | 'en';
    notifications: {
        email: boolean;
        push: boolean;
    };
}

export interface TutorialState {
    [key: string]: boolean;
}

export interface UserPreferences {
    id: number;
    user_id: string;
    dashboard_visited: boolean;
    tutorial_completed: TutorialState;
    ui_settings: UISettings;
    notifications_settings: {
        email: boolean;
        push: boolean;
    };
    last_viewed_request?: number;
    created_at: string;
    updated_at: string;
}

export interface UsePreferencesReturn {
    preferences: UserPreferences | null;
    isLoading: boolean;
    error: Error | null;
    updatePreferences: (updates: Partial<UserPreferences>) => Promise<void>;
    setDashboardVisited: () => Promise<void>;
    setTutorialCompleted: (tutorialKey: string) => Promise<void>;
    updateUISettings: (settings: Partial<UISettings>) => Promise<void>;
    updateNotificationSettings: (settings: { email?: boolean; push?: boolean }) => Promise<void>;
    setLastViewedRequest: (requestId: number) => Promise<void>;
} 