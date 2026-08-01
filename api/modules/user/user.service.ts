import { UserRepository } from "./user.repository";
import bcrypt from "bcryptjs";
import { UserDocument, UserInput } from "./user.types";

export class UserService {
  private repository = new UserRepository();

  async register(data: UserInput): Promise<UserDocument> {

    const existing = await this.repository.findByKeys(
      {
        email: data.email,
        username: data.username,
      },
      true,
    );

    if (existing.length > 0) {
      throw new Error("Email or username already in use");
    }

    const hashed = await bcrypt.hash(data.password, 10);
    const user = await this.repository.create({ ...data, password: hashed });
    return user;
  }

  async validateUser(
    email: string,
    password: string,
  ): Promise<UserDocument | null> {
    const user = await this.repository.findByEmail(email);
    if (!user) return null;
    const valid = await bcrypt.compare(password, user.password);
    return valid ? user : null;
  }

  async getUserData(keys: Partial<UserInput>): Promise<UserDocument | null> {
    const user = await this.repository.findByKeys(keys);
    console.log("Retrieved user data:", user);
    return user.length > 0 ? user[0] : null;
  }
}
