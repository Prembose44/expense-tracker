import { useState } from "react";
import { useAuth } from "../context/AuthContext";

const friendlyError = (code) => {
  switch (code) {
    case "auth/email-already-in-use":        return "An account with this email already exists.";
    case "auth/invalid-email":               return "Please enter a valid email address.";
    case "auth/weak-password":               return "Password must be at least 6 characters.";
    case "auth/user-not-found":
    case "auth/wrong-password":
    case "auth/invalid-credential":          return "Invalid email or password.";
    case "auth/too-many-requests":           return "Too many attempts. Please try again later.";
    case "auth/popup-closed-by-user":        return "Sign-in popup was closed. Please try again.";
    case "auth/popup-blocked":               return "Popup blocked by browser. Please allow popups and retry.";
    case "auth/network-request-failed":      return "Network error. Please check your internet connection.";
    case "auth/operation-not-allowed":       return "This sign-in method is not enabled. Please contact support.";
    case "auth/user-disabled":               return "This account has been disabled.";
    case "auth/requires-recent-login":       return "Please sign in again to continue.";
    case "auth/cancelled-popup-request":     return "Another sign-in popup is already open. Please close it.";
    case "auth/account-exists-with-different-credential":
                                             return "An account already exists with this email using a different sign-in method.";
    case "auth/unauthorized-domain":         return "This domain is not authorized for sign-in. Please contact support.";
    default:                                 return `Something went wrong (${code ?? "unknown"}). Please try again.`;
  }
};

export default function AuthPage() {
  const { login, register, loginWithGoogle } = useAuth();
  const [tab, setTab]         = useState("login");
  const [form, setForm]       = useState({ name: "", email: "", password: "" });
  const [error, setError]     = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const handle = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (tab === "login") {
        await login(form.email, form.password);
      } else {
        if (!form.name.trim()) throw { code: "custom/name-required" };
        await register(form.name, form.email, form.password);
      }
    } catch (err) {
      console.error("[Auth] submit error:", err.code, err.message, err);
      setError(err.code === "custom/name-required" ? "Name is required." : friendlyError(err.code));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setError("");
    setGoogleLoading(true);
    try {
      await loginWithGoogle();
    } catch (err) {
      console.error("[Auth] Google error:", err.code, err.message, err);
      setError(friendlyError(err.code));
    } finally {
      setGoogleLoading(false);
    }
  };

  const switchTab = (t) => { setTab(t); setError(""); setForm({ name: "", email: "", password: "" }); };

  return (
    <div className="auth-bg">
      <div className="auth-card">
        <div className="auth-logo">
          <span className="auth-logo-icon">💰</span>
          <h1 className="auth-title">ExpenseVault</h1>
          <p className="auth-subtitle">Track every rupee, effortlessly</p>
        </div>

        {/* Google Sign-In Button */}
        <button
          className="google-btn"
          onClick={handleGoogle}
          disabled={googleLoading || loading}
        >
          {googleLoading ? (
            <span className="spinner" />
          ) : (
            <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
              <path fill="#FFC107" d="M43.6 20H24v8h11.3C33.6 33.1 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.8 1.1 7.9 3l5.7-5.7C34.1 6.5 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20c11 0 19.7-8 19.7-20 0-1.3-.1-2.7-.1-4z"/>
              <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 16 19 13 24 13c3 0 5.8 1.1 7.9 3l5.7-5.7C34.1 6.5 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/>
              <path fill="#4CAF50" d="M24 44c5.2 0 10-1.9 13.6-5.1l-6.3-5.2C29.5 35.5 26.9 36 24 36c-5.2 0-9.6-3-11.3-7.3l-6.6 5C9.7 39.7 16.3 44 24 44z"/>
              <path fill="#1976D2" d="M43.6 20H24v8h11.3c-.8 2.3-2.3 4.3-4.3 5.7l6.3 5.2C41 35.3 44 30 44 24c0-1.3-.1-2.7-.4-4z"/>
            </svg>
          )}
          {googleLoading ? "Signing in…" : "Continue with Google"}
        </button>

        <div className="divider">
          <span>or</span>
        </div>

        <div className="auth-tabs">
          <button className={`auth-tab ${tab === "login" ? "active" : ""}`} onClick={() => switchTab("login")}>Sign in</button>
          <button className={`auth-tab ${tab === "register" ? "active" : ""}`} onClick={() => switchTab("register")}>Create account</button>
        </div>

        <form onSubmit={submit} className="auth-form">
          {tab === "register" && (
            <div className="field">
              <label>Full name</label>
              <input name="name" value={form.name} onChange={handle} placeholder="Prem Kumar" required />
            </div>
          )}
          <div className="field">
            <label>Email</label>
            <input type="email" name="email" value={form.email} onChange={handle} placeholder="you@example.com" required />
          </div>
          <div className="field">
            <label>Password</label>
            <input type="password" name="password" value={form.password} onChange={handle} placeholder="••••••••" required />
          </div>

          {error && <p className="auth-error">{error}</p>}

          <button type="submit" className="btn-primary full" disabled={loading || googleLoading}>
            {loading ? "Please wait…" : tab === "login" ? "Sign in" : "Create account"}
          </button>
        </form>

        <p className="auth-hint">
          {tab === "login" ? "No account? " : "Already have one? "}
          <button className="link-btn" onClick={() => switchTab(tab === "login" ? "register" : "login")}>
            {tab === "login" ? "Sign up free" : "Sign in"}
          </button>
        </p>
      </div>
    </div>
  );
}
