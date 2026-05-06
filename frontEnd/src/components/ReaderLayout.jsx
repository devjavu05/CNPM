import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { getSession, logoutSession } from "../lib/auth";
import { libraryApi } from "../lib/api";

export default function ReaderLayout() {
  const session = getSession();
  const navigate = useNavigate();
  const [unreadCount, setUnreadCount] = useState(0);

  async function handleLogout() {
    await logoutSession(libraryApi.logout);
    navigate("/login", { replace: true });
  }

  useEffect(() => {
    let active = true;

    async function loadUnreadCount() {
      try {
        const count = await libraryApi.getNotificationUnreadCount();
        if (active) setUnreadCount(count || 0);
      } catch {
        if (active) setUnreadCount(0);
      }
    }

    function handleUpdated() {
      loadUnreadCount();
    }

    loadUnreadCount();
    window.addEventListener("notifications:updated", handleUpdated);
    return () => {
      active = false;
      window.removeEventListener("notifications:updated", handleUpdated);
    };
  }, []);

  return (
    <div className="app-shell">
      <header className="app-topbar">
        <div className="brand">
          <div className="brand-badge">TV</div>
          <div>
            <h2>Thư Viện Thông Minh</h2>
            <p>Khu vực độc giả</p>
          </div>
        </div>

        <nav className="nav-links">
          <NavLink end className="nav-link" to="/reader/books">
            Tủ sách
          </NavLink>
          <NavLink className="nav-link" to="/reader/notifications">
            Thông báo{unreadCount > 0 ? ` (${unreadCount})` : ""}
          </NavLink>
          <NavLink className="nav-link" to="/reader/history">
            Lịch sử
          </NavLink>
          <NavLink className="nav-link" to="/reader/balance">
            Số dư
          </NavLink>
          <NavLink className="nav-link" to="/reader/reservations">
            Đặt trước
          </NavLink>
        </nav>

        <div className="topbar-actions">
          <div className="session-card">
            <strong>{session.username}</strong>
            <span>Độc giả</span>
          </div>
          <button className="ghost-button" type="button" onClick={handleLogout}>
            Đăng xuất
          </button>
        </div>
      </header>

      <main className="page-container app-main">
        <Outlet />
      </main>
    </div>
  );
}
