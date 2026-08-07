import { useMemo, useState } from 'react';
import { FiChevronRight, FiStar } from 'react-icons/fi';
import { format } from 'date-fns';
import { useUserPersonalBests } from '../../../queries/userMetrics';
import PersonalRecordsModal from './PersonalRecordsModal';

/** The three most recently set personal bests (by heaviest weight). */
export default function RecordsBlock() {
  const [modalOpen, setModalOpen] = useState(false);
  const { data, isLoading, error } = useUserPersonalBests();

  const recent = useMemo(
    () =>
      [...(data ?? [])]
        .sort(
          (a, b) =>
            new Date(b.heaviestWeight.date).getTime() -
            new Date(a.heaviestWeight.date).getTime(),
        )
        .slice(0, 3),
    [data],
  );

  return (
    <section className="rounded-lg border border-[var(--contrast-one)] bg-[var(--dark-one)] px-8 py-6 text-[var(--text-strong)]">
      <div className="flex items-center justify-between">
        <p className="space-mono text-xs text-[var(--contrast-three)]">
          RECENT PRS
        </p>
        {recent.length > 0 && (
          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className="space-mono flex items-center gap-1 rounded-lg border border-[var(--contrast-one)] px-3 py-1.5 text-xs uppercase tracking-wide text-[var(--accent-primary)] transition-colors hover:border-[var(--accent-primary)]"
          >
            View all <FiChevronRight />
          </button>
        )}
      </div>

      <div className="mt-5 flex flex-col divide-y divide-[var(--contrast-one)]">
        {isLoading && <RowPlaceholder text="Loading records…" />}
        {error && <RowPlaceholder text="Couldn't load records" />}
        {!isLoading && !error && recent.length === 0 && <EmptyRecords />}
        {recent.map((record) => (
          <div key={record.exerciseId} className="flex items-center gap-3 py-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[var(--contrast-one)] text-[var(--accent-primary)]">
              <FiStar className="text-base" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-[var(--text-strong)]">
                {record.name}
              </p>
              <p className="space-mono text-xs text-[var(--contrast-three)]">
                {format(new Date(record.heaviestWeight.date), 'MMM dd')}
              </p>
            </div>
            <p className="text-lg font-bold text-[var(--accent-primary)]">
              {record.heaviestWeight.weight}
              <span className="text-xs text-[var(--contrast-three)]">kg</span>
            </p>
          </div>
        ))}
      </div>

      {modalOpen && (
        <PersonalRecordsModal onClose={() => setModalOpen(false)} />
      )}
    </section>
  );
}

/** Ghost PR rows hinting the layout, with a nudge to log some sets. */
function EmptyRecords() {
  return (
    <div className="pt-3">
      <div className="flex flex-col gap-4">
        {[0, 1, 2].map((i) => (
          <div key={i} className="flex items-center gap-3">
            <div className="h-9 w-9 shrink-0 rounded-full border border-[var(--contrast-one)] bg-[var(--dark-two)]" />
            <div className="flex-1">
              <div className="h-3 w-28 rounded bg-[var(--dark-three)]" />
              <div className="mt-1.5 h-2 w-14 rounded bg-[var(--dark-three)]" />
            </div>
            <div className="h-4 w-10 rounded bg-[var(--dark-three)]" />
          </div>
        ))}
      </div>
      <p className="space-mono mt-4 text-center text-[11px] uppercase tracking-wide text-[var(--contrast-two)]!">
        Log sets to set your first PR
      </p>
    </div>
  );
}

function RowPlaceholder({ text }: { text: string }) {
  return (
    <p className="space-mono py-6 text-center text-xs uppercase tracking-wide text-[var(--contrast-two)]!">
      {text}
    </p>
  );
}
