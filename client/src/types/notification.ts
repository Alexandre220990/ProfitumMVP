export interface Notification { id: number;
  type: string;
  message: string;
  read: boolean;
  userId: number;
  metadata: Record<string, any> | null;
  createdAt: Date;
  updatedAt: Date; } 