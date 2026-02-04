import { cn } from '@/lib/utils'

export function StatusBadge({
  status,
}: {
  status: 'connected' | 'disconnected' | 'error'
}) {
  const styles = {
    connected: 'bg-green-500/20 text-green-400',
    disconnected: 'bg-zinc-700/50 text-zinc-400',
    error: 'bg-red-500/20 text-red-400',
  }

  return (
    <span
      className={cn(
        'rounded-full px-2.5 py-0.5 text-xs font-medium uppercase tracking-wide',
        styles[status]
      )}
    >
      {status}
    </span>
  )
}
