"use client";

import { useId, useState } from "react";
import { ChevronDown } from "lucide-react";
import { LANDING_FAQ } from "@/lib/public-copy";

export function LandingFaq() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const faqId = useId();

  return (
    <section id="faq" className="bys-landing-container bys-landing-faq" aria-labelledby="faq-heading">
      <h2 id="faq-heading" className="bys-landing-heading">FAQ</h2>
      <p className="bys-faq-intro">Common questions about BeforeYouSign.</p>
      <div className="bys-faq-surface">
        {LANDING_FAQ.map((item, index) => {
          const isOpen = openIndex === index;
          return (
            <div
              key={item.question}
              className="bys-faq-item border-b border-border/60 last:border-b-0"
              data-open={isOpen}
            >
              <h3>
                <button
                  type="button"
                  id={`${faqId}-question-${index}`}
                  className="bys-faq-trigger"
                  aria-expanded={isOpen}
                  aria-controls={`${faqId}-answer-${index}`}
                  onClick={() => setOpenIndex(isOpen ? null : index)}
                >
                  <span className="font-semibold">{item.question}</span>
                  <ChevronDown
                    className="bys-faq-chevron h-5 w-5 shrink-0 text-muted-foreground"
                    aria-hidden
                  />
                </button>
              </h3>
              <div
                id={`${faqId}-answer-${index}`}
                role="region"
                aria-labelledby={`${faqId}-question-${index}`}
                aria-hidden={!isOpen}
                inert={!isOpen}
                className="bys-faq-answer"
              >
                <div className="bys-faq-answer-content">
                  <p>{item.answer}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
