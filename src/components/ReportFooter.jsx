import React from "react";

/**
 * ReportFooter Component
 * Reusable footer component for test reports
 * @param {Object} props
 * @param {string|Date} props.createdAt - The creation date of the report
 */
export default function ReportFooter({ createdAt }) {
  const generatedDate = new Date(createdAt || Date.now()).toLocaleString();

  return (
    <div className="test-report-footer">
      <p>Generated on {generatedDate}</p>
      <p>Strengths Compass - Confidential Report</p>
      <p className="mt-4 font-bold">Disclaimer:</p>
      <p>
        You have consented and taken this assessment for personal development
        purposes only. You understand results are not diagnostic, medical, or
        clinical, and represent self-reported tendencies. These results may be
        influenced by context, mood, and self‑perception. Use them as a
        starting point for reflection and coaching, not as a definitive
        judgment. For mental health or medical concerns, consult a qualified
        professional.
      </p>

      <p className="mt-4">
        For any queries regarding the report, please send an email to:{" "}
        <a
          href="mailto:guide@axiscompass.in"
          style={{
            color: "#2563eb",
            textDecoration: "underline",
          }}
        >
          guide@axiscompass.in
        </a>
      </p>
    </div>
  );
}

/**
 * Helper function to add footer content to PDF using jsPDF
 * @param {Object} doc - jsPDF document instance
 * @param {string|Date} createdAt - The creation date of the report
 * @param {Object} options - Additional options
 * @param {Array} options.textColor - RGB array for text color [r, g, b]
 * @param {Array} options.grayColor - RGB array for gray color [r, g, b]
 * @param {number} options.pageHeight - Page height in mm (default: 297 for A4)
 * @param {number} options.bottomMargin - Bottom margin in mm (default: 30)
 * @param {number} options.startY - Starting Y position in mm (optional, defaults to calculated position)
 */
export function addFooterToPDF(doc, createdAt, options = {}) {
  const {
    textColor = [51, 51, 51],
    grayColor = [128, 128, 128],
    pageHeight = 297,
    bottomMargin = 30,
    startY = null,
  } = options;

  const pageCount = doc.internal.pages.length - 1;
  // Set to last page
  doc.setPage(pageCount);
  
  // Check if we have enough space on current page (need ~60mm for disclaimer section)
  let footerY = startY !== null ? startY : (pageHeight - bottomMargin);
  
  if (footerY > pageHeight - 60) {
    // Not enough space, add a new page
    doc.addPage();
    footerY = 20;
    const newPageCount = doc.internal.pages.length - 1;
    // Update page numbers
    for (let i = 1; i <= newPageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(grayColor[0], grayColor[1], grayColor[2]);
      doc.text(`Page ${i} of ${newPageCount}`, 105, 295, {
        align: "center",
      });
    }
    doc.setPage(newPageCount);
  }
  
  // Start from a consistent position for disclaimer section
  footerY = Math.max(footerY, 20);

  // Add generation date at the very top (smaller, lighter gray)
  doc.setFontSize(7);
  doc.setFont(undefined, "normal");
  doc.setTextColor(grayColor[0], grayColor[1], grayColor[2]);
  doc.text(
    `Generated on ${new Date(createdAt || Date.now()).toLocaleString()}`,
    105,
    footerY,
    { align: "center" }
  );
  footerY += 8;

  // Add "Strengths Compass - Confidential Report" title (larger than date, smaller than Disclaimer heading, bold)
  doc.setFontSize(11);
  doc.setFont(undefined, "bold");
  doc.setTextColor(textColor[0], textColor[1], textColor[2]);
  doc.text("Strengths Compass - Confidential Report", 105, footerY, {
    align: "center",
  });
  footerY += 10;

  // Add Disclaimer heading (bold, centered, larger than title)
  doc.setFontSize(12);
  doc.setFont(undefined, "bold");
  doc.setTextColor(textColor[0], textColor[1], textColor[2]);
  doc.text("Disclaimer:", 105, footerY, { align: "center" });
  footerY += 8;

  // Add Disclaimer text (left-aligned within a centered block, smaller, lighter gray)
  doc.setFontSize(8);
  doc.setFont(undefined, "normal");
  doc.setTextColor(grayColor[0], grayColor[1], grayColor[2]);
  const disclaimerText =
    "You have consented and taken this assessment for personal development purposes only. " +
    "You understand results are not diagnostic, medical, or clinical, and represent self reported tendencies. " +
    "These results may be influenced by context, mood, and self perception. " +
    "Use them as a starting point for reflection and coaching, not as a definitive judgment. " +
    "For mental health or medical concerns, consult a qualified professional.";

  // Create a centered text block with left-aligned text inside
  // The block should be narrower than the full page width
  const textBlockWidth = 170; // Width of the centered text block in mm
  const textBlockLeft = (210 - textBlockWidth) / 2; // Center the block on the page

  // Use splitTextToSize to break text into lines that fit the width
  const disclaimerLines = doc.splitTextToSize(disclaimerText, textBlockWidth);

  disclaimerLines.forEach((line) => {
    if (footerY > pageHeight - 20) {
      // If we're running out of space, add a new page
      doc.addPage();
      footerY = 20;
      const newPageCount = doc.internal.pages.length - 1;
      // Update page numbers
      for (let i = 1; i <= newPageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(grayColor[0], grayColor[1], grayColor[2]);
        doc.text(`Page ${i} of ${newPageCount}`, 105, 295, {
          align: "center",
        });
      }
      doc.setPage(newPageCount);
    }

    // Left-align each line by using the x position directly without align option
    // This ensures proper left alignment within the centered block
    doc.text(line.trim(), textBlockLeft, footerY);
    footerY += 4.5;
  });

  // Add email contact info at the bottom
  footerY += 8;
  doc.setFontSize(7);
  doc.setFont(undefined, "normal");
  doc.setTextColor(grayColor[0], grayColor[1], grayColor[2]);

  // Split the text to make email bold
  const emailPrefix =
    "For any queries regarding the report, please send an email to: ";
  const emailAddress = "guide@axiscompass.in";

  // Calculate the width of the prefix text
  const prefixWidth = doc.getTextWidth(emailPrefix);

  // Calculate starting position to center the entire text
  const fullTextWidth = doc.getTextWidth(emailPrefix + emailAddress);
  const startX = (210 - fullTextWidth) / 2;

  // Draw the prefix text
  doc.text(emailPrefix, startX, footerY);

  // Draw the email address in bold
  doc.setFont(undefined, "bold");
  doc.text(emailAddress, startX + prefixWidth, footerY);

  // Update page numbers on all pages (get final page count after any new pages were added)
  const finalPageCount = doc.internal.pages.length - 1;
  for (let i = 1; i <= finalPageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(grayColor[0], grayColor[1], grayColor[2]);
    doc.text(`Page ${i} of ${finalPageCount}`, 105, 295, {
      align: "center",
    });
  }
  doc.setPage(finalPageCount);
}

/**
 * Helper function to add footer to every page of PDF
 * This adds the full footer content (disclaimer, email, etc.) to all pages
 * @param {Object} doc - jsPDF document instance
 * @param {string|Date} createdAt - The creation date of the report
 * @param {Object} options - Additional options
 * @param {Array} options.textColor - RGB array for text color [r, g, b]
 * @param {Array} options.grayColor - RGB array for gray color [r, g, b]
 * @param {number} options.pageHeight - Page height in mm (default: 297 for A4)
 */
export function addFooterToEveryPage(doc, createdAt, options = {}) {
  const {
    textColor = [51, 51, 51],
    grayColor = [128, 128, 128],
    pageHeight = 297,
  } = options;

  const pageCount = doc.internal.pages.length - 1;
  const generatedDate = new Date(createdAt || Date.now()).toLocaleString();

  // Add footer to every page
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    
    // Start footer from bottom of page - compact version
    let footerY = pageHeight - 45; // Reserve space for footer content
    
    // Draw a subtle line above footer
    doc.setDrawColor(grayColor[0], grayColor[1], grayColor[2]);
    doc.setLineWidth(0.2);
    doc.line(20, footerY - 2, 190, footerY - 2);

    // Add generation date (smaller, lighter gray)
    doc.setFontSize(6);
    doc.setFont(undefined, "normal");
    doc.setTextColor(grayColor[0], grayColor[1], grayColor[2]);
    doc.text(`Generated on ${generatedDate}`, 105, footerY, {
      align: "center",
    });
    footerY += 4;

    // Add "Strengths Compass - Confidential Report" title (bold)
    doc.setFontSize(8);
    doc.setFont(undefined, "bold");
    doc.setTextColor(textColor[0], textColor[1], textColor[2]);
    doc.text("Strengths Compass - Confidential Report", 105, footerY, {
      align: "center",
    });
    footerY += 5;

    // Add Disclaimer heading (bold, centered)
    doc.setFontSize(7);
    doc.setFont(undefined, "bold");
    doc.setTextColor(textColor[0], textColor[1], textColor[2]);
    doc.text("Disclaimer:", 105, footerY, { align: "center" });
    footerY += 4;

    // Add Disclaimer text (compact, smaller font)
    doc.setFontSize(5.5);
    doc.setFont(undefined, "normal");
    doc.setTextColor(grayColor[0], grayColor[1], grayColor[2]);
    const disclaimerText =
      "You have consented and taken this assessment for personal development purposes only. " +
      "You understand results are not diagnostic, medical, or clinical, and represent self reported tendencies. " +
      "These results may be influenced by context, mood, and self perception. " +
      "Use them as a starting point for reflection and coaching, not as a definitive judgment. " +
      "For mental health or medical concerns, consult a qualified professional.";

    const textBlockWidth = 180;
    const textBlockLeft = (210 - textBlockWidth) / 2;
    const disclaimerLines = doc.splitTextToSize(disclaimerText, textBlockWidth);

    disclaimerLines.forEach((line) => {
      if (footerY > pageHeight - 12) {
        // If running out of space, just add page number and skip rest
        footerY = pageHeight - 8;
        return;
      }
      doc.text(line.trim(), textBlockLeft, footerY);
      footerY += 3;
    });

    // Add email contact info
    if (footerY < pageHeight - 8) {
      footerY += 2;
      doc.setFontSize(5.5);
      doc.setFont(undefined, "normal");
      doc.setTextColor(grayColor[0], grayColor[1], grayColor[2]);
      
      const emailPrefix = "For any queries regarding the report, please send an email to: ";
      const emailAddress = "guide@axiscompass.in";
      
      const prefixWidth = doc.getTextWidth(emailPrefix);
      const fullTextWidth = doc.getTextWidth(emailPrefix + emailAddress);
      const startX = (210 - fullTextWidth) / 2;
      
      doc.text(emailPrefix, startX, footerY);
      doc.setFont(undefined, "bold");
      doc.text(emailAddress, startX + prefixWidth, footerY);
      footerY += 3;
    }

    // Add page number at the very bottom
    doc.setFontSize(7);
    doc.setFont(undefined, "normal");
    doc.setTextColor(grayColor[0], grayColor[1], grayColor[2]);
    doc.text(`Page ${i} of ${pageCount}`, 105, pageHeight - 3, {
      align: "center",
    });
  }
}

