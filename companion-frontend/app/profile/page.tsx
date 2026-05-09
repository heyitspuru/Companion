'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getArchivedCircles, getProfile } from '../../lib/api';
import { Circle } from '../../types/index';

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

const CATEGORY_COLORS: Record<string, string> = {
  FITNESS: '#10b981', LEARNING: '#6366f1', PERSONAL_HABIT: '#f59e0b',
  CAREER: '#3b82f6', CREATIVE: '#ec4899', MENTAL_WELLNESS: '#8b5cf6',
  FINANCE: '#14b8a6', SOCIAL: '#f97316', OTHER: '#6b7280'
};

const CATEGORY_LABELS: Record<string, string> = {
  FITNESS: '💪 Fitness', LEARNING: '📚 Learning', PERSONAL_HABIT: '🧘 Personal Habit',
  CAREER: '💼 Career', CREATIVE: '🎨 Creative', MENTAL_WELLNESS: '🧠 Mental Wellness',
  FINANCE: '💰 Finance', SOCIAL: '🤝 Social', OTHER: '✨ Other'
};

export default function ProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [archivedCircles, setArchivedCircles] = useState<Circle[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) { router.push('/login'); return; }
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const [profileRes, archivedRes] = await Promise.all([
        getProfile(),
        getArchivedCircles(),
      ]);
      setProfile(profileRes.data);
      setArchivedCircles(archivedRes.data);
    } catch {
      router.push('/login');
    } finally {
      setLoading(false);
    }
  };

  const getMemberSince = (date: string) => {
    const d = new Date(date);
    return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  const getDaysSince = (date: string) => {
    const diff = Date.now() - new Date(date).getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24));
  };

  if (loading) return (
    <div style={{
      minHeight: '100vh', backgroundColor: '#0a0a0f',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      color: 'white', fontFamily: 'system-ui'
    }}>Loading...</div>
  );

  if (!profile) return null;

  const daysSince = getDaysSince(profile.memberSince);

  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', backgroundColor: '#0a0a0f', minHeight: '100vh', color: 'white' }}>

      {/* Navbar */}
      <nav style={{
        borderBottom: '1px solid #1e1e2e', padding: '16px 32px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: 'rgba(18,18,26,0.8)', backdropFilter: 'blur(10px)',
        position: 'sticky', top: 0, zIndex: 10
      }}>
        <Link href="/dashboard" style={{
          fontSize: '20px', fontWeight: '800', textDecoration: 'none',
          background: 'linear-gradient(135deg, #a5b4fc, #8b5cf6)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'
        }}>← Companion 🤝</Link>
        <button onClick={() => { localStorage.clear(); router.push('/'); }} style={{
          background: 'transparent', border: '1px solid #1e1e2e', color: '#6b7280',
          padding: '6px 14px', borderRadius: '8px', cursor: 'pointer', fontSize: '13px'
        }}>Logout</button>
      </nav>

      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '40px 24px' }}>

        {/* Profile Header */}
        <div style={{
          background: '#12121a', border: '1px solid #1e1e2e',
          borderRadius: '24px', padding: '40px', marginBottom: '24px',
          display: 'flex', alignItems: 'center', gap: '32px',
          position: 'relative', overflow: 'hidden'
        }}>
          {/* Background glow */}
          <div style={{
            position: 'absolute', top: '-60px', left: '-60px',
            width: '200px', height: '200px', borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(99,102,241,0.15) 0%, transparent 70%)',
            pointerEvents: 'none'
          }} />

          {/* Avatar */}
          <div style={{
            width: '100px', height: '100px', borderRadius: '50%', flexShrink: 0,
            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '40px', fontWeight: '900',
            boxShadow: '0 0 40px rgba(99,102,241,0.4)',
            border: '3px solid rgba(99,102,241,0.3)'
          }}>
            {profile.username[0].toUpperCase()}
          </div>

          {/* Info */}
          <div style={{ flex: 1 }}>
            <div style={{
              display: 'inline-block', background: 'rgba(99,102,241,0.15)',
              border: '1px solid rgba(99,102,241,0.3)', borderRadius: '999px',
              padding: '4px 14px', fontSize: '12px', color: '#a5b4fc',
              marginBottom: '12px', letterSpacing: '0.05em'
            }}>
              🏅 COMPANION MEMBER
            </div>
            <h1 style={{ fontSize: '36px', fontWeight: '900', marginBottom: '4px' }}>
              {profile.username}
            </h1>
            <p style={{ color: '#6b7280', fontSize: '14px', marginBottom: '8px' }}>
              {profile.email}
            </p>
            <p style={{ color: '#4b5563', fontSize: '13px' }}>
              Member since {getMemberSince(profile.memberSince)} · {daysSince} days on the journey
            </p>
          </div>

          {/* Streak badge */}
          <div style={{
            background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)',
            borderRadius: '20px', padding: '20px 28px', textAlign: 'center', flexShrink: 0
          }}>
            <div style={{ fontSize: '36px' }}>🔥</div>
            <div style={{ fontSize: '32px', fontWeight: '900', color: '#10b981' }}>
              {profile.longestStreakEver}
            </div>
            <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '2px' }}>best streak</div>
          </div>
        </div>

        {/* Stats Row */}
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '16px', marginBottom: '24px'
        }}>
          {[
            { label: 'Circles Joined', value: profile.totalCircles, icon: '🤝', color: '#6366f1' },
            { label: 'Badges Earned', value: profile.totalBadges, icon: '🏅', color: '#f59e0b' },
            { label: 'Best Streak', value: `${profile.longestStreakEver}d`, icon: '🔥', color: '#10b981' },
            { label: 'Tasks Done', value: profile.totalTasksCompleted, icon: '✅', color: '#8b5cf6' },
          ].map(stat => (
            <div key={stat.label} style={{
              background: '#12121a', border: '1px solid #1e1e2e',
              borderRadius: '16px', padding: '20px', textAlign: 'center'
            }}>
              <div style={{ fontSize: '28px', marginBottom: '8px' }}>{stat.icon}</div>
              <div style={{ fontSize: '28px', fontWeight: '900', color: stat.color }}>
                {stat.value}
              </div>
              <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Active Circles */}
        <div style={{
          background: '#12121a', border: '1px solid #1e1e2e',
          borderRadius: '20px', padding: '28px', marginBottom: '24px'
        }}>
          <h2 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '20px' }}>
            Active Circles 🎯
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {profile.circleStats.map(circle => {
              const color = CATEGORY_COLORS[circle.goalCategory] || '#6b7280';
              const progressColor = circle.progressPercent > 80 ? '#f43f5e'
                : circle.progressPercent > 50 ? '#f59e0b' : '#6366f1';
              const radius = 28;
              const circ = 2 * Math.PI * radius;
              const offset = circ - (circle.progressPercent / 100) * circ;

              return (
                <Link key={circle.circleId} href={`/circle/${circle.circleId}`}
                  style={{ textDecoration: 'none' }}>
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: '20px',
                    padding: '16px 20px', background: '#0a0a0f',
                    borderRadius: '14px', border: '1px solid #1e1e2e',
                    transition: 'border-color 0.2s', cursor: 'pointer'
                  }}
                    onMouseEnter={e => (e.currentTarget.style.borderColor = '#6366f1')}
                    onMouseLeave={e => (e.currentTarget.style.borderColor = '#1e1e2e')}
                  >
                    {/* Mini progress ring */}
                    <div style={{ position: 'relative', width: '64px', height: '64px', flexShrink: 0 }}>
                      <svg width="64" height="64" style={{ transform: 'rotate(-90deg)' }}>
                        <circle cx="32" cy="32" r={radius} fill="none" stroke="#1e1e2e" strokeWidth="5" />
                        <circle cx="32" cy="32" r={radius} fill="none"
                          stroke={progressColor} strokeWidth="5"
                          strokeDasharray={circ} strokeDashoffset={offset}
                          strokeLinecap="round"
                          style={{ filter: `drop-shadow(0 0 4px ${progressColor})` }}
                        />
                      </svg>
                      <div style={{
                        position: 'absolute', top: '50%', left: '50%',
                        transform: 'translate(-50%, -50%)',
                        fontSize: '11px', fontWeight: '800', color: progressColor
                      }}>
                        {circle.progressPercent}%
                      </div>
                    </div>

                    {/* Circle info */}
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                        <span style={{
                          background: `${color}20`, color, fontSize: '11px',
                          fontWeight: '600', padding: '2px 8px', borderRadius: '999px',
                          border: `1px solid ${color}40`
                        }}>
                          {CATEGORY_LABELS[circle.goalCategory] || circle.goalCategory}
                        </span>
                      </div>
                      <p style={{ fontWeight: '700', fontSize: '15px', marginBottom: '2px' }}>
                        {circle.circleName}
                      </p>
                      <p style={{ color: '#6b7280', fontSize: '13px' }}>{circle.goalTitle}</p>
                    </div>

                    {/* Streak + days */}
                    <div style={{ display: 'flex', gap: '20px', flexShrink: 0 }}>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '20px', fontWeight: '800', color: '#10b981' }}>
                          {circle.currentStreak}🔥
                        </div>
                        <div style={{ fontSize: '11px', color: '#6b7280' }}>streak</div>
                      </div>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{
                          fontSize: '20px', fontWeight: '800',
                          color: circle.daysLeft < 7 ? '#f43f5e' : '#a5b4fc'
                        }}>
                          {circle.daysLeft}
                        </div>
                        <div style={{ fontSize: '11px', color: '#6b7280' }}>days left</div>
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Achievements */}
        {archivedCircles.length > 0 && (
          <div style={{
            background: '#12121a', border: '1px solid rgba(245,158,11,0.3)',
            borderRadius: '20px', padding: '28px', marginBottom: '24px'
          }}>
            <h2 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '20px' }}>
              🏆 Achievements
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {archivedCircles.map(circle => {
                const start = new Date(circle.goalStartDate);
                const end = new Date(circle.goalEndDate);
                const totalDays = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
                const elapsed = Math.max(0, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
                const completionPercent = Math.min(100, Math.round((elapsed / totalDays) * 100));

                return (
                  <div key={circle.id} style={{
                    background: 'rgba(245,158,11,0.06)',
                    border: '1px solid rgba(245,158,11,0.3)',
                    borderRadius: '16px', padding: '20px',
                    display: 'flex', alignItems: 'center', gap: '20px'
                  }}>
                    <div style={{
                      width: '54px', height: '54px', borderRadius: '14px',
                      background: 'linear-gradient(135deg, #f59e0b, #fbbf24)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontWeight: '900', color: '#1f2937'
                    }}>★</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '12px', color: '#fbbf24', marginBottom: '6px' }}>
                        Archived Achievement
                      </div>
                      <div style={{ fontWeight: '800', fontSize: '16px' }}>{circle.name}</div>
                      <div style={{ color: '#9ca3af', fontSize: '13px' }}>{circle.goalTitle}</div>
                      <div style={{ color: '#6b7280', fontSize: '12px', marginTop: '6px' }}>
                        {circle.goalStartDate} → {circle.goalEndDate} · {completionPercent}% complete
                      </div>
                    </div>
                    <Link href={`/circle/${circle.id}`} style={{
                      background: 'transparent', border: '1px solid rgba(245,158,11,0.4)',
                      color: '#fbbf24', padding: '8px 12px', borderRadius: '10px',
                      textDecoration: 'none', fontSize: '12px', fontWeight: '700'
                    }}>
                      View
                    </Link>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Badge Collection */}
        {profile.recentBadges.length > 0 && (
          <div style={{
            background: '#12121a', border: '1px solid rgba(245,158,11,0.3)',
            borderRadius: '20px', padding: '28px'
          }}>
            <h2 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '20px' }}>
              🏅 Badge Collection
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
              {profile.recentBadges.map((badge, index) => (
                <div key={index} style={{
                  background: 'rgba(245,158,11,0.05)',
                  border: '1px solid rgba(245,158,11,0.2)',
                  borderRadius: '16px', padding: '20px', textAlign: 'center'
                }}>
                  <div style={{ fontSize: '32px', marginBottom: '8px' }}>🏅</div>
                  <div style={{ fontWeight: '700', color: '#fbbf24', fontSize: '14px', marginBottom: '4px' }}>
                    {badge.circleName}
                  </div>
                  <div style={{ color: '#6b7280', fontSize: '12px', marginBottom: '4px' }}>
                    Week of {badge.weekStart}
                  </div>
                  <div style={{
                    background: 'rgba(245,158,11,0.15)', color: '#fbbf24',
                    padding: '3px 10px', borderRadius: '999px', fontSize: '11px',
                    fontWeight: '600', display: 'inline-block'
                  }}>
                    {badge.checkinCount} check-ins
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty badges state */}
        {profile.recentBadges.length === 0 && (
          <div style={{
            background: '#12121a', border: '1px solid #1e1e2e',
            borderRadius: '20px', padding: '40px', textAlign: 'center'
          }}>
            <div style={{ fontSize: '48px', marginBottom: '12px' }}>🏅</div>
            <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '8px' }}>
              No badges yet
            </h3>
            <p style={{ color: '#6b7280', fontSize: '14px' }}>
              Stay consistent — badges are awarded every Monday to the top performer in each circle
            </p>
          </div>
        )}
      </div>
    </div>
  );
}