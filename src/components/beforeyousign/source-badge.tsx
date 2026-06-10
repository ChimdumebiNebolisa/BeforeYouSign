export function SourceBadge({ label }: { label: string }) {
  return (
    <span className="inline-flex shrink-0 rounded-full border border-[#c5c5d3]/45 bg-[#f7f9fb] px-2 py-0.5 text-[10px] font-medium tracking-wide text-[#505f76]">
      {label}
    </span>
  );
}
