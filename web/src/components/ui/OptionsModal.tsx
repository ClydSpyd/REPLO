import type { ReactNode } from 'react';
import Modal from './Modal';
import Toggle from './Toggle';
import { usePreferences } from '../../context/preferences';

/**
 * App settings, opened from the header menu. One toggle for now; structured so
 * more rows drop in as options grow. Preferences persist via PreferencesProvider.
 */
export default function OptionsModal({ onClose }: { onClose: () => void }) {
  const { preferences, setPreference } = usePreferences();

  return (
    <Modal mainHeading="Options" subHeading="Settings" onClose={onClose}>
      <div className="flex flex-col gap-3">
        <OptionRow
          title="Apply edits to following sets"
          description="When you change a set's reps or weight, the following sets that aren't logged yet update to match."
          control={
            <Toggle
              checked={preferences.cascadeSetEdits}
              onChange={(next) => setPreference('cascadeSetEdits', next)}
              label="Apply edits to following sets"
            />
          }
        />
      </div>
    </Modal>
  );
}

function OptionRow({
  title,
  description,
  control,
}: {
  title: string;
  description: string;
  control: ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-2xl border border-[var(--contrast-one)] bg-[var(--dark-one)] px-5 py-4">
      <div className="min-w-0">
        <p className="font-bold text-[var(--text-strong)]">{title}</p>
        <p className="body-text mt-1 text-sm! text-[var(--contrast-three)]">
          {description}
        </p>
      </div>
      {control}
    </div>
  );
}
