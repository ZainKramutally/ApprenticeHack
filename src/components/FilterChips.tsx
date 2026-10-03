import type { ReactNode } from 'react';
import { STANDARDS } from '../data/standards';
import { CITIES, TYPE_CHIPS, type Filters, type TypeChip } from '../lib/events';

export function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={`shrink-0 whitespace-nowrap rounded-full border px-3.5 py-1.5 text-sm font-semibold transition-colors ${
        active ? 'border-ink bg-ink text-white' : 'border-line bg-white text-gray-700 hover:border-gray-400'
      }`}
    >
      {children}
    </button>
  );
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-center gap-3">
      <span className="w-14 shrink-0 text-xs font-semibold uppercase tracking-wide text-gray-500">{label}</span>
      <div className="no-scrollbar -mr-4 flex gap-2 overflow-x-auto pr-4">{children}</div>
    </div>
  );
}

export function FilterChips({ value, onChange }: { value: Filters; onChange: (f: Filters) => void }) {
  const toggleType = (t: TypeChip) =>
    onChange({ ...value, types: value.types.includes(t) ? value.types.filter((x) => x !== t) : [...value.types, t] });

  return (
    <div className="space-y-2">
      <Row label="Course">
        {STANDARDS.map((s) => (
          <Chip key={s.code} active={value.course === s.code} onClick={() => onChange({ ...value, course: s.code })}>
            {s.shortName}
          </Chip>
        ))}
      </Row>
      <Row label="City">
        {CITIES.map((c) => (
          <Chip key={c} active={value.city === c} onClick={() => onChange({ ...value, city: c })}>
            {c}
          </Chip>
        ))}
      </Row>
      <Row label="Type">
        {TYPE_CHIPS.map((t) => (
          <Chip key={t.id} active={value.types.includes(t.id)} onClick={() => toggleType(t.id)}>
            {t.label}
          </Chip>
        ))}
      </Row>
    </div>
  );
}
