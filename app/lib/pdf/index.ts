import type { Invoice, Settings } from '../types'
import { generateClassicPdf } from './classic'
import { generateModernPdf } from './modern'
import { generateMinimalPdf } from './minimal'

// WinAnsi (used by standard PDF fonts) can't encode control characters.
// Strip everything in the C0 range except newline, which is used for multi-line fields.
function stripControlChars(s: string): string {
  return s.replace(/[\x00-\x09\x0B-\x1F\x7F]/g, '')
}

function sanitizeInvoice(invoice: Invoice): Invoice {
  return {
    ...invoice,
    customerId: stripControlChars(invoice.customerId),
    billTo: stripControlChars(invoice.billTo),
    lineItems: invoice.lineItems.map(item => ({
      ...item,
      description: stripControlChars(item.description),
    })),
  }
}

export async function generatePdf(invoice: Invoice, settings: Settings): Promise<Uint8Array> {
  const sanitized = sanitizeInvoice(invoice)
  switch (sanitized.template) {
    case 'modern':
      return generateModernPdf(sanitized, settings)
    case 'minimal':
      return generateMinimalPdf(sanitized, settings)
    case 'classic':
    default:
      return generateClassicPdf(sanitized, settings)
  }
}

export function downloadPdf(bytes: Uint8Array, filename: string): void {
  const blob = new Blob([new Uint8Array(bytes)], { type: 'application/pdf' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
