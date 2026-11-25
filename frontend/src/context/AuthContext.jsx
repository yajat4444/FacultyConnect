import { createContext, useContext, useEffect, useState } from "react";
import { api } from "../lib/api.js";

const AuthContext = createContext(null);
const STORAGE_KEY = "facultyconnect_token";

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem(STORAGE_KEY));
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function loadUser() {
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const { user } = await api.me(token);
        if (!cancelled) setUser(user);
      } catch (err) {
        // Only end the session when the server says the token is bad. A
        // dropped connection or an interrupted request must not sign people out.
        if (!cancelled && (err.status === 401 || err.status === 404)) {
          setToken(null);
          localStorage.removeItem(STORAGE_KEY);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    loadUser();
    return () => {
      cancelled = true;
    };
  }, [token]);

  function persistSession({ token, user }) {
    setToken(token);
    setUser(user);
    localStorage.setItem(STORAGE_KEY, token);
  }

  async function register(payload) {
    const data = await api.register(payload);
    persistSession(data);
    return data;
  }

  async function login(payload) {
    const data = await api.login(payload);
    persistSession(data);
    return data;
  }

  function logout() {
    setToken(null);
    setUser(null);
    localStorage.removeItem(STORAGE_KEY);
  }

  return (
    <AuthContext.Provider value={{ token, user, loading, register, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
