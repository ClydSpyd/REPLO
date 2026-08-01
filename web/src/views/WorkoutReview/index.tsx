import { useParams } from 'react-router-dom';
import { useWorkout } from '../../queries/workouts';
import { useUpdateWorkout } from '../../mutations/workouts';
import ErrorBoundaryModal from '../../components/utility/ErrorBoundaryModal';
import WorkoutProgress from '../WorkoutView/components/WorkoutProgress';
import WorkoutNotes from '../WorkoutView/components/WorkoutNotes';
import CompletedSummary from './components/CompletedSummary';
import CompletedExerciseCard from './components/CompletedExerciseCard';

/**
 * Review a completed workout. A static counterpart to ActiveWorkout: everything
 * is read-only except the session notes, which remain editable.
 */
export default function WorkoutReview() {
  const { workoutId } = useParams<{ workoutId: string }>();
  const { data: workout, isLoading, error } = useWorkout(workoutId);
  const { mutate: updateWorkout } = useUpdateWorkout(workoutId);

  return (
    <ErrorBoundaryModal pageType="WorkoutReview">
      <div className="page-wrapper">
        <div className="w-full px-6 lg:px-2">
          {isLoading && <Placeholder text="Loading workout..." />}

          {error && (
            <Placeholder text={`Couldn't load this workout: ${error.message}`} />
          )}

          {!isLoading && !error && !workout && (
            <Placeholder text="Workout not found" />
          )}

          {workout && (
            <>
              <CompletedSummary session={workout} />

              <div className="h-full overflow-hidden w-full grow grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_400px] gap-4">
                <div className="flex flex-col gap-4 min-w-0">
                  {workout.exercises.length === 0 ? (
                    <Placeholder text="No exercises were logged in this session" />
                  ) : (
                    workout.exercises.map((exercise, index) => (
                      <CompletedExerciseCard
                        key={`${exercise.exerciseId}-${index}`}
                        exercise={exercise}
                        index={index}
                      />
                    ))
                  )}
                </div>

                <div className="flex flex-col gap-4 h-full">
                  <WorkoutProgress session={workout} />
                  <WorkoutNotes
                    key={workout._id}
                    notes={workout.notes}
                    onSave={(notes) => updateWorkout({ notes })}
                  />
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </ErrorBoundaryModal>
  );
}

function Placeholder({ text }: { text: string }) {
  return (
    <div className="w-full grow rounded-lg border border-dashed border-[var(--contrast-one)] bg-[color-mix(in_srgb,var(--dark-one)_60%,transparent)] p-6 flex items-center justify-center">
      <p className="anotation text-[var(--contrast-two)]! text-xs! uppercase tracking-wide">
        {text}
      </p>
    </div>
  );
}
