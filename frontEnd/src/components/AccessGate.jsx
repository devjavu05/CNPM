import { Navigate, Outlet } from "react-router-dom";
import { getSession, isReaderSession, isStaffSession } from "../lib/auth";

export default function AccessGate({ mode = "auth", role, permission }) {
  const session = getSession();

  if (!session.token) {
    return <Navigate to="/login" replace />;
  }

  if (mode === "reader" && !isReaderSession(session)) {
    return <Navigate to="/workspace" replace />;
  }

  if (mode === "staff" && !isStaffSession(session)) {
    return <Navigate to="/reader/books" replace />;
  }

  if (role && !session.roles.includes(role)) {
    return <Navigate to={isStaffSession(session) ? "/workspace" : "/reader/books"} replace />;
  }

  if (permission && !session.permissions.includes(permission)) {
    return <Navigate to={isStaffSession(session) ? "/workspace" : "/reader/books"} replace />;
  }

  return <Outlet />;
}
