export interface StudySession {
  id: string;
  userId: string;
  taskId: string | null;
  durationMinutes: number;
  startedAt: Date;
  endedAt: Date;
  createdAt: Date;
}

export interface CreateStudySessionRequest {
  minutes: number;
}

export interface StudyPlan {
  id: string;
  userId: string;
  goal: string;
  durationDays: number;
  dailyStudyMinutes: number;
  weeklyTargets: string | null;
  topics: string | null;
  revisionSchedule: string | null;
  mockInterviews: string | null;
  projects: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface DailyPlan {
  id: string;
  userId: string;
  date: Date;
  summary: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface StudyStats {
  totalSessions: number;
  totalMinutes: number;
  averageSessionMinutes: number;
  longestStreak: number;
  currentStreak: number;
}