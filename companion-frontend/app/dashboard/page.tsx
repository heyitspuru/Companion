'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { Plus, Link2, X, ArrowRight, Users, Flame, CircleUser, LogOut } from 'lucide-react';
import { getMyCircles, createCircle, joinCircle, addTask, logoutUser } from '@/lib/api';
import { Circle } from '@/types/index';
import { CATEGORIES, THRESHOLDS, categoryMeta } from '@/lib/categories';
import { cn } from '@/lib/cn';
import { Navbar } from '@/components/layout/Navbar';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Field, inputClasses } from '@/components/ui/Field';
import { ErrorBanner } from '@/components/ui/ErrorBanner';
import { EmptyState } from '@/components/ui/EmptyState';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { Avatar } from '@/components/ui/Avatar';
import { Chip } from '@/components/ui/Chip';
import { Modal } from '@/components/ui/Modal';
import { PageLoader } from '@/components/ui/Skeleton';

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
    // The auth token is an httpOnly cookie JS can't read, so we gate the route
    // on the non-sensitive username hint. The real check is server-side: any
    // API call without a valid cookie returns 401 and is handled below.
    const user = localStorage.getItem('username');
    if (!user) {
      router.push('/login');
      return;
    }
    setUsername(user);
    fetchCircles();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchCircles = async () => {
    try {
      const res = await getMyCircles();
      setCircles(res.data);
    } catch (err: unknown) {
      if ((err as { response?: { status?: number } })?.response?.status === 401) {
        localStorage.clear();
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
    if (!startDate || !endDate) {
      setError('Please select start and end dates');
      return;
    }
    setActionLoading(true);
    setError('');
    try {
      await createCircle({
        ...createForm,
        startDate: formatDate(startDate),
        endDate: formatDate(endDate),
        customThresholdPercent:
          createForm.completionThreshold === 'CUSTOM' ? createForm.customThresholdPercent : null,
      });
      setShowCreate(false);
      setStartDate(null);
      setEndDate(null);
      setCreateForm({
        name: '',
        goalTitle: '',
        goalCategory: 'FITNESS',
        completionThreshold: 'ANY_TASK',
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
      const validTasks = setupTasks.filter((t) => t.trim() !== '');
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
    if (e <= s) return 100; // zero/negative window — treat as complete, avoid NaN
    const now = Date.now();
    return Math.min(100, Math.max(0, Math.round(((now - s) / (e - s)) * 100)));
  };
  const getDaysLeft = (end: string) =>
    Math.max(0, Math.ceil((new Date(end).getTime() - Date.now()) / (1000 * 60 * 60 * 24)));

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (loading) return <PageLoader />;

  return (
    <div className="min-h-screen text-paragraph">
      <Navbar href="/dashboard">
        <Link
          href="/profile"
          className="focus-ring inline-flex items-center gap-1.5 rounded-md text-sm font-medium text-primary-bright hover:underline"
        >
          <CircleUser className="h-4 w-4" aria-hidden /> {username}
        </Link>
        <button
          onClick={async () => {
            // Clear the httpOnly cookie server-side, then drop the local hint.
            await logoutUser().catch(() => {});
            localStorage.clear();
            router.push('/');
          }}
          className="focus-ring inline-flex items-center gap-1.5 rounded-lg border border-ink/15 px-3 py-1.5 text-xs text-ink-soft transition-colors hover:text-ink"
        >
          <LogOut className="h-3.5 w-3.5" aria-hidden /> Logout
        </button>
      </Navbar>

      <div className="mx-auto max-w-4xl animate-fade-up px-5 py-10 sm:px-6">
        <header className="mb-8">
          <h1 className="flex items-center gap-3 font-display text-4xl text-ink">
            Your Squads <Flame className="h-8 w-8 text-fire" aria-hidden />
          </h1>
          <p className="mt-2 text-sm text-ink-soft">
            {circles.length === 0
              ? 'No circles yet — create one or join with an invite code.'
              : `You're in ${circles.length} circle${circles.length > 1 ? 's' : ''}.`}
          </p>
        </header>

        <div className="mb-6 flex flex-wrap gap-3">
          <Button
            onClick={() => {
              setShowCreate(true);
              setShowJoin(false);
              setError('');
            }}
          >
            <Plus className="h-4 w-4" aria-hidden /> Create Squad
          </Button>
          <Button
            variant="secondary"
            onClick={() => {
              setShowJoin(true);
              setShowCreate(false);
              setError('');
            }}
          >
            <Link2 className="h-4 w-4" aria-hidden /> Join with Code
          </Button>
        </div>

        {error && (
          <div className="mb-6">
            <ErrorBanner message={error} />
          </div>
        )}

        {/* Create form */}
        {showCreate && (
          <Card className="mb-8">
            <h2 className="mb-6 font-heading text-xl text-headline">Form a Squad</h2>
            <p className="mb-6 -mt-4 text-sm text-paragraph">
              A fireteam of up to 5. Small on purpose — every absence is felt.
            </p>
            <form onSubmit={handleCreate} className="flex flex-col gap-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field
                  label="Squad Name"
                  required
                  placeholder="Morning Grind"
                  value={createForm.name}
                  onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                />
                <div className="flex flex-col gap-2">
                  <label className="text-xs uppercase tracking-wide text-muted">Mission Category</label>
                  <select
                    required
                    className={inputClasses}
                    value={createForm.goalCategory}
                    onChange={(e) => setCreateForm({ ...createForm, goalCategory: e.target.value })}
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c.value} value={c.value} className="bg-surface-2">
                        {c.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <Field
                label="Mission"
                required
                placeholder="e.g. Run 5k every morning"
                hint="One line — what is the squad working toward?"
                value={createForm.goalTitle}
                onChange={(e) => setCreateForm({ ...createForm, goalTitle: e.target.value })}
              />

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="flex flex-col gap-2">
                  <label className="text-xs uppercase tracking-wide text-muted">Start Date</label>
                  <DatePicker
                    selected={startDate}
                    onChange={(date: Date | null) => {
                      setStartDate(date);
                      setEndDate(null);
                    }}
                    minDate={today}
                    placeholderText="Select start date"
                    dateFormat="dd MMM yyyy"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-xs uppercase tracking-wide text-muted">
                    End Date (min 7 days)
                  </label>
                  <DatePicker
                    selected={endDate}
                    onChange={(date: Date | null) => setEndDate(date)}
                    minDate={
                      startDate
                        ? new Date(startDate.getTime() + 7 * 24 * 60 * 60 * 1000)
                        : new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000)
                    }
                    placeholderText="Select end date"
                    dateFormat="dd MMM yyyy"
                    disabled={!startDate}
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-xs uppercase tracking-wide text-muted">
                  Daily Completion Threshold
                </label>
                <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                  {THRESHOLDS.map((t) => {
                    const active = createForm.completionThreshold === t.value;
                    const Icon = t.icon;
                    return (
                      <button
                        type="button"
                        key={t.value}
                        onClick={() => setCreateForm({ ...createForm, completionThreshold: t.value })}
                        className={cn(
                          'flex items-start gap-3 rounded-xl border p-3 text-left transition-colors duration-200',
                          active
                            ? 'border-primary bg-primary/10'
                            : 'border-border bg-surface-2 hover:border-muted',
                        )}
                      >
                        <Icon
                          className={cn('mt-0.5 h-4 w-4 shrink-0', active ? 'text-primary-bright' : 'text-muted')}
                          aria-hidden
                        />
                        <span>
                          <span className="block text-sm font-medium text-headline">{t.label}</span>
                          <span className="block text-xs text-muted">{t.desc}</span>
                        </span>
                      </button>
                    );
                  })}
                </div>
                {createForm.completionThreshold === 'CUSTOM' && (
                  <div className="mt-3 max-w-[140px]">
                    <Field
                      label="Custom %"
                      type="number"
                      min={1}
                      max={100}
                      value={createForm.customThresholdPercent}
                      onChange={(e) =>
                        setCreateForm({ ...createForm, customThresholdPercent: Number(e.target.value) })
                      }
                    />
                  </div>
                )}
              </div>

              <div className="mt-1 flex gap-3">
                <Button type="submit" loading={actionLoading} loadingText="Creating…">
                  Create Squad <ArrowRight className="h-4 w-4" aria-hidden />
                </Button>
                <Button type="button" variant="ghost" onClick={() => setShowCreate(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </Card>
        )}

        {/* Join form */}
        {showJoin && (
          <Card className="mb-8">
            <h2 className="mb-6 font-heading text-xl text-headline">Join a Squad</h2>
            <form onSubmit={handleJoin} className="flex flex-col gap-3 sm:flex-row">
              <input
                required
                className={cn(inputClasses, 'sm:max-w-xs')}
                placeholder="Enter invite code (e.g. 72AADD9E)"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value)}
              />
              <Button type="submit" loading={actionLoading} loadingText="Joining…">
                Join <ArrowRight className="h-4 w-4" aria-hidden />
              </Button>
              <Button type="button" variant="ghost" onClick={() => setShowJoin(false)}>
                Cancel
              </Button>
            </form>
          </Card>
        )}

        {/* Circles grid */}
        {circles.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No squads yet"
            description="Form one or join with an invite code to get started."
          />
        ) : (
          <div className="grid gap-5">
            {circles.map((circle) => {
              const pct = getProgressPercent(circle.goalStartDate, circle.goalEndDate);
              const daysLeft = getDaysLeft(circle.goalEndDate);
              const meta = categoryMeta(circle.goalCategory);
              const CatIcon = meta.icon;
              const urgent = daysLeft < 7;

              return (
                <Link key={circle.id} href={`/circle/${circle.id}`} className="focus-ring rounded-xl3">
                  <Card interactive>
                    <div className="mb-5 flex items-start justify-between">
                      <div>
                        <div className="mb-1.5 flex items-center gap-2.5">
                          <Chip color={meta.color}>
                            <CatIcon className="h-3.5 w-3.5" aria-hidden /> {meta.label}
                          </Chip>
                          <span className="text-xs text-muted">
                            {circle.members.length}/5 in squad
                          </span>
                        </div>
                        <h3 className="font-heading text-2xl text-headline">{circle.name}</h3>
                        <p className="mt-0.5 text-sm text-paragraph">{circle.goalTitle}</p>
                      </div>
                      <div className="text-right">
                        <div
                          className={cn('font-heading text-3xl', urgent ? 'text-danger' : 'text-success')}
                        >
                          {daysLeft}
                        </div>
                        <div className="text-xs text-muted">days left</div>
                      </div>
                    </div>

                    <div className="mb-4">
                      <div className="mb-1.5 flex justify-between text-xs">
                        <span className="text-muted">Mission Progress</span>
                        <span className="font-medium text-primary-bright">{pct}%</span>
                      </div>
                      <ProgressBar value={pct} />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex -space-x-2">
                        {circle.members.slice(0, 4).map((m) => (
                          <Avatar
                            key={m.username}
                            name={m.username}
                            size={32}
                            className="ring-2 ring-bg"
                          />
                        ))}
                      </div>
                      <span className="inline-flex items-center gap-1 text-sm font-medium text-primary-bright">
                        View Squad <ArrowRight className="h-4 w-4" aria-hidden />
                      </span>
                    </div>
                  </Card>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {/* Task setup modal */}
      <Modal
        open={showTaskSetup && !!newlyJoinedCircle}
        onClose={() => {
          setShowTaskSetup(false);
          setNewlyJoinedCircle(null);
        }}
      >
        {newlyJoinedCircle && (
          <>
            <div className="mb-7">
              <Chip className="mb-4">You joined a squad</Chip>
              <h2 className="font-heading text-2xl text-headline">Set up your tasks</h2>
              <p className="mt-1 text-sm text-paragraph">
                Add your personal daily tasks for{' '}
                <span className="font-medium text-primary-bright">{newlyJoinedCircle.name}</span>.
                These are what you&apos;ll check off every day.
              </p>
            </div>

            <div className="mb-6 rounded-xl border border-border bg-surface-2 p-4">
              <p className="text-sm font-medium text-headline">{newlyJoinedCircle.goalTitle}</p>
              {newlyJoinedCircle.goalDescription && (
                <p className="mt-0.5 text-xs text-muted">{newlyJoinedCircle.goalDescription}</p>
              )}
            </div>

            <div className="mb-5 flex flex-col gap-2.5">
              {setupTasks.map((task, index) => (
                <div key={index} className="flex items-center gap-2.5">
                  <div className="h-5 w-5 shrink-0 rounded-md border-2 border-border" />
                  <input
                    value={task}
                    onChange={(e) => handleSetupTaskChange(index, e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddSetupTaskField();
                      }
                    }}
                    placeholder={`Task ${index + 1} — e.g. Read for 30 mins`}
                    className={inputClasses}
                    autoFocus={index === setupTasks.length - 1}
                  />
                  {setupTasks.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveSetupTaskField(index)}
                      aria-label="Remove task"
                      className="shrink-0 text-muted transition-colors hover:text-danger"
                    >
                      <X className="h-4 w-4" aria-hidden />
                    </button>
                  )}
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={handleAddSetupTaskField}
              className="mb-6 w-full rounded-xl border border-dashed border-border py-2.5 text-sm text-muted transition-colors hover:border-primary hover:text-primary-bright"
            >
              + Add another task
            </button>

            <div className="flex gap-3">
              <Button
                fullWidth
                onClick={handleSaveSetupTasks}
                loading={setupLoading}
                loadingText="Saving…"
                disabled={setupTasks.every((t) => t.trim() === '')}
              >
                Save Tasks &amp; Enter <ArrowRight className="h-4 w-4" aria-hidden />
              </Button>
              <Button
                variant="ghost"
                onClick={() => {
                  setShowTaskSetup(false);
                  setNewlyJoinedCircle(null);
                }}
              >
                Skip
              </Button>
            </div>

            <p className="mt-4 text-center text-xs text-muted">
              Press Enter to quickly add multiple tasks · You can edit these anytime
            </p>
          </>
        )}
      </Modal>
    </div>
  );
}
