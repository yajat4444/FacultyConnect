const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:4000/api";

async function request(path, { method = "GET", body, token } = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (res.status === 204) return null;
  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const err = new Error(data.error || "Something went wrong. Please try again.");
    err.status = res.status;
    throw err;
  }
  return data;
}

async function uploadRequest(path, { formData, token }) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data.error || "Upload failed. Please try again.");
    err.status = res.status;
    throw err;
  }
  return data;
}

// The API URL is like http://localhost:4000/api — files are served from
// the origin without /api, so this strips it back off for building URLs
// to uploaded photos etc.
export const API_ORIGIN = BASE_URL.replace(/\/api\/?$/, "");

function qs(params) {
  const p = new URLSearchParams();
  Object.entries(params || {}).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== "") p.set(k, v);
  });
  const s = p.toString();
  return s ? `?${s}` : "";
}

// Direct download link (the server sends the original file name).
export const materialDownloadUrl = (id) => `${BASE_URL}/courses/materials/${id}/download`;

export const api = {
  register: (payload) => request("/auth/register", { method: "POST", body: payload }),
  login: (payload) => request("/auth/login", { method: "POST", body: payload }),
  me: (token) => request("/auth/me", { token }),
  announcements: () => request("/announcements"),

  professors: (q) => request(`/professors${q ? `?q=${encodeURIComponent(q)}` : ""}`),
  professor: (id) => request(`/professors/${id}`),
  myProfile: (token) => request("/professors/me", { token }),
  updateProfile: (payload, token) => request("/professors/me", { method: "PUT", body: payload, token }),
  uploadPhoto: (formData, token) => uploadRequest("/professors/me/photo", { formData, token }),

  addEducation: (payload, token) => request("/professors/me/education", { method: "POST", body: payload, token }),
  updateEducation: (id, payload, token) => request(`/professors/me/education/${id}`, { method: "PUT", body: payload, token }),
  deleteEducation: (id, token) => request(`/professors/me/education/${id}`, { method: "DELETE", token }),

  addPublication: (payload, token) => request("/professors/me/publications", { method: "POST", body: payload, token }),
  updatePublication: (id, payload, token) => request(`/professors/me/publications/${id}`, { method: "PUT", body: payload, token }),
  deletePublication: (id, token) => request(`/professors/me/publications/${id}`, { method: "DELETE", token }),

  addAward: (payload, token) => request("/professors/me/awards", { method: "POST", body: payload, token }),
  updateAward: (id, payload, token) => request(`/professors/me/awards/${id}`, { method: "PUT", body: payload, token }),
  deleteAward: (id, token) => request(`/professors/me/awards/${id}`, { method: "DELETE", token }),

  stats: () => request("/stats"),
  postAnnouncement: (body, token) => request("/announcements", { method: "POST", body: { body }, token }),
  deleteAnnouncement: (id, token) => request(`/announcements/${id}`, { method: "DELETE", token }),

  // Courses
  courses: (filters) => request(`/courses${qs(filters)}`),
  course: (id) => request(`/courses/${id}`),
  upcomingEvents: (limit) => request(`/courses/upcoming${qs({ limit })}`),
  myCourses: (token) => request("/courses/mine", { token }),
  createCourse: (payload, token) => request("/courses", { method: "POST", body: payload, token }),
  updateCourse: (id, payload, token) => request(`/courses/${id}`, { method: "PUT", body: payload, token }),
  deleteCourse: (id, token) => request(`/courses/${id}`, { method: "DELETE", token }),

  addTopic: (cid, payload, token) => request(`/courses/${cid}/topics`, { method: "POST", body: payload, token }),
  updateTopic: (cid, id, payload, token) => request(`/courses/${cid}/topics/${id}`, { method: "PUT", body: payload, token }),
  deleteTopic: (cid, id, token) => request(`/courses/${cid}/topics/${id}`, { method: "DELETE", token }),

  addMaterial: (cid, formData, token) => uploadRequest(`/courses/${cid}/materials`, { formData, token }),
  deleteMaterial: (cid, id, token) => request(`/courses/${cid}/materials/${id}`, { method: "DELETE", token }),

  addEvent: (cid, payload, token) => request(`/courses/${cid}/events`, { method: "POST", body: payload, token }),
  updateEvent: (cid, id, payload, token) => request(`/courses/${cid}/events/${id}`, { method: "PUT", body: payload, token }),
  deleteEvent: (cid, id, token) => request(`/courses/${cid}/events/${id}`, { method: "DELETE", token }),

  // Bookmarks (students) and global search
  bookmarks: (token) => request("/bookmarks", { token }),
  saveBookmark: (kind, id, token) => request(`/bookmarks/${kind}/${id}`, { method: "PUT", token }),
  removeBookmark: (kind, id, token) => request(`/bookmarks/${kind}/${id}`, { method: "DELETE", token }),
  search: (q) => request(`/search${qs({ q })}`),

  // Project slots
  projects: (filters) => request(`/projects${qs(filters)}`),
  project: (id, token) => request(`/projects/${id}`, { token }),
  myProjects: (token) => request("/projects/mine", { token }),
  createProject: (payload, token) => request("/projects", { method: "POST", body: payload, token }),
  updateProject: (id, payload, token) => request(`/projects/${id}`, { method: "PUT", body: payload, token }),
  deleteProject: (id, token) => request(`/projects/${id}`, { method: "DELETE", token }),
  applyToProject: (id, payload, token) => request(`/projects/${id}/apply`, { method: "POST", body: payload, token }),
  receivedApplications: (token) => request("/projects/applications/received", { token }),
  myApplications: (token) => request("/projects/applications/mine", { token }),
  setApplicationStatus: (id, status, token) =>
    request(`/projects/applications/${id}`, { method: "PUT", body: { status }, token }),
};
