'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import {
  getCircleById, getCircleBadges,
  getMyTasks, addTask, deleteTask, toggleTask,
  getCircleTaskSummary, updateTask, getCircleLeaderboard,
  deleteCircle, concludeCircle, getCircleStats
} from '../../../lib/api';
import { Circle, Badge, Task, MemberTaskSummary, LeaderboardEntry } from '../../../types/index';

export default function CirclePage() {
  const router = useRouter();
  const params = useParams();
  const circleId = Number(params.id);

  const [circle, setCircle] = useState<Circle | null>(null);
  const [badges, setBadges] = useState<Badge[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [taskSummary, setTaskSummary] = useState<MemberTaskSummary[]>([]);
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(true);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [addingTask, setAddingTask] = useState(false);
  const [showAddTask, setShowAddTask] = useState(false);
  const [copied, setCopied] = useState(false);
  const [myCompletion, setMyCompletion] = useState(0);
  const [editingTaskId, setEditingTaskId] = useState<number | null>(null);
  const [editingTitle, setEditingTitle] = useState('');
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteInput, setDeleteInput] = useState('');
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [showConclusion, setShowConclusion] = useState(false);
  const [concludeLoading, setConcludeLoading] = useState(false);
  const [extendDate, setExtendDate] = useState('');
  const [showExtendPicker, setShowExtendPicker] = useState(false);
  const [conclusionStats, setConclusionStats] = useState({
    totalCheckins: 0,
    bestStreak: 0,
    badgesAwarded: 0,
    memberCount: 0,
  });

  useEffect(() => {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('username');
    if (!token) { router.push('/login'); return; }
    setUsername(user || '');
    fetchAll(user || '');
  }, []);

  const fetchAll = async (user: string) => {
    try {
      const [circleRes, badgeRes, taskRes, summaryRes, leaderboardRes] = await Promise.all([
        getCircleById(circleId),
        getCircleBadges(circleId),
        getMyTasks(circleId),
        getCircleTaskSummary(circleId),
        getCircleLeaderboard(circleId),
      ]);
      setCircle(circleRes.data);
      setBadges(badgeRes.data);
      setTasks(taskRes.data);
      setTaskSummary(summaryRes.data);
      setLeaderboard(leaderboardRes.data);
      if (circleRes.data.status === 'CONCLUDED' && circleRes.data.createdBy === user) {
        setShowConclusion(true);
        try {
          const statsRes = await getCircleStats(circleId);
          setConclusionStats(statsRes.data);
        } catch {
          setConclusionStats({
            totalCheckins: 0,
            bestStreak: Math.max(0, ...leaderboardRes.data.map((l: LeaderboardEntry) => l.longestStreak)),
            badgesAwarded: badgeRes.data.length,
            memberCount: circleRes.data.members.length,
          });
        }
      }
      const me = summaryRes.data.find((s: MemberTaskSummary) => s.username === user);
      if (me) setMyCompletion(me.completionPercent);
    } catch {
      router.push('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleTask = async (taskId: number) => {
    try {
      const res = await toggleTask(taskId);
      setMyCompletion(res.data.completionPercent);
      setTasks(prev => prev.map(t =>
        t.id === taskId ? { ...t, completedToday: res.data.completed } : t
      ));
      const [summaryRes, leaderboardRes] = await Promise.all([
        getCircleTaskSummary(circleId),
        getCircleLeaderboard(circleId),
      ]);
      setTaskSummary(summaryRes.data);
      setLeaderboard(leaderboardRes.data);
    } catch (err) { console.error(err); }
  };

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;
    setAddingTask(true);
    try {
      await addTask(circleId, newTaskTitle.trim());
      setNewTaskTitle('');
      setShowAddTask(false);
      const res = await getMyTasks(circleId);
      setTasks(res.data);
    } catch (err) { console.error(err); } finally { setAddingTask(false); }
  };

  const handleDeleteTask = async (taskId: number) => {
    try {
      await deleteTask(taskId);
      setTasks(prev => prev.filter(t => t.id !== taskId));
      const summaryRes = await getCircleTaskSummary(circleId);
      setTaskSummary(summaryRes.data);
    } catch (err) { console.error(err); }
  };

  const handleEditTask = async (taskId: number) => {
    if (!editingTitle.trim()) return;
    try {
      await updateTask(taskId, editingTitle.trim());
      setTasks(prev => prev.map(t =>
        t.id === taskId ? { ...t, title: editingTitle.trim() } : t
      ));
      setEditingTaskId(null);
      setEditingTitle('');
    } catch (err) { console.error(err); }
  };

  const copyInviteCode = () => {
    if (circle) {
      navigator.clipboard.writeText(circle.inviteCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
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

  const getTotalDays = (start: string, end: string) =>
    Math.ceil((new Date(end).getTime() - new Date(start).getTime()) / (1000 * 60 * 60 * 24));

  const getThresholdLabel = (threshold: string, custom: number | null) => {
    if (threshold === 'ANY_TASK') return 'Any task done';
    if (threshold === 'HALF') return '50%+ done';
    if (threshold === 'ALL_TASKS') return 'All tasks done';
    if (threshold === 'CUSTOM') return `${custom}%+ done`;
    return threshold;
  };

  if (loading) return (
    <div style={{
      minHeight: '100vh', backgroundColor: '#0a0a0f',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      color: 'white', fontFamily: 'system-ui'
    }}>Loading...</div>
  );

  if (!circle) return null;

  const pct = getProgressPercent(circle.goalStartDate, circle.goalEndDate);
  const daysLeft = getDaysLeft(circle.goalEndDate);
  const totalDays = getTotalDays(circle.goalStartDate, circle.goalEndDate);
  const progressColor = pct > 80 ? '#f43f5e' : pct > 50 ? '#f59e0b' : '#6366f1';
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (pct / 100) * circumference;
  const myTasksCompleted = tasks.filter(t => t.completedToday).length;
  const mySummary = taskSummary.find(s => s.username === username);
  const thresholdMet = mySummary?.thresholdMet || false;

  const rankColors: Record<number, string> = { 1: '#f59e0b', 2: '#9ca3af', 3: '#b45309' };
  const rankEmojis: Record<number, string> = { 1: '🥇', 2: '🥈', 3: '🥉' };
  const isCreator = circle.createdBy === username;
  const canDelete = deleteInput.trim().toLowerCase() === circle.name.trim().toLowerCase();

  const handleDeleteCircle = async () => {
    if (!canDelete) return;
    setDeleteLoading(true);
    try {
      await deleteCircle(circleId);
      router.push('/dashboard');
    } catch (err) {
      console.error(err);
      setDeleteLoading(false);
    }
  };

  const handleArchive = async () => {
    setConcludeLoading(true);
    try {
      await concludeCircle(circleId, 'archive');
      router.push('/profile');
    } catch (err) {
      console.error(err);
      setConcludeLoading(false);
    }
  };

  const handleExtend = async () => {
    if (!extendDate) return;
    setConcludeLoading(true);
    try {
      await concludeCircle(circleId, 'extend', extendDate);
      setShowConclusion(false);
      setShowExtendPicker(false);
      setConcludeLoading(false);
      fetchAll(username);
    } catch (err) {
      console.error(err);
      setConcludeLoading(false);
    }
  };

  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', backgroundColor: '#0a0a0f', minHeight: '100vh', color: 'white' }}>

      {/* Navbar — fixed duplicate username */}
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
        }}>← Companion 💜</Link>
        <Link href="/profile" style={{ color: '#6b7280', fontSize: '14px', textDecoration: 'none' }}>
          👤 {username}
        </Link>
      </nav>

      {/* Full-width page wrapper — no maxWidth constraint */}
      <div style={{ padding: '32px 28px' }}>

        {/* Circle header */}
        <div style={{ marginBottom: '24px' }}>
          <h1 style={{ fontSize: '36px', fontWeight: '800', marginBottom: '6px' }}>{circle.name}</h1>
          <p style={{ color: '#9ca3af', fontSize: '14px' }}>
            {circle.goalTitle} · Created by {circle.createdBy}
          </p>
          <p style={{ color: '#6b7280', fontSize: '12px', marginTop: '4px' }}>
            ✓ Streak threshold: {getThresholdLabel(circle.completionThreshold, circle.customThresholdPercent)}
          </p>
        </div>

        {/* Hero strip — Goal Progress | Today's Progress | Invite Code */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', marginBottom: '24px' }}>

          {/* Goal Progress Ring */}
          <div style={{
            background: '#12121a', border: '1px solid #1e1e2e', borderRadius: '20px',
            padding: '24px', display: 'flex', flexDirection: 'column', alignItems: 'center'
          }}>
            <p style={{ color: '#6b7280', fontSize: '11px', marginBottom: '14px', letterSpacing: '0.06em' }}>GOAL PROGRESS</p>
            <div style={{ position: 'relative', width: '130px', height: '130px' }}>
              <svg width="130" height="130" style={{ transform: 'rotate(-90deg)' }}>
                <circle cx="65" cy="65" r={radius} fill="none" stroke="#1e1e2e" strokeWidth="10" />
                <circle cx="65" cy="65" r={radius} fill="none"
                  stroke={progressColor} strokeWidth="10"
                  strokeDasharray={circumference} strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  style={{ transition: 'stroke-dashoffset 1s ease', filter: `drop-shadow(0 0 6px ${progressColor})` }}
                />
              </svg>
              <div style={{
                position: 'absolute', top: '50%', left: '50%',
                transform: 'translate(-50%, -50%)', textAlign: 'center'
              }}>
                <div style={{ fontSize: '22px', fontWeight: '800', color: progressColor }}>{pct}%</div>
                <div style={{ fontSize: '11px', color: '#6b7280' }}>{daysLeft}d left</div>
              </div>
            </div>
            <p style={{ color: '#6b7280', fontSize: '12px', marginTop: '10px' }}>
              {totalDays - daysLeft} / {totalDays} days
            </p>
          </div>

          {/* Today's Completion */}
          <div style={{
            background: '#12121a',
            border: `1px solid ${thresholdMet ? 'rgba(16,185,129,0.3)' : '#1e1e2e'}`,
            borderRadius: '20px', padding: '24px',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'
          }}>
            <p style={{ color: '#6b7280', fontSize: '11px', marginBottom: '10px', letterSpacing: '0.06em' }}>TODAY'S PROGRESS</p>
            <div style={{ fontSize: '48px', fontWeight: '900', color: thresholdMet ? '#10b981' : '#f59e0b' }}>
              {myCompletion}%
            </div>
            <div style={{ fontSize: '13px', color: '#6b7280', marginTop: '4px' }}>
              {myTasksCompleted} / {tasks.length} tasks done
            </div>
            {thresholdMet && (
              <div style={{
                marginTop: '12px', background: 'rgba(16,185,129,0.1)',
                border: '1px solid rgba(16,185,129,0.3)', color: '#10b981',
                padding: '6px 14px', borderRadius: '999px', fontSize: '12px', fontWeight: '600'
              }}>🔥 Streak threshold met!</div>
            )}
          </div>

          {/* Invite Code */}
          <div style={{
            background: '#12121a', border: '1px solid #1e1e2e', borderRadius: '20px',
            padding: '24px', display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center', gap: '12px'
          }}>
            <p style={{ color: '#6b7280', fontSize: '11px', letterSpacing: '0.06em' }}>INVITE CODE</p>
            <p style={{ fontSize: '22px', fontWeight: '800', letterSpacing: '0.15em', color: '#a5b4fc' }}>
              {circle.inviteCode}
            </p>
            <button onClick={copyInviteCode} style={{
              background: copied ? 'rgba(16,185,129,0.2)' : 'rgba(99,102,241,0.15)',
              border: `1px solid ${copied ? 'rgba(16,185,129,0.3)' : 'rgba(99,102,241,0.3)'}`,
              color: copied ? '#10b981' : '#a5b4fc',
              padding: '8px 16px', borderRadius: '10px', cursor: 'pointer',
              fontWeight: '600', fontSize: '13px'
            }}>
              {copied ? '✓ Copied!' : '📋 Copy'}
            </button>
          </div>
        </div>

        {/* MAIN 3-COLUMN LAYOUT */}
        <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr 300px', gap: '20px', alignItems: 'start' }}>

          {/* ── LEFT COLUMN: Leaderboard ── */}
          <div style={{
            background: '#12121a', border: '1px solid #1e1e2e',
            borderRadius: '20px', padding: '24px'
          }}>
            <h2 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '16px' }}>🏆 Leaderboard</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {leaderboard.map(entry => {
                const rankColor = rankColors[entry.rank] || '#6b7280';
                const rankEmoji = rankEmojis[entry.rank] || `#${entry.rank}`;
                const isMe = entry.username === username;
                return (
                  <div key={entry.username} style={{
                    display: 'flex', alignItems: 'center', gap: '10px',
                    padding: '12px 14px', borderRadius: '12px',
                    background: isMe ? 'rgba(99,102,241,0.08)' : '#0a0a0f',
                    border: `1px solid ${isMe ? 'rgba(99,102,241,0.3)' : entry.rank <= 3 ? `${rankColor}30` : '#1e1e2e'}`,
                  }}>
                    <div style={{
                      width: '28px', textAlign: 'center', flexShrink: 0,
                      fontSize: entry.rank <= 3 ? '18px' : '13px',
                      fontWeight: '800', color: entry.rank <= 3 ? rankColor : '#6b7280'
                    }}>
                      {entry.rank <= 3 ? rankEmoji : `#${entry.rank}`}
                    </div>
                    <div style={{
                      width: '32px', height: '32px', borderRadius: '50%', flexShrink: 0,
                      background: isMe ? 'linear-gradient(135deg, #6366f1, #8b5cf6)' : 'linear-gradient(135deg, #374151, #4b5563)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontWeight: '800', fontSize: '13px',
                      border: isMe ? '2px solid rgba(99,102,241,0.5)' : 'none'
                    }}>
                      {entry.username[0].toUpperCase()}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '5px', flexWrap: 'wrap' }}>
                        <p style={{ fontWeight: '700', fontSize: '13px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {entry.username}
                        </p>
                        {isMe && (
                          <span style={{
                            background: 'rgba(99,102,241,0.2)', color: '#a5b4fc',
                            fontSize: '9px', fontWeight: '600', padding: '1px 6px',
                            borderRadius: '999px', border: '1px solid rgba(99,102,241,0.3)', flexShrink: 0
                          }}>YOU</span>
                        )}
                      </div>
                      <p style={{ color: '#6b7280', fontSize: '11px', marginTop: '1px' }}>
                        {entry.currentStreak > 0 ? `${entry.currentStreak}🔥` : '—'} · {entry.todayCompletionPercent}% today
                      </p>
                    </div>
                    {entry.thresholdMetToday && (
                      <span style={{ fontSize: '14px', flexShrink: 0 }}>✅</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* ── CENTER COLUMN: Tasks ── */}
          <div style={{
            background: '#12121a', border: '1px solid #1e1e2e',
            borderRadius: '20px', padding: '24px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
              <h2 style={{ fontSize: '16px', fontWeight: '700' }}>My Daily Tasks ✅</h2>
              <button onClick={() => setShowAddTask(!showAddTask)} style={{
                background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)',
                color: '#a5b4fc', padding: '7px 14px', borderRadius: '10px',
                cursor: 'pointer', fontWeight: '600', fontSize: '13px'
              }}>+ Add Task</button>
            </div>

            {showAddTask && (
              <form onSubmit={handleAddTask} style={{ display: 'flex', gap: '10px', marginBottom: '16px' }}>
                <input
                  value={newTaskTitle}
                  onChange={e => setNewTaskTitle(e.target.value)}
                  placeholder="Enter task title..."
                  style={{
                    flex: 1, background: '#0a0a0f', border: '1px solid #1e1e2e',
                    borderRadius: '10px', padding: '10px 14px', color: 'white',
                    fontSize: '14px', outline: 'none'
                  }}
                />
                <button type="submit" disabled={addingTask} style={{
                  background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                  color: 'white', fontWeight: '700', padding: '10px 20px',
                  borderRadius: '10px', border: 'none', cursor: 'pointer', fontSize: '14px'
                }}>{addingTask ? '...' : 'Add'}</button>
                <button type="button" onClick={() => setShowAddTask(false)} style={{
                  background: 'transparent', color: '#6b7280', padding: '10px 16px',
                  borderRadius: '10px', border: '1px solid #1e1e2e', cursor: 'pointer', fontSize: '14px'
                }}>Cancel</button>
              </form>
            )}

            {tasks.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
                <div style={{ fontSize: '36px', marginBottom: '8px' }}>📝</div>
                <p>No tasks yet — add your first task above</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {tasks.map(task => (
                  <div key={task.id} style={{
                    display: 'flex', alignItems: 'center', gap: '12px',
                    padding: '14px 16px', borderRadius: '12px',
                    background: task.completedToday ? 'rgba(16,185,129,0.05)' : '#0a0a0f',
                    border: `1px solid ${editingTaskId === task.id ? '#6366f1' : task.completedToday ? 'rgba(16,185,129,0.2)' : '#1e1e2e'}`,
                    transition: 'all 0.2s'
                  }}>
                    <button onClick={() => handleToggleTask(task.id)} style={{
                      width: '24px', height: '24px', borderRadius: '6px', flexShrink: 0,
                      background: task.completedToday ? 'linear-gradient(135deg, #10b981, #059669)' : 'transparent',
                      border: `2px solid ${task.completedToday ? '#10b981' : '#374151'}`,
                      cursor: 'pointer', display: 'flex', alignItems: 'center',
                      justifyContent: 'center', fontSize: '14px', transition: 'all 0.2s'
                    }}>{task.completedToday ? '✓' : ''}</button>

                    {editingTaskId === task.id ? (
                      <input
                        value={editingTitle}
                        onChange={e => setEditingTitle(e.target.value)}
                        onKeyDown={e => {
                          if (e.key === 'Enter') handleEditTask(task.id);
                          if (e.key === 'Escape') { setEditingTaskId(null); setEditingTitle(''); }
                        }}
                        autoFocus
                        style={{
                          flex: 1, background: '#1e1e2e', border: '1px solid #6366f1',
                          borderRadius: '8px', padding: '6px 10px', color: 'white',
                          fontSize: '14px', outline: 'none'
                        }}
                      />
                    ) : (
                      <span style={{
                        flex: 1, fontSize: '14px', fontWeight: '500',
                        color: task.completedToday ? '#9ca3af' : 'white',
                        textDecoration: task.completedToday ? 'line-through' : 'none'
                      }}>{task.title}</span>
                    )}

                    {editingTaskId === task.id && (
                      <button onClick={() => handleEditTask(task.id)} style={{
                        background: 'rgba(99,102,241,0.2)', border: '1px solid rgba(99,102,241,0.3)',
                        color: '#a5b4fc', cursor: 'pointer', fontSize: '12px',
                        padding: '4px 10px', borderRadius: '6px', fontWeight: '600', flexShrink: 0
                      }}>Save</button>
                    )}

                    {editingTaskId !== task.id && (
                      <button
                        onClick={() => { setEditingTaskId(task.id); setEditingTitle(task.title); }}
                        style={{
                          background: 'transparent', border: 'none', color: '#374151',
                          cursor: 'pointer', fontSize: '14px', padding: '0 4px',
                          transition: 'color 0.2s', flexShrink: 0
                        }}
                        onMouseEnter={e => (e.currentTarget.style.color = '#a5b4fc')}
                        onMouseLeave={e => (e.currentTarget.style.color = '#374151')}
                      >✏️</button>
                    )}

                    {editingTaskId !== task.id && (
                      <button onClick={() => handleDeleteTask(task.id)} style={{
                        background: 'transparent', border: 'none', color: '#374151',
                        cursor: 'pointer', fontSize: '16px', padding: '0 4px',
                        transition: 'color 0.2s', flexShrink: 0
                      }}
                        onMouseEnter={e => (e.currentTarget.style.color = '#f43f5e')}
                        onMouseLeave={e => (e.currentTarget.style.color = '#374151')}
                      >×</button>
                    )}
                  </div>
                ))}
              </div>
            )}

            {tasks.length > 0 && (
              <div style={{ marginTop: '16px' }}>
                <div style={{ background: '#1e1e2e', borderRadius: '999px', height: '6px' }}>
                  <div style={{
                    width: `${myCompletion}%`, height: '100%', borderRadius: '999px',
                    background: `linear-gradient(90deg, #6366f1, ${thresholdMet ? '#10b981' : '#f59e0b'})`,
                    transition: 'width 0.5s ease'
                  }} />
                </div>
              </div>
            )}
          </div>

          {/* ── RIGHT COLUMN: Badge of Honor + Today's Circle Progress ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

            {/* Badge of Honor */}
            <div style={{
              background: '#12121a',
              border: badges.length > 0 ? '1px solid rgba(245,158,11,0.3)' : '1px solid #1e1e2e',
              borderRadius: '20px', padding: '24px'
            }}>
              <h2 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '16px' }}>🏅 Badge of Honor</h2>
              {badges.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '20px 0', color: '#6b7280', fontSize: '13px' }}>
                  <div style={{ fontSize: '28px', marginBottom: '8px' }}>🏅</div>
                  <p>No badges yet</p>
                  <p style={{ fontSize: '11px', marginTop: '4px', color: '#4b5563' }}>Awarded every Monday</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {badges.slice().reverse().map(badge => (
                    <div key={badge.id} style={{
                      display: 'flex', alignItems: 'center', gap: '12px',
                      padding: '12px 14px', background: 'rgba(245,158,11,0.05)',
                      border: '1px solid rgba(245,158,11,0.15)', borderRadius: '12px'
                    }}>
                      <div style={{ fontSize: '28px', flexShrink: 0 }}>🏅</div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontWeight: '700', color: '#fbbf24', fontSize: '13px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {badge.username}
                        </p>
                        <p style={{ color: '#6b7280', fontSize: '11px', marginTop: '1px' }}>
                          {badge.checkinCount} check-ins · {badge.weekStart}
                        </p>
                      </div>
                      <div style={{
                        background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.3)',
                        color: '#fbbf24', padding: '4px 10px', borderRadius: '999px',
                        fontSize: '11px', fontWeight: '600', flexShrink: 0
                      }}>Winner 🏆</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Today's Circle Progress */}
            <div style={{
              background: '#12121a', border: '1px solid #1e1e2e',
              borderRadius: '20px', padding: '24px'
            }}>
              <h2 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '16px' }}>📊 Circle Progress</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {taskSummary.map(member => (
                  <div key={member.username} style={{
                    display: 'flex', alignItems: 'center', gap: '10px',
                    padding: '10px 12px', background: '#0a0a0f', borderRadius: '10px',
                    border: `1px solid ${member.thresholdMet ? 'rgba(16,185,129,0.2)' : '#1e1e2e'}`
                  }}>
                    <div style={{
                      width: '32px', height: '32px', borderRadius: '50%', flexShrink: 0,
                      background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontWeight: '700', fontSize: '13px'
                    }}>
                      {member.username[0].toUpperCase()}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontWeight: '600', fontSize: '13px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {member.username}
                      </p>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
                        <div style={{ flex: 1, background: '#1e1e2e', borderRadius: '999px', height: '4px' }}>
                          <div style={{
                            width: `${member.completionPercent}%`, height: '100%', borderRadius: '999px',
                            background: member.thresholdMet
                              ? 'linear-gradient(90deg, #10b981, #059669)'
                              : 'linear-gradient(90deg, #6366f1, #f59e0b)'
                          }} />
                        </div>
                        <span style={{ fontSize: '11px', color: member.thresholdMet ? '#10b981' : '#9ca3af', flexShrink: 0 }}>
                          {member.completionPercent}%
                        </span>
                      </div>
                      <p style={{ color: '#4b5563', fontSize: '11px', marginTop: '2px' }}>
                        {member.completedTasks} / {member.totalTasks} tasks
                      </p>
                    </div>
                    <span style={{ fontSize: '16px', flexShrink: 0 }}>
                      {member.thresholdMet ? '✅' : member.totalTasks === 0 ? '📝' : '⏳'}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Circle Actions */}
            <div style={{
              background: '#12121a', border: '1px solid #1e1e2e',
              borderRadius: '20px', padding: '20px'
            }}>
              {isCreator ? (
                <div style={{
                  border: '1px solid rgba(244,63,94,0.3)',
                  borderRadius: '14px', padding: '16px'
                }}>
                  <p style={{ fontWeight: '700', marginBottom: '6px' }}>Danger Zone</p>
                  <p style={{ color: '#9ca3af', fontSize: '12px', marginBottom: '12px' }}>
                    Delete this circle and all associated data permanently.
                  </p>
                  <button onClick={() => setShowDeleteConfirm(true)} style={{
                    background: 'transparent',
                    border: '1px solid rgba(244,63,94,0.5)',
                    color: '#fb7185',
                    padding: '10px 14px',
                    borderRadius: '10px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    width: '100%'
                  }}>
                    🗑️ Delete Circle
                  </button>
                </div>
              ) : (
                <div>
                  <p style={{ color: '#9ca3af', fontSize: '12px', marginBottom: '10px' }}>
                    Need a break? You can leave the circle.
                  </p>
                  <button onClick={() => router.push(`/circle/${circleId}/leave`)} style={{
                    background: 'transparent',
                    border: '1px solid #1e1e2e',
                    color: '#9ca3af',
                    padding: '10px 14px',
                    borderRadius: '10px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    width: '100%'
                  }}>
                    Leave Circle
                  </button>
                </div>
              )}
            </div>

          </div>
        </div>
      </div>

      {showDeleteConfirm && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50
        }}>
          <div style={{
            background: '#12121a', border: '1px solid rgba(244,63,94,0.4)',
            borderRadius: '20px', padding: '28px', width: '100%', maxWidth: '460px'
          }}>
            <h3 style={{ fontSize: '18px', fontWeight: '800', marginBottom: '8px' }}>
              Delete {circle.name}?
            </h3>
            <p style={{ color: '#9ca3af', fontSize: '13px', marginBottom: '16px' }}>
              This will permanently delete {circle.name} and all data.
              Type {circle.name.toUpperCase()} to confirm.
            </p>
            <input
              value={deleteInput}
              onChange={(e) => setDeleteInput(e.target.value)}
              placeholder={circle.name.toUpperCase()}
              style={{
                width: '100%', background: '#0a0a0f', border: '1px solid #1e1e2e',
                borderRadius: '10px', padding: '10px 12px', color: 'white',
                fontSize: '14px', outline: 'none', marginBottom: '16px'
              }}
            />
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => { setShowDeleteConfirm(false); setDeleteInput(''); }} style={{
                flex: 1, background: 'transparent', border: '1px solid #1e1e2e',
                color: '#9ca3af', padding: '10px', borderRadius: '10px',
                fontWeight: '600', cursor: 'pointer'
              }}>
                Cancel
              </button>
              <button onClick={handleDeleteCircle} disabled={!canDelete || deleteLoading} style={{
                flex: 1,
                background: !canDelete || deleteLoading ? '#3f3f46' : 'rgba(244,63,94,0.2)',
                border: '1px solid rgba(244,63,94,0.4)', color: '#fb7185',
                padding: '10px', borderRadius: '10px', fontWeight: '700',
                cursor: !canDelete || deleteLoading ? 'not-allowed' : 'pointer'
              }}>
                {deleteLoading ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showConclusion && isCreator && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(4,4,8,0.9)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 60
        }}>
          <div style={{
            background: '#12121a', border: '1px solid #1e1e2e',
            borderRadius: '28px', padding: '36px', width: '100%', maxWidth: '620px'
          }}>
            <div style={{ textAlign: 'center', marginBottom: '24px' }}>
              <div style={{ fontSize: '40px', marginBottom: '10px' }}>🎉</div>
              <h2 style={{ fontSize: '26px', fontWeight: '800', marginBottom: '6px' }}>
                You did it. {circle.name} is complete.
              </h2>
              <p style={{ color: '#9ca3af', fontSize: '14px' }}>
                Close it as an achievement or extend the journey.
              </p>
            </div>

            <div style={{
              display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px',
              marginBottom: '24px'
            }}>
              {[
                { label: 'Total Check-ins', value: conclusionStats.totalCheckins },
                { label: 'Best Streak', value: `${conclusionStats.bestStreak}🔥` },
                { label: 'Badges', value: `${conclusionStats.badgesAwarded}🏅` },
                { label: 'Members', value: conclusionStats.memberCount },
              ].map(stat => (
                <div key={stat.label} style={{
                  background: '#0a0a0f', border: '1px solid #1e1e2e',
                  borderRadius: '14px', padding: '12px', textAlign: 'center'
                }}>
                  <div style={{ fontSize: '16px', fontWeight: '800' }}>{stat.value}</div>
                  <div style={{ fontSize: '11px', color: '#6b7280', marginTop: '4px' }}>{stat.label}</div>
                </div>
              ))}
            </div>

            {showExtendPicker && (
              <div style={{ marginBottom: '16px' }}>
                <label style={{ color: '#9ca3af', fontSize: '12px' }}>New end date</label>
                <input
                  type="date"
                  value={extendDate}
                  onChange={(e) => setExtendDate(e.target.value)}
                  style={{
                    width: '100%', marginTop: '6px', background: '#0a0a0f',
                    border: '1px solid #1e1e2e', borderRadius: '10px',
                    padding: '10px 12px', color: 'white'
                  }}
                />
              </div>
            )}

            <div style={{ display: 'flex', gap: '12px' }}>
              <button onClick={handleArchive} disabled={concludeLoading} style={{
                flex: 1, background: 'linear-gradient(135deg, #f59e0b, #fbbf24)',
                color: '#1f2937', fontWeight: '800', padding: '12px',
                borderRadius: '12px', border: 'none', cursor: 'pointer'
              }}>
                Archive as Achievement
              </button>
              <button onClick={() => setShowExtendPicker(true)} disabled={concludeLoading} style={{
                flex: 1, background: 'transparent', border: '1px solid #1e1e2e',
                color: '#a5b4fc', padding: '12px', borderRadius: '12px',
                fontWeight: '700', cursor: 'pointer'
              }}>
                Extend the Circle
              </button>
            </div>

            {showExtendPicker && (
              <button onClick={handleExtend} disabled={concludeLoading || !extendDate} style={{
                marginTop: '12px', width: '100%',
                background: concludeLoading || !extendDate ? '#3f3f46' : 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                color: 'white', fontWeight: '700', padding: '12px',
                borderRadius: '12px', border: 'none', cursor: concludeLoading || !extendDate ? 'not-allowed' : 'pointer'
              }}>
                {concludeLoading ? 'Updating...' : 'Confirm new end date'}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}