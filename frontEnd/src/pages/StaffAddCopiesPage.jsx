import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import PageHero from "../components/PageHero";
import StatusMessage from "../components/StatusMessage";
import useStatus from "../hooks/useStatus";
import { libraryApi } from "../lib/api";
import { hasPermission } from "../lib/auth";

const DEFAULT_ADD_COPIES_FORM = {
  copyCount: 1,
  physicalCondition: "NEW",
  status: "AVAILABLE",
};

export default function StaffAddCopiesPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const canCreateCopy = hasPermission("CREATE_CUON_SACH");

  const [book, setBook] = useState(null);
  const [addCopiesForm, setAddCopiesForm] = useState(DEFAULT_ADD_COPIES_FORM);

  const detailStatus = useStatus();
  const addCopiesStatus = useStatus();

  useEffect(() => {
    loadBook();
  }, [id]);

  async function loadBook() {
    detailStatus.clearStatus();
    try {
      const result = await libraryApi.getLookupBookDetail(id);
      setBook(result);
    } catch (error) {
      detailStatus.setError(error.message);
    }
  }

  async function handleAddCopies(event) {
    event.preventDefault();
    if (!book) return;

    addCopiesStatus.clearStatus();
    try {
      await libraryApi.addCopiesToBook(book.id, {
        ...addCopiesForm,
        copyCount: Number(addCopiesForm.copyCount),
      });
      addCopiesStatus.setSuccess("Đã nhập thêm bản sao.");
      setTimeout(() => {
        navigate(`/workspace/catalog/${book.id}`, { replace: true });
      }, 1000);
    } catch (error) {
      addCopiesStatus.setError(error.message);
    }
  }

  if (!canCreateCopy) {
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
        title="Nhập thêm bản sao"
        description={book ? `Đầu sách: ${book.title}` : "Đang tải..."}
      />

      <StatusMessage status={detailStatus.status} />

      {book ? (
        <section className="panel section-panel">
          <StatusMessage status={addCopiesStatus.status} />

          <form className="form-grid" onSubmit={handleAddCopies}>
            <div className="field full">
              <label>Đầu sách đang chọn</label>
              <input
                value={`${book.title} - ${book.author || "Chưa cập nhật tác giả"}`}
                readOnly
              />
            </div>
            <div className="field">
              <label>Số lượng bản sao</label>
              <input
                type="number"
                min="1"
                value={addCopiesForm.copyCount}
                onChange={(event) =>
                  setAddCopiesForm({
                    ...addCopiesForm,
                    copyCount: event.target.value,
                  })
                }
                required
              />
            </div>
            <div className="field">
              <label>Vị trí đầu sách đang dùng</label>
              <input
                value={
                  book.defaultLocation ||
                  book.viTriKe?.[0] ||
                  "Chưa xác định vị trí"
                }
                readOnly
              />
            </div>
            <div className="field">
              <label>Trạng thái ban đầu</label>
              <select
                value={addCopiesForm.status}
                onChange={(event) =>
                  setAddCopiesForm({
                    ...addCopiesForm,
                    status: event.target.value,
                  })
                }
              >
                <option value="AVAILABLE">Sẵn sàng</option>
                <option value="LOST">Báo mất</option>
                <option value="DAMAGED">Hỏng</option>
              </select>
            </div>
            <div className="field">
              <label>Tình trạng vật lý</label>
              <select
                value={addCopiesForm.physicalCondition}
                onChange={(event) =>
                  setAddCopiesForm({
                    ...addCopiesForm,
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
            <div className="form-actions">
              <button className="button" type="submit">
                Nhập thêm bản sao
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
      ) : null}
    </>
  );
}
