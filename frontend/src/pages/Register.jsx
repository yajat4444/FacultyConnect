import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const from = useLocation().state?.from;
  const [form, setForm] = useState({
    role: "student",
    name: "",
    email: "",
    password: "",
    designation: "",
    department: "",
  });
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
      const { user } = await register(form);
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
        <div className="ring-deco" style={{ width: 380, height: 380, right: "-80px", top: "-100px", opacity: 0.3 }} />
        <div className="ring-deco" style={{ width: 200, height: 200, left: "60px", bottom: "100px", opacity: 0.2 }} />

        <div className="relative z-10">
          <p className="font-display text-2xl" style={{ color: "#F7FCFC" }}>FacultyConnect</p>
          <p className="text-sm mt-1" style={{ color: "#83C4C4" }}>Department Portfolios & Collaboration</p>
        </div>

        <div className="relative z-10 space-y-2">
          <p className="font-display text-3xl leading-snug" style={{ color: "#F7FCFC" }}>
            Join the academic community at Thapar.
          </p>
          <p className="text-sm mt-4" style={{ color: "rgba(247,252,252,0.7)" }}>
            Professors build their public portfolio. Students discover research, apply to projects, and follow courses.
          </p>
        </div>

        <div className="relative z-10">
          <p className="text-xs" style={{ color: "#83C4C4" }}>Thapar Institute of Engineering & Technology</p>
        </div>
      </div>

      {/* Right form panel */}
      <section className="flex items-center justify-center px-6 py-16 bg-paper overflow-y-auto">
        <div className="w-full max-w-md">
          <p className="section-mark mb-2">Get started</p>
          <h1 className="font-display text-3xl text-ink">Create your account</h1>

          <form onSubmit={handleSubmit} className="mt-10 space-y-5">
            {error && (
              <p className="border rounded-lg px-4 py-3 text-sm" style={{ borderColor: "rgba(59,159,159,0.4)", background: "rgba(59,159,159,0.06)", color: "#2C7676" }}>
                {error}
              </p>
            )}

            {/* Role picker */}
            <div>
              <span className="field-label req">I am a</span>
              <div className="grid grid-cols-2 gap-3 mt-2">
                {["professor", "student"].map((role) => (
                  <button
                    type="button"
                    key={role}
                    onClick={() => setForm((f) => ({ ...f, role }))}
                    className="border px-4 py-3 text-sm font-medium capitalize transition-all duration-150 rounded-lg"
                    style={
                      form.role === role
                        ? { background: "#3B9F9F", color: "#fff", borderColor: "#3B9F9F" }
                        : { borderColor: "#D0E4E4", color: "#3A5252" }
                    }
                  >
                    <span className="flex items-center justify-center gap-2">
                      {role === "professor" ? (
                        <>
                          <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0112 13.489a50.702 50.702 0 017.74-3.342M6.75 15a.75.75 0 100-1.5.75.75 0 000 1.5zm0 0v-3.675A55.378 55.378 0 0112 8.443m-5.25 6.557q.107.037.214.072" />
                          </svg>
                          <span>Professor</span>
                        </>
                      ) : (
                        <>
                          <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7 0 3.75 3.75 0 017 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                          </svg>
                          <span>Student</span>
                        </>
                      )}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="field-label req" htmlFor="name">Full name</label>
              <input id="name" required maxLength={100} autoComplete="name" className="field" value={form.name} onChange={update("name")} />
            </div>

            <div>
              <label className="field-label req" htmlFor="email">Email</label>
              <input id="email" type="email" required maxLength={254} autoComplete="email" className="field" value={form.email} onChange={update("email")} />
            </div>

            <div>
              <label className="field-label req" htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                required
                minLength={8}
                maxLength={72}
                className="field"
                value={form.password}
                onChange={update("password")}
              />
              <p className="mt-1.5 text-xs text-ink-faint">At least 8 characters.</p>
            </div>

            {form.role === "professor" && (
              <>
                <div>
                  <label className="field-label" htmlFor="designation">Designation</label>
                  <input
                    id="designation"
                    placeholder="e.g. Assistant Professor"
                    className="field"
                    value={form.designation}
                    onChange={update("designation")}
                  />
                </div>
                <div>
                  <label className="field-label" htmlFor="department">Department</label>
                  <input
                    id="department"
                    placeholder="e.g. Computer Science & Engineering"
                    className="field"
                    value={form.department}
                    onChange={update("department")}
                  />
                </div>
              </>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="btn-primary w-full justify-center disabled:opacity-60 rounded-lg py-3 text-base"
            >
              {submitting ? "Creating account…" : "Create account"}
            </button>
          </form>

          <p className="mt-8 text-sm text-ink-soft">
            Already have an account?{" "}
            <Link to="/login" state={{ from }} className="font-medium link-underline" style={{ color: "#3B9F9F" }}>
              Sign in →
            </Link>
          </p>
        </div>
      </section>
    </div>
  );
}
