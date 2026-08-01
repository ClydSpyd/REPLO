import { useEffect, useMemo, useState } from 'react';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { useUpdateCurrentWorkout } from '../../../mutations/workouts';
import { useMyCurrentWorkout } from '../../../queries/workouts';
import WorkoutNotes from '../components/WorkoutNotes';
import WorkoutSummary from '../components/WorkoutSummary';
import WorkoutProgress from '../components/WorkoutProgress';
import AddExerciseModal from '../components/AddExerciseModal';
import ExerciseList from '../components/ExerciseList';
import RestTimer from '../../../components/ui/RestTimer';

export default function ActiveWorkout() {
  const { data: workout } = useMyCurrentWorkout();
  const { mutate: updateWorkout } = useUpdateCurrentWorkout();
  const nameChange$ = useMemo(() => new Subject<string>(), []);
  const [addExerciseOpen, setAddExerciseOpen] = useState(false);

  useEffect(() => {
    const sub = nameChange$
      .pipe(debounceTime(450), distinctUntilChanged())
      .subscribe((nextName) => {
        updateWorkout({ name: nextName });
      });

    return () => sub.unsubscribe();
  }, [nameChange$, updateWorkout]);

  if (!workout) {
    return (
      <div className="w-full h-[calc(100vh-80px)] grow rounded-md border-2 border-dashed border-[var(--contrast-one)] flex items-center justify-center">
        <p className="text-white/50 text-sm">No active workout session</p>
      </div>
    );
  }

  return (
    <div className="w-full px-6 lg:px-2">
      <WorkoutSummary session={workout} />
      <div className="h-full overflow-hidden w-full grow grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_400px] gap-4">
        <div className="flex flex-col gap-4 min-w-0">
          <ExerciseList exercises={workout.exercises} />
          <button
            type="button"
            onClick={() => setAddExerciseOpen(true)}
            className="h-[60px] w-full rounded-xl border border-[var(--accent-primary)] bg-[color-mix(in_srgb,var(--hint-primary-light)_50%,transparent)] hover:bg-[color-mix(in_srgb,var(--hint-primary-light)_80%,transparent)] text-[var(--accent-primary)] uppercase font-extrabold flex gap-2 items-center justify-center cursor-pointer transition-colors hover:brightness-95"
          >
            <h1 className="text-3xl relative bottom-[3px] text-[var(--accent-primary)]!">
              +
            </h1>
            <p>add exercise</p>
          </button>
        </div>
        <div className="flex flex-col gap-4 h-full">
          <WorkoutProgress session={workout} />
          <WorkoutNotes
            key={workout._id}
            notes={workout.notes}
            onSave={(notes) => updateWorkout({ notes })}
          />
          <RestTimer display />
        </div>
      </div>

      {addExerciseOpen && (
        <AddExerciseModal
          toggleOpen={setAddExerciseOpen}
          onClose={() => setAddExerciseOpen(false)}
        />
      )}
    </div>
  );
}
