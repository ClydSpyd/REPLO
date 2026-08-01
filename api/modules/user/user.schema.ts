import { z } from "zod";

export const RegisterUserSchema = z
  .object({
    email: z.email(),
    password: z.string().min(6),
    repeatPassword: z.string(),
    username: z.string().min(3),
  })
  .refine((data) => data.password === data.repeatPassword, {
    message: "Passwords do not match",
    path: ["repeatPassword"],
  });

  export const loginUserSchema = z.object({
    email: z.email(),
    password: z.string().min(6),
  });