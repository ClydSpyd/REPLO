import { z } from 'zod';

/**
 * New-account form values and the `POST /user/register` request body — the
 * single source of truth for both the web client's field validation and the
 * API's request validation.
 */
export const registerSchema = z
  .object({
    email: z.email({ error: 'Enter a valid email address' }),
    username: z.string().min(3, 'Username must be at least 3 characters'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    repeatPassword: z.string(),
  })
  .refine((data) => data.password === data.repeatPassword, {
    // Attaches the error to the confirm field rather than the form root.
    error: 'Passwords do not match',
    path: ['repeatPassword'],
  });

export type RegisterInput = z.infer<typeof registerSchema>;

/** Sign-in form values and the `POST /user/login` request body. */
export const loginSchema = z.object({
  email: z.email({ error: 'Enter a valid email address' }),
  password: z.string().min(1, 'Password is required'),
});

export type LoginInput = z.infer<typeof loginSchema>;
