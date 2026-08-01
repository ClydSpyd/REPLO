import React, { useState } from 'react';
import { loginUser } from '../utility/auth';
import { Link, useNavigate } from 'react-router-dom';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await loginUser(email, password);
      setLoading(false);
      navigate('/'); // Redirect to main view after login
    } catch (err) {
      setError('Login failed');
      setLoading(false);
    }
  };

  return (
    <div className="w-full">
      <p className="mb-1 text-sm text-[var(--accent-primary)] space-mono">
        WELCOME BACK
      </p>
      <h3 className="mb-6 text-5xl heading-three">SIGN IN</h3>

      <form className="flex flex-col gap-3" onSubmit={handleLogin}>
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
          {loading ? 'Logging in...' : 'Log in'}
        </button>
        {error && <div className="text-sm text-red-500">{error}</div>}
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
  );
}
