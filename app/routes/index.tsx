import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { CustomerCombobox } from '../components/CustomerCombobox'
import { LineItemsEditor } from '../components/LineItemsEditor'
import { TemplateSelector } from '../components/TemplateSelector'
import { calcSubtotal, calcTotal, formatCurrency } from '../lib/calculations'
import { generatePdf, downloadPdf } from '../lib/pdf/index'
import { getSettings, saveSettings, saveInvoice } from '../lib/storage'
import type { Invoice, LineItem, TemplateId } from '../lib/types'

export const Route = createFileRoute('/')({
  component: InvoicePage,
})

function today(): string {
  return new Date().toISOString().slice(0, 10)
}

function InvoicePage() {
  const settings = getSettings()

  const [invoiceNumber, setInvoiceNumber] = useState(settings.nextInvoiceNumber)
  const [customerName, setCustomerName] = useState('')
  const [customerId, setCustomerId] = useState('')
  const [date, setDate] = useState(today())
  const [billTo, setBillTo] = useState('')
  const [lineItems, setLineItems] = useState<LineItem[]>([
    { id: crypto.randomUUID(), description: '', amount: 0 },
  ])
  const [other, setOther] = useState(settings.defaultOther)
  const [template, setTemplate] = useState<TemplateId>(settings.defaultTemplate)
  const [autoDownload, setAutoDownload] = useState(settings.autoDownload)
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const subtotal = calcSubtotal(lineItems)
  const total = calcTotal(subtotal, other)

  function handleCustomerChange(name: string, id: string, bt: string) {
    setCustomerName(name)
    if (id) setCustomerId(id)
    if (bt) setBillTo(bt)
  }

  async function handleGenerate() {
    setError('')
    setSuccess(false)

    if (!billTo.trim()) {
      setError('Bill To is required.')
      return
    }
    if (lineItems.length === 0 || lineItems.every(i => !i.description.trim())) {
      setError('Add at least one line item with a description.')
      return
    }

    setGenerating(true)
    try {
      const invoice: Invoice = {
        id: crypto.randomUUID(),
        invoiceNumber,
        customerId,
        date,
        billTo,
        lineItems,
        other,
        subtotal,
        total,
        template,
        createdAt: new Date().toISOString(),
      }

      const pdfBytes = await generatePdf(invoice, settings)
      saveInvoice(invoice)

      // Increment invoice number
      const updatedSettings = { ...settings, nextInvoiceNumber: invoiceNumber + 1 }
      saveSettings(updatedSettings)
      setInvoiceNumber(invoiceNumber + 1)

      if (autoDownload) {
        const filename = `${customerName.trim() || 'Invoice'} ${invoiceNumber}.pdf`
        downloadPdf(pdfBytes, filename)
      } else {
        // Open in new tab
        const blob = new Blob([new Uint8Array(pdfBytes)], { type: 'application/pdf' })
        const url = URL.createObjectURL(blob)
        window.open(url, '_blank')
      }

      setSuccess(true)
      setTimeout(() => setSuccess(false), 4000)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to generate PDF.')
    } finally {
      setGenerating(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">New Invoice</h1>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-6">
        {/* Row 1: Invoice # + Date */}
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Invoice Number">
            <input
              className={inputCls}
              type="number"
              value={invoiceNumber}
              onChange={e => setInvoiceNumber(parseInt(e.target.value) || 1)}
            />
          </FormField>
          <FormField label="Date">
            <input
              className={inputCls}
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
            />
          </FormField>
        </div>

        {/* Customer */}
        <FormField label="Customer">
          <CustomerCombobox
            value={customerName}
            onChange={handleCustomerChange}
          />
        </FormField>

        <FormField label="Customer ID">
          <input
            className={inputCls}
            placeholder="e.g. 12345"
            value={customerId}
            onChange={e => setCustomerId(e.target.value)}
          />
        </FormField>

        {/* Bill To */}
        <FormField label="Bill To">
          <textarea
            className={`${inputCls} h-24 resize-none`}
            placeholder={"John Smith\n123 Main St\nSpringfield, IL 62701"}
            value={billTo}
            onChange={e => setBillTo(e.target.value)}
          />
        </FormField>

        {/* Line Items */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Line Items</label>
          <LineItemsEditor items={lineItems} onChange={setLineItems} />
        </div>

        {/* Other */}
        <FormField label="Other ($)">
          <input
            className={inputCls}
            type="number"
            min="0"
            step="0.01"
            value={other}
            onChange={e => setOther(parseFloat(e.target.value) || 0)}
          />
        </FormField>

        {/* Calculated totals */}
        <div className="bg-gray-50 rounded-xl p-4 space-y-1.5">
          <div className="flex justify-between text-sm text-gray-600">
            <span>Subtotal</span>
            <span className="tabular-nums">{formatCurrency(subtotal)}</span>
          </div>
          {other !== 0 && (
            <div className="flex justify-between text-sm text-gray-600">
              <span>Other</span>
              <span className="tabular-nums">{formatCurrency(other)}</span>
            </div>
          )}
          <div className="flex justify-between font-bold text-base text-gray-900 pt-2 border-t border-gray-200">
            <span>Total</span>
            <span className="tabular-nums">{formatCurrency(total)}</span>
          </div>
        </div>

        {/* Template Selector */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-3">Template</label>
          <TemplateSelector value={template} onChange={setTemplate} />
        </div>

        {/* Auto-download */}
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            checked={autoDownload}
            onChange={e => setAutoDownload(e.target.checked)}
          />
          <span className="text-sm text-gray-700">Auto-download PDF</span>
        </label>

        {/* Error / Success */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}
        {success && (
          <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-3 text-sm text-green-700">
            Invoice generated and saved to history!
          </div>
        )}

        {/* Generate button */}
        <button
          type="button"
          onClick={handleGenerate}
          disabled={generating}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold py-3 px-6 rounded-xl transition-colors text-sm flex items-center justify-center gap-2"
        >
          {generating ? (
            <>
              <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
              </svg>
              Generating...
            </>
          ) : (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
                <line x1="16" y1="13" x2="8" y2="13"/>
                <line x1="16" y1="17" x2="8" y2="17"/>
                <polyline points="10 9 9 9 8 9"/>
              </svg>
              Generate Invoice
            </>
          )}
        </button>
      </div>
    </div>
  )
}

function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-semibold text-gray-700 mb-1.5">{label}</label>
      {children}
    </div>
  )
}

const inputCls = 'w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent'
