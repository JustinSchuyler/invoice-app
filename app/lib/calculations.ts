import type { LineItem } from './types'

export function calcSubtotal(lineItems: LineItem[]): number {
  return lineItems.reduce((sum, item) => sum + item.amount, 0)
}

export function calcTotal(subtotal: number, other: number): number {
  return subtotal + other
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount)
}
