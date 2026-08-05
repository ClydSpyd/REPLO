import { FiFilter, FiSearch } from 'react-icons/fi';
import {
  equipmentFilters,
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
  /** Currently selected equipment bucket, or null for "All". */
  equipment?: EquipmentFilter | null;
  /** Called when an equipment pill is selected (null for "All"). */
  onEquipmentChange?: (value: EquipmentFilter | null) => void;
  /**
   * Opt in to the compact mobile treatment: below `lg` the muscle/equipment
   * pills collapse behind a filter toggle in the search field. Desktop is
   * unaffected. Consumers that omit this keep the always-visible pill row.
   */
  collapsibleFilters?: boolean;
  /** Whether the collapsed mobile filter panel is expanded. */
  filtersOpen?: boolean;
  /** Toggle the mobile filter panel. */
  onToggleFilters?: () => void;
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
  equipment,
  onEquipmentChange,
  collapsibleFilters = false,
  filtersOpen = false,
  onToggleFilters,
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
          className={`w-full rounded-lg border border-[var(--contrast-one)] bg-transparent py-3.5 pl-12 text-[var(--text-strong)] placeholder:text-[var(--contrast-two)] ${
            collapsibleFilters
              ? 'pr-14 lg:pr-32'
              : resultCount === undefined
                ? 'pr-4'
                : 'pr-32'
          }`}
        />

        {resultCount !== undefined && (
          <span
            className={`pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-sm text-[var(--contrast-three)] ${
              collapsibleFilters ? 'hidden lg:block' : ''
            }`}
          >
            {resultCount} exercise{resultCount === 1 ? '' : 's'}
          </span>
        )}

        {/* Mobile filter toggle — desktop shows the pills inline instead. */}
        {collapsibleFilters && onToggleFilters && (
          <button
            type="button"
            aria-label="Toggle filters"
            aria-expanded={filtersOpen}
            onClick={onToggleFilters}
            className={`absolute right-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg border transition-colors lg:hidden ${
              filtersOpen
                ? 'border-[var(--accent-primary)] text-[var(--accent-primary)]'
                : 'border-[var(--contrast-one)] text-[var(--contrast-two)]'
            }`}
          >
            <FiFilter />
          </button>
        )}
      </div>

      {/* Muscle group pills. Below lg the pills become a single swipeable row;
          from lg they wrap inline. When collapsible, the mobile row is hidden
          (the panel below replaces it) but the desktop row is unchanged. */}
      <div
        className={`mt-4 lg:mt-5 flex-col lg:flex-row lg:flex-wrap lg:items-center gap-x-2 gap-y-[2px] ${
          collapsibleFilters ? 'hidden lg:flex' : 'flex'
        }`}
      >
        <div className="scrollbar-none flex gap-2 overflow-x-auto pb-1 lg:contents lg:overflow-visible lg:pb-0">
          <FilterPill
            label="All"
            active={muscleGroup === null}
            onClick={() => onMuscleGroupChange(null)}
          />
          {primaryMuscleGroups.map((group) => (
            <FilterPill
              key={group}
              label={formatLabel(group)}
              active={muscleGroup === group}
              onClick={() => onMuscleGroupChange(group)}
            />
          ))}
        </div>
      </div>

      {/* Collapsible mobile panel: muscle + equipment. Never rendered on
          desktop, so it can't change the desktop layout. */}
      {collapsibleFilters && filtersOpen && (
        <div className="mt-3 flex flex-col gap-4 rounded-xl border border-[var(--contrast-one)] p-4 lg:hidden">
          <div>
            <p className="space-mono mb-2 text-[10px] uppercase tracking-wide text-[var(--contrast-three)]">
              Muscle Group
            </p>
            <div className="flex flex-wrap gap-2">
              <FilterPill
                label="All"
                active={muscleGroup === null}
                onClick={() => onMuscleGroupChange(null)}
              />
              {primaryMuscleGroups.map((group) => (
                <FilterPill
                  key={group}
                  label={formatLabel(group)}
                  active={muscleGroup === group}
                  onClick={() => onMuscleGroupChange(group)}
                />
              ))}
            </div>
          </div>

          {onEquipmentChange && (
            <div>
              <p className="space-mono mb-2 text-[10px] uppercase tracking-wide text-[var(--contrast-three)]">
                Equipment
              </p>
              <div className="flex flex-wrap gap-2">
                <FilterPill
                  label="All"
                  active={!equipment}
                  onClick={() => onEquipmentChange(null)}
                />
                {equipmentFilters.map((option) => (
                  <FilterPill
                    key={option.label}
                    label={option.label}
                    active={equipment === option.label}
                    onClick={() => onEquipmentChange(option.label)}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function FilterPill({
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
          : 'border border-[var(--contrast-one)] lg:border-transparent text-[var(--contrast-three)]! hover:text-[var(--text-strong)]/80!'
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
