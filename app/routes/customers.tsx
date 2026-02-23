import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { deleteCustomer, getCustomers, saveCustomer } from '../lib/storage'
import type { Customer } from '../lib/types'

export const Route = createFileRoute('/customers')({
  component: CustomersPage,
})

type Mode = 'list' | 'new' | 'edit'

function emptyForm(): Omit<Customer, 'id' | 'createdAt'> {
  return { customerId: '', name: '', billTo: '' }
}

function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [mode, setMode] = useState<Mode>('list')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState(emptyForm())
  const [error, setError] = useState('')

  function reload() {
    setCustomers(getCustomers())
  }

  useEffect(() => {
    reload()
  }, [])

  function openNew() {
    setForm(emptyForm())
    setEditingId(null)
    setError('')
    setMode('new')
  }

  function openEdit(c: Customer) {
    setForm({ customerId: c.customerId, name: c.name, billTo: c.billTo })
    setEditingId(c.id)
    setError('')
    setMode('edit')
  }

  function handleSave() {
    if (!form.name.trim()) {
      setError('Name is required.')
      return
    }
    const customer: Customer = {
      id: editingId ?? crypto.randomUUID(),
      customerId: form.customerId,
      name: form.name,
      billTo: form.billTo,
      createdAt: new Date().toISOString(),
    }
    saveCustomer(customer)
    reload()
    setMode('list')
  }

  function handleDelete(id: string) {
    if (!confirm('Delete this customer?')) return
    deleteCustomer(id)
    reload()
  }

  if (mode === 'new' || mode === 'edit') {
    return (
      <div className="max-w-lg mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">
          {mode === 'new' ? 'New Customer' : 'Edit Customer'}
        </h1>
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Name</label>
            <input
              className={inputCls}
              placeholder="John Smith"
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Customer ID</label>
            <input
              className={inputCls}
              placeholder="e.g. 12345"
              value={form.customerId}
              onChange={e => setForm(f => ({ ...f, customerId: e.target.value }))}
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Bill To (address)</label>
            <textarea
              className={`${inputCls} h-28 resize-none`}
              placeholder={"John Smith\n123 Main St\nSpringfield, IL 62701"}
              value={form.billTo}
              onChange={e => setForm(f => ({ ...f, billTo: e.target.value }))}
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">{error}</div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              onClick={handleSave}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 px-4 rounded-lg transition-colors text-sm"
            >
              {mode === 'new' ? 'Create Customer' : 'Save Changes'}
            </button>
            <button
              onClick={() => setMode('list')}
              className="px-4 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Customers</h1>
        <button
          onClick={openNew}
          className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg text-sm transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          New Customer
        </button>
      </div>

      {customers.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
          <div className="text-gray-300 text-5xl mb-4">👥</div>
          <p className="text-gray-500 text-sm mb-4">No customers saved yet.</p>
          <button
            onClick={openNew}
            className="text-blue-600 hover:text-blue-700 font-medium text-sm"
          >
            Add your first customer →
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Name</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Customer ID</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Bill To</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {customers.map(c => (
                <tr key={c.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">{c.name}</td>
                  <td className="px-4 py-3 text-gray-500">{c.customerId || '—'}</td>
                  <td className="px-4 py-3 text-gray-600">
                    <div className="max-w-xs truncate text-xs">{c.billTo.split('\n')[0]}</div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => openEdit(c)}
                        className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Edit"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                        </svg>
                      </button>
                      <button
                        onClick={() => handleDelete(c.id)}
                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

const inputCls = 'w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent'
