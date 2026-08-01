import { RoutineModel } from "./routine.model";

export class RoutineRepository {
  async create(data: any) {
    return RoutineModel.create(data);
  }

  async findById(id: string) {
    return RoutineModel.findById(id);
  }

  async updateById(id: string, data: any) {
    return RoutineModel.findByIdAndUpdate(id, data, { new: true });
  }

  async findAll(userId?: string) {
    const filter = userId ? { user: userId } : {};
    if (userId) {
      return RoutineModel.find(filter).sort({ name: 1 }).lean();
    } else {
      return RoutineModel.find(filter)
        .sort({ name: 1 })
        .populate({
          path: "user",
          select: "username profilePictureUrl",
        })
        .lean();
    }
  }

  async deleteById(id: string) {
    return RoutineModel.findByIdAndDelete(id);
  }
}
