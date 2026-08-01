import { Types } from "mongoose";
import { RoutineRepository } from "./routine.repository";
import { RoutineInput } from "./routine.types";
import { withEnrichedExercises } from "../exercise/exercise.utils";

export class RoutineService {
  private repository = new RoutineRepository();

  async createRoutine(data: RoutineInput, userId: string) {
    return this.repository.create({ ...data, user: userId });
  }

  async updateRoutine(id: string, updates: Partial<RoutineInput>, userId: string) {
    const routine = await this.repository.findById(id);
    if (!routine) throw new Error("Routine not found");
    if (routine.user.toString() !== userId) {
      throw new Error("You do not have permission to update this routine");
    }
    Object.assign(routine, updates);
    return this.repository.updateById(id, routine);
  }

  async getRoutine(id: string) {
    if (!Types.ObjectId.isValid(id)) {
      throw new Error("Invalid routine ID");
    }
    const routine = await this.repository.findById(id);
    if (!routine) throw new Error("Routine not found");

    return withEnrichedExercises(routine);
  }

  async getAllRoutines(userId?: string) {
    const routines = await this.repository.findAll(userId);
    return routines.map(withEnrichedExercises);
  }

  async deleteRoutine(id: string, userId: string) {
    if (!Types.ObjectId.isValid(id)) {
      throw new Error("Invalid routine ID");
    }

    const routine = await this.repository.findById(id);
    if (!routine) throw new Error("Routine not found");
    if (routine.user.toString() !== userId) {
      throw new Error("You do not have permission to delete this routine");
    }

    return this.repository.deleteById(id);
  }
}
