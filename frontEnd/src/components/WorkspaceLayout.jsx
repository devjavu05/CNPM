import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { getSession, hasPermission, hasRole, logoutSession } from "../lib/auth";
import { libraryApi } from "../lib/api";

const workspaceLinks = [
  { to: "/workspace", label: "Tổng quan", exact: true },
  { to: "/workspace/catalog", label: "Quản lý kho sách", permission: "GET_CUON_SACH" },
  { to: "/workspace/circulation", label: "Mượn trả", permission: "GET_PHIEU_MUON" },
  { to: "/workspace/fines", label: "Phiếu phạt", permission: "GET_PHIEU_PHAT" },
  { to: "/workspace/staff", label: "Nhân sự", permission: "CREATE_NHAN_VIEN" },
  { to: "/workspace/admin", label: "Điều hành", role: "CHU_THU_VIEN" }
];

export default function WorkspaceLayout() {
  const navigate = useNavigate();
  const session = getSession();

  async function handleLogout() {
    await logoutSession(libraryApi.logout);
    navigate("/login", { replace: true });
  }

  return (
    <div className="app-shell">
      <header className="app-topbar">
        <div className="brand">
          <div className="brand-badge">TV</div>
          <div>
            <h2>Thư Viện Thông Minh</h2>
            <p>{hasRole("CHU_THU_VIEN") ? "Bàn làm việc chủ thư viện" : "Bàn làm việc thủ thư"}</p>
          </div>
        </div>

        <nav className="nav-links">
          {workspaceLinks
            .filter((item) => {
              if (item.role && !hasRole(item.role)) return false;
              if (item.permission && !hasPermission(item.permission)) return false;
              return true;
            })
            .map((item) => (
              <NavLink key={item.to} end={item.exact} className="nav-link" to={item.to}>
                {item.label}
              </NavLink>
            ))}
        </nav>

        <div className="topbar-actions">
          <div className="session-card">
            <strong>{session.username}</strong>
            <span>{hasRole("CHU_THU_VIEN") ? "Chủ thư viện" : "Thủ thư"}</span>
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
