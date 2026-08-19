import jwt from "jsonwebtoken";
import { TokenPair } from "../../types/auth";
import { UserDocument } from "./user.types";

// Shape of the claims we sign into both token types.
interface TokenPayload {
  id: string;
  email: string;
}

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
  const accessToken = createAccessToken({ id: String(user._id), email: user.email }, jwtSecret);
  const refreshToken = jwt.sign({ id: String(user._id), email: user.email }, refreshSecret, { expiresIn: '30d' });
  return {
    accessToken,
    refreshToken,
  };
}

/**
 * Signs a short-lived access token from an existing payload.
 * @param payload - id/email claims to embed
 * @param jwtSecret - Secret for signing the access JWT
 */
export function createAccessToken(payload: TokenPayload, jwtSecret: string): string {
  return jwt.sign({ id: payload.id, email: payload.email }, jwtSecret, { expiresIn: '7d' });
}

/**
 * Verifies a refresh token and returns its payload.
 * Throws if the token is invalid or expired.
 * @param refreshToken - The refresh JWT presented by the client
 * @param refreshSecret - Secret the refresh JWT was signed with
 */
export function verifyRefreshToken(refreshToken: string, refreshSecret: string): TokenPayload {
  const decoded = jwt.verify(refreshToken, refreshSecret) as jwt.JwtPayload;
  return { id: decoded.id, email: decoded.email };
}
