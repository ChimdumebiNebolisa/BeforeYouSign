"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { LANDING_FAQ } from "@/lib/public-copy";

export function LandingFaq() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section id="faq" className="bys-section-gap scroll-mt-28">
      <h2 className="font-[family-name:var(--font-headline)] text-2xl font-bold text-foreground sm:text-3xl">FAQ</h2>
      <div className="mt-8 divide-y divide-border/60 rounded-2xl border border-border/40 bg-card">
        {LANDING_FAQ.map((item, index) => {
          const isOpen = openIndex === index;
          return (
            <div key={item.question}>
              <button
                type="button"
                className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left sm:px-6"
                aria-expanded={isOpen}
                onClick={() => setOpenIndex(isOpen ? null : index)}
              >
                <span className="font-medium text-foreground">{item.question}</span>
                <ChevronDown
                  className={["h-5 w-5 shrink-0 text-muted-foreground transition-transform", isOpen ? "rotate-180" : ""].join(
                    " ",
                  )}
                  aria-hidden
                />
              </button>
              {isOpen ? (
                <div className="px-5 pb-4 text-sm leading-relaxed text-muted-foreground sm:px-6">{item.answer}</div>
              ) : null}
            </div>
          );
        })}
      </div>
    </section>
  );
}
