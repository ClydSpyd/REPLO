import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  registerSchema,
  validate,
  type FieldErrors,
  type RegisterInput,
} from '@replo/shared';
import { registerUser } from '../utility/auth';
import BarsLogo from '../components/ui/BarsLogo';

const EMPTY_FORM: RegisterInput = {
  email: '',
  username: '',
  password: '',
  repeatPassword: '',
};

const inputBase =
  'w-full rounded-md border bg-[var(--dark-one)] p-3 text-[var(--text-strong)] placeholder:text-[var(--contrast-two)]';

export default function Signup() {
  const [form, setForm] = useState<RegisterInput>(EMPTY_FORM);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const navigate = useNavigate();

  const update =
    (field: keyof RegisterInput) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const { value } = e.target;
      setForm((prev) => ({ ...prev, [field]: value }));
      // Clear the field's error as the user corrects it.
      setErrors((prev) => (prev[field] ? { ...prev, [field]: '' } : prev));
    };

  const handleSignup = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitError('');

    const result = validate(registerSchema, form);
    if (!result.success) {
      setErrors(result.errors);
      return;
    }
    setErrors({});

    setLoading(true);
    try {
      await registerUser(result.data);
      navigate('/'); // Redirect to main view after signing up
    } catch (err) {
      setSubmitError((err as { message: string }).message);
    } finally {
      setLoading(false);
    }
  };

  const borderClass = (field: keyof RegisterInput) =>
    errors[field] ? 'border-red-500' : 'border-[var(--contrast-one)]';

  return (
    <>
      <div className="mt-[-15vh] mb-10 w-full lg:hidden flex flex-col items-center justify-center">
        <BarsLogo size={80} cornerRadius={3} />
        <h1 className="text-5xl font-extrabold text-[var(--text-strong)] tracking-normal">
          REPLO
        </h1>
      </div>
      <div className="w-full bg-[var(--dark-two)] rounded-2xl p-6">
        <h2 className="mb-1 text-2xl font-bold text-[var(--text-strong)]">
          Create your account
        </h2>
        <p className="mb-6 text-sm text-[var(--contrast-three)]">
          Start tracking your workouts today.
        </p>

        <form
          className="flex flex-col gap-3"
          onSubmit={handleSignup}
          noValidate
        >
          <div>
            <input
              type="email"
              placeholder="Email"
              value={form.email}
              onChange={update('email')}
              className={`${inputBase} ${borderClass('email')}`}
            />
            {errors.email && (
              <p className="mt-1 text-xs text-red-500">{errors.email}</p>
            )}
          </div>
          <div>
            <input
              type="text"
              placeholder="Username"
              value={form.username}
              onChange={update('username')}
              className={`${inputBase} ${borderClass('username')}`}
            />
            {errors.username && (
              <p className="mt-1 text-xs text-red-500">{errors.username}</p>
            )}
          </div>
          <div>
            <input
              type="password"
              placeholder="Password"
              value={form.password}
              onChange={update('password')}
              className={`${inputBase} ${borderClass('password')}`}
            />
            {errors.password && (
              <p className="mt-1 text-xs text-red-500">{errors.password}</p>
            )}
          </div>
          <div>
            <input
              type="password"
              placeholder="Repeat Password"
              value={form.repeatPassword}
              onChange={update('repeatPassword')}
              className={`${inputBase} ${borderClass('repeatPassword')}`}
            />
            {errors.repeatPassword && (
              <p className="mt-1 text-xs text-red-500">
                {errors.repeatPassword}
              </p>
            )}
          </div>
          <button
            type="submit"
            className="mt-2 w-full rounded-md bg-[var(--accent-primary)] p-3 font-semibold text-[var(--text-contrast)] disabled:opacity-60"
            disabled={loading}
          >
            {loading ? 'Creating account...' : 'Sign up'}
          </button>
          {submitError && (
            <div className="text-sm text-red-500">{submitError}</div>
          )}
        </form>

        <p className="mt-6 text-sm text-[var(--contrast-three)]">
          Already have an account?{' '}
          <Link
            to="/login"
            className="font-medium text-[var(--accent-primary)] hover:underline"
          >
            Log in
          </Link>
        </p>
      </div>
    </>
  );
}
