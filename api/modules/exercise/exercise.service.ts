// Service for exercise module
import resistanceExercises from "../../assets/data/resistance_exercises_base.json";

export class ExerciseService {
  getAllExercises() {
    return resistanceExercises;
  }

  getExerciseById(id: string) {
    const exercise = resistanceExercises.find((ex: any) => ex.id === id);
    if (!exercise) {
      throw new Error("Exercise not found");
    }
    return exercise;
  }

  searchByText(query: string) {
    const lowerQuery = query.toLowerCase();
    return resistanceExercises.filter((ex: any) => {
      return (
        ex.name.toLowerCase().includes(lowerQuery) ||
        ex.primaryMuscleGroups.some((muscle: string) =>
          muscle.toLowerCase().includes(lowerQuery),
        ) ||
        ex.secondaryMuscleGroups.some((muscle: string) =>
          muscle.toLowerCase().includes(lowerQuery),
        ) ||
        ex.muscleGroups.some((muscle: string) =>
          muscle.toLowerCase().includes(lowerQuery),
        ) ||
        ex.aliases.some((alias: string) =>
          alias.toLowerCase().includes(lowerQuery),
        )
      );
    });
  }

  getMinimalData(){
    return resistanceExercises.map((ex: any) => ({
      id: ex.id,
      name: ex.name,
      equipment: ex.equipment,
      muscleGroups: ex.muscleGroups,
      bodyRegion: ex.bodyRegion,
    }));
  }
}
