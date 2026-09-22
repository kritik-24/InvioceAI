

import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Check,
  CheckCircle2,
  Eye,
  EyeOff,
  LockKeyhole,
  Loader2,
  AlertCircle,
  X,
} from "lucide-react";
import api from "../../services/api";

const PASSWORD_RULES = {
  minLength: (password) => password.length >= 8,
  maxLength: (password) => password.length <= 128,
  lowercase: (password) => /[a-z]/.test(password),
  uppercase: (password) => /[A-Z]/.test(password),
  number: (password) => /\d/.test(password),
};

const getPasswordStrength = (password) => {
  if (!password) {
    return {
      score: 0,
      label: "",
    };
  }

  const rules = Object.values(PASSWORD_RULES);
  const passed = rules.filter((rule) => rule(password)).length;

  if (passed <= 2) {
    return {
      score: 1,
      label: "Weak",
    };
  }

  if (passed <= 4) {
    return {
      score: 2,
      label: "Medium",
    };
  }

  return {
    score: 3,
    label: "Strong",
  };
};

function ResetPassword() {
  const { token } = useParams();
  const navigate = useNavigate();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [touchedPassword, setTouchedPassword] = useState(false);

  const passwordStrength = getPasswordStrength(password);

  const isPasswordValid = Object.values(PASSWORD_RULES).every((rule) =>
    rule(password)
  );

  const passwordsMatch =
    password.length > 0 &&
    confirmPassword.length > 0 &&
    password === confirmPassword;

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");
    setTouchedPassword(true);

    if (!token) {
      setError("This password reset link is invalid.");
      return;
    }

    if (!isPasswordValid) {
      setError(
        "Password must be 8–128 characters and include uppercase, lowercase, and a number."
      );
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      await api.post(`/auth/reset-password/${token}`, {
        password,
        confirmPassword,
      });

      setSuccess(true);

      setTimeout(() => {
        navigate("/");
      }, 2500);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to reset your password. The link may be invalid or expired."
      );
    } finally {
      setLoading(false);
    }
  };

  const renderRule = (label, passed) => (
    <div
      className={`flex items-center gap-2 text-xs transition-colors ${
        passed ? "text-emerald-400" : "text-gray-500"
      }`}
    >
      {passed ? <Check size={14} /> : <X size={14} />}
      <span>{label}</span>
    </div>
  );

  if (success) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#080808] px-4 py-8 text-white">
        <div className="w-full max-w-md">
          <div className="mb-8 text-center">
            <Link
              to="/"
              className="inline-flex items-center gap-2 text-2xl font-bold tracking-tight"
            >
              <span className="text-white">Invoice</span>
              <span className="text-indigo-400">AI</span>
            </Link>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-8 text-center shadow-2xl backdrop-blur-xl">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10">
              <CheckCircle2 className="h-8 w-8 text-emerald-400" />
            </div>

            <h1 className="mt-6 text-2xl font-bold">
              Password Reset Successful
            </h1>

            <p className="mt-3 text-sm leading-6 text-gray-400">
              Your password has been updated successfully. Redirecting you to
              the sign-in page...
            </p>

            <Link
              to="/"
              className="mt-6 inline-flex items-center justify-center gap-2 text-sm font-medium text-indigo-400 transition hover:text-indigo-300"
            >
              <ArrowLeft className="h-4 w-4" />
              Go to Sign In
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#080808] px-4 py-8 text-white">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-2xl font-bold tracking-tight"
          >
            <span className="text-white">Invoice</span>
            <span className="text-indigo-400">AI</span>
          </Link>

          <h1 className="mt-8 text-3xl font-bold">
            Create a new password
          </h1>

          <p className="mt-3 text-sm leading-6 text-gray-400">
            Choose a strong password for your InvoiceAI account.
          </p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-6 shadow-2xl backdrop-blur-xl sm:p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="flex items-start gap-3 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-300">
                <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* New Password */}
            <div>
              <div className="flex items-center justify-between">
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-gray-300"
                >
                  New password
                </label>

                {password && (
                  <span
                    className={`text-xs font-medium ${
                      passwordStrength.score === 1
                        ? "text-red-400"
                        : passwordStrength.score === 2
                          ? "text-yellow-400"
                          : "text-emerald-400"
                    }`}
                  >
                    {passwordStrength.label}
                  </span>
                )}
              </div>

              <div className="relative mt-2">
                <LockKeyhole className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-500" />

                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(event) => {
                    setPassword(event.target.value);

                    if (error) {
                      setError("");
                    }
                  }}
                  onBlur={() => setTouchedPassword(true)}
                  placeholder="Enter new password"
                  autoComplete="new-password"
                  disabled={loading}
                  minLength={8}
                  maxLength={128}
                  className={`w-full rounded-xl border bg-black/30 py-3 pl-11 pr-12 text-sm text-white outline-none transition placeholder:text-gray-600 focus:ring-2 disabled:cursor-not-allowed disabled:opacity-60 ${
                    touchedPassword && !isPasswordValid
                      ? "border-red-500/50 focus:border-red-500 focus:ring-red-500/20"
                      : "border-white/10 focus:border-indigo-500 focus:ring-indigo-500/20"
                  }`}
                />

                <button
                  type="button"
                  onClick={() => setShowPassword((current) => !current)}
                  disabled={loading}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 transition hover:text-white disabled:cursor-not-allowed"
                  aria-label={
                    showPassword ? "Hide password" : "Show password"
                  }
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>

              {/* Password Requirements */}
              {password && (
                <div className="mt-3 rounded-xl border border-white/5 bg-white/[0.02] p-3">
                  <p className="mb-2 text-xs font-medium text-gray-400">
                    Password requirements
                  </p>

                  <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
                    {renderRule(
                      "8–128 characters",
                      PASSWORD_RULES.minLength(password) &&
                        PASSWORD_RULES.maxLength(password)
                    )}

                    {renderRule(
                      "Lowercase letter",
                      PASSWORD_RULES.lowercase(password)
                    )}

                    {renderRule(
                      "Uppercase letter",
                      PASSWORD_RULES.uppercase(password)
                    )}

                    {renderRule(
                      "Number",
                      PASSWORD_RULES.number(password)
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label
                htmlFor="confirmPassword"
                className="mb-2 block text-sm font-medium text-gray-300"
              >
                Confirm new password
              </label>

              <div className="relative">
                <LockKeyhole className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-500" />

                <input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(event) => {
                    setConfirmPassword(event.target.value);

                    if (error) {
                      setError("");
                    }
                  }}
                  placeholder="Confirm new password"
                  autoComplete="new-password"
                  disabled={loading}
                  maxLength={128}
                  className={`w-full rounded-xl border bg-black/30 py-3 pl-11 pr-12 text-sm text-white outline-none transition placeholder:text-gray-600 focus:ring-2 disabled:cursor-not-allowed disabled:opacity-60 ${
                    confirmPassword && !passwordsMatch
                      ? "border-red-500/40 focus:border-red-500 focus:ring-red-500/20"
                      : confirmPassword && passwordsMatch
                        ? "border-emerald-500/40 focus:border-emerald-500 focus:ring-emerald-500/20"
                        : "border-white/10 focus:border-indigo-500 focus:ring-indigo-500/20"
                  }`}
                />

                <button
                  type="button"
                  onClick={() =>
                    setShowConfirmPassword((current) => !current)
                  }
                  disabled={loading}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 transition hover:text-white disabled:cursor-not-allowed"
                  aria-label={
                    showConfirmPassword
                      ? "Hide confirm password"
                      : "Show confirm password"
                  }
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>

              {confirmPassword && (
                <div
                  className={`mt-2 flex items-center gap-2 text-xs ${
                    passwordsMatch ? "text-emerald-400" : "text-red-400"
                  }`}
                >
                  {passwordsMatch ? (
                    <>
                      <Check size={14} />
                      Passwords match
                    </>
                  ) : (
                    <>
                      <X size={14} />
                      Passwords do not match
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Resetting password...
                </>
              ) : (
                "Reset Password"
              )}
            </button>

            <Link
              to="/"
              className="flex items-center justify-center gap-2 text-sm text-gray-400 transition hover:text-white"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Sign In
            </Link>
          </form>
        </div>
      </div>
    </div>
  );
}

export default ResetPassword;