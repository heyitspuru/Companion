import Link from 'next/link';

export default function Home() {
  return (
    <main style={{
      minHeight: '100vh',
      backgroundColor: '#0a0a0f',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem',
      fontFamily: 'system-ui, sans-serif'
    }}>
      <div style={{
        position: 'absolute',
        width: '600px',
        height: '600px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(99,102,241,0.15) 0%, transparent 70%)',
        pointerEvents: 'none'
      }} />
      <div style={{ textAlign: 'center', maxWidth: '680px', position: 'relative' }}>
        <div style={{
          display: 'inline-block',
          background: 'rgba(99,102,241,0.15)',
          border: '1px solid rgba(99,102,241,0.3)',
          borderRadius: '999px',
          padding: '6px 16px',
          fontSize: '13px',
          color: '#a5b4fc',
          marginBottom: '24px',
          letterSpacing: '0.05em'
        }}>
          🎮 GAMIFIED GOAL TRACKING
        </div>
        <h1 style={{
          fontSize: '72px',
          fontWeight: '800',
          background: 'linear-gradient(135deg, #ffffff 0%, #a5b4fc 50%, #8b5cf6 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          lineHeight: '1.1',
          marginBottom: '24px'
        }}>
          Companion 🤝
        </h1>
        <p style={{
          fontSize: '20px',
          color: '#9ca3af',
          marginBottom: '48px',
          lineHeight: '1.6'
        }}>
          Achieve goals together. Build streaks. Stay accountable.
          Earn badges. <span style={{ color: '#a5b4fc' }}>Grow with your people.</span>
        </p>
        <div style={{
          display: 'flex',
          gap: '32px',
          justifyContent: 'center',
          marginBottom: '48px'
        }}>
          {[
            { value: '🔥', label: 'Daily Streaks' },
            { value: '🏅', label: 'Weekly Badges' },
            { value: '👥', label: 'Circle Goals' },
          ].map((stat) => (
            <div key={stat.label} style={{
              background: '#12121a',
              border: '1px solid #1e1e2e',
              borderRadius: '16px',
              padding: '16px 24px',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '28px' }}>{stat.value}</div>
              <div style={{ fontSize: '13px', color: '#6b7280', marginTop: '4px' }}>{stat.label}</div>
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', gap: '16px', justifyContent: 'center' }}>
          <Link href="/register" style={{
            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            color: 'white',
            fontWeight: '700',
            padding: '14px 36px',
            borderRadius: '14px',
            textDecoration: 'none',
            fontSize: '16px',
            boxShadow: '0 0 30px rgba(99,102,241,0.4)'
          }}>
            Get Started →
          </Link>
          <Link href="/login" style={{
            background: 'transparent',
            color: '#a5b4fc',
            fontWeight: '600',
            padding: '14px 36px',
            borderRadius: '14px',
            textDecoration: 'none',
            fontSize: '16px',
            border: '1px solid rgba(99,102,241,0.3)'
          }}>
            Login
          </Link>
        </div>
      </div>
    </main>
  );
}