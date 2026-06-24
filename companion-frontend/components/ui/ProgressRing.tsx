type ProgressRingProps = {
  percent: number;
  size?: number;
  stroke?: number;
  color?: string;
  /** Big number + small caption rendered in the middle. */
  centerTop?: React.ReactNode;
  centerBottom?: React.ReactNode;
};

/** SVG progress ring — the scoreboard centerpiece. */
export function ProgressRing({
  percent,
  size = 130,
  stroke = 10,
  color = '#ff8906',
  centerTop,
  centerBottom,
}: ProgressRingProps) {
  const pct = Math.min(100, Math.max(0, percent));
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c - (pct / 100) * c;
  const center = size / 2;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }} aria-hidden>
        <circle cx={center} cy={center} r={r} fill="none" stroke="#26262f" strokeWidth={stroke} />
        <circle
          cx={center}
          cy={center}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeDasharray={c}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 1s ease', filter: `drop-shadow(0 0 6px ${color})` }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        {centerTop}
        {centerBottom}
      </div>
    </div>
  );
}
