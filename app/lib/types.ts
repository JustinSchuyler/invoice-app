export type TemplateId = 'classic' | 'modern' | 'minimal'

export interface LineItem {
  id: string
  description: string
  amount: number
}

export interface Invoice {
  id: string
  invoiceNumber: number
  customerId: string
  date: string
  billTo: string
  lineItems: LineItem[]
  other: number
  subtotal: number
  total: number
  template: TemplateId
  createdAt: string
}

export interface Customer {
  id: string
  customerId: string
  name: string
  billTo: string
  defaultLineItems: LineItem[]
  createdAt: string
}

export interface Settings {
  companyName: string
  tagline: string
  addressLine1: string
  addressLine2: string
  phone: string
  email: string
  checkPayableTo: string
  comments: string
  defaultOther: number
  defaultTemplate: TemplateId
  autoDownload: boolean
  nextInvoiceNumber: number
}

import { COMPANY_DEFAULTS } from './config'

export const DEFAULT_SETTINGS: Settings = {
  ...COMPANY_DEFAULTS,
  defaultOther: 0,
  defaultTemplate: 'classic',
  autoDownload: true,
}
