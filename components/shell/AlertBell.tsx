export function AlertBell() {
  return (
    <button
      type="button"
      aria-label="Alerts"
      className="relative flex h-9 w-9 items-center justify-center rounded text-ink-2 hover:bg-surface-2 hover:text-ink"
    >
      <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path
          d="M6 10a6 6 0 1 1 12 0c0 3.6 1 5 1.5 5.8H4.5C5 15 6 13.6 6 10Z"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path d="M10 18.5a2 2 0 0 0 4 0" strokeLinecap="round" />
      </svg>
    </button>
  );
}
