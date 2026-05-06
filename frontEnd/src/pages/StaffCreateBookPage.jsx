import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import PageHero from "../components/PageHero";
import StatusMessage from "../components/StatusMessage";
import useStatus from "../hooks/useStatus";
import { libraryApi } from "../lib/api";
import { hasPermission } from "../lib/auth";
import { BOOK_CATEGORIES } from "../lib/categories";
import { getBookLocation, getShelfCode, LIBRARY_FLOORS } from "../lib/shelves";

const DEFAULT_CREATE_FORM = {
  title: "",
  author: "",
  category: "",
  description: "",
  longIntroduction: "",
  floorNumber: "1",
  publishYear: "",
  coverImageUrl: "",
  copyCount: 1,
  physicalCondition: "NEW",
  accessLink: "",
  eBookPrice: "",
};

export default function StaffCreateBookPage() {
  const navigate = useNavigate();
  const canCreateBook = hasPermission("CREATE_DAU_SACH");

  const [createForm, setCreateForm] = useState(DEFAULT_CREATE_FORM);
  const createStatus = useStatus();

  async function handleCreate(event) {
    event.preventDefault();
    createStatus.clearStatus();
    try {
      const created = await libraryApi.createInventoryBook({
        ...createForm,
        floorNumber: Number(createForm.floorNumber),
        publishYear: createForm.publishYear
          ? Number(createForm.publishYear)
          : null,
        copyCount: Number(createForm.copyCount),
        eBookPrice: createForm.eBookPrice ? Number(createForm.eBookPrice) : null,
      });
      createStatus.setSuccess("Đã thêm đầu sách mới cùng lô bản sao ban đầu.");
      setTimeout(() => {
        navigate(`/workspace/catalog/${created.id}`, { replace: true });
      }, 1000);
    } catch (error) {
      createStatus.setError(error.message);
    }
  }

  const createPreviewUrl = createForm.coverImageUrl || "";
  const createDefaultLocation = getBookLocation(
    createForm.category,
    createForm.floorNumber,
  );

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

  return (
    <>
      <PageHero
        eyebrow="Kho sách"
        title="Thêm đầu sách vào kho"
        description="Tạo một đầu sách mới và nhập bản sao ban đầu."
      />

      <section className="detail-layout">
        <aside className="panel detail-cover-panel">
          <div className="detail-cover-frame">
            {createPreviewUrl ? (
              <img
                className="book-cover"
                src={createPreviewUrl}
                alt="Xem trước ảnh bìa"
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
        </aside>

        <section className="panel detail-main-panel">
          <span className="eyebrow">Tạo đầu sách mới</span>
          <h1 className="detail-title">Thêm đầu sách vào kho</h1>
          <StatusMessage status={createStatus.status} />

          <form className="form-grid" onSubmit={handleCreate}>
            <div className="field">
              <label>Tên sách</label>
              <input
                value={createForm.title}
                onChange={(event) =>
                  setCreateForm({ ...createForm, title: event.target.value })
                }
                required
              />
            </div>
            <div className="field">
              <label>Tác giả</label>
              <input
                value={createForm.author}
                onChange={(event) =>
                  setCreateForm({ ...createForm, author: event.target.value })
                }
                required
              />
            </div>
            <div className="field">
              <label>Thể loại</label>
              <select
                value={createForm.category}
                onChange={(event) =>
                  setCreateForm({ ...createForm, category: event.target.value })
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
              <label>Năm xuất bản</label>
              <input
                type="number"
                value={createForm.publishYear}
                onChange={(event) =>
                  setCreateForm({
                    ...createForm,
                    publishYear: event.target.value,
                  })
                }
              />
            </div>
            <div className="field full">
              <label>Link ảnh bìa</label>
              <input
                type="url"
                placeholder="https://example.com/cover.jpg"
                value={createForm.coverImageUrl}
                onChange={(event) =>
                  setCreateForm({
                    ...createForm,
                    coverImageUrl: event.target.value,
                  })
                }
              />
            </div>
            <div className="field">
              <label>Số bản sao ban đầu</label>
              <input
                type="number"
                min="0"
                value={createForm.copyCount}
                onChange={(event) =>
                  setCreateForm({
                    ...createForm,
                    copyCount: event.target.value,
                  })
                }
                required
              />
            </div>
            <div className="field">
              <label>Tầng lưu trữ</label>
              <select
                value={createForm.floorNumber}
                onChange={(event) =>
                  setCreateForm({
                    ...createForm,
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
                  createForm.category
                    ? `Kệ ${getShelfCode(createForm.category)}`
                    : "Chọn thể loại trước"
                }
                readOnly
              />
            </div>
            <div className="field full">
              <label>Vị trí đầu sách</label>
              <input
                value={
                  createDefaultLocation ||
                  "Chọn thể loại và tầng để xác định vị trí"
                }
                readOnly
              />
            </div>
            <div className="field">
              <label>Tình trạng vật lý mặc định</label>
              <select
                value={createForm.physicalCondition}
                onChange={(event) =>
                  setCreateForm({
                    ...createForm,
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
            <div className="field full">
              <label>Mô tả</label>
              <textarea
                value={createForm.description}
                onChange={(event) =>
                  setCreateForm({
                    ...createForm,
                    description: event.target.value,
                  })
                }
              />
            </div>
            <div className="field full">
              <label>Giới thiệu dài về cuốn sách</label>
              <textarea
                value={createForm.longIntroduction}
                onChange={(event) =>
                  setCreateForm({
                    ...createForm,
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
                value={createForm.accessLink}
                onChange={(event) =>
                  setCreateForm({
                    ...createForm,
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
                value={createForm.eBookPrice}
                onChange={(event) =>
                  setCreateForm({
                    ...createForm,
                    eBookPrice: event.target.value,
                  })
                }
              />
            </div>
            <div className="form-actions">
              <button className="button" type="submit">
                Lưu đầu sách
              </button>
              <Link className="ghost-button" to="/workspace/catalog">
                Đóng
              </Link>
            </div>
          </form>
        </section>
      </section>
    </>
  );
}
