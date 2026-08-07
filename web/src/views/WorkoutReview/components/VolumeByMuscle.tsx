import { humanizeMuscle, volumeByMuscle } from '../review-utils';

/**
 * Completed volume broken down per muscle, as horizontal bars sized relative to
 * the biggest contributor. Credited to each exercise's primary muscles (see
 * volumeByMuscle). Renders nothing when there's no completed volume.
 */
export default function VolumeByMuscle({
  session,
  limit = 6,
}: {
  session: WorkoutSession;
  limit?: number;
}) {
  const rows = volumeByMuscle(session).slice(0, limit);
  if (rows.length === 0) return null;

  const max = rows[0].volume;

  return (
    <section className="rounded-2xl border border-[var(--contrast-one)] bg-[var(--dark-one)] px-6 py-6 lg:px-8">
      <p className="space-mono text-xs uppercase tracking-wide text-[var(--contrast-three)]">
        Volume by muscle
      </p>

      <div className="mt-5 flex flex-col gap-5">
        {rows.map(({ muscle, volume }) => (
          <div key={muscle}>
            <div className="flex items-baseline justify-between gap-3">
              <span className="text-sm capitalize text-[var(--text-strong)]/90">
                {humanizeMuscle(muscle)}
              </span>
              <span className="space-mono text-xs text-[var(--contrast-three)]">
                {volume.toLocaleString()} kg
              </span>
            </div>
            <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-[var(--dark-three)]">
              <div
                className="h-full rounded-full bg-[var(--accent-primary)]"
                style={{ width: `${max > 0 ? (volume / max) * 100 : 0}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
