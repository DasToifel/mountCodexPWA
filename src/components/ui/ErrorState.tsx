import { Spinner } from './Spinner'

interface Props {
  title?: string
  message?: string
  onRetry?: () => void
  retrying?: boolean
}

/** Einheitlicher Fehlerzustand mit Wiederholen-Aktion. */
export function ErrorState({
  title = 'Etwas ist schiefgelaufen',
  message,
  onRetry,
  retrying = false,
}: Props) {
  return (
    <div className="flex flex-col items-center gap-3 px-6 py-16 text-center">
      <div className="grid h-14 w-14 place-items-center rounded-full bg-danger/15 text-2xl text-danger">
        !
      </div>
      <h3 className="font-semibold text-ink">{title}</h3>
      {message && <p className="text-sm text-ink-2">{message}</p>}
      {onRetry && (
        <button
          onClick={onRetry}
          disabled={retrying}
          className="mt-2 inline-flex items-center gap-2 rounded-full bg-gold px-4 py-2 text-sm font-semibold text-black disabled:opacity-60"
        >
          {retrying && <Spinner size={16} />}
          Erneut versuchen
        </button>
      )}
    </div>
  )
}
