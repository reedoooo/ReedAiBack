const { PDFDocument, StandardFonts, rgb } = require("pdf-lib");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");

async function generatePDF(generatedText) {
  const pdfDoc = await PDFDocument.create();
  const timesRomanFont = await pdfDoc.embedFont(StandardFonts.TimesRoman);
  const page = pdfDoc.addPage([595.28, 841.89]); // A4 size

  const { width, height } = page.getSize();
  const margin = 50;
  let fontSize = 10;
  const minFontSize = 5;
  let lineHeight = fontSize * 1.2;
  const maxLineWidth = width - 2 * margin;

  const drawText = (text, x, y, fontSize, lineHeight, font, color) => {
    page.drawText(text, {
      x: x,
      y: y,
      size: fontSize,
      font: font,
      color: color,
    });
    return y - lineHeight;
  };

  const drawTextWithWrapping = (
    text,
    x,
    y,
    fontSize,
    lineHeight,
    font,
    color
  ) => {
    const words = text.split(" ");
    let line = "";
    let lines = [];

    for (const word of words) {
      if (font.widthOfTextAtSize(line + word, fontSize) > maxLineWidth) {
        lines.push(line.trim());
        line = "";
      }
      line += `${word} `;
    }

    if (line.length > 0) {
      lines.push(line.trim());
    }

    for (let i = 0; i < lines.length; i++) {
      if (y - lineHeight < margin) {
        page.addPage([595.28, 841.89]);
        y = height - margin;
      }
      page.drawText(lines[i], {
        x: x,
        y: y,
        size: fontSize,
        font: font,
        color: color,
      });
      y -= lineHeight;
    }

    return y;
  };

  let yPosition = height - margin;

  // Define the different parts of the cover letter
  const parts = generatedText.split("\n\n");
  const headerSections = parts.slice(0, 3); // Assume first 3 parts are headers that should not wrap
  const bodySections = parts.slice(3); // The rest are body sections

  // Draw header sections without wrapping
  headerSections.forEach((part) => {
    const lines = part.split("\n");
    lines.forEach((line) => {
      yPosition = drawText(
        line,
        margin,
        yPosition,
        fontSize,
        lineHeight,
        timesRomanFont,
        rgb(0, 0.53, 0.71)
      );
    });
    yPosition -= lineHeight; // Add space between parts
  });

  // Draw body sections with wrapping
  bodySections.forEach((part) => {
    yPosition = drawTextWithWrapping(
      part,
      margin,
      yPosition,
      fontSize,
      lineHeight,
      timesRomanFont,
      rgb(0, 0.53, 0.71)
    );
    yPosition -= lineHeight; // Add space between parts
  });

  return await pdfDoc.save();
}
function savePDF(pdfBytes) {
  const uniqueId = crypto.randomBytes(8).toString("hex");
  const pdfDir = path.join(__dirname, "../generated");
  const pdfPath = path.join(pdfDir, `cover_letter_${uniqueId}.pdf`);

  if (!fs.existsSync(pdfDir)) {
    fs.mkdirSync(pdfDir, { recursive: true });
  }

  fs.writeFileSync(pdfPath, pdfBytes);
  return pdfPath;
}
async function loadPDF(pdfPath) {
  const data = fs.readFileSync(pdfPath);
  const pdfDoc = await PDFDocument.load(data);
  const pages = pdfDoc.getPages();
  let text = "";

  pages.forEach((page) => {
    text += page
      .getTextContent()
      .items.map((item) => item.str)
      .join(" ");
  });

  return text;
}

module.exports = {
  generatePDF,
  savePDF,
  loadPDF,
};
