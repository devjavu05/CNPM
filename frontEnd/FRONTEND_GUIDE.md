# Frontend - Hướng dẫn chuẩn hóa tiếng Việt

## 📋 Tổng quan

Giao diện frontend của Hệ Thống Quản Lý Thư Viện đã được hoàn toàn chuẩn hóa bằng **tiếng Việt 100%** với các dấu thanh chính xác và giao diện chuẩn mực.

## 🔧 Các thay đổi chính

### 1. Chuẩn hóa tiếng Việt trong tất cả trang

#### StaffCreateBookPage.jsx

- ✅ Sửa tất cả text tiếng Việt với dấu thanh đúng
- ✅ "Tao dau sach moi" → "Tạo đầu sách mới"
- ✅ "Tang luu tru" → "Tầng lưu trữ"
- ✅ "Tinh trang vat ly" → "Tình trạng vật lý"
- ✅ Thêm các thông báo chi tiết khi thao tác

#### StaffEditBookPage.jsx

- ✅ Chuẩn hóa tất cả các nhãn tiếng Việt
- ✅ "Cap nhat dau sach thanh cong" → "Cập nhật đầu sách thành công"
- ✅ Sửa chữ "Canh bao" → "Cảnh báo"
- ✅ Sửa chữ "Quan ly kho sach" → "Quản lý kho sách"

#### LoginPage.jsx

- ✅ Thay "LoginForm" → "Biểu mẫu"
- ✅ Đảm bảo tất cả text là tiếng Việt

#### CatalogPage.jsx

- ✅ Thêm icon emoji cho các nút hành động
- ✅ "Thêm đầu sách mới" → "➕ Thêm đầu sách mới"

### 2. Tạo trang mới: AddNewBookPage.jsx

Một trang **hoàn toàn mới** với các tính năng nâng cao:

#### ✨ Tính năng chính

- **Validation form chi tiết**
  - Kiểm tra trường bắt buộc
  - Kiểm tra độ dài tên sách
  - Kiểm tra định dạng ISBN
  - Kiểm tra giá trị năm xuất bản
  - Kiểm tra giá E-Book không âm

- **Giao diện cải thiện**
  - Chia thành 4 nhóm fieldset rõ ràng
  - Thông tin cơ bản
  - Thông tin vật lý
  - Thông tin mô tả
  - Thông tin E-Book

- **Kiểm tra hình ảnh**
  - Kiểm tra loại tệp (chỉ hình ảnh)
  - Kiểm tra kích thước (max 5MB)
  - Preview ảnh bìa

- **Thêm các trường mới**
  - ISBN: Định dạng số định danh sách
  - Nhà xuất bản: Thông tin nhà xuất bản
  - Ngôn ngữ: Chọn ngôn ngữ sách
  - Các từ khóa/Thẻ: Danh sách từ khóa

#### 📊 Các trường trong form

```
Thông tin cơ bản:
  - Tên sách (bắt buộc) *
  - Tác giả (bắt buộc) *
  - Thể loại (bắt buộc) *
  - ISBN (tuỳ chọn)
  - Nhà xuất bản (tuỳ chọn)
  - Năm xuất bản (tuỳ chọn)
  - Ngôn ngữ (tuỳ chọn)

Thông tin vật lý:
  - Số bản sao ban đầu *
  - Tình trạng vật lý mặc định
  - Tầng lưu trữ
  - Kệ theo thể loại (tự động)
  - Vị trí đầu sách (tự động)

Thông tin mô tả:
  - Mô tả ngắn
  - Giới thiệu chi tiết
  - Các từ khóa/Thẻ

Thông tin E-Book:
  - Link trang tải
  - Giá E-Book
```

### 3. Cập nhật Routing

#### App.jsx

```javascript
// Cũ
<Route path="catalog/new" element={<StaffCreateBookPage />} />

// Mới
<Route path="catalog/new" element={<AddNewBookPage />} />
```

## 🎨 Tiêu chuẩn thiết kế

### Tiêu chuẩn tiếng Việt

- ✅ Tất cả nhãn và thông báo là tiếng Việt
- ✅ Sử dụng dấu thanh chính xác
- ✅ Sử dụng thuật ngữ thư viện chuẩn
- ✅ Thông báo lỗi rõ ràng và hữu ích

### Tiêu chuẩn giao diện

- ✅ Form được tổ chức thành các nhóm (fieldset)
- ✅ Trường bắt buộc được đánh dấu (\*)
- ✅ Thông báo lỗi hiển thị dưới trường
- ✅ Icon emoji cho các nút hành động
- ✅ Xác nhận thành công có icon ✓

## 📝 Cách sử dụng

### Thêm sách mới (AddNewBookPage)

1. Nhấp "➕ Thêm đầu sách mới" trong trang Kho sách
2. Điền đầy đủ thông tin (trường có \* là bắt buộc)
3. Chọn ảnh bìa (PNG, JPG, WebP, max 5MB)
4. Nhấp "💾 Lưu đầu sách"
5. Hệ thống sẽ kiểm tra và lưu, sau đó chuyển đến trang chi tiết

### Chỉnh sửa sách

1. Chọn sách từ danh sách
2. Nhấp nút "Chỉnh sửa"
3. Cập nhật thông tin
4. Nhấp "Cập nhật"

## 🔍 Validation Rules (Quy tắc kiểm tra)

```
Tên sách:
  - Min: 1 ký tự
  - Max: 255 ký tự
  - Bắt buộc

Tác giả:
  - Min: 1 ký tự
  - Bắt buộc

Thể loại:
  - Bắt buộc (chọn từ danh sách)

ISBN:
  - Định dạng: 10 hoặc 13 chữ số
  - Ký tự hyphens được bỏ qua
  - Tuỳ chọn

Năm xuất bản:
  - Min: 1000
  - Max: Năm hiện tại + 1
  - Tuỳ chọn

Số bản sao:
  - Min: 1
  - Max: 999
  - Bắt buộc

Giá E-Book:
  - Min: 0
  - Không âm
  - Tuỳ chọn

Ảnh bìa:
  - Loại: PNG, JPG, WebP
  - Max: 5MB
  - Tuỳ chọn
```

## 🛠️ Thành phần được sử dụng

### Pages

- `AddNewBookPage.jsx` - Trang thêm sách mới với validation đầy đủ
- `StaffCreateBookPage.jsx` - Trang tạo sách (chuẩn hóa, bìn phục)
- `StaffEditBookPage.jsx` - Trang chỉnh sửa sách (chuẩn hóa)
- `CatalogPage.jsx` - Trang kho sách (cập nhật icon)
- `LoginPage.jsx` - Trang đăng nhập (chuẩn hóa label)

### Components

- `PageHero` - Header trang
- `StatusMessage` - Hiển thị thông báo
- `BookCard` - Thẻ sách

### Utilities

- `libraryApi` - Gọi API backend
- `hasPermission` - Kiểm tra quyền
- `BOOK_CATEGORIES` - Danh sách thể loại
- `getBookLocation`, `getShelfCode` - Tính vị trí kệ
- `LIBRARY_FLOORS` - Danh sách tầng

## 📦 Deployment

Frontend đã sẵn sàng để:

1. **Development**: `npm run dev` (port 5173)
2. **Build**: `npm run build`
3. **Docker**: Sử dụng `frontEnd/Dockerfile`

## ✅ Kiểm tra

Tất cả các trang đã được kiểm tra:

- ✅ Thêm sách mới
- ✅ Chỉnh sửa sách
- ✅ Xóa sách
- ✅ Danh sách sách
- ✅ Validation form
- ✅ Thông báo lỗi
- ✅ Tất cả text tiếng Việt

---

**Last Updated**: May 6, 2026
