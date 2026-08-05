import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  loginSchema,
  validate,
  type FieldErrors,
  type LoginInput,
} from '@replo/shared';
import { loginUser } from '../utility/auth';
import BarsLogo from '../components/ui/BarsLogo';

const EMPTY_FORM: LoginInput = { email: '', password: '' };

const inputBase =
  'w-full rounded-md border bg-[var(--dark-one)] p-3 text-[var(--text-strong)] placeholder:text-[var(--contrast-two)]';

export default function Login() {
  const [form, setForm] = useState<LoginInput>(EMPTY_FORM);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const navigate = useNavigate();

  const update =
    (field: keyof LoginInput) => (e: React.ChangeEvent<HTMLInputElement>) => {
      const { value } = e.target;
      setForm((prev) => ({ ...prev, [field]: value }));
      setErrors((prev) => (prev[field] ? { ...prev, [field]: '' } : prev));
    };

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitError('');

    const result = validate(loginSchema, form);
    if (!result.success) {
      setErrors(result.errors);
      return;
    }
    setErrors({});

    setLoading(true);
    try {
      await loginUser(result.data);
      navigate('/'); // Redirect to main view after login
    } catch (err) {
      setSubmitError((err as { message: string }).message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const borderClass = (field: keyof LoginInput) =>
    errors[field] ? 'border-red-500' : 'border-[var(--contrast-one)]';

  return (
    <>
      <div className="mt-[-15vh] mb-10 w-full lg:hidden flex flex-col items-center justify-center">
        <BarsLogo
          size={80}
          cornerRadius={3}
        />
        <h1 className="text-5xl font-extrabold text-[var(--text-strong)] tracking-normal">
          REPLO
        </h1>
      </div>
      <div className="w-full bg-[var(--dark-two)] rounded-2xl p-6">
        <p className="mb-1 text-sm text-[var(--accent-primary)] space-mono">
          WELCOME BACK
        </p>
        <h3 className="mb-6 text-5xl heading-three">SIGN IN</h3>

        <form className="flex flex-col gap-3" onSubmit={handleLogin} noValidate>
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
          <button
            type="submit"
            className="mt-2 w-full rounded-md bg-[var(--accent-primary)] p-3 font-semibold text-[var(--text-contrast)] disabled:opacity-60"
            disabled={loading}
          >
            {loading ? 'Logging in...' : 'Log in'}
          </button>
          {submitError && (
            <div className="text-sm text-red-500">{submitError}</div>
          )}
        </form>

        <p className="mt-6 text-sm text-[var(--contrast-three)]">
          Don't have an account?{' '}
          <Link
            to="/signup"
            className="font-medium text-[var(--accent-primary)] hover:underline"
          >
            Sign up
          </Link>
        </p>
      </div>
    </>
  );
}
