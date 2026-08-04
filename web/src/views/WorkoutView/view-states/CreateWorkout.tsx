import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { FaPlay, FaPlus } from 'react-icons/fa';
import { FiX } from 'react-icons/fi';
import { tags } from '../../../config/muscles';
import Button from '../../../components/ui/Button';
import { useNavigate } from 'react-router-dom';
import { API } from '../../../api';
import { useMyCurrentWorkout } from '../../../queries/workouts';
import useOutsideClick from '../../../hooks/useOutsideClick';

export default function CreateWorkout() {
  const [workoutName, setWorkoutName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedMuscles, setSelectedMuscles] = useState<string[]>([]);
  const navigate = useNavigate();
  const { refetch } = useMyCurrentWorkout();
  const panelRef = useRef<HTMLDivElement>(null);

  const handleClose = () => navigate('/workout');
  useOutsideClick(panelRef, handleClose);

  // Lock body scroll and close on Escape while the modal is mounted.
  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose();
    };
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', handleKeyDown);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleLoadRoutine = () => {
    navigate('/workout?loadRoutine=true');
  };

  const handleCreateWorkout = async () => {
    setIsSubmitting(true);
    try {
      await API.workout.createWorkout({
        name: workoutName,
        tags: selectedMuscles,
      });
      await refetch(); // Refetch the current workout after creating a new one
      navigate('/workout');
    } catch (error) {
      console.error('Error creating workout:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return createPortal(
    <div
      className="animate-modal-backdrop fixed inset-0 z-50 flex items-stretch justify-center bg-black/70 backdrop-blur-sm lg:items-center lg:p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Name your session"
    >
      {/*
        Full-viewport on mobile (edge-to-edge, its own scroll); the existing
        centered 500px accent-bordered card from lg up.
      */}
      <div
        ref={panelRef}
        className="animate-modal-panel relative flex min-h-[100dvh] w-full flex-col items-center justify-center gap-6 overflow-y-auto bg-[var(--dark-one)] px-6 py-16 lg:h-fit lg:max-h-[90vh] lg:min-h-0 lg:w-[500px] lg:max-w-[95vw] lg:justify-start lg:rounded-xl lg:border lg:border-[var(--accent-primary)] lg:px-10 lg:py-10"
      >
        <button
          type="button"
          aria-label="Close"
          onClick={handleClose}
          className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-lg border border-[var(--contrast-one)] bg-[var(--dark-two)] text-[var(--contrast-three)] transition-colors hover:border-[var(--accent-primary)] hover:text-white"
        >
          <FiX className="text-xl" />
        </button>

        <div className="flex flex-col items-center gap-2">
          <div className="w-fit border border-[var(--accent-primary)] bg-[var(--hint-primary-dark)] rounded-xl p-5">
            <FaPlus className="text-[var(--accent-primary)] text-3xl" />
          </div>
          <div className="anotation">Add a new workout</div>
          <h3 className="heading-three">NAME YOUR SESSION</h3>
          <p className="body-text text-sm! text-center">
            Give it a name, tag the muscles you're hitting, and jump straight in.
          </p>
        </div>
        <div className="w-full">
          <label
            className="block mb-2 text-xs! anotation text-[var(--contrast-three)]! tracking-wider"
            htmlFor="workoutName"
          >
            Workout Name
          </label>
          <input
            type="text"
            placeholder="e.g 'Leg Day', 'Full Body'"
            value={workoutName}
            onChange={(e) => setWorkoutName(e.target.value)}
            className="w-full p-4 mb-4 border border-[var(--contrast-one)]! bg-[var(--dark-two)] text-white rounded-lg placeholder:text-[var(--contrast-one)]! placeholder:tracking-wider"
          />
        </div>
        <div className="w-full">
          <p className="block mb-4 text-xs! anotation text-[var(--contrast-three)]! tracking-wider">
            Tag workout{' '}
          </p>
          <div className="w-full flex justify-center gap-1 gap-y-2 flex-wrap">
            {tags.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => {
                  setSelectedMuscles((prev) =>
                    prev.includes(tag)
                      ? prev.filter((m) => m !== tag)
                      : [...prev, tag],
                  );
                }}
                className={`px-4 py-2 rounded-full border anotation capitalize! text-sm! ${
                  selectedMuscles.includes(tag)
                    ? 'border-[var(--accent-primary)] bg-[var(--hint-primary-dark)] text-[var(--accent-primary)]!'
                    : 'bg-[var(--dark-two)] hover:brightness-85  text-[var(--contrast-three)]! border-[var(--contrast-one)]! hover:border-[var(--hint-primary-light)]!'
                } ${selectedMuscles.length > 0 && !selectedMuscles.includes(tag) ? 'opacity-50 pointer-events-none' : ''}`}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>
        <Button
          text="Create Workout"
          size="xl"
          additionalClasses="w-full"
          onClick={handleCreateWorkout}
          disabled={isSubmitting || !workoutName}
          icon={<FaPlay className="text-xl" />}
        />

        <p className="body-text text-xs!">
          or{' '}
          <span
            onClick={handleLoadRoutine}
            className="text-[var(--accent-primary)] cursor-pointer"
          >
            load a routine or build one
          </span>
        </p>
      </div>
    </div>,
    document.body,
  );
}
