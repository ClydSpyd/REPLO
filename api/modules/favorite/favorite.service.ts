import { Types } from "mongoose";
import { FavoriteRepository } from "./favorite.repository";
import { RoutineRepository } from "../routine/routine.repository";

/** Marks an Error with an HTTP status the central error handler will surface. */
function httpError(message: string, status: number) {
  const err = new Error(message) as Error & { status: number };
  err.status = status;
  return err;
}

export class FavoriteService {
  private repository = new FavoriteRepository();
  private routineRepository = new RoutineRepository();

  /**
   * Favorite a routine for the user. Idempotent: re-favoriting an already
   * favorited routine is a no-op rather than an error, so the client can fire
   * this without first checking current state.
   */
  async addFavorite(routineId: string, userId: string) {
    if (!Types.ObjectId.isValid(routineId)) {
      throw httpError("Invalid routine ID", 400);
    }

    const routine = await this.routineRepository.findById(routineId);
    if (!routine) throw httpError("Routine not found", 404);

    try {
      return await this.repository.create(userId, routineId);
    } catch (err: any) {
      // Duplicate key on the { userId, routine } unique index → already
      // favorited. Treat as success.
      if (err?.code === 11000) return null;
      throw err;
    }
  }

  async removeFavorite(routineId: string, userId: string) {
    if (!Types.ObjectId.isValid(routineId)) {
      throw httpError("Invalid routine ID", 400);
    }
    return this.repository.deleteOne(userId, routineId);
  }

  /** The routine IDs the user has favorited, as strings for the client. */
  async getFavoriteRoutineIds(userId: string): Promise<string[]> {
    const favorites = await this.repository.findByUser(userId);
    return favorites.map((favorite) => favorite.routine.toString());
  }
}
