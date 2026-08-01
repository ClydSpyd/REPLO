import { Request } from "express";

export interface AuthenticatedRequest extends Request {
  user: {
    id: string;
    email: string;
  };
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}
