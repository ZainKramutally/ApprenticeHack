export function Toggle({ on, onChange, label, hint }: { on: boolean; onChange: (v: boolean) => void; label: string; hint?: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      onClick={() => onChange(!on)}
      className="flex w-full items-center justify-between gap-4 rounded-xl border border-line px-4 py-3 text-left"
    >
      <span>
        <span className="block text-sm font-semibold">{label}</span>
        {hint && <span className="block text-xs text-gray-500">{hint}</span>}
      </span>
      <span className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${on ? 'bg-otj' : 'bg-stone-300'}`}>
        <span className={`absolute top-0.5 size-5 rounded-full bg-white shadow transition-[left] ${on ? 'left-[22px]' : 'left-0.5'}`} />
      </span>
    </button>
  );
}
