import type { Invoice, Settings } from '../types'
import { generateClassicPdf } from './classic'
import { generateModernPdf } from './modern'
import { generateMinimalPdf } from './minimal'

export async function generatePdf(invoice: Invoice, settings: Settings): Promise<Uint8Array> {
  switch (invoice.template) {
    case 'modern':
      return generateModernPdf(invoice, settings)
    case 'minimal':
      return generateMinimalPdf(invoice, settings)
    case 'classic':
    default:
      return generateClassicPdf(invoice, settings)
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
