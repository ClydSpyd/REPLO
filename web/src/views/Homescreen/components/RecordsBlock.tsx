import { FiStar } from 'react-icons/fi';
import ComingSoonOverlay from './ComingSoonOverlay';

// Placeholder: recent personal records.
const RECORDS = [
  { lift: 'Barbell Bench', date: 'May 15', weight: '102.5' },
  { lift: 'Back Squat', date: 'May 13', weight: '140' },
  { lift: 'Deadlift', date: 'May 06', weight: '180' },
];

export default function RecordsBlock() {
  return (
    <section className="relative rounded-lg border border-[var(--contrast-one)] bg-[var(--dark-one)] px-8 py-6 text-white">
      <ComingSoonOverlay />
      <div className="flex items-center justify-between">
        <p className="space-mono text-xs text-[var(--contrast-three)]">
          RECENT PRS
        </p>
      </div>

      <div className="mt-5 flex flex-col divide-y divide-[var(--contrast-one)]">
        {RECORDS.map((record) => (
          <div key={record.lift} className="flex items-center gap-3 py-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[var(--contrast-one)] text-[var(--accent-primary)]">
              <FiStar className="text-base" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-white">{record.lift}</p>
              <p className="space-mono text-xs text-[var(--contrast-three)]">
                {record.date}
              </p>
            </div>
            <p className="text-lg font-bold text-[var(--accent-primary)]">
              {record.weight}
              <span className="text-xs text-[var(--contrast-three)]">kg</span>
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
