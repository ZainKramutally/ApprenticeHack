import { BadgeCheck, Check } from 'lucide-react';
import type { ReactNode } from 'react';
import { ORGANISER_TYPE_LABEL } from '../data/organisers';
import { countsForOtj } from '../lib/events';
import { STATUS_LABEL, type KsbStatus } from '../lib/progress';
import type { EventItem, OrganiserType } from '../types';

export function Pill({ className = '', children }: { className?: string; children: ReactNode }) {
  return (
    <span className={`inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-semibold ${className}`}>
      {children}
    </span>
  );
}

/** Rule 2: OTJ / Social only, plus 18+. */
export function EventBadges({ event, size = 'sm' }: { event: EventItem; size?: 'sm' | 'md' }) {
  const big = size === 'md' ? 'px-3 py-1 text-sm' : '';
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {countsForOtj(event) ? (
        <Pill className={`bg-otj-soft text-otj ${big}`}>
          <Check className="size-3.5" strokeWidth={3} /> Counts towards OTJ
        </Pill>
      ) : (
        <Pill className={`bg-social-soft text-social ${big}`}>Social only</Pill>
      )}
      {event.ageRestricted18 && <Pill className={`border border-gray-300 bg-white text-gray-700 ${big}`}>18+</Pill>}
    </div>
  );
}

const STATUS_CLASS: Record<KsbStatus, string> = {
  focus: 'bg-accent text-white',
  need: 'bg-blue-100 text-blue-700',
  evidenced: 'bg-amber-100 text-amber-800',
  signed: 'bg-stone-100 text-stone-500',
};

export function StatusPill({ status }: { status: KsbStatus }) {
  return <Pill className={STATUS_CLASS[status]}>{STATUS_LABEL[status]}</Pill>;
}

export function OrganiserTypeBadge({ type }: { type: OrganiserType }) {
  return <Pill className="bg-stone-100 text-stone-600">{ORGANISER_TYPE_LABEL[type]}</Pill>;
}

export function CoachFocusTag() {
  return <Pill className="bg-accent-soft text-accent-dark">Coach focus</Pill>;
}

export function VerifiedTick({ verified }: { verified: boolean }) {
  if (!verified) return null;
  return (
    <span className="inline-flex items-center gap-1 text-sm font-semibold text-blue-600" title="Email domain verified">
      <BadgeCheck className="size-4" /> Verified
    </span>
  );
}
