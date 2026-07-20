import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/axios';

const Register = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'Staff',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((current) => ({ ...current, [name]: value }));
  };

  const validateForm = () => {
    if (!formData.username.trim()) return 'Username is required.';
    if (!formData.email.trim()) return 'Email is required.';
    if (!formData.password) return 'Password is required.';
    if (!formData.confirmPassword) return 'Confirm password is required.';
    if (formData.password !== formData.confirmPassword) return 'Passwords do not match.';
    if (!formData.role) return 'Role is required.';
    return '';
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      setSuccess('');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const { confirmPassword, ...payload } = formData;
      await api.post('/api/auth/register', payload);

      setSuccess('Account created successfully! Redirecting to login...');
      setTimeout(() => navigate('/'), 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0a0f1e] px-4">
      <div className="auth-card w-full max-w-md p-8 shadow-2xl">
        <div className="mb-8 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg bg-[#22c55e] text-xl font-bold text-white">I</div>
          <h1 className="mt-4 text-3xl font-bold text-white">Create Account</h1>
          <p className="mt-2 text-sm text-slate-400">Register a new IMS account</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="auth-label" htmlFor="username">Username</label>
            <input id="username" type="text" name="username" value={formData.username} onChange={handleChange} className="auth-input" required />
          </div>

          <div>
            <label className="auth-label" htmlFor="email">Email</label>
            <input id="email" type="email" name="email" value={formData.email} onChange={handleChange} className="auth-input" required />
          </div>

          <div>
            <label className="auth-label" htmlFor="password">Password</label>
            <input id="password" type="password" name="password" value={formData.password} onChange={handleChange} className="auth-input" required />
          </div>

          <div>
            <label className="auth-label" htmlFor="confirmPassword">Confirm Password</label>
            <input id="confirmPassword" type="password" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} className="auth-input" required />
          </div>

          <div>
            <label className="auth-label" htmlFor="role">Role</label>
            <select id="role" name="role" value={formData.role} onChange={handleChange} className="auth-input" required>
              <option value="Admin">Admin</option>
              <option value="Staff">Staff</option>
            </select>
          </div>

          <button type="submit" disabled={loading} className="btn-success w-full rounded-lg py-3 disabled:opacity-70">
            {loading ? 'Registering...' : 'Register'}
          </button>

          {error ? <div className="rounded-lg border border-red-400/30 bg-red-500/10 px-3 py-2 text-sm text-red-400">{error}</div> : null}
          {success ? <div className="rounded-lg border border-green-400/30 bg-green-500/10 px-3 py-2 text-sm text-green-400">{success}</div> : null}
        </form>

        <p className="mt-6 text-center text-sm text-slate-400">
          Already have an account?{' '}
          <Link to="/" className="font-semibold text-[#3b82f6] hover:underline">
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
