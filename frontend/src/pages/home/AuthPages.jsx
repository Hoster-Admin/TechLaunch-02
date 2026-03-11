import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Input, Button } from '../../components/ui';
import toast from 'react-hot-toast';

// ══════════════════════════════════════════════
// LOGIN PAGE
// ══════════════════════════════════════════════
export function LoginPage() {
  const { login } = useAuth();
  const navigate  = useNavigate();
  const location  = useLocation();
  const from      = location.state?.from || '/';
  const [form, setForm]   = useState({ email:'', password:'' });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const set = k => e => setForm(p => ({ ...p, [k]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!form.email)    errs.email    = 'Email required';
    if (!form.password) errs.password = 'Password required';
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setLoading(true);
    try {
      const user = await login(form.email, form.password);
      toast.success(`Welcome back, ${user.name.split(' ')[0]}!`);
      navigate(user.role === 'admin' || user.role === 'moderator' ? '/admin' : from, { replace: true });
    } catch (err) {
      setErrors({ general: err.response?.data?.message || 'Login failed' });
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-6">
            <div className="w-10 h-10 rounded-xl bg-brand flex items-center justify-center">
              <span className="text-white font-black">T</span>
            </div>
            <span className="font-black text-ink text-xl">Tech Launch</span>
          </Link>
          <h1 className="text-2xl font-bold text-ink">Welcome back</h1>
          <p className="text-gray-500 text-sm mt-1">Sign in to your account</p>
        </div>

        <div className="card p-8">
          {errors.general && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl mb-5">{errors.general}</div>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input label="Email" type="email" value={form.email} onChange={set('email')} error={errors.email} placeholder="you@example.com" autoComplete="email"/>
            <Input label="Password" type="password" value={form.password} onChange={set('password')} error={errors.password} placeholder="Your password" autoComplete="current-password"/>
            <Button type="submit" loading={loading} className="w-full" size="lg">Sign In</Button>
          </form>
          <p className="text-center text-sm text-gray-500 mt-5">
            Don't have an account?{' '}
            <Link to="/register" className="text-brand font-semibold hover:underline">Join Tech Launch</Link>
          </p>
          <div className="mt-4 pt-4 border-t border-gray-100 text-xs text-gray-400 text-center">
            Demo: admin@techlaunch.io / admin123
          </div>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════
// REGISTER PAGE
// ══════════════════════════════════════════════
const PERSONAS  = ['Founder','Investor','Product Manager','Accelerator','Enthusiast'];
const COUNTRIES = ['Saudi Arabia','UAE','Egypt','Jordan','Morocco','Kuwait','Other'];

export function RegisterPage() {
  const { register } = useAuth();
  const navigate     = useNavigate();
  const [form, setForm]   = useState({ name:'', handle:'', email:'', password:'', persona:'Founder', country:'' });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const set = k => e => setForm(p => ({ ...p, [k]: e.target.value }));

  const validate = () => {
    const errs = {};
    if (!form.name.trim())     errs.name     = 'Name required';
    if (!form.handle.trim())   errs.handle   = 'Handle required';
    if (!/^[a-zA-Z0-9_]+$/.test(form.handle)) errs.handle = 'Only letters, numbers, underscores';
    if (!form.email)           errs.email    = 'Email required';
    if (form.password.length < 8) errs.password = 'Minimum 8 characters';
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setLoading(true);
    try {
      await register(form);
      toast.success('Welcome to Tech Launch! 🚀');
      navigate('/');
    } catch (err) {
      setErrors({ general: err.response?.data?.message || 'Registration failed' });
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-6">
            <div className="w-10 h-10 rounded-xl bg-brand flex items-center justify-center">
              <span className="text-white font-black">T</span>
            </div>
            <span className="font-black text-ink text-xl">Tech Launch</span>
          </Link>
          <h1 className="text-2xl font-bold text-ink">Join the community</h1>
          <p className="text-gray-500 text-sm mt-1">MENA's premier product discovery platform</p>
        </div>

        <div className="card p-8">
          {errors.general && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl mb-5">{errors.general}</div>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <Input label="Full Name" value={form.name} onChange={set('name')} error={errors.name} placeholder="Sara Al-Mahmoud"/>
              <div>
                <Input label="Handle" value={form.handle} onChange={set('handle')} error={errors.handle} placeholder="sara_builds"/>
                <p className="text-xs text-gray-400 mt-1">@{form.handle || 'yourhandle'}</p>
              </div>
            </div>
            <Input label="Email" type="email" value={form.email} onChange={set('email')} error={errors.email} placeholder="you@example.com"/>
            <Input label="Password" type="password" value={form.password} onChange={set('password')} error={errors.password} placeholder="Min. 8 characters"/>
            <div>
              <label className="label">I am a…</label>
              <div className="grid grid-cols-3 gap-2">
                {PERSONAS.map(p => (
                  <button key={p} type="button"
                    className={`py-2 px-3 rounded-xl border-2 text-xs font-semibold transition-all ${form.persona===p?'border-brand bg-brand/10 text-brand':'border-gray-200 text-gray-600 hover:border-gray-300'}`}
                    onClick={() => setForm(f => ({ ...f, persona: p }))}>
                    {p}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="label">Country</label>
              <select className="input" value={form.country} onChange={set('country')}>
                <option value="">Select country</option>
                {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <Button type="submit" loading={loading} className="w-full" size="lg">Create Account 🚀</Button>
          </form>
          <p className="text-center text-sm text-gray-500 mt-5">
            Already have an account?{' '}
            <Link to="/login" className="text-brand font-semibold hover:underline">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
