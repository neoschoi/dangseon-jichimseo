const { PDFDocument, rgb, StandardFonts } = require('pdf-lib');
const fs = require('fs');
const path = require('path');

async function createSamplePdf() {
  const pdfDoc = await PDFDocument.create();
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);

  const pagesData = [
    {
      title: "2026 ELECTION STRATEGY MANUAL",
      subtitle: "Sample PDF for Verification Testing",
      badge: "COVER PAGE - 01",
      body: [
        "Welcome to the E-Book Reader PDF Engine Test.",
        "This document verifies the new dynamic PDF loading feature.",
        "Testing responsive spread layout, thumbnail generation, and navigation."
      ]
    },
    {
      title: "TABLE OF CONTENTS",
      subtitle: "Chapter Outline & Key Metrics",
      badge: "CONTENTS - 02",
      body: [
        "Chapter 1. Demographic & Voter Sentiment Analysis (p. 3)",
        "Chapter 2. Ground Campaign System & Legal Rules (p. 4)",
        "Chapter 3. Digital Messaging & Media Strategy (p. 5)",
        "Appendix: Election Law Compliance Check"
      ]
    },
    {
      title: "CHAPTER 1. VOTER SENTIMENT",
      subtitle: "Polling Methodology & Turnout Projections",
      badge: "CHAPTER 01 - 03",
      body: [
        "1. Analysis of voter movement across major metropolitan districts.",
        "2. Swing voter distribution among 20s and 30s demographic cohorts.",
        "3. Comparison of telephone interview vs mobile web polling accuracy.",
        "4. Key strategic takeaway: early engagement determines margin of victory."
      ]
    },
    {
      title: "CHAPTER 2. CAMPAIGN EXECUTION",
      subtitle: "Field Operations & Volunteer Mobilization",
      badge: "CHAPTER 02 - 04",
      body: [
        "1. Building agile campaign committees with verified milestones.",
        "2. Resource allocation guidelines for the final 60 days.",
        "3. Real-time feedback loops between field staff and central strategy.",
        "4. Risk management: strict adherence to public election statutes."
      ]
    },
    {
      title: "CONCLUSION & ACTION PLAN",
      subtitle: "Summary of Winning Frameworks",
      badge: "CONCLUSION - 05",
      body: [
        "The winning formula combines data discipline with resonant messaging.",
        "PDF Engine verification complete: all 5 spreads parsed accurately.",
        "Seamless integration with 3D Flipbook, Bookmarks, and Notes."
      ]
    }
  ];

  for (let i = 0; i < pagesData.length; i++) {
    const data = pagesData[i];
    // Standard A4: 595.28 x 841.89
    const page = pdfDoc.addPage([595, 842]);
    const { width, height } = page.getSize();

    // Background styling
    page.drawRectangle({
      x: 0,
      y: 0,
      width,
      height,
      color: i === 0 ? rgb(0.08, 0.12, 0.22) : rgb(0.98, 0.98, 0.97)
    });

    // Decorative header border
    page.drawRectangle({
      x: 40,
      y: height - 60,
      width: width - 80,
      height: 3,
      color: i === 0 ? rgb(0.25, 0.55, 0.95) : rgb(0.2, 0.45, 0.85)
    });

    // Badge
    page.drawText(data.badge, {
      x: 45,
      y: height - 50,
      size: 10,
      font: fontBold,
      color: i === 0 ? rgb(0.4, 0.7, 1.0) : rgb(0.3, 0.5, 0.8)
    });

    // Title
    page.drawText(data.title, {
      x: 45,
      y: height - 120,
      size: 22,
      font: fontBold,
      color: i === 0 ? rgb(1, 1, 1) : rgb(0.1, 0.1, 0.15)
    });

    // Subtitle
    page.drawText(data.subtitle, {
      x: 45,
      y: height - 150,
      size: 13,
      font: fontRegular,
      color: i === 0 ? rgb(0.7, 0.8, 0.95) : rgb(0.4, 0.45, 0.55)
    });

    // Body lines
    let yPos = height - 230;
    for (const line of data.body) {
      page.drawText(`- ${line}`, {
        x: 50,
        y: yPos,
        size: 11,
        font: fontRegular,
        color: i === 0 ? rgb(0.85, 0.9, 0.95) : rgb(0.2, 0.2, 0.25)
      });
      yPos -= 32;
    }

    // Page footer
    page.drawText(`Page ${i + 1} of ${pagesData.length}`, {
      x: width / 2 - 30,
      y: 35,
      size: 10,
      font: fontRegular,
      color: i === 0 ? rgb(0.5, 0.6, 0.7) : rgb(0.5, 0.5, 0.55)
    });
  }

  const pdfBytes = await pdfDoc.save();
  const outPath = path.join(__dirname, '..', 'public', 'sample_election_guide.pdf');
  fs.writeFileSync(outPath, pdfBytes);
  console.log('✅ 샘플 PDF 생성 완료:', outPath, `(${pdfBytes.length} bytes)`);
}

createSamplePdf().catch(console.error);
