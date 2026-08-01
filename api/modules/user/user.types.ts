import { Document, Types } from "mongoose";

export interface UserInput {
  email: string;
  password: string;
  repeatPassword: string;
  username: string;
}

export interface UserDocument extends Document {
  email: string;
  password: string;
  username: string;
  createdAt: Date;
  profilePictureUrl?: string;
  _id: Types.ObjectId;
}