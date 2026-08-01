import ComingSoonOverlay from './ComingSoonOverlay';

// Placeholder: label + fill width (%) for each muscle-balance row.
const GROUPS = [
  { label: 'Legs', fill: 28 },
  { label: 'Chest', fill: 24 },
  { label: 'Back', fill: 22 },
  { label: 'Arms', fill: 14 },
  { label: 'Shoulders', fill: 12 },
];

export default function MuscleAnalysisBlock() {
  return (
    <section className="relative rounded-lg border border-[var(--contrast-one)] bg-[var(--dark-one)] px-8 py-6 text-white">
      <ComingSoonOverlay />
      <div className="flex items-start justify-between">
        <p className="space-mono text-xs text-[var(--contrast-three)]">
          MUSCLE BALANCE
        </p>
      </div>

      <div className="mt-5 flex flex-col gap-4">
        {GROUPS.map((group) => (
          <div key={group.label}>
            <div className="flex items-center justify-between text-sm">
              <span className="text-white/90">{group.label}</span>
              <span className="text-[var(--contrast-three)]">{group.fill}%</span>
            </div>
            <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-[var(--dark-three)]">
              <div
                className="h-full rounded-full bg-[var(--accent-primary)]"
                style={{ width: `${group.fill}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
