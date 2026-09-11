import { NavLink, useNavigate } from "react-router";
import { useAuthStore } from "../store/auth.ts";

export function TopNav() {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate("/auth");
  }

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    [
      "px-3 py-1.5 rounded-full text-sm font-medium transition-colors",
      isActive
        ? "text-blue-600 dark:text-blue-400"
        : "text-gray-500 hover:text-gray-800 hover:bg-[#e8e7e3] dark:text-gray-400 dark:hover:text-gray-100 dark:hover:bg-gray-800",
    ].join(" ");

  return (
    <header className="sticky top-0 z-50 border-b border-gray-200 bg-[#f1f0ee]/90 backdrop-blur dark:border-gray-800 dark:bg-gray-950/90">
      <nav className="mx-auto flex h-14 max-w-5xl items-center gap-6 px-6">
        {/* Logo */}
        <span className="text-lg font-semibold tracking-tight text-gray-900 dark:text-white">
          Chat<span className="text-blue-500">bot</span>
        </span>

        {/* Links */}
        <div className="flex flex-1 items-center gap-1">
          <NavLink to="/chat" className={linkClass}>Chat</NavLink>
          <NavLink to={`/profile/${user?.username}`} className={linkClass}>Profile</NavLink>
          <NavLink to="/users" className={linkClass}>Users</NavLink>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-3">
          <div
            title={user?.username}
            className="flex h-8 w-8 items-center justify-content-center rounded-full bg-blue-500 text-sm font-semibold text-white select-none items-center justify-center"
          >
            {user?.username.slice(0, 1).toUpperCase()}
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="rounded-full border border-gray-200 px-3 py-1 text-sm text-gray-500 transition-colors hover:bg-[#e8e7e3] hover:text-gray-800 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-100"
          >
            Sign out
          </button>
        </div>
      </nav>
    </header>
  );
}
