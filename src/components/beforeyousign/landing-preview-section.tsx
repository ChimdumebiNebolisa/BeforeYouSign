const SAMPLE_CLAUSES = [
  {
    label: "5. Rent",
    excerpt: "Rent is $1,250 per month.",
    continuation: "The tenant shall pay this amount each month during the lease term.",
    question: <>What will I pay<br />each month?</>,
    tone: "yellow",
  },
  {
    label: "8. Late fees",
    excerpt: "A $75 late fee applies after five days.",
    continuation: "If rent is more than five days late, a late fee of $75 will be assessed.",
    question: <>When do late<br />fees start?</>,
    tone: "purple",
  },
  {
    label: "12. Move-out notice",
    excerpt: "Give 30 days’ written notice before moving out.",
    continuation: "The tenant must give written notice at least 30 days before moving out.",
    question: <>When must I<br />give notice?</>,
    tone: "blue",
  },
] as const;

export function LandingPreviewSection() {
  return (
    <section className="bys-sample-section" aria-labelledby="sample-preview-heading">
      <div className="bys-landing-container bys-sample-layout">
        <div className="bys-sample-intro">
          <h2 id="sample-preview-heading" className="bys-landing-heading">See what it finds.</h2>
          <p className="bys-sample-description">
            BeforeYouSign highlights common areas that affect your costs, deadlines, and responsibilities. It shows
            the exact lease language so you can prepare questions.
          </p>
          <p className="bys-sample-disclosure">These are illustrative examples, not a review of your lease.</p>
        </div>

        <article className="bys-sample-sheet" aria-label="Illustrative residential lease with questions">
          <svg className="bys-sample-paperclip" viewBox="0 0 32 76" fill="none" aria-hidden="true">
            <path d="M24 22V12a9 9 0 0 0-18 0v47a8 8 0 0 0 16 0V28a5 5 0 0 0-10 0v29" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
          </svg>
          <h3 className="bys-sample-title">Sample Residential Lease Agreement</h3>
          <div>
            {SAMPLE_CLAUSES.map((clause) => (
              <section key={clause.label} className={`bys-sample-row bys-sample-${clause.tone}`}>
                <div className="bys-sample-clause">
                  <h4>{clause.label}</h4>
                  <p className="bys-sample-excerpt"><mark>{clause.excerpt}</mark></p>
                  <p className="bys-sample-continuation">{clause.continuation}</p>
                </div>
                <svg className="bys-sample-connector" viewBox="0 0 80 32" fill="none" aria-hidden="true">
                  <path d="M2 24Q37 2 76 20M68 12L76 20L65 22" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <aside className="bys-sample-note" aria-label="Question to ask"><p>{clause.question}</p></aside>
              </section>
            ))}
          </div>
        </article>
      </div>
    </section>
  );
}
