export default function BookCard({ book, selected, onSelect }) {
  const availableCount = book.availableCount ?? book.quantity ?? 0;

  return (
    <button
      type="button"
      className={`book-tile${selected ? " active" : ""}`}
      onClick={() => onSelect(book)}
    >
      <div className="book-tile-cover">
        {book.coverImageUrl ? (
          <img className="book-cover" src={book.coverImageUrl} alt={`Bìa sách ${book.title}`} />
        ) : (
          <div className="book-cover book-cover-fallback">TV</div>
        )}
      </div>

      <div className="book-tile-body">
        <strong className="book-tile-title">{book.title}</strong>
        <span className="book-tile-author">{book.author || "Chưa cập nhật tác giả"}</span>
        <span className="book-tile-meta">
          {[book.category, book.publishYear].filter(Boolean).join(" • ") || "Kho sách thư viện"}
        </span>
        <div className="book-tile-footer">
          <span className={`inventory-pill ${availableCount > 0 ? "ok" : "warn"}`}>
            {book.tinhTrang || (availableCount > 0 ? `Còn ${availableCount} cuốn` : "Hết sách")}
          </span>
          {book.hasEBook ? <span className="chip subtle">Có E-Book</span> : null}
        </div>
      </div>
    </button>
  );
}
