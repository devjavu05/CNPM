import { useState } from "react";
import ProtectedPage from "../components/ProtectedPage";
import PageHero from "../components/PageHero";
import StatusMessage from "../components/StatusMessage";
import useStatus from "../hooks/useStatus";
import { libraryApi } from "../lib/api";

export default function StaffPage() {
  const [form, setForm] = useState({ username: "", password: "", fullName: "", phoneNumber: "" });
  const { status, clearStatus, setError, setSuccess } = useStatus();

  async function handleSubmit(event) {
    event.preventDefault();
    clearStatus();
    try {
      await libraryApi.createStaff(form);
      setSuccess("Đã tạo tài khoản nhân viên.");
      setForm({ username: "", password: "", fullName: "", phoneNumber: "" });
    } catch (error) {
      setError(error.message);
    }
  }

  return (
    <ProtectedPage permission="CREATE_NHAN_VIEN">
      <PageHero
        eyebrow="Nhân sự"
        title="Quản lí tài khoản nhân viên"
        description="Tạo tài khoản nhân viên trong một phân hệ riêng, không trộn với chức năng dành cho độc giả."
      />

      <section className="panel section-panel">
        <StatusMessage status={status} />
        <form className="form-grid" onSubmit={handleSubmit}>
          <div className="field"><label>Tên đăng nhập</label><input value={form.username} onChange={(event) => setForm({ ...form, username: event.target.value })} required /></div>
          <div className="field"><label>Mật khẩu</label><input type="password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} required /></div>
          <div className="field"><label>Họ và tên</label><input value={form.fullName} onChange={(event) => setForm({ ...form, fullName: event.target.value })} required /></div>
          <div className="field"><label>Số điện thoại</label><input value={form.phoneNumber} onChange={(event) => setForm({ ...form, phoneNumber: event.target.value })} required /></div>
          <div className="form-actions"><button className="button" type="submit">Tạo tài khoản nhân viên</button></div>
        </form>
      </section>
    </ProtectedPage>
  );
}
