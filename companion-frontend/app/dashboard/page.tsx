'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { getMyCircles, createCircle, joinCircle, addTask } from '../../lib/api';
import { Circle } from '../../types/index';

const CATEGORIES = [
  { value: 'FITNESS', label: '💪 Fitness & Health' },
  { value: 'LEARNING', label: '📚 Learning & Education' },
  { value: 'PERSONAL_HABIT', label: '🧘 Personal Habits' },
  { value: 'CAREER', label: '💼 Career & Work' },
  { value: 'CREATIVE', label: '🎨 Creative & Arts' },
  { value: 'MENTAL_WELLNESS', label: '🧠 Mental Wellness' },
  { value: 'FINANCE', label: '💰 Finance & Savings' },
  { value: 'SOCIAL', label: '🤝 Social & Relationships' },
  { value: 'OTHER', label: '✨ Other' },
];

const THRESHOLDS = [
  { value: 'ANY_TASK', label: '⚡ Any task done', desc: 'At least 1 task completed' },
  { value: 'HALF', label: '⚖️ Half done', desc: '50% or more tasks completed' },
  { value: 'ALL_TASKS', label: '🏆 All tasks', desc: 'Every task must be completed' },
  { value: 'CUSTOM', label: '🎯 Custom %', desc: 'Set your own threshold' },
];

export default function DashboardPage() {
  const router = useRouter();
  const [circles, setCircles] = useState<Circle[]>([]);
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [showJoin, setShowJoin] = useState(false);
  const [inviteCode, setInviteCode] = useState('');
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [createForm, setCreateForm] = useState({
    name: '',
    goalTitle: '',
    goalDescription: '',
    goalCategory: 'FITNESS',
    completionThreshold: 'ANY_TASK',
    customThresholdPercent: 50,
  });
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');
  const [showTaskSetup, setShowTaskSetup] = useState(false);
  const [newlyJoinedCircle, setNewlyJoinedCircle] = useState<Circle | null>(null);
  const [setupTasks, setSetupTasks] = useState<string[]>(['']);
  const [setupLoading, setSetupLoading] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('username');
    if (!token) {
      router.push('/login');
      return;
    }
    setUsername(user || '');
    fetchCircles();
  }, []);

  const fetchCircles = async () => {
    try {
      const res = await getMyCircles();
      setCircles(res.data);
    } catch (err: any) {
      if (err?.response?.status === 401) {
        sessionStorage.clear();
        router.push('/login');
      } else {
        setError('Failed to load circles — please refresh');
      }
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date: Date) => date.toISOString().split('T')[0];

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!startDate || !endDate) { setError('Please select start and end dates'); return; }
    setActionLoading(true);
    setError('');
    try {
      await createCircle({
        ...createForm,
        startDate: formatDate(startDate),
        endDate: formatDate(endDate),
        customThresholdPercent: createForm.completionThreshold === 'CUSTOM'
          ? createForm.customThresholdPercent : null,
      });
      setShowCreate(false);
      setStartDate(null);
      setEndDate(null);
      setCreateForm({
        name: '', goalTitle: '', goalDescription: '',
        goalCategory: 'FITNESS', completionThreshold: 'ANY_TASK',
        customThresholdPercent: 50,
      });
      fetchCircles();
    } catch {
      setError('Failed to create circle');
    } finally {
      setActionLoading(false);
    }
  };

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    setError('');
    try {
      const res = await joinCircle(inviteCode.trim().toUpperCase());
      setShowJoin(false);
      setInviteCode('');
      setNewlyJoinedCircle(res.data);
      setSetupTasks(['']);
      setShowTaskSetup(true);
      fetchCircles();
    } catch {
      setError('Invalid invite code or already a member');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSetupTaskChange = (index: number, value: string) => {
    const updated = [...setupTasks];
    updated[index] = value;
    setSetupTasks(updated);
  };

  const handleAddSetupTaskField = () => setSetupTasks([...setupTasks, '']);

  const handleRemoveSetupTaskField = (index: number) =>
    setSetupTasks(setupTasks.filter((_, i) => i !== index));

  const handleSaveSetupTasks = async () => {
    if (!newlyJoinedCircle) return;
    setSetupLoading(true);
    try {
      const validTasks = setupTasks.filter(t => t.trim() !== '');
      for (const title of validTasks) {
        await addTask(newlyJoinedCircle.id, title.trim());
      }
      setShowTaskSetup(false);
      setNewlyJoinedCircle(null);
      setSetupTasks(['']);
    } catch (err) {
      console.error(err);
    } finally {
      setSetupLoading(false);
    }
  };

  const getProgressPercent = (start: string, end: string) => {
    const s = new Date(start).getTime();
    const e = new Date(end).getTime();
    const now = Date.now();
    return Math.min(100, Math.max(0, Math.round(((now - s) / (e - s)) * 100)));
  };

  const getDaysLeft = (end: string) =>
    Math.max(0, Math.ceil((new Date(end).getTime() - Date.now()) / (1000 * 60 * 60 * 24)));

  const getCategoryColor = (cat: string) => {
    const colors: Record<string, string> = {
      FITNESS: '#10b981', LEARNING: '#6366f1', PERSONAL_HABIT: '#f59e0b',
      CAREER: '#3b82f6', CREATIVE: '#ec4899', MENTAL_WELLNESS: '#8b5cf6',
      FINANCE: '#14b8a6', SOCIAL: '#f97316', OTHER: '#6b7280'
    };
    return colors[cat] || '#6b7280';
  };

  const getCategoryLabel = (cat: string) =>
    CATEGORIES.find(c => c.value === cat)?.label || cat;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const inputStyle = {
    width: '100%', background: '#0a0a0f', border: '1px solid #1e1e2e',
    borderRadius: '10px', padding: '10px 14px', color: 'white', fontSize: '14px',
    outline: 'none', boxSizing: 'border-box' as const
  };
  const labelStyle = { fontSize: '12px', color: '#6b7280', marginBottom: '4px', display: 'block' };

  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', backgroundColor: '#0a0a0f', minHeight: '100vh', color: 'white' }}>
      <style>{`
        .react-datepicker { background: #12121a !important; border: 1px solid #1e1e2e !important; color: white !important; }
        .react-datepicker__header { background: #0a0a0f !important; border-bottom: 1px solid #1e1e2e !important; }
        .react-datepicker__current-month, .react-datepicker__day-name, .react-datepicker__day { color: white !important; }
        .react-datepicker__day:hover { background: #6366f1 !important; border-radius: 6px !important; }
        .react-datepicker__day--selected { background: #6366f1 !important; border-radius: 6px !important; }
        .react-datepicker__day--disabled { color: #374151 !important; }
        .react-datepicker__navigation-icon::before { border-color: white !important; }
        .react-datepicker-wrapper { width: 100% !important; }
        .react-datepicker__input-container input {
          width: 100%; background: #0a0a0f; border: 1px solid #1e1e2e;
          border-radius: 10px; padding: 10px 14px; color: white; font-size: 14px;
          outline: none; box-sizing: border-box; cursor: pointer;
        }
      `}</style>

      {/* Navbar */}
      <nav style={{
        borderBottom: '1px solid #1e1e2e', padding: '16px 32px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: 'rgba(18,18,26,0.8)', backdropFilter: 'blur(10px)',
        position: 'sticky', top: 0, zIndex: 100
      }}>
        <span style={{
          fontSize: '20px', fontWeight: '800',
          background: 'linear-gradient(135deg, #a5b4fc, #8b5cf6)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'
        }}>Companion </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <Link href="/profile" style={{
            color: '#a5b4fc', fontSize: '14px', textDecoration: 'none', fontWeight: '600'
          }}>👤 {username}</Link>
          <button onClick={() => {
            localStorage.clear();
            router.push('/');
          }} style={{
            background: 'transparent', border: '1px solid #1e1e2e', color: '#6b7280',
            padding: '6px 14px', borderRadius: '8px', cursor: 'pointer', fontSize: '13px'
          }}>Logout</button>
        </div>
      </nav>

      {/* Main Content */}
      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '40px 24px' }}>

        {/* Header */}
        <div style={{ marginBottom: '32px' }}>
          <h1 style={{ fontSize: '36px', fontWeight: '800', marginBottom: '8px' }}>Your Circles 🔥</h1>
          <p style={{ color: '#6b7280', fontSize: '15px' }}>
            {circles.length === 0 ? 'No circles yet — create one or join with an invite code'
              : `You're in ${circles.length} circle${circles.length > 1 ? 's' : ''}`}
          </p>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
          <button onClick={() => { setShowCreate(true); setShowJoin(false); setError(''); }} style={{
            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: 'white',
            fontWeight: '700', padding: '12px 24px', borderRadius: '12px', border: 'none',
            cursor: 'pointer', fontSize: '14px', boxShadow: '0 0 20px rgba(99,102,241,0.3)'
          }}>+ Create Circle</button>
          <button onClick={() => { setShowJoin(true); setShowCreate(false); setError(''); }} style={{
            background: 'transparent', color: '#a5b4fc', fontWeight: '600',
            padding: '12px 24px', borderRadius: '12px',
            border: '1px solid rgba(99,102,241,0.3)', cursor: 'pointer', fontSize: '14px'
          }}>🔗 Join with Code</button>
        </div>

        {/* Error */}
        {error && (
          <div style={{
            background: 'rgba(244,63,94,0.1)', border: '1px solid rgba(244,63,94,0.3)',
            color: '#fb7185', padding: '12px 16px', borderRadius: '12px',
            marginBottom: '24px', fontSize: '14px'
          }}>{error}</div>
        )}

        {/* Create Form */}
        {showCreate && (
          <div style={{
            background: '#12121a', border: '1px solid #1e1e2e',
            borderRadius: '20px', padding: '28px', marginBottom: '32px'
          }}>
            <h2 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '24px' }}>
              Create a Circle 🚀
            </h2>
            <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={labelStyle}>Circle Name</label>
                  <input required style={inputStyle} placeholder="Morning Grind"
                    value={createForm.name}
                    onChange={e => setCreateForm({ ...createForm, name: e.target.value })} />
                </div>
                <div>
                  <label style={labelStyle}>Goal Category</label>
                  <select required style={{ ...inputStyle }}
                    value={createForm.goalCategory}
                    onChange={e => setCreateForm({ ...createForm, goalCategory: e.target.value })}>
                    {CATEGORIES.map(c => (
                      <option key={c.value} value={c.value}>{c.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label style={labelStyle}>Goal Title</label>
                <input required style={inputStyle} placeholder="What is your goal?"
                  value={createForm.goalTitle}
                  onChange={e => setCreateForm({ ...createForm, goalTitle: e.target.value })} />
              </div>

              <div>
                <label style={labelStyle}>Goal Description & Rules</label>
                <textarea style={{ ...inputStyle, minHeight: '80px', resize: 'vertical' as const }}
                  placeholder="Describe your goal, rules, and what counts as success..."
                  value={createForm.goalDescription}
                  onChange={e => setCreateForm({ ...createForm, goalDescription: e.target.value })} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={labelStyle}>📅 Start Date</label>
                  <DatePicker
                    selected={startDate}
                    onChange={(date: Date | null) => { setStartDate(date); setEndDate(null); }}
                    minDate={today}
                    placeholderText="Select start date"
                    dateFormat="dd MMM yyyy"
                  />
                </div>
                <div>
                  <label style={labelStyle}>📅 End Date (min 7 days)</label>
                  <DatePicker
                    selected={endDate}
                    onChange={(date: Date | null) => setEndDate(date)}
                    minDate={startDate
                      ? new Date(startDate.getTime() + 7 * 24 * 60 * 60 * 1000)
                      : new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000)}
                    placeholderText="Select end date"
                    dateFormat="dd MMM yyyy"
                    disabled={!startDate}
                  />
                </div>
              </div>

              <div>
                <label style={labelStyle}>Daily Completion Threshold</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  {THRESHOLDS.map(t => (
                    <div key={t.value}
                      onClick={() => setCreateForm({ ...createForm, completionThreshold: t.value })}
                      style={{
                        padding: '12px 16px', borderRadius: '12px', cursor: 'pointer',
                        border: `1px solid ${createForm.completionThreshold === t.value ? '#6366f1' : '#1e1e2e'}`,
                        background: createForm.completionThreshold === t.value
                          ? 'rgba(99,102,241,0.1)' : '#0a0a0f',
                        transition: 'all 0.2s'
                      }}>
                      <div style={{ fontWeight: '600', fontSize: '13px' }}>{t.label}</div>
                      <div style={{ color: '#6b7280', fontSize: '12px', marginTop: '2px' }}>{t.desc}</div>
                    </div>
                  ))}
                </div>
                {createForm.completionThreshold === 'CUSTOM' && (
                  <div style={{ marginTop: '12px' }}>
                    <label style={labelStyle}>Custom Threshold %</label>
                    <input type="number" min="1" max="100"
                      style={{ ...inputStyle, maxWidth: '120px' }}
                      value={createForm.customThresholdPercent}
                      onChange={e => setCreateForm({
                        ...createForm, customThresholdPercent: Number(e.target.value)
                      })} />
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                <button type="submit" disabled={actionLoading} style={{
                  background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: 'white',
                  fontWeight: '700', padding: '12px 24px', borderRadius: '10px',
                  border: 'none', cursor: 'pointer', fontSize: '14px'
                }}>
                  {actionLoading ? 'Creating...' : 'Create Circle →'}
                </button>
                <button type="button" onClick={() => setShowCreate(false)} style={{
                  background: 'transparent', color: '#6b7280', padding: '12px 24px',
                  borderRadius: '10px', border: '1px solid #1e1e2e', cursor: 'pointer', fontSize: '14px'
                }}>Cancel</button>
              </div>
            </form>
          </div>
        )}

        {/* Join Form */}
        {showJoin && (
          <div style={{
            background: '#12121a', border: '1px solid #1e1e2e',
            borderRadius: '20px', padding: '28px', marginBottom: '32px'
          }}>
            <h2 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '24px' }}>
              Join a Circle 🔗
            </h2>
            <form onSubmit={handleJoin} style={{ display: 'flex', gap: '12px' }}>
              <input required style={{ ...inputStyle, maxWidth: '300px' }}
                placeholder="Enter invite code (e.g. 72AADD9E)"
                value={inviteCode}
                onChange={e => setInviteCode(e.target.value)} />
              <button type="submit" disabled={actionLoading} style={{
                background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: 'white',
                fontWeight: '700', padding: '10px 24px', borderRadius: '10px',
                border: 'none', cursor: 'pointer', fontSize: '14px', whiteSpace: 'nowrap'
              }}>
                {actionLoading ? 'Joining...' : 'Join →'}
              </button>
              <button type="button" onClick={() => setShowJoin(false)} style={{
                background: 'transparent', color: '#6b7280', padding: '10px 20px',
                borderRadius: '10px', border: '1px solid #1e1e2e', cursor: 'pointer', fontSize: '14px'
              }}>Cancel</button>
            </form>
          </div>
        )}

        {/* Circles Grid */}
        {loading ? (
          <div style={{ textAlign: 'center', color: '#6b7280', padding: '60px' }}>Loading...</div>
        ) : circles.length === 0 ? (
          <div style={{
            textAlign: 'center', padding: '80px 40px',
            background: '#12121a', borderRadius: '24px', border: '1px solid #1e1e2e'
          }}>
            <div style={{ fontSize: '64px', marginBottom: '16px' }}>🤝</div>
            <h3 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '8px' }}>No circles yet</h3>
            <p style={{ color: '#6b7280' }}>Create one or join with an invite code to get started</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: '20px' }}>
            {circles.map(circle => {
              const pct = getProgressPercent(circle.goalStartDate, circle.goalEndDate);
              const daysLeft = getDaysLeft(circle.goalEndDate);
              const color = getCategoryColor(circle.goalCategory);
              const progressColor = pct > 80 ? '#f43f5e' : pct > 50 ? '#f59e0b' : '#6366f1';

              return (
                <Link key={circle.id} href={`/circle/${circle.id}`} style={{ textDecoration: 'none' }}>
                  <div
                    style={{
                      background: '#12121a', border: '1px solid #1e1e2e',
                      borderRadius: '20px', padding: '28px', cursor: 'pointer'
                    }}
                    onMouseEnter={e => (e.currentTarget.style.borderColor = '#6366f1')}
                    onMouseLeave={e => (e.currentTarget.style.borderColor = '#1e1e2e')}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                          <span style={{
                            background: `${color}20`, color, fontSize: '12px', fontWeight: '600',
                            padding: '3px 10px', borderRadius: '999px', border: `1px solid ${color}40`
                          }}>
                            {getCategoryLabel(circle.goalCategory)}
                          </span>
                          <span style={{ color: '#6b7280', fontSize: '12px' }}>
                            {circle.members.length} member{circle.members.length > 1 ? 's' : ''}
                          </span>
                        </div>
                        <h3 style={{ fontSize: '22px', fontWeight: '800', color: 'white', marginBottom: '4px' }}>
                          {circle.name}
                        </h3>
                        <p style={{ color: '#9ca3af', fontSize: '14px' }}>{circle.goalTitle}</p>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '28px', fontWeight: '800', color: daysLeft < 7 ? '#f43f5e' : '#10b981' }}>
                          {daysLeft}
                        </div>
                        <div style={{ fontSize: '11px', color: '#6b7280' }}>days left</div>
                      </div>
                    </div>

                    <div style={{ marginBottom: '16px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                        <span style={{ fontSize: '12px', color: '#6b7280' }}>Goal Progress</span>
                        <span style={{ fontSize: '12px', color: progressColor, fontWeight: '600' }}>{pct}%</span>
                      </div>
                      <div style={{ background: '#1e1e2e', borderRadius: '999px', height: '6px' }}>
                        <div style={{
                          width: `${pct}%`, height: '100%', borderRadius: '999px',
                          background: `linear-gradient(90deg, #6366f1, ${progressColor})`,
                          transition: 'width 0.5s ease'
                        }} />
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        {circle.members.slice(0, 4).map(m => (
                          <div key={m.username} style={{
                            width: '32px', height: '32px', borderRadius: '50%',
                            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: '13px', fontWeight: '700', border: '2px solid #0a0a0f'
                          }}>
                            {m.username[0].toUpperCase()}
                          </div>
                        ))}
                      </div>
                      <span style={{ color: '#6366f1', fontSize: '13px', fontWeight: '600' }}>
                        View Circle →
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {/* Task Setup Modal */}
      {showTaskSetup && newlyJoinedCircle && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 1000,
          background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '24px'
        }}>
          <div style={{
            background: '#12121a', border: '1px solid #1e1e2e',
            borderRadius: '24px', padding: '40px', width: '100%', maxWidth: '520px'
          }}>
            <div style={{ marginBottom: '28px' }}>
              <div style={{
                display: 'inline-block', background: 'rgba(99,102,241,0.15)',
                border: '1px solid rgba(99,102,241,0.3)', borderRadius: '999px',
                padding: '4px 14px', fontSize: '12px', color: '#a5b4fc',
                marginBottom: '16px', letterSpacing: '0.05em'
              }}>
                🎉 YOU JOINED A CIRCLE
              </div>
              <h2 style={{ fontSize: '26px', fontWeight: '800', marginBottom: '8px' }}>
                Set up your tasks
              </h2>
              <p style={{ color: '#9ca3af', fontSize: '14px' }}>
                Add your personal daily tasks for{' '}
                <span style={{ color: '#a5b4fc', fontWeight: '600' }}>
                  {newlyJoinedCircle.name}
                </span>
                . These are what you'll check off every day.
              </p>
            </div>

            <div style={{
              background: '#0a0a0f', border: '1px solid #1e1e2e',
              borderRadius: '14px', padding: '14px 16px', marginBottom: '24px'
            }}>
              <p style={{ fontWeight: '600', fontSize: '14px', marginBottom: '4px' }}>
                🎯 {newlyJoinedCircle.goalTitle}
              </p>
              <p style={{ color: '#6b7280', fontSize: '13px' }}>
                {newlyJoinedCircle.goalDescription || 'No description'}
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
              {setupTasks.map((task, index) => (
                <div key={index} style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  <div style={{
                    width: '20px', height: '20px', borderRadius: '5px',
                    border: '2px solid #374151', flexShrink: 0
                  }} />
                  <input
                    value={task}
                    onChange={e => handleSetupTaskChange(index, e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') { e.preventDefault(); handleAddSetupTaskField(); }
                    }}
                    placeholder={`Task ${index + 1} — e.g. Read for 30 mins`}
                    style={{
                      flex: 1, background: '#0a0a0f', border: '1px solid #1e1e2e',
                      borderRadius: '10px', padding: '10px 14px', color: 'white',
                      fontSize: '14px', outline: 'none'
                    }}
                    autoFocus={index === setupTasks.length - 1}
                  />
                  {setupTasks.length > 1 && (
                    <button
                      onClick={() => handleRemoveSetupTaskField(index)}
                      style={{
                        background: 'transparent', border: 'none', color: '#374151',
                        cursor: 'pointer', fontSize: '18px', flexShrink: 0
                      }}
                      onMouseEnter={e => (e.currentTarget.style.color = '#f43f5e')}
                      onMouseLeave={e => (e.currentTarget.style.color = '#374151')}
                    >×</button>
                  )}
                </div>
              ))}
            </div>

            <button
              onClick={handleAddSetupTaskField}
              style={{
                background: 'transparent', border: '1px dashed #1e1e2e',
                color: '#6b7280', padding: '10px', borderRadius: '10px',
                cursor: 'pointer', fontSize: '13px', width: '100%', marginBottom: '24px'
              }}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = '#6366f1';
                e.currentTarget.style.color = '#a5b4fc';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = '#1e1e2e';
                e.currentTarget.style.color = '#6b7280';
              }}
            >+ Add another task</button>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={handleSaveSetupTasks}
                disabled={setupLoading || setupTasks.every(t => t.trim() === '')}
                style={{
                  flex: 1,
                  background: setupLoading || setupTasks.every(t => t.trim() === '')
                    ? '#374151' : 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                  color: 'white', fontWeight: '700', padding: '14px',
                  borderRadius: '12px', border: 'none', cursor: 'pointer', fontSize: '15px'
                }}
              >
                {setupLoading ? 'Saving...' : 'Save Tasks & Enter Circle →'}
              </button>
              <button
                onClick={() => { setShowTaskSetup(false); setNewlyJoinedCircle(null); }}
                style={{
                  background: 'transparent', color: '#6b7280', padding: '14px 20px',
                  borderRadius: '12px', border: '1px solid #1e1e2e',
                  cursor: 'pointer', fontSize: '14px'
                }}
              >Skip</button>
            </div>

            <p style={{ textAlign: 'center', color: '#6b7280', fontSize: '12px', marginTop: '16px' }}>
              Press Enter to quickly add multiple tasks · You can edit these anytime
            </p>
          </div>
        </div>
      )}
    </div>
  );
}