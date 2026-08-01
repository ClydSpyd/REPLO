import { useSearchParams } from 'react-router-dom';
import { useMyCurrentWorkout } from '../../queries/workouts';
import CreateWorkout from './view-states/CreateWorkout.tsx';
import { Suspense } from 'react';
import ActiveWorkout from './view-states/ActiveWorkout.tsx';
import NoActiveSession from './view-states/NoActiveSession.tsx';
import ErrorBoundaryModal from '../../components/utility/ErrorBoundaryModal.tsx';

export default function WorkoutView() {
  const [searchParams] = useSearchParams();
  const { data: workout } = useMyCurrentWorkout();
  const create = searchParams.get('create');

  return (
    <ErrorBoundaryModal pageType="WorkoutView">
      <div className="page-wrapper">
        {create && !workout ? (
          <CreateWorkout />
        ) : !workout ? (
          <NoActiveSession />
        ) : (
          <Suspense
            fallback={
              <div className="w-full grow rounded-lg border border-dashed border-[var(--contrast-one)] bg-[color-mix(in_srgb,var(--dark-one)_60%,transparent)] p-6 flex items-center justify-center">
                <p className="anotation text-[var(--contrast-two)]! text-xs! uppercase tracking-wide">
                  Loading workout...
                </p>
              </div>
            }
          >
            <ActiveWorkout />
          </Suspense>
        )}
      </div>
    </ErrorBoundaryModal>
  );
}
