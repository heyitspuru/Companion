'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Flame, Medal, Trophy, Users, CheckCircle2, LogOut, Star } from 'lucide-react';
import { getArchivedCircles, getProfile } from '@/lib/api';
import { Circle } from '@/types/index';
import { categoryMeta } from '@/lib/categories';
import { Navbar } from '@/components/layout/Navbar';
import { Card } from '@/components/ui/Card';
import { StatTile } from '@/components/ui/StatTile';
import { Avatar } from '@/components/ui/Avatar';
import { Chip } from '@/components/ui/Chip';
import { ProgressRing } from '@/components/ui/ProgressRing';
import { EmptyState } from '@/components/ui/EmptyState';
import { LinkButton } from '@/components/ui/Button';
import { PageLoader } from '@/components/ui/Skeleton';

interface CircleStat {
  circleId: number;
  circleName: string;
  goalTitle: string;
  goalCategory: string;
  currentStreak: number;
  longestStreak: number;
  progressPercent: number;
  daysLeft: number;
}
interface BadgeStat {
  circleName: string;
  weekStart: string;
  checkinCount: number;
}
interface ProfileData {
  username: string;
  email: string;
  memberSince: string;
  totalCircles: number;
  totalBadges: number;
  longestStreakEver: number;
  totalTasksCompleted: number;
  circleStats: CircleStat[];
  recentBadges: BadgeStat[];
}

export default function ProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [archivedCircles, setArchivedCircles] = useState<Circle[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }
    fetchProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchProfile = async () => {
    try {
      const [profileRes, archivedRes] = await Promise.all([getProfile(), getArchivedCircles()]);
      setProfile(profileRes.data);
      setArchivedCircles(archivedRes.data);
    } catch {
      router.push('/login');
    } finally {
      setLoading(false);
    }
  };

  const getMemberSince = (date: string) =>
    new Date(date).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const getDaysSince = (date: string) =>
    Math.floor((Date.now() - new Date(date).getTime()) / (1000 * 60 * 60 * 24));

  if (loading) return <PageLoader />;
  if (!profile) return null;

  const daysSince = getDaysSince(profile.memberSince);

  return (
    <div className="min-h-screen text-paragraph">
      <Navbar href="/dashboard" back>
        <button
          onClick={() => {
            localStorage.clear();
            router.push('/');
          }}
          className="focus-ring inline-flex items-center gap-1.5 rounded-lg border border-ink/15 px-3 py-1.5 text-xs text-ink-soft transition-colors hover:text-ink"
        >
          <LogOut className="h-3.5 w-3.5" aria-hidden /> Logout
        </button>
      </Navbar>

      <div className="mx-auto max-w-4xl animate-fade-up px-5 py-10 sm:px-6">
        {/* Header */}
        <Card className="relative mb-6 flex flex-col items-center gap-6 overflow-hidden sm:flex-row sm:items-center">
          <div
            className="pointer-events-none absolute -left-16 -top-16 h-52 w-52 rounded-full opacity-60"
            style={{ background: 'radial-gradient(circle, rgba(127,90,240,0.15) 0%, transparent 70%)' }}
            aria-hidden
          />
          <Avatar name={profile.username} me size={96} className="relative shadow-glow" />

          <div className="relative flex-1 text-center sm:text-left">
            <Chip className="mb-3">
              <Medal className="h-3.5 w-3.5" aria-hidden /> Companion Member
            </Chip>
            <h1 className="font-display text-4xl text-headline">{profile.username}</h1>
            <p className="mt-1 text-sm text-muted">{profile.email}</p>
            <p className="mt-1 text-xs text-muted">
              Member since {getMemberSince(profile.memberSince)} · {daysSince} days on the journey
            </p>
          </div>

          <div className="relative flex shrink-0 flex-col items-center rounded-xl2 border border-success/30 bg-success/10 px-7 py-5">
            <Flame className="h-8 w-8 text-fire" aria-hidden />
            <div className="font-heading text-3xl text-success">{profile.longestStreakEver}</div>
            <div className="mt-0.5 text-xs text-muted">best streak</div>
          </div>
        </Card>

        {/* Stats */}
        <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <StatTile icon={Users} value={profile.totalCircles} label="Circles Joined" color="#ff8906" />
          <StatTile icon={Medal} value={profile.totalBadges} label="Badges Earned" color="#e53170" />
          <StatTile icon={Flame} value={`${profile.longestStreakEver}d`} label="Best Streak" color="#2cb67d" />
          <StatTile icon={CheckCircle2} value={profile.totalTasksCompleted} label="Tasks Done" color="#f25f4c" />
        </div>

        {/* Active circles */}
        <Card className="mb-6">
          <h2 className="mb-5 inline-flex items-center gap-2 font-heading text-lg text-headline">
            <Trophy className="h-5 w-5 text-primary-bright" aria-hidden /> Active Circles
          </h2>
          {profile.circleStats.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted">No active circles right now.</p>
          ) : (
            <div className="flex flex-col gap-4">
              {profile.circleStats.map((circle) => {
                const meta = categoryMeta(circle.goalCategory);
                const CatIcon = meta.icon;
                const ringColor =
                  circle.progressPercent > 80 ? '#e53170' : circle.progressPercent > 50 ? '#f25f4c' : '#ff8906';
                return (
                  <Link
                    key={circle.circleId}
                    href={`/circle/${circle.circleId}`}
                    className="focus-ring rounded-xl"
                  >
                    <div className="flex items-center gap-5 rounded-xl border border-border bg-surface-2 p-4 transition-colors hover:border-primary">
                      <ProgressRing
                        percent={circle.progressPercent}
                        size={64}
                        stroke={5}
                        color={ringColor}
                        centerTop={
                          <span className="font-heading text-xs" style={{ color: ringColor }}>
                            {circle.progressPercent}%
                          </span>
                        }
                      />
                      <div className="min-w-0 flex-1">
                        <Chip color={meta.color} className="mb-1">
                          <CatIcon className="h-3.5 w-3.5" aria-hidden /> {meta.label}
                        </Chip>
                        <p className="truncate font-semibold text-headline">{circle.circleName}</p>
                        <p className="truncate text-sm text-muted">{circle.goalTitle}</p>
                      </div>
                      <div className="flex shrink-0 gap-5 text-center">
                        <div>
                          <div className="inline-flex items-center gap-1 font-heading text-xl text-success">
                            {circle.currentStreak}
                            <Flame className="h-4 w-4 text-fire" aria-hidden />
                          </div>
                          <div className="text-xs text-muted">streak</div>
                        </div>
                        <div>
                          <div
                            className="font-heading text-xl"
                            style={{ color: circle.daysLeft < 7 ? '#f25f4c' : '#ff8906' }}
                          >
                            {circle.daysLeft}
                          </div>
                          <div className="text-xs text-muted">days left</div>
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </Card>

        {/* Achievements */}
        {archivedCircles.length > 0 && (
          <Card tone="gold" className="mb-6">
            <h2 className="mb-5 inline-flex items-center gap-2 font-heading text-lg text-headline">
              <Trophy className="h-5 w-5 text-gold" aria-hidden /> Achievements
            </h2>
            <div className="flex flex-col gap-4">
              {archivedCircles.map((circle) => (
                <div
                  key={circle.id}
                  className="flex items-center gap-5 rounded-xl border border-gold/30 bg-gold/[0.06] p-5"
                >
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-gold to-fire">
                    <Star className="h-7 w-7 text-[#0f0e17]" aria-hidden />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-xs text-gold">Archived Achievement</div>
                    <div className="font-heading text-base text-headline">{circle.name}</div>
                    <div className="truncate text-sm text-muted">{circle.goalTitle}</div>
                    <div className="mt-1 text-xs text-muted">
                      {circle.goalStartDate} → {circle.goalEndDate}
                    </div>
                  </div>
                  <LinkButton href={`/circle/${circle.id}`} variant="ghost" size="sm" className="border-gold/40 text-gold">
                    View
                  </LinkButton>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Badge collection */}
        {profile.recentBadges.length > 0 ? (
          <Card tone="gold">
            <h2 className="mb-5 inline-flex items-center gap-2 font-heading text-lg text-headline">
              <Medal className="h-5 w-5 text-gold" aria-hidden /> Badge Collection
            </h2>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {profile.recentBadges.map((badge, index) => (
                <div
                  key={index}
                  className="rounded-xl2 border border-gold/20 bg-gold/[0.05] p-5 text-center"
                >
                  <Medal className="mx-auto mb-2 h-8 w-8 text-gold" aria-hidden />
                  <div className="text-sm font-semibold text-gold">{badge.circleName}</div>
                  <div className="mt-1 text-xs text-muted">Week of {badge.weekStart}</div>
                  <div className="mt-2 inline-block rounded-full bg-gold/15 px-2.5 py-0.5 text-xs font-medium text-gold">
                    {badge.checkinCount} check-ins
                  </div>
                </div>
              ))}
            </div>
          </Card>
        ) : (
          <EmptyState
            icon={Medal}
            title="No badges yet"
            description="Stay consistent — badges are awarded every Monday to the top performer in each circle."
          />
        )}
      </div>
    </div>
  );
}
