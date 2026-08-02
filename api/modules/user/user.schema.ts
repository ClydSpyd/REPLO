/**
 * Auth validation lives in @replo/shared so the web client and this API
 * validate register/login against the same rules. Re-exported here under
 * the names the controllers already use.
 */
export {
  registerSchema as RegisterUserSchema,
  loginSchema as loginUserSchema,
} from "@replo/shared";
