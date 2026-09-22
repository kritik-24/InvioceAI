
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  FileText,
  ArrowRight,
  Loader2,
  Sparkles,
} from "lucide-react";
import api from "../../services/api";

const Login = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] =
    useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (error) {
      setError("");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);
      setError("");

      const response = await api.post(
        "/auth/login",
        formData
      );

      console.log(
        "Login successful:",
        response.data
      );

      localStorage.setItem(
        "token",
        response.data.token
      );

      localStorage.setItem(
        "user",
        JSON.stringify(response.data.user)
      );

      navigate("/dashboard");
    } catch (error) {
      console.error(
        "Login Error:",
        error.response?.data ||
          error.message
      );

      setError(
        error.response?.data?.message ||
          "Login failed. Please check your credentials."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#020617] px-4 py-8">
      {/* Background Effects */}
      <div className="absolute inset-0">
        <div className="absolute left-[-100px] top-[-100px] h-[350px] w-[350px] rounded-full bg-violet-600/20 blur-[120px]" />

        <div className="absolute bottom-[-120px] right-[-100px] h-[400px] w-[400px] rounded-full bg-purple-600/20 blur-[140px]" />

        <div className="absolute left-1/2 top-1/2 h-[250px] w-[250px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-blue-600/10 blur-[120px]" />
      </div>

      <div className="relative z-10 grid w-full max-w-6xl overflow-hidden rounded-3xl border border-white/10 bg-[#0f172a]/90 shadow-2xl shadow-black/40 backdrop-blur-xl lg:grid-cols-2">
        {/* LEFT SIDE */}
        <div className="relative hidden overflow-hidden border-r border-white/10 bg-gradient-to-br from-violet-950/80 via-[#111827] to-[#020617] p-12 lg:flex lg:flex-col lg:justify-between">
          <div>
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 shadow-lg shadow-violet-500/20">
                <FileText
                  size={24}
                  className="text-white"
                />
              </div>

              <div>
                <h2 className="text-xl font-bold text-white">
                  InvoiceAI
                </h2>

                <p className="text-xs text-slate-400">
                  Smart Invoice Management
                </p>
              </div>
            </div>

            {/* Hero Content */}
            <div className="mt-20">
              <div className="inline-flex items-center gap-2 rounded-full border border-violet-500/20 bg-violet-500/10 px-4 py-2 text-sm text-violet-300">
                <Sparkles size={16} />
                AI-Powered Invoice Management
              </div>

              <h1 className="mt-6 text-5xl font-bold leading-tight text-white">
                Manage invoices
                <span className="block bg-gradient-to-r from-violet-400 to-purple-400 bg-clip-text text-transparent">
                  smarter.
                </span>
              </h1>

              <p className="mt-6 max-w-md text-base leading-7 text-slate-400">
                Create professional invoices, manage your
                clients, track payments and organize your
                business finances from one powerful dashboard.
              </p>
            </div>
          </div>

          {/* Bottom Stats */}
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-xl font-bold text-white">
                Smart
              </p>

              <p className="mt-1 text-xs text-slate-400">
                Invoicing
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-xl font-bold text-white">
                Easy
              </p>

              <p className="mt-1 text-xs text-slate-400">
                Management
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-xl font-bold text-white">
                Secure
              </p>

              <p className="mt-1 text-xs text-slate-400">
                Platform
              </p>
            </div>
          </div>
        </div>

        {/* RIGHT SIDE */}
        <div className="flex items-center justify-center p-6 sm:p-10 lg:p-14">
          <div className="w-full max-w-md">
            {/* Mobile Logo */}
            <div className="mb-10 flex items-center gap-3 lg:hidden">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600">
                <FileText
                  size={24}
                  className="text-white"
                />
              </div>

              <div>
                <h2 className="text-xl font-bold text-white">
                  InvoiceAI
                </h2>

                <p className="text-xs text-slate-400">
                  Smart Invoice Management
                </p>
              </div>
            </div>

            {/* Heading */}
            <div>
              <p className="text-sm font-medium text-violet-400">
                Welcome back
              </p>

              <h1 className="mt-2 text-3xl font-bold tracking-tight text-white">
                Sign in to your account
              </h1>

              <p className="mt-3 text-sm leading-6 text-slate-400">
                Enter your credentials to access your InvoiceAI
                dashboard.
              </p>
            </div>

            {/* Error */}
            {error && (
              <div className="mt-6 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3">
                <p className="text-sm text-red-400">
                  {error}
                </p>
              </div>
            )}

            {/* Form */}
            <form
              onSubmit={handleSubmit}
              className="mt-8 space-y-5"
            >
              {/* Email */}
              <div>
                <label className="text-sm font-medium text-slate-300">
                  Email Address
                </label>

                <div className="relative mt-2">
                  <Mail
                    size={18}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"
                  />

                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    autoComplete="email"
                    placeholder="you@example.com"
                    className="w-full rounded-xl border border-slate-700 bg-[#111827] py-3 pl-11 pr-4 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-slate-300">
                    Password
                  </label>

                  <Link
                    to="/forgot-password"
                    className="text-sm font-medium text-violet-400 transition hover:text-violet-300"
                  >
                    Forgot password?
                  </Link>
                </div>

                <div className="relative mt-2">
                  <Lock
                    size={18}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"
                  />

                  <input
                    type={
                      showPassword
                        ? "text"
                        : "password"
                    }
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    autoComplete="current-password"
                    placeholder="Enter your password"
                    className="w-full rounded-xl border border-slate-700 bg-[#111827] py-3 pl-11 pr-12 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20"
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setShowPassword(
                        !showPassword
                      )
                    }
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 transition hover:text-violet-400"
                    aria-label={
                      showPassword
                        ? "Hide password"
                        : "Show password"
                    }
                  >
                    {showPassword ? (
                      <EyeOff size={18} />
                    ) : (
                      <Eye size={18} />
                    )}
                  </button>
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 px-4 py-3.5 text-sm font-semibold text-white transition hover:from-violet-500 hover:to-purple-500 hover:shadow-lg hover:shadow-violet-500/25 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? (
                  <>
                    <Loader2
                      size={18}
                      className="animate-spin"
                    />
                    Signing in...
                  </>
                ) : (
                  <>
                    Sign In
                    <ArrowRight size={18} />
                  </>
                )}
              </button>
            </form>

            {/* Signup */}
            <p className="mt-8 text-center text-sm text-slate-400">
              Don&apos;t have an account?{" "}
              <Link
                to="/signup"
                className="font-semibold text-violet-400 transition hover:text-violet-300"
              >
                Create Account
              </Link>
            </p>

            {/* Footer */}
            <p className="mt-10 text-center text-xs text-slate-600">
              © 2026 InvoiceAI. Smart invoicing made simple.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;