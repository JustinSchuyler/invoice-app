import { PDFDocument, rgb, StandardFonts, type PDFFont, type PDFPage } from 'pdf-lib'
import type { Invoice, Settings } from '../types'
import { formatCurrency } from '../calculations'

const BLUE = rgb(0.137, 0.51, 0.824)
const WHITE = rgb(1, 1, 1)
const BLACK = rgb(0, 0, 0)
const LIGHT_GRAY = rgb(0.95, 0.95, 0.95)

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

export async function generateClassicPdf(invoice: Invoice, settings: Settings): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create()
  const page = pdfDoc.addPage([612, 792]) // US Letter
  const { width, height } = page.getSize()

  const bold = await pdfDoc.embedFont(StandardFonts.HelveticaBold)
  const regular = await pdfDoc.embedFont(StandardFonts.Helvetica)
  const oblique = await pdfDoc.embedFont(StandardFonts.HelveticaOblique)

  const margin = 40
  let y = height - margin

  // ── Header ──────────────────────────────────────────────────────────────────
  // Left: Company name
  drawText(page, settings.companyName, margin, y, bold, 18, BLUE)
  y -= 16
  drawText(page, settings.tagline, margin, y, oblique, 10, BLUE)
  y -= 14
  drawText(page, settings.addressLine1, margin, y, regular, 9)
  y -= 12
  drawText(page, settings.addressLine2, margin, y, regular, 9)
  y -= 12
  drawText(page, `Phone: ${settings.phone}`, margin, y, regular, 9)

  // Right: INVOICE box
  const invoiceBoxX = width / 2 + 20
  const invoiceBoxW = width - invoiceBoxX - margin
  const invoiceBoxTopY = height - margin
  drawText(page, 'INVOICE', invoiceBoxX, invoiceBoxTopY, bold, 28, BLUE)

  const boxStartY = invoiceBoxTopY - 16
  const rowH = 18
  const labelX = invoiceBoxX
  const valX = invoiceBoxX + 90

  const headerRows = [
    ['Date:', invoice.date],
    ['Invoice #:', String(invoice.invoiceNumber)],
    ['Customer #:', invoice.customerId],
  ]
  headerRows.forEach(([label, val], i) => {
    const ry = boxStartY - i * rowH
    drawRect(page, labelX, ry - 13, invoiceBoxW, rowH, i % 2 === 0 ? LIGHT_GRAY : WHITE)
    drawText(page, label, labelX + 4, ry - 10, bold, 9)
    drawText(page, val, valX, ry - 10, regular, 9)
  })

  // ── Bill To band ────────────────────────────────────────────────────────────
  const billY = height - margin - 90
  drawRect(page, margin, billY - 14, width - margin * 2, 18, BLUE)
  drawText(page, 'BILL TO:', margin + 4, billY - 10, bold, 10, WHITE)

  const billLines = invoice.billTo.split('\n')
  billLines.forEach((line, i) => {
    drawText(page, line, margin + 4, billY - 28 - i * 13, regular, 9)
  })

  // ── Line Items table ─────────────────────────────────────────────────────────
  const tableTop = billY - 28 - billLines.length * 13 - 20
  const tableW = width - margin * 2
  const colDesc = margin
  const colQty = margin + tableW * 0.55
  const colUnit = margin + tableW * 0.7
  const colAmt = margin + tableW * 0.85

  // Table header
  drawRect(page, margin, tableTop - 14, tableW, 18, BLUE)
  drawText(page, 'DESCRIPTION', colDesc + 4, tableTop - 10, bold, 9, WHITE)
  drawText(page, 'QTY', colQty, tableTop - 10, bold, 9, WHITE)
  drawText(page, 'UNIT PRICE', colUnit, tableTop - 10, bold, 9, WHITE)
  drawText(page, 'AMOUNT', colAmt, tableTop - 10, bold, 9, WHITE)

  let tableY = tableTop - 14
  invoice.lineItems.forEach((item, i) => {
    const rowColor = i % 2 === 0 ? LIGHT_GRAY : WHITE
    drawRect(page, margin, tableY - 14, tableW, 14, rowColor)
    const lineTotal = (item.quantity ?? 1) * item.unitPrice
    drawText(page, item.description, colDesc + 4, tableY - 10, regular, 9)
    drawText(page, String(item.quantity ?? 1), colQty, tableY - 10, regular, 9)
    drawText(page, formatCurrency(item.unitPrice), colUnit, tableY - 10, regular, 9)
    drawText(page, formatCurrency(lineTotal), colAmt, tableY - 10, regular, 9)
    tableY -= 14
  })

  // ── Totals box ──────────────────────────────────────────────────────────────
  const totalsX = width / 2 + 20
  const totalsW = width - totalsX - margin
  let totalsY = tableY - 24

  const totalsRows: [string, string, boolean][] = [
    ['Subtotal:', formatCurrency(invoice.subtotal), false],
    ['Tax Rate:', `${(invoice.taxRate * 100).toFixed(1)}%`, false],
    ['Tax:', formatCurrency(invoice.tax), false],
    ['Other:', formatCurrency(invoice.other), false],
    ['TOTAL:', formatCurrency(invoice.total), true],
  ]

  totalsRows.forEach(([label, val, isBold]) => {
    const rowFont = isBold ? bold : regular
    const rowBg = isBold ? BLUE : WHITE
    const rowFg = isBold ? WHITE : BLACK
    drawRect(page, totalsX, totalsY - 14, totalsW, 16, rowBg)
    drawText(page, label, totalsX + 4, totalsY - 10, rowFont, 9, rowFg)
    const valW = rowFont.widthOfTextAtSize(val, 9)
    drawText(page, val, totalsX + totalsW - valW - 4, totalsY - 10, rowFont, 9, rowFg)
    totalsY -= 16
  })

  // ── Comments box ────────────────────────────────────────────────────────────
  const commentsY = totalsY - 30
  drawRect(page, margin, commentsY - 14, (width - margin * 2) * 0.55, 16, BLUE)
  drawText(page, 'COMMENTS / SPECIAL INSTRUCTIONS', margin + 4, commentsY - 10, bold, 9, WHITE)

  const commentLines = settings.comments.split('\n')
  commentLines.forEach((line, i) => {
    drawText(page, line, margin + 4, commentsY - 28 - i * 13, regular, 8)
  })

  // Check payable to (right side, same level)
  const checkX = totalsX
  drawText(page, 'Make all checks payable to:', checkX, commentsY - 10, regular, 8)
  drawText(page, settings.checkPayableTo, checkX, commentsY - 22, bold, 9, BLUE)

  // ── Footer ──────────────────────────────────────────────────────────────────
  const footerY = margin + 30
  drawRect(page, margin, footerY - 4, width - margin * 2, 1, BLUE)
  const footerText = `${settings.phone}  •  ${settings.email}  •  Thank You For Your Business!`
  const footerW = regular.widthOfTextAtSize(footerText, 9)
  drawText(page, footerText, (width - footerW) / 2, footerY - 16, regular, 9, BLUE)

  return pdfDoc.save()
}
