import { PDFDocument, rgb, StandardFonts, type PDFFont, type PDFPage } from 'pdf-lib'
import type { Invoice, Settings } from '../types'
import { formatCurrency } from '../calculations'

const CHARCOAL = rgb(0.18, 0.2, 0.25)
const ACCENT = rgb(0.18, 0.6, 0.5)
const WHITE = rgb(1, 1, 1)
const BLACK = rgb(0.1, 0.1, 0.1)
const LIGHT = rgb(0.96, 0.96, 0.97)
const MID = rgb(0.85, 0.85, 0.88)

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

function drawRect(
  page: PDFPage,
  x: number,
  y: number,
  w: number,
  h: number,
  color: ReturnType<typeof rgb>,
) {
  page.drawRectangle({ x, y, width: w, height: h, color })
}

export async function generateModernPdf(invoice: Invoice, settings: Settings): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create()
  const page = pdfDoc.addPage([612, 792])
  const { width, height } = page.getSize()

  const bold = await pdfDoc.embedFont(StandardFonts.HelveticaBold)
  const regular = await pdfDoc.embedFont(StandardFonts.Helvetica)

  const margin = 48

  // ── Dark header bar ──────────────────────────────────────────────────────────
  const headerH = 80
  drawRect(page, 0, height - headerH, width, headerH, CHARCOAL)

  drawText(page, settings.companyName, margin, height - 30, bold, 16, WHITE)
  drawText(page, settings.tagline, margin, height - 46, regular, 9, MID)

  const invoiceLabel = 'INVOICE'
  const invoiceLabelW = bold.widthOfTextAtSize(invoiceLabel, 22)
  drawText(page, invoiceLabel, width - margin - invoiceLabelW, height - 36, bold, 22, WHITE)

  // ── Meta info row ────────────────────────────────────────────────────────────
  let y = height - headerH - 28
  const colW = (width - margin * 2) / 3

  const metaCols = [
    ['DATE', invoice.date],
    ['INVOICE #', String(invoice.invoiceNumber)],
    ['CUSTOMER #', invoice.customerId],
  ]
  metaCols.forEach(([label, val], i) => {
    const x = margin + i * colW
    drawText(page, label, x, y, bold, 7, ACCENT)
    drawText(page, val, x, y - 14, regular, 10)
  })

  // ── Company + Bill To columns ────────────────────────────────────────────────
  y -= 50
  page.drawLine({ start: { x: margin, y }, end: { x: width - margin, y }, thickness: 1, color: MID })
  y -= 16

  const halfW = (width - margin * 2 - 20) / 2
  const col2X = margin + halfW + 20

  drawText(page, 'FROM', margin, y, bold, 7, ACCENT)
  drawText(page, 'BILL TO', col2X, y, bold, 7, ACCENT)
  y -= 14
  drawText(page, settings.companyName, margin, y, bold, 9)
  const billLines = invoice.billTo.split('\n')
  billLines.forEach((line, i) => {
    drawText(page, line, col2X, y - i * 12, regular, 9)
  })
  y -= 12
  drawText(page, settings.addressLine1, margin, y, regular, 9)
  y -= 12
  drawText(page, settings.addressLine2, margin, y, regular, 9)
  y -= 12
  drawText(page, settings.phone, margin, y, regular, 9)
  y -= 12
  drawText(page, settings.email, margin, y, regular, 9)

  // ── Line items table ──────────────────────────────────────────────────────────
  y -= 36
  page.drawLine({ start: { x: margin, y }, end: { x: width - margin, y }, thickness: 1, color: MID })
  y -= 4

  const tableW = width - margin * 2
  const colDesc = margin
  const colAmt = margin + tableW * 0.75

  // Header row
  drawRect(page, margin, y - 16, tableW, 20, CHARCOAL)
  drawText(page, 'DESCRIPTION', colDesc + 6, y - 11, bold, 8, WHITE)
  drawText(page, 'AMOUNT', colAmt, y - 11, bold, 8, WHITE)
  y -= 16

  invoice.lineItems.forEach((item, i) => {
    const rowColor = i % 2 === 0 ? LIGHT : WHITE
    drawRect(page, margin, y - 14, tableW, 14, rowColor)
    drawText(page, item.description, colDesc + 6, y - 10, regular, 9)
    drawText(page, formatCurrency(item.amount), colAmt, y - 10, regular, 9)
    y -= 14
  })

  // ── Totals ───────────────────────────────────────────────────────────────────
  y -= 16
  const totalsX = width / 2
  const totalsW = width - totalsX - margin

  const totalsRows: [string, string, boolean][] = [
    ['Subtotal', formatCurrency(invoice.subtotal), false],
    ['Other', formatCurrency(invoice.other), false],
  ]
  totalsRows.forEach(([label, val]) => {
    const valW = regular.widthOfTextAtSize(val, 9)
    drawText(page, label, totalsX, y, regular, 9)
    drawText(page, val, totalsX + totalsW - valW, y, regular, 9)
    y -= 14
  })

  // Total accent row
  drawRect(page, totalsX - 4, y - 4, totalsW + 4, 18, ACCENT)
  const totalVal = formatCurrency(invoice.total)
  const totalValW = bold.widthOfTextAtSize(totalVal, 11)
  drawText(page, 'TOTAL', totalsX, y, bold, 11, WHITE)
  drawText(page, totalVal, totalsX + totalsW - totalValW, y, bold, 11, WHITE)
  y -= 14

  // ── Comments + Check payable ──────────────────────────────────────────────────
  y -= 30
  page.drawLine({ start: { x: margin, y }, end: { x: width - margin, y }, thickness: 1, color: MID })
  y -= 16

  drawText(page, 'NOTES', margin, y, bold, 7, ACCENT)
  y -= 12
  const commentLines = settings.comments.split('\n')
  commentLines.forEach((line) => {
    drawText(page, line, margin, y, regular, 8)
    y -= 11
  })

  // ── Footer ────────────────────────────────────────────────────────────────────
  const footerY = 40
  drawRect(page, 0, 0, width, footerY + 10, CHARCOAL)
  const footerText = `Make checks payable to: ${settings.checkPayableTo}  •  Thank You For Your Business!`
  const footerW = regular.widthOfTextAtSize(footerText, 8)
  drawText(page, footerText, (width - footerW) / 2, footerY - 10, regular, 8, MID)

  return pdfDoc.save()
}
