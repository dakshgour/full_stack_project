import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { BrowserRouter, Link, Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { api } from './api.js';
import VisualizerWorkspace, { detectCodeTarget } from './legacyAppSource.jsx';

const AuthContext = createContext(null);

function useAuth() {
  return useContext(AuthContext);
}

function AuthProvider({ children }) {
  const [token, setToken] = useState(() => window.localStorage.getItem('dsa_token') || '');
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(Boolean(token));

  useEffect(() => {
    let active = true;
    if (!token) {
      setLoading(false);
      setUser(null);
      return undefined;
    }

    setLoading(true);
    api.me(token)
      .then((data) => {
        if (active) setUser(data.user);
      })
      .catch(() => {
        if (active) {
          setToken('');
          setUser(null);
          window.localStorage.removeItem('dsa_token');
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [token]);

  const value = useMemo(() => ({
    token,
    user,
    loading,
    authenticated: Boolean(token && user),
    async login(credentials) {
      const data = await api.login(credentials);
      window.localStorage.setItem('dsa_token', data.token);
      setToken(data.token);
      setUser(data.user);
      return data.user;
    },
    async signup(payload) {
      const data = await api.signup(payload);
      // Signup no longer returns a token — returns email for verification
      return data;
    },
    setTokenAndUser(newToken, newUser) {
      window.localStorage.setItem('dsa_token', newToken);
      setToken(newToken);
      setUser(newUser);
    },
    logout() {
      window.localStorage.removeItem('dsa_token');
      setToken('');
      setUser(null);
    },
  }), [loading, token, user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

function ProtectedRoute({ children }) {
  const auth = useAuth();
  const location = useLocation();
  if (auth.loading) return <div className="page-shell muted-card">Loading account…</div>;
  if (!auth.authenticated) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  return children;
}

function Shell() {
  const auth = useAuth();
  const navigate = useNavigate();

  return (
    <div className="site-frame">
      <header className="site-nav">
        <div>
          <strong>DSA Visualizer Full Stack</strong>
          <p>Frontend demo mode plus saved work, API execution, and dashboard flows.</p>
        </div>
        <nav>
          <Link to="/">Visualizer</Link>
          <Link to="/dashboard">Dashboard</Link>
          {auth.authenticated ? (
            <>
              <span className="nav-user">{auth.user.name}</span>
              <button type="button" onClick={() => { auth.logout(); navigate('/'); }}>Logout</button>
            </>
          ) : (
            <>
              <Link to="/login">Login</Link>
              <Link to="/signup">Signup</Link>
            </>
          )}
        </nav>
      </header>

      <Routes>
        <Route path="/" element={<VisualizerPage />} />
        <Route path="/login" element={<AuthPage mode="login" />} />
        <Route path="/signup" element={<AuthPage mode="signup" />} />
        <Route path="/verify-email" element={<VerifyEmailPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
      </Routes>
    </div>
  );
}

function VisualizerPage() {
  const auth = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [flash, setFlash] = useState('');

  const initialWorkspace = location.state?.workspace || null;

  async function handleSaveCode(payload) {
    const response = await api.createCode(auth.token, payload);
    setFlash(`Saved "${response.code.title}" successfully.`);
    return response.code;
  }

  async function handleRemoteExecute(payload) {
    const response = await api.executeCode(auth.token, payload);
    await api.saveVisualization(auth.token, {
      pattern: response.result.patternDetected,
      savedCodeId: payload.savedCodeId || null,
      input: { raw: payload.inputOverride },
      steps: response.result.steps,
    });
    setFlash(`Server execution stored for ${response.result.patternDetected}.`);
    return response.result;
  }

  return (
    <div className="page-shell">
      <div className="banner-row">
        <div className="muted-card">
          <strong>{auth.authenticated ? 'Account connected' : 'Demo mode active'}</strong>
          <p>{auth.authenticated ? 'Save code, execute through the API, and review progress in the dashboard.' : 'Local visualization still works. Sign in to save code and use the backend execution pipeline.'}</p>
        </div>
        {flash ? <div className="flash-card">{flash}</div> : null}
      </div>
      <VisualizerWorkspace
        initialWorkspace={initialWorkspace}
        canPersist={auth.authenticated}
        onSaveCode={handleSaveCode}
        onRemoteExecute={handleRemoteExecute}
        onAuthRequest={() => navigate('/login', { state: { from: '/' } })}
      />
    </div>
  );
}

function AuthPage({ mode }) {
  const auth = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const isSignup = mode === 'signup';

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (isSignup) {
        if (form.name.trim().length < 2) throw new Error('Name must be at least 2 characters');
        await auth.signup(form);
        // Redirect to verify-email page with email in state
        navigate('/verify-email', { state: { email: form.email } });
      } else {
        await auth.login({ email: form.email, password: form.password });
        navigate(location.state?.from || '/dashboard');
      }
    } catch (nextError) {
      setError(nextError.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="page-shell auth-page">
      <form className="auth-card" onSubmit={handleSubmit}>
        <span className="eyebrow">{isSignup ? 'Create account' : 'Welcome back'}</span>
        <h1>{isSignup ? 'Signup for saved work and execution logs' : 'Login to unlock API features'}</h1>
        {isSignup ? (
          <label>
            <span>Name</span>
            <input value={form.name} onChange={(event) => setForm((value) => ({ ...value, name: event.target.value }))} />
          </label>
        ) : null}
        <label>
          <span>Email</span>
          <input type="email" value={form.email} onChange={(event) => setForm((value) => ({ ...value, email: event.target.value }))} />
        </label>
        <label>
          <span>Password</span>
          <input type="password" value={form.password} onChange={(event) => setForm((value) => ({ ...value, password: event.target.value }))} />
        </label>
        {error ? <p className="form-error">{error}</p> : null}
        <button className="wide-button" type="submit" disabled={loading}>
          {loading ? 'Working…' : isSignup ? 'Create account' : 'Login'}
        </button>
        {!isSignup ? (
          <p style={{ marginTop: '12px', fontSize: '14px', textAlign: 'center' }}>
            <Link to="/forgot-password" style={{ color: 'var(--accent, #58a6ff)' }}>Forgot your password?</Link>
          </p>
        ) : null}
      </form>
    </div>
  );
}

function VerifyEmailPage() {
  const auth = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const email = location.state?.email || '';

  // Redirect if no email in state
  if (!email) return <Navigate to="/signup" replace />;

  async function handleVerify(event) {
    event.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);
    try {
      const data = await api.verifyEmail({ email, otp });
      auth.setTokenAndUser(data.token, data.user);
      navigate('/dashboard');
    } catch (nextError) {
      setError(nextError.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    setError('');
    setMessage('');
    try {
      await api.resendOtp({ email });
      setMessage('New OTP sent to your email.');
    } catch (nextError) {
      setError(nextError.message);
    }
  }

  return (
    <div className="page-shell auth-page">
      <form className="auth-card" onSubmit={handleVerify}>
        <span className="eyebrow">Verify your email</span>
        <h1>Enter the 6-digit code sent to {email}</h1>
        <label>
          <span>Verification Code</span>
          <input
            type="text"
            maxLength={6}
            value={otp}
            onChange={(event) => setOtp(event.target.value.replace(/\D/g, '').slice(0, 6))}
            placeholder="000000"
            style={{ letterSpacing: '6px', fontSize: '24px', textAlign: 'center' }}
          />
        </label>
        {error ? <p className="form-error">{error}</p> : null}
        {message ? <p style={{ color: '#29d765', fontSize: '14px' }}>{message}</p> : null}
        <button className="wide-button" type="submit" disabled={loading || otp.length !== 6}>
          {loading ? 'Verifying…' : 'Verify Email'}
        </button>
        <p style={{ marginTop: '12px', fontSize: '14px', textAlign: 'center' }}>
          Didn&apos;t receive the code?{' '}
          <button type="button" onClick={handleResend} style={{ background: 'none', border: 'none', color: 'var(--accent, #58a6ff)', cursor: 'pointer', textDecoration: 'underline', padding: 0, fontSize: '14px' }}>
            Resend OTP
          </button>
        </p>
      </form>
    </div>
  );
}

function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setLoading(true);
    try {
      await api.forgotPassword({ email });
      setSent(true);
    } catch (nextError) {
      setError(nextError.message);
    } finally {
      setLoading(false);
    }
  }

  if (sent) {
    return (
      <div className="page-shell auth-page">
        <div className="auth-card">
          <span className="eyebrow">Check your email</span>
          <h1>Reset code sent to {email}</h1>
          <p style={{ color: '#aaa', marginBottom: '16px' }}>If this email is registered, you&apos;ll receive a 6-digit reset code.</p>
          <button className="wide-button" type="button" onClick={() => navigate('/reset-password', { state: { email } })}>
            Enter Reset Code
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="page-shell auth-page">
      <form className="auth-card" onSubmit={handleSubmit}>
        <span className="eyebrow">Forgot password</span>
        <h1>Enter your email to receive a reset code</h1>
        <label>
          <span>Email</span>
          <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} />
        </label>
        {error ? <p className="form-error">{error}</p> : null}
        <button className="wide-button" type="submit" disabled={loading}>
          {loading ? 'Sending…' : 'Send Reset Code'}
        </button>
        <p style={{ marginTop: '12px', fontSize: '14px', textAlign: 'center' }}>
          <Link to="/login" style={{ color: 'var(--accent, #58a6ff)' }}>Back to login</Link>
        </p>
      </form>
    </div>
  );
}

function ResetPasswordPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    email: location.state?.email || '',
    otp: '',
    newPassword: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setLoading(true);
    try {
      await api.resetPassword(form);
      navigate('/login', { state: { message: 'Password reset successfully. Please login with your new password.' } });
    } catch (nextError) {
      setError(nextError.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="page-shell auth-page">
      <form className="auth-card" onSubmit={handleSubmit}>
        <span className="eyebrow">Reset password</span>
        <h1>Enter the code from your email and your new password</h1>
        <label>
          <span>Email</span>
          <input type="email" value={form.email} onChange={(event) => setForm((v) => ({ ...v, email: event.target.value }))} />
        </label>
        <label>
          <span>Reset Code</span>
          <input
            type="text"
            maxLength={6}
            value={form.otp}
            onChange={(event) => setForm((v) => ({ ...v, otp: event.target.value.replace(/\D/g, '').slice(0, 6) }))}
            placeholder="000000"
            style={{ letterSpacing: '6px', fontSize: '20px', textAlign: 'center' }}
          />
        </label>
        <label>
          <span>New Password</span>
          <input type="password" value={form.newPassword} onChange={(event) => setForm((v) => ({ ...v, newPassword: event.target.value }))} />
        </label>
        {error ? <p className="form-error">{error}</p> : null}
        <button className="wide-button" type="submit" disabled={loading || form.otp.length !== 6}>
          {loading ? 'Resetting…' : 'Reset Password'}
        </button>
      </form>
    </div>
  );
}

function DashboardPage() {
  const auth = useAuth();
  const navigate = useNavigate();
  const [dashboard, setDashboard] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  async function loadDashboard() {
    try {
      setLoading(true);
      const data = await api.getDashboard(auth.token);
      setDashboard(data);
      setError('');
    } catch (nextError) {
      setError(nextError.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDashboard();
  }, []);

  async function handleDelete(codeId) {
    await api.deleteCode(auth.token, codeId);
    await loadDashboard();
  }

  if (loading) return <div className="page-shell muted-card">Loading dashboard…</div>;
  if (error) return <div className="page-shell muted-card">{error}</div>;

  const summary = dashboard?.summary || {};

  return (
    <div className="page-shell dashboard-page">
      <section className="dashboard-grid">
        <StatCard label="Saved Codes" value={summary.savedCodes || 0} />
        <StatCard label="Executions" value={summary.executionCount || 0} />
        <StatCard label="Visualizations" value={summary.visualizationCount || 0} />
        <StatCard label="Most Used Pattern" value={summary.mostUsedPattern || 'None yet'} />
      </section>

      <section className="dashboard-columns">
        <DashboardPanel title="Saved Codes">
          {(dashboard?.recentCodes || []).length ? dashboard.recentCodes.map((code) => (
            <article className="list-card" key={code.id}>
              <strong>{code.title}</strong>
              <p>{code.language} · {code.dsaPattern}</p>
              <div className="list-actions">
                <button type="button" onClick={() => navigate('/', { state: { workspace: { ...code, inputOverride: code.testCases?.[0]?.input?.raw || '' } } })}>
                  Open
                </button>
                <button type="button" onClick={() => handleDelete(code.id)}>
                  Delete
                </button>
              </div>
            </article>
          )) : <p>No saved code yet.</p>}
        </DashboardPanel>

        <DashboardPanel title="Recent Executions">
          {(dashboard?.recentExecutions || []).length ? dashboard.recentExecutions.map((execution) => (
            <article className="list-card" key={execution.id}>
              <strong>{execution.patternDetected}</strong>
              <p>{execution.language} · {execution.status}</p>
            </article>
          )) : <p>No execution history yet.</p>}
        </DashboardPanel>

        <DashboardPanel title="Recent Visualizations">
          {(dashboard?.recentVisualizations || []).length ? dashboard.recentVisualizations.map((visualization) => (
            <article className="list-card" key={visualization.id}>
              <strong>{visualization.pattern}</strong>
              <p>{visualization.steps.length} recorded steps</p>
            </article>
          )) : <p>No saved visualizations yet.</p>}
        </DashboardPanel>
      </section>
    </div>
  );
}

function StatCard({ label, value }) {
  return (
    <article className="stat-card">
      <span>{label}</span>
      <strong>{value}</strong>
    </article>
  );
}

function DashboardPanel({ title, children }) {
  return (
    <section className="panel-card">
      <h2>{title}</h2>
      {children}
    </section>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Shell />
      </AuthProvider>
    </BrowserRouter>
  );
}
