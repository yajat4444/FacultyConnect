import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="border-t border-rule mt-24 bg-ink text-paper">
      <div className="mx-auto max-w-6xl px-6 py-16 grid grid-cols-1 sm:grid-cols-3 gap-10">
        <div>
          <p className="font-display text-xl">FacultyConnect</p>
          <p className="mt-3 text-sm text-paper/70 max-w-xs">
            Faculty portfolios, course pages and open research positions for the department, in one place.
          </p>
        </div>

        <div>
          <p className="font-sans text-xs uppercase tracking-[0.1em] text-paper/50 mb-4">Explore</p>
          <ul className="space-y-2 text-sm text-paper/80">
            <li><Link className="link-underline" to="/professors">Faculty directory</Link></li>
            <li><Link className="link-underline" to="/courses">Course catalogue</Link></li>
            <li><Link className="link-underline" to="/projects">Open project slots</Link></li>
          </ul>
        </div>

        <div>
          <p className="font-sans text-xs uppercase tracking-[0.1em] text-paper/50 mb-4">Account</p>
          <ul className="space-y-2 text-sm text-paper/80">
            <li><Link className="link-underline" to="/register">Create an account</Link></li>
            <li><Link className="link-underline" to="/login">Sign in</Link></li>
          </ul>
        </div>
      </div>

      <div className="border-t border-paper/10">
        <div className="mx-auto max-w-6xl px-6 py-5 text-xs text-paper/50">
          FacultyConnect, a department portfolio &amp; collaboration platform.
        </div>
      </div>
    </footer>
  );
}
