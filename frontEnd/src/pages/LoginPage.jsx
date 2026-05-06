import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { libraryApi } from "../lib/api";
import { consumeSessionExpiredFlag, setToken } from "../lib/auth";
import PageHero from "../components/PageHero";
import StatusMessage from "../components/StatusMessage";
import useStatus from "../hooks/useStatus";

export default function LoginPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: "", password: "" });
  const [forgotEmail, setForgotEmail] = useState("");
  const loginStatus = useStatus();
  const forgotStatus = useStatus();

  useEffect(() => {
    if (consumeSessionExpiredFlag()) {
      loginStatus.setError("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.");
    }
  }, []);

  async function handleSubmit(event) {
    event.preventDefault();
    loginStatus.clearStatus();
    try {
      const result = await libraryApi.login(form);
      if (!result?.token) throw new Error("Hệ thống không trả về token đăng nhập.");
      setToken(result.token);
      loginStatus.setSuccess("Đăng nhập thành công. Đang chuyển tới giao diện phù hợp.");
      setTimeout(() => navigate(result.redirectPath || "/workspace"), 500);
    } catch (error) {
      loginStatus.setError(error.message);
    }
  }

  async function handleForgotPassword(event) {
    event.preventDefault();
    forgotStatus.clearStatus();
    try {
      const result = await libraryApi.forgotPassword({ email: forgotEmail });
      forgotStatus.setSuccess(result || "Yêu cầu khôi phục mật khẩu đã được ghi nhận.");
      setForgotEmail("");
    } catch (error) {
      forgotStatus.setError(error.message);
    }
  }

  return (
    <>
      <PageHero
        eyebrow="Đăng nhập"
        title="Xác thực tài khoản thư viện"
        description="Người dùng đăng nhập bằng tên đăng nhập và mật khẩu. Sau khi xác thực thành công, hệ thống sẽ chuyển tới đúng giao diện của Chủ thư viện, Thủ thư hoặc Độc giả."
      />

      <div className="grid two split-sections">
        <section className="panel section-panel">
          <div className="panel-header">
            <div>
              <span className="eyebrow">LoginForm</span>
              <h3>Biểu mẫu đăng nhập</h3>
            </div>
          </div>
          <StatusMessage status={loginStatus.status} />
          <form className="form-grid" onSubmit={handleSubmit}>
            <div className="field full">
              <label>Tên đăng nhập</label>
              <input value={form.username} onChange={(event) => setForm({ ...form, username: event.target.value })} required />
            </div>
            <div className="field full">
              <label>Mật khẩu</label>
              <input type="password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} required />
            </div>
            <div className="form-actions">
              <button className="button" type="submit">Xác nhận</button>
            </div>
          </form>
        </section>

        <section className="panel section-panel">
          <div className="panel-header">
            <div>
              <span className="eyebrow">MessageDialog</span>
              <h3>Quên mật khẩu</h3>
            </div>
          </div>
          <StatusMessage status={forgotStatus.status} />
          <form className="form-grid" onSubmit={handleForgotPassword}>
            <div className="field full">
              <label>Email độc giả</label>
              <input type="email" value={forgotEmail} onChange={(event) => setForgotEmail(event.target.value)} required />
            </div>
            <div className="form-actions">
              <button className="ghost-button" type="submit">Gửi yêu cầu khôi phục</button>
            </div>
          </form>
          <div className="stack">
            <div className="mini-feature">
              <strong>Điều hướng theo vai trò</strong>
              <p className="muted">Chủ thư viện và Thủ thư sẽ vào khu làm việc thư viện. Độc giả sẽ vào khu vực tra cứu và đặt trước sách.</p>
            </div>
            <div className="mini-feature">
              <strong>Bảo mật đăng nhập</strong>
              <p className="muted">Tài khoản sẽ bị khóa tạm thời nếu đăng nhập sai quá 5 lần trong 15 phút.</p>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
