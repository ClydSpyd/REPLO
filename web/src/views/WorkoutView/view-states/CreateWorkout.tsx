import { useState } from 'react';
import { FaPlay, FaPlus } from 'react-icons/fa';
import { tags } from '../../../config/muscles';
import Button from '../../../components/ui/Button';
import { useNavigate } from 'react-router-dom';
import { API } from '../../../api';
import { useMyCurrentWorkout } from '../../../queries/workouts';

export default function CreateWorkout() {
  const [workoutName, setWorkoutName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedMuscles, setSelectedMuscles] = useState<string[]>([]);
  const navigate = useNavigate();
  const { refetch } = useMyCurrentWorkout();

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

  return (
    <div className="flex-1 w-full min-h-screen flex items-center justify-center">
      <div className="w-[500px] py-10 border-[var(--accent-primary)]! flex flex-col gap-6 items-center z-50 module-wrapper">
        <div className="flex flex-col items-center gap-2">
          <div className="w-fit border border-[var(--accent-primary)] bg-[var(--hint-primary-dark)] rounded-xl p-5">
            <FaPlus className="text-[var(--accent-primary)] text-3xl" />
          </div>
          <div className="anotation">Add a new workout</div>
          <h3 className="heading-three">NAME YOUR SESSION</h3>
          <p className="body-text text-sm! text-center">
            Give it a name, tag the muscles you're hitting, and jump straight
            in.
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
    </div>
  );
}
