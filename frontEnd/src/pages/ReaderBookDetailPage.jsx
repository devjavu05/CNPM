import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import DataTable from "../components/DataTable";
import StatusMessage from "../components/StatusMessage";
import useStatus from "../hooks/useStatus";
import { libraryApi } from "../lib/api";
import { hasPermission, isAuthenticated } from "../lib/auth";

function renderIntroduction(text) {
  if (!text) return null;

  return text
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean)
    .map((paragraph, index) => (
      <p key={`${index}-${paragraph.slice(0, 12)}`}>{paragraph}</p>
    ));
}

export default function ReaderBookDetailPage() {
  const { id } = useParams();
  const [book, setBook] = useState(null);
  const [reservations, setReservations] = useState([]);
  const [purchases, setPurchases] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [reviewForm, setReviewForm] = useState({ rating: "5", comment: "" });
  const detailStatus = useStatus();
  const reserveStatus = useStatus();
  const purchaseStatus = useStatus();
  const reviewStatus = useStatus();

  useEffect(() => {
    loadBook();
    loadReviews();
  }, [id]);

  useEffect(() => {
    if (isAuthenticated() && hasPermission("GET_PHIEU_DAT_TRUOC")) {
      loadReservations().catch(() => {});
    }
    if (isAuthenticated()) {
      loadPurchases().catch(() => {});
    }
  }, []);

  async function loadBook() {
    detailStatus.clearStatus();
    try {
      const result = await libraryApi.getLookupBookDetail(id);
      setBook(result);
    } catch (error) {
      detailStatus.setError(error.message);
    }
  }

  async function loadReviews() {
    try {
      const result = await libraryApi.getBookReviews(id);
      setReviews(result);
    } catch {
    }
  }

  async function loadReservations() {
    const result = await libraryApi.getReservations();
    setReservations(result);
  }

  async function loadPurchases() {
    const result = await libraryApi.getMyPurchasedEBooks();
    setPurchases(result);
  }

  async function handleReserve() {
    reserveStatus.clearStatus();
    try {
      const result = await libraryApi.createReservation({ dauSachId: id });
      reserveStatus.setSuccess(
        `Đặt trước thành công${result?.queuePosition ? `. Bạn đang ở vị trí số ${result.queuePosition}` : ""}.`
      );
      if (hasPermission("GET_PHIEU_DAT_TRUOC")) {
        await loadReservations();
      }
    } catch (error) {
      reserveStatus.setError(error.message);
    }
  }

  async function handlePurchaseEBook() {
    purchaseStatus.clearStatus();
    try {
      const result = await libraryApi.purchaseEBook({ ebookId: id });
      purchaseStatus.setSuccess(
        `Mua thành công${result?.accessLink ? ". Bạn đã có thể mở tài liệu ngay." : "."}`
      );
      await loadPurchases();
      await loadBook();
    } catch (error) {
      purchaseStatus.setError(error.message);
    }
  }

  async function handleSubmitReview(event) {
    event.preventDefault();
    reviewStatus.clearStatus();
    try {
      await libraryApi.submitBookReview(id, {
        rating: Number(reviewForm.rating),
        comment: reviewForm.comment
      });
      reviewStatus.setSuccess("Đánh giá của bạn đã được ghi nhận.");
      setReviewForm({ rating: "5", comment: "" });
      await loadReviews();
      await loadBook();
    } catch (error) {
      reviewStatus.setError(error.message);
    }
  }

  const ownedPurchase = purchases.find((item) => item.title === book?.title);
  const myReservationsForThisBook = reservations.filter(
    (item) => item.dauSachId === id || item.title === book?.title
  );

  return (
    <>
      <StatusMessage status={detailStatus.status} />

      {book ? (
        <>
          <section className="detail-layout">
            <aside className="panel detail-cover-panel">
              <div className="detail-cover-frame">
                {book.coverImageUrl ? (
                  <img className="book-cover" src={book.coverImageUrl} alt={`Bìa sách ${book.title}`} />
                ) : (
                  <div className="book-cover book-cover-fallback">TV</div>
                )}
              </div>

              <div className="detail-cover-actions">
                <Link className="ghost-button" to={window.location.pathname.startsWith("/reader") ? "/reader/books" : "/welcome"}>
                  Quay lại danh sách
                </Link>
              </div>
            </aside>

            <section className="panel detail-main-panel">
              <span className="eyebrow">Chi tiết sách</span>
              <h1 className="detail-title">{book.title}</h1>
              <p className="detail-author-line">
                <strong>Tác giả:</strong> {book.author || "Chưa cập nhật"}{" "}
                <span className="detail-dot">•</span>
                <strong> Thể loại:</strong> {book.category || "Chưa phân loại"}
              </p>
              <p className="detail-summary">
                {book.description || "Đầu sách này hiện chưa có mô tả ngắn trong hệ thống."}
              </p>

              <div className="detail-primary-actions">
                {book.hasEBook && book.ownedAccessLink ? (
                  <a
                    className="button"
                    href={book.ownedAccessLink}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Mở liên kết E-Book
                  </a>
                ) : (
                  <button className="button" type="button" disabled>
                    Chưa có liên kết E-Book
                  </button>
                )}
              </div>

              <div className="detail-meta-grid">
                <div className="record-card">
                  <strong>Tác giả</strong>
                  <span>{book.author || "Chưa cập nhật"}</span>
                </div>
                <div className="record-card">
                  <strong>Thể loại</strong>
                  <span>{book.category || "Chưa phân loại"}</span>
                </div>
                <div className="record-card">
                  <strong>Năm xuất bản</strong>
                  <span>{book.publishYear || "Chưa cập nhật"}</span>
                </div>
                <div className="record-card">
                  <strong>Đánh giá trung bình</strong>
                  <span>{book.averageRating ?? 0}/5</span>
                </div>
              </div>

              <div className="detail-info-strip">
                <span className={`inventory-pill ${book.availableCount > 0 ? "ok" : "warn"}`}>
                  {book.tinhTrang}
                </span>
                {book.hasEBook ? <span className="chip subtle">Có E-Book</span> : null}
              </div>

              <div className="detail-section">
                <h3>Tình trạng và vị trí</h3>
                <p>
                  <strong>Số cuốn sẵn sàng:</strong> {book.availableCount}
                </p>
                <p>
                  <strong>Vị trí kệ:</strong>{" "}
                  {book.viTriKe?.length
                    ? book.viTriKe.join(", ")
                    : "Hiện không có cuốn nào sẵn sàng trên kệ"}
                </p>
              </div>

              {book.hasEBook ? (
                <div className="detail-section">
                  <h3>E-Book</h3>
                  <p>Liên kết này sẽ mở sang trang tải hoặc trang đọc của website khác.</p>
                  <p>
                    <strong>Giá:</strong> {book.eBookPrice ?? 0}
                  </p>
                  <p>
                    <strong>Định dạng:</strong> {book.eBookFormat || "-"}
                  </p>
                  <p>
                    <strong>Phân loại:</strong> {book.eBookPremiumOnly ? "Premium" : "Thường"}
                  </p>
                  <p>
                    <strong>Cho phép tải xuống:</strong> {book.eBookDownloadable ? "Có" : "Không"}
                  </p>
                  {book.eBookOwned && book.ownedAccessLink ? (
                    <p>
                      <a href={book.ownedAccessLink} target="_blank" rel="noreferrer">
                        Mở liên kết của bạn
                      </a>
                    </p>
                  ) : null}
                </div>
              ) : null}

              <div className="detail-actions-stack">
                {hasPermission("CREATE_PHIEU_DAT_TRUOC") ? (
                  <div className="record-card">
                    <StatusMessage status={reserveStatus.status} />
                    <h3>Đặt trước đầu sách</h3>
                    <p>Chỉ áp dụng khi toàn bộ bản sao vật lý đã được mượn hết.</p>
                    <button
                      className="button"
                      type="button"
                      onClick={handleReserve}
                      disabled={book.availableCount > 0}
                    >
                      Đặt trước
                    </button>
                    {book.availableCount > 0 ? (
                      <span className="muted">
                        Sách hiện còn trên kệ, vui lòng đến thư viện để mượn trực tiếp.
                      </span>
                    ) : null}
                  </div>
                ) : null}

                {isAuthenticated() && book.hasEBook ? (
                  <div className="record-card">
                    <StatusMessage status={purchaseStatus.status} />
                    <h3>Mua E-Book</h3>
                    <button
                      className="button secondary"
                      type="button"
                      onClick={handlePurchaseEBook}
                      disabled={book.eBookOwned}
                    >
                      {book.eBookOwned ? "Bạn đã sở hữu E-Book này" : "Mua E-Book"}
                    </button>
                    {ownedPurchase?.accessLink ? (
                      <a href={ownedPurchase.accessLink} target="_blank" rel="noreferrer">
                        Mở liên kết đã mua
                      </a>
                    ) : null}
                  </div>
                ) : null}
              </div>
            </section>
          </section>

          <section className="panel book-intro-panel">
            <div className="panel-header">
              <div>
                <span className="eyebrow">Giới thiệu sách</span>
                <h3>Tổng quan nội dung</h3>
              </div>
            </div>

            {book.longIntroduction ? (
              <div className="long-introduction">
                <p className="long-introduction-lead">
                  {book.description || `Khám phá nội dung nổi bật của ${book.title}.`}
                </p>
                <div className="long-introduction-body">{renderIntroduction(book.longIntroduction)}</div>
              </div>
            ) : (
              <div className="empty">Đầu sách này hiện chưa có phần giới thiệu chi tiết.</div>
            )}
          </section>

          <section className="panel">
            <div className="panel-header">
              <div>
                <span className="eyebrow">Đánh giá</span>
                <h3>Nhận xét của độc giả</h3>
              </div>
            </div>

            {isAuthenticated() && book.canReview ? (
              <form className="form-grid" onSubmit={handleSubmitReview}>
                <StatusMessage status={reviewStatus.status} />
                <div className="field">
                  <label>Số sao</label>
                  <select
                    value={reviewForm.rating}
                    onChange={(event) => setReviewForm({ ...reviewForm, rating: event.target.value })}
                  >
                    <option value="5">5 sao</option>
                    <option value="4">4 sao</option>
                    <option value="3">3 sao</option>
                    <option value="2">2 sao</option>
                    <option value="1">1 sao</option>
                  </select>
                </div>
                <div className="field full">
                  <label>Bình luận</label>
                  <textarea
                    value={reviewForm.comment}
                    onChange={(event) => setReviewForm({ ...reviewForm, comment: event.target.value })}
                    required
                  />
                </div>
                <div className="form-actions">
                  <button className="button" type="submit">
                    Gửi đánh giá
                  </button>
                </div>
              </form>
            ) : (
              <div className="empty">
                {isAuthenticated()
                  ? "Bạn chỉ có thể đánh giá những sách đã từng mượn hoặc đọc."
                  : "Đăng nhập để gửi đánh giá."}
              </div>
            )}

            <DataTable
              rows={reviews}
              emptyText="Chưa có đánh giá nào cho đầu sách này."
              columns={[
                { label: "Độc giả", render: (item) => item.fullName || "Ẩn danh" },
                { label: "Số sao", render: (item) => `${item.rating}/5` },
                { label: "Bình luận", render: (item) => item.comment || "-" },
                { label: "Cập nhật", render: (item) => item.updatedAt || "-" }
              ]}
            />
          </section>

          {hasPermission("GET_PHIEU_DAT_TRUOC") ? (
            <section className="panel">
              <div className="panel-header">
                <div>
                  <span className="eyebrow">Giao dịch của bạn</span>
                  <h3>Phiếu đặt trước của bạn cho đầu sách này</h3>
                </div>
              </div>
              <DataTable
                rows={myReservationsForThisBook}
                emptyText="Bạn chưa có phiếu đặt trước nào cho đầu sách này."
                columns={[
                  { label: "Tên sách", render: (item) => item.title || "Không rõ" },
                  { label: "Ngày đặt", render: (item) => item.reservationDate || "-" },
                  { label: "Trạng thái", render: (item) => item.status || "-" },
                  { label: "Thứ tự", render: (item) => item.queuePosition || "-" }
                ]}
              />
            </section>
          ) : null}
        </>
      ) : null}
    </>
  );
}
