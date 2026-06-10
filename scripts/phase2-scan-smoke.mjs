import fs from "fs";
import path from "path";

const samplePath = path.join(process.cwd(), "public", "sample-leases", "standard.txt");
const text = fs.readFileSync(samplePath, "utf8");

const res = await fetch("http://localhost:3000/api/analyze", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ leaseText: text, fileName: "sample-lease.txt" }),
});

const data = await res.json();
if (!res.ok) {
  console.error("API error", res.status, data);
  process.exit(1);
}

const findings = data.texasRenterFindings ?? [];
console.log("texasRenterFindings count:", findings.length);
console.log(JSON.stringify(findings.slice(0, 2), null, 2));
if (!Array.isArray(findings)) {
  console.error("Missing texasRenterFindings array");
  process.exit(1);
}
if (findings.length === 0) {
  console.error("Expected at least one finding on sample lease");
  process.exit(1);
}
