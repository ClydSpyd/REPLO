import { useMemo, useState } from 'react';
import { FiSearch, FiStar } from 'react-icons/fi';
import { format } from 'date-fns';
import type { PersonalBest } from '@replo/shared';
import Modal from '../../../components/ui/Modal';
import { useUserPersonalBests } from '../../../queries/userMetrics';

type SortKey = 'recent' | 'heaviest' | 'az';

const SORTS: { key: SortKey; label: string }[] = [
  { key: 'recent', label: 'Recent' },
  { key: 'heaviest', label: 'Heaviest' },
  { key: 'az', label: 'A–Z' },
];

/**
 * All-time personal records (by heaviest weight), opened from the dashboard's
 * "View all". Search + sort only — no muscle/equipment filters.
 */
export default function PersonalRecordsModal({
  onClose,
}: {
  onClose: () => void;
}) {
  const { data, isLoading, error } = useUserPersonalBests();
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<SortKey>('recent');

  const records = data ?? [];

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = records.filter(
      (record) => !q || record.name.toLowerCase().includes(q),
    );
    return [...filtered].sort((a, b) => {
      if (sort === 'heaviest') {
        return b.heaviestWeight.weight - a.heaviestWeight.weight;
      }
      if (sort === 'az') return a.name.localeCompare(b.name);
      return (
        new Date(b.heaviestWeight.date).getTime() -
        new Date(a.heaviestWeight.date).getTime()
      );
    });
  }, [records, query, sort]);

  return (
    <Modal
      mainHeading="Personal Records"
      subHeading="All-time records"
      size="wide"
      onClose={onClose}
    >
      {/* Search + sort */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--contrast-three)]" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search a lift..."
            className="w-full rounded-xl border border-[var(--contrast-one)] bg-[var(--dark-one)] py-3 pl-11 pr-4 text-sm text-[var(--text-strong)] placeholder:text-[var(--contrast-three)]"
          />
        </div>
        <div className="flex items-center gap-1 rounded-xl border border-[var(--contrast-one)] bg-[var(--dark-one)] p-1">
          {SORTS.map(({ key, label }) => (
            <button
              key={key}
              type="button"
              onClick={() => setSort(key)}
              aria-pressed={sort === key}
              className={`space-mono rounded-lg px-4 py-2 text-xs uppercase font-extrabold! tracking-wide transition-colors ${
                sort === key
                  ? 'bg-[var(--accent-primary)] text-[var(--text-contrast)]!'
                  : 'text-[var(--contrast-three)] hover:text-[var(--text-strong)]!'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Count */}
      <div className="mt-6 flex items-center justify-between">
        <p className="space-mono text-xs uppercase tracking-wide text-[var(--contrast-three)]">
          Records
        </p>
        <p className="space-mono text-xs text-[var(--contrast-two)]">
          {visible.length} of {records.length}
        </p>
      </div>

      {/* List + states */}
      <div className="mt-3 flex flex-col gap-3">
        {isLoading && <Placeholder text="Loading records…" />}
        {error && <Placeholder text={`Couldn't load records: ${error.message}`} />}
        {!isLoading && !error && records.length === 0 && (
          <Placeholder text="No personal records yet — log some sets to set your first PR." />
        )}
        {!isLoading &&
          !error &&
          records.length > 0 &&
          visible.length === 0 && (
            <Placeholder text="No lifts match your search." />
          )}
        {visible.map((record, index) => (
          <RecordRow
            key={record.exerciseId}
            index={index + 1}
            record={record}
          />
        ))}
      </div>
    </Modal>
  );
}

function RecordRow({
  index,
  record,
}: {
  index: number;
  record: PersonalBest;
}) {
  const { weight, reps, date } = record.heaviestWeight;

  return (
    <div className="flex items-center gap-4 rounded-2xl border border-[var(--contrast-one)] bg-[var(--dark-one)] px-4 py-4 lg:px-6">
      <span className="space-mono hidden w-6 shrink-0 text-sm text-[var(--contrast-two)] sm:block">
        {String(index).padStart(2, '0')}
      </span>

      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-[var(--accent-primary)] bg-[var(--hint-primary-dark)] text-[var(--accent-primary)]">
        <FiStar fill="currentColor" />
      </span>

      <h4 className="anton min-w-0 flex-1 truncate text-lg uppercase tracking-wide text-[var(--text-strong)]">
        {record.name}
      </h4>

      <div className="hidden shrink-0 items-center gap-6 sm:flex">
        <span className="space-mono text-xs uppercase tracking-wide text-[var(--contrast-three)]">
          {reps} rep{reps === 1 ? '' : 's'}
        </span>
        <span className="space-mono w-16 text-xs text-[var(--contrast-three)]">
          {format(new Date(date), 'MMM dd')}
        </span>
      </div>

      <p className="anton shrink-0 text-2xl text-[var(--accent-primary)]">
        {weight}
        <span className="text-sm text-[var(--contrast-three)]">kg</span>
      </p>
    </div>
  );
}

function Placeholder({ text }: { text: string }) {
  return (
    <div className="rounded-xl border border-dashed border-[var(--contrast-one)] bg-[color-mix(in_srgb,var(--dark-one)_60%,transparent)] px-5 py-8 text-center">
      <p className="anotation text-xs! uppercase tracking-wide text-[var(--contrast-two)]!">
        {text}
      </p>
    </div>
  );
}
