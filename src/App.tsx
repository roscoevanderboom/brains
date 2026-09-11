import { useEffect, useState } from "react";
import { Routes, Route, Navigate } from "react-router";
import { AuthPage } from "./pages/AuthPage.tsx";
import { ProfilePage } from "./pages/ProfilePage.tsx";
import { UsersListPage } from "./pages/UsersListPage.tsx";
import ChatPage from "./pages/ChatPage.tsx";
import { ProtectedRoute } from "./components/ProtectedRoute.tsx";
import { NavMenu } from "./components/NavMenu.tsx";
import { useAuthStore } from "./store/auth.ts";
import type { AuthState } from "./store/auth.ts";

function IndexRedirect() {
  const user = useAuthStore((state: AuthState) => state.user);
  if (!user) return <Navigate to="/auth" replace />;
  return <Navigate to="/chat" replace />;
}

function AuthRoute() {
  const user = useAuthStore((state: AuthState) => state.user);
  if (user) return <Navigate to="/chat" replace />;
  return <AuthPage />;
}

function App() {
  const user = useAuthStore((state: AuthState) => state.user);
  const [navOpen, setNavOpen] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("theme");
    if (stored === "dark") document.documentElement.classList.add("dark");

    const onKey = (e: KeyboardEvent) => {
      // Ctrl+/ — open nav menu
      if ((e.ctrlKey || e.metaKey) && e.key === "/") {
        e.preventDefault();
        setNavOpen((prev) => !prev);
        return;
      }
      // Ctrl+D — toggle dark mode
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "d") {
        e.preventDefault();
        document.documentElement.classList.toggle("dark");
        localStorage.setItem(
          "theme",
          document.documentElement.classList.contains("dark") ? "dark" : "light",
        );
      }
    };

    addEventListener("keydown", onKey);
    return () => removeEventListener("keydown", onKey);
  }, []);

  return (
    <>
      {user && <NavMenu open={navOpen} onOpenChange={setNavOpen} />}
      <Routes>
        <Route path="/" element={<IndexRedirect />} />
        <Route path="/auth" element={<AuthRoute />} />
        <Route element={<ProtectedRoute />}>
          <Route path="/chat" element={<ChatPage />} />
          <Route path="/profile/:username" element={<ProfilePage />} />
          <Route path="/users" element={<UsersListPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}

export default App;
