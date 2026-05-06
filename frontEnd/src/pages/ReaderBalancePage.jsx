import { useEffect, useState } from "react";
import StatusMessage from "../components/StatusMessage";
import useStatus from "../hooks/useStatus";
import { libraryApi } from "../lib/api";

export default function ReaderBalancePage() {
  const [readerProfile, setReaderProfile] = useState(null);
  const [history, setHistory] = useState({ phieuPhat: [] });
  const [depositAmount, setDepositAmount] = useState("");
  const status = useStatus();

  async function loadData() {
    status.clearStatus();
    try {
      const [profile, borrowHistory] = await Promise.all([
        libraryApi.getMyReaderProfile(),
        libraryApi.getMyBorrowHistory(),
      ]);
      setReaderProfile(profile);
      setHistory({ phieuPhat: borrowHistory.phieuPhat || [] });
    } catch (error) {
      status.setError(error.message);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  async function handleDeposit(event) {
    event.preventDefault();
    status.clearStatus();
    try {
      const result = await libraryApi.updateMyReaderBalance({
        amount: Number(depositAmount || 0),
      });
      setReaderProfile(result);
      setDepositAmount("");
      status.setSuccess("Nạp tiền thành công.");
    } catch (error) {
      status.setError(error.message);
    }
  }

  const unpaidTotal = (history.phieuPhat || [])
    .filter((item) => !item.paid)
    .reduce((sum, item) => sum + Number(item.amount || 0), 0);

  return (
    <div className="page-container">
      <section className="page-hero">
        <div>
          <span className="eyebrow">Số dư</span>
          <h1>Ví giả lập của bạn</h1>
          <p className="muted">
            Đây là mục riêng để xem tổng số dư và nạp thêm tiền. Bạn chỉ có thể nạp tăng số dư, không thể sửa trực tiếp hay rút ra.
          </p>
        </div>
      </section>

      <StatusMessage status={status.status} />

      <section className="grid two">
        <article className="panel">
          <div className="panel-header">
            <div>
              <span className="eyebrow">Tổng tiền</span>
              <h2>{Number(readerProfile?.balance || 0).toLocaleString("vi-VN")} đ</h2>
            </div>
          </div>
          <div className="record-card">
            <p><strong>Chủ tài khoản:</strong> {readerProfile?.fullName || readerProfile?.email || "Reader"}</p>
            <p><strong>Loại thẻ:</strong> {readerProfile?.cardType || "STANDARD"}</p>
            <p><strong>Tổng phạt chưa thanh toán:</strong> {Number(unpaidTotal).toLocaleString("vi-VN")} đ</p>
          </div>
        </article>

        <section className="panel">
          <div className="panel-header">
            <div>
              <span className="eyebrow">Nạp tiền</span>
              <h2>Tăng số dư</h2>
            </div>
          </div>
          <form className="form-grid" onSubmit={handleDeposit}>
            <div className="field full">
              <label>Số tiền muốn nạp</label>
              <input
                type="number"
                min="1000"
                step="1000"
                value={depositAmount}
                onChange={(event) => setDepositAmount(event.target.value)}
                required
              />
            </div>
            <div className="form-actions">
              <button className="button" type="submit">
                Nạp thêm
              </button>
            </div>
          </form>
        </section>
      </section>
    </div>
  );
}
