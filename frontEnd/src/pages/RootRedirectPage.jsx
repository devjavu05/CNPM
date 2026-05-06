import { Navigate } from "react-router-dom";
import { getSession, isReaderSession, isStaffSession } from "../lib/auth";

export default function RootRedirectPage() {
  const session = getSession();

  if (!session.token) {
    return <Navigate to="/welcome" replace />;
  }

  if (isStaffSession(session)) {
    return <Navigate to="/workspace" replace />;
  }

  if (isReaderSession(session)) {
    return <Navigate to="/reader/books" replace />;
  }

  return <Navigate to="/welcome" replace />;
}
