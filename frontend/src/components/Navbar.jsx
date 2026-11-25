import { useEffect, useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { shortName } from "../lib/format.js";

const navLinks = [
  { to: "/", label: "Explore", end: true },
  { to: "/professors", label: "Professors" },
  { to: "/courses", label: "Courses" },
  { to: "/projects", label: "Open Projects" },
  { to: "/search", label: "Search" },
];

export default function Navbar() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const dashboard = user?.role === "professor" ? "/dashboard/professor" : "/dashboard/student";

  // Close the mobile menu after navigating.
  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  const linkClass = ({ isActive }) => `link-underline pb-1 transition-colors ${isActive ? "text-teal font-semibold" : "text-ink-soft hover:text-ink"}`;

  return (
    <header className="border-b border-rule bg-paper/95 backdrop-blur-sm sticky top-0 z-40">
      <div className="mx-auto max-w-6xl px-6">
        <div className="flex items-center justify-between h-20">
          <Link to="/" className="flex flex-col leading-none">
            <span className="font-display text-2xl text-ink">
              Faculty<span style={{color:"#3B9F9F"}}>Connect</span>
            </span>
            <span className="hidden sm:block font-sans text-[11px] tracking-[0.14em] text-ink-faint mt-1">
              DEPARTMENT PORTFOLIOS &amp; COLLABORATION
            </span>
          </Link>

          <nav aria-label="Main" className="hidden md:flex items-center gap-8 font-sans text-sm text-ink-soft">
            {navLinks.map((link) => (
              <NavLink key={link.to} to={link.to} end={link.end} className={linkClass}>
                {link.label}
              </NavLink>
            ))}
          </nav>

          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-4">
              {user ? (
                <>
                  <Link to={dashboard} className="font-sans text-sm text-ink-soft link-underline pb-1">
                    {shortName(user.name)}&rsquo;s dashboard
                  </Link>
                  <button onClick={logout} className="btn-secondary !py-2 !px-4 text-xs">Sign out</button>
                </>
              ) : (
                <>
                  <Link to="/login" className="font-sans text-sm text-ink-soft link-underline pb-1">Sign in</Link>
                  <Link to="/register" className="btn-primary !py-2 !px-4 text-xs">Register</Link>
                </>
              )}
            </div>

            <button
              type="button"
              className="md:hidden border border-edge bg-white px-3 py-2 text-sm text-ink"
              aria-expanded={open}
              aria-controls="mobile-menu"
              onClick={() => setOpen((v) => !v)}
            >
              {open ? "Close" : "Menu"}
            </button>
          </div>
        </div>
      </div>

      {open && (
        <nav id="mobile-menu" aria-label="Mobile" className="md:hidden border-t border-rule bg-paper">
          <ul className="mx-auto max-w-6xl px-6 py-2 divide-y divide-rule font-sans text-base">
            {navLinks.map((link) => (
              <li key={link.to}>
                <NavLink to={link.to} end={link.end} className={({ isActive }) => `block py-3 ${isActive ? "font-semibold" : "text-ink"}`} style={({isActive}) => isActive ? {color:"#3B9F9F"} : {}}>
                  {link.label}
                </NavLink>
              </li>
            ))}
            {user ? (
              <>
                <li><Link to={dashboard} className="block py-3 text-ink">My dashboard</Link></li>
                <li><button onClick={logout} className="block w-full py-3 text-left text-ink-soft">Sign out</button></li>
              </>
            ) : (
              <>
                <li><Link to="/login" className="block py-3 text-ink">Sign in</Link></li>
                <li><Link to="/register" className="block py-3 text-ink">Register</Link></li>
              </>
            )}
          </ul>
        </nav>
      )}
    </header>
  );
}
