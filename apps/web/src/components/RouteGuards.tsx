import { Navigate, Outlet } from "react-router";
import { useAuth } from "../providers/AuthProvider";
import { LoadingState } from "./StateViews";

function Centered({ children }: { children: React.ReactNode }) {
  return <div className="mx-auto flex min-h-dvh max-w-sm items-center px-4">{children}</div>;
}

export function RequireAuth() {
  const auth = useAuth();
  if (auth.status === "loading") {
    return (
      <Centered>
        <LoadingState />
      </Centered>
    );
  }
  if (auth.status === "signedOut") return <Navigate to="/signin" replace />;
  return <Outlet />;
}

/** Trang đăng nhập/đăng ký: đã đăng nhập thì về trang chủ. */
export function GuestOnly() {
  const auth = useAuth();
  if (auth.status === "loading") {
    return (
      <Centered>
        <LoadingState />
      </Centered>
    );
  }
  if (auth.status === "signedIn") return <Navigate to="/" replace />;
  return <Outlet />;
}
