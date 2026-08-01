import { UserMetricsModel } from "./userMetrics.model";

export class UserMetricsRepository {
  async create(data: any) {
    return UserMetricsModel.create(data);
  }

  async findLatest(userId: string) {
    return UserMetricsModel.findOne({ userId }).sort({ date: -1 });
  }

  async findHistory(userId: string) {
    return UserMetricsModel.find({ userId }).sort({ date: -1 });
  }

  async update(id: string, partial: any) {
    return UserMetricsModel.findByIdAndUpdate(id, partial, { new: true });
  }
}
