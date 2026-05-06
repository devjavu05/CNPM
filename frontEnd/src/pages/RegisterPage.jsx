import { useState } from "react";
import { Link } from "react-router-dom";
import { libraryApi } from "../lib/api";
import PageHero from "../components/PageHero";
import StatusMessage from "../components/StatusMessage";
import useStatus from "../hooks/useStatus";

export default function RegisterPage() {
  const [form, setForm] = useState({ username: "", password: "", fullName: "", email: "" });
  const { status, clearStatus, setError, setSuccess } = useStatus();

  async function handleSubmit(event) {
    event.preventDefault();
    clearStatus();
    try {
      await libraryApi.registerReader(form);
      setSuccess("Đã tạo tài khoản độc giả.");
      setForm({ username: "", password: "", fullName: "", email: "" });
    } catch (error) {
      setError(error.message);
    }
  }

  return (
    <>
      <PageHero
        eyebrow="Đăng ký độc giả"
        title="Tạo tài khoản độc giả"
        description="Trang này chỉ dành cho đăng ký độc giả mới, tách riêng khỏi các nghiệp vụ nhân viên và quản trị."
      />

      <section className="panel section-panel">
        <StatusMessage status={status} />
        <form className="form-grid" onSubmit={handleSubmit}>
          <div className="field">
            <label>Tên đăng nhập</label>
            <input value={form.username} onChange={(event) => setForm({ ...form, username: event.target.value })} required />
          </div>
          <div className="field">
            <label>Mật khẩu</label>
            <input type="password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} required />
          </div>
          <div className="field">
            <label>Họ và tên</label>
            <input value={form.fullName} onChange={(event) => setForm({ ...form, fullName: event.target.value })} required />
          </div>
          <div className="field">
            <label>Email</label>
            <input type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} required />
          </div>
          <div className="form-actions">
            <button className="button" type="submit">Tạo tài khoản độc giả</button>
            <Link className="ghost-button" to="/login">Đi tới đăng nhập</Link>
          </div>
        </form>
      </section>
    </>
  );
}
