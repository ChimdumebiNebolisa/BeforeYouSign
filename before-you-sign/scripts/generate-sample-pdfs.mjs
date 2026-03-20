import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { PDFDocument, StandardFonts } from "pdf-lib";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.join(__dirname, "..", "public", "samples");

async function writeLeasePdf(fileName, title, bodyLines) {
  const doc = await PDFDocument.create();
  const page = doc.addPage([612, 792]);
  const font = await doc.embedFont(StandardFonts.Helvetica);
  let y = 760;
  page.drawText(title, { x: 50, y, size: 14, font });
  y -= 28;
  for (const line of bodyLines) {
    page.drawText(line, { x: 50, y, size: 11, font });
    y -= 16;
    if (y < 72) break;
  }
  const bytes = await doc.save();
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, fileName), bytes);
}

await writeLeasePdf(
  "lease-standard.pdf",
  "Sample Standard Lease (fixture)",
  [
    "Rent: $1,200 per month, due on the 1st.",
    "Security deposit: $1,200, refundable per state law.",
    "Term: 12 months from the lease start date.",
    "Late fee: $50 after rent is 5 days late.",
    "Utilities: Tenant pays electric and gas; Landlord pays water.",
    "Notice: Either party must give 30 days written notice to end month-to-month.",
  ],
);

await writeLeasePdf(
  "lease-fee-heavy.pdf",
  "Sample Fee-Heavy Lease (fixture)",
  [
    "Base rent: $980 per month.",
    "Administrative fee: $150 at move-in.",
    "Package acceptance fee: $5 per package after the first each month.",
    "Parking: $75 per month per vehicle; $25 guest pass per night.",
    "Pet fee: $40 monthly per pet plus $500 non-refundable per pet.",
    "Cleaning fee at move-out: $250 minimum regardless of condition.",
    "Late rent: 10% of monthly rent after day 3, plus $25 per day thereafter.",
  ],
);

console.log("Wrote sample PDFs to public/samples/");
