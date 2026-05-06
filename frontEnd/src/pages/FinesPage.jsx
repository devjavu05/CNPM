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

function formatSlipStatus(ticket) {
  const isOverdue = ticket.dueDate && new Date(ticket.dueDate) < new Date();
  return isOverdue ? "Có dấu hiệu quá hạn" : "Có thể lập phiếu phạt";
}

export default function FinesPage() {
  const [allTickets, setAllTickets] = useState([]);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [fines, setFines] = useState([]);
  const [ticketDetails, setTicketDetails] = useState([]);
  const [searchForm, setSearchForm] = useState({ keyword: "" });
  const [fineForm, setFineForm] = useState({
    amount: "",
    reason: "",
  });
  const [hasSearchedTickets, setHasSearchedTickets] = useState(false);
  const [ticketPage, setTicketPage] = useState(1);

  const fineStatus = useStatus();
  const searchStatus = useStatus();
  const listStatus = useStatus();

  useEffect(() => {
    loadFines().catch(() => {});
    loadTicketDetails().catch(() => {});
  }, []);

  const filteredTickets = useMemo(() => {
    const keyword = normalize(searchForm.keyword).trim();
    const eligibleTickets = (allTickets || []).filter((ticket) => {
      const details = ticketDetails.filter((detail) => detail.phieuMuonId === ticket.id);
      return details.length > 0 && details.some((detail) => !detail.returnDate);
    });
    if (!keyword) return eligibleTickets;

    return eligibleTickets.filter((ticket) => {
      const fullName = normalize(ticket.fullName || "");
      const email = normalize(ticket.email || "");
      const ticketId = normalize(String(ticket.id || ""));
      return (
        fullName.includes(keyword) ||
        email.includes(keyword) ||
        ticketId.includes(keyword)
      );
    });
  }, [allTickets, searchForm.keyword]);

  const totalPages = Math.max(1, Math.ceil(filteredTickets.length / PAGE_SIZE));
  const pagedTickets = useMemo(() => {
    const start = (ticketPage - 1) * PAGE_SIZE;
    return filteredTickets.slice(start, start + PAGE_SIZE);
  }, [filteredTickets, ticketPage]);

  async function loadTickets() {
    const result = await libraryApi.getTickets();
    return (result || []).filter((ticket) => !ticket.editable);
  }

  async function loadFines() {
    try {
      const result = await libraryApi.getFines();
      setFines(result || []);
    } catch (error) {
      listStatus.setError(error.message);
    }
  }

  async function loadTicketDetails() {
    try {
      const result = await libraryApi.getTicketDetails();
      setTicketDetails(result || []);
    } catch {
      setTicketDetails([]);
    }
  }

  async function handleSearchTickets(event) {
    event.preventDefault();
    searchStatus.clearStatus();
    try {
      const tickets = await loadTickets();
      setAllTickets(tickets);
      setSelectedTicket(null);
      setTicketPage(1);
      setHasSearchedTickets(true);
      searchStatus.setSuccess("Tìm kiếm thành công.");
    } catch (error) {
      searchStatus.setError(error.message);
    }
  }

  async function handleCreateFine(event) {
    event.preventDefault();
    if (!selectedTicket) return;
    fineStatus.clearStatus();
    try {
      await libraryApi.createFine({
        amount: Number(fineForm.amount),
        reason: fineForm.reason,
        phieuMuonId: selectedTicket.id,
      });
      fineStatus.setSuccess("Đã lập phiếu phạt cho phiếu mượn này.");
      setFineForm({ amount: "", reason: "" });
      setSelectedTicket(null);
      await loadFines();
      await loadTicketDetails();
      if (hasSearchedTickets) {
        const tickets = await loadTickets();
        setAllTickets(tickets);
      }
    } catch (error) {
      fineStatus.setError(error.message);
    }
  }

  function startNewWorkflow() {
    setSelectedTicket(null);
    setSearchForm({ keyword: "" });
    setFineForm({ amount: "", reason: "" });
    setHasSearchedTickets(false);
    setTicketPage(1);
    fineStatus.clearStatus();
    searchStatus.clearStatus();
  }

  return (
    <ProtectedPage permission="GET_PHIEU_PHAT">
      <div className="page-container circulation-shell">
        <PageHero
          eyebrow="Phiếu phạt"
          title="Lập và quản lí phiếu phạt"
          description="Tách phần tìm phiếu mượn để lập phạt ra riêng. Kết quả chỉ hiện sau khi tìm kiếm và thao tác lập phiếu phạt được mở trong thẻ nổi."
          actions={
            <div className="topbar-actions">
              <button
                className="ghost-button"
                type="button"
                onClick={startNewWorkflow}
              >
                Phiếu phạt mới
              </button>
            </div>
          }
        />

        <section className="panel compact-panel">
          <div className="panel-header">
            <div>
              <span className="eyebrow">Tìm phiếu mượn</span>
              <h3>Tra cứu phiếu để lập phạt</h3>
              <p className="muted">
                Danh sách phiếu chỉ hiển thị sau khi tìm kiếm.
              </p>
            </div>
          </div>
          <StatusMessage status={searchStatus.status} />
          <form className="form-grid dense-form" onSubmit={handleSearchTickets}>
            <div className="field full">
              <label>Tìm theo tên, email hoặc mã phiếu mượn</label>
              <input
                type="text"
                placeholder="Nhập tên độc giả, email hoặc ID phiếu mượn"
                value={searchForm.keyword}
                onChange={(event) =>
                  setSearchForm({ keyword: event.target.value })
                }
              />
            </div>
            <div className="form-actions">
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
                <h3>Phiếu mượn có thể lập phạt</h3>
              </div>
              {filteredTickets.length ? (
                <span className="muted">
                  Trang {ticketPage}/{totalPages}
                </span>
              ) : null}
            </div>

            {!filteredTickets.length ? (
              <div className="empty">Không tìm thấy phiếu mượn nào phù hợp.</div>
            ) : (
              <>
                <div className="tickets-list borrow-slip-list">
                  {pagedTickets.map((ticket) => (
                    <button
                      key={ticket.id}
                      type="button"
                      className="borrow-slip"
                      onClick={() => setSelectedTicket(ticket)}
                    >
                      <div className="borrow-slip-top">
                        <div>
                          <span className="borrow-slip-kicker">
                            Phiếu mượn liên quan
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
                          <strong>{formatSlipStatus(ticket)}</strong>
                        </div>
                      </div>

                      <div className="borrow-slip-footer">
                        <div className="chip-row">
                          <span className="chip warn">Lập phiếu phạt</span>
                        </div>
                        <span className="borrow-slip-hint">
                          Bấm để mở thẻ lập phiếu phạt
                        </span>
                      </div>
                    </button>
                  ))}
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

        <section className="panel">
          <div className="panel-header">
            <div>
              <span className="eyebrow">Lịch sử</span>
              <h3>Phiếu phạt đã ghi nhận</h3>
            </div>
          </div>
          <StatusMessage status={listStatus.status} />
          <DataTable
            rows={fines}
            emptyText="Chưa có phiếu phạt nào."
            columns={[
              {
                label: "Phiếu mượn",
                render: (item) => `#${item.phieuMuonId || "-"}`,
              },
              {
                label: "Số tiền",
                render: (item) =>
                  `${Number(item.amount || 0).toLocaleString("vi-VN")} VNĐ`,
              },
              {
                label: "Thanh toán",
                render: (item) =>
                  item.paid ? "Đã thanh toán" : "Chưa thanh toán",
              },
              { label: "Lý do", render: (item) => item.reason || "-" },
            ]}
          />
        </section>

        {selectedTicket ? (
          <div className="modal-backdrop" onClick={() => setSelectedTicket(null)}>
            <div
              className="modal-card borrow-manage-modal"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="panel-header">
                <div>
                  <span className="eyebrow">Lập phiếu phạt</span>
                  <h3>{selectedTicket.fullName || selectedTicket.email}</h3>
                  <p className="muted">Phiếu mượn #{selectedTicket.id}</p>
                </div>
                <button
                  className="ghost-button"
                  type="button"
                  onClick={() => setSelectedTicket(null)}
                >
                  Đóng
                </button>
              </div>

              <div className="borrow-slip-grid borrow-manage-summary">
                <div>
                  <span>Ngày mượn</span>
                  <strong>{selectedTicket.borrowDate || "-"}</strong>
                </div>
                <div>
                  <span>Hạn trả</span>
                  <strong>{selectedTicket.dueDate || "-"}</strong>
                </div>
                <div>
                  <span>Trạng thái</span>
                  <strong>{formatSlipStatus(selectedTicket)}</strong>
                </div>
              </div>

              <StatusMessage status={fineStatus.status} />
              <form className="form-grid" onSubmit={handleCreateFine}>
                <div className="field">
                  <label>Số tiền phạt</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={fineForm.amount}
                    onChange={(event) =>
                      setFineForm({ ...fineForm, amount: event.target.value })
                    }
                    required
                  />
                </div>
                <div className="field">
                  <label>Trạng thái thanh toán</label>
                  <input value="Chưa thanh toán" readOnly />
                </div>
                <div className="field full">
                  <label>Lý do phạt</label>
                  <textarea
                    value={fineForm.reason}
                    onChange={(event) =>
                      setFineForm({ ...fineForm, reason: event.target.value })
                    }
                    required
                  />
                </div>
                <div className="modal-actions">
                  <button className="button danger" type="submit">
                    Lập phiếu phạt
                  </button>
                </div>
              </form>
            </div>
          </div>
        ) : null}
      </div>
    </ProtectedPage>
  );
}
