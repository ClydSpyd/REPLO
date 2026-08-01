import React, { useState } from 'react';
import { registerUser } from '../utility/auth';
import { Link, useNavigate } from 'react-router-dom';

export default function Signup() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSignup = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await registerUser(email, password);
      setLoading(false);
      navigate('/'); // Redirect to main view after signing up
    } catch (err) {
      setError('Registration failed');
      setLoading(false);
    }
  };

  return (
    <div className="w-full">
      <h2 className="mb-1 text-2xl font-bold text-white">Create your account</h2>
      <p className="mb-6 text-sm text-[var(--contrast-three)]">
        Start tracking your workouts today.
      </p>

      <form className="flex flex-col gap-3" onSubmit={handleSignup}>
        <input
          type="text"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded-md border border-[var(--contrast-one)] bg-[var(--dark-one)] p-3 text-white placeholder:text-[var(--contrast-two)]"
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full rounded-md border border-[var(--contrast-one)] bg-[var(--dark-one)] p-3 text-white placeholder:text-[var(--contrast-two)]"
        />
        <button
          type="submit"
          className="mt-2 w-full rounded-md bg-[var(--accent-primary)] p-3 font-semibold text-black disabled:opacity-60"
          disabled={loading}
        >
          {loading ? 'Creating account...' : 'Sign up'}
        </button>
        {error && <div className="text-sm text-red-500">{error}</div>}
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
  );
}
