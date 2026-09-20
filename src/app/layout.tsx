import type { Metadata } from "next";
import { Inter, Manrope, Geist_Mono } from "next/font/google";
import "./globals.css";

const impeccableDirectionContract = {
  seed: "pinned-audit-remediation-2026-09-19",
  exemption: "User-pinned audit remediation direction; do not replace with an unrelated seed concept.",
  THESIS:
    "Verified lease evidence leads. The experience is a contract review, not a generic dashboard or carousel.",
  "OWN-WORLD":
    "Neutral paper, ink-navy type, graphite rules, evidence blue, caution amber, restrained radii, and editorial annotations.",
  STORY:
    "Choose a lease and state, run deterministic analysis, review the report first, verify exact source spans, then act or download.",
  "FIRST VIEWPORT":
    "Show completion, a compact receipt, review priority, and the first action. Desktop uses a 3:2 report/source split; mobile stacks report before source.",
  FORM:
    "A user-pinned report-first editorial annotation system with named sections, inline evidence, and explicit full-source navigation.",
  FINISH:
    "unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance",
};

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

const manrope = Manrope({
  variable: "--font-headline",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "BeforeYouSign",
  description:
    "BeforeYouSign helps Texas students and first-time renters understand residential leases before signing.",
  icons: {
    icon: "/logo.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${manrope.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <script
          id="impeccable-direction-contract"
          type="application/json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(impeccableDirectionContract) }}
        />
        {children}
      </body>
    </html>
  );
}
