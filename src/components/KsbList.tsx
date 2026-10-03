import { ChevronDown } from 'lucide-react';
import { getKsb, getStandard, standardOfKsb } from '../data/standards';
import { ksbStatus, type Progress } from '../lib/progress';
import type { Apprentice, Ksb, StandardCode } from '../types';
import { StatusPill } from './Badge';

function groupByStandard(ids: string[]): [StandardCode, Ksb[]][] {
  const map = new Map<StandardCode, Ksb[]>();
  for (const id of ids) {
    const k = getKsb(id);
    if (!k) continue;
    const std = standardOfKsb(id);
    map.set(std, [...(map.get(std) ?? []), k]);
  }
  return [...map.entries()];
}

function Rows({ ksbs, user, progress }: { ksbs: Ksb[]; user?: Apprentice | null; progress?: Progress | null }) {
  return (
    <ul className="divide-y divide-line">
      {ksbs.map((k) => {
        const status = user && progress ? ksbStatus(k.id, user, progress) : null;
        return (
          <li key={k.id} className="flex flex-wrap items-start justify-between gap-x-3 gap-y-1 py-2.5">
            <p className="min-w-[55%] flex-1 text-sm">
              <span className="mr-2 inline-block min-w-9 font-bold">{k.code}</span>
              {k.text}
            </p>
            {status && <StatusPill status={status} />}
          </li>
        );
      })}
    </ul>
  );
}

/** "KSBs covered" on the event page: the user's standard first, others collapsed. */
export function KsbList({ ksbIds, user, progress }: { ksbIds: string[]; user: Apprentice | null; progress: Progress | null }) {
  const groups = groupByStandard(ksbIds);
  if (groups.length === 0) return null;

  const mine = user ? groups.find(([code]) => code === user.standardCode) : undefined;
  const others = groups.filter(([code]) => code !== mine?.[0]);

  // Organisers / no matching standard: show every group open.
  if (!mine) {
    return (
      <div className="space-y-4">
        {groups.map(([code, ksbs]) => (
          <div key={code}>
            <h4 className="text-sm font-semibold text-gray-500">{getStandard(code).title}</h4>
            <Rows ksbs={ksbs} />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h4 className="text-sm font-semibold text-gray-500">{getStandard(mine[0]).title} · your standard</h4>
        <Rows ksbs={mine[1]} user={user} progress={progress} />
      </div>
      {others.length > 0 && (
        <details className="group rounded-xl bg-stone-50 px-4 py-3">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-2 text-sm font-semibold text-gray-600">
            Also relevant to: {others.map(([c]) => getStandard(c).title.replace(/ \(.*\)$/, '')).join(', ')}
            <ChevronDown className="size-4 shrink-0 transition-transform group-open:rotate-180" />
          </summary>
          <div className="mt-3 space-y-4">
            {others.map(([code, ksbs]) => (
              <div key={code}>
                <h4 className="text-sm font-semibold text-gray-500">{getStandard(code).title}</h4>
                <Rows ksbs={ksbs} />
              </div>
            ))}
          </div>
        </details>
      )}
    </div>
  );
}
