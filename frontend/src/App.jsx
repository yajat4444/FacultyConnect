import { useEffect } from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import Navbar from "./components/Navbar.jsx";
import Footer from "./components/Footer.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import Landing from "./pages/Landing.jsx";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import ProfessorDirectory from "./pages/ProfessorDirectory.jsx";
import ProfessorProfile from "./pages/ProfessorProfile.jsx";
import ProfileEditor from "./pages/ProfileEditor.jsx";
import CourseCatalogue from "./pages/CourseCatalogue.jsx";
import CoursePage from "./pages/CoursePage.jsx";
import CourseManager from "./pages/CourseManager.jsx";
import CourseEditor from "./pages/CourseEditor.jsx";
import ProjectsPage from "./pages/ProjectsPage.jsx";
import ProjectDetail from "./pages/ProjectDetail.jsx";
import ProjectManager from "./pages/ProjectManager.jsx";
import SearchPage from "./pages/SearchPage.jsx";
import ErrorBoundary from "./components/ErrorBoundary.jsx";

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

export default function App() {
  return (
    <div className="min-h-screen flex flex-col">
      <ScrollToTop />
      <Navbar />
      <main className="flex-1">
        <ErrorBoundary>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          <Route path="/professors" element={<ProfessorDirectory />} />
          <Route path="/professor/:id" element={<ProfessorProfile />} />
          <Route
            path="/dashboard/professor/profile"
            element={
              <ProtectedRoute role="professor">
                <ProfileEditor />
              </ProtectedRoute>
            }
          />
          <Route path="/courses" element={<CourseCatalogue />} />
          <Route path="/courses/:id" element={<CoursePage />} />
          <Route path="/projects" element={<ProjectsPage />} />
          <Route path="/projects/:id" element={<ProjectDetail />} />

          <Route
            path="/dashboard/professor/courses"
            element={<ProtectedRoute role="professor"><CourseManager /></ProtectedRoute>}
          />
          <Route
            path="/dashboard/professor/courses/:id"
            element={<ProtectedRoute role="professor"><CourseEditor /></ProtectedRoute>}
          />
          <Route
            path="/dashboard/professor/projects"
            element={<ProtectedRoute role="professor"><ProjectManager /></ProtectedRoute>}
          />

          <Route
            path="/dashboard/professor"
            element={
              <ProtectedRoute role="professor">
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/student"
            element={
              <ProtectedRoute role="student">
                <Dashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="*"
            element={
              <section className="mx-auto max-w-xl px-6 py-28 text-center">
                <p className="section-mark mb-3">404</p>
                <h1 className="font-display text-3xl text-ink">Page not found</h1>
                <p className="mt-3 text-sm text-ink-soft">That address doesn't lead anywhere.</p>
                <a href="/" className="btn-primary mt-6">Back to the home page</a>
              </section>
            }
          />
        </Routes>
        </ErrorBoundary>
      </main>
      <Footer />
    </div>
  );
}
