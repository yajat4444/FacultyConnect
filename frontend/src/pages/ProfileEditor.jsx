import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { api, API_ORIGIN } from "../lib/api.js";
import EducationEditor from "../components/EducationEditor.jsx";
import PublicationEditor from "../components/PublicationEditor.jsx";
import AwardEditor from "../components/AwardEditor.jsx";
import Panel from "../components/Panel.jsx";
import Notice from "../components/Notice.jsx";

const BASE_FIELDS = [
  "name", "designation", "department", "headline", "bio",
  "office", "office_hours", "research_interests",
];

export default function ProfileEditor() {
  const { token, user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [form, setForm] = useState(null);
  const [savedMessage, setSavedMessage] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    api.myProfile(token).then((data) => {
      setProfile(data.professor);
      const initial = {};
      BASE_FIELDS.forEach((f) => (initial[f] = data.professor[f] || ""));
      setForm(initial);
    });
  }, [token]);

  function update(field) {
    return (e) => setForm((f) => ({ ...f, [field]: e.target.value }));
  }

  async function handleSave(e) {
    e.preventDefault();
    setError("");
    setSaving(true);
    setSavedMessage("");
    try {
      const { professor: updated } = await api.updateProfile(form, token);
      setProfile((p) => ({ ...updated, education: p.education, publications: p.publications, awards: p.awards }));
      setSavedMessage("Saved.");
      setTimeout(() => setSavedMessage(""), 2500);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handlePhoto(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError("");
    try {
      const formData = new FormData();
      formData.append("photo", file);
      const { photo_url } = await api.uploadPhoto(formData, token);
      setProfile((p) => ({ ...p, photo_url }));
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  }

  if (!profile || !form) {
    return <p className="mx-auto max-w-3xl px-6 py-24 text-ink-faint text-sm">Loading your profile…</p>;
  }

  const SECTIONS = [
    ["photo", "Photo"],
    ["details", "Profile details"],
    ["education", "Academic background"],
    ["publications", "Publications"],
    ["awards", "Awards & honors"],
  ];

  return (
    <section className="mx-auto max-w-5xl px-6 py-16">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <div>
          <p className="section-mark mb-2">Profile editor</p>
          <h1 className="font-display text-3xl text-ink">Build your public page</h1>
        </div>
        <Link to={`/professor/${user.id}`} className="text-sm text-teal link-underline">
          View public page →
        </Link>
      </div>

      <div className="mt-10 grid grid-cols-1 lg:grid-cols-[180px_1fr] gap-10">
        <nav aria-label="Sections" className="hidden lg:block">
          <ul className="sticky top-28 border-l border-edge text-sm">
            {SECTIONS.map(([key, label], i) => (
              <li key={key}>
                <a href={`#${key}`} className="block -ml-px border-l-2 border-transparent py-2 pl-4 text-ink-soft hover:border-teal hover:text-ink transition-colors">
                  <span className="text-teal mr-2 font-display italic">{String(i + 1).padStart(2, "0")}</span>
                  {label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="space-y-10 min-w-0">
          <Notice tone="error">{error}</Notice>

          <Panel id="photo" index="01" title="Photo" hint="Shown on your public page and in the directory.">
            <div className="flex items-center gap-6">
              <div className="h-24 w-24 overflow-hidden bg-white border border-edge shrink-0">
                {profile.photo_url ? (
                  <img src={`${API_ORIGIN}${profile.photo_url}`} alt="" className="h-full w-full object-cover" />
                ) : (
                  <div className="h-full w-full flex items-center justify-center font-display text-2xl text-ink-faint">
                    {profile.name.charAt(0)}
                  </div>
                )}
              </div>
              <div>
                <label className="btn-secondary !py-2 text-xs cursor-pointer inline-flex">
                  {uploading ? "Uploading…" : "Change photo"}
                  <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handlePhoto} disabled={uploading} />
                </label>
                <p className="field-hint">JPEG, PNG, or WEBP. Up to 5MB.</p>
              </div>
            </div>
          </Panel>

          <Panel id="details" index="02" title="Profile details">
            <form onSubmit={handleSave} className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="field-label req" htmlFor="pf-name">Full name</label>
                  <input id="pf-name" required className="field" value={form.name} onChange={update("name")} />
                </div>
                <div>
                  <label className="field-label" htmlFor="pf-desig">Designation</label>
                  <input id="pf-desig" className="field" value={form.designation} onChange={update("designation")} placeholder="Associate Professor" />
                </div>
                <div>
                  <label className="field-label" htmlFor="pf-dept">Department</label>
                  <input id="pf-dept" className="field" value={form.department} onChange={update("department")} />
                </div>
                <div>
                  <label className="field-label" htmlFor="pf-int">Research interests</label>
                  <input id="pf-int" className="field" value={form.research_interests} onChange={update("research_interests")} placeholder="Comma-separated" />
                </div>
              </div>

              <div>
                <label className="field-label" htmlFor="pf-head">Headline</label>
                <input id="pf-head" className="field" value={form.headline} onChange={update("headline")} placeholder="One line under your name" />
              </div>

              <div>
                <label className="field-label" htmlFor="pf-bio">Bio</label>
                <textarea id="pf-bio" rows={5} className="field" value={form.bio} onChange={update("bio")} />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="field-label" htmlFor="pf-office">Office</label>
                  <input id="pf-office" className="field" value={form.office} onChange={update("office")} />
                </div>
                <div>
                  <label className="field-label" htmlFor="pf-hours">Office hours</label>
                  <input id="pf-hours" className="field" value={form.office_hours} onChange={update("office_hours")} />
                </div>
              </div>

              <div className="flex items-center gap-4">
                <button type="submit" disabled={saving} className="btn-primary disabled:opacity-60">
                  {saving ? "Saving…" : "Save changes"}
                </button>
                {savedMessage && <span className="text-sm text-olive">{savedMessage}</span>}
              </div>
            </form>
          </Panel>

          <Panel id="education" index="03" title="Academic background" hint="Degrees, newest first. These appear as a timeline on your page.">
            <EducationEditor token={token} items={profile.education} onChange={(education) => setProfile((p) => ({ ...p, education }))} />
          </Panel>

          <Panel id="publications" index="04" title="Publications" hint="Shown in citation format with a link, venue and year.">
            <PublicationEditor token={token} items={profile.publications} onChange={(publications) => setProfile((p) => ({ ...p, publications }))} />
          </Panel>

          <Panel id="awards" index="05" title="Awards & honors">
            <AwardEditor token={token} items={profile.awards} onChange={(awards) => setProfile((p) => ({ ...p, awards }))} />
          </Panel>
        </div>
      </div>
    </section>
  );
}
