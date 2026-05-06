import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import BookCard from "../components/BookCard";
import StatusMessage from "../components/StatusMessage";
import useStatus from "../hooks/useStatus";
import { libraryApi } from "../lib/api";
import { BOOK_CATEGORIES } from "../lib/categories";

export default function ReaderCatalogPage() {
  const navigate = useNavigate();
  const [filters, setFilters] = useState({
    q: "",
    author: "",
    category: "",
    publishYear: ""
  });
  const [books, setBooks] = useState([]);
  const status = useStatus();

  useEffect(() => {
    searchBooks();
  }, []);

  async function searchBooks(event) {
    if (event) event.preventDefault();
    status.clearStatus();
    try {
      const result = await libraryApi.searchBooks(filters);
      setBooks(result);
      if (!result.length) {
        status.setError("Không tìm thấy tài liệu phù hợp. Vui lòng kiểm tra lại từ khóa hoặc bộ lọc.");
      }
    } catch (error) {
      status.setError(error.message);
    }
  }

  return (
    <>
      <section className="panel simple-page-head">
        <div>
          <span className="eyebrow">Tủ sách thư viện</span>
          <h2>Tra cứu toàn bộ đầu sách theo phong cách gọn, dễ đọc</h2>
          <p>Nhập từ khóa để tìm nhanh. Bạn cũng có thể lọc theo tác giả, thể loại và năm xuất bản trước khi mở trang chi tiết sách.</p>
        </div>
      </section>

      <section className="panel search-strip">
        <form className="library-search-form" onSubmit={searchBooks}>
          <div className="search-main">
            <input
              className="search-input"
              placeholder="Nhập tên sách hoặc tác giả"
              value={filters.q}
              onChange={(event) => setFilters({ ...filters, q: event.target.value })}
            />
            <button className="button" type="submit">
              Tìm kiếm
            </button>
          </div>

          <div className="search-advanced">
            <input
              placeholder="Tác giả"
              value={filters.author}
              onChange={(event) => setFilters({ ...filters, author: event.target.value })}
            />
            <select
              value={filters.category}
              onChange={(event) => setFilters({ ...filters, category: event.target.value })}
            >
              <option value="">Tất cả thể loại</option>
              {BOOK_CATEGORIES.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
            <input
              type="number"
              placeholder="Năm xuất bản"
              value={filters.publishYear}
              onChange={(event) => setFilters({ ...filters, publishYear: event.target.value })}
            />
          </div>
        </form>
      </section>

      <StatusMessage status={status.status} />

      <section className="panel">
        <div className="panel-header">
          <div>
            <span className="eyebrow">Kết quả tra cứu</span>
            <h3>{books.length} đầu sách đang hiển thị</h3>
          </div>
        </div>

        <div className="library-grid">
          {books.map((book) => (
            <BookCard key={book.id} book={book} selected={false} onSelect={() => navigate(`/reader/books/${book.id}`)} />
          ))}
        </div>
      </section>
    </>
  );
}
