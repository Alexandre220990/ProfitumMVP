// Types pour l'interface expert

export interface Expert {
  id: string;
  username: string;
  email: string;
  specializations: string[];
  experience: number;
  location: string;
  rating: number;
  total_assignments: number;
  completed_assignments: number;
  total_earnings: number;
  monthly_earnings: number;
  created_at: string;
  updated_at: string;
}

export interface ExpertPreferences {
  notifications: {
    email: boolean;
    push: boolean;
    sms: boolean;
    inApp: boolean;
  };
  availability: {
    workingHours: {
      start: string;
      end: string;
    };
    maxAssignments: number;
    preferredProducts: string[];
    autoAccept: boolean;
  };
  compensation: {
    minimumRate: number;
    preferredRate: number;
    autoNegotiate: boolean;
  };
} 