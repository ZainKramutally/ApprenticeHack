import { avatarColour } from '../lib/chat';

export function Avatar({ id, name, size = 32, host = false }: { id: string; name: string; size?: number; host?: boolean }) {
  return (
    <span
      aria-hidden="true"
      className="inline-flex shrink-0 select-none items-center justify-center rounded-full font-bold text-white ring-2 ring-white"
      style={{ width: size, height: size, fontSize: Math.round(size * 0.42), background: host ? '#111827' : avatarColour(id) }}
    >
      {name.charAt(0).toUpperCase()}
    </span>
  );
}
