import { useEffect, useState } from "react";
import { Link } from "react-router";
import { type User, useAuthStore } from "../store/auth.ts";
import type { AuthState } from "../store/auth.ts";

export function UsersListPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const currentUser = useAuthStore((state: AuthState) => state.user);

  useEffect(() => {
    setLoading(true);
    setError(null);
    fetch("/api/users")
      .then((r) => r.json().then((d) => ({ ok: r.ok, d })))
      .then(({ ok, d }) => {
        if (!ok) throw new Error(d.error || "Failed to load users");
        setUsers(d.users);
      })
      .catch((err) => setError((err as Error).message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="flex flex-1 justify-center p-8">
      <div className="w-full max-w-2xl">
        <h2 className="mb-6 text-xl font-semibold text-gray-900 dark:text-white">
          Registered users
        </h2>

        {loading && <p className="text-sm text-gray-400">Loading…</p>}

        {error && (
          <div className="rounded-lg bg-red-50 px-4 py-2.5 text-sm text-red-600 dark:bg-red-900/30 dark:text-red-400">
            {error}
          </div>
        )}

        {!loading && !error && users.length === 0 && (
          <p className="text-sm text-gray-400">No users yet.</p>
        )}

        {!loading && !error && users.length > 0 && (
          <div className="overflow-hidden rounded-xl border border-gray-200 dark:border-gray-800">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-[#f1f0ee] dark:border-gray-800 dark:bg-gray-900">
                  <th className="px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Username</th>
                  <th className="px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Joined</th>
                  <th className="px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Last login</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-[#f8f7f5] dark:divide-gray-800 dark:bg-gray-950">
                {users.map((u) => (
                  <tr key={u.username} className="hover:bg-[#eeede9] dark:hover:bg-gray-900">
                    <td className="px-4 py-3 font-medium text-gray-900 dark:text-gray-100">
                      {u.username}
                      {currentUser?.username === u.username && (
                        <span className="ml-2 rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-600 dark:bg-blue-900/40 dark:text-blue-300">
                          You
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-500 dark:text-gray-400">
                      {new Date(u.dateCreated).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-gray-500 dark:text-gray-400">
                      {u.lastLogin ? new Date(u.lastLogin).toLocaleString() : "Never"}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        to={`/profile/${u.username}`}
                        className="text-blue-500 hover:underline"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
