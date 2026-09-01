import { useState } from 'react';
import { ShieldCheck, Mail, Lock, UserRound, Spade } from 'lucide-react';
import { supabase } from '../lib/supabase';

export default function Auth() {
  const [mode, setMode] = useState('signin');
  const [name, setName] = useState(''); const [email, setEmail] = useState(''); const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false); const [message, setMessage] = useState(''); const [error, setError] = useState('');
  const submit = async e => {
    e.preventDefault(); setBusy(true); setError(''); setMessage('');
    try {
      if (mode === 'signup') {
        const { data, error } = await supabase.auth.signUp({ email, password, options: { data: { display_name: name.trim() } } });
        if (error) throw error;
        setMessage(data.session ? 'Account created. Welcome to the table.' : 'Account created. Check your email to confirm your address.');
      } else if (mode === 'reset') {
        const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: window.location.origin });
        if (error) throw error; setMessage('Password reset email sent.');
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (err) { setError(err.message || 'Authentication failed.'); } finally { setBusy(false); }
  };
  return <div className="auth-page"><section className="auth-brand"><div className="auth-logo"><Spade/> COUNTEDGE</div><h1>Train the count.<br/>Master the table.</h1><p>Blackjack, Hi-Lo counting, true-count conversion and strategy training — with your progress synced to your account.</p><div className="auth-trust"><ShieldCheck size={18}/> Your training data is private to your account.</div></section><section className="auth-card"><div><span className="eyebrow">PLAYER ACCESS</span><h2>{mode==='signup'?'Create your account':mode==='reset'?'Reset password':'Welcome back'}</h2><p>{mode==='signup'?'Start building your training history.':mode==='reset'?'We’ll send you a secure reset link.':'Continue your card-counting training.'}</p></div><form onSubmit={submit}>{mode==='signup'&&<label>Display name<div className="auth-input"><UserRound size={18}/><input value={name} onChange={e=>setName(e.target.value)} required placeholder="Your name" /></div></label>}<label>Email<div className="auth-input"><Mail size={18}/><input type="email" value={email} onChange={e=>setEmail(e.target.value)} required placeholder="you@example.com" autoComplete="email"/></div></label>{mode!=='reset'&&<label>Password<div className="auth-input"><Lock size={18}/><input type="password" value={password} onChange={e=>setPassword(e.target.value)} required minLength={6} placeholder="Minimum 6 characters" autoComplete={mode==='signup'?'new-password':'current-password'}/></div></label>}{error&&<div className="auth-error">{error}</div>}{message&&<div className="auth-message">{message}</div>}<button className="gold-btn auth-submit" disabled={busy}>{busy?'Working…':mode==='signup'?'Create Account':mode==='reset'?'Send Reset Link':'Sign In'}</button></form><div className="auth-links">{mode==='signin'&&<button onClick={()=>setMode('reset')}>Forgot password?</button>}<button onClick={()=>setMode(mode==='signup'?'signin':'signup')}>{mode==='signup'?'Already have an account? Sign in':'New player? Create account'}</button>{mode==='reset'&&<button onClick={()=>setMode('signin')}>Back to sign in</button>}</div></section></div>;
}
