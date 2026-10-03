export function LogoMark({ size = 36 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true">
      <circle cx="16" cy="16" r="14" fill="#F97316" />
      <circle cx="16" cy="16" r="10.5" fill="none" stroke="#fff" strokeWidth="2" />
      <path d="M16 9.5V16l3.5 2" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M21.5 22.5l2 2 4-4.5" fill="none" stroke="#111827" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function Wordmark({ className = '' }: { className?: string }) {
  return <span className={`font-extrabold tracking-tight ${className}`}>Off the Clock</span>;
}
