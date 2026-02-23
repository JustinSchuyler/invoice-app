import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { deleteInvoice, getInvoices } from '../lib/storage'
import type { Invoice } from '../lib/types'
import { formatCurrency } from '../lib/calculations'
import { generatePdf, downloadPdf } from '../lib/pdf/index'
import { getSettings } from '../lib/storage'

export const Route = createFileRoute('/history')({
  component: HistoryPage,
})

function HistoryPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [query, setQuery] = useState('')
  const [downloading, setDownloading] = useState<string | null>(null)

  useEffect(() => {
    setInvoices(getInvoices())
  }, [])

  const filtered = query.trim()
    ? invoices.filter(inv =>
        String(inv.invoiceNumber).includes(query) ||
        inv.billTo.toLowerCase().includes(query.toLowerCase()) ||
        inv.customerId.toLowerCase().includes(query.toLowerCase())
      )
    : invoices

  function handleDelete(id: string) {
    if (!confirm('Delete this invoice from history?')) return
    deleteInvoice(id)
    setInvoices(getInvoices())
  }

  async function handleDownload(inv: Invoice) {
    setDownloading(inv.id)
    try {
      const settings = getSettings()
      const bytes = await generatePdf(inv, settings)
      downloadPdf(bytes, `invoice-${inv.invoiceNumber}.pdf`)
    } finally {
      setDownloading(null)
    }
  }

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Invoice History</h1>
        <span className="text-sm text-gray-400">{invoices.length} invoice{invoices.length !== 1 ? 's' : ''}</span>
      </div>

      <div className="relative mb-4">
        <svg
          className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
        >
          <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
        <input
          className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Search by invoice #, customer, or bill-to..."
          value={query}
          onChange={e => setQuery(e.target.value)}
        />
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
          <div className="text-gray-300 text-5xl mb-4">📄</div>
          <p className="text-gray-500 text-sm">
            {query ? 'No invoices match your search.' : 'No invoices yet. Generate your first invoice!'}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Invoice #</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Date</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Bill To</th>
                <th className="text-right px-4 py-3 font-semibold text-gray-600">Total</th>
                <th className="text-center px-4 py-3 font-semibold text-gray-600">Template</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map(inv => (
                <tr key={inv.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-semibold text-gray-900">#{inv.invoiceNumber}</td>
                  <td className="px-4 py-3 text-gray-600">{inv.date}</td>
                  <td className="px-4 py-3 text-gray-700">
                    <div className="max-w-xs truncate">{inv.billTo.split('\n')[0]}</div>
                    {inv.customerId && (
                      <div className="text-xs text-gray-400">#{inv.customerId}</div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right font-semibold tabular-nums text-gray-900">
                    {formatCurrency(inv.total)}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="capitalize text-xs bg-gray-100 text-gray-600 rounded-full px-2 py-0.5">
                      {inv.template}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleDownload(inv)}
                        disabled={downloading === inv.id}
                        className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        aria-label="Download PDF"
                        title="Download PDF"
                      >
                        {downloading === inv.id ? (
                          <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                          </svg>
                        ) : (
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                            <polyline points="7 10 12 15 17 10"/>
                            <line x1="12" y1="15" x2="12" y2="3"/>
                          </svg>
                        )}
                      </button>
                      <button
                        onClick={() => handleDelete(inv.id)}
                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        aria-label="Delete invoice"
                        title="Delete invoice"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
