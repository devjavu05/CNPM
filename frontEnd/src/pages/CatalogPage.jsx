import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import BookCard from "../components/BookCard";
import PageHero from "../components/PageHero";
import StatusMessage from "../components/StatusMessage";
import useStatus from "../hooks/useStatus";
import { libraryApi } from "../lib/api";
import { hasPermission } from "../lib/auth";
import { BOOK_CATEGORIES } from "../lib/categories";

export default function CatalogPage() {
  const navigate = useNavigate();
  const canCreateBook = hasPermission("CREATE_DAU_SACH");

  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("");
  const [barcode, setBarcode] = useState("");
  const [page, setPage] = useState(0);
  const [inventory, setInventory] = useState({ items: [], page: 0, totalPages: 0, totalItems: 0 });

  const inventoryStatus = useStatus();
  const barcodeStatus = useStatus();

  useEffect(() => {
    loadInventory(0, "");
  }, []);

  async function loadInventory(nextPage = page, nextQuery = query, nextCategory = category) {
    inventoryStatus.clearStatus();
    try {
      const result = await libraryApi.getInventory({ q: nextQuery, category: nextCategory, page: nextPage, size: 8 });
      setInventory(result);
      setPage(result.page || 0);
      if (!result.items?.length) {
        inventoryStatus.setError("Không tìm thấy đầu sách phù hợp với từ khóa hiện tại.");
      }
    } catch (error) {
      inventoryStatus.setError(error.message);
    }
  }

  async function handleBarcodeLookup(event) {
    event.preventDefault();
    barcodeStatus.clearStatus();
    try {
      const result = await libraryApi.staffLookupCopy(barcode.trim());
      if (!result?.bookId) {
        throw new Error("Không xác định được đầu sách từ mã vạch này.");
      }
      navigate(`/workspace/catalog/${result.bookId}`, { state: { barcodeResult: result } });
    } catch (error) {
      barcodeStatus.setError(error.message);
    }
  }

  function exportCsv() {
    const rows = inventory.items || [];
    const header = ["Tên sách", "Tác giả", "Tổng số lượng", "Sẵn sàng", "Đang mượn", "Báo mất", "Hỏng", "Vị trí kệ"];
    const lines = rows.map((item) => [
      item.title,
      item.author,
      item.totalCopies,
      item.availableCopies,
      item.borrowedCopies,
      item.lostCopies,
      item.damagedCopies,
      (item.shelfLocations || []).join(" | ")
    ]);
    const csv = [header, ...lines]
      .map((line) => line.map((value) => `"${String(value ?? "").replaceAll("\"", "\"\"")}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "bao-cao-kho-sach.csv";
    anchor.click();
    URL.revokeObjectURL(url);
  }

  return (
    <>
      <PageHero
        eyebrow="Kho sách"
        title="Quản lý kho sách"
        description="Tra cứu đầu sách như tủ sách của độc giả. Khi chọn một đầu sách hoặc quét mã vạch, thủ thư sẽ được đưa tới trang chi tiết đầu sách để thao tác."
        actions={
          <div className="topbar-actions">
            {canCreateBook ? (
              <button className="button" type="button" onClick={() => navigate("/workspace/catalog/new")}>
                Thêm đầu sách mới
              </button>
            ) : null}
            <button className="ghost-button" type="button" onClick={() => loadInventory(page, query)}>
              Làm mới
            </button>
            <button className="ghost-button" type="button" onClick={exportCsv}>
              Xuất CSV
            </button>
          </div>
        }
      />

      <section className="grid two">
        <section className="panel search-strip">
          <form
            className="library-search-form"
            onSubmit={(event) => {
              event.preventDefault();
              loadInventory(0, query);
            }}
          >
            <div className="search-main">
              <input
                className="search-input"
                placeholder="Tìm theo tên sách hoặc tác giả"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
              <select value={category} onChange={(event) => setCategory(event.target.value)}>
                <option value="">Tất cả thể loại</option>
                {BOOK_CATEGORIES.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
              <button className="button" type="submit">
                Tìm kiếm
              </button>
            </div>
          </form>
        </section>

        <section className="panel search-strip">
          <form className="library-search-form" onSubmit={handleBarcodeLookup}>
            <div className="search-main">
              <input
                className="search-input"
                placeholder="Quét hoặc nhập mã vạch để mở trang chi tiết đầu sách"
                value={barcode}
                onChange={(event) => setBarcode(event.target.value)}
              />
              <button className="button secondary" type="submit">
                Tra mã vạch
              </button>
            </div>
          </form>
          <StatusMessage status={barcodeStatus.status} />
        </section>
      </section>

      <StatusMessage status={inventoryStatus.status} />

      <section className="panel">
        <div className="panel-header">
          <div>
            <span className="eyebrow">Tủ sách quản lý</span>
            <h3>{inventory.totalItems || 0} đầu sách trong kho</h3>
          </div>
          <div className="chip-row">
            <span className="chip subtle">
              Trang {(inventory.page || 0) + 1}/{Math.max(inventory.totalPages || 1, 1)}
            </span>
          </div>
        </div>

        {!inventory.items?.length ? (
          <div className="empty">Chưa có đầu sách nào để hiển thị.</div>
        ) : (
          <div className="library-grid">
            {inventory.items.map((item) => (
              <BookCard
                key={item.id}
                book={{
                  ...item,
                  availableCount: item.availableCopies,
                  tinhTrang: item.availableCopies > 0 ? `Còn ${item.availableCopies} cuốn` : "Hết sách"
                }}
                selected={false}
                onSelect={() => navigate(`/workspace/catalog/${item.id}`)}
              />
            ))}
          </div>
        )}

        <div className="topbar-actions">
          <button
            className="ghost-button"
            type="button"
            disabled={(inventory.page || 0) <= 0}
            onClick={() => loadInventory((inventory.page || 0) - 1, query)}
          >
            Trang trước
          </button>
          <button
            className="ghost-button"
            type="button"
            disabled={(inventory.page || 0) + 1 >= (inventory.totalPages || 0)}
            onClick={() => loadInventory((inventory.page || 0) + 1, query)}
          >
            Trang sau
          </button>
        </div>
      </section>
    </>
  );
}
