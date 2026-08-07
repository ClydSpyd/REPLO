import { useUserMuscleBalance } from '../../../queries/userMetrics';

/** Muscle balance over the previous month, one bar per coverage group. */
export default function MuscleAnalysisBlock() {
  const { data, isLoading, error } = useUserMuscleBalance('month');

  const groups = (data?.groups ?? [])
    .filter((group) => group.volume > 0)
    .sort((a, b) => b.percent - a.percent);

  return (
    <section className="rounded-lg border border-[var(--contrast-one)] bg-[var(--dark-one)] px-8 py-6 text-[var(--text-strong)]">
      <div className="flex items-start justify-between">
        <p className="space-mono text-xs text-[var(--contrast-three)]">
          MUSCLE BALANCE
        </p>
      </div>

      <div className="mt-5 flex flex-col gap-4">
        {isLoading && <Placeholder text="Loading…" />}
        {error && <Placeholder text="Couldn't load muscle balance" />}
        {!isLoading && !error && groups.length === 0 && <EmptyBalance />}
        {groups.map((group) => (
          <div key={group.label}>
            <div className="flex items-center justify-between text-sm">
              <span className="text-[var(--text-strong)]/90">{group.label}</span>
              <span className="text-[var(--contrast-three)]">
                {Math.round(group.percent)}%
              </span>
            </div>
            <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-[var(--dark-three)]">
              <div
                className="h-full rounded-full bg-[var(--accent-primary)]"
                style={{ width: `${group.percent}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

/** Ghost bars hinting the eventual chart, with a nudge to train. */
function EmptyBalance() {
  const ghostWidths = [62, 48, 38, 28, 20];
  return (
    <div>
      <div className="flex flex-col gap-4">
        {ghostWidths.map((width, i) => (
          <div key={i}>
            <div className="h-2.5 w-16 rounded bg-[var(--dark-three)]" />
            <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-[var(--dark-three)]">
              <div
                className="h-full rounded-full bg-[var(--contrast-one)]"
                style={{ width: `${width}%` }}
              />
            </div>
          </div>
        ))}
      </div>
      <p className="space-mono mt-5 text-center text-[11px] uppercase tracking-wide text-[var(--contrast-two)]!">
        Complete a workout to map your balance
      </p>
    </div>
  );
}

function Placeholder({ text }: { text: string }) {
  return (
    <p className="space-mono py-4 text-center text-xs uppercase tracking-wide text-[var(--contrast-two)]!">
      {text}
    </p>
  );
}
