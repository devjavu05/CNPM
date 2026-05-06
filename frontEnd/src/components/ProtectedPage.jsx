import { Navigate } from "react-router-dom";
import { getSession, isStaffSession } from "../lib/auth";

export default function ProtectedPage({ children, role, permission }) {
  const session = getSession();
  if (!session.token) {
    return <Navigate to="/login" replace />;
  }
  if (role && !session.roles.includes(role)) {
    return <Navigate to={isStaffSession(session) ? "/workspace" : "/reader/books"} replace />;
  }
  if (permission && !session.permissions.includes(permission)) {
    return <Navigate to={isStaffSession(session) ? "/workspace" : "/reader/books"} replace />;
  }
  return children;
}
