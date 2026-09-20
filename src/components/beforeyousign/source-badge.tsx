export function SourceBadge({ label }: { label: string }) {
  return (
    <span className="inline-flex shrink-0 rounded-full border border-border/45 bg-secondary px-2 py-0.5 text-[10px] font-medium tracking-wide text-muted-foreground">
      {label}
    </span>
  );
}
