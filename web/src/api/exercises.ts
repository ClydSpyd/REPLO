import { baseClient } from '.';

const exerciseMethods = {
  getMinimalDataset: async (): Promise<ExerciseMinimal[]> => {
    const { data } =
      await baseClient.get<ExerciseMinimal[]>('/exercise/dataset');
    return data;
  },
};
export default exerciseMethods;
