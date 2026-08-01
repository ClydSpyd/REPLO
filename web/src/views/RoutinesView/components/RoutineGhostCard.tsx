import ReploLoader from '../../../components/ui/loaders/ReploLoader';

/**
 * Placeholder occupying the slot a routine is about to fill while its creation
 * is in flight. Sits at the position the finished card will take, so the grid
 * doesn't jump when the real one arrives.
 */
export default function RoutineGhostCard({ name }: { name: string }) {
  return (
    <section
      aria-busy="true"
      aria-label={`Creating ${name}`}
      className="flex min-h-[260px] flex-col items-center justify-center gap-4 rounded-2xl border border-dashed border-[var(--contrast-one)] bg-[color-mix(in_srgb,var(--dark-one)_60%,transparent)] p-5 text-center"
    >
      <ReploLoader size={44} speed="fast" />

      <div className="min-w-0">
        <p className="anotation mt-1 text-xs! text-[var(--contrast-three)]!">
          Duplicating...
        </p>
      </div>
    </section>
  );
}
