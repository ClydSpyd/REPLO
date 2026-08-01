import { TokenPair } from "../../types/auth";
import { UserDocument } from "./user.types";


/**
 * Creates a pair of JWT tokens (access and refresh).
 * @param user - User object containing _id and email
 * @param jwtSecret - Secret for signing JWTs
 * @param refreshSecret - Secret for signing refresh JWTs
 * @returns TokenPair with accessToken and refreshToken
 */
export function createTokenPair(
  user: UserDocument,
  jwtSecret: string,
  refreshSecret: string
): TokenPair {
  const jwt = require('jsonwebtoken');
  const accessToken = jwt.sign({ id: user._id, email: user.email }, jwtSecret, { expiresIn: '7d' });
  const refreshToken = jwt.sign({ id: user._id, email: user.email }, refreshSecret, { expiresIn: '30d' });
  return {
    accessToken,
    refreshToken,
  };
}
