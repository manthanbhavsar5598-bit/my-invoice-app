import React, { useState } from "react";
import { FlaskConical, Mail, Lock, User } from "lucide-react";
import { api } from "../utils/api";
import ForgotPassword from "./Forgotpassword";

const BRAND_NAME = "Narnarayan Chem";

function AuthShell({ children }) {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
        background:
          "radial-gradient(circle at 15% 10%, rgba(37,99,235,0.10), transparent 42%), " +
          "radial-gradient(circle at 85% 90%, rgba(212,167,44,0.12), transparent 45%), " +
          "var(--paper-dark)",
      }}
    >
      <style>{`
        .auth-badge {
          width: 56px;
          height: 56px;
          border-radius: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 16px;
          background: linear-gradient(135deg, var(--ink) 0%, #1e3a8a 100%);
          box-shadow: 0 10px 24px rgba(37,99,235,0.28);
        }
        .auth-card {
          box-shadow:
            0 24px 60px rgba(15,23,42,0.14),
            0 4px 14px rgba(15,23,42,0.06);
          border-radius: 16px !important;
        }
        .auth-field-icon {
          position: absolute;
          left: 12px;
          top: 34px;
          color: var(--ink-soft);
          pointer-events: none;
        }
        .auth-field input {
          padding-left: 36px !important;
        }
        .auth-btn {
          transition: transform 0.15s ease, box-shadow 0.15s ease, opacity 0.15s ease;
          box-shadow: 0 8px 20px rgba(15,23,42,0.18);
        }
        .auth-btn:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 12px 26px rgba(15,23,42,0.24);
          opacity: 1 !important;
        }
        .auth-btn:active:not(:disabled) {
          transform: translateY(0);
        }
      `}</style>
      <div style={{ width: "100%", maxWidth: 360 }}>{children}</div>
    </div>
  );
}

function Brand({ tagline }) {
  return (
    <div style={{ textAlign: "center", marginBottom: 26 }}>
      <div className="auth-badge">
        <FlaskConical size={26} color="#fff" />
      </div>
      <div className="lg-display" style={{ fontSize: 24, fontWeight: 700, letterSpacing: "0.01em" }}>
        {BRAND_NAME}
      </div>
      <div style={{ fontSize: 13, color: "var(--ink-soft)", marginTop: 4 }}>{tagline}</div>
    </div>
  );
}

export default function Login({ onAuthed }) {
  const [mode, setMode] = useState("login"); // "login" | "signup" | "forgot"
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      if (mode === "login") await api.auth.login(email, password);
      else await api.auth.signup(name, email, password);
      onAuthed();
    } catch (err) {
      setError(err.message || "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  if (mode === "forgot") {
    return (
      <AuthShell>
        <Brand tagline="Reset your account password" />
        <div className="lg-card auth-card">
          <ForgotPassword onDone={() => setMode("login")} />
        </div>
        <div style={{ fontSize: 12, color: "var(--ink-soft)", marginTop: 16, textAlign: "center" }}>
          <a href="#" onClick={(e) => { e.preventDefault(); setMode("login"); }}>Back to sign in</a>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell>
      <Brand tagline={mode === "login" ? "Sign in to your account" : "Create an account"} />
      <form onSubmit={submit} className="lg-card auth-card" style={{ padding: 28 }}>
        {mode === "signup" && (
          <div className="auth-field" style={{ marginBottom: 14, position: "relative" }}>
            <label style={{ fontSize: 12, color: "var(--ink-soft)" }}>Name</label>
            <User size={15} className="auth-field-icon" />
            <input value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
        )}
        <div className="auth-field" style={{ marginBottom: 14, position: "relative" }}>
          <label style={{ fontSize: 12, color: "var(--ink-soft)" }}>Email</label>
          <Mail size={15} className="auth-field-icon" />
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
        <div className="auth-field" style={{ marginBottom: 18, position: "relative" }}>
          <label style={{ fontSize: 12, color: "var(--ink-soft)" }}>Password</label>
          <Lock size={15} className="auth-field-icon" />
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} />
        </div>
        {error && <div style={{ fontSize: 12, color: "var(--stamp-red)", marginBottom: 12 }}>{error}</div>}
        <button className="lg-btn auth-btn" style={{ width: "100%", justifyContent: "center", padding: "11px 16px" }} disabled={busy}>
          {busy ? "Please wait…" : mode === "login" ? "Sign in" : "Sign up"}
        </button>
        <div style={{ fontSize: 12, color: "var(--ink-soft)", marginTop: 16, textAlign: "center" }}>
          {mode === "login" ? (
            <>
              No account? <a href="#" onClick={(e) => { e.preventDefault(); setMode("signup"); }}>Sign up</a>
              {" · "}
              <a href="#" onClick={(e) => { e.preventDefault(); setMode("forgot"); }}>Reset password</a>
            </>
          ) : (
            <>Already have an account? <a href="#" onClick={(e) => { e.preventDefault(); setMode("login"); }}>Sign in</a></>
          )}
        </div>
      </form>
    </AuthShell>
  );
}