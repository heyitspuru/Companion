'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getCircleBadges, getMyCheckIns, getCircleById, leaveCircle } from '../../../../lib/api';
import { Badge, CheckIn, Circle } from '../../../../types/index';

const ROASTS = [
  'Wow. Day 1 and you are already done? Impressive.',
  'Your future self is watching. Disappointed.',
  'The circle will survive. Will you though?',
  'Quitting is a skill too, I guess.',
  'Plot twist: nobody noticed you were here.',
  'Even your streak did not see this coming.',
  'Bold strategy. The coward\'s way out usually is.'
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
    const token = localStorage.getItem('token');
    if (!token) {
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

  const username = typeof window !== 'undefined' ? localStorage.getItem('username') || '' : '';
  const badgeCount = badges.filter(b => b.username === username).length;
  const daysCompleted = checkins.filter(c => c.completed).length;
  const streak = checkins.length > 0 ? checkins[0].currentStreak || 0 : 0;

  const handleLeave = async () => {
    setActionLoading(true);
    setError('');
    try {
      await leaveCircle(circleId);
      router.push('/dashboard');
    } catch (err: any) {
      const message = err?.response?.data?.message || 'Unable to leave circle right now';
      setError(message);
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh', backgroundColor: '#0a0a0f',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: 'white', fontFamily: 'system-ui'
      }}>
        Loading...
      </div>
    );
  }

  if (!circle) return null;

  return (
    <main style={{
      minHeight: '100vh', backgroundColor: '#0a0a0f',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '2rem', fontFamily: 'system-ui, sans-serif', color: 'white'
    }}>
      <div style={{
        background: '#12121a', border: '1px solid #1e1e2e',
        borderRadius: '28px', padding: '40px', width: '100%', maxWidth: '560px'
      }}>
        {stage === 1 ? (
          <>
            <div style={{ textAlign: 'center', marginBottom: '24px' }}>
              <div style={{ fontSize: '44px', marginBottom: '12px' }}>🤝</div>
              <h1 style={{ fontSize: '28px', fontWeight: '800', marginBottom: '8px' }}>
                You have shown up {streak} days in a row.
              </h1>
              <p style={{ color: '#9ca3af', fontSize: '14px' }}>
                Your circle is counting on you in {circle.name}.
              </p>
            </div>

            <div style={{
              display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px',
              marginBottom: '24px'
            }}>
              {[
                { label: 'Streak', value: `${streak}🔥`, color: '#10b981' },
                { label: 'Badges', value: `${badgeCount}🏅`, color: '#f59e0b' },
                { label: 'Days done', value: `${daysCompleted}`, color: '#6366f1' },
              ].map(stat => (
                <div key={stat.label} style={{
                  background: '#0a0a0f', border: '1px solid #1e1e2e',
                  borderRadius: '14px', padding: '14px', textAlign: 'center'
                }}>
                  <div style={{ fontSize: '18px', fontWeight: '800', color: stat.color }}>
                    {stat.value}
                  </div>
                  <div style={{ fontSize: '11px', color: '#6b7280', marginTop: '6px' }}>
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <button onClick={() => router.push(`/circle/${circleId}`)} style={{
                background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                color: 'white', fontWeight: '700', padding: '14px',
                borderRadius: '12px', border: 'none', fontSize: '15px',
                cursor: 'pointer'
              }}>
                Stay and keep going
              </button>
              <button onClick={() => setStage(2)} style={{
                background: 'transparent', color: '#6b7280',
                border: '1px solid #1e1e2e', padding: '12px',
                borderRadius: '12px', fontSize: '13px', cursor: 'pointer'
              }}>
                I still want to leave
              </button>
            </div>
          </>
        ) : (
          <>
            <div style={{ textAlign: 'center', marginBottom: '24px' }}>
              <div style={{ fontSize: '44px', marginBottom: '12px' }}>😬</div>
              <h1 style={{ fontSize: '28px', fontWeight: '800', marginBottom: '8px' }}>
                Giving up already?
              </h1>
              <p style={{ color: '#9ca3af', fontSize: '14px' }}>{roast}</p>
            </div>

            {error && (
              <div style={{
                background: 'rgba(244,63,94,0.1)', border: '1px solid rgba(244,63,94,0.3)',
                color: '#fb7185', padding: '12px 16px', borderRadius: '12px',
                marginBottom: '20px', fontSize: '14px', textAlign: 'center'
              }}>{error}</div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <button onClick={() => router.push(`/circle/${circleId}`)} style={{
                background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                color: 'white', fontWeight: '700', padding: '14px',
                borderRadius: '12px', border: 'none', fontSize: '15px',
                cursor: 'pointer'
              }}>
                Fine, I will stay
              </button>
              <button onClick={handleLeave} disabled={actionLoading} style={{
                background: actionLoading ? '#3f3f46' : 'rgba(244,63,94,0.12)',
                color: '#fb7185', border: '1px solid rgba(244,63,94,0.35)',
                padding: '12px', borderRadius: '12px', fontSize: '13px',
                cursor: actionLoading ? 'not-allowed' : 'pointer', fontWeight: '600'
              }}>
                {actionLoading ? 'Leaving...' : 'Yes, I am done'}
              </button>
            </div>
          </>
        )}
      </div>
    </main>
  );
}
