import React from "react";
import ForgotPassword from "../Components/Forgotpassword";

// Settings-page entry point for password reset. Uses the same PIN-based
// flow as the Login page's "Reset password" link — the current password is
// never asked for.
export default function ResetPassword({ email = "" }) {
  return <ForgotPassword defaultEmail={email} />;
}