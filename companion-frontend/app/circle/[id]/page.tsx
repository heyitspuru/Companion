'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import {
  Shield,
  ShieldAlert,
  HeartHandshake,
  ListChecks,
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
  getMyTasks,
  addTask,
  deleteTask,
  toggleTask,
  getCircleTaskSummary,
  updateTask,
  deleteCircle,
  concludeCircle,
  getCircleStats,
  rally,
} from '@/lib/api';
import { Circle, Task, MemberTaskSummary } from '@/types/index';
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
    squadLongestStreak: 0,
    memberCount: 0,
  });

  useEffect(() => {
    // Auth is an httpOnly cookie; gate on the local username hint.
    const user = localStorage.getItem('username');
    if (!user) {
      router.push('/login');
      return;
    }
    setUsername(user);
    fetchAll(user);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchAll = async (user: string) => {
    try {
      const [circleRes, taskRes, summaryRes] = await Promise.all([
        getCircleById(circleId),
        getMyTasks(circleId),
        getCircleTaskSummary(circleId),
      ]);
      setCircle(circleRes.data);
      setTasks(taskRes.data);
      setTaskSummary(summaryRes.data);
      if (circleRes.data.status === 'CONCLUDED' && circleRes.data.createdBy === user) {
        setShowConclusion(true);
        try {
          const statsRes = await getCircleStats(circleId);
          setConclusionStats(statsRes.data);
        } catch {
          setConclusionStats({
            totalCheckins: 0,
            bestStreak: 0,
            squadLongestStreak: circleRes.data.squadLongestStreak,
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

  // After any task change, refresh both the per-member status AND the circle
  // (so the collective squad streak, recomputed server-side, stays in sync).
  const refreshSquad = async () => {
    const [summaryRes, circleRes] = await Promise.all([
      getCircleTaskSummary(circleId),
      getCircleById(circleId),
    ]);
    setTaskSummary(summaryRes.data);
    setCircle(circleRes.data);
  };

  const handleToggleTask = async (taskId: number) => {
    try {
      const res = await toggleTask(taskId);
      setMyCompletion(res.data.completionPercent);
      setTasks((prev) =>
        prev.map((t) => (t.id === taskId ? { ...t, completedToday: res.data.completed } : t)),
      );
      await refreshSquad();
    } catch (err) {
      console.error(err);
    }
  };

  const [rallyingUser, setRallyingUser] = useState<string | null>(null);

  const handleRally = async (targetUsername: string) => {
    setRallyingUser(targetUsername);
    try {
      const res = await rally(circleId, targetUsername);
      setTaskSummary(res.data); // refreshed squad status (now shows "backed by")
    } catch (err) {
      console.error(err);
    } finally {
      setRallyingUser(null);
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
      await refreshSquad();
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

  // Squad cohesion signals
  const reportedIn = taskSummary.filter((m) => m.thresholdMet).length;
  const squadSize = taskSummary.length || circle.members.length;
  const squadComplete = circle.squadCompleteToday;
  const myBackers = mySummary?.backedBy ?? [];

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
            <CheckCircle2 className="h-3.5 w-3.5" aria-hidden /> Report-in rule:{' '}
            {thresholdLabel(circle.completionThreshold, circle.customThresholdPercent)}
          </p>
        </div>

        {/* Hero strip */}
        <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
          <Card className="flex flex-col items-center">
            <p className="mb-3 text-xs uppercase tracking-widest text-muted">Mission Progress</p>
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

          {/* Collective squad streak — the headline cohesion metric */}
          <Card
            tone={squadComplete ? 'success' : 'default'}
            className="flex flex-col items-center justify-center"
          >
            <p className="mb-2 inline-flex items-center gap-1.5 text-xs uppercase tracking-widest text-muted">
              <Flame className="h-3.5 w-3.5 text-fire" aria-hidden /> Squad Streak
            </p>
            <div
              className="font-heading text-6xl leading-none"
              style={{ color: circle.squadCurrentStreak > 0 ? '#ff8906' : '#72757e' }}
            >
              {circle.squadCurrentStreak}
            </div>
            <div className="mt-1.5 text-xs text-muted">
              day{circle.squadCurrentStreak === 1 ? '' : 's'} · longest {circle.squadLongestStreak}
            </div>
            <div
              className={cn(
                'mt-3 inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium',
                squadComplete
                  ? 'border-success/30 bg-success/10 text-success'
                  : 'border-border bg-surface-2 text-paragraph',
              )}
            >
              {squadComplete ? (
                <>
                  <CheckCircle2 className="h-3.5 w-3.5" aria-hidden /> Whole squad in today
                </>
              ) : (
                <>
                  <Clock className="h-3.5 w-3.5 text-gold" aria-hidden /> {reportedIn}/{squadSize} reported in
                </>
              )}
            </div>
          </Card>

          <Card className="flex flex-col items-center justify-center gap-3">
            <p className="text-xs uppercase tracking-widest text-muted">Invite Code</p>
            <p className="font-heading text-2xl tracking-[0.2em] text-primary-bright">
              {circle.inviteCode}
            </p>
            <Button
              size="sm"
              variant="secondary"
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

        {/* Main 2-col: Squad Status + Tasks */}
        <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-[340px_1fr]">
          {/* Squad Status — who's in today. No ranking: the unit wins together. */}
          <div className="flex flex-col gap-4">
            <Card>
              <h2 className="mb-1 inline-flex items-center gap-2 font-heading text-base text-headline">
                <Shield className="h-4 w-4 text-primary-bright" aria-hidden /> Squad Status
              </h2>
              <p className="mb-4 text-xs text-muted">
                {squadComplete
                  ? 'Everyone showed up. Streak is safe today.'
                  : `${reportedIn}/${squadSize} in — no one gets left behind.`}
              </p>

              {/* "X has your back" — the in-app channel for the rallied member */}
              {myBackers.length > 0 && !mySummary?.thresholdMet && (
                <div className="mb-4 flex items-start gap-2.5 rounded-xl border border-primary/30 bg-primary/[0.08] p-3">
                  <HeartHandshake className="mt-0.5 h-4 w-4 shrink-0 text-primary-bright" aria-hidden />
                  <p className="text-xs text-headline">
                    <span className="font-semibold text-primary-bright">
                      {myBackers.join(', ')}
                    </span>{' '}
                    {myBackers.length > 1 ? 'have' : 'has'} your back — get in before the streak breaks.
                  </p>
                </div>
              )}

              <div className="flex flex-col gap-2.5">
                {taskSummary.map((member) => {
                  const isMe = member.username === username;
                  const inToday = member.thresholdMet;
                  const atRisk = member.atRisk;
                  return (
                    <div
                      key={member.username}
                      className={cn(
                        'flex items-center gap-2.5 rounded-xl border p-3',
                        inToday
                          ? 'border-success/25 bg-success/[0.06]'
                          : atRisk
                            ? 'border-danger/40 bg-danger/[0.06]'
                            : 'border-border bg-surface-2',
                      )}
                    >
                      <Avatar name={member.username} size={32} me={isMe} />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <p className="truncate text-sm font-semibold text-headline">
                            {member.username}
                          </p>
                          {isMe && (
                            <span className="shrink-0 rounded-full border border-primary/30 bg-primary/20 px-1.5 text-[9px] font-semibold text-primary-bright">
                              YOU
                            </span>
                          )}
                        </div>
                        <p
                          className={cn(
                            'mt-0.5 text-xs',
                            inToday ? 'text-success' : atRisk ? 'text-danger' : 'text-muted',
                          )}
                        >
                          {member.totalTasks === 0
                            ? 'No tasks set up yet'
                            : inToday
                              ? 'Reported in ✓'
                              : atRisk
                                ? 'At risk — running out of day'
                                : `Not yet · ${member.completionPercent}%`}
                        </p>
                        {member.backedBy.length > 0 && !inToday && (
                          <p className="mt-0.5 inline-flex items-center gap-1 text-[11px] text-primary-bright">
                            <HeartHandshake className="h-3 w-3" aria-hidden /> backed by{' '}
                            {member.backedBy.join(', ')}
                          </p>
                        )}
                      </div>

                      {/* "I've got you" — back a squadmate who hasn't reported in */}
                      {!isMe && !inToday && member.totalTasks > 0 && !member.backedBy.includes(username) ? (
                        <Button
                          size="sm"
                          variant={atRisk ? 'fire' : 'secondary'}
                          loading={rallyingUser === member.username}
                          loadingText="…"
                          onClick={() => handleRally(member.username)}
                        >
                          <HeartHandshake className="h-4 w-4" aria-hidden /> I&apos;ve got you
                        </Button>
                      ) : (
                        <span className="shrink-0">
                          {inToday ? (
                            <CheckCircle2 className="h-5 w-5 text-success" aria-hidden />
                          ) : member.totalTasks === 0 ? (
                            <FileText className="h-4 w-4 text-muted" aria-hidden />
                          ) : atRisk ? (
                            <ShieldAlert className="h-4 w-4 text-danger" aria-hidden />
                          ) : (
                            <Clock className="h-4 w-4 text-gold" aria-hidden />
                          )}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </Card>

            {/* Actions */}
            <Card>
              {isCreator ? (
                <div className="rounded-xl border border-danger/30 p-4">
                  <p className="font-heading text-sm text-headline">Danger Zone</p>
                  <p className="mb-3 mt-1 text-xs text-paragraph">
                    Disband this squad and delete all its data permanently.
                  </p>
                  <Button variant="danger" fullWidth onClick={() => setShowDeleteConfirm(true)}>
                    <Trash2 className="h-4 w-4" aria-hidden /> Disband Squad
                  </Button>
                </div>
              ) : (
                <div>
                  <p className="mb-2.5 text-xs text-paragraph">Need to step back? You can leave the squad.</p>
                  <Button
                    variant="ghost"
                    fullWidth
                    onClick={() => router.push(`/circle/${circleId}/leave`)}
                  >
                    Leave Squad
                  </Button>
                </div>
              )}
            </Card>
          </div>

          {/* My daily tasks — this is how you report in */}
          <Card>
            <div className="mb-2 flex items-center justify-between">
              <h2 className="inline-flex items-center gap-2 font-heading text-base text-headline">
                <ListChecks className="h-4 w-4 text-primary-bright" aria-hidden /> My Daily Tasks
              </h2>
              <Button size="sm" variant="secondary" onClick={() => setShowAddTask(!showAddTask)}>
                <Plus className="h-4 w-4" aria-hidden /> Add Task
              </Button>
            </div>
            <p className="mb-4 text-xs text-muted">
              {thresholdMet
                ? "You're in for today — the squad can count on you."
                : 'Hit your report-in rule to show up for the squad today.'}
            </p>

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
                <div className="mb-1.5 flex justify-between text-xs">
                  <span className="text-muted">Today</span>
                  <span className="font-medium text-primary-bright">
                    {myTasksCompleted} / {tasks.length} done · {myCompletion}%
                  </span>
                </div>
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
        <h3 className="font-heading text-xl text-headline">Disband {circle.name}?</h3>
        <p className="mt-2 text-sm text-paragraph">
          This will permanently delete {circle.name} and all its data. Type{' '}
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
            loadingText="Disbanding…"
          >
            Disband
          </Button>
        </div>
      </Modal>

      {/* Conclusion */}
      <Modal open={showConclusion && isCreator} onClose={() => {}} dismissible={false} maxWidthClass="max-w-xl">
        <div className="mb-6 text-center">
          <PartyPopper className="mx-auto mb-3 h-10 w-10 text-gold" aria-hidden />
          <h2 className="font-heading text-2xl text-headline">
            Mission complete. {circle.name} made it.
          </h2>
          <p className="mt-1 text-sm text-paragraph">Close it out as an achievement or extend the mission.</p>
        </div>

        <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: 'Total Check-ins', value: conclusionStats.totalCheckins },
            { label: 'Best Member Streak', value: conclusionStats.bestStreak },
            { label: 'Squad Streak', value: conclusionStats.squadLongestStreak },
            { label: 'Squad Size', value: conclusionStats.memberCount },
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
            Extend the Mission
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
