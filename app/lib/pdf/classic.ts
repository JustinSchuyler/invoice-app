import { PDFDocument, rgb, StandardFonts, type PDFFont, type PDFPage } from 'pdf-lib'
import type { Invoice, Settings } from '../types'
import { formatCurrency } from '../calculations'

const BLUE = rgb(0.137, 0.51, 0.824)
const WHITE = rgb(1, 1, 1)
const DARK = rgb(0.1, 0.1, 0.1)
const LIGHT_GRAY = rgb(0.94, 0.94, 0.94)
const TOTAL_BLUE = rgb(0.8, 0.9, 0.97)   // light blue highlight for TOTAL row
const BORDER_COLOR = rgb(0.72, 0.72, 0.72)

function text(
  page: PDFPage,
  str: string,
  x: number,
  y: number,
  font: PDFFont,
  size: number,
  color = DARK,
) {
  page.drawText(str, { x, y, font, size, color })
}

// Right-align a string so its right edge lands at `rightX`
function textRight(
  page: PDFPage,
  str: string,
  rightX: number,
  y: number,
  font: PDFFont,
  size: number,
  color = DARK,
) {
  const w = font.widthOfTextAtSize(str, size)
  page.drawText(str, { x: rightX - w, y, font, size, color })
}

// Center a string horizontally within [x, x+w]
function textCenter(
  page: PDFPage,
  str: string,
  x: number,
  w: number,
  y: number,
  font: PDFFont,
  size: number,
  color = DARK,
) {
  const strW = font.widthOfTextAtSize(str, size)
  page.drawText(str, { x: x + (w - strW) / 2, y, font, size, color })
}

function rect(
  page: PDFPage,
  x: number,
  y: number,
  w: number,
  h: number,
  fillColor: ReturnType<typeof rgb>,
  borderColor?: ReturnType<typeof rgb>,
  borderWidth = 0.5,
) {
  page.drawRectangle({
    x, y, width: w, height: h,
    color: fillColor,
    ...(borderColor ? { borderColor, borderWidth } : {}),
  })
}

// Draw only a border (no fill) — used to overlay borders on top of filled rows
function border(
  page: PDFPage,
  x: number,
  y: number,
  w: number,
  h: number,
  color = BORDER_COLOR,
  lineWidth = 0.5,
) {
  page.drawRectangle({
    x, y, width: w, height: h,
    color: rgb(0, 0, 0),
    opacity: 0,
    borderColor: color,
    borderWidth: lineWidth,
    borderOpacity: 1,
  })
}

function hline(
  page: PDFPage,
  x1: number,
  x2: number,
  y: number,
  color = BORDER_COLOR,
  thickness = 0.5,
) {
  page.drawLine({ start: { x: x1, y }, end: { x: x2, y }, thickness, color })
}

export async function generateClassicPdf(invoice: Invoice, settings: Settings): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create()
  const page = pdfDoc.addPage([612, 792]) // US Letter
  const { width, height } = page.getSize()

  const bold = await pdfDoc.embedFont(StandardFonts.HelveticaBold)
  const regular = await pdfDoc.embedFont(StandardFonts.Helvetica)
  const boldOblique = await pdfDoc.embedFont(StandardFonts.HelveticaBoldOblique)

  const margin = 50
  const contentW = width - margin * 2  // 512

  // ── LEFT HEADER: Company info ────────────────────────────────────────────────
  let leftY = height - margin  // baseline of first line

  text(page, settings.companyName, margin, leftY, bold, 20, BLUE)
  leftY -= 15
  text(page, settings.tagline, margin, leftY, regular, 10, DARK)
  leftY -= 18   // extra gap before address
  text(page, settings.addressLine1, margin, leftY, regular, 9)
  leftY -= 13
  text(page, settings.addressLine2, margin, leftY, regular, 9)
  leftY -= 13
  text(page, settings.phone, margin, leftY, regular, 9)
  // leftY is now the baseline of the phone number

  // ── RIGHT HEADER: "INVOICE" + info table ────────────────────────────────────
  const invoiceSize = 22
  textRight(page, 'INVOICE', width - margin, height - margin, bold, invoiceSize, BLUE)

  // Info table: 2-column bordered cells
  const infoTableW = 210
  const infoLabelW = 90
  const infoValueW = infoTableW - infoLabelW
  const infoTableLeft = width - margin - infoTableW
  const infoRowH = 18
  const infoTableTop = height - margin - invoiceSize - 6  // just below "INVOICE" text

  const infoRows: [string, string][] = [
    ['DATE:', invoice.date],
    ['INVOICE #:', String(invoice.invoiceNumber)],
    ['CUSTOMER ID:', invoice.customerId],
  ]

  infoRows.forEach(([label, value], i) => {
    const rowBottom = infoTableTop - (i + 1) * infoRowH
    // Label cell (light gray fill)
    rect(page, infoTableLeft, rowBottom, infoLabelW, infoRowH, LIGHT_GRAY, BORDER_COLOR)
    // Value cell (white fill)
    rect(page, infoTableLeft + infoLabelW, rowBottom, infoValueW, infoRowH, WHITE, BORDER_COLOR)
    // Text baseline: bottom of cell + ~5px offset
    const textY = rowBottom + 5
    text(page, label, infoTableLeft + 5, textY, bold, 8)
    textRight(page, value, infoTableLeft + infoTableW - 5, textY, regular, 9)
  })

  // Bottom of the right-side info table
  const infoTableBottom = infoTableTop - infoRows.length * infoRowH

  // ── Determine Y to start next section ────────────────────────────────────────
  // Use the lower of the two header columns, plus a gap
  const headerBottom = Math.min(leftY, infoTableBottom)
  let y = headerBottom - 18

  // ── BILL TO band (partial width) ─────────────────────────────────────────────
  const billBandW = 240
  const billBandH = 17
  rect(page, margin, y - billBandH, billBandW, billBandH, BLUE)
  text(page, 'BILL TO:', margin + 5, y - billBandH + 5, bold, 9, WHITE)
  y -= billBandH

  const billLines = invoice.billTo.split('\n')
  billLines.forEach((line) => {
    y -= 13
    text(page, line, margin + 2, y, regular, 9)
  })

  // ── LINE ITEMS TABLE ──────────────────────────────────────────────────────────
  y -= 20

  const rowH = 16
  const headerH = 18

  // Column X positions (left edge of each column)
  const colDescX = margin
  const colQtyX = margin + Math.round(contentW * 0.57)
  const colUnitX = margin + Math.round(contentW * 0.70)
  const colAmtX = margin + Math.round(contentW * 0.84)
  const tableRight = margin + contentW

  // Header row
  rect(page, margin, y - headerH, contentW, headerH, BLUE)
  text(page, 'DESCRIPTION', colDescX + 5, y - headerH + 5, bold, 9, WHITE)
  textCenter(page, 'QTY', colQtyX, colUnitX - colQtyX, y - headerH + 5, bold, 9, WHITE)
  textCenter(page, 'UNIT PRICE', colUnitX, colAmtX - colUnitX, y - headerH + 5, bold, 9, WHITE)
  textCenter(page, 'AMOUNT', colAmtX, tableRight - colAmtX, y - headerH + 5, bold, 9, WHITE)
  y -= headerH

  const tableBodyTop = y  // top of first data row

  invoice.lineItems.forEach((item, i) => {
    const fillColor = i % 2 === 0 ? LIGHT_GRAY : WHITE
    rect(page, margin, y - rowH, contentW, rowH, fillColor)

    const lineTotal = (item.quantity ?? 1) * item.unitPrice
    const textY = y - rowH + 5

    text(page, item.description, colDescX + 5, textY, regular, 9)

    const qtyStr = String(item.quantity ?? 1)
    textCenter(page, qtyStr, colQtyX, colUnitX - colQtyX, textY, regular, 9)

    textCenter(page, formatCurrency(item.unitPrice), colUnitX, colAmtX - colUnitX, textY, regular, 9)

    textRight(page, formatCurrency(lineTotal), tableRight - 5, textY, regular, 9)

    y -= rowH
  })

  // Border around entire table (overlay on top of row fills)
  border(page, margin, y, contentW, tableBodyTop - y + headerH)

  // Vertical column dividers
  const dividerTop = tableBodyTop + headerH  // top of header
  const dividerBottom = y
  ;[colQtyX, colUnitX, colAmtX].forEach(cx => {
    hline(page, cx, cx, dividerTop, BORDER_COLOR, 0.4)  // vertical via drawLine
    page.drawLine({
      start: { x: cx, y: dividerBottom },
      end: { x: cx, y: dividerTop },
      thickness: 0.4,
      color: BORDER_COLOR,
    })
  })

  // ── TOTALS (right-aligned block) ─────────────────────────────────────────────
  const totalsW = 210
  const totalsLeft = width - margin - totalsW
  const totalsRowH = 16
  let totalsY = y - 16

  const totalsRows: Array<[string, string, boolean]> = [
    ['SUBTOTAL', formatCurrency(invoice.subtotal), false],
    ['TAX RATE', `${(invoice.taxRate * 100).toFixed(3)}%`, false],
    ['TAX', formatCurrency(invoice.tax), false],
    ['OTHER', formatCurrency(invoice.other), false],
    ['TOTAL', formatCurrency(invoice.total), true],
  ]

  totalsRows.forEach(([label, value, isTotal]) => {
    const rowBottom = totalsY - totalsRowH
    const fillColor = isTotal ? TOTAL_BLUE : WHITE
    const labelFont = isTotal ? bold : regular
    const valueFont = isTotal ? bold : regular

    rect(page, totalsLeft, rowBottom, totalsW, totalsRowH, fillColor, BORDER_COLOR)
    text(page, label, totalsLeft + 6, rowBottom + 5, labelFont, 9)
    textRight(page, value, totalsLeft + totalsW - 6, rowBottom + 5, valueFont, 9)

    totalsY -= totalsRowH
  })

  // ── COMMENTS + CHECK PAYABLE (side by side) ───────────────────────────────────
  const sectionTop = totalsY - 20

  // Left: "OTHER COMMENTS" block
  const commentsW = totalsLeft - margin - 14  // leaves gap before totals column
  const commentsBandH = 17

  rect(page, margin, sectionTop - commentsBandH, commentsW, commentsBandH, BLUE)
  text(page, 'OTHER COMMENTS', margin + 5, sectionTop - commentsBandH + 5, bold, 9, WHITE)

  const commentLines = settings.comments.split('\n')
  const commentsBoxH = commentLines.length * 13 + 14
  rect(page, margin, sectionTop - commentsBandH - commentsBoxH, commentsW, commentsBoxH, WHITE, BORDER_COLOR)

  commentLines.forEach((line, i) => {
    text(page, line, margin + 5, sectionTop - commentsBandH - 12 - i * 13, regular, 9)
  })

  // Right: Make all checks payable to
  const payableX = totalsLeft
  const payableY = sectionTop - commentsBandH + 5
  text(page, 'Make all checks payable to', payableX, payableY, regular, 8)
  text(page, settings.checkPayableTo, payableX, payableY - 14, bold, 10, BLUE)

  // ── FOOTER ────────────────────────────────────────────────────────────────────
  const footerY = margin + 48
  hline(page, margin, width - margin, footerY + 12, BORDER_COLOR, 0.5)

  const footerLine1 = 'If you have any questions about this invoice, please contact'
  const footerLine2 = settings.companyName
  const footerLine3 = settings.email
  const footerLine4 = 'Thank You For Your Business!'

  const fSize = 9
  const fBoldSize = 10

  textCenter(page, footerLine1, 0, width, footerY, regular, fSize)
  textCenter(page, footerLine2, 0, width, footerY - 13, regular, fSize)
  textCenter(page, footerLine3, 0, width, footerY - 26, regular, fSize)
  textCenter(page, footerLine4, 0, width, footerY - 41, boldOblique, fBoldSize)

  return pdfDoc.save()
}
