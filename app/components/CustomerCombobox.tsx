import { useEffect, useRef, useState } from 'react'
import type { Customer } from '../lib/types'
import { getCustomers } from '../lib/storage'

interface Props {
  value: string
  onChange: (name: string, customerId: string, billTo: string, dbId: string, defaultLineItems: import('../lib/types').LineItem[]) => void
}

export function CustomerCombobox({ value, onChange }: Props) {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [query, setQuery] = useState(value)
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setCustomers(getCustomers())
  }, [open])

  useEffect(() => {
    setQuery(value)
  }, [value])

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const filtered = query.trim()
    ? customers.filter(c =>
        c.name.toLowerCase().includes(query.toLowerCase()) ||
        c.customerId.toLowerCase().includes(query.toLowerCase())
      )
    : customers

  function selectCustomer(c: Customer) {
    setQuery(c.name)
    setOpen(false)
    onChange(c.name, c.customerId, c.billTo, c.id, c.defaultLineItems)
  }

  function handleInput(val: string) {
    setQuery(val)
    setOpen(true)
    onChange(val, '', '', '', [])
  }

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <input
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-8"
          placeholder="Search customers or type ad-hoc name..."
          value={query}
          onChange={e => handleInput(e.target.value)}
          onFocus={() => setOpen(true)}
        />
        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="6 9 12 15 18 9"/>
          </svg>
        </span>
      </div>

      {open && filtered.length > 0 && (
        <div className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-56 overflow-y-auto">
          {filtered.map(c => (
            <button
              key={c.id}
              type="button"
              className="w-full text-left px-3 py-2.5 hover:bg-blue-50 text-sm flex justify-between items-start gap-4 border-b border-gray-100 last:border-0"
              onMouseDown={() => selectCustomer(c)}
            >
              <div>
                <div className="font-medium text-gray-900">{c.name}</div>
                <div className="text-gray-400 text-xs truncate max-w-48">{c.billTo.split('\n')[0]}</div>
              </div>
              <span className="text-xs text-gray-400 shrink-0 mt-0.5">#{c.customerId}</span>
            </button>
          ))}
        </div>
      )}

      {open && filtered.length === 0 && query.trim() && (
        <div className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg">
          <div className="px-3 py-2.5 text-sm text-gray-400">No saved customers matching "{query}"</div>
        </div>
      )}
    </div>
  )
}
