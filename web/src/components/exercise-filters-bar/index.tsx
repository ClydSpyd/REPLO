import { FiSearch } from 'react-icons/fi';
import {
  primaryMuscleGroups,
  type EquipmentFilter,
  type PrimaryMuscleGroup,
} from '../../config/muscles';

interface ExerciseFiltersBarProps {
  /** Current search text. */
  search: string;
  /** Called when the search text changes. */
  onSearchChange: (value: string) => void;
  /** Currently selected muscle group, or null for "All". */
  muscleGroup: PrimaryMuscleGroup | null;
  /** Called when a muscle group pill is selected (null for "All"). */
  onMuscleGroupChange: (group: PrimaryMuscleGroup | null) => void;
  /** Placeholder for the search input. */
  searchPlaceholder?: string;
  /** Shown inside the search field, e.g. "45 exercises". */
  resultCount?: number;
  /**
   * Equipment filtering. The row is currently commented out below, so these
   * are accepted but unused — re-enable the block to bring them back.
   */
  equipment?: EquipmentFilter | null;
  onEquipmentChange?: (value: EquipmentFilter | null) => void;
}

/**
 * Encapsulated, controlled filter bar for the exercise library: a search input
 * plus muscle-group toggle pills. Holds no state of its own — parents pass the
 * current values and receive changes via callbacks.
 */
export default function ExerciseFiltersBar({
  search,
  onSearchChange,
  muscleGroup,
  onMuscleGroupChange,
  searchPlaceholder = 'Search the full exercise library...',
  resultCount,
}: ExerciseFiltersBarProps) {
  return (
    <div className="exercise-filters-bar">
      {/* Search */}
      <div className="relative">
        <FiSearch className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-lg text-[var(--contrast-two)]" />
        <input
          type="text"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={searchPlaceholder}
          className={`w-full rounded-lg border border-[var(--contrast-one)] bg-transparent py-3.5 pl-12 text-white placeholder:text-[var(--contrast-two)] ${
            resultCount === undefined ? 'pr-4' : 'pr-32'
          }`}
        />
        {resultCount !== undefined && (
          <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-sm text-[var(--contrast-three)]">
            {resultCount} exercise{resultCount === 1 ? '' : 's'}
          </span>
        )}
      </div>

      {/* Muscle group filter. On small screens the pills become a single
          swipeable row so they don't consume half the modal; from lg they wrap
          inline next to the label as before. */}
      <div className="mt-4 lg:mt-5 flex flex-col lg:flex-row lg:flex-wrap lg:items-center gap-x-2 gap-y-[2px]">
        {/* <span className="space-mono lg:mr-2 text-[10px] uppercase tracking-wide text-[var(--contrast-three)]">
          Muscle Group
        </span> */}

        <div className="scrollbar-none flex gap-2 overflow-x-auto pb-1 lg:contents lg:overflow-visible lg:pb-0">
          <MuscleGroupPill
            label="All"
            active={muscleGroup === null}
            onClick={() => onMuscleGroupChange(null)}
          />
          {primaryMuscleGroups.map((group) => (
            <MuscleGroupPill
              key={group}
              label={formatLabel(group)}
              active={muscleGroup === group}
              onClick={() => onMuscleGroupChange(group)}
            />
          ))}
        </div>
      </div>

      {/* Equipment filter — only rendered when the parent opts in. */}
      {/* {onEquipmentChange && (
        <div className="mt-3 flex flex-col lg:flex-row lg:flex-wrap lg:items-center gap-2">
          <span className="space-mono lg:mr-2 text-xs uppercase tracking-wide text-[var(--contrast-three)]">
            Equipment
          </span>

          <div className="scrollbar-none flex gap-2 overflow-x-auto pb-1 lg:contents lg:overflow-visible lg:pb-0">
            <MuscleGroupPill
              label="All"
              active={!equipment}
              onClick={() => onEquipmentChange(null)}
            />
            {equipmentFilters.map((option) => (
              <MuscleGroupPill
                key={option.label}
                label={option.label}
                active={equipment === option.label}
                onClick={() => onEquipmentChange(option.label)}
              />
            ))}
          </div>
        </div>
      )} */}
    </div>
  );
}

function MuscleGroupPill({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`space-mono shrink-0 whitespace-nowrap rounded-full px-4 py-2 lg:py-1.5 text-[10px] font-bold transition-colors ${
        active
          ? 'border border-[var(--accent-primary)] bg-[var(--hint-primary-dark)] text-[var(--accent-primary)]'
          : 'border border-[var(--contrast-one)] lg:border-transparent text-[var(--contrast-three)]! hover:text-white/80!'
      }`}
    >
      {label}
    </button>
  );
}

// Turn a kebab-case value ("full-body") into a display label ("Full Body").
function formatLabel(value: string): string {
  return value
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}
