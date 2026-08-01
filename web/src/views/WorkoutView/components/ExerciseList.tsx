import { useState } from 'react';
import ExerciseCard from './ExerciseCard';

/**
 * Lists the exercises in the active workout, each as an expandable card. Only
 * one card can be open at a time; opening one collapses the others.
 */
export default function ExerciseList({
  exercises,
}: {
  exercises: WorkoutExercise[];
}) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  if (exercises.length === 0) return null;

  return (
    <div className="flex flex-col gap-4">
      {exercises.map((exercise, index) => (
        <ExerciseCard
          key={`${exercise.name}-${index}`}
          exercise={exercise}
          index={index}
          open={openIndex === index}
          onOpen={() => setOpenIndex(index)}
          onClose={() => setOpenIndex(null)}
        />
      ))}
    </div>
  );
}
