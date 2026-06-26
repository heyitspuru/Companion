'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Flame, Medal, CheckCircle2, Frown, HeartHandshake } from 'lucide-react';
import { getCircleBadges, getMyCheckIns, getCircleById, leaveCircle } from '@/lib/api';
import { Badge, CheckIn, Circle } from '@/types/index';
import { Button } from '@/components/ui/Button';
import { ErrorBanner } from '@/components/ui/ErrorBanner';
import { PageLoader } from '@/components/ui/Skeleton';

const ROASTS = [
  'Wow. Day 1 and you are already done? Impressive.',
  'Your future self is watching. Disappointed.',
  'The circle will survive. Will you though?',
  'Quitting is a skill too, I guess.',
  'Plot twist: nobody noticed you were here.',
  'Even your streak did not see this coming.',
  "Bold strategy. The coward's way out usually is.",
];

export default function LeaveCirclePage() {
  const router = useRouter();
  const params = useParams();
  const circleId = Number(params.id);

  const [circle, setCircle] = useState<Circle | null>(null);
  const [checkins, setCheckins] = useState<CheckIn[]>([]);
  const [badges, setBadges] = useState<Badge[]>([]);
  const [stage, setStage] = useState<1 | 2>(1);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');

  const roast = useMemo(() => ROASTS[Math.floor(Math.random() * ROASTS.length)], []);

  useEffect(() => {
    // Auth is an httpOnly cookie; gate on the local username hint.
    if (!localStorage.getItem('username')) {
      router.push('/login');
      return;
    }
    const load = async () => {
      try {
        const [circleRes, checkinRes, badgeRes] = await Promise.all([
          getCircleById(circleId),
          getMyCheckIns(circleId),
          getCircleBadges(circleId),
        ]);
        setCircle(circleRes.data);
        setCheckins(checkinRes.data);
        setBadges(badgeRes.data);
      } catch {
        router.push(`/circle/${circleId}`);
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, [circleId, router]);

  const usernameNow = typeof window !== 'undefined' ? localStorage.getItem('username') || '' : '';
  const badgeCount = badges.filter((b) => b.username === usernameNow).length;
  const daysCompleted = checkins.filter((c) => c.completed).length;
  const streak = checkins.length > 0 ? checkins[0].currentStreak || 0 : 0;

  const handleLeave = async () => {
    setActionLoading(true);
    setError('');
    try {
      await leaveCircle(circleId);
      router.push('/dashboard');
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Unable to leave circle right now';
      setError(message);
      setActionLoading(false);
    }
  };

  if (loading) return <PageLoader />;
  if (!circle) return null;

  const stats = [
    { label: 'Streak', value: streak, icon: Flame, color: '#2cb67d' },
    { label: 'Badges', value: badgeCount, icon: Medal, color: '#e53170' },
    { label: 'Days done', value: daysCompleted, icon: CheckCircle2, color: '#ff8906' },
  ];

  return (
    <main className="flex min-h-screen items-center justify-center p-6 text-paragraph">
      <div className="w-full max-w-xl animate-fade-up rounded-xl3 border border-border bg-surface/80 p-8 shadow-glow backdrop-blur-xl sm:p-10">
        {stage === 1 ? (
          <>
            <div className="mb-6 text-center">
              <HeartHandshake className="mx-auto mb-3 h-11 w-11 text-primary-bright" aria-hidden />
              <h1 className="font-display text-3xl text-headline">
                You&apos;ve shown up {streak} days in a row.
              </h1>
              <p className="mt-2 text-sm text-paragraph">
                Your circle is counting on you in {circle.name}.
              </p>
            </div>

            <div className="mb-6 grid grid-cols-3 gap-3">
              {stats.map((s) => {
                const Icon = s.icon;
                return (
                  <div
                    key={s.label}
                    className="rounded-xl border border-border bg-surface-2 p-4 text-center"
                  >
                    <Icon className="mx-auto mb-1.5 h-5 w-5" style={{ color: s.color }} aria-hidden />
                    <div className="font-heading text-xl" style={{ color: s.color }}>
                      {s.value}
                    </div>
                    <div className="mt-1 text-xs text-muted">{s.label}</div>
                  </div>
                );
              })}
            </div>

            <div className="flex flex-col gap-3">
              <Button fullWidth onClick={() => router.push(`/circle/${circleId}`)}>
                Stay and keep going
              </Button>
              <Button variant="ghost" fullWidth onClick={() => setStage(2)}>
                I still want to leave
              </Button>
            </div>
          </>
        ) : (
          <>
            <div className="mb-6 text-center">
              <Frown className="mx-auto mb-3 h-11 w-11 text-gold" aria-hidden />
              <h1 className="font-display text-3xl text-headline">Giving up already?</h1>
              <p className="mt-2 text-sm text-paragraph">{roast}</p>
            </div>

            {error && (
              <div className="mb-5">
                <ErrorBanner message={error} />
              </div>
            )}

            <div className="flex flex-col gap-3">
              <Button fullWidth onClick={() => router.push(`/circle/${circleId}`)}>
                Fine, I&apos;ll stay
              </Button>
              <Button
                variant="danger"
                fullWidth
                onClick={handleLeave}
                loading={actionLoading}
                loadingText="Leaving…"
              >
                Yes, I am done
              </Button>
            </div>
          </>
        )}
      </div>
    </main>
  );
}
