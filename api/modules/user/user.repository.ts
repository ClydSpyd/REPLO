import { UserModel } from "./user.model";
import { UserDocument, UserInput } from "./user.types";

export class UserRepository {
  async create(data: UserInput): Promise<UserDocument> {
    return UserModel.create(data);
  }

  async findByEmail(email: string): Promise<UserDocument | null> {
    return UserModel.findOne({ email });
    // return UserModel.findOne({ email }).exec();
  }

  async findByKeys(
    keys: Partial<UserInput>,
    matchAny?: boolean,
  ): Promise<UserDocument[]> {
    const filter = matchAny
      ? {
          $or: [
            ...Object.entries(keys).map(([key, value]) => ({ [key]: value })),
          ],
        }
      : keys;
    return UserModel.find(filter).select("-password");
  }
}
