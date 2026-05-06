import { useEffect, useState } from "react";
import ProtectedPage from "../components/ProtectedPage";
import PageHero from "../components/PageHero";
import BookCard from "../components/BookCard";
import DataTable from "../components/DataTable";
import StatusMessage from "../components/StatusMessage";
import useStatus from "../hooks/useStatus";
import { libraryApi } from "../lib/api";
import { hasPermission } from "../lib/auth";

export default function ReservationsPage() {
  const [books, setBooks] = useState([]);
  const [selectedBook, setSelectedBook] = useState(null);
  const [history, setHistory] = useState([]);
  const [confirming, setConfirming] = useState(false);
  const refreshStatus = useStatus();
  const createStatus = useStatus();
  const historyStatus = useStatus();

  useEffect(() => {
    loadBooks();
  }, []);

  useEffect(() => {
    if (hasPermission("GET_PHIEU_DAT_TRUOC")) {
      loadHistory().catch(() => {});
    }
  }, []);

  async function loadBooks() {
    refreshStatus.clearStatus();
    try {
      const result = await libraryApi.searchBooks();
      setBooks(result);
      setSelectedBook((current) => result.find((item) => item.id === current?.id) || result[0] || null);
    } catch (error) {
      refreshStatus.setError(error.message);
    }
  }

  async function loadHistory() {
    historyStatus.clearStatus();
    try {
      const result = await libraryApi.getReservations();
      setHistory(result);
    } catch (error) {
      historyStatus.setError(error.message);
    }
  }

  async function handleReserve() {
    if (!selectedBook) return;
    createStatus.clearStatus();
    try {
      const result = await libraryApi.createReservation({ dauSachId: selectedBook.id });
      createStatus.setSuccess(
        `Đặt trước thành công${result?.queuePosition ? `. Bạn đang ở vị trí số ${result.queuePosition}` : ""}.`
      );
      setConfirming(false);
      await loadHistory();
    } catch (error) {
      createStatus.setError(error.message);
    }
  }

  async function handleCancelReservation(id) {
    historyStatus.clearStatus();
    try {
      await libraryApi.cancelReservation(id);
      historyStatus.setSuccess("Đã hủy phiếu đặt trước của bạn.");
      await loadHistory();
    } catch (error) {
      historyStatus.setError(error.message);
    }
  }

  async function handleDeleteReservation(id) {
    historyStatus.clearStatus();
    try {
      await libraryApi.deleteReservation(id);
      historyStatus.setSuccess("Đã xóa phiếu đặt trước khỏi danh sách của bạn.");
      await loadHistory();
    } catch (error) {
      historyStatus.setError(error.message);
    }
  }

  return (
    <ProtectedPage permission="CREATE_PHIEU_DAT_TRUOC">
      <PageHero
        eyebrow="Đặt trước"
        title="Phiếu đặt trước của bạn"
        description="Bạn chỉ có thể lập phiếu đặt trước khi toàn bộ bản sao vật lý của đầu sách đã được mượn hết. Hệ thống xử lý theo nguyên tắc FIFO."
        actions={<button className="ghost-button" type="button" onClick={loadBooks}>Làm mới dữ liệu</button>}
      />

      <StatusMessage status={refreshStatus.status} />

      <section className="grid feature-layout">
        <section className="panel catalog-panel">
          <div className="panel-header">
            <div>
              <span className="eyebrow">Đầu sách</span>
              <h3>Chọn đầu sách cần giữ chỗ</h3>
            </div>
          </div>
          <div className="selector-list">
            {books.map((book) => (
              <BookCard key={book.id} book={book} selected={selectedBook?.id === book.id} onSelect={setSelectedBook} />
            ))}
          </div>
        </section>

        <aside className="panel spotlight-panel">
          <div className="panel-header">
            <div>
              <span className="eyebrow">Đầu sách đang chọn</span>
              <h3>Xác nhận lập phiếu</h3>
            </div>
          </div>
          {selectedBook ? (
            <div className="record-card spotlight">
              <span className="eyebrow">{selectedBook.category || "Kho sách chung"}</span>
              <h4>{selectedBook.title}</h4>
              <p className="muted">{selectedBook.author || "Chưa có thông tin tác giả"}</p>
              <div className="chip-row">
                <span className={`chip ${(selectedBook.availableCount ?? 0) > 0 ? "ok" : "warn"}`}>
                  {selectedBook.tinhTrang || "-"}
                </span>
              </div>
              <p>{selectedBook.hasEBook ? "Đầu sách này có thêm phiên bản E-Book." : "Đầu sách này chưa có E-Book."}</p>

              {confirming ? (
                <div className="record-card">
                  <p><strong>Ngày đặt:</strong> {new Date().toLocaleDateString("vi-VN")}</p>
                  <p><strong>Thông tin liên lạc:</strong> Hệ thống dùng tài khoản đăng nhập hiện tại để ghi nhận phiếu đặt trước của bạn.</p>
                  <div className="topbar-actions">
                    <button className="button" type="button" onClick={handleReserve}>
                      Xác nhận lập phiếu
                    </button>
                    <button className="ghost-button" type="button" onClick={() => setConfirming(false)}>
                      Hủy
                    </button>
                  </div>
                </div>
              ) : null}
            </div>
          ) : (
            <div className="empty">Chọn đầu sách để thực hiện đặt trước.</div>
          )}
          <div className="action-cluster">
            <StatusMessage status={createStatus.status} />
            <button
              className="button"
              type="button"
              onClick={() => setConfirming(true)}
              disabled={!selectedBook || (selectedBook.availableCount ?? 0) > 0}
            >
              Đặt trước đầu sách này
            </button>
            {selectedBook && (selectedBook.availableCount ?? 0) > 0 ? (
              <span className="muted">Sách hiện còn trong kho, vui lòng mượn trực tiếp tại quầy.</span>
            ) : null}
          </div>
        </aside>
      </section>

      <section className="panel">
        <div className="panel-header">
          <div>
            <span className="eyebrow">Phiếu đặt trước</span>
            <h3>Danh sách phiếu của bạn</h3>
          </div>
        </div>
        <StatusMessage status={historyStatus.status} />
        <DataTable
          rows={history}
          emptyText="Bạn chưa có phiếu đặt trước nào."
          columns={[
            { label: "Tên sách", render: (item) => item.title || "Không rõ" },
            { label: "Ngày đặt", render: (item) => item.reservationDate || "-" },
            { label: "Trạng thái", render: (item) => item.status || "-" },
            { label: "Thứ tự FIFO", render: (item) => item.queuePosition || "-" },
            {
              label: "Thao tác",
              render: (item) =>
                item.status === "DANG_CHO" ? (
                  <div className="topbar-actions">
                    <button className="ghost-button" type="button" onClick={() => handleCancelReservation(item.id)}>
                      Hủy
                    </button>
                  </div>
                ) : (
                  <div className="topbar-actions">
                    <button className="ghost-button" type="button" onClick={() => handleDeleteReservation(item.id)}>
                      Xóa
                    </button>
                  </div>
                )
            }
          ]}
        />
      </section>
    </ProtectedPage>
  );
}
