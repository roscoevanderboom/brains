import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router";
import { useAuthStore, type User } from "../store/auth.ts";
import type { AuthState } from "../store/auth.ts";

export function ProfilePage() {
  const { username } = useParams<{ username: string }>();
  const [profileUser, setProfileUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const currentUser = useAuthStore((state: AuthState) => state.user);
  const logout = useAuthStore((state: AuthState) => state.logout);
  const navigate = useNavigate();

  useEffect(() => {
    if (!username) return;
    setLoading(true);
    setError(null);
    fetch(`/api/users/${encodeURIComponent(username)}`)
      .then((r) => r.json().then((d) => ({ ok: r.ok, d })))
      .then(({ ok, d }) => {
        if (!ok) throw new Error(d.error || "Failed to load profile");
        setProfileUser(d.user);
      })
      .catch((err) => setError((err as Error).message))
      .finally(() => setLoading(false));
  }, [username]);

  const isSelf = currentUser?.username === username;

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <p className="text-sm text-gray-400">Loading profile…</p>
      </div>
    );
  }

  if (error || !profileUser) {
    return (
      <div className="flex flex-1 items-center justify-center p-6">
        <div className="w-full max-w-sm rounded-2xl border border-gray-200 bg-white p-8 dark:border-gray-800 dark:bg-gray-900">
          <h2 className="mb-3 text-lg font-semibold text-gray-800 dark:text-gray-100">User not found</h2>
          <p className="text-sm text-red-500">{error ?? "Could not find that profile."}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 items-start justify-center p-8">
      <div className="w-full max-w-sm rounded-2xl border border-gray-200 bg-[#f8f7f5] p-8 shadow-sm dark:border-gray-800 dark:bg-gray-900">
        {/* Avatar + name */}
        <div className="mb-6 flex flex-col items-center gap-3">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-500 text-2xl font-bold text-white">
            {profileUser.username.slice(0, 1).toUpperCase()}
          </div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              {profileUser.username}
            </h2>
            {isSelf && (
              <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-600 dark:bg-blue-900/40 dark:text-blue-300">
                You
              </span>
            )}
          </div>
        </div>

        {/* Details */}
        <div className="mb-6 flex flex-col gap-3 border-t border-b border-gray-100 py-4 dark:border-gray-800">
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">Member since</span>
            <span className="font-medium text-gray-700 dark:text-gray-200">
              {new Date(profileUser.dateCreated).toLocaleDateString()}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">Last login</span>
            <span className="font-medium text-gray-700 dark:text-gray-200">
              {profileUser.lastLogin
                ? new Date(profileUser.lastLogin).toLocaleString()
                : "Never"}
            </span>
          </div>
        </div>

        {isSelf && (
          <div className="flex justify-center">
            <button
              type="button"
              onClick={() => { logout(); navigate("/auth"); }}
              className="rounded-lg bg-red-500 px-5 py-2 text-sm font-semibold text-white transition hover:bg-red-600"
            >
              Sign out
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
