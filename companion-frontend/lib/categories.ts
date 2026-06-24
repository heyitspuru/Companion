import {
  Dumbbell,
  BookOpen,
  Sprout,
  Briefcase,
  Palette,
  Brain,
  Wallet,
  Users,
  Sparkles,
  Zap,
  Scale,
  Trophy,
  Target,
  type LucideIcon,
} from 'lucide-react';

export type CategoryMeta = { value: string; label: string; color: string; icon: LucideIcon };

export const CATEGORIES: CategoryMeta[] = [
  { value: 'FITNESS', label: 'Fitness & Health', color: '#2cb67d', icon: Dumbbell },
  { value: 'LEARNING', label: 'Learning & Education', color: '#0ea5e9', icon: BookOpen },
  { value: 'PERSONAL_HABIT', label: 'Personal Habits', color: '#f4a261', icon: Sprout },
  { value: 'CAREER', label: 'Career & Work', color: '#4c8dff', icon: Briefcase },
  { value: 'CREATIVE', label: 'Creative & Arts', color: '#ec4899', icon: Palette },
  { value: 'MENTAL_WELLNESS', label: 'Mental Wellness', color: '#eab308', icon: Brain },
  { value: 'FINANCE', label: 'Finance & Savings', color: '#14b8a6', icon: Wallet },
  { value: 'SOCIAL', label: 'Social & Relationships', color: '#ff6b35', icon: Users },
  { value: 'OTHER', label: 'Other', color: '#72757e', icon: Sparkles },
];

const byValue = new Map(CATEGORIES.map((c) => [c.value, c]));

export function categoryMeta(value: string): CategoryMeta {
  return byValue.get(value) || { value, label: value, color: '#72757e', icon: Sparkles };
}

export type ThresholdMeta = { value: string; label: string; desc: string; icon: LucideIcon };

export const THRESHOLDS: ThresholdMeta[] = [
  { value: 'ANY_TASK', label: 'Any task done', desc: 'At least 1 task completed', icon: Zap },
  { value: 'HALF', label: 'Half done', desc: '50% or more tasks completed', icon: Scale },
  { value: 'ALL_TASKS', label: 'All tasks', desc: 'Every task must be completed', icon: Trophy },
  { value: 'CUSTOM', label: 'Custom %', desc: 'Set your own threshold', icon: Target },
];

export function thresholdLabel(threshold: string, custom: number | null): string {
  switch (threshold) {
    case 'ANY_TASK':
      return 'Any task done';
    case 'HALF':
      return '50%+ done';
    case 'ALL_TASKS':
      return 'All tasks done';
    case 'CUSTOM':
      return `${custom}%+ done`;
    default:
      return threshold;
  }
}
