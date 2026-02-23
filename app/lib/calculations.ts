import type { LineItem } from './types'

export function calcSubtotal(lineItems: LineItem[]): number {
  return lineItems.reduce((sum, item) => {
    return sum + (item.quantity ?? 1) * item.unitPrice
  }, 0)
}

export function calcTax(subtotal: number, taxRate: number): number {
  return subtotal * taxRate
}

export function calcTotal(subtotal: number, tax: number, other: number): number {
  return subtotal + tax + other
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount)
}
