import { Link, Navigate } from "react-router-dom";
import PageHero from "../components/PageHero";
import { getSession, hasPermission, hasRole } from "../lib/auth";

export default function DashboardPage() {
  const session = getSession();
  const cards = [
    {
      title: "Tra cứu tài liệu",
      copy: "Tìm nhanh đầu sách, kiểm tra vị trí kệ, trạng thái cuốn sách và mã vạch đang có trong kho.",
      to: "/workspace/lookup"
    }
  ];

  if (hasPermission("GET_CUON_SACH")) {
    cards.push({
      title: "Quản lý kho sách",
      copy: "Xem thống kê kho, thêm đầu sách, nhập thêm bản sao và thanh lý những cuốn không còn sử dụng.",
      to: "/workspace/catalog"
    });
  }

  if (hasPermission("GET_PHIEU_MUON")) {
    cards.push({
      title: "Mượn trả",
      copy: "Lập phiếu mượn, xử lý giao cuốn sách, theo dõi hàng chờ đặt trước và quản lý các phiếu phạt.",
      to: "/workspace/circulation"
    });
  }

  if (hasPermission("CREATE_NHAN_VIEN")) {
    cards.push({
      title: "Quản lý nhân sự",
      copy: "Tạo và quản lý tài khoản nhân sự phục vụ vận hành thư viện.",
      to: "/workspace/staff"
    });
  }

  if (hasRole("CHU_THU_VIEN")) {
    cards.push({
      title: "Điều hành hệ thống",
      copy: "Quản lý vai trò, quyền và cấu hình truy cập cấp cao của thư viện.",
      to: "/workspace/admin"
    });
  }

  if (cards.length === 1) {
    return <Navigate to="/workspace/lookup" replace />;
  }

  return (
    <>
      <PageHero
        eyebrow="Bàn làm việc thủ thư"
        title={`Xin chào, ${session.username || "thủ thư"}`}
        description="Khu vực này chỉ giữ các phân hệ cần thiết cho tác nghiệp thư viện. Những phần không phục vụ vận hành hằng ngày đã được lược bỏ."
      />

      <section className="panel">
        <div className="cards cards-wide">
          {cards.map((card) => (
            <article className="summary-card primary" key={card.to}>
              <span className="eyebrow">Phân hệ</span>
              <h4>{card.title}</h4>
              <p className="muted">{card.copy}</p>
              <Link className="button" to={card.to}>Mở phân hệ</Link>
            </article>
          ))}
        </div>
      </section>
    </>
  );
}
