import { UserMetricsRepository } from "./userMetrics.repository";
import { UserMetricsInput } from "./userMetrics.types";

export class UserMetricsService {
  private repository = new UserMetricsRepository();

  async createMetrics(data: UserMetricsInput) {
    return this.repository.create(data);
  }

  async getLatestMetrics(userId: string) {
    return this.repository.findLatest(userId);
  }

  async getMetricsHistory(userId: string) {
    return this.repository.findHistory(userId);
  }

  async updateMetrics(id: string, partial: Partial<UserMetricsInput>) {
    return this.repository.update(id, partial);
  }
}
