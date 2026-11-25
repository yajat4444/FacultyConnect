import { SkeletonPage } from "../components/Skeleton.jsx";
import BookmarkButton from "../components/BookmarkButton.jsx";
import { useEffect, useMemo, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { api, API_ORIGIN, materialDownloadUrl } from "../lib/api.js";
import { useAuth } from "../context/AuthContext.jsx";
import {
  EVENT_KINDS, MATERIAL_CATEGORIES, daysFromToday, fileSize, formatDate, formatTime, relativeDay, safeHref } from "../lib/format.js";
import Badge from "../components/Badge.jsx";
import DateBlock from "../components/DateBlock.jsx";
import EmptyState from "../components/EmptyState.jsx";

const TABS = [
  { key: "syllabus", label: "Syllabus" },
  { key: "materials", label: "Course Materials" },
  { key: "schedule", label: "Exam Schedule" },
  { key: "assignments", label: "Assignments" },
  { key: "dates", label: "Important Dates" },
];

export default function CoursePage() {
  const { id } = useParams();
  const { user } = useAuth();
  const [params, setParams] = useSearchParams();
  const tab = TABS.some((t) => t.key === params.get("tab")) ? params.get("tab") : "syllabus";
  const [course, setCourse] = useState(undefined);
  const [error, setError] = useState("");

  useEffect(() => {
    setCourse(undefined);
    api.course(id).then((d) => setCourse(d.course)).catch((e) => { setError(e.message); setCourse(null); });
  }, [id]);

  const counts = useMemo(() => {
    if (!course) return {};
    const ev = course.events;
    return {
      syllabus: course.topics.length,
      materials: course.materials.length,
      schedule: ev.filter((e) => e.kind === "exam" || e.kind === "quiz").length,
      assignments: ev.filter((e) => e.kind === "assignment").length,
      dates: ev.length,
    };
  }, [course]);

  if (course === undefined) return <SkeletonPage label="Loading course" />;
  if (course === null) {
    return (
      <section className="mx-auto max-w-xl px-6 py-24 text-center">
        <p className="section-mark mb-2">Courses</p>
        <h1 className="font-display text-2xl text-ink">Course not found</h1>
        <p className="mt-2 text-sm text-ink-soft">{error}</p>
        <Link to="/courses" className="mt-6 inline-block text-teal link-underline text-sm">Back to the catalogue</Link>
      </section>
    );
  }

  const isOwner = user?.role === "professor" && user.id === course.user_id;
  const select = (key) => setParams(key === "syllabus" ? {} : { tab: key }, { replace: true });

  return (
    <article className="pb-24">
      {/* Hero section — matches explore/landing page */}
      <header className="relative overflow-hidden hero-mesh border-b border-rule text-paper">
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

        <div className="relative z-10 mx-auto max-w-5xl px-6 py-14 sm:py-20">
          <p className="text-sm flex items-center gap-2" style={{ color: "#83C4C4" }}>
            <Link to="/courses" className="hover:underline opacity-80 hover:opacity-100">Courses</Link>
            <span className="opacity-40">/</span>
            <span className="text-paper-raised font-mono font-medium">{course.code}</span>
          </p>
          <div className="mt-4 grid grid-cols-1 md:grid-cols-[1fr_auto] gap-6 items-end">
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <span className="inline-block px-3 py-1 rounded-md text-xs font-mono font-bold tracking-wider uppercase bg-teal/25 text-teal-light border border-teal/40">
                  {course.code}
                </span>
                {course.semester && (
                  <span className="text-xs px-2.5 py-1 rounded-md bg-white/10 text-paper/80 border border-white/15">
                    {course.semester}
                  </span>
                )}
                {course.credits != null && (
                  <span className="text-xs px-2.5 py-1 rounded-md bg-white/10 text-paper/80 border border-white/15">
                    {course.credits} credits
                  </span>
                )}
              </div>
              <h1 className="font-display text-3xl sm:text-4xl text-paper font-semibold tracking-tight">
                {course.title}
              </h1>
              <p className="mt-3 text-paper-raised/80 text-base">
                Taught by{" "}
                <Link to={`/professor/${course.user_id}`} className="text-teal-light hover:underline font-semibold">
                  {course.professor_name}
                </Link>
                {course.professor_department && <span className="opacity-75">, {course.professor_department}</span>}
              </p>
              {course.description && (
                <p className="mt-4 max-w-prose text-paper/80 leading-relaxed text-sm">
                  {course.description}
                </p>
              )}
            </div>
            {!isOwner && <BookmarkButton kind="course" id={course.id} label={course.title} />}
            {isOwner && (
              <Link to={`/dashboard/professor/courses/${course.id}`} className="btn-primary shrink-0">
                Edit this course
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Main Content with Underline Tab Bar */}
      <div className="mx-auto max-w-5xl px-6">
        <div role="tablist" aria-label="Course sections" className="flex gap-8 border-b border-rule overflow-x-auto text-sm pt-8">
          {TABS.map((t) => (
            <button
              key={t.key}
              role="tab"
              id={`tab-${t.key}`}
              aria-selected={tab === t.key}
              aria-controls={`panel-${t.key}`}
              onClick={() => select(t.key)}
              className={`pb-3 font-sans transition-colors whitespace-nowrap border-b-2 font-medium ${
                tab === t.key
                  ? "border-teal text-teal-dark -mb-px font-semibold"
                  : "border-transparent text-ink-faint hover:text-ink -mb-px"
              }`}
            >
              <span>{t.label}</span>
              <span className="ml-1.5 text-xs text-ink-faint tabular-nums">({counts[t.key]})</span>
            </button>
          ))}
        </div>

        {/* Tab Panel */}
        <div role="tabpanel" id={`panel-${tab}`} aria-labelledby={`tab-${tab}`} className="py-10">
          {tab === "syllabus" && <SyllabusTab course={course} />}
          {tab === "materials" && <MaterialsTab course={course} />}
          {tab === "schedule" && (
            <EventList events={course.events.filter((e) => e.kind === "exam" || e.kind === "quiz")} empty="No exams or quizzes have been scheduled yet." />
          )}
          {tab === "assignments" && (
            <EventList events={course.events.filter((e) => e.kind === "assignment")} empty="No assignments have been posted yet." due />
          )}
          {tab === "dates" && <DatesTimeline events={course.events} />}
        </div>
      </div>
    </article>
  );
}

function SyllabusTab({ course }) {
  const pdf = course.materials.find((m) => m.category === "syllabus");
  if (course.topics.length === 0 && !pdf) {
    return <EmptyState title="No syllabus yet">The professor hasn't added the syllabus for this course.</EmptyState>;
  }
  return (
    <div>
      {pdf && (
        <div className="mb-8 p-5 rounded-xl border border-rule bg-paper-raised shadow-sm flex flex-wrap items-center justify-between gap-4">
          <div>
            <span className="inline-block px-2 py-0.5 rounded text-[11px] font-semibold uppercase tracking-wider bg-teal/10 text-teal-dark mb-1">Official Syllabus</span>
            <p className="text-base font-medium text-ink">{pdf.title || "Course Syllabus Document"}</p>
            <p className="text-xs text-ink-faint mt-0.5">Syllabus document (PDF / reference)</p>
          </div>
          <a
            href={pdf.stored_name ? materialDownloadUrl(pdf.id) : safeHref(pdf.link)}
            target="_blank"
            rel="noreferrer"
            className="btn-primary rounded-lg !py-2 !px-4 text-xs"
          >
            {pdf.stored_name ? "Download syllabus ↓" : "Open syllabus →"}
          </a>
        </div>
      )}

      {course.topics.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {course.topics.map((t, i) => (
            <div key={t.id} className="card flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="inline-block px-2.5 py-0.5 rounded text-xs font-semibold bg-teal/10 text-teal-dark">
                    {t.label || `Unit ${i + 1}`}
                  </span>
                  <span className="text-xs text-ink-faint font-mono">Topic #{i + 1}</span>
                </div>
                <h4 className="font-display text-lg text-ink font-medium leading-snug">{t.title}</h4>
                {t.details && <p className="mt-2 text-sm text-ink-soft leading-relaxed">{t.details}</p>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function MaterialsTab({ course }) {
  const groups = Object.entries(MATERIAL_CATEGORIES)
    .map(([key, label]) => ({ key, label, items: course.materials.filter((m) => m.category === key) }))
    .filter((g) => g.items.length);
  if (groups.length === 0) return <EmptyState title="No materials yet">Lecture notes, slides and readings will appear here.</EmptyState>;

  return (
    <div className="space-y-12">
      {groups.map((g) => (
        <section key={g.key}>
          <div className="flex items-center gap-3 mb-4">
            <h3 className="text-xs font-semibold uppercase tracking-[0.12em] text-teal-dark">{g.label}</h3>
            <span className="text-xs px-2 py-0.5 rounded-full bg-wash border border-rule text-ink-faint">{g.items.length}</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {g.items.map((m) => (
              <div key={m.id} className="card flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium text-ink-faint font-sans uppercase tracking-wider">
                      {m.stored_name ? "Uploaded File" : "Link"}
                    </span>
                    {m.stored_name && <span className="text-xs text-ink-faint font-mono">{fileSize(m.file_size)}</span>}
                  </div>
                  <p className="text-ink font-medium text-base leading-snug">{m.title}</p>
                  {m.file_name && <p className="text-xs text-ink-faint mt-1 truncate">{m.file_name}</p>}
                </div>
                <div className="flex items-center gap-2 pt-3 border-t border-rule mt-4">
                  <a href={m.stored_name ? `${API_ORIGIN}${m.file_url}` : safeHref(m.link)} target="_blank" rel="noreferrer" className="btn-quiet rounded-md text-xs">
                    {m.stored_name ? "View" : "Open link"}
                  </a>
                  {m.stored_name && (
                    <a href={materialDownloadUrl(m.id)} className="btn-secondary rounded-md !py-1.5 !px-3 text-xs">
                      Download ↓
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

function EventList({ events, empty, due }) {
  if (events.length === 0) return <EmptyState title="Nothing here yet">{empty}</EmptyState>;
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {events.map((e) => {
        const past = daysFromToday(e.event_date) < 0;
        return (
          <div key={e.id} className={`card flex gap-4 ${past ? "opacity-60 bg-paper-raised" : ""}`}>
            <DateBlock date={e.event_date} muted={past} />
            <div className="min-w-0 flex-1 flex flex-col justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-2 mb-1.5">
                  <Badge tone={EVENT_KINDS[e.kind].tone}>{EVENT_KINDS[e.kind].label}</Badge>
                  {e.marks && <span className="text-xs font-semibold text-teal-dark bg-teal/10 px-2 py-0.5 rounded">{e.marks}</span>}
                </div>
                <h4 className="font-display text-base text-ink font-medium leading-snug">{e.title}</h4>
                <p className="mt-1 text-xs text-ink-soft">
                  {due && "Due: "}
                  {formatDate(e.event_date, { weekday: "short", day: "numeric", month: "short" })}
                  {e.event_time && ` at ${formatTime(e.event_time)}`}
                  <span className="ml-1.5 text-ink-faint">({relativeDay(e.event_date)})</span>
                </p>
                {e.description && <p className="mt-2 text-xs text-ink-soft leading-relaxed line-clamp-3">{e.description}</p>}
              </div>
              {e.link && (
                <a href={safeHref(e.link)} target="_blank" rel="noreferrer" className="mt-3 inline-block text-xs text-teal font-medium link-underline">
                  Open link →
                </a>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function DatesTimeline({ events }) {
  if (events.length === 0) return <EmptyState title="No dates yet">Exam dates, deadlines and key dates will appear on this timeline.</EmptyState>;
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {events.map((e, i) => {
        const past = daysFromToday(e.event_date) < 0;
        const isUpcoming = daysFromToday(e.event_date) >= 0 && daysFromToday(e.event_date) <= 7;
        return (
          <div key={e.id} className={`card flex gap-4 ${past ? "opacity-60 bg-paper-raised" : isUpcoming ? "border-teal" : ""}`}>
            <DateBlock date={e.event_date} muted={past} />
            <div className="min-w-0 flex-1 flex flex-col justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-2 mb-1.5">
                  <Badge tone={EVENT_KINDS[e.kind]?.tone ?? "muted"}>{EVENT_KINDS[e.kind]?.label ?? e.kind}</Badge>
                  {isUpcoming && <Badge tone="teal">Upcoming</Badge>}
                  {e.marks && <span className="text-xs text-teal-dark bg-teal/10 px-1.5 py-0.5 rounded font-mono">{e.marks}</span>}
                </div>
                <h4 className="font-display text-base text-ink font-medium leading-snug">{e.title}</h4>
                <p className="mt-1 text-xs text-ink-soft">
                  {formatDate(e.event_date, { weekday: "short", day: "numeric", month: "short", year: "numeric" })}
                  {e.event_time && ` · ${formatTime(e.event_time)}`}
                  <span className="ml-1.5 text-ink-faint">({relativeDay(e.event_date)})</span>
                </p>
                {e.description && <p className="mt-2 text-xs text-ink-soft leading-relaxed line-clamp-2">{e.description}</p>}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
