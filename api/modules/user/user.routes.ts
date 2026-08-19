import { Router } from "express";
import { register, login, refresh, getUserData } from "./user.controller";
import { authMiddleware } from "../../middleware/auth.middleware";

const router = Router();

/**
 * POST /api/user/register
 * Register a new user.
 * Payload: UserInput
 */
router.post("/register", register);

/**
 * POST /api/user/login
 * Login and receive JWT.
 * Payload: { email, password }
 */
router.post("/login", login);

/**
 * POST /api/user/refresh
 * Exchange a valid refresh token for a new access token.
 * Payload: { refreshToken }
 */
router.post("/refresh", refresh);

/**
* GET /api/user/me
* Auth required. Get current user info.
*/
router.get("/me", authMiddleware, getUserData);

export default router;
