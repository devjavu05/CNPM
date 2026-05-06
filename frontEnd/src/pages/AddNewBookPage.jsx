import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import PageHero from "../components/PageHero";
import StatusMessage from "../components/StatusMessage";
import useStatus from "../hooks/useStatus";
import { libraryApi } from "../lib/api";
import { hasPermission } from "../lib/auth";
import { BOOK_CATEGORIES } from "../lib/categories";
import { getBookLocation, getShelfCode, LIBRARY_FLOORS } from "../lib/shelves";

const DEFAULT_FORM = {
  title: "",
  author: "",
  category: "",
  isbn: "",
  description: "",
  longIntroduction: "",
  floorNumber: "1",
  publishYear: new Date().getFullYear(),
  publisher: "",
  copyCount: 1,
  physicalCondition: "NEW",
  accessLink: "",
  eBookPrice: "",
  language: "Tiếng Việt",
  tags: "",
};

export default function AddNewBookPage() {
  const navigate = useNavigate();
  const canCreateBook = hasPermission("CREATE_DAU_SACH");

  const [form, setForm] = useState(DEFAULT_FORM);
  const [coverFile, setCoverFile] = useState(null);
  const [validationErrors, setValidationErrors] = useState({});

  const status = useStatus();

  if (!canCreateBook) {
    return (
      <>
        <PageHero
          eyebrow="Cảnh báo"
          title="Bạn không có quyền truy cập trang này"
        />
        <section className="panel section-panel">
          <Link className="button" to="/workspace/catalog">
            Quay lại kho sách
          </Link>
        </section>
      </>
    );
  }

  function validateForm() {
    const errors = {};

    if (!form.title?.trim()) {
      errors.title = "Tên sách là bắt buộc";
    } else if (form.title.length > 255) {
      errors.title = "Tên sách không được vượt quá 255 ký tự";
    }

    if (!form.author?.trim()) {
      errors.author = "Tác giả là bắt buộc";
    }

    if (!form.category) {
      errors.category = "Vui lòng chọn thể loại";
    }

    if (
      form.publishYear &&
      (form.publishYear < 1000 ||
        form.publishYear > new Date().getFullYear() + 1)
    ) {
      errors.publishYear = "Năm xuất bản không hợp lệ";
    }

    if (form.copyCount < 1) {
      errors.copyCount = "Số lượng bản sao phải lớn hơn 0";
    }

    if (form.eBookPrice && Number(form.eBookPrice) < 0) {
      errors.eBookPrice = "Giá E-Book không thể âm";
    }

    if (form.isbn && !/^\d{10}(\d{3})?$/.test(form.isbn.replace(/-/g, ""))) {
      errors.isbn = "Định dạng ISBN không hợp lệ";
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  }

  function handleFileSelection(file) {
    if (!file) {
      setCoverFile(null);
      return;
    }
    if (!file.type.startsWith("image/")) {
      status.setError("Vui lòng chọn một tệp hình ảnh");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      status.setError("Kích thước tệp hình ảnh không được vượt quá 5MB");
      return;
    }
    setCoverFile({ file, previewUrl: URL.createObjectURL(file) });
    status.clearStatus();
  }

  async function uploadCoverIfNeeded() {
    if (!coverFile?.file) return null;
    return libraryApi.uploadBookCover(coverFile.file);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    status.clearStatus();

    if (!validateForm()) {
      status.setError("Vui lòng kiểm tra lại thông tin nhập vào");
      return;
    }

    try {
      const uploadedCoverUrl = await uploadCoverIfNeeded();

      const bookData = {
        title: form.title.trim(),
        author: form.author.trim(),
        category: form.category,
        isbn: form.isbn?.trim() || null,
        description: form.description?.trim() || null,
        longIntroduction: form.longIntroduction?.trim() || null,
        floorNumber: Number(form.floorNumber),
        publishYear: form.publishYear ? Number(form.publishYear) : null,
        publisher: form.publisher?.trim() || null,
        copyCount: Number(form.copyCount),
        physicalCondition: form.physicalCondition,
        accessLink: form.accessLink?.trim() || null,
        eBookPrice: form.eBookPrice ? Number(form.eBookPrice) : null,
        coverImageUrl: uploadedCoverUrl,
        language: form.language || "Tiếng Việt",
        tags:
          form.tags
            ?.split(",")
            .map((t) => t.trim())
            .filter((t) => t) || [],
      };

      const created = await libraryApi.createInventoryBook(bookData);
      status.setSuccess("✓ Đã thêm đầu sách mới thành công!");

      setTimeout(() => {
        navigate(`/workspace/catalog/${created.id}`, { replace: true });
      }, 1500);
    } catch (error) {
      status.setError(error.message);
    }
  }

  const previewUrl = coverFile?.previewUrl || "";
  const defaultLocation = getBookLocation(form.category, form.floorNumber);

  return (
    <>
      <PageHero
        eyebrow="Kho sách"
        title="Thêm đầu sách mới"
        description="Nhập đầy đủ thông tin sách để thêm vào hệ thống. Tất cả trường có dấu (*) là bắt buộc."
      />

      <section className="detail-layout">
        <aside className="panel detail-cover-panel">
          <div className="detail-cover-frame">
            {previewUrl ? (
              <img
                className="book-cover"
                src={previewUrl}
                alt="Xem trước ảnh bìa"
              />
            ) : (
              <div className="book-cover book-cover-fallback">
                <div
                  style={{
                    fontSize: "12px",
                    color: "#999",
                    textAlign: "center",
                    paddingTop: "30%",
                  }}
                >
                  Chưa có ảnh bìa
                </div>
              </div>
            )}
          </div>
          <div className="detail-cover-actions">
            <label
              className="button"
              style={{ cursor: "pointer", marginBottom: "0.5rem" }}
            >
              Chọn ảnh bìa
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={(event) =>
                  handleFileSelection(event.target.files?.[0] || null)
                }
                style={{ display: "none" }}
              />
            </label>
            <Link className="ghost-button" to="/workspace/catalog">
              Quay lại
            </Link>
          </div>
        </aside>

        <section className="panel detail-main-panel">
          <span className="eyebrow">Tạo đầu sách</span>
          <h1 className="detail-title">Thêm sách vào hệ thống</h1>
          <StatusMessage status={status.status} />

          <form className="form-grid detail-side-form" onSubmit={handleSubmit}>
            {/* Thông tin cơ bản */}
            <fieldset
              style={{
                gridColumn: "1 / -1",
                borderTop: "1px solid #e5e7eb",
                paddingTop: "1.5rem",
              }}
            >
              <legend
                style={{
                  fontSize: "0.875rem",
                  fontWeight: 600,
                  color: "#6b7280",
                  marginBottom: "1rem",
                }}
              >
                Thông tin cơ bản
              </legend>

              <div className="field">
                <label>
                  Tên sách <span style={{ color: "red" }}>*</span>
                </label>
                <input
                  value={form.title}
                  onChange={(event) =>
                    setForm({ ...form, title: event.target.value })
                  }
                  maxLength={255}
                  placeholder="Nhập tên sách"
                  className={validationErrors.title ? "error" : ""}
                />
                {validationErrors.title && (
                  <small style={{ color: "red" }}>
                    ⚠ {validationErrors.title}
                  </small>
                )}
              </div>

              <div className="field">
                <label>
                  Tác giả <span style={{ color: "red" }}>*</span>
                </label>
                <input
                  value={form.author}
                  onChange={(event) =>
                    setForm({ ...form, author: event.target.value })
                  }
                  placeholder="Nhập tên tác giả"
                  className={validationErrors.author ? "error" : ""}
                />
                {validationErrors.author && (
                  <small style={{ color: "red" }}>
                    ⚠ {validationErrors.author}
                  </small>
                )}
              </div>

              <div className="field">
                <label>
                  Thể loại <span style={{ color: "red" }}>*</span>
                </label>
                <select
                  value={form.category}
                  onChange={(event) =>
                    setForm({ ...form, category: event.target.value })
                  }
                  className={validationErrors.category ? "error" : ""}
                >
                  <option value="">-- Chọn thể loại --</option>
                  {BOOK_CATEGORIES.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
                {validationErrors.category && (
                  <small style={{ color: "red" }}>
                    ⚠ {validationErrors.category}
                  </small>
                )}
              </div>

              <div className="field">
                <label>ISBN</label>
                <input
                  value={form.isbn}
                  onChange={(event) =>
                    setForm({ ...form, isbn: event.target.value })
                  }
                  placeholder="978-0-123456-78-9"
                  className={validationErrors.isbn ? "error" : ""}
                />
                {validationErrors.isbn && (
                  <small style={{ color: "red" }}>
                    ⚠ {validationErrors.isbn}
                  </small>
                )}
              </div>

              <div className="field">
                <label>Nhà xuất bản</label>
                <input
                  value={form.publisher}
                  onChange={(event) =>
                    setForm({ ...form, publisher: event.target.value })
                  }
                  placeholder="Nhập tên nhà xuất bản"
                />
              </div>

              <div className="field">
                <label>Năm xuất bản</label>
                <input
                  type="number"
                  value={form.publishYear}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      publishYear: event.target.value,
                    })
                  }
                  min={1000}
                  max={new Date().getFullYear() + 1}
                  className={validationErrors.publishYear ? "error" : ""}
                />
                {validationErrors.publishYear && (
                  <small style={{ color: "red" }}>
                    ⚠ {validationErrors.publishYear}
                  </small>
                )}
              </div>

              <div className="field">
                <label>Ngôn ngữ</label>
                <select
                  value={form.language}
                  onChange={(event) =>
                    setForm({ ...form, language: event.target.value })
                  }
                >
                  <option value="Tiếng Việt">Tiếng Việt</option>
                  <option value="Tiếng Anh">Tiếng Anh</option>
                  <option value="Tiếng Pháp">Tiếng Pháp</option>
                  <option value="Tiếng Trung">Tiếng Trung</option>
                  <option value="Khác">Khác</option>
                </select>
              </div>
            </fieldset>

            {/* Thông tin vật lý */}
            <fieldset
              style={{
                gridColumn: "1 / -1",
                borderTop: "1px solid #e5e7eb",
                paddingTop: "1.5rem",
              }}
            >
              <legend
                style={{
                  fontSize: "0.875rem",
                  fontWeight: 600,
                  color: "#6b7280",
                  marginBottom: "1rem",
                }}
              >
                Thông tin vật lý
              </legend>

              <div className="field">
                <label>
                  Số bản sao ban đầu <span style={{ color: "red" }}>*</span>
                </label>
                <input
                  type="number"
                  min="1"
                  max="999"
                  value={form.copyCount}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      copyCount: event.target.value,
                    })
                  }
                  className={validationErrors.copyCount ? "error" : ""}
                />
                {validationErrors.copyCount && (
                  <small style={{ color: "red" }}>
                    ⚠ {validationErrors.copyCount}
                  </small>
                )}
              </div>

              <div className="field">
                <label>Tình trạng vật lý mặc định</label>
                <select
                  value={form.physicalCondition}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      physicalCondition: event.target.value,
                    })
                  }
                >
                  <option value="NEW">Mới</option>
                  <option value="GOOD">Tốt</option>
                  <option value="WORN">Cũ</option>
                  <option value="DAMAGED">Hỏng</option>
                </select>
              </div>

              <div className="field">
                <label>Tầng lưu trữ</label>
                <select
                  value={form.floorNumber}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      floorNumber: event.target.value,
                    })
                  }
                >
                  {LIBRARY_FLOORS.map((floor) => (
                    <option key={floor} value={String(floor)}>
                      Tầng {floor}
                    </option>
                  ))}
                </select>
              </div>

              <div className="field">
                <label>Kệ theo thể loại</label>
                <input
                  value={
                    form.category
                      ? `Kệ ${getShelfCode(form.category)}`
                      : "Chọn thể loại trước"
                  }
                  readOnly
                  style={{ backgroundColor: "#f3f4f6" }}
                />
              </div>

              <div className="field full">
                <label>Vị trí đầu sách</label>
                <input
                  value={
                    defaultLocation ||
                    "Chọn thể loại và tầng để xác định vị trí"
                  }
                  readOnly
                  style={{ backgroundColor: "#f3f4f6" }}
                />
              </div>
            </fieldset>

            {/* Thông tin mô tả */}
            <fieldset
              style={{
                gridColumn: "1 / -1",
                borderTop: "1px solid #e5e7eb",
                paddingTop: "1.5rem",
              }}
            >
              <legend
                style={{
                  fontSize: "0.875rem",
                  fontWeight: 600,
                  color: "#6b7280",
                  marginBottom: "1rem",
                }}
              >
                Thông tin mô tả
              </legend>

              <div className="field full">
                <label>Mô tả ngắn</label>
                <textarea
                  value={form.description}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      description: event.target.value,
                    })
                  }
                  placeholder="Mô tả ngắn gọn về sách (1-2 đoạn)"
                  rows={3}
                />
              </div>

              <div className="field full">
                <label>Giới thiệu chi tiết</label>
                <textarea
                  value={form.longIntroduction}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      longIntroduction: event.target.value,
                    })
                  }
                  placeholder="Giới thiệu dài về cuốn sách"
                  rows={5}
                />
              </div>

              <div className="field full">
                <label>Các từ khóa/Thẻ</label>
                <input
                  value={form.tags}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      tags: event.target.value,
                    })
                  }
                  placeholder="Nhập các từ khóa cách nhau bằng dấu phẩy (ví dụ: khoa học, tưởng tượng, kinh điển)"
                />
              </div>
            </fieldset>

            {/* Thông tin E-Book */}
            <fieldset
              style={{
                gridColumn: "1 / -1",
                borderTop: "1px solid #e5e7eb",
                paddingTop: "1.5rem",
              }}
            >
              <legend
                style={{
                  fontSize: "0.875rem",
                  fontWeight: 600,
                  color: "#6b7280",
                  marginBottom: "1rem",
                }}
              >
                Thông tin E-Book (Tùy chọn)
              </legend>

              <div className="field full">
                <label>Link trang tải E-Book</label>
                <input
                  type="url"
                  placeholder="https://example.com/tải-sách"
                  value={form.accessLink}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      accessLink: event.target.value,
                    })
                  }
                />
              </div>

              <div className="field">
                <label>Giá E-Book (VND)</label>
                <input
                  type="number"
                  min="0"
                  step="1000"
                  placeholder="49000"
                  value={form.eBookPrice}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      eBookPrice: event.target.value,
                    })
                  }
                  className={validationErrors.eBookPrice ? "error" : ""}
                />
                {validationErrors.eBookPrice && (
                  <small style={{ color: "red" }}>
                    ⚠ {validationErrors.eBookPrice}
                  </small>
                )}
              </div>
            </fieldset>

            <div
              className="form-actions"
              style={{ gridColumn: "1 / -1", marginTop: "2rem" }}
            >
              <button className="button" type="submit">
                💾 Lưu đầu sách
              </button>
              <Link className="ghost-button" to="/workspace/catalog">
                ✕ Hủy
              </Link>
            </div>
          </form>
        </section>
      </section>
    </>
  );
}
