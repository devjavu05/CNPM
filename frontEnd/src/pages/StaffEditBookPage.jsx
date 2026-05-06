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
  const [updateCoverFile, setUpdateCoverFile] = useState(null);

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

    setUpdateCoverFile(null);
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

  function handleFileSelection(file, setter) {
    if (!file) {
      setter(null);
      return;
    }
    setter({ file, previewUrl: URL.createObjectURL(file) });
  }

  async function uploadCoverIfNeeded(fileState) {
    if (!fileState?.file) return null;
    return libraryApi.uploadBookCover(fileState.file);
  }

  async function handleUpdate(event) {
    event.preventDefault();
    if (!book) return;

    updateStatus.clearStatus();
    try {
      const uploadedCoverUrl = await uploadCoverIfNeeded(updateCoverFile);
      await libraryApi.updateBook(book.id, {
        ...updateForm,
        floorNumber: Number(updateForm.floorNumber),
        coverImageUrl: uploadedCoverUrl || updateForm.coverImageUrl,
        eBookPrice: updateForm.eBookPrice ? Number(updateForm.eBookPrice) : null,
      });
      updateStatus.setSuccess("Cap nhat dau sach thanh cong.");
      setTimeout(() => {
        navigate(`/workspace/catalog/${book.id}`, { replace: true });
      }, 1000);
    } catch (error) {
      updateStatus.setError(error.message);
    }
  }

  const updatePreviewUrl =
    updateCoverFile?.previewUrl || updateForm.coverImageUrl || "";
  const updateDefaultLocation = getBookLocation(
    updateForm.category,
    updateForm.floorNumber,
  );

  if (!canUpdateBook) {
    return (
      <>
        <PageHero
          eyebrow="Canh bao"
          title="Ban khong co quyen truy cap trang nay"
        />
        <section className="panel section-panel">
          <Link className="button" to="/workspace/catalog">
            Quay lai kho sach
          </Link>
        </section>
      </>
    );
  }

  return (
    <>
      <PageHero
        eyebrow="Quan ly kho sach"
        title="Chinh sua thong tin dau sach"
        description={book ? `Dang chinh sua sach: ${book.title}` : "Dang tai..."}
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
                  alt="Xem truoc anh bia"
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
                Quay lai chi tiet
              </Link>
            </div>
          </aside>

          <section className="panel detail-main-panel">
            <span className="eyebrow">Cong cu thu thu</span>
            <h1>Chinh sua dau sach</h1>
            <StatusMessage status={updateStatus.status} />

            <form
              className="form-grid detail-side-form"
              onSubmit={handleUpdate}
            >
              <div className="field">
                <label>Ten sach</label>
                <input
                  value={updateForm.title}
                  onChange={(event) =>
                    setUpdateForm({ ...updateForm, title: event.target.value })
                  }
                  required
                />
              </div>
              <div className="field">
                <label>Tac gia</label>
                <input
                  value={updateForm.author}
                  onChange={(event) =>
                    setUpdateForm({ ...updateForm, author: event.target.value })
                  }
                  required
                />
              </div>
              <div className="field">
                <label>The loai</label>
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
                  <option value="">Chon the loai</option>
                  {BOOK_CATEGORIES.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label>Tang luu tru</label>
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
                      Tang {floor}
                    </option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label>Ke theo the loai</label>
                <input
                  value={
                    updateForm.category
                      ? `Ke ${getShelfCode(updateForm.category)}`
                      : "Chon the loai truoc"
                  }
                  readOnly
                />
              </div>
              <div className="field full">
                <label>Vi tri dau sach</label>
                <input
                  value={
                    updateDefaultLocation ||
                    "Chon the loai va tang de xac dinh vi tri"
                  }
                  readOnly
                />
              </div>
              <div className="field full">
                <label>Doi anh bia tu may</label>
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={(event) =>
                    handleFileSelection(
                      event.target.files?.[0] || null,
                      setUpdateCoverFile,
                    )
                  }
                />
              </div>
              {updatePreviewUrl ? (
                <div className="field full">
                  <label>Xem truoc anh bia</label>
                  <div className="cover-upload-preview compact">
                    <img src={updatePreviewUrl} alt="Xem truoc anh bia" />
                  </div>
                </div>
              ) : null}
              <div className="field full">
                <label>Mo ta</label>
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
                <label>Gioi thieu dai ve cuon sach</label>
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
                <label>Link trang tai E-Book</label>
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
                <label>Gia E-Book (VND)</label>
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
                  Cap nhat
                </button>
                <Link
                  className="ghost-button"
                  to={`/workspace/catalog/${book.id}`}
                >
                  Dong
                </Link>
              </div>
            </form>
          </section>
        </section>
      ) : null}
    </>
  );
}
