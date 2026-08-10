import React, { useState } from "react";
import { api } from "../utils/api";
import ForgotPassword from "./Forgotpassword";

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
      <div style={{ minHeight: 600, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ width: 320 }}>
          <ForgotPassword onDone={() => setMode("login")} />
          <div style={{ fontSize: 12, color: "var(--ink-soft)", marginTop: 12, textAlign: "center" }}>
            <a href="#" onClick={(e) => { e.preventDefault(); setMode("login"); }}>Back to sign in</a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: 600, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <form onSubmit={submit} className="lg-card" style={{ width: 320 }}>
        <div className="lg-display" style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>Ledger</div>
        <div style={{ fontSize: 13, color: "var(--ink-soft)", marginBottom: 18 }}>
          {mode === "login" ? "Sign in to your account" : "Create an account"}
        </div>
        {mode === "signup" && (
          <div style={{ marginBottom: 12 }}>
            <label style={{ fontSize: 12, color: "var(--ink-soft)" }}>Name</label>
            <input value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
        )}
        <div style={{ marginBottom: 12 }}>
          <label style={{ fontSize: 12, color: "var(--ink-soft)" }}>Email</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
        <div style={{ marginBottom: 12 }}>
          <label style={{ fontSize: 12, color: "var(--ink-soft)" }}>Password</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} />
        </div>
        {error && <div style={{ fontSize: 12, color: "var(--stamp-red)", marginBottom: 10 }}>{error}</div>}
        <button className="lg-btn" style={{ width: "100%", justifyContent: "center" }} disabled={busy}>
          {busy ? "Please wait…" : mode === "login" ? "Sign in" : "Sign up"}
        </button>
        <div style={{ fontSize: 12, color: "var(--ink-soft)", marginTop: 12, textAlign: "center" }}>
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
    </div>
  );
}