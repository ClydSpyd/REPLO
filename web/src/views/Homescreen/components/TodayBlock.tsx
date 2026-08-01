import Button from '../../../components/ui/Button';
import { FaPlay, FaPlus } from 'react-icons/fa';
import { useWorkoutSessionData } from '../../../hooks/useWorkoutSessionData';
import { useMyCurrentWorkout } from '../../../queries/workouts';
import { useNavigate } from 'react-router-dom';

export default function TodayBlock() {
  const navigate = useNavigate();

  const { data: activeWorkout, error } = useMyCurrentWorkout();
  const { setCount, exerciseCount, estimatedDurationSec } =
    useWorkoutSessionData(activeWorkout ?? null);

  const handleStartWorkout = () => {
    navigate('/workout' + (!activeWorkout ? `?create=true` : ''));
  };

  return (
    <section
      className={`lg:h-[185px] flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between text-white module-wrapper px-5! py-6! lg:px-10! lg:py-8! ${activeWorkout ? 'border-[var(--accent-primary)]! bg-grad' : ''}`}
    >
      <div className="flex w-full lg:w-auto min-w-0 flex-col gap-2 opacity-80">
        <div className="text-xs flex gap-2 items-center">
          <p className="text-[var(--accent-primary)] space-mono">UP NEXT</p>
          <p className="text-[var(--accent-primary)]">•</p>
          <p className="text-[var(--accent-primary)] space-mono">TODAY</p>
        </div>
        <h3 className="heading-three text-white uppercase my-2">
          {activeWorkout ? activeWorkout.name : 'REST DAY - NOTHING SCHEDULED'}
        </h3>
        {error ? (
          <p className="body-text text-sm!">
            Error loading workout: {error.message}
          </p>
        ) : activeWorkout ? (
          <div className="flex flex-wrap gap-2">
            <p className="body-text text-xs! border border-[var(--contrast-one)] text-[var(--contrast-two)] bg-[var(--dark-two)] rounded-md px-2 py-2">
              {exerciseCount} exercises
            </p>
            <p className="body-text text-xs! border border-[var(--contrast-one)] text-[var(--contrast-two)] bg-[var(--dark-two)] rounded-md px-2 py-2">
              {setCount} sets
            </p>
            <p className="body-text text-xs! border border-[var(--contrast-one)] text-[var(--contrast-two)] bg-[var(--dark-two)] rounded-md px-2 py-2">
              {estimatedDurationSec
                ? `~${Math.ceil(estimatedDurationSec / 60)} min`
                : '-'}
            </p>
          </div>
        ) : (
          <p className="body-text text-sm!">
            No session on the schedule. Feeling good? Kick one off now and log
            it on the fly
          </p>
        )}
      </div>
      <Button
        icon={activeWorkout ? <FaPlay /> : <FaPlus />}
        text={activeWorkout ? 'Workout' : 'Start a Session'}
        onClick={handleStartWorkout}
        size="xl"
        additionalClasses={'w-full lg:w-auto mt-4 lg:mt-0'}
      />
    </section>
  );
}
