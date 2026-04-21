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
      window.localStorage.setItem('dsa_token', data.token);
      setToken(data.token);
      setUser(data.user);
      return data.user;
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
      } else {
        await auth.login({ email: form.email, password: form.password });
      }
      navigate(location.state?.from || '/dashboard');
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
