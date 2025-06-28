export interface Appointment {
  id: number;
  clientId: number;
  expertId: number;
  date: Date;
  status: string;
  type: string;
  duration: number;
  location: string;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
} 