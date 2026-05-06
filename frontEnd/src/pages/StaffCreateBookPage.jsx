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
  copyCount: 1,
  physicalCondition: "NEW",
  accessLink: "",
  eBookPrice: "",
};

export default function StaffCreateBookPage() {
  const navigate = useNavigate();

  const canCreateBook = hasPermission("CREATE_DAU_SACH");

  const [createForm, setCreateForm] = useState(DEFAULT_CREATE_FORM);
  const [createCoverFile, setCreateCoverFile] = useState(null);

  const createStatus = useStatus();

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

  async function handleCreate(event) {
    event.preventDefault();
    createStatus.clearStatus();
    try {
      const uploadedCoverUrl = await uploadCoverIfNeeded(createCoverFile);
      const created = await libraryApi.createInventoryBook({
        ...createForm,
        floorNumber: Number(createForm.floorNumber),
        coverImageUrl: uploadedCoverUrl,
        publishYear: createForm.publishYear
          ? Number(createForm.publishYear)
          : null,
        copyCount: Number(createForm.copyCount),
        eBookPrice: createForm.eBookPrice ? Number(createForm.eBookPrice) : null,
      });
      createStatus.setSuccess("Da them dau sach moi cung lo ban sao ban dau.");
      setTimeout(() => {
        navigate(`/workspace/catalog/${created.id}`, { replace: true });
      }, 1000);
    } catch (error) {
      createStatus.setError(error.message);
    }
  }

  const createPreviewUrl = createCoverFile?.previewUrl || "";
  const createDefaultLocation = getBookLocation(
    createForm.category,
    createForm.floorNumber,
  );

  if (!canCreateBook) {
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
        eyebrow="Kho sach"
        title="Them dau sach vao kho"
        description="Tao mot dau sach moi va nhap ban sao ban dau."
      />

      <section className="detail-layout">
        <aside className="panel detail-cover-panel">
          <div className="detail-cover-frame">
            {createPreviewUrl ? (
              <img
                className="book-cover"
                src={createPreviewUrl}
                alt="Xem truoc anh bia"
              />
            ) : (
              <div className="book-cover book-cover-fallback">TV</div>
            )}
          </div>
          <div className="detail-cover-actions">
            <Link className="ghost-button" to="/workspace/catalog">
              Quay lai kho sach
            </Link>
          </div>
        </aside>

        <section className="panel detail-main-panel">
          <span className="eyebrow">Tao dau sach moi</span>
          <h1 className="detail-title">Them dau sach vao kho</h1>
          <StatusMessage status={createStatus.status} />

          <form className="form-grid" onSubmit={handleCreate}>
            <div className="field">
              <label>Ten sach</label>
              <input
                value={createForm.title}
                onChange={(event) =>
                  setCreateForm({ ...createForm, title: event.target.value })
                }
                required
              />
            </div>
            <div className="field">
              <label>Tac gia</label>
              <input
                value={createForm.author}
                onChange={(event) =>
                  setCreateForm({ ...createForm, author: event.target.value })
                }
                required
              />
            </div>
            <div className="field">
              <label>The loai</label>
              <select
                value={createForm.category}
                onChange={(event) =>
                  setCreateForm({ ...createForm, category: event.target.value })
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
              <label>Nam xuat ban</label>
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
              <label>Anh bia tu may</label>
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={(event) =>
                  handleFileSelection(
                    event.target.files?.[0] || null,
                    setCreateCoverFile,
                  )
                }
              />
            </div>
            <div className="field">
              <label>So ban sao ban dau</label>
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
              <label>Tang luu tru</label>
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
                    Tang {floor}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label>Ke theo the loai</label>
              <input
                value={
                  createForm.category
                    ? `Ke ${getShelfCode(createForm.category)}`
                    : "Chon the loai truoc"
                }
                readOnly
              />
            </div>
            <div className="field full">
              <label>Vi tri dau sach</label>
              <input
                value={
                  createDefaultLocation ||
                  "Chon the loai va tang de xac dinh vi tri"
                }
                readOnly
              />
            </div>
            <div className="field">
              <label>Tinh trang vat ly mac dinh</label>
              <select
                value={createForm.physicalCondition}
                onChange={(event) =>
                  setCreateForm({
                    ...createForm,
                    physicalCondition: event.target.value,
                  })
                }
              >
                <option value="NEW">Moi</option>
                <option value="GOOD">Tot</option>
                <option value="WORN">Cu</option>
                <option value="DAMAGED">Hong</option>
              </select>
            </div>
            <div className="field full">
              <label>Mo ta</label>
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
              <label>Gioi thieu dai ve cuon sach</label>
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
              <label>Link trang tai E-Book</label>
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
              <label>Gia E-Book (VND)</label>
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
                Luu dau sach
              </button>
              <Link className="ghost-button" to="/workspace/catalog">
                Dong
              </Link>
            </div>
          </form>
        </section>
      </section>
    </>
  );
}
