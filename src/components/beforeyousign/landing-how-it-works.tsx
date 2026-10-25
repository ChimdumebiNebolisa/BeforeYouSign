const STEPS = [
  {
    step: "1",
    title: "Add your lease",
    description: "Upload a PDF, paste text, or try a sample lease.",
  },
  {
    step: "2",
    title: "Review key terms",
    description: "See important costs, deadlines, and responsibilities with plain-language notes.",
  },
  {
    step: "3",
    title: "Prepare your questions",
    description: "Use the notes to understand the lease and know what to ask.",
  },
] as const;

export function LandingHowItWorks() {
  return (
    <section id="how-it-works" className="bys-landing-container bys-process" aria-labelledby="process-heading">
      <p className="bys-landing-label">How it works</p>
      <h2 id="process-heading" className="bys-landing-heading">Three steps from upload to clarity.</h2>
      <ol className="bys-process-list">
        {STEPS.map((item) => (
          <li key={item.step} className="bys-process-step">
            <span className="bys-process-node" aria-hidden="true">
              {item.step}
            </span>
            <div>
              <h3>{item.title}</h3>
              <p>{item.description}</p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
