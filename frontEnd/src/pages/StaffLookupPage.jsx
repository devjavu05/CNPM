import { useEffect, useState } from "react";
import PageHero from "../components/PageHero";
import StatusMessage from "../components/StatusMessage";
import useStatus from "../hooks/useStatus";
import { libraryApi } from "../lib/api";

const DEFAULT_RESULT = { items: [], page: 0, size: 10, totalItems: 0, totalPages: 0 };

function countBadge(label, value, tone = "subtle") {
  return (
    <span className={`chip ${tone}`}>
      {label}: {value}
    </span>
  );
}

export default function StaffLookupPage() {
  const [keyword, setKeyword] = useState("");
  const [barcode, setBarcode] = useState("");
  const [page, setPage] = useState(0);
  const [result, setResult] = useState(DEFAULT_RESULT);
  const [barcodeResult, setBarcodeResult] = useState(null);
  const status = useStatus();

  useEffect(() => {
    loadBooks(0, "");
  }, []);

  async function loadBooks(nextPage = page, nextKeyword = keyword) {
    status.clearStatus();
    setBarcodeResult(null);
    try {
      const data = await libraryApi.staffLookupBooks({ q: nextKeyword, page: nextPage, size: 8 });
      setResult(data);
      setPage(data.page || 0);
      if (!data.items?.length) {
        status.setError("Không tìm thấy tài liệu phù hợp với từ khóa. Vui lòng kiểm tra lại lỗi chính tả.");
      }
    } catch (error) {
      status.setError(error.message);
    }
  }

  async function handleSearch(event) {
    event.preventDefault();
    await loadBooks(0, keyword);
  }

  async function handleBarcodeLookup(event) {
    event.preventDefault();
    status.clearStatus();
    try {
      const detail = await libraryApi.staffLookupCopy(barcode.trim());
      setBarcodeResult(detail);
    } catch (error) {
      setBarcodeResult(null);
      status.setError(error.message || "Mã vạch không tồn tại. Vui lòng kiểm tra lại tem hoặc tiến hành nhập kho sách mới.");
    }
  }

  return (
    <>
      <PageHero
        eyebrow="Tra cứu thủ thư"
        title="Tra cứu tài liệu trong kho"
        description="Tìm theo tên sách, tác giả hoặc quét mã vạch để xem ngay tình trạng từng cuốn, vị trí kệ và độc giả đang giữ sách."
      />

      <section className="grid two">
        <section className="panel">
          <div className="panel-header">
            <div>
              <span className="eyebrow">Tìm theo đầu sách</span>
              <h3>Tìm bằng tên sách hoặc tác giả</h3>
            </div>
          </div>
          <form className="form-grid" onSubmit={handleSearch}>
            <div className="field full">
              <label>Từ khóa</label>
              <input
                placeholder="Nhập tên sách hoặc tác giả. Bỏ trống để xem toàn bộ kho."
                value={keyword}
                onChange={(event) => setKeyword(event.target.value)}
              />
            </div>
            <div className="form-actions">
              <button className="button" type="submit">
                Tìm kiếm
              </button>
            </div>
          </form>
        </section>

        <section className="panel">
          <div className="panel-header">
            <div>
              <span className="eyebrow">Tra cứu nhanh</span>
              <h3>Quét hoặc nhập mã vạch</h3>
            </div>
          </div>
          <form className="form-grid" onSubmit={handleBarcodeLookup}>
            <div className="field full">
              <label>Mã vạch cuốn sách</label>
              <input
                placeholder="Dán mã vạch từ máy quét hoặc nhập thủ công"
                value={barcode}
                onChange={(event) => setBarcode(event.target.value)}
                required
              />
            </div>
            <div className="form-actions">
              <button className="button secondary" type="submit">
                Tra cứu mã vạch
              </button>
            </div>
          </form>
        </section>
      </section>

      <StatusMessage status={status.status} />

      {barcodeResult ? (
        <section className="panel">
          <div className="panel-header">
            <div>
              <span className="eyebrow">Chi tiết cuốn sách</span>
              <h3>{barcodeResult.title}</h3>
            </div>
          </div>
          <div className="grid two">
            <div className="record-card">
              <p><strong>Mã vạch:</strong> {barcodeResult.barcode}</p>
              <p><strong>Tác giả:</strong> {barcodeResult.author || "Chưa cập nhật"}</p>
              <p><strong>Thể loại:</strong> {barcodeResult.category || "Chưa cập nhật"}</p>
              <p><strong>Vị trí kệ:</strong> {barcodeResult.location || "Chưa cập nhật"}</p>
            </div>
            <div className="record-card">
              <p><strong>Trạng thái:</strong> {barcodeResult.status || "Chưa cập nhật"}</p>
              <p><strong>Tình trạng vật lý:</strong> {barcodeResult.physicalCondition || "NEW"}</p>
              <p><strong>Độc giả đang giữ:</strong> {barcodeResult.borrowerFullName || "Không có"}</p>
              <p><strong>Email độc giả:</strong> {barcodeResult.borrowerEmail || "Không có"}</p>
              <p><strong>Hạn trả:</strong> {barcodeResult.dueDate ? new Date(barcodeResult.dueDate).toLocaleDateString("vi-VN") : "Không có"}</p>
            </div>
          </div>
        </section>
      ) : null}

      <section className="panel">
        <div className="panel-header">
          <div>
            <span className="eyebrow">Kết quả</span>
            <h3>Danh sách đầu sách trong kho</h3>
          </div>
          <div className="chip-row">
            {countBadge("Tổng kết quả", result.totalItems, "ok")}
            {countBadge("Trang", `${(result.page || 0) + 1}/${Math.max(result.totalPages || 1, 1)}`)}
          </div>
        </div>

        {!result.items?.length ? (
          <div className="empty">Không có đầu sách nào phù hợp với tìm kiếm hiện tại.</div>
        ) : (
          <div className="stack">
            {result.items.map((item) => (
              <article key={item.id} className="record-card">
                <div className="panel-header">
                  <div>
                    <h3>{item.title}</h3>
                    <p className="muted">{item.author || "Chưa có tác giả"} • {item.category || "Chưa phân loại"}</p>
                  </div>
                  <div className="chip-row">
                    {countBadge("Tổng", item.totalCopies, "ok")}
                    {countBadge("Sẵn sàng", item.availableCopies, "ok")}
                    {countBadge("Đang mượn", item.borrowedCopies, "warn")}
                    {countBadge("Báo mất", item.lostCopies, "danger")}
                    {countBadge("Hỏng", item.damagedCopies, "danger")}
                  </div>
                </div>
                <p>{item.description || "Đầu sách này chưa có mô tả."}</p>
                <p><strong>Vị trí kệ:</strong> {item.shelfLocations?.length ? item.shelfLocations.join(", ") : "Chưa cập nhật"}</p>
                <p><strong>Mã vạch còn trên kệ:</strong> {item.availableBarcodes?.length ? item.availableBarcodes.join(", ") : "Không còn cuốn sẵn sàng trên kệ"}</p>
              </article>
            ))}
          </div>
        )}

        <div className="topbar-actions">
          <button className="ghost-button" type="button" disabled={(result.page || 0) <= 0} onClick={() => loadBooks((result.page || 0) - 1)}>
            Trang trước
          </button>
          <button
            className="ghost-button"
            type="button"
            disabled={(result.page || 0) + 1 >= (result.totalPages || 0)}
            onClick={() => loadBooks((result.page || 0) + 1)}
          >
            Trang sau
          </button>
        </div>
      </section>
    </>
  );
}
