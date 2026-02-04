'use client'

import { useState } from 'react'
import { Copy, Check } from 'lucide-react'
import { cn } from '@/lib/utils'

export function UrlCard({
  url,
  label,
  color,
}: {
  url: string
  label: string
  color: 'red' | 'blue'
}) {
  const [copied, setCopied] = useState(false)

  const colorStyles = {
    red: 'border-red-500/20 hover:border-red-500/40',
    blue: 'border-blue-500/20 hover:border-blue-500/40',
  }

  const handleCopy = async () => {
    await navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div
      className={cn(
        'flex items-center justify-between rounded-lg border bg-zinc-800/30 p-3 transition-colors',
        colorStyles[color]
      )}
    >
      <div>
        <code className="block font-mono text-sm text-cyan-400">{url}</code>
        <span className="text-xs text-zinc-500">{label}</span>
      </div>
      <button
        onClick={handleCopy}
        className={cn(
          'flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors',
          copied
            ? 'bg-green-500/20 text-green-400'
            : 'bg-zinc-700 text-zinc-300 hover:bg-zinc-600 hover:text-white'
        )}
      >
        {copied ? (
          <>
            <Check className="h-3.5 w-3.5" />
            Copied
          </>
        ) : (
          <>
            <Copy className="h-3.5 w-3.5" />
            Copy
          </>
        )}
      </button>
    </div>
  )
}
