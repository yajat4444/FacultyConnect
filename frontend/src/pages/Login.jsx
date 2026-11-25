import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const from = useLocation().state?.from;
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function update(field) {
    return (e) => setForm((f) => ({ ...f, [field]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const { user } = await login(form);
      navigate(from || (user.role === "professor" ? "/dashboard/professor" : "/dashboard/student"));
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-[calc(100vh-80px)] grid lg:grid-cols-2">
      {/* Left decorative panel */}
      <div
        className="hidden lg:flex flex-col justify-between p-14 relative overflow-hidden"
        style={{ background: "linear-gradient(135deg, #0F2020 0%, #1A3A3A 60%, #2C7676 100%)" }}
      >
        {/* Decorative rings */}
        <div className="ring-deco" style={{ width: 400, height: 400, right: "-100px", top: "-120px", opacity: 0.3 }} />
        <div className="ring-deco" style={{ width: 240, height: 240, left: "40px", bottom: "80px", opacity: 0.2 }} />

        <div className="relative z-10">
          <p className="font-display text-2xl" style={{ color: "#F7FCFC" }}>FacultyConnect</p>
          <p className="text-sm mt-1" style={{ color: "#83C4C4" }}>Department Portfolios & Collaboration</p>
        </div>

        <div className="relative z-10 space-y-8">
          {[
            {
              icon: (
                <svg className="w-5 h-5 text-teal-light" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0112 13.489a50.702 50.702 0 017.74-3.342M6.75 15a.75.75 0 100-1.5.75.75 0 000 1.5zm0 0v-3.675A55.378 55.378 0 0112 8.443m-5.25 6.557q.107.037.214.072" />
                </svg>
              ),
              text: "Explore every professor's research & courses",
            },
            {
              icon: (
                <svg className="w-5 h-5 text-teal-light" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.942A4.5 4.5 0 0115.89 16.5H8.11a4.5 4.5 0 01-2.34-.658L4.2 15.3m15.6 0A2.25 2.25 0 0021 13.5V11.25a2.25 2.25 0 00-2.25-2.25h-.54M4.2 15.3A2.25 2.25 0 013 13.5V11.25a2.25 2.25 0 012.25-2.25h.54" />
                </svg>
              ),
              text: "Discover open research project positions",
            },
            {
              icon: (
                <svg className="w-5 h-5 text-teal-light" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
                </svg>
              ),
              text: "Browse the full course catalogue",
            },
          ].map((item) => (
            <div key={item.text} className="flex items-start gap-4">
              <span className="p-2 rounded-lg bg-white/10 border border-white/15 shrink-0 mt-0.5">
                {item.icon}
              </span>
              <p className="text-base leading-snug pt-1" style={{ color: "rgba(247,252,252,0.85)" }}>{item.text}</p>
            </div>
          ))}
        </div>

        <div className="relative z-10">
          <p className="text-xs" style={{ color: "#83C4C4" }}>Thapar Institute of Engineering & Technology</p>
        </div>
      </div>

      {/* Right form panel */}
      <section className="flex items-center justify-center px-6 py-16 bg-paper">
        <div className="w-full max-w-md">
          <p className="section-mark mb-2">Welcome back</p>
          <h1 className="font-display text-3xl text-ink">Sign in to FacultyConnect</h1>

          <form onSubmit={handleSubmit} className="mt-10 space-y-6">
            {error && (
              <p className="border rounded-lg px-4 py-3 text-sm" style={{ borderColor: "rgba(59,159,159,0.4)", background: "rgba(59,159,159,0.06)", color: "#2C7676" }}>
                {error}
              </p>
            )}

            <div>
              <label className="field-label req" htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                required
                className="field"
                value={form.email}
                onChange={update("email")}
                autoComplete="email"
              />
            </div>

            <div>
              <label className="field-label req" htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                required
                className="field"
                value={form.password}
                onChange={update("password")}
                autoComplete="current-password"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="btn-primary w-full justify-center disabled:opacity-60 rounded-lg py-3 text-base"
            >
              {submitting ? "Signing in…" : "Sign in"}
            </button>
          </form>

          <p className="mt-8 text-sm text-ink-soft">
            New here?{" "}
            <Link to="/register" state={{ from }} className="font-medium link-underline" style={{ color: "#3B9F9F" }}>
              Create an account →
            </Link>
          </p>
        </div>
      </section>
    </div>
  );
}
