'use client';

import { FormEvent, useEffect, useState } from 'react';
import { LockKeyhole, ShieldCheck, Sparkles } from 'lucide-react';

const AUTH_STORAGE_KEY = 'revolte-feedback-authenticated';
const AUTH_TTL_MS = 10 * 60 * 1000;
const PASSWORD_HASH = 'd82f14a38fae8eaee4a84aa74327ace7610799bfe96657c92ff064dae8bdee44';

async function hashPassword(password: string) {
  const bytes = new TextEncoder().encode(password);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('');
}

export default function AuthGate({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    let expiryTimer: number | undefined;
    const frame = window.requestAnimationFrame(() => {
      const expiresAt = Number(window.localStorage.getItem(AUTH_STORAGE_KEY));
      const validSession = Number.isFinite(expiresAt) && expiresAt > Date.now();
      setAuthenticated(validSession);
      setReady(true);
      if (validSession) {
        expiryTimer = window.setTimeout(() => {
          window.localStorage.removeItem(AUTH_STORAGE_KEY);
          setAuthenticated(false);
        }, expiresAt - Date.now());
      } else {
        window.localStorage.removeItem(AUTH_STORAGE_KEY);
      }
    });
    return () => {
      window.cancelAnimationFrame(frame);
      if (expiryTimer) window.clearTimeout(expiryTimer);
    };
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setChecking(true);
    setError('');
    const valid = (await hashPassword(password)) === PASSWORD_HASH;
    if (valid) {
      window.localStorage.setItem(AUTH_STORAGE_KEY, String(Date.now() + AUTH_TTL_MS));
      setAuthenticated(true);
      window.setTimeout(() => {
        window.localStorage.removeItem(AUTH_STORAGE_KEY);
        setAuthenticated(false);
      }, AUTH_TTL_MS);
      setPassword('');
    } else {
      setError('That password is not valid. Try again.');
    }
    setChecking(false);
  }

  if (!ready) return <div className="auth-loading" aria-label="Loading authentication" />;
  if (authenticated) return <>{children}</>;

  return <main className="auth-screen"><section className="auth-card" aria-labelledby="auth-title"><div className="auth-brand"><span className="brand-mark"><Sparkles size={15} /></span><span>feedback<span className="brand-accent">desk</span></span></div><div className="auth-icon"><LockKeyhole size={22} /></div><p className="eyebrow">REVOLTE.AI / PRIVATE WORKSPACE</p><h1 id="auth-title">Welcome back</h1><p className="auth-description">Enter the workspace password to access the Overview and Issues dashboard.</p><form onSubmit={handleSubmit}><label htmlFor="workspace-password">Workspace password</label><input id="workspace-password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" autoFocus required aria-invalid={Boolean(error)} aria-describedby={error ? 'auth-error' : 'auth-note'} /><button className="primary-button auth-submit" type="submit" disabled={checking}>{checking ? 'Checking…' : 'Access workspace'}</button>{error ? <p className="auth-error" id="auth-error" role="alert">{error}</p> : <p className="auth-note" id="auth-note"><ShieldCheck size={13} /> Access is verified in this browser.</p>}</form></section></main>;
}
