import ComingSoonOverlay from './ComingSoonOverlay';

// Placeholder: relative bar heights (%) for the weekly-volume skeleton.
const BARS = [40, 48, 44, 62, 56, 74, 66, 92];

export default function VolumeAnalysisBlock() {
  return (
    <div className="relative flex h-full flex-col gap-4">
      <ComingSoonOverlay />
      {/* Weekly volume */}
      <section className="relative rounded-lg border border-[var(--contrast-one)] bg-[var(--dark-one)] px-8 py-6 text-white">
        <div className="flex items-start justify-between">
          <p className="space-mono text-xs text-[var(--accent-primary)]">
            LAST 8 WEEKS
          </p>
        </div>

        {/* Big total-volume figure */}
        <h2 className="heading-two">
          42.5<span className="text-4xl ml-1 lowercase">t</span>
        </h2>
        <p className="mt-2 space-mono text-xs text-[var(--contrast-three)]!">
          TOTAL VOLUME LIFTED
        </p>
        <div className="w-full border-b mt-8 border-[var(--contrast-one)]" />

        <p className="mt-6 space-mono text-xs text-[var(--contrast-three)]">
          WEEKLY VOLUME
        </p>
        <div className="mt-3 flex h-48 items-end gap-3">
          {BARS.map((height, i) => (
            <div
              key={i}
              className="flex h-full flex-1 flex-col items-center justify-end gap-2"
            >
              <div
                className="w-full rounded-t-md"
                style={{
                  height: `${height}%`,
                  backgroundColor:
                    i === BARS.length - 1
                      ? 'var(--accent-primary)'
                      : 'var(--dark-three)',
                }}
              />
              <span className="space-mono text-[10px] text-[var(--contrast-two)]!">
                {`w${i + 1}`}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* Last 4 weeks activity strip */}
      <section className="flex items-center gap-6 rounded-lg border border-[var(--contrast-one)] bg-[var(--dark-one)] px-8 py-5 text-white">
        <p className="space-mono whitespace-nowrap text-xs text-[var(--contrast-three)]">
          LAST 4 WEEKS
        </p>
        <div className="flex flex-wrap gap-1.5">
          {Array.from({ length: 28 }).map((_, i) => (
            <div key={i} className="h-5 w-5 rounded bg-[var(--dark-three)]" />
          ))}
        </div>
      </section>
    </div>
  );
}
