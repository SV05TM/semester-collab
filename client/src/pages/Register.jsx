import { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';

export default function Register({ onLogin }) {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data } = await api.post('/auth/register', { username, email, password });
      onLogin(data.user, data.token, true);
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-stone-50 text-slate-900">
      <div className="grid min-h-screen lg:grid-cols-[1fr_440px]">
        <section className="hidden bg-slate-950 px-10 py-12 text-white lg:flex lg:flex-col lg:justify-between">
          <div className="flex items-center gap-3">
            <BrandMark className="bg-teal-500 text-slate-950" />
            <span className="text-lg font-semibold">Semester Collab</span>
          </div>

          <div className="max-w-xl">
            <p className="mb-4 text-sm font-semibold uppercase text-teal-300">Start organized</p>
            <h1 className="text-5xl font-bold leading-tight">Give your semester team a clean place to plan from day one.</h1>
            <div className="mt-8 grid grid-cols-3 gap-3 text-sm text-slate-300">
              <Metric value="Tasks" label="Assign clear next steps" />
              <Metric value="Funds" label="Track event money" />
              <Metric value="Team" label="Keep people aligned" />
            </div>
          </div>

          <p className="text-sm text-slate-400">Create a workspace that can grow with your organization.</p>
        </section>

        <main className="flex items-center justify-center px-4 py-10">
          <div className="w-full max-w-md">
            <div className="mb-8 flex items-center gap-3 lg:hidden">
              <BrandMark className="bg-teal-700 text-white" />
              <span className="text-lg font-semibold">Semester Collab</span>
            </div>

            <div className="panel p-6 sm:p-8">
              <div className="mb-8">
                <p className="text-sm font-semibold text-teal-700">Create account</p>
                <h1 className="mt-2 text-3xl font-bold text-slate-950">Join Semester Collab</h1>
                <p className="mt-2 text-sm text-slate-500">Set up your account and invite your planning team later.</p>
              </div>

              {error && (
                <div className="mb-4 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 animate-fade-in">
                  <span className="mt-0.5 font-bold">!</span> {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label htmlFor="username" className="mb-1.5 block text-sm font-medium text-slate-700">Username</label>
                  <input
                    id="username"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="field-input"
                    placeholder="johndoe"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-slate-700">Email</label>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="field-input"
                    placeholder="you@university.edu"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-slate-700">Password</label>
                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="field-input"
                    placeholder="At least 6 characters"
                    required
                    minLength={6}
                  />
                  <p className="mt-1 text-xs text-slate-500">At least 6 characters</p>
                </div>
                <button type="submit" disabled={loading} className="primary-button w-full">
                  {loading ? 'Creating account...' : 'Create Account'}
                </button>
              </form>

              <p className="mt-6 text-center text-sm text-slate-600">
                Already have an account?{' '}
                <Link to="/login" className="font-semibold text-teal-700 hover:text-teal-800">Sign In</Link>
              </p>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

function BrandMark({ className }) {
  return (
    <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${className}`}>
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2" />
      </svg>
    </div>
  );
}

function Metric({ value, label }) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/5 p-4">
      <p className="text-xl font-bold text-white">{value}</p>
      <p>{label}</p>
    </div>
  );
}
