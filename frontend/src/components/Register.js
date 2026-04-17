import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { register } from '../api/api';
import { FiAlertCircle, FiUser, FiAtSign, FiMail, FiLock, FiFileText, FiMapPin, FiPhone, FiLink } from 'react-icons/fi';

export default function Register() {
  const nav = useNavigate();
  const [form, setForm] = useState({
    username: '', email: '', password: '', fullName: '',
    bio: '', location: '', website: '', phone: '',
  });
  const [error, setError]     = useState('');
  const [loading, setLoading] = useState(false);

  const handle = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await register(form);
      alert('Account created! Please sign in.');
      nav('/login');
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const Field = ({ label, name, type = 'text', placeholder, required = false, icon: Icon }) => (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1.5">
        {label} {required && <span className="text-red-400">*</span>}
      </label>
      <div className="relative">
        {Icon && (
          <Icon size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
        )}
        <input
          name={name}
          type={type}
          value={form[name]}
          onChange={handle}
          required={required}
          placeholder={placeholder}
          className={`w-full ${Icon ? 'pl-10' : 'px-4'} pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-300 transition text-sm`}
        />
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-black text-gray-900 tracking-tight">Nexus</h1>
          <p className="text-gray-400 mt-2 text-sm">Create your account</p>
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl p-8 shadow-sm">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Sign up</h2>

          {error && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-600 rounded-xl px-4 py-3 mb-5 text-sm">
              <FiAlertCircle size={15} className="shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={submit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Field label="Full Name" name="fullName" placeholder="Jane Doe"  required icon={FiUser}   />
              <Field label="Username"  name="username" placeholder="jane.doe"  required icon={FiAtSign} />
            </div>
            <Field label="Email"    name="email"    type="email"    placeholder="you@example.com" required icon={FiMail} />
            <Field label="Password" name="password" type="password" placeholder="••••••••"        required icon={FiLock} />

            <div className="pt-4 border-t border-gray-100">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                Optional info
              </p>
              <div className="space-y-4">
                <Field label="Bio"      name="bio"      placeholder="Tell the world about yourself…" icon={FiFileText} />
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Location" name="location" placeholder="City, Country"   icon={FiMapPin} />
                  <Field label="Phone"    name="phone"    placeholder="+1 234 567 8900" icon={FiPhone}  />
                </div>
                <Field label="Website" name="website" placeholder="https://yoursite.com" icon={FiLink} />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gray-900 text-white font-semibold py-2.5 rounded-xl hover:bg-gray-700 transition disabled:opacity-50 mt-2"
            >
              {loading ? 'Creating account…' : 'Create Account'}
            </button>
          </form>

          <p className="text-center text-gray-500 text-sm mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-gray-900 font-semibold hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}