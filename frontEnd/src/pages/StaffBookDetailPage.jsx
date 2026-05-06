import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import DataTable from "../components/DataTable";
import StatusMessage from "../components/StatusMessage";
import useStatus from "../hooks/useStatus";
import { libraryApi } from "../lib/api";
import { hasPermission } from "../lib/auth";
import { BOOK_CATEGORIES } from "../lib/categories";
import { decodeBookBarcode, decodeShelfLocation, getBookLocation, getShelfCode, LIBRARY_FLOORS } from "../lib/shelves";

function renderIntroduction(text) {
  if (!text) return null;

  return text
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean)
    .map((paragraph, index) => <p key={`${index}-${paragraph.slice(0, 12)}`}>{paragraph}</p>);
}

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
  accessLink: ""
};

const DEFAULT_ADD_COPIES_FORM = {
  copyCount: 1,
  physicalCondition: "NEW",
  status: "AVAILABLE"
};

const DEFAULT_UPDATE_FORM = {
  title: "",
  author: "",
  category: "",
  description: "",
  longIntroduction: "",
  floorNumber: "1",
  coverImageUrl: "",
  accessLink: ""
};

export default function StaffBookDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const isCreateMode = location.pathname.endsWith("/catalog/new");

  const canUpdateBook = hasPermission("UPDATE_DAU_SACH");
  const canCreateCopy = hasPermission("CREATE_CUON_SACH");
  const canGetCopies = hasPermission("GET_CUON_SACH");

  const [book, setBook] = useState(null);
  const [copies, setCopies] = useState([]);
  const [copyKeyword, setCopyKeyword] = useState("");
  const [activeMode, setActiveMode] = useState(isCreateMode ? "create" : "browse");
  const [createForm, setCreateForm] = useState(DEFAULT_CREATE_FORM);
  const [addCopiesForm, setAddCopiesForm] = useState(DEFAULT_ADD_COPIES_FORM);
  const [updateForm, setUpdateForm] = useState(DEFAULT_UPDATE_FORM);
  const [createCoverFile, setCreateCoverFile] = useState(null);
  const [updateCoverFile, setUpdateCoverFile] = useState(null);

  const detailStatus = useStatus();
  const createStatus = useStatus();
  const addCopiesStatus = useStatus();
  const updateStatus = useStatus();
  const copyStatus = useStatus();

  useEffect(() => {
    if (isCreateMode) {
      setBook(null);
      setActiveMode("create");
      return;
    }
    loadBook();
  }, [id, isCreateMode]);

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
      accessLink: book.eBookLink || ""
    });

    setAddCopiesForm({ ...DEFAULT_ADD_COPIES_FORM });
    setUpdateCoverFile(null);

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
        publishYear: createForm.publishYear ? Number(createForm.publishYear) : null,
        copyCount: Number(createForm.copyCount)
      });
      createStatus.setSuccess("Đã thêm đầu sách mới cùng lô bản sao ban đầu.");
      navigate(`/workspace/catalog/${created.id}`, { replace: true });
    } catch (error) {
      createStatus.setError(error.message);
    }
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
        coverImageUrl: uploadedCoverUrl || updateForm.coverImageUrl
      });
      updateStatus.setSuccess("Cập nhật đầu sách thành công.");
      setActiveMode("browse");
      await loadBook();
    } catch (error) {
      updateStatus.setError(error.message);
    }
  }

  async function handleAddCopies(event) {
    event.preventDefault();
    if (!book) return;

    addCopiesStatus.clearStatus();
    try {
      await libraryApi.addCopiesToBook(book.id, {
        ...addCopiesForm,
        copyCount: Number(addCopiesForm.copyCount)
      });
      addCopiesStatus.setSuccess("Đã nhập thêm bản sao.");
      setActiveMode("browse");
      await loadBook();
      await loadCopies(book.id);
    } catch (error) {
      addCopiesStatus.setError(error.message);
    }
  }

  async function handleDeleteBook() {
    if (!book) return;
    const accepted = window.confirm(`Bạn có chắc chắn muốn xóa đầu sách \"${book.title}\" không?`);
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
    const accepted = window.confirm(`Bạn có chắc chắn muốn thanh lý bản sao mã ${barcode} không?`);
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
      return highlightedBarcode ? source.filter((copy) => copy.barcode === highlightedBarcode) : [];
    }

    return source.filter((copy) => {
      const barcodeText = String(copy.barcode || "").toLowerCase();
      const locationText = String(copy.location || copy.defaultLocation || "").toLowerCase();
      return barcodeText.includes(keyword) || locationText.includes(keyword);
    });
  }, [copies, copyKeyword, highlightedBarcode]);

  const summary = useMemo(() => {
    const activeCopies = copies.filter((copy) => copy.status !== "THANH_LY");
    const isAvailableStatus = (status) =>
      ["AVAILABLE", "SAN_SANG"].includes(String(status || "").toUpperCase());
    const isBorrowedStatus = (status) =>
      ["BORROWED", "BORROWING", "DANG_MUON"].includes(String(status || "").toUpperCase());

    return {
      total: activeCopies.length,
      available: activeCopies.filter((copy) => isAvailableStatus(copy.status) || (copy.isAvailable && !isBorrowedStatus(copy.status))).length,
      borrowed: activeCopies.filter((copy) => isBorrowedStatus(copy.status)).length,
      lost: activeCopies.filter((copy) => copy.status === "LOST").length
    };
  }, [copies]);

  const createPreviewUrl = createCoverFile?.previewUrl || "";
  const updatePreviewUrl = updateCoverFile?.previewUrl || updateForm.coverImageUrl || "";
  const createDefaultLocation = getBookLocation(createForm.category, createForm.floorNumber);
  const updateDefaultLocation = getBookLocation(updateForm.category, updateForm.floorNumber);
  const defaultShelfLocation = decodeShelfLocation(book?.defaultLocation || book?.viTriKe?.[0], book?.category);
  const showActionPanel = activeMode === "edit" || activeMode === "add-copies";

  function renderActionPanel() {
    if (!book || !showActionPanel) return null;

    if (activeMode === "edit" && canUpdateBook) {
      return (
        <aside className="panel detail-side-panel">
          <div className="panel-header">
            <div>
              <span className="eyebrow">Công cụ thủ thư</span>
              <h3>Chỉnh sửa đầu sách</h3>
            </div>
          </div>
          <StatusMessage status={updateStatus.status} />
          <form className="form-grid detail-side-form" onSubmit={handleUpdate}>
            <div className="field">
              <label>Tên sách</label>
              <input value={updateForm.title} onChange={(event) => setUpdateForm({ ...updateForm, title: event.target.value })} required />
            </div>
            <div className="field">
              <label>Tác giả</label>
              <input value={updateForm.author} onChange={(event) => setUpdateForm({ ...updateForm, author: event.target.value })} required />
            </div>
            <div className="field">
              <label>Thể loại</label>
              <select value={updateForm.category} onChange={(event) => setUpdateForm({ ...updateForm, category: event.target.value })} required>
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
              <select value={updateForm.floorNumber} onChange={(event) => setUpdateForm({ ...updateForm, floorNumber: event.target.value })} required>
                {LIBRARY_FLOORS.map((floor) => (
                  <option key={floor} value={String(floor)}>
                    Tầng {floor}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label>Kệ theo thể loại</label>
              <input value={updateForm.category ? `Kệ ${getShelfCode(updateForm.category)}` : "Chọn thể loại trước"} readOnly />
            </div>
            <div className="field full">
              <label>Vị trí đầu sách</label>
              <input value={updateDefaultLocation || "Chọn thể loại và tầng để xác định vị trí"} readOnly />
            </div>
            <div className="field full">
              <label>Đổi ảnh bìa từ máy</label>
              <input type="file" accept="image/png,image/jpeg,image/webp" onChange={(event) => handleFileSelection(event.target.files?.[0] || null, setUpdateCoverFile)} />
            </div>
            {updatePreviewUrl ? (
              <div className="field full">
                <label>Xem trước ảnh bìa</label>
                <div className="cover-upload-preview compact">
                  <img src={updatePreviewUrl} alt="Xem trước ảnh bìa" />
                </div>
              </div>
            ) : null}
            <div className="field full">
              <label>Mô tả</label>
              <textarea value={updateForm.description} onChange={(event) => setUpdateForm({ ...updateForm, description: event.target.value })} />
            </div>
            <div className="field full">
              <label>Giới thiệu dài về cuốn sách</label>
              <textarea value={updateForm.longIntroduction} onChange={(event) => setUpdateForm({ ...updateForm, longIntroduction: event.target.value })} />
            </div>
            <div className="field full">
              <label>Link trang tải E-Book</label>
              <input
                type="url"
                placeholder="https://example.com/tai-sach"
                value={updateForm.accessLink}
                onChange={(event) => setUpdateForm({ ...updateForm, accessLink: event.target.value })}
              />
            </div>
            <div className="form-actions">
              <button className="button secondary" type="submit">
                Cập nhật
              </button>
              <button className="ghost-button" type="button" onClick={() => setActiveMode("browse")}>
                Đóng
              </button>
            </div>
          </form>
        </aside>
      );
    }

    if (activeMode === "add-copies" && canCreateCopy) {
      return (
        <aside className="panel detail-side-panel">
          <div className="panel-header">
            <div>
              <span className="eyebrow">Công cụ thủ thư</span>
              <h3>Nhập thêm bản sao</h3>
            </div>
          </div>
          <StatusMessage status={addCopiesStatus.status} />
          <form className="form-grid detail-side-form" onSubmit={handleAddCopies}>
            <div className="field full">
              <label>Đầu sách đang chọn</label>
              <input value={`${book.title} - ${book.author || "Chưa cập nhật tác giả"}`} readOnly />
            </div>
            <div className="field">
              <label>Số lượng bản sao</label>
              <input type="number" min="1" value={addCopiesForm.copyCount} onChange={(event) => setAddCopiesForm({ ...addCopiesForm, copyCount: event.target.value })} required />
            </div>
            <div className="field">
              <label>Vị trí đầu sách đang dùng</label>
              <input value={book.defaultLocation || book.viTriKe?.[0] || "Chưa xác định vị trí"} readOnly />
            </div>
            <div className="field">
              <label>Trạng thái ban đầu</label>
              <select value={addCopiesForm.status} onChange={(event) => setAddCopiesForm({ ...addCopiesForm, status: event.target.value })}>
                <option value="AVAILABLE">Sẵn sàng</option>
                <option value="LOST">Báo mất</option>
                <option value="DAMAGED">Hỏng</option>
              </select>
            </div>
            <div className="field">
              <label>Tình trạng vật lý</label>
              <select value={addCopiesForm.physicalCondition} onChange={(event) => setAddCopiesForm({ ...addCopiesForm, physicalCondition: event.target.value })}>
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
              <button className="ghost-button" type="button" onClick={() => setActiveMode("browse")}>
                Đóng
              </button>
            </div>
          </form>
        </aside>
      );
    }

    return null;
  }

  if (isCreateMode) {
    return (
      <section className="detail-layout">
        <aside className="panel detail-cover-panel">
          <div className="detail-cover-frame">
            {createPreviewUrl ? (
              <img className="book-cover" src={createPreviewUrl} alt="Xem trước ảnh bìa" />
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
              <button className={`ghost-button${activeMode === "edit" ? " active" : ""}`} type="button" onClick={() => setActiveMode(activeMode === "edit" ? "browse" : "edit")}>
                Chỉnh sửa đầu sách
              </button>
            ) : null}
            {canCreateCopy ? (
              <button className={`ghost-button${activeMode === "add-copies" ? " active" : ""}`} type="button" onClick={() => setActiveMode(activeMode === "add-copies" ? "browse" : "add-copies")}>
                Nhập thêm bản sao
              </button>
            ) : null}
            {canUpdateBook ? (
              <button className="ghost-button" type="button" onClick={handleDeleteBook}>
                Xóa đầu sách
              </button>
            ) : null}
          </div>
        </aside>

        <section className="panel detail-main-panel">
          <span className="eyebrow">Tạo đầu sách mới</span>
          <h1 className="detail-title">Thêm đầu sách vào kho</h1>
          <StatusMessage status={createStatus.status} />

          <form className="form-grid" onSubmit={handleCreate}>
            <div className="field">
              <label>Tên sách</label>
              <input value={createForm.title} onChange={(event) => setCreateForm({ ...createForm, title: event.target.value })} required />
            </div>
            <div className="field">
              <label>Tác giả</label>
              <input value={createForm.author} onChange={(event) => setCreateForm({ ...createForm, author: event.target.value })} required />
            </div>
            <div className="field">
              <label>Thể loại</label>
              <select value={createForm.category} onChange={(event) => setCreateForm({ ...createForm, category: event.target.value })} required>
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
              <input type="number" value={createForm.publishYear} onChange={(event) => setCreateForm({ ...createForm, publishYear: event.target.value })} />
            </div>
            <div className="field full">
              <label>Ảnh bìa từ máy</label>
              <input type="file" accept="image/png,image/jpeg,image/webp" onChange={(event) => handleFileSelection(event.target.files?.[0] || null, setCreateCoverFile)} />
            </div>
            <div className="field">
              <label>Số bản sao ban đầu</label>
              <input type="number" min="0" value={createForm.copyCount} onChange={(event) => setCreateForm({ ...createForm, copyCount: event.target.value })} required />
            </div>
            <div className="field">
              <label>Tầng lưu trữ</label>
              <select value={createForm.floorNumber} onChange={(event) => setCreateForm({ ...createForm, floorNumber: event.target.value })} required>
                {LIBRARY_FLOORS.map((floor) => (
                  <option key={floor} value={String(floor)}>
                    Tầng {floor}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label>Kệ theo thể loại</label>
              <input value={createForm.category ? `Kệ ${getShelfCode(createForm.category)}` : "Chọn thể loại trước"} readOnly />
            </div>
            <div className="field full">
              <label>Vị trí đầu sách</label>
              <input value={createDefaultLocation || "Chọn thể loại và tầng để xác định vị trí"} readOnly />
            </div>
            <div className="field">
              <label>Tình trạng vật lý mặc định</label>
              <select value={createForm.physicalCondition} onChange={(event) => setCreateForm({ ...createForm, physicalCondition: event.target.value })}>
                <option value="NEW">Mới</option>
                <option value="GOOD">Tốt</option>
                <option value="WORN">Cũ</option>
                <option value="DAMAGED">Hỏng</option>
              </select>
            </div>
            <div className="field full">
              <label>Mô tả</label>
              <textarea value={createForm.description} onChange={(event) => setCreateForm({ ...createForm, description: event.target.value })} />
            </div>
            <div className="field full">
              <label>Giới thiệu dài về cuốn sách</label>
              <textarea value={createForm.longIntroduction} onChange={(event) => setCreateForm({ ...createForm, longIntroduction: event.target.value })} />
            </div>
            <div className="field full">
              <label>Link trang tải E-Book</label>
              <input
                type="url"
                placeholder="https://example.com/tai-sach"
                value={createForm.accessLink}
                onChange={(event) => setCreateForm({ ...createForm, accessLink: event.target.value })}
              />
            </div>
            <div className="form-actions">
              <button className="button" type="submit">
                Lưu đầu sách
              </button>
            </div>
          </form>
        </section>
      </section>
    );
  }

  return (
    <>
      <StatusMessage status={detailStatus.status} />
      {book ? (
        <section className={`staff-detail-workspace${showActionPanel ? " with-side-panel" : ""}`}>
          {renderActionPanel()}

          <div className="staff-detail-content">
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
                  <Link className="ghost-button" to="/workspace/catalog">
                    Quay lại kho sách
                  </Link>
                </div>
              </aside>

              <section className="panel detail-main-panel">
                <span className="eyebrow">Chi tiết đầu sách</span>
                <h1 className="detail-title">{book.title}</h1>
                <p className="detail-author-line">
                  <strong>Tác giả:</strong> {book.author || "Chưa cập nhật"} <span className="detail-dot">•</span>
                  <strong> Thể loại:</strong> {book.category || "Chưa phân loại"}
                </p>
                <p className="detail-summary">{book.description || "Đầu sách này chưa có mô tả chi tiết."}</p>

                <div className="detail-primary-actions">
                  <Link className="button" to="/workspace/catalog">
                    Quay lại kho sách
                  </Link>
                  {canUpdateBook ? (
                    <button className="ghost-button" type="button" onClick={() => setActiveMode(activeMode === "edit" ? "browse" : "edit")}>
                      {activeMode === "edit" ? "Đóng chỉnh sửa" : "Chỉnh sửa sách"}
                    </button>
                  ) : (
                    <button className="ghost-button" type="button" disabled>
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
                    <span>{book.eBookLink ? "Đã cấu hình" : "Chưa cập nhật"}</span>
                  </div>
                  <div className="record-card">
                    <strong>Truy cập</strong>
                    <span>{book.hasEBook ? "Mở sang web ngoài" : "Không có"}</span>
                  </div>
                </div>

                <div className="detail-section">
                  <h3>Vị trí và tình trạng</h3>
                  <p>
                    <strong>Tình trạng hiển thị:</strong> {book.tinhTrang}
                  </p>
                  <p>
                    <strong>Vị trí kệ:</strong> {book.defaultLocation || (book.viTriKe?.length ? book.viTriKe.join(", ") : "Chưa có vị trí")}
                  </p>
                  {defaultShelfLocation ? (
                    <div className="record-card shelf-decode-card">
                      <strong>Giải mã vị trí mặc định</strong>
                      <span>{defaultShelfLocation.humanText}</span>
                      <small>
                        {defaultShelfLocation.shelfName ? `Kệ thực tế: ${defaultShelfLocation.shelfName}` : "Chưa xác định kệ"}
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
                  <p className="long-introduction-lead">{book.description || `Giới thiệu chi tiết về ${book.title}.`}</p>
                  <div className="long-introduction-body">{renderIntroduction(book.longIntroduction)}</div>
                </div>
              ) : (
                <div className="empty">Đầu sách này chưa có phần giới thiệu dài.</div>
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
                  <p className="book-tile-meta">Mã vừa tra: {highlightedBarcode}. Hệ thống đang làm nổi bật cuốn này trong bảng bên dưới.</p>
                </div>
              ) : null}

              <div className="field full">
                <label>Tìm cuốn sách theo mã vạch hoặc vị trí kệ</label>
                <input placeholder="Nhập mã vạch hoặc vị trí kệ để lọc bản sao" value={copyKeyword} onChange={(event) => setCopyKeyword(event.target.value)} />
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
                            <span>{decodedBarcode?.humanText || "Chưa giải mã được mã cuốn sách"}</span>
                          </div>
                        );
                      }
                    },
                    {
                      label: "Vị trí",
                      render: (row) => {
                        const decodedLocation = decodeShelfLocation(row.location || row.defaultLocation, book?.category);
                        return (
                          <div className="table-detail-cell">
                            <strong>{row.location || row.defaultLocation || "Chưa cập nhật"}</strong>
                            <span>{decodedLocation?.humanText || "Chưa giải mã được vị trí kệ"}</span>
                          </div>
                        );
                      }
                    },
                    { label: "Trạng thái", render: (row) => row.status || "Chưa rõ" },
                    { label: "Tình trạng", render: (row) => row.physicalCondition || "NEW" },
                    {
                      label: "Thanh lý",
                      render: (row) =>
                        row.status === "THANH_LY" ? (
                          <span className="chip subtle">Đã thanh lý</span>
                        ) : (
                          <button className="ghost-button" type="button" onClick={() => handleLiquidate(row.barcode)}>
                            Thanh lý
                          </button>
                        )
                    }
                  ]}
                />
              ) : (
                <div className="empty">Nhập mã vạch hoặc vị trí kệ để hiển thị đúng các bản sao cần thao tác.</div>
              )}
            </section>
          </div>
        </section>
      ) : null}
    </>
  );
}
