import { Navigate, Outlet } from "react-router";
import { useAuthStore } from "../store/auth.ts";
import type { AuthState } from "../store/auth.ts";

export function ProtectedRoute() {
  const user = useAuthStore((state: AuthState) => state.user);

  if (!user) return <Navigate to="/auth" replace />;

  return (
    <div className="flex flex-col h-svh overflow-hidden bg-[#f1f0ee] dark:bg-gray-950">
      <main className="flex flex-col flex-1 min-h-0">
        <Outlet />
      </main>
    </div>
  );
}
