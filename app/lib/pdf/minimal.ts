import { PDFDocument, rgb, StandardFonts, type PDFFont, type PDFPage } from 'pdf-lib'
import type { Invoice, Settings } from '../types'
import { formatCurrency } from '../calculations'

const BLACK = rgb(0, 0, 0)
const DARK = rgb(0.15, 0.15, 0.15)
const MID = rgb(0.5, 0.5, 0.5)
const LIGHT_RULE = rgb(0.8, 0.8, 0.8)

function drawText(
  page: PDFPage,
  text: string,
  x: number,
  y: number,
  font: PDFFont,
  size: number,
  color = BLACK,
) {
  page.drawText(text, { x, y, font, size, color })
}

export async function generateMinimalPdf(invoice: Invoice, settings: Settings): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create()
  const page = pdfDoc.addPage([612, 792])
  const { width, height } = page.getSize()

  const bold = await pdfDoc.embedFont(StandardFonts.HelveticaBold)
  const regular = await pdfDoc.embedFont(StandardFonts.Helvetica)
  const oblique = await pdfDoc.embedFont(StandardFonts.HelveticaOblique)

  const margin = 56
  let y = height - margin

  // ── Company block ─────────────────────────────────────────────────────────────
  drawText(page, settings.companyName.toUpperCase(), margin, y, bold, 10, DARK)
  y -= 13
  drawText(page, settings.tagline, margin, y, oblique, 8, MID)
  y -= 11
  drawText(page, `${settings.addressLine1}, ${settings.addressLine2}`, margin, y, regular, 8, MID)
  y -= 11
  drawText(page, `${settings.phone}  |  ${settings.email}`, margin, y, regular, 8, MID)

  // ── Invoice title + meta (right aligned) ─────────────────────────────────────
  const invoiceW = bold.widthOfTextAtSize('INVOICE', 24)
  drawText(page, 'INVOICE', width - margin - invoiceW, height - margin, bold, 24, DARK)

  const metaRows = [
    `Date: ${invoice.date}`,
    `Invoice #: ${invoice.invoiceNumber}`,
    `Customer #: ${invoice.customerId}`,
  ]
  let metaY = height - margin - 32
  metaRows.forEach((row) => {
    const rw = regular.widthOfTextAtSize(row, 8)
    drawText(page, row, width - margin - rw, metaY, regular, 8, MID)
    metaY -= 11
  })

  // ── Horizontal rule ───────────────────────────────────────────────────────────
  y -= 20
  page.drawLine({ start: { x: margin, y }, end: { x: width - margin, y }, thickness: 0.5, color: LIGHT_RULE })
  y -= 16

  // ── Bill To ───────────────────────────────────────────────────────────────────
  drawText(page, 'BILL TO', margin, y, bold, 7, MID)
  y -= 12
  const billLines = invoice.billTo.split('\n')
  billLines.forEach((line) => {
    drawText(page, line, margin, y, regular, 9)
    y -= 12
  })

  // ── Horizontal rule ───────────────────────────────────────────────────────────
  y -= 12
  page.drawLine({ start: { x: margin, y }, end: { x: width - margin, y }, thickness: 0.5, color: LIGHT_RULE })
  y -= 16

  // ── Line items ────────────────────────────────────────────────────────────────
  const tableW = width - margin * 2
  const colQty = margin + tableW * 0.58
  const colUnit = margin + tableW * 0.72
  const colAmt = margin + tableW * 0.87

  // Column headers
  drawText(page, 'DESCRIPTION', margin, y, bold, 7, MID)
  drawText(page, 'QTY', colQty, y, bold, 7, MID)
  drawText(page, 'UNIT PRICE', colUnit, y, bold, 7, MID)
  drawText(page, 'AMOUNT', colAmt, y, bold, 7, MID)
  y -= 4
  page.drawLine({ start: { x: margin, y }, end: { x: width - margin, y }, thickness: 0.3, color: LIGHT_RULE })
  y -= 12

  invoice.lineItems.forEach((item) => {
    const lineTotal = (item.quantity ?? 1) * item.unitPrice
    drawText(page, item.description, margin, y, regular, 9)
    drawText(page, String(item.quantity ?? 1), colQty, y, regular, 9)
    drawText(page, formatCurrency(item.unitPrice), colUnit, y, regular, 9)
    drawText(page, formatCurrency(lineTotal), colAmt, y, regular, 9)
    y -= 14
    page.drawLine({ start: { x: margin, y: y + 2 }, end: { x: width - margin, y: y + 2 }, thickness: 0.2, color: LIGHT_RULE })
  })

  // ── Totals (right-aligned) ────────────────────────────────────────────────────
  y -= 16
  const totalsX = width * 0.6
  const totalsW = width - totalsX - margin

  const totalsRows: [string, string, boolean][] = [
    ['Subtotal', formatCurrency(invoice.subtotal), false],
    [`Tax (${(invoice.taxRate * 100).toFixed(1)}%)`, formatCurrency(invoice.tax), false],
    ['Other', formatCurrency(invoice.other), false],
  ]
  totalsRows.forEach(([label, val]) => {
    const labelW = regular.widthOfTextAtSize(label, 8)
    const valW = regular.widthOfTextAtSize(val, 8)
    drawText(page, label, totalsX + totalsW - labelW - 80, y, regular, 8, MID)
    drawText(page, val, totalsX + totalsW - valW, y, regular, 8)
    y -= 12
  })

  page.drawLine({ start: { x: totalsX, y }, end: { x: width - margin, y }, thickness: 0.5, color: DARK })
  y -= 14
  const totalLabel = 'TOTAL'
  const totalVal = formatCurrency(invoice.total)
  const tlW = bold.widthOfTextAtSize(totalLabel, 10)
  const tvW = bold.widthOfTextAtSize(totalVal, 10)
  drawText(page, totalLabel, totalsX + totalsW - tlW - 80, y, bold, 10)
  drawText(page, totalVal, totalsX + totalsW - tvW, y, bold, 10)

  // ── Comments ──────────────────────────────────────────────────────────────────
  y -= 40
  page.drawLine({ start: { x: margin, y }, end: { x: width - margin, y }, thickness: 0.5, color: LIGHT_RULE })
  y -= 16
  drawText(page, 'NOTES', margin, y, bold, 7, MID)
  y -= 12
  const commentLines = settings.comments.split('\n')
  commentLines.forEach((line) => {
    drawText(page, line, margin, y, regular, 8, DARK)
    y -= 11
  })
  y -= 6
  drawText(page, `Make checks payable to: ${settings.checkPayableTo}`, margin, y, oblique, 8, MID)

  // ── Footer ────────────────────────────────────────────────────────────────────
  const footerY = 36
  page.drawLine({ start: { x: margin, y: footerY + 10 }, end: { x: width - margin, y: footerY + 10 }, thickness: 0.3, color: LIGHT_RULE })
  const footerText = 'Thank You For Your Business!'
  const footerW = oblique.widthOfTextAtSize(footerText, 9)
  drawText(page, footerText, (width - footerW) / 2, footerY, oblique, 9, MID)

  return pdfDoc.save()
}
