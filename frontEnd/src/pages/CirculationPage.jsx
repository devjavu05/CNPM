import { useEffect, useMemo, useState } from "react";
import ProtectedPage from "../components/ProtectedPage";
import PageHero from "../components/PageHero";
import DataTable from "../components/DataTable";
import StatusMessage from "../components/StatusMessage";
import useStatus from "../hooks/useStatus";
import { libraryApi } from "../lib/api";

const PAGE_SIZE = 6;

function normalize(value) {
  return (value || "").toLowerCase();
}

function buildCopyMatches(copies, keyword) {
  const normalizedKeyword = normalize(keyword).trim();
  if (!normalizedKeyword) return [];

  const exactBarcode = copies.filter(
    (copy) => normalize(copy.barcode) === normalizedKeyword,
  );
  if (exactBarcode.length) return exactBarcode.slice(0, 1);

  const startsWithBarcode = copies.filter((copy) =>
    normalize(copy.barcode).startsWith(normalizedKeyword),
  );
  if (startsWithBarcode.length) return startsWithBarcode.slice(0, 3);

  const containsBarcode = copies.filter((copy) =>
    normalize(copy.barcode).includes(normalizedKeyword),
  );
  if (containsBarcode.length) return containsBarcode.slice(0, 3);

  const exactLocation = copies.filter(
    (copy) => normalize(copy.location) === normalizedKeyword,
  );
  if (exactLocation.length) return exactLocation.slice(0, 3);

  const startsWithLocation = copies.filter((copy) =>
    normalize(copy.location).startsWith(normalizedKeyword),
  );
  if (startsWithLocation.length) return startsWithLocation.slice(0, 3);

  const containsLocation = copies.filter((copy) =>
    normalize(copy.location).includes(normalizedKeyword),
  );
  return containsLocation.slice(0, 3);
}

function formatSlipStatus(ticket, ticketDetails) {
  const allReturned =
    ticketDetails.length > 0 && ticketDetails.every((detail) => detail.returnDate);
  const isOverdue = ticket.dueDate && new Date(ticket.dueDate) < new Date();

  if (allReturned) return "Đã trả đủ";
  if (isOverdue) return "Đang mượn, quá hạn";
  return "Đang mượn";
}

export default function CirculationPage() {
  const [step, setStep] = useState(1);
  const [activeSection, setActiveSection] = useState("create");
  const [tickets, setTickets] = useState([]);
  const [selectedReturnTicket, setSelectedReturnTicket] = useState(null);
  const [currentTicket, setCurrentTicket] = useState(null);
  const [books, setBooks] = useState([]);
  const [bookKeyword, setBookKeyword] = useState("");
  const [selectedBook, setSelectedBook] = useState(null);
  const [copies, setCopies] = useState([]);
  const [copyKeyword, setCopyKeyword] = useState("");
  const [details, setDetails] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [showBookSuggestions, setShowBookSuggestions] = useState(false);
  const [showCopySuggestions, setShowCopySuggestions] = useState(false);
  const [ticketForm, setTicketForm] = useState({ dueDate: "", email: "" });
  const [detailForm, setDetailForm] = useState({
    cuonSachBarcode: "",
    status: "BORROWING",
  });
  const [searchForm, setSearchForm] = useState({
    nguoiMuonName: "",
    borrowDateFrom: "",
    borrowDateTo: "",
  });
  const [hasSearchedTickets, setHasSearchedTickets] = useState(false);
  const [ticketPage, setTicketPage] = useState(1);

  const ticketStatus = useStatus();
  const detailStatus = useStatus();
  const returnStatus = useStatus();
  const lookupStatus = useStatus();
  const searchStatus = useStatus();
  const workflowStatus = useStatus();

  useEffect(() => {
    loadDetails().catch(() => {});
  }, []);

  useEffect(() => {
    if (!bookKeyword.trim()) {
      setBooks([]);
      setShowBookSuggestions(false);
      return;
    }
    const timeoutId = setTimeout(() => {
      loadBooks(bookKeyword).catch(() => {});
    }, 250);
    return () => clearTimeout(timeoutId);
  }, [bookKeyword]);

  useEffect(() => {
    if (!selectedBook?.id) {
      setCopies([]);
      setReservations([]);
      setDetailForm((current) => ({ ...current, cuonSachBarcode: "" }));
      setCopyKeyword("");
      setShowCopySuggestions(false);
      return;
    }
    loadCopiesForBook(selectedBook.id);
    loadReservationsForBook(selectedBook.id);
  }, [selectedBook]);

  const activeReservations = useMemo(
    () =>
      reservations.filter((item) =>
        ["DANG_CHO", "DA_CO_SACH", "CHO_GIAO"].includes(item.status),
      ),
    [reservations],
  );
  const priorityReservation = activeReservations[0] || null;
  const filteredCopies = useMemo(
    () => buildCopyMatches(copies, copyKeyword),
    [copies, copyKeyword],
  );
  const currentTicketDetails = currentTicket
    ? details.filter((item) => item.phieuMuonId === currentTicket.id)
    : [];
  const selectedReturnTicketDetails = selectedReturnTicket
    ? details.filter((item) => item.phieuMuonId === selectedReturnTicket.id)
    : [];

  const managedTickets = useMemo(
    () => tickets.filter((ticket) => !ticket.editable),
    [tickets],
  );
  const totalPages = Math.max(1, Math.ceil(managedTickets.length / PAGE_SIZE));
  const pagedTickets = useMemo(() => {
    const start = (ticketPage - 1) * PAGE_SIZE;
    return managedTickets.slice(start, start + PAGE_SIZE);
  }, [managedTickets, ticketPage]);

  async function loadDetails() {
    const result = await libraryApi.getTicketDetails();
    setDetails(result || []);
  }

  async function loadBooks(keyword = "") {
    lookupStatus.clearStatus();
    try {
      const result = await libraryApi.searchBooks(keyword ? { q: keyword } : {});
      setBooks(result || []);
      setShowBookSuggestions(true);
    } catch (error) {
      setBooks([]);
      lookupStatus.setError(error.message);
    }
  }

  async function loadCopiesForBook(selectedBookId) {
    try {
      const result = await libraryApi.getCopies(selectedBookId);
      setCopies(
        (result || []).filter(
          (copy) =>
            copy.status === "AVAILABLE" ||
            copy.available === true ||
            copy.isAvailable === true,
        ),
      );
    } catch {
      setCopies([]);
    }
  }

  async function loadReservationsForBook(selectedBookId) {
    try {
      const result = await libraryApi.getReservationsByDauSach(selectedBookId);
      setReservations(result || []);
    } catch {
      setReservations([]);
    }
  }

  async function handleCreateTicket(event) {
    event.preventDefault();
    ticketStatus.clearStatus();
    workflowStatus.clearStatus();
    try {
      const created = await libraryApi.createTicket({
        email: ticketForm.email,
        dueDate: ticketForm.dueDate,
      });
      setCurrentTicket(created);
      setStep(2);
      setActiveSection("create");
      ticketStatus.setSuccess("Đã tạo phiếu mượn.");
    } catch (error) {
      ticketStatus.setError(error.message);
    }
  }

  async function handleCreateDetail(event) {
    event.preventDefault();
    if (!currentTicket || !selectedBook) return;
    detailStatus.clearStatus();
    try {
      await libraryApi.createTicketDetail({
        cuonSachBarcode: detailForm.cuonSachBarcode,
        status: detailForm.status,
        phieuMuonId: currentTicket.id,
        returnDate: null,
      });
      detailStatus.setSuccess("Đã thêm một chi tiết phiếu mượn.");
      setDetailForm({ cuonSachBarcode: "", status: "BORROWING" });
      setCopyKeyword("");
      setShowCopySuggestions(false);
      await loadDetails();
      await loadReservationsForBook(selectedBook.id);
      await loadCopiesForBook(selectedBook.id);
    } catch (error) {
      detailStatus.setError(error.message);
    }
  }

  async function handleFinalizeTicket() {
    if (!currentTicket) return;
    detailStatus.clearStatus();
    workflowStatus.clearStatus();
    try {
      const finalized = await libraryApi.finalizeTicket(currentTicket.id);
      setCurrentTicket(finalized);
      setActiveSection("manage");
      detailStatus.setSuccess("Phiếu mượn đã hoàn tất.");
      workflowStatus.setSuccess("Lập phiếu mượn thành công.");
      setHasSearchedTickets(false);
    } catch (error) {
      detailStatus.setError(error.message);
    }
  }

  async function handleReturnDetail(detailId) {
    returnStatus.clearStatus();
    try {
      await libraryApi.returnTicketDetail(detailId);
      returnStatus.setSuccess("Đã xác nhận trả sách và đưa cuốn sách về kho.");
      await loadDetails();
      if (hasSearchedTickets) {
        await rerunTicketSearch();
      }
      window.dispatchEvent(new CustomEvent("notifications:updated"));
    } catch (error) {
      returnStatus.setError(error.message);
    }
  }

  async function handleDeleteTicket(ticketId) {
    if (!window.confirm("Bạn có chắc chắn muốn xóa phiếu mượn này?")) {
      return;
    }
    returnStatus.clearStatus();
    try {
      await libraryApi.deleteTicket(ticketId);
      returnStatus.setSuccess("Đã xóa phiếu mượn thành công.");
      setSelectedReturnTicket(null);
      if (hasSearchedTickets) {
        await rerunTicketSearch();
      }
    } catch (error) {
      returnStatus.setError(error.message);
    }
  }

  async function rerunTicketSearch() {
    const result = await libraryApi.searchTickets({
      nguoiMuonName: searchForm.nguoiMuonName || undefined,
      borrowDateFrom: searchForm.borrowDateFrom || undefined,
      borrowDateTo: searchForm.borrowDateTo || undefined,
    });
    setTickets(result || []);
    setTicketPage(1);
  }

  async function handleSearchTickets(event) {
    event.preventDefault();
    searchStatus.clearStatus();
    try {
      const result = await libraryApi.searchTickets({
        nguoiMuonName: searchForm.nguoiMuonName || undefined,
        borrowDateFrom: searchForm.borrowDateFrom || undefined,
        borrowDateTo: searchForm.borrowDateTo || undefined,
      });
      setTickets(result || []);
      setSelectedReturnTicket(null);
      setTicketPage(1);
      setHasSearchedTickets(true);
      searchStatus.setSuccess("Tìm kiếm thành công.");
    } catch (error) {
      searchStatus.setError(error.message);
    }
  }

  async function handleConfirmReservation(reservationId) {
    detailStatus.clearStatus();
    try {
      await libraryApi.confirmReservation(reservationId);
      detailStatus.setSuccess("Đã xác nhận phiếu đặt trước.");
      if (selectedBook) {
        await loadReservationsForBook(selectedBook.id);
      }
    } catch (error) {
      detailStatus.setError(error.message);
    }
  }

  function goToStep(nextStep) {
    setStep(nextStep);
    setActiveSection("create");
  }

  function startNewWorkflow() {
    setActiveSection("create");
    setStep(1);
    setCurrentTicket(null);
    setTicketForm({ dueDate: "", email: "" });
    setSelectedBook(null);
    setBookKeyword("");
    setBooks([]);
    setCopies([]);
    setCopyKeyword("");
    setShowBookSuggestions(false);
    setShowCopySuggestions(false);
    setReservations([]);
    setDetailForm({ cuonSachBarcode: "", status: "BORROWING" });
    ticketStatus.clearStatus();
    detailStatus.clearStatus();
    workflowStatus.clearStatus();
  }

  function handleSelectBook(book) {
    setSelectedBook(book);
    setBookKeyword(book.title || "");
    setShowBookSuggestions(false);
    setCopyKeyword("");
    setShowCopySuggestions(false);
    setDetailForm((current) => ({ ...current, cuonSachBarcode: "" }));
  }

  function handleSelectCopy(copy) {
    setDetailForm((current) => ({
      ...current,
      cuonSachBarcode: copy.barcode,
    }));
    setCopyKeyword(copy.barcode || copy.location || "");
    setShowCopySuggestions(false);
  }

  return (
    <ProtectedPage permission="GET_PHIEU_MUON">
      <div className="page-container circulation-shell">
        <PageHero
          eyebrow="Quầy mượn trả"
          title="Lập và quản lí phiếu mượn"
          description="Tách riêng phần lập phiếu mới và phần quản lí các phiếu mượn đã tạo để thao tác rõ ràng, không còn gộp chung trong cùng một quy trình."
          actions={
            <div className="topbar-actions">
              <button
                className={`ghost-button${activeSection === "create" ? " active" : ""}`}
                type="button"
                onClick={startNewWorkflow}
              >
                Lập phiếu mới
              </button>
              <button
                className={`ghost-button${activeSection === "manage" ? " active" : ""}`}
                type="button"
                onClick={() => setActiveSection("manage")}
              >
                Quản lí phiếu
              </button>
            </div>
          }
        />

        <StatusMessage status={workflowStatus.status} />

        {activeSection === "create" ? (
          <>
            <section className="panel compact-panel">
              <div className="panel-header">
                <div>
                  <span className="eyebrow">Quy trình lập phiếu</span>
                  <h3>Lập phiếu mượn mới</h3>
                  <p className="muted">
                    Khu này chỉ dành cho thao tác tạo phiếu mới và thêm sách vào
                    phiếu.
                  </p>
                </div>
              </div>
              <div className="progress-indicator">
                <div className="progress-steps">
                  <div
                    className={`progress-step${step >= 1 ? " completed" : ""}${step === 1 ? " active" : ""}`}
                  >
                    <span className="step-number">1</span>
                    <span className="step-label">Tạo phiếu</span>
                  </div>
                  <div
                    className={`progress-line${step > 1 ? " completed" : ""}`}
                  ></div>
                  <div
                    className={`progress-step${step >= 2 ? " completed" : ""}${step === 2 ? " active" : ""}`}
                  >
                    <span className="step-number">2</span>
                    <span className="step-label">Thêm sách</span>
                  </div>
                </div>
              </div>
            </section>

            {step === 1 ? (
              <section className="panel compact-panel">
                <div className="panel-header">
                  <div>
                    <span className="eyebrow">Bước 1</span>
                    <h3>Tạo phiếu mượn</h3>
                  </div>
                </div>
                <StatusMessage status={ticketStatus.status} />
                <form className="form-grid dense-form" onSubmit={handleCreateTicket}>
                  <div className="field full">
                    <label>Ngày mượn</label>
                    <input
                      readOnly
                      value={new Date().toLocaleDateString("vi-VN")}
                    />
                  </div>
                  <div className="field full">
                    <label>Email độc giả</label>
                    <input
                      type="email"
                      value={ticketForm.email}
                      onChange={(event) =>
                        setTicketForm({ ...ticketForm, email: event.target.value })
                      }
                      required
                    />
                  </div>
                  <div className="field full">
                    <label>Hạn trả</label>
                    <input
                      type="date"
                      min={new Date().toISOString().slice(0, 10)}
                      value={ticketForm.dueDate}
                      onChange={(event) =>
                        setTicketForm({
                          ...ticketForm,
                          dueDate: event.target.value,
                        })
                      }
                      required
                    />
                  </div>
                  <div className="form-actions">
                    <button className="button" type="submit">
                      Tiếp theo →
                    </button>
                  </div>
                </form>
              </section>
            ) : null}

            {step === 2 ? (
              <section className="panel compact-panel">
                <div className="panel-header">
                  <div>
                    <span className="eyebrow">Bước 2</span>
                    <h3>Thêm chi tiết phiếu mượn</h3>
                  </div>
                </div>
                {!currentTicket ? (
                  <div className="empty">Tạo phiếu mượn ở bước 1 trước.</div>
                ) : (
                  <>
                    <div className="record-card">
                      <p>
                        <strong>Độc giả:</strong>{" "}
                        {currentTicket.fullName || currentTicket.email}
                      </p>
                      <p>
                        <strong>Ngày mượn:</strong>{" "}
                        {currentTicket.borrowDate || "-"}
                      </p>
                      <p>
                        <strong>Hạn trả:</strong> {currentTicket.dueDate || "-"}
                      </p>
                    </div>

                    <StatusMessage status={lookupStatus.status} />
                    <StatusMessage status={detailStatus.status} />

                    <form className="form-grid dense-form" onSubmit={handleCreateDetail}>
                      <div className="field full">
                        <label>Tìm đầu sách</label>
                        <input
                          placeholder="Nhập tên sách, tác giả hoặc thể loại"
                          value={bookKeyword}
                          onChange={(event) => {
                            setBookKeyword(event.target.value);
                            setShowBookSuggestions(true);
                            if (selectedBook) setSelectedBook(null);
                          }}
                          onFocus={() => {
                            if (bookKeyword.trim()) setShowBookSuggestions(true);
                          }}
                        />
                        {showBookSuggestions && bookKeyword.trim() ? (
                          !books.length ? (
                            <div className="empty">
                              Không tìm thấy đầu sách phù hợp.
                            </div>
                          ) : (
                            <div className="autocomplete-list">
                              {books.slice(0, 8).map((book) => (
                                <button
                                  key={book.id}
                                  type="button"
                                  className="autocomplete-item"
                                  onClick={() => handleSelectBook(book)}
                                >
                                  <div className="autocomplete-item-top">
                                    <strong>{book.title}</strong>
                                    <span
                                      className={`chip ${(book.availableCount ?? 0) > 0 ? "ok" : "warn"}`}
                                    >
                                      {book.tinhTrang || "-"}
                                    </span>
                                  </div>
                                  <span>{book.author || "Chưa có tác giả"}</span>
                                  <span className="selector-meta">
                                    {book.category || "Kho sách chung"}
                                  </span>
                                </button>
                              ))}
                            </div>
                          )
                        ) : !selectedBook ? (
                          <div className="empty">Nhập từ khóa để tìm đầu sách.</div>
                        ) : null}
                      </div>

                      {selectedBook ? (
                        <div className="record-card">
                          <p>
                            <strong>Đầu sách đã chọn:</strong> {selectedBook.title}
                          </p>
                          <p>
                            <strong>Tình trạng:</strong>{" "}
                            {selectedBook.tinhTrang || "-"}
                          </p>
                          {priorityReservation ? (
                            <p>
                              <strong>Độc giả ưu tiên:</strong>{" "}
                              {priorityReservation.fullName ||
                                priorityReservation.email}
                            </p>
                          ) : null}
                        </div>
                      ) : null}

                      <div className="field full">
                        <label>Tìm cuốn sách theo barcode hoặc vị trí</label>
                        <input
                          placeholder="Nhập barcode hoặc vị trí"
                          value={copyKeyword}
                          onChange={(event) => {
                            setCopyKeyword(event.target.value);
                            setShowCopySuggestions(true);
                            setDetailForm((current) => ({
                              ...current,
                              cuonSachBarcode: "",
                            }));
                          }}
                          onFocus={() => {
                            if (copyKeyword.trim()) setShowCopySuggestions(true);
                          }}
                          disabled={!selectedBook}
                        />
                        {!selectedBook ? (
                          <div className="empty">
                            Chọn đầu sách trước khi tìm cuốn sách.
                          </div>
                        ) : !copyKeyword.trim() ? (
                          <div className="empty">
                            Nhập barcode hoặc vị trí để tìm cuốn sách.
                          </div>
                        ) : !filteredCopies.length ? (
                          <div className="empty">
                            Không tìm thấy cuốn sách phù hợp.
                          </div>
                        ) : showCopySuggestions ? (
                          <div className="autocomplete-list">
                            {filteredCopies.map((copy) => (
                              <button
                                key={copy.barcode}
                                type="button"
                                className="autocomplete-item"
                                onClick={() => handleSelectCopy(copy)}
                              >
                                <div className="autocomplete-item-top">
                                  <strong>{copy.barcode || "Cuốn sách"}</strong>
                                  <span className="chip ok">Sẵn sàng</span>
                                </div>
                                <span>{copy.location || "Chưa có vị trí"}</span>
                                <span className="selector-meta">
                                  {copy.physicalCondition || "NEW"}
                                </span>
                              </button>
                            ))}
                          </div>
                        ) : null}
                      </div>

                      {selectedBook && activeReservations.length > 0 ? (
                        <div className="record-card reservations-section">
                          <h3>
                            Danh sách phiếu đặt trước ({activeReservations.length})
                          </h3>
                          <div className="reservations-list">
                            {activeReservations.map((reservation, index) => (
                              <div key={reservation.id} className="reservation-item">
                                <div className="reservation-info">
                                  <p>
                                    <strong>#{index + 1}.</strong>{" "}
                                    {reservation.fullName || reservation.email}
                                  </p>
                                  <p className="reservation-date">
                                    Ngày đặt: {reservation.reservationDate || "-"}
                                  </p>
                                  <span
                                    className={`status-chip status-${reservation.status}`}
                                  >
                                    {reservation.status === "DANG_CHO"
                                      ? "Đang chờ"
                                      : reservation.status === "DA_CO_SACH"
                                        ? "Có sách"
                                        : reservation.status === "CHO_GIAO"
                                          ? "Chờ giao"
                                          : reservation.status}
                                  </span>
                                </div>
                                {reservation.status === "DA_CO_SACH" ? (
                                  <button
                                    className="button small"
                                    type="button"
                                    onClick={() =>
                                      handleConfirmReservation(reservation.id)
                                    }
                                  >
                                    Xác nhận
                                  </button>
                                ) : null}
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : null}

                      <div className="form-actions">
                        <button
                          className="ghost-button"
                          type="button"
                          onClick={() => goToStep(1)}
                        >
                          ← Quay lại
                        </button>
                        <button className="button secondary" type="submit">
                          + Thêm sách
                        </button>
                        <button
                          className="button"
                          type="button"
                          onClick={handleFinalizeTicket}
                          disabled={!currentTicketDetails.length}
                        >
                          Hoàn tất phiếu
                        </button>
                      </div>
                    </form>

                    <DataTable
                      rows={currentTicketDetails}
                      emptyText="Phiếu mượn này chưa có chi tiết nào."
                      columns={[
                        {
                          label: "Tên sách",
                          render: (item) => item.bookTitle || "Không rõ",
                        },
                        {
                          label: "Mã cuốn",
                          render: (item) => item.cuonSachBarcode || "-",
                        },
                        {
                          label: "Trạng thái",
                          render: (item) =>
                            item.returnDate ? "Đã trả" : "Đang mượn",
                        },
                      ]}
                    />
                  </>
                )}
              </section>
            ) : null}
          </>
        ) : null}

        {activeSection === "manage" ? (
          <>
            <section className="panel compact-panel">
              <div className="panel-header">
                <div>
                  <span className="eyebrow">Quản lí phiếu mượn</span>
                  <h3>Tra cứu và nhận trả sách</h3>
                  <p className="muted">
                    Danh sách phiếu chỉ hiển thị sau khi tìm kiếm.
                  </p>
                </div>
              </div>
              <StatusMessage status={returnStatus.status} />
              <StatusMessage status={searchStatus.status} />

              <form className="form-grid dense-form" onSubmit={handleSearchTickets}>
                <div className="field half">
                  <label>Tìm theo tên/email người mượn</label>
                  <input
                    type="text"
                    placeholder="Nhập tên hoặc email"
                    value={searchForm.nguoiMuonName}
                    onChange={(event) =>
                      setSearchForm((current) => ({
                        ...current,
                        nguoiMuonName: event.target.value,
                      }))
                    }
                  />
                </div>
                <div className="field half">
                  <label>Từ ngày</label>
                  <input
                    type="date"
                    value={searchForm.borrowDateFrom}
                    onChange={(event) =>
                      setSearchForm((current) => ({
                        ...current,
                        borrowDateFrom: event.target.value,
                      }))
                    }
                  />
                </div>
                <div className="field half">
                  <label>Đến ngày</label>
                  <input
                    type="date"
                    value={searchForm.borrowDateTo}
                    onChange={(event) =>
                      setSearchForm((current) => ({
                        ...current,
                        borrowDateTo: event.target.value,
                      }))
                    }
                  />
                </div>
                <div className="field half circulation-search-actions">
                  <button className="button secondary" type="submit">
                    Tìm kiếm
                  </button>
                </div>
              </form>
            </section>

            {hasSearchedTickets ? (
              <section className="panel compact-panel">
                <div className="panel-header">
                  <div>
                    <span className="eyebrow">Kết quả tìm kiếm</span>
                    <h3>Danh sách phiếu mượn</h3>
                  </div>
                  {managedTickets.length ? (
                    <span className="muted">
                      Trang {ticketPage}/{totalPages}
                    </span>
                  ) : null}
                </div>

                {!managedTickets.length ? (
                  <div className="empty">Không có phiếu mượn nào phù hợp.</div>
                ) : (
                  <>
                    <div className="tickets-list borrow-slip-list">
                      {pagedTickets.map((ticket) => {
                        const ticketDetails = details.filter(
                          (item) => item.phieuMuonId === ticket.id,
                        );
                        const allDetailsReturned =
                          ticketDetails.length > 0 &&
                          ticketDetails.every((detail) => detail.returnDate);
                        const returnedCount = ticketDetails.filter(
                          (detail) => detail.returnDate,
                        ).length;
                        const borrowingCount = ticketDetails.length - returnedCount;
                        const isOverdue =
                          ticket.dueDate && new Date(ticket.dueDate) < new Date();

                        return (
                          <button
                            key={ticket.id}
                            type="button"
                            className={`borrow-slip${selectedReturnTicket?.id === ticket.id ? " active" : ""}${isOverdue ? " overdue" : ""}`}
                            onClick={() => setSelectedReturnTicket(ticket)}
                          >
                            <div className="borrow-slip-top">
                              <div>
                                <span className="borrow-slip-kicker">
                                  Phiếu mượn thư viện
                                </span>
                                <h4>{ticket.fullName || "Độc giả"}</h4>
                                <p>{ticket.email || "Không có email"}</p>
                              </div>
                              <div className="borrow-slip-code">
                                <span>Mã phiếu</span>
                                <strong>{ticket.id}</strong>
                              </div>
                            </div>

                            <div className="borrow-slip-grid">
                              <div>
                                <span>Ngày mượn</span>
                                <strong>{ticket.borrowDate || "-"}</strong>
                              </div>
                              <div>
                                <span>Hạn trả</span>
                                <strong>{ticket.dueDate || "-"}</strong>
                              </div>
                              <div>
                                <span>Trạng thái</span>
                                <strong>
                                  {formatSlipStatus(ticket, ticketDetails)}
                                </strong>
                              </div>
                            </div>

                            <div className="borrow-slip-divider"></div>

                            <div className="borrow-slip-books">
                              {ticketDetails.slice(0, 3).map((detail) => (
                                <div
                                  key={detail.id}
                                  className="borrow-slip-book-row"
                                >
                                  <span>
                                    {detail.bookTitle || "Không rõ tên sách"}
                                  </span>
                                  <strong>{detail.cuonSachBarcode || "-"}</strong>
                                </div>
                              ))}
                              {ticketDetails.length > 3 ? (
                                <div className="borrow-slip-more">
                                  +{ticketDetails.length - 3} cuốn khác
                                </div>
                              ) : null}
                            </div>

                            <div className="borrow-slip-footer">
                              <div className="chip-row">
                                <span className="chip subtle">
                                  {ticketDetails.length} sách
                                </span>
                                {borrowingCount > 0 ? (
                                  <span className="chip warn">
                                    {borrowingCount} chưa trả
                                  </span>
                                ) : null}
                                {returnedCount > 0 ? (
                                  <span className="chip ok">
                                    {returnedCount} đã trả
                                  </span>
                                ) : null}
                              </div>
                              <span className="borrow-slip-hint">
                                {allDetailsReturned
                                  ? "Bấm để xem và xóa phiếu"
                                  : "Bấm để quản lí trả sách"}
                              </span>
                            </div>
                          </button>
                        );
                      })}
                    </div>

                    <div className="pagination-bar">
                      <button
                        className="ghost-button"
                        type="button"
                        onClick={() => setTicketPage((current) => current - 1)}
                        disabled={ticketPage === 1}
                      >
                        Trước
                      </button>
                      <button
                        className="ghost-button"
                        type="button"
                        onClick={() => setTicketPage((current) => current + 1)}
                        disabled={ticketPage === totalPages}
                      >
                        Sau
                      </button>
                    </div>
                  </>
                )}
              </section>
            ) : null}
          </>
        ) : null}

        {selectedReturnTicket ? (
          <div
            className="modal-backdrop"
            onClick={() => setSelectedReturnTicket(null)}
          >
            <div
              className="modal-card borrow-manage-modal"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="panel-header">
                <div>
                  <span className="eyebrow">Quản lí phiếu</span>
                  <h3>{selectedReturnTicket.fullName || selectedReturnTicket.email}</h3>
                  <p className="muted">Mã phiếu: {selectedReturnTicket.id}</p>
                </div>
                <button
                  className="ghost-button"
                  type="button"
                  onClick={() => setSelectedReturnTicket(null)}
                >
                  Đóng
                </button>
              </div>

              <div className="borrow-slip-grid borrow-manage-summary">
                <div>
                  <span>Ngày mượn</span>
                  <strong>{selectedReturnTicket.borrowDate || "-"}</strong>
                </div>
                <div>
                  <span>Hạn trả</span>
                  <strong>{selectedReturnTicket.dueDate || "-"}</strong>
                </div>
                <div>
                  <span>Trạng thái</span>
                  <strong>
                    {formatSlipStatus(
                      selectedReturnTicket,
                      selectedReturnTicketDetails,
                    )}
                  </strong>
                </div>
              </div>

              <DataTable
                rows={selectedReturnTicketDetails}
                emptyText="Phiếu này chưa có chi tiết nào."
                columns={[
                  {
                    label: "Tên sách",
                    render: (item) => item.bookTitle || "Không rõ",
                  },
                  {
                    label: "Trạng thái",
                    render: (item) => (item.returnDate ? "Đã trả" : "Đang mượn"),
                  },
                  {
                    label: "Ngày trả",
                    render: (item) => item.returnDate || "Chưa trả",
                  },
                  {
                    label: "Thao tác",
                    render: (item) =>
                      item.returnDate ? (
                        <span className="chip ok">Đã hoàn kho</span>
                      ) : (
                        <button
                          className="ghost-button"
                          type="button"
                          onClick={() => handleReturnDetail(item.id)}
                        >
                          Xác nhận đã trả
                        </button>
                      ),
                  },
                ]}
              />

              {selectedReturnTicketDetails.length > 0 &&
              selectedReturnTicketDetails.every((item) => item.returnDate) ? (
                <div className="modal-actions">
                  <button
                    type="button"
                    className="button danger"
                    onClick={() => handleDeleteTicket(selectedReturnTicket.id)}
                  >
                    Xóa phiếu
                  </button>
                </div>
              ) : null}
            </div>
          </div>
        ) : null}
      </div>
    </ProtectedPage>
  );
}
