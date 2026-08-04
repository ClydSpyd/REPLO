import { FavoriteModel } from "./favorite.model";

export class FavoriteRepository {
  async create(userId: string, routine: string) {
    return FavoriteModel.create({ userId, routine });
  }

  /** Every favorite the user holds — selects only the routine ref for lookups. */
  async findByUser(userId: string) {
    return FavoriteModel.find({ userId }).select("routine").lean();
  }

  async deleteOne(userId: string, routine: string) {
    return FavoriteModel.deleteOne({ userId, routine });
  }
}
