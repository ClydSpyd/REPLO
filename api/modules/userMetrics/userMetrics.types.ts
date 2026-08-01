export interface UserMetricsInput {
  userId: string;
  date?: Date;
  weight?: number;
  bmi?: number;
  bodyFat?: number;
  personalBests?: Record<string, number>;
}

export interface UserMetricsDocument extends UserMetricsInput {
  _id: string;
}
