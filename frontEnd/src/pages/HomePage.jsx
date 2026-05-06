import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import BookCard from "../components/BookCard";
import StatusMessage from "../components/StatusMessage";
import useStatus from "../hooks/useStatus";
import { libraryApi } from "../lib/api";
import { BOOK_CATEGORIES } from "../lib/categories";

export default function HomePage() {
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
    handleSearch();
  }, []);

  async function handleSearch(event) {
    if (event) event.preventDefault();
    status.clearStatus();
    try {
      const result = await libraryApi.searchBooks(filters);
      setBooks(result);
      if (!result.length) {
        status.setError("Không tìm thấy tài liệu phù hợp. Vui lòng kiểm tra lại từ khóa hoặc thử bộ lọc khác.");
      }
    } catch (error) {
      status.setError(error.message);
    }
  }

  return (
    <>
      <section className="site-hero">
        <div className="site-hero-copy">
          <span className="eyebrow">Thư viện trực tuyến</span>
          <h2>Kho sách điện tử và đầu sách thư viện được trình bày rõ ràng, dễ tra cứu</h2>
          <p>Tìm theo tên sách, tác giả hoặc thể loại. Xem nhanh tình trạng còn sách, E-Book và đi thẳng tới trang chi tiết của từng đầu sách.</p>
          <div className="hero-actions">
            <Link className="button" to="/register">
              Đăng ký độc giả
            </Link>
            <Link className="ghost-button" to="/login">
              Đăng nhập
            </Link>
          </div>
        </div>

        <div className="hero-highlight">
          <span className="eyebrow">Tìm kiếm nhanh</span>
          <p>Tra cứu tên sách, tác giả và năm xuất bản ngay trên trang chủ.</p>
          <div className="hero-stat-grid">
            <div className="summary-card">
              <strong>Đầu sách</strong>
              <span>Hiển thị theo lưới bìa sách rõ ràng</span>
            </div>
            <div className="summary-card">
              <strong>E-Book</strong>
              <span>Tách rõ sách số và sách vật lý</span>
            </div>
          </div>
        </div>
      </section>

      <section className="panel search-strip">
        <form className="library-search-form" onSubmit={handleSearch}>
          <div className="search-main">
            <input
              className="search-input"
              placeholder="Tìm theo tên sách hoặc tác giả"
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

      <section className="panel category-panel">
        <div className="panel-header">
          <div>
            <span className="eyebrow">Thể loại nổi bật</span>
            <h3>Duyệt nhanh theo nhóm sách</h3>
          </div>
        </div>
        <div className="category-strip">
          {BOOK_CATEGORIES.map((category) => (
            <button
              key={category}
              type="button"
              className="category-chip"
              onClick={() => {
                const nextFilters = { ...filters, category, q: "" };
                setFilters(nextFilters);
                libraryApi
                  .searchBooks(nextFilters)
                  .then((result) => {
                    status.clearStatus();
                    setBooks(result);
                  })
                  .catch((error) => status.setError(error.message));
              }}
            >
              {category}
            </button>
          ))}
        </div>
      </section>

      <StatusMessage status={status.status} />

      <section className="panel">
        <div className="panel-header">
          <div>
            <span className="eyebrow">Tài liệu</span>
            <h3>Danh sách sách đang hiển thị</h3>
          </div>
        </div>

        <div className="library-grid">
          {books.map((book) => (
            <BookCard key={book.id} book={book} selected={false} onSelect={() => navigate(`/search/${book.id}`)} />
          ))}
        </div>
      </section>
    </>
  );
}
