import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import DataTable from "../components/DataTable";
import StatusMessage from "../components/StatusMessage";
import useStatus from "../hooks/useStatus";
import { libraryApi } from "../lib/api";

function formatDate(value) {
  if (!value) return "Chưa có";
  return new Date(value).toLocaleDateString("vi-VN");
}

function buildBorrowColumns(onRenew) {
  return [
    { label: "Đầu sách", render: (row) => row.bookTitle || "Chưa rõ đầu sách" },
    { label: "Ngày mượn", render: (row) => formatDate(row.borrowDate) },
    { label: "Hạn trả", render: (row) => formatDate(row.dueDate) },
    { label: "Số lần gia hạn", render: (row) => `${row.renewalCount || 0}/2` },
    {
      label: "Trạng thái",
      render: (row) =>
        row.overdue ? (
          <span className="chip danger">Quá hạn</span>
        ) : (
          <span className="chip ok">Đang mượn</span>
        ),
    },
    {
      label: "Thao tác",
      render: (row) =>
        row.canRenew ? (
          <button
            className="ghost-button"
            type="button"
            onClick={() => onRenew(row.phieuMuonId)}
          >
            Gia hạn phiếu mượn
          </button>
        ) : (
          <span className="muted">{row.renewBlockedReason || "Không thể gia hạn"}</span>
        ),
    },
  ];
}

const returnedColumns = [
  { label: "Đầu sách", render: (row) => row.bookTitle || "Chưa rõ đầu sách" },
  { label: "Ngày mượn", render: (row) => formatDate(row.borrowDate) },
  { label: "Ngày trả", render: (row) => formatDate(row.returnDate) },
  { label: "Trạng thái", render: () => <span className="chip subtle">Đã trả</span> },
];

export default function BorrowHistoryPage() {
  const [history, setHistory] = useState({ dangMuon: [], daTra: [], phieuPhat: [] });
  const status = useStatus();

  async function loadHistory() {
    status.clearStatus();
    try {
      const result = await libraryApi.getMyBorrowHistory();
      setHistory({
        dangMuon: result.dangMuon || [],
        daTra: result.daTra || [],
        phieuPhat: result.phieuPhat || [],
      });
    } catch (error) {
      status.setError(error.message);
    }
  }

  useEffect(() => {
    let active = true;

    async function init() {
      if (!active) return;
      await loadHistory();
    }

    init();
    return () => {
      active = false;
    };
  }, []);

  async function handleRenew(ticketId) {
    status.clearStatus();
    try {
      await libraryApi.renewBorrowedBook(ticketId);
      status.setSuccess("Gia hạn phiếu mượn thành công. Hạn trả mới đã được cập nhật.");
      await loadHistory();
      window.dispatchEvent(new CustomEvent("notifications:updated"));
    } catch (error) {
      status.setError(error.message);
    }
  }

  async function handlePayFine(fineId) {
    status.clearStatus();
    try {
      await libraryApi.payFine(fineId);
      status.setSuccess("Thanh toán phiếu phạt thành công.");
      await loadHistory();
      window.dispatchEvent(new CustomEvent("notifications:updated"));
    } catch (error) {
      status.setError(error.message);
    }
  }

  const noHistory =
    !history.dangMuon.length && !history.daTra.length && !history.phieuPhat.length;
  const unpaidTotal = history.phieuPhat
    .filter((item) => !item.paid)
    .reduce((sum, item) => sum + Number(item.amount || 0), 0);

  return (
    <div className="page-container">
      <section className="page-hero">
        <div>
          <span className="eyebrow">Lịch sử cá nhân</span>
          <h1>Phiếu mượn, phiếu phạt và ví giả lập</h1>
          <p className="muted">
            Theo dõi mượn trả, nhập tay số dư để thanh toán phiếu phạt, và dùng số dư đó để mua E-Book.
          </p>
        </div>
      </section>

      <StatusMessage status={status.status} />

      {noHistory ? (
        <section className="panel">
          <div className="empty">
            <p>Bạn chưa có lịch sử mượn sách nào.</p>
            <Link className="button" to="/reader/books">
              Khám phá sách ngay
            </Link>
          </div>
        </section>
      ) : null}

      <section className="grid three">
        <article className="summary-card primary">
          <span className="eyebrow">Đang mượn</span>
          <h2>{history.dangMuon.length}</h2>
          <p className="muted">Số phiếu mượn đang còn hiệu lực của bạn.</p>
        </article>
        <article className="summary-card">
          <span className="eyebrow">Đã trả</span>
          <h2>{history.daTra.length}</h2>
          <p className="muted">Các phiếu mượn bạn đã hoàn tất trả sách.</p>
        </article>
        <article className="summary-card">
          <span className="eyebrow">Chưa thanh toán</span>
          <h2>{Number(unpaidTotal).toLocaleString("vi-VN")} đ</h2>
          <p className="muted">Tổng tiền phạt reader còn phải xử lý.</p>
        </article>
      </section>

      <section className="panel">
        <div className="panel-header">
          <div>
            <span className="eyebrow">Đang mượn</span>
            <h2>Các phiếu mượn của bạn</h2>
          </div>
        </div>
        <DataTable
          columns={buildBorrowColumns(handleRenew)}
          rows={history.dangMuon}
          emptyText="Bạn hiện không có phiếu mượn nào đang còn hiệu lực."
          rowClassName={(row) => (row.overdue ? "table-row-danger" : "")}
        />
      </section>

      <section className="panel">
        <div className="panel-header">
          <div>
            <span className="eyebrow">Đã trả</span>
            <h2>Lịch sử hoàn trả</h2>
          </div>
        </div>
        <DataTable
          columns={returnedColumns}
          rows={history.daTra}
          emptyText="Chưa có giao dịch trả sách nào."
        />
      </section>

      <section className="panel">
        <div className="panel-header">
          <div>
            <span className="eyebrow">Phiếu phạt</span>
            <h2>Các khoản cần lưu ý</h2>
          </div>
        </div>
        <DataTable
          rows={history.phieuPhat}
          emptyText="Bạn hiện không có khoản phạt nào."
          columns={[
            { label: "Phiếu mượn", render: (row) => row.phieuMuonId || "-" },
            { label: "Lý do", render: (row) => row.reason || "Chưa cập nhật" },
            {
              label: "Số tiền",
              render: (row) =>
                `${Number(row.amount || 0).toLocaleString("vi-VN")} đ`,
            },
            {
              label: "Thanh toán",
              render: (row) =>
                row.paid ? (
                  <span className="chip ok">Đã thanh toán</span>
                ) : (
                  <span className="chip danger">Chưa thanh toán</span>
                ),
            },
            {
              label: "Thao tác",
              render: (row) =>
                row.paid ? (
                  <span className="chip ok">Đã xử lý</span>
                ) : (
                  <button
                    className="button secondary"
                    type="button"
                    onClick={() => handlePayFine(row.id)}
                  >
                    Thanh toán
                  </button>
                ),
            },
          ]}
        />
      </section>
    </div>
  );
}
