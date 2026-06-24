'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import {
  Trophy,
  Medal,
  Crown,
  ListChecks,
  BarChart3,
  Flame,
  Copy,
  Check,
  Pencil,
  Trash2,
  Plus,
  CircleUser,
  CheckCircle2,
  Clock,
  FileText,
  PartyPopper,
} from 'lucide-react';
import {
  getCircleById,
  getCircleBadges,
  getMyTasks,
  addTask,
  deleteTask,
  toggleTask,
  getCircleTaskSummary,
  updateTask,
  getCircleLeaderboard,
  deleteCircle,
  concludeCircle,
  getCircleStats,
} from '@/lib/api';
import { Circle, Badge, Task, MemberTaskSummary, LeaderboardEntry } from '@/types/index';
import { thresholdLabel } from '@/lib/categories';
import { cn } from '@/lib/cn';
import { Navbar } from '@/components/layout/Navbar';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { inputClasses } from '@/components/ui/Field';
import { ProgressRing } from '@/components/ui/ProgressRing';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { Avatar } from '@/components/ui/Avatar';
import { Modal } from '@/components/ui/Modal';
import { PageLoader } from '@/components/ui/Skeleton';

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
    if (!token) {
      router.push('/login');
      return;
    }
    setUsername(user || '');
    fetchAll(user || '');
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
      setTasks((prev) =>
        prev.map((t) => (t.id === taskId ? { ...t, completedToday: res.data.completed } : t)),
      );
      const [summaryRes, leaderboardRes] = await Promise.all([
        getCircleTaskSummary(circleId),
        getCircleLeaderboard(circleId),
      ]);
      setTaskSummary(summaryRes.data);
      setLeaderboard(leaderboardRes.data);
    } catch (err) {
      console.error(err);
    }
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
    } catch (err) {
      console.error(err);
    } finally {
      setAddingTask(false);
    }
  };

  const handleDeleteTask = async (taskId: number) => {
    try {
      await deleteTask(taskId);
      setTasks((prev) => prev.filter((t) => t.id !== taskId));
      const summaryRes = await getCircleTaskSummary(circleId);
      setTaskSummary(summaryRes.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleEditTask = async (taskId: number) => {
    if (!editingTitle.trim()) return;
    try {
      await updateTask(taskId, editingTitle.trim());
      setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, title: editingTitle.trim() } : t)));
      setEditingTaskId(null);
      setEditingTitle('');
    } catch (err) {
      console.error(err);
    }
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
    if (e <= s) return 100; // zero/negative window — treat as complete, avoid NaN
    const now = Date.now();
    return Math.min(100, Math.max(0, Math.round(((now - s) / (e - s)) * 100)));
  };
  const getDaysLeft = (end: string) =>
    Math.max(0, Math.ceil((new Date(end).getTime() - Date.now()) / (1000 * 60 * 60 * 24)));
  const getTotalDays = (start: string, end: string) =>
    Math.ceil((new Date(end).getTime() - new Date(start).getTime()) / (1000 * 60 * 60 * 24));

  if (loading) return <PageLoader />;
  if (!circle) return null;

  const pct = getProgressPercent(circle.goalStartDate, circle.goalEndDate);
  const daysLeft = getDaysLeft(circle.goalEndDate);
  const totalDays = getTotalDays(circle.goalStartDate, circle.goalEndDate);
  const progressColor = pct > 80 ? '#e53170' : pct > 50 ? '#f25f4c' : '#ff8906';
  const myTasksCompleted = tasks.filter((t) => t.completedToday).length;
  const mySummary = taskSummary.find((s) => s.username === username);
  const thresholdMet = mySummary?.thresholdMet || false;

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

  const rankColor = (rank: number) =>
    rank === 1 ? '#ff8906' : rank === 2 ? '#a7a9be' : rank === 3 ? '#b45309' : '#72757e';

  return (
    <div className="min-h-screen text-paragraph">
      <Navbar href="/dashboard" back>
        <Link
          href="/profile"
          className="focus-ring inline-flex items-center gap-1.5 rounded-md text-sm text-ink-soft hover:text-ink"
        >
          <CircleUser className="h-4 w-4" aria-hidden /> {username}
        </Link>
      </Navbar>

      <div className="animate-fade-up px-5 py-8 sm:px-7">
        {/* Header */}
        <div className="mb-6">
          <h1 className="font-display text-4xl text-ink">{circle.name}</h1>
          <p className="mt-1 text-sm text-ink-soft">
            {circle.goalTitle} · Created by {circle.createdBy}
          </p>
          <p className="mt-1 inline-flex items-center gap-1.5 text-xs text-ink-soft">
            <CheckCircle2 className="h-3.5 w-3.5" aria-hidden /> Streak threshold:{' '}
            {thresholdLabel(circle.completionThreshold, circle.customThresholdPercent)}
          </p>
        </div>

        {/* Hero strip */}
        <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
          <Card className="flex flex-col items-center">
            <p className="mb-3 text-xs uppercase tracking-widest text-muted">Goal Progress</p>
            <ProgressRing
              percent={pct}
              color={progressColor}
              centerTop={
                <span className="font-heading text-2xl" style={{ color: progressColor }}>
                  {pct}%
                </span>
              }
              centerBottom={<span className="text-xs text-muted">{daysLeft}d left</span>}
            />
            <p className="mt-3 text-xs text-muted">
              {totalDays - daysLeft} / {totalDays} days
            </p>
          </Card>

          <Card
            tone={thresholdMet ? 'success' : 'default'}
            className="flex flex-col items-center justify-center"
          >
            <p className="mb-2 text-xs uppercase tracking-widest text-muted">Today&apos;s Progress</p>
            <div
              className="font-heading text-5xl"
              style={{ color: thresholdMet ? '#2cb67d' : '#ff8906' }}
            >
              {myCompletion}%
            </div>
            <div className="mt-1 text-xs text-muted">
              {myTasksCompleted} / {tasks.length} tasks done
            </div>
            {thresholdMet && (
              <div className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-success/30 bg-success/10 px-3 py-1 text-xs font-medium text-success">
                <Flame className="h-3.5 w-3.5" aria-hidden /> Streak threshold met!
              </div>
            )}
          </Card>

          <Card className="flex flex-col items-center justify-center gap-3">
            <p className="text-xs uppercase tracking-widest text-muted">Invite Code</p>
            <p className="font-heading text-2xl tracking-[0.2em] text-primary-bright">
              {circle.inviteCode}
            </p>
            <Button
              size="sm"
              variant={copied ? 'secondary' : 'secondary'}
              onClick={copyInviteCode}
              className={copied ? 'border-success/40 text-success' : ''}
            >
              {copied ? (
                <>
                  <Check className="h-4 w-4" aria-hidden /> Copied!
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4" aria-hidden /> Copy
                </>
              )}
            </Button>
          </Card>
        </div>

        {/* Main 3-col */}
        <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-[300px_1fr_320px]">
          {/* Leaderboard */}
          <Card>
            <h2 className="mb-4 inline-flex items-center gap-2 font-heading text-base text-headline">
              <Trophy className="h-4 w-4 text-gold" aria-hidden /> Leaderboard
            </h2>
            <div className="flex flex-col gap-2.5">
              {leaderboard.map((entry) => {
                const isMe = entry.username === username;
                const top3 = entry.rank <= 3;
                return (
                  <div
                    key={entry.username}
                    className={cn(
                      'flex items-center gap-2.5 rounded-xl border p-3',
                      isMe
                        ? 'border-primary/30 bg-primary/[0.08]'
                        : 'border-border bg-surface-2',
                    )}
                  >
                    <div className="w-7 shrink-0 text-center">
                      {top3 ? (
                        entry.rank === 1 ? (
                          <Crown className="mx-auto h-5 w-5" style={{ color: rankColor(1) }} aria-hidden />
                        ) : (
                          <Medal
                            className="mx-auto h-5 w-5"
                            style={{ color: rankColor(entry.rank) }}
                            aria-hidden
                          />
                        )
                      ) : (
                        <span className="font-heading text-sm text-muted">#{entry.rank}</span>
                      )}
                    </div>
                    <Avatar name={entry.username} size={32} me={isMe} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <p className="truncate text-sm font-semibold text-headline">{entry.username}</p>
                        {isMe && (
                          <span className="shrink-0 rounded-full border border-primary/30 bg-primary/20 px-1.5 text-[9px] font-semibold text-primary-bright">
                            YOU
                          </span>
                        )}
                      </div>
                      <p className="mt-0.5 inline-flex items-center gap-1 text-xs text-muted">
                        {entry.currentStreak > 0 ? (
                          <>
                            {entry.currentStreak}
                            <Flame className="h-3 w-3 text-fire" aria-hidden />
                          </>
                        ) : (
                          '—'
                        )}{' '}
                        · {entry.todayCompletionPercent}% today
                      </p>
                    </div>
                    {entry.thresholdMetToday && (
                      <CheckCircle2 className="h-4 w-4 shrink-0 text-success" aria-hidden />
                    )}
                  </div>
                );
              })}
            </div>
          </Card>

          {/* Tasks */}
          <Card>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="inline-flex items-center gap-2 font-heading text-base text-headline">
                <ListChecks className="h-4 w-4 text-primary-bright" aria-hidden /> My Daily Tasks
              </h2>
              <Button size="sm" variant="secondary" onClick={() => setShowAddTask(!showAddTask)}>
                <Plus className="h-4 w-4" aria-hidden /> Add Task
              </Button>
            </div>

            {showAddTask && (
              <form onSubmit={handleAddTask} className="mb-4 flex gap-2.5">
                <input
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  placeholder="Enter task title…"
                  className={inputClasses}
                  autoFocus
                />
                <Button type="submit" loading={addingTask} loadingText="…">
                  Add
                </Button>
                <Button type="button" variant="ghost" onClick={() => setShowAddTask(false)}>
                  Cancel
                </Button>
              </form>
            )}

            {tasks.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-10 text-center text-muted">
                <FileText className="h-9 w-9" aria-hidden />
                <p className="text-sm">No tasks yet — add your first task above.</p>
              </div>
            ) : (
              <div className="flex flex-col gap-2.5">
                {tasks.map((task) => (
                  <div
                    key={task.id}
                    className={cn(
                      'flex items-center gap-3 rounded-xl border p-3.5 transition-colors',
                      editingTaskId === task.id
                        ? 'border-primary'
                        : task.completedToday
                          ? 'border-success/20 bg-success/[0.05]'
                          : 'border-border bg-surface-2',
                    )}
                  >
                    <button
                      onClick={() => handleToggleTask(task.id)}
                      aria-label={task.completedToday ? 'Mark incomplete' : 'Mark complete'}
                      className={cn(
                        'flex h-6 w-6 shrink-0 items-center justify-center rounded-md border-2 transition-colors',
                        task.completedToday
                          ? 'border-success bg-success text-headline'
                          : 'border-muted hover:border-success',
                      )}
                    >
                      {task.completedToday && <Check className="h-4 w-4" aria-hidden />}
                    </button>

                    {editingTaskId === task.id ? (
                      <input
                        value={editingTitle}
                        onChange={(e) => setEditingTitle(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleEditTask(task.id);
                          if (e.key === 'Escape') {
                            setEditingTaskId(null);
                            setEditingTitle('');
                          }
                        }}
                        autoFocus
                        className={cn(inputClasses, 'py-1.5')}
                      />
                    ) : (
                      <span
                        className={cn(
                          'flex-1 text-sm font-medium',
                          task.completedToday ? 'text-paragraph line-through' : 'text-headline',
                        )}
                      >
                        {task.title}
                      </span>
                    )}

                    {editingTaskId === task.id ? (
                      <Button size="sm" variant="secondary" onClick={() => handleEditTask(task.id)}>
                        Save
                      </Button>
                    ) : (
                      <>
                        <button
                          onClick={() => {
                            setEditingTaskId(task.id);
                            setEditingTitle(task.title);
                          }}
                          aria-label="Edit task"
                          className="shrink-0 text-muted transition-colors hover:text-primary-bright"
                        >
                          <Pencil className="h-4 w-4" aria-hidden />
                        </button>
                        <button
                          onClick={() => handleDeleteTask(task.id)}
                          aria-label="Delete task"
                          className="shrink-0 text-muted transition-colors hover:text-danger"
                        >
                          <Trash2 className="h-4 w-4" aria-hidden />
                        </button>
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}

            {tasks.length > 0 && (
              <div className="mt-4">
                <ProgressBar
                  value={myCompletion}
                  fillClass={
                    thresholdMet
                      ? 'bg-gradient-to-r from-primary to-success'
                      : 'bg-gradient-to-r from-primary to-gold'
                  }
                />
              </div>
            )}
          </Card>

          {/* Right column */}
          <div className="flex flex-col gap-4">
            {/* Badges */}
            <Card tone={badges.length > 0 ? 'gold' : 'default'}>
              <h2 className="mb-4 inline-flex items-center gap-2 font-heading text-base text-headline">
                <Medal className="h-4 w-4 text-gold" aria-hidden /> Badge of Honor
              </h2>
              {badges.length === 0 ? (
                <div className="flex flex-col items-center gap-1.5 py-5 text-center text-muted">
                  <Medal className="h-7 w-7" aria-hidden />
                  <p className="text-sm">No badges yet</p>
                  <p className="text-xs text-muted/70">Awarded every Monday</p>
                </div>
              ) : (
                <div className="flex flex-col gap-2.5">
                  {badges
                    .slice()
                    .reverse()
                    .map((badge) => (
                      <div
                        key={badge.id}
                        className="flex items-center gap-3 rounded-xl border border-gold/15 bg-gold/[0.05] p-3"
                      >
                        <Medal className="h-6 w-6 shrink-0 text-gold" aria-hidden />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold text-gold">{badge.username}</p>
                          <p className="mt-0.5 text-xs text-muted">
                            {badge.checkinCount} check-ins · {badge.weekStart}
                          </p>
                        </div>
                        <span className="shrink-0 rounded-full border border-gold/30 bg-gold/15 px-2.5 py-1 text-xs font-medium text-gold">
                          Winner
                        </span>
                      </div>
                    ))}
                </div>
              )}
            </Card>

            {/* Circle progress */}
            <Card>
              <h2 className="mb-4 inline-flex items-center gap-2 font-heading text-base text-headline">
                <BarChart3 className="h-4 w-4 text-primary-bright" aria-hidden /> Circle Progress
              </h2>
              <div className="flex flex-col gap-2.5">
                {taskSummary.map((member) => (
                  <div
                    key={member.username}
                    className={cn(
                      'flex items-center gap-2.5 rounded-xl border p-2.5',
                      member.thresholdMet ? 'border-success/20' : 'border-border',
                      'bg-surface-2',
                    )}
                  >
                    <Avatar name={member.username} size={32} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-headline">{member.username}</p>
                      <div className="mt-1 flex items-center gap-1.5">
                        <ProgressBar
                          value={member.completionPercent}
                          heightClass="h-1"
                          fillClass={
                            member.thresholdMet
                              ? 'bg-gradient-to-r from-success to-success'
                              : 'bg-gradient-to-r from-primary to-gold'
                          }
                        />
                        <span
                          className={cn(
                            'shrink-0 text-xs',
                            member.thresholdMet ? 'text-success' : 'text-paragraph',
                          )}
                        >
                          {member.completionPercent}%
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-muted">
                        {member.completedTasks} / {member.totalTasks} tasks
                      </p>
                    </div>
                    <span className="shrink-0">
                      {member.thresholdMet ? (
                        <CheckCircle2 className="h-4 w-4 text-success" aria-hidden />
                      ) : member.totalTasks === 0 ? (
                        <FileText className="h-4 w-4 text-muted" aria-hidden />
                      ) : (
                        <Clock className="h-4 w-4 text-gold" aria-hidden />
                      )}
                    </span>
                  </div>
                ))}
              </div>
            </Card>

            {/* Actions */}
            <Card>
              {isCreator ? (
                <div className="rounded-xl border border-danger/30 p-4">
                  <p className="font-heading text-sm text-headline">Danger Zone</p>
                  <p className="mb-3 mt-1 text-xs text-paragraph">
                    Delete this circle and all associated data permanently.
                  </p>
                  <Button variant="danger" fullWidth onClick={() => setShowDeleteConfirm(true)}>
                    <Trash2 className="h-4 w-4" aria-hidden /> Delete Circle
                  </Button>
                </div>
              ) : (
                <div>
                  <p className="mb-2.5 text-xs text-paragraph">Need a break? You can leave the circle.</p>
                  <Button
                    variant="ghost"
                    fullWidth
                    onClick={() => router.push(`/circle/${circleId}/leave`)}
                  >
                    Leave Circle
                  </Button>
                </div>
              )}
            </Card>
          </div>
        </div>
      </div>

      {/* Delete confirm */}
      <Modal
        open={showDeleteConfirm}
        onClose={() => {
          setShowDeleteConfirm(false);
          setDeleteInput('');
        }}
        maxWidthClass="max-w-md"
      >
        <h3 className="font-heading text-xl text-headline">Delete {circle.name}?</h3>
        <p className="mt-2 text-sm text-paragraph">
          This will permanently delete {circle.name} and all data. Type{' '}
          <span className="font-medium text-headline">{circle.name.toUpperCase()}</span> to confirm.
        </p>
        <input
          value={deleteInput}
          onChange={(e) => setDeleteInput(e.target.value)}
          placeholder={circle.name.toUpperCase()}
          className={cn(inputClasses, 'my-4')}
        />
        <div className="flex gap-3">
          <Button
            variant="ghost"
            fullWidth
            onClick={() => {
              setShowDeleteConfirm(false);
              setDeleteInput('');
            }}
          >
            Cancel
          </Button>
          <Button
            variant="danger"
            fullWidth
            onClick={handleDeleteCircle}
            disabled={!canDelete}
            loading={deleteLoading}
            loadingText="Deleting…"
          >
            Delete
          </Button>
        </div>
      </Modal>

      {/* Conclusion */}
      <Modal open={showConclusion && isCreator} onClose={() => {}} dismissible={false} maxWidthClass="max-w-xl">
        <div className="mb-6 text-center">
          <PartyPopper className="mx-auto mb-3 h-10 w-10 text-gold" aria-hidden />
          <h2 className="font-heading text-2xl text-headline">
            You did it. {circle.name} is complete.
          </h2>
          <p className="mt-1 text-sm text-paragraph">Close it as an achievement or extend the journey.</p>
        </div>

        <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: 'Total Check-ins', value: conclusionStats.totalCheckins },
            { label: 'Best Streak', value: conclusionStats.bestStreak },
            { label: 'Badges', value: conclusionStats.badgesAwarded },
            { label: 'Members', value: conclusionStats.memberCount },
          ].map((stat) => (
            <div
              key={stat.label}
              className="rounded-xl border border-border bg-surface-2 p-3 text-center"
            >
              <div className="font-heading text-xl text-headline">{stat.value}</div>
              <div className="mt-1 text-xs text-muted">{stat.label}</div>
            </div>
          ))}
        </div>

        {showExtendPicker && (
          <div className="mb-4">
            <label className="text-xs uppercase tracking-wide text-muted">New end date</label>
            <input
              type="date"
              value={extendDate}
              onChange={(e) => setExtendDate(e.target.value)}
              className={cn(inputClasses, 'mt-1.5')}
            />
          </div>
        )}

        <div className="flex flex-col gap-3 sm:flex-row">
          <Button variant="fire" fullWidth onClick={handleArchive} disabled={concludeLoading}>
            Archive as Achievement
          </Button>
          <Button
            variant="secondary"
            fullWidth
            onClick={() => setShowExtendPicker(true)}
            disabled={concludeLoading}
          >
            Extend the Circle
          </Button>
        </div>

        {showExtendPicker && (
          <Button
            fullWidth
            className="mt-3"
            onClick={handleExtend}
            disabled={!extendDate}
            loading={concludeLoading}
            loadingText="Updating…"
          >
            Confirm new end date
          </Button>
        )}
      </Modal>
    </div>
  );
}
