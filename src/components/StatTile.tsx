import type { ReactNode } from 'react';

export function StatTile({ label, value, sub, visual }: { label: string; value: ReactNode; sub?: ReactNode; visual?: ReactNode }) {
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-line bg-white p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-gray-500">{label}</p>
          <p className="mt-1 text-3xl font-extrabold tracking-tight">{value}</p>
        </div>
        {visual}
      </div>
      {sub && <div className="text-sm text-gray-600">{sub}</div>}
    </div>
  );
}

export function ProgressRing({ value, size = 56, stroke = 7, color = '#F97316' }: { value: number; size?: number; stroke?: number; color?: string }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const v = Math.max(0, Math.min(1, value));
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="shrink-0 -rotate-90" aria-hidden="true">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#F3F4F6" strokeWidth={stroke} />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke={color}
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={c}
        strokeDashoffset={c * (1 - v)}
        style={{ transition: 'stroke-dashoffset 400ms ease' }}
      />
    </svg>
  );
}

export function ProgressBar({ value, color = '#16A34A' }: { value: number; color?: string }) {
  const v = Math.max(0, Math.min(1, value));
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-stone-100">
      <div className="h-full rounded-full" style={{ width: `${v * 100}%`, background: color, transition: 'width 400ms ease' }} />
    </div>
  );
}
