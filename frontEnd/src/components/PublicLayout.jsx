import { NavLink, Outlet } from "react-router-dom";

export default function PublicLayout() {
  return (
    <div className="app-shell">
      <header className="app-topbar">
        <div className="brand">
          <div className="brand-badge">TV</div>
          <div>
            <h1>Thư Viện Thông Minh</h1>
            <p>Nền tảng thư viện hiện đại cho độc giả và thủ thư.</p>
          </div>
        </div>

        <nav className="nav-links">
          <NavLink className="nav-link" to="/welcome">
            Giới thiệu
          </NavLink>
          <NavLink className="nav-link" to="/login">
            Đăng nhập
          </NavLink>
          <NavLink className="button" to="/register">
            Đăng ký độc giả
          </NavLink>
        </nav>
      </header>

      <main className="page-container app-main">
        <Outlet />
      </main>
    </div>
  );
}
