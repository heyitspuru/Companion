// Tiny classnames joiner — filters falsy values so we can do
// cn('base', condition && 'extra'). Avoids pulling in clsx for one helper.
export function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ');
}
