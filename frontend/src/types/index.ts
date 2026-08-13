export interface Tag {
  id: number;
  name: string;
}

export interface User {
  id: number;
  email: string;
  role: string;
  fullName?: string;   
  avatarUrl?: string;  
}

export interface Issue {
  id: number;
  title: string;
  description: string;
  status: 'TODO' | 'IN_PROGRESS' | 'RESOLVED' | 'ARCHIVED';
  type: 'QUESTION' | 'BUG' | 'DOCUMENTATION' | 'FEATURE';
  priority?: 'LOW' | 'MEDIUM' | 'HIGH';
  imageUrl?: string;
  assignee?: User | null;
  reporter: User;
  tags?: Tag[];
}

export interface HistoryLog {
  id: number;
  action: string;
  oldValue: string | null;
  newValue: string | null;
  modifiedAt: string;
  modifier: User;
}

export interface AppNotification {
  id: number;
  message: string;
  isRead: boolean;
  createdAt: string;
}

export interface UserMetric {
  userId: number;
  email: string;
  fullName?: string;   
  avatarUrl?: string;  
  openIssues: number;
  resolvedIssues: number;
  avgResolutionTimeHours: number;
}

export interface DashboardMetrics {
  aggregate: {
    totalOpen: number;
    totalResolved: number;
    avgResolutionTimeHours: number;
  };
  userMetrics: UserMetric[];
}