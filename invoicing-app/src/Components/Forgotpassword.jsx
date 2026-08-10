import React, { useState } from "react";
import { api } from "../utils/api";

// PIN-based reset flow: request a PIN, then submit PIN + new password.
// Never asks for the current/existing password. The backend restricts this
// to a single configured account, so an unrelated email just gets a
// generic error.
export default function ForgotPassword({ onDone, defaultEmail = "" }) {
  const [step, setStep] = useState("request"); // "request" | "verify"
  const [email, setEmail] = useState(defaultEmail);
  const [pin, setPin] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [status, setStatus] = useState(null);
  const [busy, setBusy] = useState(false);

  async function requestPin(e) {
    e.preventDefault();
    setStatus(null);
    setBusy(true);
    try {
      await api.auth.requestPasswordReset(email);
      setStatus({ type: "success", message: "A PIN has been sent. Enter it below." });
      setStep("verify");
    } catch (err) {
      setStatus({ type: "error", message: err.message || "Couldn't send a reset PIN." });
    } finally {
      setBusy(false);
    }
  }

  async function submitReset(e) {
    e.preventDefault();
    setStatus(null);

    if (newPassword.length < 8) {
      setStatus({ type: "error", message: "New password must be at least 8 characters." });
      return;
    }
    if (newPassword !== confirmPassword) {
      setStatus({ type: "error", message: "New password and confirmation don't match." });
      return;
    }

    setBusy(true);
    try {
      await api.auth.resetPasswordWithPin(email, pin, newPassword);
      setStatus({ type: "success", message: "Password reset. You're signed in." });
      if (onDone) onDone();
    } catch (err) {
      setStatus({ type: "error", message: err.message || "Couldn't reset password." });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="lg-card">
      <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12, color: "var(--ink-soft)" }}>Reset password</div>

      {step === "request" ? (
        <form onSubmit={requestPin}>
          <div style={{ marginBottom: 12 }}>
            <label style={{ fontSize: 12, color: "var(--ink-soft)" }}>Account email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          {status && (
            <div style={{ fontSize: 12, marginBottom: 10, color: status.type === "error" ? "var(--stamp-red)" : "var(--ledger-green)" }}>
              {status.message}
            </div>
          )}
          <button className="lg-btn" disabled={busy}>{busy ? "Sending…" : "Send reset PIN"}</button>
        </form>
      ) : (
        <form onSubmit={submitReset}>
          <div style={{ marginBottom: 12 }}>
            <label style={{ fontSize: 12, color: "var(--ink-soft)" }}>Verification PIN</label>
            <input value={pin} onChange={(e) => setPin(e.target.value)} required maxLength={6} />
          </div>
          <div style={{ marginBottom: 12 }}>
            <label style={{ fontSize: 12, color: "var(--ink-soft)" }}>New password</label>
            <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required minLength={8} />
          </div>
          <div style={{ marginBottom: 12 }}>
            <label style={{ fontSize: 12, color: "var(--ink-soft)" }}>Confirm new password</label>
            <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required minLength={8} />
          </div>
          {status && (
            <div style={{ fontSize: 12, marginBottom: 10, color: status.type === "error" ? "var(--stamp-red)" : "var(--ledger-green)" }}>
              {status.message}
            </div>
          )}
          <button className="lg-btn" disabled={busy}>{busy ? "Resetting…" : "Reset password"}</button>{" "}
          <button type="button" className="lg-btn-ghost" onClick={() => setStep("request")}>Request new PIN</button>
        </form>
      )}
    </div>
  );
}