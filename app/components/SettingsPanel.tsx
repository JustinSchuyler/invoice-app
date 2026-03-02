import { useEffect, useState } from 'react'
import { getSettings, saveSettings } from '../lib/storage'
import type { Settings, TemplateId } from '../lib/types'

interface Props {
  open: boolean
  onClose: () => void
}

export function SettingsPanel({ open, onClose }: Props) {
  const [form, setForm] = useState<Settings>(() => getSettings())

  useEffect(() => {
    if (open) setForm(getSettings())
  }, [open])

  function update<K extends keyof Settings>(key: K, value: Settings[K]) {
    setForm(prev => ({ ...prev, [key]: value }))
  }

  function handleSave() {
    saveSettings(form)
    onClose()
  }

  if (!open) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 z-40"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="fixed top-0 right-0 h-full w-full max-w-md bg-white shadow-2xl z-50 flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold">Settings</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500"
            aria-label="Close settings"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-5">
          <Section title="Company Info">
            <Field label="Company Name">
              <input className={inputCls} value={form.companyName} onChange={e => update('companyName', e.target.value)} />
            </Field>
            <Field label="Tagline">
              <input className={inputCls} value={form.tagline} onChange={e => update('tagline', e.target.value)} />
            </Field>
            <Field label="Address Line 1">
              <input className={inputCls} value={form.addressLine1} onChange={e => update('addressLine1', e.target.value)} />
            </Field>
            <Field label="Address Line 2">
              <input className={inputCls} value={form.addressLine2} onChange={e => update('addressLine2', e.target.value)} />
            </Field>
            <Field label="Phone">
              <input className={inputCls} value={form.phone} onChange={e => update('phone', e.target.value)} />
            </Field>
            <Field label="Email">
              <input className={inputCls} type="email" value={form.email} onChange={e => update('email', e.target.value)} />
            </Field>
          </Section>

          <Section title="Invoice Defaults">
            <Field label="Check Payable To">
              <input className={inputCls} value={form.checkPayableTo} onChange={e => update('checkPayableTo', e.target.value)} />
            </Field>
            <Field label="Comments">
              <textarea
                className={`${inputCls} h-24 resize-none`}
                value={form.comments}
                onChange={e => update('comments', e.target.value)}
              />
            </Field>
            <Field label="Default Other ($)">
              <input
                className={inputCls}
                type="number"
                min="0"
                step="0.01"
                value={form.defaultOther}
                onChange={e => update('defaultOther', parseFloat(e.target.value) || 0)}
              />
            </Field>
            <Field label="Default Template">
              <select
                className={inputCls}
                value={form.defaultTemplate}
                onChange={e => update('defaultTemplate', e.target.value as TemplateId)}
              >
                <option value="classic">Classic</option>
                <option value="modern">Modern</option>
                <option value="minimal">Minimal</option>
              </select>
            </Field>
            <Field label="Next Invoice Number">
              <input
                className={inputCls}
                type="number"
                value={form.nextInvoiceNumber}
                onChange={e => update('nextInvoiceNumber', parseInt(e.target.value) || 1)}
              />
            </Field>
          </Section>

          <Section title="Behavior">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                checked={form.autoDownload}
                onChange={e => update('autoDownload', e.target.checked)}
              />
              <span className="text-sm font-medium text-gray-700">Auto-download PDF after generation</span>
            </label>
          </Section>
        </div>

        <div className="px-6 py-4 border-t border-gray-200 flex gap-3">
          <button
            onClick={handleSave}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 px-4 rounded-lg transition-colors text-sm"
          >
            Save Settings
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">{title}</h3>
      <div className="space-y-3">{children}</div>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      {children}
    </div>
  )
}

const inputCls = 'w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent'
