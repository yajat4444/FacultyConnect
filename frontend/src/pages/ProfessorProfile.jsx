import { SkeletonPage } from "../components/Skeleton.jsx";
import BookmarkButton from "../components/BookmarkButton.jsx";
import { useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api, API_ORIGIN } from "../lib/api.js";
import EducationTimeline from "../components/EducationTimeline.jsx";
import PublicationList from "../components/PublicationList.jsx";
import Badge from "../components/Badge.jsx";

const TABS = [
  { id: "about",        label: "Biography" },
  { id: "courses",      label: "Courses" },
  { id: "projects",     label: "Research Openings" },
  { id: "publications", label: "Publications" },
  { id: "background",  label: "Background" },
  { id: "awards",      label: "Awards" },
];

export default function ProfessorProfile() {
  const { id } = useParams();
  const [professor, setProfessor] = useState(undefined);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("about");
  const sectionRefs = useRef({});

  useEffect(() => {
    setProfessor(undefined);
    setActiveTab("about");
    api
      .professor(id)
      .then((data) => setProfessor(data.professor))
      .catch((err) => {
        setError(err.message);
        setProfessor(null);
      });
  }, [id]);

  // Scroll to section when tab is clicked
  function handleTabClick(tabId) {
    setActiveTab(tabId);
    const el = sectionRefs.current[tabId];
    if (el) {
      const offset = 80; // header + tab bar height
      const top = el.getBoundingClientRect().top + window.scrollY - offset;
      window.scrollTo({ top, behavior: "smooth" });
    }
  }

  if (professor === undefined) {
    return <SkeletonPage label="Loading faculty profile" />;
  }

  if (professor === null) {
    return (
      <section className="mx-auto max-w-xl px-6 py-24 text-center">
        <p className="section-mark mb-2">Faculty directory</p>
        <h1 className="font-display text-3xl text-ink">Professor not found</h1>
        <p className="mt-2 text-ink-soft text-sm">{error || "The requested profile does not exist."}</p>
        <Link to="/professors" className="mt-6 inline-block text-teal link-underline text-sm">
          ← Back to the directory
        </Link>
      </section>
    );
  }

  const interests = (professor.research_interests || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  const courses = professor.courses || [];
  const projects = professor.projects || [];
  const publications = professor.publications || [];
  const education = professor.education || [];
  const awards = professor.awards || [];

  // Build visible tabs based on available data
  const visibleTabs = TABS.filter((t) => {
    if (t.id === "about") return !!professor.bio;
    if (t.id === "courses") return courses.length > 0;
    if (t.id === "projects") return projects.length > 0;
    if (t.id === "publications") return publications.length > 0;
    if (t.id === "background") return education.length > 0;
    if (t.id === "awards") return awards.length > 0;
    return false;
  });

  return (
    <article className="pb-24">
      {/* Hero section — matches explore/landing page */}
      <section className="relative overflow-hidden hero-mesh border-b border-rule">
        <div className="ring-deco" style={{ width: 480, height: 480, right: "-120px", top: "-160px", opacity: 0.5 }} />
        <div className="ring-deco" style={{ width: 300, height: 300, right: "60px", top: "-60px", opacity: 0.3 }} />
        <div className="ring-deco" style={{ width: 220, height: 220, left: "-60px", bottom: "-80px", opacity: 0.25 }} />
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: "radial-gradient(circle, #F7FCFC 1px, transparent 1px)",
            backgroundSize: "32px 32px",
          }}
        />

        <div className="relative z-10 mx-auto max-w-6xl px-6 py-14 sm:py-20 grid grid-cols-1 sm:grid-cols-[auto_1fr] gap-10 items-start">
          {/* Portrait with teal accent ring */}
          <div className="h-40 w-40 overflow-hidden bg-paper rounded-2xl border-2 border-teal/40 shadow-xl shrink-0">
            {professor.photo_url ? (
              <img
                src={`${API_ORIGIN}${professor.photo_url}`}
                alt={professor.name}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="h-full w-full flex items-center justify-center font-display text-5xl text-teal-light bg-ink/40">
                {professor.name.charAt(0)}
              </div>
            )}
          </div>

          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal/20 border border-teal/40 text-teal-light text-xs font-semibold uppercase tracking-wider mb-3">
              {[professor.designation, professor.department].filter(Boolean).join(" · ") || "Faculty"}
            </div>
            <h1 className="font-display text-4xl sm:text-5xl text-paper font-normal tracking-tight">
              {professor.name}
            </h1>
            {professor.headline && (
              <p className="mt-3 text-base font-sans text-paper-raised/85 max-w-prose leading-relaxed">
                {professor.headline}
              </p>
            )}
            {interests.length > 0 && (
              <ul className="mt-5 flex flex-wrap gap-2">
                {interests.map((tag) => (
                  <li
                    key={tag}
                    className="text-xs uppercase tracking-[0.06em] rounded-full border border-teal/40 px-3 py-1 text-paper-raised bg-white/10 backdrop-blur-sm"
                  >
                    {tag}
                  </li>
                ))}
              </ul>
            )}
            <div className="mt-5">
              <BookmarkButton kind="professor" id={professor.id} label={professor.name} />
            </div>
          </div>
        </div>

        {/* Section Tab Bar */}
        {visibleTabs.length > 1 && (
          <div className="relative z-10 bg-paper-raised/95 backdrop-blur-sm border-t border-rule">
            <div className="mx-auto max-w-6xl px-6">
              <nav className="tab-nav !border-b-0 py-1" aria-label="Profile sections">
                {visibleTabs.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => handleTabClick(t.id)}
                    className={`tab-button !pb-2.5 ${activeTab === t.id ? "tab-button-active" : "tab-button-inactive"}`}
                    aria-current={activeTab === t.id ? "true" : undefined}
                  >
                    {t.label}
                  </button>
                ))}
              </nav>
            </div>
          </div>
        )}
      </section>

      {/* Two-column layout */}
      <div className="mx-auto max-w-6xl px-6 py-14 grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-14 items-start">
        {/* Main Column */}
        <div className="space-y-14 min-w-0">

          {/* Biography */}
          {professor.bio && (
            <section id="about" ref={(el) => (sectionRefs.current["about"] = el)}>
              <div className="card !p-8 border-l-4 !border-l-teal">
                <p className="section-mark mb-1">Biography</p>
                <h2 className="font-display text-2xl text-ink mb-4">About {professor.name}</h2>
                <p className="text-ink-soft leading-relaxed max-w-prose whitespace-pre-line text-base">
                  {professor.bio}
                </p>
              </div>
            </section>
          )}

          {/* Courses Taught */}
          {courses.length > 0 && (
            <section id="courses" ref={(el) => (sectionRefs.current["courses"] = el)} className="pt-10 border-t border-rule">
              <div className="flex flex-wrap items-baseline justify-between gap-4 mb-6">
                <div>
                  <p className="section-mark mb-1">Teaching</p>
                  <h2 className="font-display text-2xl text-ink">Courses Taught</h2>
                </div>
                <Link to="/courses" className="text-xs uppercase tracking-wider text-teal link-underline">
                  Course catalogue →
                </Link>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {courses.map((c) => (
                  <Link
                    key={c.id}
                    to={`/courses/${c.id}`}
                    className="group card flex flex-col justify-between border-l-4 border-l-teal"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="inline-block px-2.5 py-0.5 rounded text-xs font-semibold bg-wash text-teal-dark border border-teal/20">
                          {c.code}
                        </span>
                        {c.semester && (
                          <span className="text-xs text-ink-faint">
                            {c.semester}{c.credits != null && ` · ${c.credits} cr`}
                          </span>
                        )}
                      </div>
                      <h4 className="font-display text-lg text-ink group-hover:text-teal transition-colors font-medium leading-snug">
                        {c.title}
                      </h4>
                      {c.description && (
                        <p className="mt-2 text-sm text-ink-soft leading-relaxed line-clamp-2">
                          {c.description}
                        </p>
                      )}
                    </div>
                    <div className="mt-4 pt-3 border-t border-rule flex items-center justify-between text-xs text-ink-faint">
                      <span>{c.topic_count || 0} topics · {c.material_count || 0} files</span>
                      <span className="text-teal font-medium group-hover:translate-x-0.5 transition-transform">
                        Explore →
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* Research Openings */}
          {projects.length > 0 && (
            <section id="projects" ref={(el) => (sectionRefs.current["projects"] = el)} className="pt-10 border-t border-rule">
              <div className="flex flex-wrap items-baseline justify-between gap-4 mb-6">
                <div>
                  <p className="section-mark mb-1">Student Collaboration</p>
                  <h2 className="font-display text-2xl text-ink">Research Openings</h2>
                </div>
                <Link to="/projects" className="text-xs uppercase tracking-wider text-teal link-underline">
                  All open projects →
                </Link>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {projects.map((p) => {
                  const isOpen = p.status === "open";
                  return (
                    <Link
                      key={p.id}
                      to={`/projects/${p.id}`}
                      className="group card flex flex-col justify-between border-l-4 border-l-teal"
                    >
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <Badge tone={isOpen ? "olive" : "muted"}>{isOpen ? "Open" : "Filled"}</Badge>
                          <span className="text-xs text-ink-faint">
                            {p.openings} {p.openings === 1 ? "seat" : "seats"}
                          </span>
                        </div>
                        <h4 className="font-display text-lg text-ink group-hover:text-teal transition-colors font-medium leading-snug">
                          {p.title}
                        </h4>
                        {p.duration && (
                          <p className="mt-1 text-xs text-ink-faint">Duration: {p.duration}</p>
                        )}
                        <p className="mt-2 text-sm text-ink-soft leading-relaxed line-clamp-2">
                          {p.description}
                        </p>
                        {p.skills?.length > 0 && (
                          <div className="mt-3 flex flex-wrap gap-1.5">
                            {p.skills.map((s) => (
                              <span key={s} className="px-2 py-0.5 rounded text-[11px] bg-wash border border-rule text-ink-soft">
                                {s}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="mt-4 pt-3 border-t border-rule flex items-center justify-between text-xs">
                        <span className="text-ink-faint">{isOpen ? "Taking applications" : "Position filled"}</span>
                        <span className="text-teal font-medium group-hover:translate-x-0.5 transition-transform">
                          {isOpen ? "Apply →" : "Details →"}
                        </span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </section>
          )}

          {/* Publications */}
          <section id="publications" ref={(el) => (sectionRefs.current["publications"] = el)} className="pt-10 border-t border-rule">
            <p className="section-mark mb-1">Scholarship</p>
            <h2 className="font-display text-2xl text-ink mb-6">Publications</h2>
            <PublicationList publications={publications} />
          </section>

          {/* Academic Background */}
          {education.length > 0 && (
            <section id="background" ref={(el) => (sectionRefs.current["background"] = el)} className="pt-10 border-t border-rule">
              <p className="section-mark mb-1">Background</p>
              <h2 className="font-display text-2xl text-ink mb-6">Academic Background</h2>
              <EducationTimeline education={education} />
            </section>
          )}

          {/* Awards */}
          {awards.length > 0 && (
            <section id="awards" ref={(el) => (sectionRefs.current["awards"] = el)} className="pt-10 border-t border-rule">
              <p className="section-mark mb-1">Recognition</p>
              <h2 className="font-display text-2xl text-ink mb-6">Awards &amp; Honors</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {awards.map((a) => (
                  <div key={a.id} className="card flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-semibold px-2 py-0.5 rounded bg-teal/10 text-teal-dark">
                          Award
                        </span>
                        {a.year && <span className="text-xs text-ink-faint font-mono">{a.year}</span>}
                      </div>
                      <h4 className="font-display text-base text-ink font-medium leading-snug">{a.title}</h4>
                      {a.description && <p className="text-sm text-ink-soft mt-1 leading-relaxed">{a.description}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>

        {/* Sticky Sidebar */}
        <aside className="lg:sticky lg:top-28 space-y-6 font-sans">
          {/* Contact Card */}
          <div className="card border-l-4 !border-l-teal">
            <p className="text-xs uppercase tracking-[0.08em] text-teal-dark mb-3 font-semibold flex items-center gap-1.5">
              <svg className="w-4 h-4 text-teal" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
              </svg>
              Contact &amp; Office
            </p>
            <dl className="space-y-3 text-sm">
              <div>
                <dt className="text-xs text-ink-faint">Email</dt>
                <dd className="mt-0.5">
                  <a href={`mailto:${professor.email}`} className="text-teal font-medium link-underline break-all">
                    {professor.email}
                  </a>
                </dd>
              </div>
              {professor.office && (
                <div className="pt-2 border-t border-rule">
                  <dt className="text-xs text-ink-faint">Office</dt>
                  <dd className="mt-0.5 text-ink font-medium">{professor.office}</dd>
                </div>
              )}
              {professor.office_hours && (
                <div className="pt-2 border-t border-rule">
                  <dt className="text-xs text-ink-faint">Office hours</dt>
                  <dd className="mt-0.5 text-ink font-medium">{professor.office_hours}</dd>
                </div>
              )}
            </dl>
          </div>

          {/* On This Page Navigation Card */}
          {visibleTabs.length > 0 && (
            <div className="card">
              <p className="text-xs uppercase tracking-[0.08em] text-teal-dark mb-3 font-semibold">
                On This Page
              </p>
              <ul className="space-y-2 text-sm">
                {visibleTabs.map((t) => (
                  <li key={t.id}>
                    <button
                      onClick={() => handleTabClick(t.id)}
                      className={`link-underline text-left flex items-center justify-between w-full py-1 ${activeTab === t.id ? "text-teal font-semibold" : "text-ink-soft hover:text-ink"}`}
                    >
                      <span>{t.label}</span>
                      <span className="text-xs text-ink-faint tabular-nums">
                        {t.id === "courses" && courses.length > 0 && `(${courses.length})`}
                        {t.id === "projects" && projects.length > 0 && `(${projects.length})`}
                        {t.id === "publications" && publications.length > 0 && `(${publications.length})`}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Quick Department Links */}
          <div className="card">
            <p className="text-xs uppercase tracking-[0.08em] text-teal-dark mb-3 font-semibold">Department Explore</p>
            <ul className="space-y-2 text-sm text-ink-soft">
              <li><Link to="/professors" className="link-underline hover:text-teal block py-0.5">Faculty Directory →</Link></li>
              <li><Link to="/courses" className="link-underline hover:text-teal block py-0.5">Course Catalogue →</Link></li>
              <li><Link to="/projects" className="link-underline hover:text-teal block py-0.5">Open Research Projects →</Link></li>
            </ul>
          </div>
        </aside>
      </div>
    </article>
  );
}
