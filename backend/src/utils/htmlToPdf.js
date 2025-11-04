import puppeteer from 'puppeteer';

/**
 * Render HTML to PDF using headless Chrome (Puppeteer)
 * @param {string} html - The full HTML string to render
 * @param {object} options - Optional PDF options
 * @returns {Promise<Buffer>} PDF buffer
 */
export async function htmlToPdf(html, options = {}) {
  const browser = await puppeteer.launch({
    headless: "new",
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  try {
    const page = await browser.newPage();

    // Ensure a basic viewport for consistent layout
    await page.setViewport({ width: 1024, height: 1366, deviceScaleFactor: 1 });

    // Load HTML
    await page.setContent(html, { waitUntil: 'networkidle0' });

    // UC-51: Add watermark if enabled
    if (options.watermark && options.watermark.enabled && options.watermark.text) {
      await page.evaluate((watermarkText) => {
        const watermark = document.createElement('div');
        watermark.textContent = watermarkText;
        watermark.style.cssText = `
          position: fixed;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%) rotate(-45deg);
          font-size: 60px;
          font-weight: bold;
          color: rgba(180, 180, 180, 0.3);
          pointer-events: none;
          z-index: 9999;
          white-space: nowrap;
        `;
        document.body.appendChild(watermark);
      }, options.watermark.text);
    }

    // PDF options
    const pdfOptions = {
      format: 'A4',
      printBackground: true,
      margin: { top: '0.5in', right: '0.5in', bottom: '0.5in', left: '0.5in' },
      ...options,
    };

    const pdfBuffer = await page.pdf(pdfOptions);
    return Buffer.from(pdfBuffer);
  } finally {
    await browser.close();
  }
}
