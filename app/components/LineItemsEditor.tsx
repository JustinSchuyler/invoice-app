import type { LineItem } from '../lib/types'
import { formatCurrency } from '../lib/calculations'

interface Props {
  items: LineItem[]
  onChange: (items: LineItem[]) => void
}

function newItem(): LineItem {
  return {
    id: crypto.randomUUID(),
    description: '',
    quantity: 1,
    unitPrice: 0,
  }
}

export function LineItemsEditor({ items, onChange }: Props) {
  function addRow() {
    onChange([...items, newItem()])
  }

  function removeRow(id: string) {
    onChange(items.filter(i => i.id !== id))
  }

  function updateItem(id: string, field: keyof LineItem, value: string | number | undefined) {
    onChange(items.map(i => i.id === id ? { ...i, [field]: value } : i))
  }

  return (
    <div>
      <div className="overflow-x-auto rounded-lg border border-gray-200">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-3 py-2.5 font-semibold text-gray-600">Description</th>
              <th className="text-center px-3 py-2.5 font-semibold text-gray-600 w-20">Qty</th>
              <th className="text-right px-3 py-2.5 font-semibold text-gray-600 w-32">Unit Price</th>
              <th className="text-right px-3 py-2.5 font-semibold text-gray-600 w-32">Total</th>
              <th className="w-10" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {items.length === 0 && (
              <tr>
                <td colSpan={5} className="px-3 py-6 text-center text-gray-400 text-sm">
                  No line items. Click "Add Row" to start.
                </td>
              </tr>
            )}
            {items.map((item) => {
              const lineTotal = (item.quantity ?? 1) * item.unitPrice
              return (
                <tr key={item.id} className="group hover:bg-gray-50">
                  <td className="px-2 py-1.5">
                    <input
                      className="w-full bg-transparent border border-transparent rounded px-1 py-1 focus:border-blue-400 focus:bg-white focus:outline-none"
                      placeholder="Description"
                      value={item.description}
                      onChange={e => updateItem(item.id, 'description', e.target.value)}
                    />
                  </td>
                  <td className="px-2 py-1.5">
                    <input
                      className="w-full bg-transparent border border-transparent rounded px-1 py-1 text-center focus:border-blue-400 focus:bg-white focus:outline-none"
                      type="number"
                      min="0"
                      step="0.01"
                      value={item.quantity ?? ''}
                      placeholder="1"
                      onChange={e => updateItem(item.id, 'quantity', e.target.value === '' ? undefined : parseFloat(e.target.value))}
                    />
                  </td>
                  <td className="px-2 py-1.5">
                    <input
                      className="w-full bg-transparent border border-transparent rounded px-1 py-1 text-right focus:border-blue-400 focus:bg-white focus:outline-none"
                      type="number"
                      min="0"
                      step="0.01"
                      value={item.unitPrice || ''}
                      placeholder="0.00"
                      onChange={e => updateItem(item.id, 'unitPrice', parseFloat(e.target.value) || 0)}
                    />
                  </td>
                  <td className="px-3 py-1.5 text-right text-gray-700 font-medium tabular-nums">
                    {formatCurrency(lineTotal)}
                  </td>
                  <td className="px-2 py-1.5 text-center">
                    <button
                      onClick={() => removeRow(item.id)}
                      className="opacity-0 group-hover:opacity-100 p-1 rounded text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all"
                      aria-label="Remove row"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                      </svg>
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      <button
        type="button"
        onClick={addRow}
        className="mt-2 flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-700 font-medium px-1 py-1"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
        </svg>
        Add Row
      </button>
    </div>
  )
}
