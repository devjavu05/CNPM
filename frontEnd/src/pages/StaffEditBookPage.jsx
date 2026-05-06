import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import PageHero from "../components/PageHero";
import StatusMessage from "../components/StatusMessage";
import useStatus from "../hooks/useStatus";
import { libraryApi } from "../lib/api";
import { hasPermission } from "../lib/auth";
import { BOOK_CATEGORIES } from "../lib/categories";
import { getBookLocation, getShelfCode, LIBRARY_FLOORS } from "../lib/shelves";

const DEFAULT_UPDATE_FORM = {
  title: "",
  author: "",
  category: "",
  description: "",
  longIntroduction: "",
  floorNumber: "1",
  coverImageUrl: "",
  accessLink: "",
  eBookPrice: "",
};

export default function StaffEditBookPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const canUpdateBook = hasPermission("UPDATE_DAU_SACH");

  const [book, setBook] = useState(null);
  const [updateForm, setUpdateForm] = useState(DEFAULT_UPDATE_FORM);
  const detailStatus = useStatus();
  const updateStatus = useStatus();

  useEffect(() => {
    loadBook();
  }, [id]);

  useEffect(() => {
    if (!book) return;

    setUpdateForm({
      title: book.title || "",
      author: book.author || "",
      category: book.category || "",
      description: book.description || "",
      longIntroduction: book.longIntroduction || "",
      floorNumber: book.floorNumber ? String(book.floorNumber) : "1",
      coverImageUrl: book.coverImageUrl || "",
      accessLink: book.eBookLink || "",
      eBookPrice: book.eBookPrice ?? "",
    });
  }, [book]);

  async function loadBook() {
    detailStatus.clearStatus();
    try {
      const result = await libraryApi.getBookById(id);
      setBook(result);
    } catch (error) {
      detailStatus.setError(error.message);
    }
  }

  async function handleUpdate(event) {
    event.preventDefault();
    if (!book) return;

    updateStatus.clearStatus();
    try {
      await libraryApi.updateBook(book.id, {
        ...updateForm,
        floorNumber: Number(updateForm.floorNumber),
        eBookPrice: updateForm.eBookPrice ? Number(updateForm.eBookPrice) : null,
      });
      updateStatus.setSuccess("Cập nhật đầu sách thành công.");
      setTimeout(() => {
        navigate(`/workspace/catalog/${book.id}`, { replace: true });
      }, 1000);
    } catch (error) {
      updateStatus.setError(error.message);
    }
  }

  const updatePreviewUrl = updateForm.coverImageUrl || "";
  const updateDefaultLocation = getBookLocation(
    updateForm.category,
    updateForm.floorNumber,
  );

  if (!canUpdateBook) {
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

  return (
    <>
      <PageHero
        eyebrow="Quản lý kho sách"
        title="Chỉnh sửa thông tin đầu sách"
        description={book ? `Đang chỉnh sửa sách: ${book.title}` : "Đang tải..."}
      />

      <StatusMessage status={detailStatus.status} />

      {book ? (
        <section className="detail-layout">
          <aside className="panel detail-cover-panel">
            <div className="detail-cover-frame">
              {updatePreviewUrl ? (
                <img
                  className="book-cover"
                  src={updatePreviewUrl}
                  alt="Xem trước ảnh bìa"
                />
              ) : (
                <div className="book-cover book-cover-fallback">TV</div>
              )}
            </div>
            <div className="detail-cover-actions">
              <Link
                className="ghost-button"
                to={`/workspace/catalog/${book.id}`}
              >
                Quay lại chi tiết
              </Link>
            </div>
          </aside>

          <section className="panel detail-main-panel">
            <span className="eyebrow">Công cụ thủ thư</span>
            <h1>Chỉnh sửa đầu sách</h1>
            <StatusMessage status={updateStatus.status} />

            <form
              className="form-grid detail-side-form"
              onSubmit={handleUpdate}
            >
              <div className="field">
                <label>Tên sách</label>
                <input
                  value={updateForm.title}
                  onChange={(event) =>
                    setUpdateForm({ ...updateForm, title: event.target.value })
                  }
                  required
                />
              </div>
              <div className="field">
                <label>Tác giả</label>
                <input
                  value={updateForm.author}
                  onChange={(event) =>
                    setUpdateForm({ ...updateForm, author: event.target.value })
                  }
                  required
                />
              </div>
              <div className="field">
                <label>Thể loại</label>
                <select
                  value={updateForm.category}
                  onChange={(event) =>
                    setUpdateForm({
                      ...updateForm,
                      category: event.target.value,
                    })
                  }
                  required
                >
                  <option value="">Chọn thể loại</option>
                  {BOOK_CATEGORIES.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label>Tầng lưu trữ</label>
                <select
                  value={updateForm.floorNumber}
                  onChange={(event) =>
                    setUpdateForm({
                      ...updateForm,
                      floorNumber: event.target.value,
                    })
                  }
                  required
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
                    updateForm.category
                      ? `Kệ ${getShelfCode(updateForm.category)}`
                      : "Chọn thể loại trước"
                  }
                  readOnly
                />
              </div>
              <div className="field full">
                <label>Vị trí đầu sách</label>
                <input
                  value={
                    updateDefaultLocation ||
                    "Chọn thể loại và tầng để xác định vị trí"
                  }
                  readOnly
                />
              </div>
              <div className="field full">
                <label>Link ảnh bìa</label>
                <input
                  type="url"
                  placeholder="https://example.com/cover.jpg"
                  value={updateForm.coverImageUrl}
                  onChange={(event) =>
                    setUpdateForm({
                      ...updateForm,
                      coverImageUrl: event.target.value,
                    })
                  }
                />
              </div>
              <div className="field full">
                <label>Mô tả</label>
                <textarea
                  value={updateForm.description}
                  onChange={(event) =>
                    setUpdateForm({
                      ...updateForm,
                      description: event.target.value,
                    })
                  }
                />
              </div>
              <div className="field full">
                <label>Giới thiệu dài về cuốn sách</label>
                <textarea
                  value={updateForm.longIntroduction}
                  onChange={(event) =>
                    setUpdateForm({
                      ...updateForm,
                      longIntroduction: event.target.value,
                    })
                  }
                />
              </div>
              <div className="field full">
                <label>Link trang tải E-Book</label>
                <input
                  type="url"
                  placeholder="https://example.com/tai-sach"
                  value={updateForm.accessLink}
                  onChange={(event) =>
                    setUpdateForm({
                      ...updateForm,
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
                  value={updateForm.eBookPrice}
                  onChange={(event) =>
                    setUpdateForm({
                      ...updateForm,
                      eBookPrice: event.target.value,
                    })
                  }
                />
              </div>
              <div className="form-actions">
                <button className="button secondary" type="submit">
                  Cập nhật
                </button>
                <Link
                  className="ghost-button"
                  to={`/workspace/catalog/${book.id}`}
                >
                  Đóng
                </Link>
              </div>
            </form>
          </section>
        </section>
      ) : null}
    </>
  );
}
