/**
 * Overlay for placeholder blocks: a blurred, darkened scrim over the skeleton
 * content with a badge, so the "coming soon" state reads clearly while the
 * approximate layout stays partially visible underneath. Drop into any
 * `relative` container.
 */
export default function ComingSoonOverlay({
  label = 'Coming soon',
}: {
  label?: string;
}) {
  return (
    <div className="absolute inset-0 z-10 flex items-center justify-center rounded-lg bg-gradient-to-b from-[var(--dark-one)]/40 to-[var(--dark-one)]/80 backdrop-blur-[3px]">
      <span className="space-mono rounded-full border border-[var(--accent-primary)] bg-[var(--dark-two)]/90 px-4 py-1.5 text-xs uppercase tracking-widest text-[var(--accent-primary)] shadow-lg">
        {label}
      </span>
    </div>
  );
}
