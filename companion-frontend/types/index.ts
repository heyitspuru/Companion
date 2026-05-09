export interface User {
  username: string;
  email: string;
  token: string;
}

export interface Member {
  username: string;
  email: string;
  joinedAt: string;
}

export interface Circle {
  id: number;
  name: string;
  inviteCode: string;
  createdBy: string;
  createdAt: string;
  members: Member[];
  status: 'ACTIVE' | 'CONCLUDED' | 'ARCHIVED';
  goalTitle: string;
  goalDescription: string;
  goalCategory: string;
  goalStartDate: string;
  goalEndDate: string;
  completionThreshold: string;
  customThresholdPercent: number | null;
}

export interface CheckIn {
  id: number;
  username: string;
  circleId: number;
  checkinDate: string;
  completed: boolean;
  currentStreak: number;
  longestStreak: number;
}

export interface Badge {
  id: number;
  username: string;
  circleId: number;
  circleName: string;
  weekStart: string;
  weekEnd: string;
  checkinCount: number;
  awardedAt: string;
}

export interface Task {
  id: number;
  title: string;
  displayOrder: number;
  completedToday: boolean;
}

export interface TaskCheckinResponse {
  taskId: number;
  completed: boolean;
  completionPercent: number;
  completedCount: number;
  totalCount: number;
}

export interface MemberTaskSummary {
  username: string;
  completedTasks: number;
  totalTasks: number;
  completionPercent: number;
  thresholdMet: boolean;
}

export interface LeaderboardEntry {
  rank: number;
  username: string;
  currentStreak: number;
  longestStreak: number;
  todayCompletionPercent: number;
  totalBadges: number;
  thresholdMetToday: boolean;
}