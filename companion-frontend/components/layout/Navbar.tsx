import { Wordmark } from '@/components/brand/Wordmark';

type NavbarProps = {
  /** Where the wordmark links to. */
  href?: string;
  /** Show a back chevron in the wordmark (sub-pages). */
  back?: boolean;
  /** Right-hand actions (profile link, logout, etc.). */
  children?: React.ReactNode;
};

export function Navbar({ href = '/dashboard', back, children }: NavbarProps) {
  return (
    <nav className="sticky top-0 z-30 flex items-center justify-between border-b border-ink/10 bg-bg/70 px-5 py-4 backdrop-blur-md sm:px-8">
      <Wordmark href={href} back={back} />
      <div className="flex items-center gap-3">{children}</div>
    </nav>
  );
}
