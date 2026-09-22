
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import {
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
  FileText,
  ArrowRight,
  Loader2,
  Sparkles,
  CheckCircle2,
  Check,
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

const Signup = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [touchedPassword, setTouchedPassword] = useState(false);

  const passwordStrength = getPasswordStrength(formData.password);

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

  const handlePasswordBlur = () => {
    setTouchedPassword(true);
  };

  const isPasswordValid = Object.values(PASSWORD_RULES).every((rule) =>
    rule(formData.password)
  );

  const handleSubmit = async (e) => {
    e.preventDefault();

    setTouchedPassword(true);
    setError("");

    if (!formData.name.trim()) {
      setError("Please enter your full name.");
      return;
    }

    if (formData.name.trim().length < 2) {
      setError("Name must be at least 2 characters.");
      return;
    }

    if (!formData.email.trim()) {
      setError("Please enter your email address.");
      return;
    }

    if (!isPasswordValid) {
      setError(
        "Password must be 8–128 characters and include uppercase, lowercase, and a number."
      );
      return;
    }

    try {
      setLoading(true);

      const response = await api.post("/auth/register", {
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
      });

      console.log("Registration successful:", response.data);

      toast.success("Account created successfully!");

      navigate("/");
    } catch (error) {
      console.error(
        "Registration Error:",
        error.response?.data || error.message
      );

      setError(
        error.response?.data?.message ||
          "Failed to create account. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const renderRule = (label, passed) => (
    <div
      className={`flex items-center gap-2 text-xs transition-colors ${
        passed ? "text-emerald-400" : "text-slate-500"
      }`}
    >
      {passed ? <Check size={14} /> : <X size={14} />}
      <span>{label}</span>
    </div>
  );

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#020617] px-4 py-8">
      {/* Background Effects */}
      <div className="absolute inset-0">
        <div className="absolute right-[-100px] top-[-100px] h-[350px] w-[350px] rounded-full bg-violet-600/20 blur-[120px]" />

        <div className="absolute bottom-[-120px] left-[-100px] h-[400px] w-[400px] rounded-full bg-purple-600/20 blur-[140px]" />

        <div className="absolute left-1/2 top-1/2 h-[250px] w-[250px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-blue-600/10 blur-[120px]" />
      </div>

      <div className="relative z-10 grid w-full max-w-6xl overflow-hidden rounded-3xl border border-white/10 bg-[#0f172a]/90 shadow-2xl shadow-black/40 backdrop-blur-xl lg:grid-cols-2">
        {/* LEFT SIDE */}
        <div className="relative hidden overflow-hidden border-r border-white/10 bg-gradient-to-br from-violet-950/80 via-[#111827] to-[#020617] p-12 lg:flex lg:flex-col lg:justify-between">
          <div>
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 shadow-lg shadow-violet-500/20">
                <FileText size={24} className="text-white" />
              </div>

              <div>
                <h2 className="text-xl font-bold text-white">InvoiceAI</h2>

                <p className="text-xs text-slate-400">
                  Smart Invoice Management
                </p>
              </div>
            </div>

            {/* Hero */}
            <div className="mt-16">
              <div className="inline-flex items-center gap-2 rounded-full border border-violet-500/20 bg-violet-500/10 px-4 py-2 text-sm text-violet-300">
                <Sparkles size={16} />
                Get Started with InvoiceAI
              </div>

              <h1 className="mt-6 text-5xl font-bold leading-tight text-white">
                Start managing
                <span className="block bg-gradient-to-r from-violet-400 to-purple-400 bg-clip-text text-transparent">
                  smarter today.
                </span>
              </h1>

              <p className="mt-6 max-w-md text-base leading-7 text-slate-400">
                Build professional invoices, organize clients, track payments
                and manage your business from one modern platform.
              </p>
            </div>
          </div>

          {/* Features */}
          <div className="space-y-4">
            <div className="flex items-center gap-3 text-sm text-slate-300">
              <CheckCircle2 size={18} className="text-violet-400" />
              Create professional invoices
            </div>

            <div className="flex items-center gap-3 text-sm text-slate-300">
              <CheckCircle2 size={18} className="text-violet-400" />
              Manage clients and payments
            </div>

            <div className="flex items-center gap-3 text-sm text-slate-300">
              <CheckCircle2 size={18} className="text-violet-400" />
              Access your business dashboard
            </div>
          </div>
        </div>

        {/* RIGHT SIDE */}
        <div className="flex items-center justify-center p-6 sm:p-10 lg:p-14">
          <div className="w-full max-w-md">
            {/* Mobile Logo */}
            <div className="mb-10 flex items-center gap-3 lg:hidden">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600">
                <FileText size={24} className="text-white" />
              </div>

              <div>
                <h2 className="text-xl font-bold text-white">InvoiceAI</h2>

                <p className="text-xs text-slate-400">
                  Smart Invoice Management
                </p>
              </div>
            </div>

            {/* Heading */}
            <div>
              <p className="text-sm font-medium text-violet-400">
                Create your account
              </p>

              <h1 className="mt-2 text-3xl font-bold tracking-tight text-white">
                Join InvoiceAI
              </h1>

              <p className="mt-3 text-sm leading-6 text-slate-400">
                Create your account and start managing your invoices smarter.
              </p>
            </div>

            {/* Error */}
            {error && (
              <div className="mt-6 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3">
                <p className="text-sm text-red-400">{error}</p>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="mt-8 space-y-5">
              {/* Name */}
              <div>
                <label className="text-sm font-medium text-slate-300">
                  Full Name
                </label>

                <div className="relative mt-2">
                  <User
                    size={18}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"
                  />

                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    minLength={2}
                    maxLength={50}
                    autoComplete="name"
                    placeholder="Enter your full name"
                    className="w-full rounded-xl border border-slate-700 bg-[#111827] py-3 pl-11 pr-4 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20"
                  />
                </div>
              </div>

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
                    maxLength={254}
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

                  {formData.password && (
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
                  <Lock
                    size={18}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"
                  />

                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    onBlur={handlePasswordBlur}
                    required
                    minLength={8}
                    maxLength={128}
                    autoComplete="new-password"
                    placeholder="Create a secure password"
                    className={`w-full rounded-xl border bg-[#111827] py-3 pl-11 pr-12 text-sm text-white outline-none transition placeholder:text-slate-500 focus:ring-2 ${
                      touchedPassword && !isPasswordValid
                        ? "border-red-500/50 focus:border-red-500 focus:ring-red-500/20"
                        : "border-slate-700 focus:border-violet-500 focus:ring-violet-500/20"
                    }`}
                  />

                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 transition hover:text-violet-400"
                  >
                    {showPassword ? (
                      <EyeOff size={18} />
                    ) : (
                      <Eye size={18} />
                    )}
                  </button>
                </div>

                {/* Password Requirements */}
                {formData.password && (
                  <div className="mt-3 rounded-xl border border-white/5 bg-white/[0.02] p-3">
                    <p className="mb-2 text-xs font-medium text-slate-400">
                      Password requirements
                    </p>

                    <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
                      {renderRule(
                        "8–128 characters",
                        PASSWORD_RULES.minLength(formData.password) &&
                          PASSWORD_RULES.maxLength(formData.password)
                      )}

                      {renderRule(
                        "Lowercase letter",
                        PASSWORD_RULES.lowercase(formData.password)
                      )}

                      {renderRule(
                        "Uppercase letter",
                        PASSWORD_RULES.uppercase(formData.password)
                      )}

                      {renderRule(
                        "Number",
                        PASSWORD_RULES.number(formData.password)
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 px-4 py-3.5 text-sm font-semibold text-white transition hover:from-violet-500 hover:to-purple-500 hover:shadow-lg hover:shadow-violet-500/25 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Creating Account...
                  </>
                ) : (
                  <>
                    Create Account
                    <ArrowRight size={18} />
                  </>
                )}
              </button>
            </form>

            {/* Login */}
            <p className="mt-8 text-center text-sm text-slate-400">
              Already have an account?{" "}
              <Link
                to="/"
                className="font-semibold text-violet-400 transition hover:text-violet-300"
              >
                Sign In
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

export default Signup;