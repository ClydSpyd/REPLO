import { useEffect, useMemo, useRef, useState } from 'react';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { useUpdateCurrentWorkout } from '../../../mutations/workouts';
import { useMyCurrentWorkout } from '../../../queries/workouts';
import { HiMiniPencilSquare } from 'react-icons/hi2';
import useOutsideClick from '../../../hooks/useOutsideClick';

export default function WorkoutTitleBlock() {
  const [editing, setEditing] = useState(false);
  const { data: workout } = useMyCurrentWorkout();
  if (!workout) throw new Error('No active workout');
  const { mutate: updateWorkout } = useUpdateCurrentWorkout();
  const nameChange$ = useMemo(() => new Subject<string>(), []);
  const contRef = useRef<HTMLDivElement>(null);
  useOutsideClick(contRef, () => setEditing(false));

  useEffect(() => {
    if (editing) {
      contRef.current?.querySelector('input')?.focus();
    }
  }, [editing]);
  useEffect(() => {
    const sub = nameChange$
      .pipe(debounceTime(450), distinctUntilChanged())
      .subscribe((nextName) => {
        updateWorkout({ name: nextName });
      });

    return () => sub.unsubscribe();
  }, [nameChange$, updateWorkout]);

  return (
    <div ref={contRef} className="w-full">
      {!editing ? (
        <div className="flex items-center">
          <h1 className="heading-one" onClick={() => setEditing(true)}>
            {workout.name}
          </h1>
          <HiMiniPencilSquare
            className="ml-2 text-[var(--contrast-two)] text-3xl p-1 cursor-pointer border transition-all duration-300 border-transparent hover:border-[var(--contrast-two)] rounded-md hidden lg:inline-block"
            onClick={() => setEditing(true)}
          />
        </div>
      ) : (
        <input
          key={workout._id}
          className="heading-one bg-transparent border-b border-[var(--accent-primary)] focus:outline-none focus:border-[var(--accent-secondary)] text-white"
          type="text"
          defaultValue={workout.name}
          onChange={(e) => {
            nameChange$.next(e.target.value);
          }}
        />
      )}
    </div>
  );
}
