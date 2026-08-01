/**
 * Minimal stand-in for pages that don't have a real implementation yet, so the
 * nav routes resolve. Replace with the real view when it's built.
 */
export default function PlaceholderView({ title }: { title: string }) {
  return (
    <div className="flex w-full grow flex-col items-center justify-center p-6 text-center">
      <h1 className="text-2xl font-bold text-white">{title}</h1>
      <p className="mt-2 text-sm text-[var(--contrast-three)]">Coming soon.</p>
    </div>
  );
}
