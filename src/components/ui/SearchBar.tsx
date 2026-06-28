interface Props {
  value: string
  onChange: (v: string) => void
  placeholder?: string
}

/** Suchleiste mit Lupe und Löschen-Button (Live-Suche). */
export function SearchBar({ value, onChange, placeholder = 'Suchen…' }: Props) {
  return (
    <div className="flex items-center gap-2 rounded-card bg-elevated px-3 py-2.5">
      <svg viewBox="0 0 24 24" className="h-5 w-5 shrink-0 text-ink-3" fill="none">
        <path
          d="m21 21-4.3-4.3M19 11a8 8 0 1 1-16 0 8 8 0 0 1 16 0Z"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
      <input
        type="search"
        inputMode="search"
        autoCapitalize="off"
        autoCorrect="off"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-transparent text-ink outline-none placeholder:text-ink-3"
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange('')}
          aria-label="Suche löschen"
          className="text-ink-3"
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
            <path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm3.5 12.1-1.4 1.4L12 13.4l-2.1 2.1-1.4-1.4L10.6 12 8.5 9.9l1.4-1.4L12 10.6l2.1-2.1 1.4 1.4L13.4 12l2.1 2.1Z" />
          </svg>
        </button>
      )}
    </div>
  )
}
