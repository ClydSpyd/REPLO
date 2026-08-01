import { Router } from "express";
import { register, login, getUserData } from "./user.controller";
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
* GET /api/user/me
* Auth required. Get current user info.
*/
router.get("/me", authMiddleware, getUserData);

export default router;
