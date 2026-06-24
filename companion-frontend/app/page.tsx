import { Flame, Medal, Users, ArrowRight } from 'lucide-react';
import { LinkButton } from '@/components/ui/Button';

const FEATURES = [
  { icon: Flame, title: 'Daily Streaks', desc: 'Show up every day. Watch the fire grow.' },
  { icon: Medal, title: 'Weekly Badges', desc: 'Top your circle, earn the honor.' },
  { icon: Users, title: 'Circle Goals', desc: 'Your crew holds you to it. No excuses.' },
];

export default function Home() {
  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center px-6 py-20">
      <div className="reveal relative w-full max-w-3xl text-center">
        <span className="reveal-item mb-6 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-xs uppercase tracking-[0.2em] text-primary-bright backdrop-blur-sm">
          <Flame className="h-3.5 w-3.5 text-fire" aria-hidden /> Gamified Accountability
        </span>

        <h1 className="reveal-item font-display text-6xl leading-[1.02] text-ink sm:text-8xl">
          OUTWORK
          <br />
          <span className="bg-fire-gradient bg-clip-text text-transparent">YESTERDAY</span>
        </h1>

        <p className="reveal-item mx-auto mt-6 max-w-xl text-lg leading-relaxed text-ink-soft">
          Build streaks. Earn badges. Stay accountable.{' '}
          <span className="font-semibold text-ink">Grow with your circle.</span>
        </p>

        <div className="reveal-item mx-auto mt-10 grid max-w-2xl grid-cols-1 gap-4 sm:grid-cols-3">
          {FEATURES.map(({ icon: Icon, title, desc }) => (
            <div
              key={title}
              className="rounded-xl2 border border-border bg-surface/70 p-5 text-left backdrop-blur-md transition-all duration-200 hover:-translate-y-1 hover:border-primary/50 hover:shadow-glow"
            >
              <Icon className="mb-3 h-7 w-7 text-fire" aria-hidden />
              <h3 className="font-heading text-base text-headline">{title}</h3>
              <p className="mt-1 text-sm text-muted">{desc}</p>
            </div>
          ))}
        </div>

        <div className="reveal-item mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <LinkButton href="/register" variant="gradient" size="lg" className="w-full sm:w-auto">
            Get started <ArrowRight className="h-4 w-4" aria-hidden />
          </LinkButton>
          <LinkButton href="/login" variant="secondary" size="lg" className="w-full sm:w-auto">
            Log in
          </LinkButton>
        </div>
      </div>
    </main>
  );
}
