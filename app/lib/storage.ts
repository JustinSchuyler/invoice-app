import type { Customer, Invoice, Settings } from './types'
import { DEFAULT_SETTINGS } from './types'

const KEYS = {
  settings: 'invoice-settings',
  history: 'invoice-history',
  customers: 'invoice-customers',
} as const

function get<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return fallback
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

function set<T>(key: string, value: T): void {
  localStorage.setItem(key, JSON.stringify(value))
}

// Settings
export function getSettings(): Settings {
  const stored = get<Partial<Settings>>(KEYS.settings, {})
  return { ...DEFAULT_SETTINGS, ...stored }
}

export function saveSettings(settings: Settings): void {
  set(KEYS.settings, settings)
}

// Invoices
export function getInvoices(): Invoice[] {
  return get<Invoice[]>(KEYS.history, [])
}

export function saveInvoice(invoice: Invoice): void {
  const invoices = getInvoices()
  const idx = invoices.findIndex(i => i.id === invoice.id)
  if (idx >= 0) {
    invoices[idx] = invoice
  } else {
    invoices.unshift(invoice)
  }
  set(KEYS.history, invoices)
}

export function deleteInvoice(id: string): void {
  const invoices = getInvoices().filter(i => i.id !== id)
  set(KEYS.history, invoices)
}

// Customers
export function getCustomers(): Customer[] {
  return get<Customer[]>(KEYS.customers, [])
}

export function saveCustomer(customer: Customer): void {
  const customers = getCustomers()
  const idx = customers.findIndex(c => c.id === customer.id)
  if (idx >= 0) {
    customers[idx] = customer
  } else {
    customers.unshift(customer)
  }
  set(KEYS.customers, customers)
}

export function deleteCustomer(id: string): void {
  const customers = getCustomers().filter(c => c.id !== id)
  set(KEYS.customers, customers)
}
