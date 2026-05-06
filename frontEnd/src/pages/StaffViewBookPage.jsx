import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import DataTable from "../components/DataTable";
import StatusMessage from "../components/StatusMessage";
import useStatus from "../hooks/useStatus";
import { libraryApi } from "../lib/api";
import { hasPermission } from "../lib/auth";
import {
  decodeBookBarcode,
  decodeShelfLocation,
  getBookLocation,
} from "../lib/shelves";

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

export default function StaffViewBookPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const canUpdateBook = hasPermission("UPDATE_DAU_SACH");
  const canCreateCopy = hasPermission("CREATE_CUON_SACH");
  const canGetCopies = hasPermission("GET_CUON_SACH");

  const [book, setBook] = useState(null);
  const [copies, setCopies] = useState([]);
  const [copyKeyword, setCopyKeyword] = useState("");

  const detailStatus = useStatus();
  const copyStatus = useStatus();

  useEffect(() => {
    loadBook();
  }, [id]);

  useEffect(() => {
    if (!book) return;

    if (canGetCopies) {
      loadCopies(book.id);
    }
  }, [book, canGetCopies]);

  async function loadBook() {
    detailStatus.clearStatus();
    try {
      const result = await libraryApi.getLookupBookDetail(id);
      setBook(result);
    } catch (error) {
      detailStatus.setError(error.message);
    }
  }

  async function loadCopies(bookId) {
    copyStatus.clearStatus();
    try {
      const result = await libraryApi.getCopies(bookId);
      setCopies(result || []);
    } catch (error) {
      setCopies([]);
      copyStatus.setError(error.message);
    }
  }

  async function handleDeleteBook() {
    if (!book) return;
    const accepted = window.confirm(
      `Bạn có chắc chắn muốn xóa đầu sách \"${book.title}\" không?`,
    );
    if (!accepted) return;

    detailStatus.clearStatus();
    try {
      await libraryApi.deleteBook(book.id);
      navigate("/workspace/catalog", { replace: true });
    } catch (error) {
      detailStatus.setError(error.message);
    }
  }

  async function handleLiquidate(barcode) {
    const accepted = window.confirm(
      `Bạn có chắc chắn muốn thanh lý bản sao mã ${barcode} không?`,
    );
    if (!accepted) return;

    copyStatus.clearStatus();
    try {
      await libraryApi.liquidateCopy(barcode);
      await loadBook();
      await loadCopies(book.id);
      copyStatus.setSuccess("Thanh lý bản sao thành công.");
    } catch (error) {
      copyStatus.setError(error.message);
    }
  }

  const highlightedBarcode = location.state?.barcodeResult?.barcode || null;
  const filteredCopies = useMemo(() => {
    const source = copies || [];
    const keyword = copyKeyword.trim().toLowerCase();

    if (!keyword) {
      return highlightedBarcode
        ? source.filter((copy) => copy.barcode === highlightedBarcode)
        : [];
    }

    return source.filter((copy) => {
      const barcodeText = String(copy.barcode || "").toLowerCase();
      const locationText = String(
        copy.location || copy.defaultLocation || "",
      ).toLowerCase();
      return barcodeText.includes(keyword) || locationText.includes(keyword);
    });
  }, [copies, copyKeyword, highlightedBarcode]);

  const summary = useMemo(() => {
    const activeCopies = copies.filter((copy) => copy.status !== "THANH_LY");
    return {
      total: activeCopies.length,
      available: activeCopies.filter(
        (copy) => copy.status === "AVAILABLE" || copy.isAvailable,
      ).length,
      borrowed: activeCopies.filter(
        (copy) =>
          copy.status === "BORROWED" ||
          copy.status === "BORROWING" ||
          !copy.isAvailable,
      ).length,
      lost: activeCopies.filter((copy) => copy.status === "LOST").length,
    };
  }, [copies]);

  const defaultShelfLocation = decodeShelfLocation(
    book?.defaultLocation || book?.viTriKe?.[0],
    book?.category,
  );

  return (
    <>
      <StatusMessage status={detailStatus.status} />
      {book ? (
        <section className="staff-detail-workspace">
          <section className="detail-layout">
            <aside className="panel detail-cover-panel">
              <div className="detail-cover-frame">
                {book.coverImageUrl ? (
                  <img
                    className="book-cover"
                    src={book.coverImageUrl}
                    alt={`Bìa sách ${book.title}`}
                  />
                ) : (
                  <div className="book-cover book-cover-fallback">TV</div>
                )}
              </div>
              <div className="detail-cover-actions">
                <Link className="ghost-button" to="/workspace/catalog">
                  Quay lại kho sách
                </Link>
              </div>
              <div className="context-actions">
                {canUpdateBook ? (
                  <Link
                    className="ghost-button"
                    to={`/workspace/catalog/${book.id}/edit`}
                  >
                    Chỉnh sửa sách
                  </Link>
                ) : null}
                {canCreateCopy ? (
                  <Link
                    className="ghost-button"
                    to={`/workspace/catalog/${book.id}/add-copies`}
                  >
                    Nhập thêm bản sao
                  </Link>
                ) : null}
                {canUpdateBook ? (
                  <button
                    className="ghost-button"
                    type="button"
                    onClick={handleDeleteBook}
                  >
                    Xóa đầu sách
                  </button>
                ) : null}
              </div>
            </aside>

            <section className="panel detail-main-panel">
              <span className="eyebrow">Chi tiết đầu sách</span>
              <h1 className="detail-title">{book.title}</h1>
              <p className="detail-author-line">
                <strong>Tác giả:</strong> {book.author || "Chưa cập nhật"}{" "}
                <span className="detail-dot">•</span>
                <strong> Thể loại:</strong> {book.category || "Chưa phân loại"}
              </p>
              <p className="detail-summary">
                {book.description || "Đầu sách này chưa có mô tả chi tiết."}
              </p>

              <div className="detail-primary-actions">
                <Link className="button" to="/workspace/catalog">
                  Quay lại kho sách
                </Link>
                {canUpdateBook ? (
                  <Link
                    className="ghost-button"
                    to={`/workspace/catalog/${book.id}/edit`}
                  >
                    Chỉnh sửa sách
                  </Link>
                ) : (
                  <button className="ghost-button" disabled>
                    Chỉnh sửa sách
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

              <div className="detail-meta-grid">
                <div className="record-card">
                  <strong>Tổng bản sao</strong>
                  <span>{summary.total}</span>
                </div>
                <div className="record-card">
                  <strong>Sẵn sàng</strong>
                  <span>{summary.available}</span>
                </div>
                <div className="record-card">
                  <strong>Đang mượn</strong>
                  <span>{summary.borrowed}</span>
                </div>
                <div className="record-card">
                  <strong>Báo mất</strong>
                  <span>{summary.lost}</span>
                </div>
              </div>

              <div className="detail-meta-grid">
                <div className="record-card">
                  <strong>E-Book</strong>
                  <span>{book.hasEBook ? "Đã cấu hình" : "Chưa có"}</span>
                </div>
                <div className="record-card">
                  <strong>Link tải</strong>
                  <span>
                    {book.eBookLink ? "Đã cấu hình" : "Chưa cập nhật"}
                  </span>
                </div>
                <div className="record-card">
                  <strong>Truy cập</strong>
                  <span>
                    {book.hasEBook ? "Mở sang web ngoài" : "Không có"}
                  </span>
                </div>
              </div>

              <div className="detail-section">
                <h3>Vị trí và tình trạng</h3>
                <p>
                  <strong>Tình trạng hiển thị:</strong> {book.tinhTrang}
                </p>
                <p>
                  <strong>Vị trí kệ:</strong>{" "}
                  {book.defaultLocation ||
                    (book.viTriKe?.length
                      ? book.viTriKe.join(", ")
                      : "Chưa có vị trí")}
                </p>
                {defaultShelfLocation ? (
                  <div className="record-card shelf-decode-card">
                    <strong>Giải mã vị trí mặc định</strong>
                    <span>{defaultShelfLocation.humanText}</span>
                    <small>
                      {defaultShelfLocation.shelfName
                        ? `Kệ thực tế: ${defaultShelfLocation.shelfName}`
                        : "Chưa xác định kệ"}
                    </small>
                  </div>
                ) : null}
              </div>
            </section>
          </section>

          <section className="panel book-intro-panel">
            <div className="panel-header">
              <div>
                <span className="eyebrow">Giới thiệu sách</span>
                <h3>Nội dung hiển thị cho độc giả</h3>
              </div>
            </div>
            {book.longIntroduction ? (
              <div className="long-introduction">
                <p className="long-introduction-lead">
                  {book.description || `Giới thiệu chi tiết về ${book.title}.`}
                </p>
                <div className="long-introduction-body">
                  {renderIntroduction(book.longIntroduction)}
                </div>
              </div>
            ) : (
              <div className="empty">
                Đầu sách này chưa có phần giới thiệu dài.
              </div>
            )}
          </section>

          <section className="panel">
            <div className="panel-header">
              <div>
                <span className="eyebrow">Bản sao vật lý</span>
                <h3>Tra cứu và thao tác trên từng cuốn</h3>
              </div>
            </div>

            {highlightedBarcode ? (
              <div className="record-card">
                <strong>Kết quả từ tra mã vạch</strong>
                <p className="book-tile-meta">
                  Mã vừa tra: {highlightedBarcode}. Hệ thống đang làm nổi bật
                  cuốn này trong bảng bên dưới.
                </p>
              </div>
            ) : null}

            <div className="field full">
              <label>Tìm cuốn sách theo mã vạch hoặc vị trí kệ</label>
              <input
                placeholder="Nhập mã vạch hoặc vị trí kệ để lọc bản sao"
                value={copyKeyword}
                onChange={(event) => setCopyKeyword(event.target.value)}
              />
            </div>

            <StatusMessage status={copyStatus.status} />

            {copyKeyword.trim() || highlightedBarcode ? (
              <DataTable
                rows={filteredCopies}
                emptyText="Không tìm thấy bản sao nào khớp với từ khóa."
                columns={[
                  {
                    label: "Mã cuốn",
                    render: (row) => {
                      const decodedBarcode = decodeBookBarcode(row.barcode);
                      return (
                        <div className="table-detail-cell">
                          <strong>{row.barcode || "-"}</strong>
                          <span>
                            {decodedBarcode?.humanText ||
                              "Chưa giải mã được mã cuốn sách"}
                          </span>
                        </div>
                      );
                    },
                  },
                  {
                    label: "Vị trí",
                    render: (row) => {
                      const decodedLocation = decodeShelfLocation(
                        row.location || row.defaultLocation,
                        book?.category,
                      );
                      return (
                        <div className="table-detail-cell">
                          <strong>
                            {row.location ||
                              row.defaultLocation ||
                              "Chưa cập nhật"}
                          </strong>
                          <span>
                            {decodedLocation?.humanText ||
                              "Chưa giải mã được vị trí kệ"}
                          </span>
                        </div>
                      );
                    },
                  },
                  {
                    label: "Trạng thái",
                    render: (row) => row.status || "Chưa rõ",
                  },
                  {
                    label: "Tình trạng",
                    render: (row) => row.physicalCondition || "NEW",
                  },
                  {
                    label: "Thanh lý",
                    render: (row) =>
                      row.status === "THANH_LY" ? (
                        <span className="chip subtle">Đã thanh lý</span>
                      ) : (
                        <button
                          className="ghost-button"
                          type="button"
                          onClick={() => handleLiquidate(row.barcode)}
                        >
                          Thanh lý
                        </button>
                      ),
                  },
                ]}
              />
            ) : (
              <div className="empty">
                Nhập mã vạch hoặc vị trí kệ để hiển thị đúng các bản sao cần
                thao tác.
              </div>
            )}
          </section>
        </section>
      ) : null}
    </>
  );
}
