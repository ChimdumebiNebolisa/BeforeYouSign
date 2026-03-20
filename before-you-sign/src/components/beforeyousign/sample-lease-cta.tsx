"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

const SAMPLE_LEASE_TEXT = `Rent: $1,200 per month.
Security deposit: $1,200.
Late fees: $50 after 5 days of late rent.
Term: 12 months beginning on the move-in date.
Automatic renewal: Month-to-month renewal unless either party gives at least 60 days' written notice before the end of the term.
Notice period: Tenant must provide 60 days' written notice for termination.
Utilities: Tenant is responsible for electricity and gas.
Maintenance: Tenant maintains cleanliness and minor repairs; Landlord maintains major structural repairs.
Landlord entry: Landlord may enter with reasonable notice (generally 24 hours) for repairs or inspections.`;

export function SampleLeaseCta() {
  const [isOpen, setIsOpen] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);

  return (
    <>
      <Button
        variant="outline"
        className="mt-3 w-full rounded-full border-slate-200/70 bg-white/40 hover:bg-white/60"
        onClick={() => setIsOpen(true)}
      >
        Try Sample Lease
      </Button>

      {hasLoaded ? (
        <p className="mt-3 text-sm text-slate-700">Sample lease text loaded.</p>
      ) : null}

      {isOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-2xl rounded-2xl border border-slate-200/60 bg-white/90 p-4 shadow-lg backdrop-blur">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-base font-semibold text-slate-900">Sample Lease Text</h2>
                <p className="mt-1 text-sm text-slate-600">You can use this text for analysis.</p>
              </div>
              <button
                type="button"
                className="rounded-full px-3 py-1 text-sm font-medium text-slate-700 hover:bg-slate-100"
                onClick={() => setIsOpen(false)}
              >
                Close
              </button>
            </div>

            <textarea
              readOnly
              value={SAMPLE_LEASE_TEXT}
              className="mt-4 h-56 w-full resize-none rounded-xl border border-slate-200/70 bg-white/70 p-3 text-sm text-slate-900 outline-none"
            />

            <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:justify-end">
              <Button
                className="w-full rounded-full sm:w-auto"
                onClick={() => {
                  setHasLoaded(true);
                  setIsOpen(false);
                }}
              >
                Use Sample Text
              </Button>
              <Button
                variant="outline"
                className="w-full rounded-full border-slate-200/70 bg-white/40 hover:bg-white/60 sm:w-auto"
                onClick={() => setIsOpen(false)}
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

