import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

const PDF_MAGIC = Buffer.from('%PDF', 'utf8');

/**
 * Check if buffer looks like a PDF (starts with %PDF).
 */
export function isPdfBuffer(buffer: Buffer): boolean {
  return buffer.length >= 4 && buffer.subarray(0, 4).equals(PDF_MAGIC);
}

/**
 * Add a DigiLocker-style "VERIFIED" mark to a PDF document.
 * Adds a semi-transparent stamp on each page with "VERIFIED" and date.
 * Returns the modified PDF as a Buffer, or the original buffer if not a PDF / on error.
 */
export async function addVerifiedWatermarkToPdf(buffer: Buffer): Promise<Buffer> {
  if (!isPdfBuffer(buffer)) return buffer;

  try {
    const pdfDoc = await PDFDocument.load(buffer, { ignoreEncryption: true });
    const pages = pdfDoc.getPages();
    const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    const verifiedText = 'VERIFIED';
    const dateText = new Date().toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });

    for (const page of pages) {
      const { width, height } = page.getSize();

      // Stamp position: bottom-right corner, with padding
      const padding = 20;
      const fontSize = 10;
      const lineHeight = fontSize + 4;
      const boxWidth = 120;
      const boxHeight = lineHeight * 2 + 12;
      const x = width - boxWidth - padding;
      const y = padding;

      // Light green background (verified badge style)
      page.drawRectangle({
        x,
        y,
        width: boxWidth,
        height: boxHeight,
        color: rgb(0.85, 1, 0.85),
        borderColor: rgb(0, 0.6, 0),
        borderWidth: 1,
        opacity: 0.95,
      });

      // "VERIFIED" text in green
      page.drawText(verifiedText, {
        x: x + 8,
        y: y + boxHeight - 8 - fontSize,
        size: fontSize,
        font,
        color: rgb(0, 0.5, 0),
      });

      // Date below
      page.drawText(dateText, {
        x: x + 8,
        y: y + 8,
        size: 8,
        font: await pdfDoc.embedFont(StandardFonts.Helvetica),
        color: rgb(0.3, 0.3, 0.3),
      });
    }

    const pdfBytes = await pdfDoc.save();
    return Buffer.from(pdfBytes);
  } catch (err) {
    console.error('[pdf-watermark] Failed to add watermark:', err);
    return buffer;
  }
}
